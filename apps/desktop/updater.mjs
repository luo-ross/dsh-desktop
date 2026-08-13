const DEFAULT_CHECK_DELAY_MS = 12_000
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1_000

const UPDATE_ERROR_MESSAGE = '更新服务暂时不可用'
const UPDATE_ERROR_DETAIL = '请检查网络连接后重试。如果问题持续，可前往 GitHub Releases 手动下载最新版本。'

export function createUpdaterController({
  updater,
  app,
  getWindow,
  showMessageBox,
  stopBackend,
  permitQuit,
  platform = process.platform,
  checkDelayMs = DEFAULT_CHECK_DELAY_MS,
  checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
  setTimeoutFn = setTimeout,
  setIntervalFn = setInterval,
}) {
  let state = { status: 'idle', currentVersion: app.getVersion() }
  let checkPromise
  let manualCheck = false
  let downloaded = false
  let started = false

  const publish = (next) => {
    state = { currentVersion: app.getVersion(), ...next }
    const window = getWindow()
    if (window === undefined || window.isDestroyed()) return
    window.webContents.send('dsh-desktop:update-state', state)
  }

  const showManualResult = async (options) => {
    const window = getWindow()
    if (window === undefined || window.isDestroyed()) return
    await showMessageBox(window, options)
  }

  const check = async ({ manual = false } = {}) => {
    if (!app.isPackaged || platform !== 'win32') {
      if (manual) {
        await showManualResult({
          type: 'info',
          title: '检查更新',
          message: '开发版不检查在线更新',
          detail: '请安装正式发布的 DSH Desktop 后再使用自动更新。',
        })
      }
      return null
    }
    if (checkPromise !== undefined) return await checkPromise
    manualCheck = manual
    publish({ status: 'checking' })
    checkPromise = updater.checkForUpdates()
    try {
      return await checkPromise
    } catch {
      publish({ status: 'error', message: UPDATE_ERROR_MESSAGE })
      if (manualCheck) {
        await showManualResult({
          type: 'error',
          title: '检查更新失败',
          message: UPDATE_ERROR_MESSAGE,
          detail: UPDATE_ERROR_DETAIL,
        })
      }
      manualCheck = false
      return null
    } finally {
      checkPromise = undefined
    }
  }

  const install = async () => {
    if (!downloaded) {
      await check({ manual: true })
      return
    }
    const window = getWindow()
    if (window === undefined || window.isDestroyed()) return
    const result = await showMessageBox(window, {
      type: 'question',
      title: '安装更新',
      message: `DSH Desktop ${state.version ?? '新版本'} 已准备就绪`,
      detail: '应用将关闭并安装更新，完成后会自动重新启动。',
      buttons: ['立即重启安装', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
    if (result.response !== 0) return
    publish({ ...state, status: 'installing' })
    await stopBackend()
    permitQuit()
    updater.quitAndInstall(false, true)
  }

  const start = () => {
    if (started || !app.isPackaged || platform !== 'win32') return
    started = true
    updater.autoDownload = true
    updater.autoInstallOnAppQuit = true
    updater.allowPrerelease = false
    updater.logger = null

    updater.on('checking-for-update', () => publish({ status: 'checking' }))
    updater.on('update-available', (info) => {
      publish({ status: 'downloading', version: info.version, percent: 0 })
      manualCheck = false
    })
    updater.on('update-not-available', async () => {
      publish({ status: 'up-to-date' })
      if (manualCheck) {
        await showManualResult({
          type: 'info',
          title: '检查更新',
          message: '当前已是最新版本',
          detail: `DSH Desktop ${app.getVersion()}`,
        })
      }
      manualCheck = false
    })
    updater.on('download-progress', (progress) => {
      publish({
        status: 'downloading',
        version: state.version,
        percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
      })
    })
    updater.on('update-downloaded', (info) => {
      downloaded = true
      publish({ status: 'downloaded', version: info.version, percent: 100 })
    })
    updater.on('error', () => {
      publish({ status: 'error', message: UPDATE_ERROR_MESSAGE })
    })

    setTimeoutFn(() => void check(), checkDelayMs)
    setIntervalFn(() => void check(), checkIntervalMs)
  }

  return {
    start,
    check,
    install,
    getState: () => state,
  }
}
