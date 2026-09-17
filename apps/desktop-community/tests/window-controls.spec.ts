import { describe, expect, it } from 'vitest'
import {
  applyWindowControl,
  createWindowControlsMarkup,
  WINDOW_CONTROLS_CSS,
} from '../window-controls.mjs'

describe('desktop frameless window controls', () => {
  it('renders accessible minimize, maximize, and close actions', () => {
    const markup = createWindowControlsMarkup()

    expect(markup).toContain('data-window-action="minimize"')
    expect(markup).toContain('data-window-action="toggle-maximize"')
    expect(markup).toContain('data-window-action="close"')
    expect(markup).toContain('aria-label="关闭"')
    expect(WINDOW_CONTROLS_CSS).toContain('-webkit-app-region: no-drag')
  })

  it('accepts only the fixed frameless-window action set', () => {
    let maximized = false
    let minimized = false
    const window = {
      close: () => {},
      isDestroyed: () => false,
      isMaximized: () => maximized,
      maximize: () => { maximized = true },
      minimize: () => { minimized = true },
      unmaximize: () => { maximized = false },
    }

    expect(applyWindowControl(window, 'minimize')).toEqual({ maximized: false })
    expect(minimized).toBe(true)
    expect(applyWindowControl(window, 'toggle-maximize')).toEqual({ maximized: true })
    expect(applyWindowControl(window, 'toggle-maximize')).toEqual({ maximized: false })
    expect(() => applyWindowControl(window, 'move')).toThrow('unknown window control action')
  })
})
