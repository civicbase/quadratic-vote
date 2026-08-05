import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { getParameters } from 'codesandbox/lib/api/define.js'

const root = new URL('.', import.meta.url).pathname

function collectFiles(dir, files = {}) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'create-sandbox.mjs' || entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectFiles(full, files)
      continue
    }
    const path = relative(root, full).replaceAll('\\', '/')
    files[path] = { content: readFileSync(full, 'utf8') }
  }
  return files
}

const files = collectFiles(root)
const parameters = getParameters({ files })

const response = await fetch(
  'https://codesandbox.io/api/v1/sandboxes/define?json=1',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `parameters=${encodeURIComponent(parameters)}`,
  },
)

if (!response.ok) {
  console.error('Failed:', response.status, await response.text())
  process.exit(1)
}

const { sandbox_id } = await response.json()
console.log(`https://codesandbox.io/p/sandbox/${sandbox_id}`)
console.log(`https://codesandbox.io/s/${sandbox_id}`)
