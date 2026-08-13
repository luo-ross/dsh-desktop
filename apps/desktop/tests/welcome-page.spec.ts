import { describe, expect, it } from 'vitest'
import { createWelcomePage } from '../welcome-page.mjs'

describe('desktop welcome page', () => {
  it('renders the DeepSeek-style startup experience with live status hooks', () => {
    const html = createWelcomePage({
      frameless: true,
      iconDataUrl: 'data:image/png;base64,icon',
      version: '0.1.4',
    })

    expect(html).toContain('探索未至之境')
    expect(html).toContain('DSH Desktop')
    expect(html).toContain('id="startup-status"')
    expect(html).toContain('id="startup-detail"')
    expect(html).toContain('完成后将直接进入主窗口')
    expect(html).toContain('id="dsh-window-controls"')
    expect(html).not.toContain('padding-top: 38px')
    expect(html).toContain('v0.1.4')
  })

  it('keeps native-frame platforms free of duplicate in-app controls', () => {
    const html = createWelcomePage({
      frameless: false,
      iconDataUrl: 'data:image/png;base64,icon',
      version: '0.1.4',
    })

    expect(html).not.toContain('id="dsh-window-controls"')
    expect(html).not.toContain('-webkit-app-region: drag')
  })
})
