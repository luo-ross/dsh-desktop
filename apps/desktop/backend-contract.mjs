/** Runtime files that must exist before a packaged backend can be reused or archived. */
export const BACKEND_RUNTIME_PATHS = [
  ['node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'],
  ['node_modules', '@deepseek-ai', 'cordis-plugin-group', 'package.json'],
  ['node_modules', 'yaml', 'dist', 'index.js'],
]
