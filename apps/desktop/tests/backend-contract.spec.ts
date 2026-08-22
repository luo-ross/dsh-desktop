import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BACKEND_RUNTIME_PATHS, backendLaunchArguments } from '../backend-contract.mjs'

const root = resolve(import.meta.dirname, '..', '..', '..')

describe('packaged backend contract', () => {
  it('ships and validates every desktop-owned runtime dependency', () => {
    const backendManifest = JSON.parse(
      readFileSync(resolve(root, 'apps/desktop-backend/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    const desktopManifest = JSON.parse(
      readFileSync(resolve(root, 'apps/desktop/package.json'), 'utf8'),
    ) as { build?: { files?: string[] } }
    const canonicalRuntimeManifest = JSON.parse(
      readFileSync(resolve(root, 'python/sdk-runtime/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }

    expect(backendManifest.dependencies).toHaveProperty('@deepseek-ai/cordis-plugin-group')
    expect(backendManifest.dependencies).toMatchObject(canonicalRuntimeManifest.dependencies ?? {})
    expect(BACKEND_RUNTIME_PATHS).toContainEqual([
      'node_modules', '@deepseek-ai', 'cordis-plugin-group', 'package.json',
    ])
    expect(desktopManifest.build?.files).toContain('backend-contract.mjs')
  })

  it('starts the embedded Web host without opening the system browser', () => {
    expect(backendLaunchArguments('C:\\runtime\\dsh\\lib\\bin.js')).toEqual([
      '--expose-internals',
      'C:\\runtime\\dsh\\lib\\bin.js',
      'web',
      '--host',
      '127.0.0.1',
      '--port',
      '0',
      '--no-open',
    ])
  })
})
