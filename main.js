// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
let dataFilePath = '';

const AES_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;         // 16 байт для salt
const IV_LENGTH = 12;           // 12 байт для GCM IV
const TAG_LENGTH = 16;          // 16 байт (128 біт) для аутентифікаційного тегу
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;          // 32 байти = 256 біт

// Функція для генерації секретного ключа з майстер-пароля та salt за допомогою PBKDF2
function deriveKeyFromPassword(masterPassword, salt) {
  return crypto.pbkdf2Sync(masterPassword, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

// Функція для шифрування рядка (plaintext)
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

// Функція для дешифрування даних
function decryptData(masterKey, encObj) {
  const iv = Buffer.from(encObj.iv, 'hex');
  const tag = Buffer.from(encObj.tag, 'hex');
  const ciphertext = Buffer.from(encObj.data, 'hex');
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/* ---------------------------
   IPC обробники
--------------------------- */

// Обробник для вибору місця збереження файлу (через діалог)
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

ipcMain.handle('set-file-path', async (event, filePath) => {
    dataFilePath = filePath;
    console.log("Data file path встановлено:", dataFilePath);
    return true;
  });
  

// Обробник збереження зашифрованих даних
ipcMain.handle('save-encrypted-data', async (event, { masterPassword, data }) => {
  if (!dataFilePath) {
    throw new Error("Шлях до файлу не встановлено. Спочатку оберіть місце збереження.");
  }

  let salt;
  // Якщо файл вже існує, намагаємося прочитати salt із нього
  if (fs.existsSync(dataFilePath)) {
    try {
      const existingContent = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(existingContent);
      if (parsed.salt) {
        salt = Buffer.from(parsed.salt, 'hex');
      }
    } catch (e) {
      // Якщо не вдалось прочитати файл, генеруємо нову сіль
      salt = crypto.randomBytes(SALT_LENGTH);
    }
  } else {
    // Якщо файла немає, генеруємо нову сіль
    salt = crypto.randomBytes(SALT_LENGTH);
  }

  const masterKey = deriveKeyFromPassword(masterPassword, salt);
  const plaintext = JSON.stringify(data);
  const encrypted = encryptData(masterKey, plaintext);

  // Формуємо об'єкт, який буде збережено: зберігаємо salt, iv, tag та зашифровані дані
  const toStore = {
    salt: salt.toString('hex'),
    iv: encrypted.iv,
    tag: encrypted.tag,
    data: encrypted.data
  };

  fs.writeFileSync(dataFilePath, JSON.stringify(toStore, null, 2));
  return true;
});

// Обробник завантаження зашифрованих даних
ipcMain.handle('load-encrypted-data', async (event, masterPassword) => {
  if (!dataFilePath || !fs.existsSync(dataFilePath)) {
    // Якщо файлу немає, повертаємо порожній об'єкт або масив (залежно від потреб)
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
    console.error("Помилка при завантаженні/дешифруванні даних:", err);
    throw new Error("WRONG_PASSWORD_OR_CORRUPTED_DATA");
  }
});

/* ---------------------------
   Створення головного вікна
--------------------------- */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,    // Вимикаємо прямий доступ до Node.js у рендері
      contextIsolation: true       // Вмикаємо ізоляцію контексту для безпеки
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/* ---------------------------
   Події додатку
--------------------------- */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // На macOS додаток зазвичай лишається активним, доки користувач явно його не закриє
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // На macOS створюємо нове вікно, якщо попереднє було закрито
  if (mainWindow === null) {
    createWindow();
  }
});
