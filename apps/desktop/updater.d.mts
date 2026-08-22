export interface UpdaterLike {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  allowPrerelease: boolean
  logger?: unknown
  checkForUpdates: () => Promise<unknown>
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void
  on: (event: string, listener: (...arguments_: unknown[]) => void) => unknown
}

export interface UpdaterState {
  status: string
  currentVersion: string
  version?: string
  percent?: number
  message?: string
}

export interface UpdaterController {
  start: () => void
  check: (options?: { manual?: boolean }) => Promise<unknown>
  /** Silent check only when the last finished check is at least this old. */
  checkIfStale: (maxAgeMs: number) => Promise<unknown>
  install: () => Promise<void>
  getState: () => UpdaterState
}

export function createUpdaterController(options: {
  updater: UpdaterLike
  app: { isPackaged: boolean; getVersion: () => string }
  getWindow: () => {
    isDestroyed: () => boolean
    webContents: { send: (channel: string, state: UpdaterState) => void }
  } | undefined
  showMessageBox: (window: unknown, options: Record<string, unknown>) => Promise<{ response: number }>
  stopBackend: () => Promise<void>
  permitQuit: () => void
  platform?: string
  checkDelayMs?: number
  checkIntervalMs?: number
  setTimeoutFn?: (callback: () => void, milliseconds: number) => unknown
  setIntervalFn?: (callback: () => void, milliseconds: number) => unknown
  nowFn?: () => number
}): UpdaterController
