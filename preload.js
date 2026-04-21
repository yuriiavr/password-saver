const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFileLocation: () => ipcRenderer.invoke('pick-file-location'),
  pickExistingFile: () => ipcRenderer.invoke('pick-existing-file'),
  saveEncryptedData: (masterPassword, data) =>
    ipcRenderer.invoke('save-encrypted-data', { masterPassword, data }),
  loadEncryptedData: (masterPassword) =>
    ipcRenderer.invoke('load-encrypted-data', masterPassword),
  setFilePath: (filePath) => ipcRenderer.invoke('set-file-path', filePath),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  registerHotkey: (hotkey) => ipcRenderer.invoke('register-hotkey', hotkey),

  onGetPasswordsForOverlay: (callback) => {
    ipcRenderer.on('get-passwords-for-overlay', () => callback());
  },
  sendPasswordsForOverlay: (passwords) => {
    ipcRenderer.send('passwords-for-overlay', passwords);
  },
});