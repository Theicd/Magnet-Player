const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('magnetPlayer', {
  addMagnet: magnet => ipcRenderer.send('add-magnet', magnet),
  onReady: cb => ipcRenderer.on('player-ready', (_e, data) => cb(data)),
  onError: cb => ipcRenderer.on('player-error', (_e, msg) => cb(msg)),
  onPort: cb => ipcRenderer.on('server-port', (_e, port) => cb(port))
})
