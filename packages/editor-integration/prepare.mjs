import { cp, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
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

const testDirectory = join(appRoot, 'packages/extension-host-worker-tests/src')
await mkdir(testDirectory, { recursive: true })
await cp(join(directory, 'tasks.run-default-build-task.ts'), join(testDirectory, 'tasks.run-default-build-task.ts'))

// Static export sets PATH_PREFIX to /test, so make the CI test server serve those assets there.
const runnerPath = join(appRoot, 'packages/extension-host-worker-tests/src/_all.js')
const runner = await readFile(runnerPath, 'utf8')
const serverSetup = '    app.use(cors({}))\n    app.use(\n'

if (runner.includes("    app.use('/test', express.static(CI_DIST_PATH, { immutable: true, maxAge: 86400 }))")) {
  // The isolated checkout was already prepared.
} else if (runner.includes(serverSetup)) {
  await writeFile(
    runnerPath,
    runner.replace(
      serverSetup,
      "    app.use(cors({}))\n    app.use('/test', express.static(CI_DIST_PATH, { immutable: true, maxAge: 86400 }))\n    app.use(\n",
    ),
  )
} else {
  throw new Error('Could not locate the application CI test server setup')
}
