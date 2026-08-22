import { describe, expect, it, vi } from 'vitest'
import { createUpdaterController } from '../updater.mjs'

class FakeUpdater {
  autoDownload = false
  autoInstallOnAppQuit = false
  allowPrerelease = true
  logger: unknown
  checkForUpdates = vi.fn(async () => ({ updateInfo: { version: '0.1.3' } }))
  quitAndInstall = vi.fn()
  private readonly listeners = new Map<string, Array<(...arguments_: unknown[]) => void>>()

  on(event: string, listener: (...arguments_: unknown[]) => void) {
    const listeners = this.listeners.get(event) ?? []
    listeners.push(listener)
    this.listeners.set(event, listeners)
    return this
  }

  emit(event: string, ...arguments_: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...arguments_)
  }
}

function setup(options: {
  packaged?: boolean
  failCheck?: boolean
} = {}) {
  const updater = new FakeUpdater()
  if (options.failCheck === true) {
    updater.checkForUpdates.mockRejectedValueOnce(new Error('private implementation details'))
  }
  const send = vi.fn()
  const window = { isDestroyed: () => false, webContents: { send } }
  const showMessageBox = vi.fn(async () => ({ response: 0 }))
  const stopBackend = vi.fn(async () => undefined)
  const permitQuit = vi.fn()
  const timers: Array<{ callback: () => void; milliseconds: number }> = []
  const intervals: Array<() => void> = []
  const clock = { now: 1_000_000 }
  const controller = createUpdaterController({
    updater,
    app: { isPackaged: options.packaged ?? true, getVersion: () => '0.1.2' },
    getWindow: () => window,
    showMessageBox,
    stopBackend,
    permitQuit,
    platform: 'win32',
    setTimeoutFn: (callback, milliseconds) => { timers.push({ callback, milliseconds }); return 0 },
    setIntervalFn: (callback) => { intervals.push(callback); return 0 },
    nowFn: () => clock.now,
  })
  return {
    updater, send, showMessageBox, stopBackend, permitQuit,
    timers, intervals, clock, controller,
  }
}

describe('desktop updater controller', () => {
  it('configures background checks and publishes download progress', async () => {
    const b = setup()
    b.controller.start()

    expect(b.updater.autoDownload).toBe(true)
    expect(b.updater.autoInstallOnAppQuit).toBe(false)
    expect(b.updater.allowPrerelease).toBe(false)
    expect(b.timers).toHaveLength(1)
    expect(b.intervals).toHaveLength(1)

    b.updater.emit('update-available', { version: '0.1.3' })
    b.updater.emit('download-progress', { percent: 47.6 })
    b.updater.emit('update-downloaded', { version: '0.1.3' })

    expect(b.send).toHaveBeenLastCalledWith('dsh-desktop:update-state', {
      currentVersion: '0.1.2', status: 'downloaded', version: '0.1.3', percent: 100,
    })
  })

  it('reports a manual no-update result', async () => {
    const b = setup()
    b.controller.start()
    const checking = b.controller.check({ manual: true })
    b.updater.emit('update-not-available', { version: '0.1.2' })
    await checking

    expect(b.showMessageBox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      message: '当前已是最新版本',
    }))
  })

  it('keeps updater failures user-friendly', async () => {
    const b = setup({ failCheck: true })
    b.controller.start()
    await b.controller.check({ manual: true })

    expect(b.showMessageBox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      message: '更新服务暂时不可用',
    }))
    expect(JSON.stringify(b.showMessageBox.mock.calls)).not.toContain('private implementation details')
    expect(b.send).toHaveBeenLastCalledWith('dsh-desktop:update-state', {
      currentVersion: '0.1.2', status: 'error', message: '更新服务暂时不可用',
    })
  })

  it('installs a downloaded update silently and relaunches without further input', async () => {
    const b = setup()
    b.controller.start()
    b.updater.emit('update-downloaded', { version: '0.1.3' })
    await b.controller.install()

    expect(b.showMessageBox).not.toHaveBeenCalled()
    expect(b.stopBackend).toHaveBeenCalledOnce()
    expect(b.permitQuit).toHaveBeenCalledOnce()
    expect(b.updater.quitAndInstall).toHaveBeenCalledWith(true, true)
  })

  it('waits for an explicit install action after downloading an update', async () => {
    const b = setup()
    b.controller.start()
    b.updater.emit('update-downloaded', { version: '0.1.3' })

    await Promise.resolve()
    expect(b.updater.quitAndInstall).not.toHaveBeenCalled()
    expect(b.stopBackend).not.toHaveBeenCalled()
    expect(b.permitQuit).not.toHaveBeenCalled()
  })

  it('does not contact the release service in development', async () => {
    const b = setup({ packaged: false })
    b.controller.start()
    await b.controller.check({ manual: true })

    expect(b.updater.checkForUpdates).not.toHaveBeenCalled()
    expect(b.showMessageBox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      message: '开发版不检查在线更新',
    }))
  })

  it('rechecks on a stale focus trigger and skips fresh ones', async () => {
    const b = setup()
    b.controller.start()
    await b.controller.checkIfStale(5 * 60_000)
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()

    b.clock.now += 60_000
    await b.controller.checkIfStale(5 * 60_000)
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()

    b.clock.now += 5 * 60_000
    await b.controller.checkIfStale(5 * 60_000)
    expect(b.updater.checkForUpdates).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight check across overlapping stale triggers', async () => {
    const b = setup()
    b.controller.start()
    let release: ((value: unknown) => void) | undefined
    b.updater.checkForUpdates.mockReturnValueOnce(new Promise((resolve) => { release = resolve }))
    const first = b.controller.checkIfStale(5 * 60_000)
    const second = b.controller.checkIfStale(5 * 60_000)
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()

    release?.({ updateInfo: { version: '0.1.3' } })
    await Promise.all([first, second])
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()
  })

  it('skips the startup timer when a focus check already finished recently', async () => {
    const b = setup()
    b.controller.start()
    await b.controller.checkIfStale(5 * 60_000)
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()

    b.timers[0]?.callback()
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()
  })

  it('runs the periodic interval only when the last finished check is stale', async () => {
    const b = setup()
    b.controller.start()
    await b.controller.checkIfStale(5 * 60_000)

    b.intervals[0]?.()
    expect(b.updater.checkForUpdates).toHaveBeenCalledOnce()

    b.clock.now += 6 * 60 * 60_000
    b.intervals[0]?.()
    await vi.waitFor(() => { expect(b.updater.checkForUpdates).toHaveBeenCalledTimes(2) })
  })

  it('does not recheck before start has configured the updater', async () => {
    const b = setup()
    await b.controller.checkIfStale(0)
    expect(b.updater.checkForUpdates).not.toHaveBeenCalled()
  })
})
