import { extract } from 'tar'

const [archive, destination] = process.argv.slice(2)
if (archive === undefined || destination === undefined) {
  throw new Error('usage: extract-backend.mjs <archive> <destination>')
}

await extract({ file: archive, cwd: destination })
