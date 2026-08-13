import { describe, expect, it } from 'vitest'
import { createWelcomePage } from '../welcome-page.mjs'

describe('desktop welcome page', () => {
  it('renders the DeepSeek-style startup experience with live status hooks', () => {
    const html = createWelcomePage({
      iconDataUrl: 'data:image/png;base64,icon',
      version: '0.1.3',
    })

    expect(html).toContain('探索未至之境')
    expect(html).toContain('DSH Desktop')
    expect(html).toContain('id="startup-status"')
    expect(html).toContain('id="startup-detail"')
    expect(html).toContain('完成后将直接进入主窗口')
    expect(html).toContain('v0.1.3')
  })
})
