import type { ElectronApplication, Page } from '@playwright/test'
import type { expect as playwrightExpect } from '@playwright/test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

export const name = 'tasks.run-default-build-task'

export const test = async ({
  electronApp,
  expect,
  page,
}: {
  page: Page
  electronApp: ElectronApplication
  expect: typeof playwrightExpect
}): Promise<void> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lvce-task-'))
  const configurationPath = join(workspace, '.lvce', 'tasks.json')
  const outputPath = join(workspace, 'task-output.json')
  const argumentsToCheck = ['', 'space here', 'quote\'"', '$HOME; echo unexpected']
  // Splitting the marker keeps it out of the echoed command, so terminal assertions prove execution.
  const script =
    "require('fs').writeFileSync('task-output.json',JSON.stringify({cwd:process.cwd(),args:process.argv.slice(1)}));console.warn('TASK_'+'RESULT:',process.cwd())"
  const configuration = {
    tasks: [
      {
        args: ['-e', script, '--', ...argumentsToCheck],
        command: process.execPath,
        group: { isDefault: true, kind: 'build' },
        label: 'Build',
        type: 'process',
      },
    ],
  }
  await mkdir(join(workspace, '.lvce'))
  await writeFile(configurationPath, JSON.stringify(configuration))
  try {
    await expect(page.locator('.Workbench')).toBeVisible()
    await expect(page.locator('.Explorer')).toBeVisible()
    await electronApp.evaluate(({ BrowserWindow, dialog }, workspacePath) => {
      BrowserWindow.getAllWindows()[0]?.focus()
      dialog.showOpenDialog = async (): Promise<{ canceled: boolean; filePaths: string[] }> => ({ canceled: false, filePaths: [workspacePath] })
    }, workspace)
    const runCommand = async (label: string): Promise<void> => {
      await page.locator('.Explorer').click({ position: { x: 10, y: 10 } })
      console.warn(`Running command: ${label}; url=${page.url()}`)
      await page.keyboard.press('F1')
      await expect(page.locator('.QuickPick')).toBeVisible()
      await page.locator('.QuickPick input').fill(`>${label}`)
      await expect(page.locator('.QuickPickItemActive')).toHaveText(label)
      await page.locator('.QuickPick input').press('Enter')
      await expect(page.locator('.QuickPick')).toBeHidden()
    }
    await runCommand('File: Open Folder')
    await expect(page.locator('.Explorer')).toContainText('.lvce')
    const terminalRows = page.locator('.xterm-rows')
    for (let run = 0; run < 2; run++) {
      await rm(outputPath, { force: true })
      await runCommand('Tasks: Run default build task')
      await expect(terminalRows).toBeVisible()
      await expect(terminalRows).toContainText('-e')
      await expect(terminalRows).toContainText('TASK_RESULT:')
      await expect(terminalRows).toContainText(basename(workspace))
      await expect
        .poll(async (): Promise<unknown> => {
          try {
            return JSON.parse(await readFile(outputPath, 'utf8'))
          } catch {
            return undefined
          }
        })
        .toEqual({ args: argumentsToCheck, cwd: workspace })
    }
    // Invalid configuration must report an error and leave the output file absent.
    await rm(outputPath)
    await writeFile(configurationPath, '{')
    await runCommand('Tasks: Run default build task')
    await expect(page.locator('body')).toContainText('Unable to run the default build task:')
    await expect
      .poll(async (): Promise<boolean> => {
        try {
          await readFile(outputPath, 'utf8')
          return true
        } catch {
          return false
        }
      })
      .toBe(false)
  } catch (error) {
    console.warn(`Electron acceptance failed: ${await page.locator('body').innerText()}`)
    throw error
  } finally {
    // Close the app before deleting its active workspace or terminal cwd.
    await electronApp.close()
    await rm(workspace, { force: true, recursive: true })
  }
}
