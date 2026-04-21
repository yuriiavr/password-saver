const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let dataFilePath = '';

const AES_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;

function deriveKeyFromPassword(masterPassword, salt) {
  return crypto.pbkdf2Sync(masterPassword, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

function encryptData(masterKey, plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: ciphertext.toString('hex')
  };
}

function decryptData(masterKey, encObj) {
  const iv = Buffer.from(encObj.iv, 'hex');
  const tag = Buffer.from(encObj.tag, 'hex');
  const ciphertext = Buffer.from(encObj.data, 'hex');
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Відкрити',
      click: () => showMainWindow()
    },
    { type: 'separator' },
    {
      label: 'Вийти',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Password Manager  •  F9 — швидкий доступ');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showMainWindow();
    }
  });
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
}

// ─── Overlay ───────────────────────────────────────────────────────────────────

function createOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.focus();
    return;
  }

  overlayWindow = new BrowserWindow({
    width: 480,
    height: 420,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
    overlayWindow.focus();
    if (mainWindow) {
      mainWindow.webContents.send('get-passwords-for-overlay');
    }
  });

  overlayWindow.on('blur', () => {
    if (overlayWindow) overlayWindow.close();
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

ipcMain.on('passwords-for-overlay', (event, passwords) => {
  if (overlayWindow) {
    overlayWindow.webContents.send('overlay-data', passwords);
  }
});

ipcMain.on('close-overlay', () => {
  if (overlayWindow) overlayWindow.close();
});

ipcMain.handle('pick-file-location', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Оберіть місце для збереження файлу паролів',
    defaultPath: path.join(app.getPath('documents'), 'passwords.json'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled) return null;
  dataFilePath = result.filePath;
  return dataFilePath;
});

ipcMain.handle('pick-existing-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Оберіть файл з паролями',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  dataFilePath = result.filePaths[0];
  return dataFilePath;
});

ipcMain.handle('set-file-path', async (event, filePath) => {
  dataFilePath = filePath;
  return true;
});

ipcMain.handle('register-hotkey', (event, hotkey) => {
  globalShortcut.unregisterAll();
  globalShortcut.register(hotkey, () => {
    createOverlayWindow();
  });
  globalShortcut.register('F9', () => createOverlayWindow());
  return true;
});

ipcMain.handle('save-encrypted-data', async (event, { masterPassword, data }) => {
  if (!dataFilePath) throw new Error("Шлях до файлу не встановлено.");

  let salt;
  if (fs.existsSync(dataFilePath)) {
    try {
      const existingContent = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(existingContent);
      if (parsed.salt) salt = Buffer.from(parsed.salt, 'hex');
    } catch (e) {
      salt = crypto.randomBytes(SALT_LENGTH);
    }
  } else {
    salt = crypto.randomBytes(SALT_LENGTH);
  }

  const masterKey = deriveKeyFromPassword(masterPassword, salt);
  const encrypted = encryptData(masterKey, JSON.stringify(data));

  fs.writeFileSync(dataFilePath, JSON.stringify({
    salt: salt.toString('hex'),
    iv: encrypted.iv,
    tag: encrypted.tag,
    data: encrypted.data
  }, null, 2));
  return true;
});

ipcMain.handle('load-encrypted-data', async (event, masterPassword) => {
  if (!dataFilePath || !fs.existsSync(dataFilePath)) return [];
  try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    const encObj = JSON.parse(fileContent);
    const salt = Buffer.from(encObj.salt, 'hex');
    const masterKey = deriveKeyFromPassword(masterPassword, salt);
    const decryptedText = decryptData(masterKey, encObj);
    return JSON.parse(decryptedText);
  } catch (err) {
    throw new Error("WRONG_PASSWORD_OR_CORRUPTED_DATA");
  }
});

ipcMain.on('minimize-window', () => mainWindow && mainWindow.minimize());
ipcMain.on('maximize-window', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenu(null);

  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register('F9', () => {
    createOverlayWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Живемо в треї — не виходимо при закритті вікон
app.on('window-all-closed', () => {});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});