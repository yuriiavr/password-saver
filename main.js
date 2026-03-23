const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
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

ipcMain.handle('pick-file-location', async (event) => {
  const result = await dialog.showSaveDialog({
    title: 'Оберіть місце для збереження файлу паролів',
    defaultPath: path.join(app.getPath('documents'), 'passwords.json'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled) {
    return null;
  }
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

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  dataFilePath = result.filePaths[0];
  return dataFilePath;
});

ipcMain.handle('set-file-path', async (event, filePath) => {
  dataFilePath = filePath;
  return true;
});

ipcMain.handle('save-encrypted-data', async (event, { masterPassword, data }) => {
  if (!dataFilePath) {
    throw new Error("Шлях до файлу не встановлено.");
  }

  let salt;
  if (fs.existsSync(dataFilePath)) {
    try {
      const existingContent = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(existingContent);
      if (parsed.salt) {
        salt = Buffer.from(parsed.salt, 'hex');
      }
    } catch (e) {
      salt = crypto.randomBytes(SALT_LENGTH);
    }
  } else {
    salt = crypto.randomBytes(SALT_LENGTH);
  }

  const masterKey = deriveKeyFromPassword(masterPassword, salt);
  const plaintext = JSON.stringify(data);
  const encrypted = encryptData(masterKey, plaintext);

  const toStore = {
    salt: salt.toString('hex'),
    iv: encrypted.iv,
    tag: encrypted.tag,
    data: encrypted.data
  };

  fs.writeFileSync(dataFilePath, JSON.stringify(toStore, null, 2));
  return true;
});

ipcMain.handle('load-encrypted-data', async (event, masterPassword) => {
  if (!dataFilePath || !fs.existsSync(dataFilePath)) {
    return [];
  }

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

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});