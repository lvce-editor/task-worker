import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'tasks.run-default-build-task'

// The pinned LVCE integration checkout does not include task-worker registration yet.
export const skip = 1

export const test: Test = async ({ Command, expect, FileSystem, Locator, QuickPick, Workspace }) => {
  const workspacePath = await FileSystem.getTmpDir()
  const taskDirectory = `${workspacePath}/.lvce`
  await Command.execute('FileSystem.mkdir', taskDirectory)
  const taskConfiguration = `{"tasks":[{"args":["-e","require('node:fs').writeFileSync('.lvce/task-cwd.txt', process.cwd())"],"command":"node","group":{"isDefault":true,"kind":"build"},"label":"Default build","type":"shell"}]}`
  await FileSystem.writeFile(`${taskDirectory}/tasks.json`, taskConfiguration)
  await Workspace.setUri(workspacePath)

  await QuickPick.open()
  await QuickPick.setValue('>Tasks: Run default build task')
  const taskCommand = Locator('.QuickPickItem', { hasText: 'Tasks: Run default build task' })
  await expect(taskCommand).toBeVisible()
  await QuickPick.selectItem('Tasks: Run default build task')

  const outputPath = `${taskDirectory}/task-cwd.txt`
  let output = ''
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      output = await FileSystem.readFile(outputPath)
      break
    } catch (error) {
      if (attempt === 99) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  if (output !== workspacePath) {
    throw new Error(`Expected task cwd ${workspacePath}, received ${output}`)
  }
  await expect(Locator('.xterm-rows')).toContainText('node -e')
}
