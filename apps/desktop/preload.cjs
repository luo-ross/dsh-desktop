const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dshDesktop', Object.freeze({
  platform: process.platform,
  versions: Object.freeze({
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
  pickDirectory: () => ipcRenderer.invoke('dsh-desktop:pick-directory'),
  getUpdateState: () => ipcRenderer.invoke('dsh-desktop:get-update-state'),
  checkForUpdates: () => ipcRenderer.invoke('dsh-desktop:check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('dsh-desktop:install-update'),
  onUpdateState: (listener) => {
    if (typeof listener !== 'function') throw new TypeError('update listener must be a function')
    const wrapped = (_event, state) => listener(state)
    ipcRenderer.on('dsh-desktop:update-state', wrapped)
    return () => ipcRenderer.removeListener('dsh-desktop:update-state', wrapped)
  },
}))
