const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayApi', {
  onData: (callback) => {
    ipcRenderer.on('overlay-data', (event, data) => callback(data));
  },
  close: () => ipcRenderer.send('close-overlay'),
});