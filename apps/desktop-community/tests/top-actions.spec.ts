import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(new URL('../main.mjs', import.meta.url), 'utf8')
const themeSource = readFileSync(new URL('../codex-theme.css', import.meta.url), 'utf8')

describe('desktop top actions', () => {
  it('links to the community repository from the left-side action group', () => {
    expect(mainSource).toContain("actions.id = 'dsh-desktop-top-actions'")
    expect(mainSource).toContain("repository.href = 'https://github.com/luo-ross/dsh-desktop'")
    expect(mainSource).toContain("repository.textContent = 'GitHub 仓库'")
    expect(themeSource).toMatch(/#dsh-desktop-top-actions\s*\{[^}]*left: 296px;/s)
  })

  it('keeps the blue update action always visible as the manual check control', () => {
    expect(mainSource).toContain("idle: '检查更新'")
    expect(mainSource).toContain("button.disabled = state.status === 'checking' || state.status === 'installing'")
    expect(mainSource).not.toContain('button.hidden')
    expect(themeSource).toMatch(/#dsh-desktop-update\s*\{[^}]*background: #4d6bfe;/s)
    expect(themeSource).not.toMatch(/#dsh-desktop-update\[hidden\]/)
  })
})
