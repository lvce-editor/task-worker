import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'tasks.run-default-build-task'

export const test: Test = async ({ Command, expect, FileSystem, Locator, QuickPick, Workspace }) => {
  const workspacePath = await FileSystem.getTmpDir()
  const taskDirectory = `${workspacePath}/.lvce`
  await Command.execute('FileSystem.mkdir', taskDirectory)
  const taskConfiguration = `{"tasks":[{"args":["-e","console.log('task-ran')"],"command":"node","group":{"isDefault":true,"kind":"build"},"label":"Default build","type":"shell"}]}`
  await FileSystem.writeFile(`${taskDirectory}/tasks.json`, taskConfiguration)
  await Workspace.setUri(workspacePath)

  await QuickPick.open()
  await QuickPick.setValue('>Tasks: Run default build task')
  const taskCommand = Locator('.QuickPickItem', { hasText: 'Tasks: Run default build task' })
  await expect(taskCommand).toBeVisible()
  await QuickPick.selectItem('Tasks: Run default build task')
  await expect(Locator('.QuickPick')).toBeHidden()
}
