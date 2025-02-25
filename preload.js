const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFileLocation: () => ipcRenderer.invoke('pick-file-location'),
  saveEncryptedData: (masterPassword, data) =>
    ipcRenderer.invoke('save-encrypted-data', { masterPassword, data }),
  loadEncryptedData: (masterPassword) =>
    ipcRenderer.invoke('load-encrypted-data', masterPassword),
  setFilePath: (filePath) => ipcRenderer.invoke('set-file-path', filePath)
});
