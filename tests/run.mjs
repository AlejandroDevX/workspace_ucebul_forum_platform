import { build } from 'rolldown'
import { mkdir, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const directory = new URL('../node_modules/.tmp/auth-tests/', import.meta.url)
await mkdir(directory, { recursive: true })
const file = new URL('auth.test.mjs', directory)
try {
  await build({
    input: new URL('./auth.test.ts', import.meta.url).pathname,
    platform: 'node',
    external: ['node:test', 'node:assert/strict', 'axios', 'react', 'zustand'],
    output: { file: file.pathname, format: 'esm', banner: 'import.meta.env = {};'  },
  })
  const result = spawnSync(process.execPath, ['--test', file.pathname], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true })
}
