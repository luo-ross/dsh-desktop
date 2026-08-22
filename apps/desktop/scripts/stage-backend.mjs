import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { create } from 'tar'

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(desktopRoot, '..', '..')
const output = resolve(repositoryRoot, 'desktop-backend')
const archive = resolve(repositoryRoot, 'desktop-backend.tar.gz')
const builtFrontend = resolve(repositoryRoot, 'apps', 'web', 'dist')
const welcomeBackground = resolve(
  repositoryRoot,
  'packages',
  'client',
  'ui-settings-models',
  'src',
  'client',
  'assets',
  'deepseek-welcome-background.png',
)
const deployedFrontend = resolve(
  output,
  'node_modules',
  '@deepseek-ai',
  'dsh-web-frontend',
  'dist',
)
const clientOverlays = [
  ['ui-layout', '@deepseek-ai/dsh-client-ui-layout'],
  ['ui-settings-models', '@deepseek-ai/dsh-client-ui-settings-models'],
  ['ui-directory-picker-native', '@deepseek-ai/dsh-client-ui-directory-picker-native'],
  ['ui-workspace', '@deepseek-ai/dsh-client-ui-workspace'],
]
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

if (!existsSync(resolve(builtFrontend, 'index.html'))) {
  throw new Error('desktop frontend overlay is missing; run the Web build before staging')
}
if (!existsSync(resolve(output, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'package.json'))) {
  throw new Error('deployed backend is missing @deepseek-ai/dsh-web-frontend')
}
rmSync(deployedFrontend, { recursive: true, force: true })
cpSync(builtFrontend, deployedFrontend, { recursive: true })
mkdirSync(resolve(deployedFrontend, 'assets'), { recursive: true })
copyFileSync(welcomeBackground, resolve(deployedFrontend, 'assets', 'deepseek-welcome-background.png'))

for (const [workspaceName, packageName] of clientOverlays) {
  const builtPackage = resolve(repositoryRoot, 'packages', 'client', workspaceName, 'lib')
  const deployedPackageRoot = resolve(output, 'node_modules', ...packageName.split('/'))
  if (!existsSync(resolve(builtPackage, 'client.js'))) {
    throw new Error(`desktop client overlay is missing for ${packageName}; run the client build before staging`)
  }
  if (!existsSync(resolve(deployedPackageRoot, 'package.json'))) {
    throw new Error(`deployed backend is missing ${packageName}`)
  }
  rmSync(resolve(deployedPackageRoot, 'lib'), { recursive: true, force: true })
  cpSync(builtPackage, resolve(deployedPackageRoot, 'lib'), { recursive: true })
}

rmSync(archive, { force: true })
await create({ cwd: output, file: archive, gzip: true, portable: true }, ['.'])
