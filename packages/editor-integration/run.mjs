import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(process.argv[2])
const require = createRequire(join(appRoot, 'package.json'))
const runner = join(appRoot, 'node_modules/@lvce-editor/test-with-playwright/bin/test-with-playwright.js')
const child = spawn(
  process.execPath,
  [
    runner,
    '--electron',
    `--electron-path=${require('electron')}`,
    `--electron-arg=${join(appRoot, 'packages/main-process')}`,
    '--electron-arg=--no-sandbox',
    `--electron-env=LVCE_ROOT=${appRoot}`,
    `--electron-env=LVCE_SHARED_PROCESS_PATH=${join(appRoot, 'packages/shared-process/src/sharedProcessMain.ts')}`,
    `--test-path=${directory}`,
    '--timeout=60000',
  ],
  { cwd: appRoot, stdio: 'inherit', env: process.env },
)
child.on('error', (error) => {
  throw error
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
