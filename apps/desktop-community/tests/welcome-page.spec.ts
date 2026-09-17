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
    expect(html).toContain('<title>DSH</title>')
    expect(html).toContain('<h2>DSH</h2>')
    expect(html).not.toContain('DSH Desktop')
    expect(html).toContain('id="startup-status"')
    expect(html).toContain('id="startup-detail"')
    expect(html).toContain('id="startup-progress"')
    expect(html).toContain('id="startup-progress-effects"')
    expect(html).toContain('style="width: 18%"')
    expect(html).toContain('class="progress-pulse"')
    expect(html).toContain('animation: progress-sweep 1.25s linear infinite')
    expect(html).toContain('#64a9ff')
    expect(html).not.toContain('.progress-pulse { display: none; }')
    expect(html).toContain('初始化应用运行环境')
    expect(html).toContain('正在准备桌面环境…')
    expect(html).toContain('首次启动可能需要约一分钟。')
    expect(html).toContain('完成后将直接进入主窗口')
    expect(html).toContain('id="dsh-window-controls"')
    expect(html).not.toContain('padding-top: 38px')
    expect(html).toContain('v0.1.4')
  })

  it('uses the short DSH name for Windows packaging and shortcuts', async () => {
    const manifest = JSON.parse(await import('node:fs/promises').then(fs =>
      fs.readFile(new URL('../package.json', import.meta.url), 'utf8'),
    )) as {
      productName: string
      build: {
        productName: string
        nsis: { shortcutName: string }
        win: { artifactName: string }
      }
    }

    expect(manifest.productName).toBe('DSH')
    expect(manifest.build.productName).toBe('DSH')
    expect(manifest.build.nsis.shortcutName).toBe('DSH')
    expect(manifest.build.win.artifactName).toBe('DSH-Windows-x64-Setup-${version}.${ext}')
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

  it('shows a fast-start message when the packaged backend is already cached', () => {
    const html = createWelcomePage({
      cachedBackend: true,
      frameless: true,
      iconDataUrl: 'data:image/png;base64,icon',
      version: '0.1.8',
    })

    expect(html).toContain('正在快速启动 DeepSeek Harness…')
    expect(html).toContain('已复用本机运行环境，无需重复初始化。')
    expect(html).toContain('value="62"')
    expect(html).toContain('style="width: 62%"')
    expect(html).not.toContain('首次启动可能需要约一分钟。')
  })
})
