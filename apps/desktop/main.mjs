import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { get } from 'node:http'
import { join } from 'node:path'
import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron'
import electronUpdater from 'electron-updater'
import { createUpdaterController } from './updater.mjs'
import { createWelcomePage } from './welcome-page.mjs'
import {
  applyWindowControl,
  createWindowControlsMarkup,
  WINDOW_CONTROLS_CSS,
} from './window-controls.mjs'

const { autoUpdater } = electronUpdater

const STARTUP_TIMEOUT_MS = 60_000
const HTTP_READY_TIMEOUT_MS = 30_000
const SHUTDOWN_TIMEOUT_MS = 8_000
const MAX_DIAGNOSTIC_LENGTH = 8_192
const BACKEND_READY_MARKER = '.desktop-backend-ready'
const DESKTOP_THEME_CSS = readFileSync(join(import.meta.dirname, 'codex-theme.css'), 'utf8')
const DESKTOP_ICON_DATA_URL = `data:image/png;base64,${readFileSync(join(import.meta.dirname, 'build', 'icon.png')).toString('base64')}`

let backendProcess
let backendExtractionProcess
let backendUrl
let allowQuit = false
let mainWindow
let shutdownPromise
let packagedBackendRoot
let updaterController

function backendRequiredPaths(root) {
  return [
    join(root, BACKEND_READY_MARKER),
    join(root, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'),
    join(root, 'node_modules', 'yaml', 'dist', 'index.js'),
  ]
}

function isPackagedBackendReady(root) {
  return backendRequiredPaths(root).every(path => existsSync(path))
}

function updateStartupStatus(status, detail = '') {
  if (mainWindow === undefined || mainWindow.isDestroyed()) return
  const script = `{
    const status = document.getElementById('startup-status');
    const detail = document.getElementById('startup-detail');
    if (status) status.textContent = ${JSON.stringify(status)};
    if (detail) detail.textContent = ${JSON.stringify(detail)};
  }`
  void mainWindow.webContents.executeJavaScript(script).catch(() => undefined)
}

function extractBackendArchive(archive, destination) {
  const helper = join(app.getAppPath(), 'scripts', 'extract-backend.mjs')
  const child = spawn(process.execPath, [helper, archive, destination], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  })
  backendExtractionProcess = child

  return new Promise((resolve, reject) => {
    let diagnostics = ''
    child.stderr.on('data', (chunk) => {
      diagnostics = appendDiagnostic(diagnostics, chunk)
      process.stderr.write(chunk)
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (backendExtractionProcess === child) backendExtractionProcess = undefined
      if (code === 0) resolve()
      else reject(new Error(
        `DeepSeek Harness backend extraction failed (code ${String(code)}, signal ${String(signal)}).\n${diagnostics}`,
      ))
    })
  })
}

async function preparePackagedBackend() {
  if (!app.isPackaged) return
  const destination = join(app.getPath('userData'), `backend-${app.getVersion()}`)
  if (isPackagedBackendReady(destination)) {
    packagedBackendRoot = destination
    return
  }

  const temporary = `${destination}.extracting-${String(process.pid)}`
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })
  try {
    updateStartupStatus('首次启动：正在解压内置后端…', '窗口仍可正常移动和响应，请稍候。')
    await extractBackendArchive(join(process.resourcesPath, 'backend.tar.gz'), temporary)
    const missing = backendRequiredPaths(temporary).slice(1).filter(path => !existsSync(path))
    if (missing.length > 0) {
      throw new Error(`DeepSeek Harness backend archive is incomplete:\n${missing.join('\n')}`)
    }
    await writeFile(join(temporary, BACKEND_READY_MARKER), `${app.getVersion()}\n`, 'utf8')
    await rm(destination, { recursive: true, force: true })
    await rename(temporary, destination)
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw error
  }
  packagedBackendRoot = destination
}

function backendEntryPath() {
  if (app.isPackaged) {
    return join(
      packagedBackendRoot,
      'node_modules',
      '@deepseek-ai',
      'dsh',
      'lib',
      'bin.js',
    )
  }
  return join(app.getAppPath(), '..', 'cli', 'lib', 'bin.js')
}

function appendDiagnostic(current, chunk) {
  return `${current}${chunk.toString()}`.slice(-MAX_DIAGNOSTIC_LENGTH)
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function waitForBackendHttp(url) {
  const deadline = Date.now() + HTTP_READY_TIMEOUT_MS
  let lastError
  while (Date.now() < deadline) {
    try {
      const status = await new Promise((resolve, reject) => {
        const request = get(url, { agent: false }, (response) => {
          response.resume()
          response.once('end', () => resolve(response.statusCode ?? 0))
        })
        request.setTimeout(3_000, () => request.destroy(new Error('HTTP readiness request timed out')))
        request.once('error', reject)
      })
      if (status >= 200 && status < 300) return
      lastError = new Error(`HTTP ${String(status)}`)
    } catch (error) {
      lastError = error
    }
    await delay(250)
  }
  throw new Error(
    `DeepSeek Harness backend did not accept HTTP requests within ${HTTP_READY_TIMEOUT_MS / 1000} seconds.`,
    { cause: lastError },
  )
}

function startBackend() {
  const entry = backendEntryPath()
  if (!existsSync(entry)) {
    throw new Error(`DeepSeek Harness backend is missing: ${entry}`)
  }

  const child = spawn(
    process.execPath,
    ['--expose-internals', entry, 'web', '--host', '127.0.0.1', '--port', '0'],
    {
      cwd: app.getPath('documents'),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  )
  backendProcess = child

  return new Promise((resolve, reject) => {
    let settled = false
    let output = ''
    const timeout = setTimeout(() => {
      finish(new Error(`DeepSeek Harness did not become ready within ${STARTUP_TIMEOUT_MS / 1000} seconds.\n${output}`))
    }, STARTUP_TIMEOUT_MS)

    const finish = (error, url) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      child.off('error', onError)
      child.off('exit', onExit)
      if (error) reject(error)
      else resolve(url)
    }

    const inspect = (chunk) => {
      output = appendDiagnostic(output, chunk)
      process.stdout.write(chunk)
      const match = output.match(/dsh web:\s+(http:\/\/127\.0\.0\.1:\d+)/)
      if (match?.[1]) finish(undefined, match[1])
    }
    const onError = (error) => finish(error)
    const onExit = (code, signal) => {
      finish(new Error(`DeepSeek Harness stopped during startup (code ${String(code)}, signal ${String(signal)}).\n${output}`))
    }

    child.stdout.on('data', inspect)
    child.stderr.on('data', (chunk) => {
      output = appendDiagnostic(output, chunk)
      process.stderr.write(chunk)
    })
    child.on('error', onError)
    child.on('exit', onExit)
  })
}

async function stopChildProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  if (!await waitForExit(child, SHUTDOWN_TIMEOUT_MS)) await forceStopProcessTree(child)
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.off('exit', onExit)
      resolve(false)
    }, timeoutMs)
    const onExit = () => {
      clearTimeout(timeout)
      resolve(true)
    }
    child.once('exit', onExit)
  })
}

async function forceStopProcessTree(child) {
  if (process.platform !== 'win32') {
    child.kill('SIGKILL')
    await waitForExit(child, SHUTDOWN_TIMEOUT_MS)
    return
  }

  const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
    stdio: 'ignore',
    windowsHide: true,
  })
  await new Promise((resolve) => killer.once('exit', resolve))
  await waitForExit(child, SHUTDOWN_TIMEOUT_MS)
}

function stopBackend() {
  if (shutdownPromise) return shutdownPromise
  shutdownPromise = (async () => {
    const child = backendProcess
    const extraction = backendExtractionProcess
    backendProcess = undefined
    backendExtractionProcess = undefined
    await Promise.all([stopChildProcess(child), stopChildProcess(extraction)])
  })()
  return shutdownPromise
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    show: true,
    backgroundColor: '#ffffff',
    title: 'DSH Desktop · DeepSeek Harness 桌面版',
    icon: join(app.getAppPath(), 'build', 'icon.ico'),
    frame: process.platform !== 'win32',
    webPreferences: {
      preload: join(app.getAppPath(), 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('http://') || target.startsWith('https://')) void shell.openExternal(target)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, target) => {
    if (backendUrl !== undefined && new URL(target).origin === new URL(backendUrl).origin) return
    event.preventDefault()
    if (target.startsWith('http://') || target.startsWith('https://')) void shell.openExternal(target)
  })
  window.on('page-title-updated', (event) => {
    event.preventDefault()
    window.setTitle('DSH Desktop · DeepSeek Harness 桌面版')
  })
  const publishWindowState = () => {
    if (!window.isDestroyed()) {
      window.webContents.send('dsh-desktop:window-state', { maximized: window.isMaximized() })
    }
  }
  window.on('maximize', publishWindowState)
  window.on('unmaximize', publishWindowState)
  const loadingPage = createWelcomePage({
    frameless: process.platform === 'win32',
    iconDataUrl: DESKTOP_ICON_DATA_URL,
    version: app.getVersion(),
  })
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingPage)}`)
  await installWindowControls(window)
  return window
}

ipcMain.handle('dsh-desktop:pick-directory', async (event) => {
  if (
    mainWindow === undefined
    || mainWindow.isDestroyed()
    || event.sender.id !== mainWindow.webContents.id
  ) throw new Error('directory picker request came from an unknown window')

  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择工作目录',
    properties: ['openDirectory', 'createDirectory'],
  })
  return result.canceled ? null : result.filePaths[0] ?? null
})

function assertMainWindowSender(event) {
  if (
    mainWindow === undefined
    || mainWindow.isDestroyed()
    || event.sender.id !== mainWindow.webContents.id
  ) throw new Error('desktop request came from an unknown window')
}

ipcMain.handle('dsh-desktop:get-update-state', (event) => {
  assertMainWindowSender(event)
  return updaterController?.getState() ?? { status: 'idle', currentVersion: app.getVersion() }
})

ipcMain.handle('dsh-desktop:check-for-updates', async (event) => {
  assertMainWindowSender(event)
  return await updaterController?.check({ manual: true })
})

ipcMain.handle('dsh-desktop:install-update', async (event) => {
  assertMainWindowSender(event)
  await updaterController?.install()
})

ipcMain.handle('dsh-desktop:window-control', (event, action) => {
  assertMainWindowSender(event)
  return applyWindowControl(mainWindow, action)
})

async function installWindowControls(window) {
  if (process.platform !== 'win32') return
  await window.webContents.executeJavaScript(`{
    const bridge = globalThis.dshDesktop;
    if (bridge?.windowControl) {
      if (!document.getElementById('dsh-window-controls')) {
        document.body.insertAdjacentHTML('beforeend', ${JSON.stringify(createWindowControlsMarkup())});
      }
      const controls = document.getElementById('dsh-window-controls');
      const maximizeButton = controls.querySelector('[data-window-action="toggle-maximize"]');
      const renderWindowState = (state) => {
        const maximized = Boolean(state?.maximized);
        maximizeButton.setAttribute('aria-label', maximized ? '还原' : '最大化');
        maximizeButton.querySelector('span').textContent = maximized ? '\\uE923' : '\\uE922';
      };
      for (const button of controls.querySelectorAll('button[data-window-action]')) {
        button.addEventListener('click', () => {
          const action = button.dataset.windowAction;
          const request = bridge.windowControl(action);
          if (action === 'close') void request.catch(() => {});
          else void request.then(renderWindowState);
        });
      }
      void bridge.windowControl('get-state').then(renderWindowState);
      const unsubscribe = bridge.onWindowState?.(renderWindowState);
      if (unsubscribe) window.addEventListener('beforeunload', unsubscribe, { once: true });
    }
  }`)
}

async function installUpdateControl(window) {
  await window.webContents.executeJavaScript(`{
    const bridge = globalThis.dshDesktop;
    if (bridge?.checkForUpdates && !document.getElementById('dsh-desktop-update')) {
      const button = document.createElement('button');
      button.id = 'dsh-desktop-update';
      button.type = 'button';
      button.setAttribute('aria-label', '检查 DSH Desktop 更新');
      let status = 'idle';
      const render = (state) => {
        status = state.status;
        const labels = {
          idle: '检查更新',
          checking: '正在检查…',
          'up-to-date': '已是最新版',
          downloading: state.percent > 0 ? '下载更新 ' + state.percent + '%' : '发现 v' + (state.version ?? ''),
          downloaded: '重启更新 v' + (state.version ?? ''),
          installing: '正在安装…',
          error: '更新检查失败',
        };
        button.textContent = labels[state.status] ?? '检查更新';
        button.dataset.status = state.status;
        button.disabled = state.status === 'checking' || state.status === 'installing';
        button.title = state.message ?? ('DSH Desktop ' + state.currentVersion);
      };
      button.addEventListener('click', () => {
        if (status === 'downloaded') void bridge.installUpdate();
        else void bridge.checkForUpdates();
      });
      document.body.append(button);
      void bridge.getUpdateState().then(render);
      const unsubscribe = bridge.onUpdateState(render);
      window.addEventListener('beforeunload', unsubscribe, { once: true });
    }
  }`)
}

async function applyDesktopTheme(window) {
  await window.webContents.executeJavaScript(
    "document.body.setAttribute('data-dsh-desktop-codex-theme', '')",
  )
  await window.webContents.insertCSS(DESKTOP_THEME_CSS)
  await window.webContents.insertCSS(WINDOW_CONTROLS_CSS)
  await installWindowControls(window)
  await installUpdateControl(window)
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow === undefined || mainWindow.isDestroyed()) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app.on('before-quit', (event) => {
    if (allowQuit) return
    event.preventDefault()
    void stopBackend().finally(() => {
      allowQuit = true
      app.quit()
    })
  })

  app.on('window-all-closed', () => app.quit())

  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('io.github.luoross.dshdesktop')
    Menu.setApplicationMenu(null)
    mainWindow = await createWindow()
    updaterController = createUpdaterController({
      updater: autoUpdater,
      app,
      getWindow: () => mainWindow,
      showMessageBox: (window, options) => dialog.showMessageBox(window, options),
      stopBackend,
      permitQuit: () => { allowQuit = true },
    })
    try {
      await preparePackagedBackend()
      updateStartupStatus('正在启动 DeepSeek Harness 本地服务…')
      backendUrl = await startBackend()
      updateStartupStatus('正在连接桌面界面…')
      await waitForBackendHttp(backendUrl)
      if (!mainWindow.isDestroyed()) {
        await mainWindow.loadURL(backendUrl)
        await applyDesktopTheme(mainWindow)
        updaterController.start()
      }
    } catch (error) {
      dialog.showErrorBox(
        'DSH Desktop 启动失败',
        error instanceof Error ? error.message : String(error),
      )
      app.quit()
    }
  })
}
