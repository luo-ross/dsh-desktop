const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('dshDesktop', Object.freeze({
  platform: process.platform,
  versions: Object.freeze({
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
}))
