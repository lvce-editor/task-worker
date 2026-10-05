import { cp, mkdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const root = resolve(directory, '../..')
const application = process.argv[2]
if (!application) {
  throw new Error('Pass the path to a disposable LVCE Editor checkout')
}

const appRoot = resolve(application)
const packagePath = join(appRoot, 'packages/renderer-worker/node_modules/@lvce-editor/task-worker')
const installedPackage = await realpath(packagePath).catch((error) => {
  if (error.code !== 'ENOENT') throw error
  return packagePath
})
await mkdir(dirname(installedPackage), { recursive: true })
await cp(join(root, '.tmp/dist'), installedPackage, { recursive: true })
