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

  it('shows the blue update action only after an update is available', () => {
    expect(mainSource).toContain("button.hidden = !['downloading', 'downloaded', 'installing'].includes(state.status)")
    expect(themeSource).toMatch(/#dsh-desktop-update\s*\{[^}]*background: #4d6bfe;/s)
    expect(themeSource).toMatch(/#dsh-desktop-update\[hidden\]\s*\{\s*display: none;/s)
  })
})
