const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dshDesktop', Object.freeze({
  platform: process.platform,
  versions: Object.freeze({
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
  pickDirectory: () => ipcRenderer.invoke('dsh-desktop:pick-directory'),
  openPath: (path) => ipcRenderer.invoke('dsh-desktop:open-path', path),
  getUpdateState: () => ipcRenderer.invoke('dsh-desktop:get-update-state'),
  checkForUpdates: () => ipcRenderer.invoke('dsh-desktop:check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('dsh-desktop:install-update'),
  windowControl: action => ipcRenderer.invoke('dsh-desktop:window-control', action),
  onWindowState: (listener) => {
    if (typeof listener !== 'function') throw new TypeError('window state listener must be a function')
    const wrapped = (_event, state) => listener(state)
    ipcRenderer.on('dsh-desktop:window-state', wrapped)
    return () => ipcRenderer.removeListener('dsh-desktop:window-state', wrapped)
  },
  onUpdateState: (listener) => {
    if (typeof listener !== 'function') throw new TypeError('update listener must be a function')
    const wrapped = (_event, state) => listener(state)
    ipcRenderer.on('dsh-desktop:update-state', wrapped)
    return () => ipcRenderer.removeListener('dsh-desktop:update-state', wrapped)
  },
}))
