import { build } from 'rolldown'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const directory = new URL('../node_modules/.tmp/tests/', import.meta.url)
await mkdir(directory, { recursive: true })
try {
  const sources = (await readdir(new URL('./', import.meta.url))).filter((name) => name.endsWith('.test.ts'))
  const files = []
  for (const source of sources) {
    const file = new URL(source.replace(/\.ts$/, '.mjs'), directory)
    await build({
      input: new URL(`./${source}`, import.meta.url).pathname,
      platform: 'node',
      external: ['node:test', 'node:assert/strict', 'axios', 'react', 'zustand'],
      output: { file: file.pathname, format: 'esm', banner: 'import.meta.env = {};' },
    })
    files.push(file.pathname)
  }
  const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true })
}
