import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { create } from 'tar'

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(desktopRoot, '..', '..')
const output = resolve(repositoryRoot, 'desktop-backend')
const archive = resolve(repositoryRoot, 'desktop-backend.tar.gz')
const pnpmEntry = process.env.npm_execpath

if (!pnpmEntry) throw new Error('stage-backend must be run through pnpm')

rmSync(output, { recursive: true, force: true })
const result = spawnSync(
  process.execPath,
  [
    pnpmEntry,
    '--config.inject-workspace-packages=true',
    '--config.node-linker=hoisted',
    '--config.strict-dep-builds=false',
    '--filter',
    '@luo-ross/dsh-desktop-backend',
    'deploy',
    '--prod',
    output,
  ],
  { cwd: repositoryRoot, stdio: 'inherit' },
)
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

rmSync(archive, { force: true })
await create({ cwd: output, file: archive, gzip: true, portable: true }, ['.'])
