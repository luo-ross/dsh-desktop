/** Runtime files that must exist before a packaged backend can be reused or archived. */
export const BACKEND_RUNTIME_PATHS = [
  ['node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'],
  ['node_modules', '@deepseek-ai', 'cordis-plugin-group', 'package.json'],
  ['node_modules', 'yaml', 'dist', 'index.js'],
]

/**
 * Build the Electron-owned backend command without allowing `dsh web` to open an external browser.
 * @param {string} entry - Absolute path to the packaged dsh CLI entry.
 * @returns {string[]} Electron Node-mode arguments for the loopback Web host.
 */
export function backendLaunchArguments(entry) {
  return ['--expose-internals', entry, 'web', '--host', '127.0.0.1', '--port', '0', '--no-open']
}
