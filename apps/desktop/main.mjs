import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { get } from 'node:http'
import { join } from 'node:path'
import { app, BrowserWindow, Menu, dialog, shell } from 'electron'
import { extract } from 'tar'

const STARTUP_TIMEOUT_MS = 60_000
const HTTP_READY_TIMEOUT_MS = 30_000
const SHUTDOWN_TIMEOUT_MS = 8_000
const MAX_DIAGNOSTIC_LENGTH = 8_192
const BACKEND_READY_MARKER = '.desktop-backend-ready'
const DESKTOP_THEME_CSS = readFileSync(join(import.meta.dirname, 'codex-theme.css'), 'utf8')

let backendProcess
let backendUrl
let allowQuit = false
let mainWindow
let shutdownPromise
let packagedBackendRoot

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
    await extract({ file: join(process.resourcesPath, 'backend.tar.gz'), cwd: temporary })
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
    backendProcess = undefined
    if (!child || child.exitCode !== null || child.signalCode !== null) return

    child.kill('SIGTERM')
    if (!await waitForExit(child, SHUTDOWN_TIMEOUT_MS)) {
      await forceStopProcessTree(child)
    }
  })()
  return shutdownPromise
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    show: true,
    backgroundColor: '#ffffff',
    title: 'DSH Desktop',
    icon: join(app.getAppPath(), 'build', 'icon.ico'),
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
    window.setTitle('DSH Desktop')
  })
  const loadingPage = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>DSH Desktop</title>
<style>
  :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f7f9fb; color: #202124; }
  body { min-height: 100vh; margin: 0; display: grid; place-items: center; }
  main { text-align: center; padding: 32px; }
  h1 { margin: 0 0 12px; font-size: 28px; font-weight: 650; }
  p { margin: 0; color: #6b7280; font-size: 15px; }
  .spinner { width: 28px; height: 28px; margin: 28px auto 0; border: 3px solid #dce3ea; border-top-color: #202124; border-radius: 50%; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
<main><h1>DSH Desktop</h1><p>正在准备桌面环境，首次启动可能需要约一分钟…</p><div class="spinner"></div></main>
</html>`
  void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingPage)}`)
  return window
}

async function applyDesktopTheme(window) {
  await window.webContents.executeJavaScript(
    "document.body.setAttribute('data-dsh-desktop-codex-theme', '')",
  )
  await window.webContents.insertCSS(DESKTOP_THEME_CSS)
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
    mainWindow = createWindow()
    try {
      await preparePackagedBackend()
      backendUrl = await startBackend()
      await waitForBackendHttp(backendUrl)
      if (!mainWindow.isDestroyed()) {
        await mainWindow.loadURL(backendUrl)
        await applyDesktopTheme(mainWindow)
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
