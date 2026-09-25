const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companion', {
  onNudge: (callback) => ipcRenderer.on('nudge', (_e, data) => callback(data)),
  onMood: (callback) => ipcRenderer.on('mood', (_e, data) => callback(data)),
  respond: (action) => ipcRenderer.send('nudgeResponse', action),
});
