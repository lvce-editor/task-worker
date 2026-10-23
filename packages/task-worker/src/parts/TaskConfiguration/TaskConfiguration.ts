export interface Task {
  readonly args: readonly string[]
  readonly command: string
  readonly label?: string
  readonly type?: string
}

interface ConfiguredTask {
  readonly args?: unknown
  readonly command?: unknown
  readonly group?: {
    readonly kind?: unknown
    readonly isDefault?: unknown
  }
  readonly label?: unknown
  readonly type?: unknown
}

export const getDefaultBuildTask = (content: string): Task => {
  const configuration = JSON.parse(content) as { tasks?: unknown }
  if (!configuration || typeof configuration !== 'object' || !Array.isArray(configuration.tasks)) {
    throw new Error('Task configuration must contain a tasks array.')
  }

  const defaultBuildTasks = (configuration.tasks as ConfiguredTask[]).filter((candidate) => {
    return candidate && candidate.group?.kind === 'build' && candidate.group.isDefault === true
  })
  if (defaultBuildTasks.length === 0) {
    throw new Error('No default build task is configured in .lvce/tasks.json.')
  }
  if (defaultBuildTasks.length > 1) {
    throw new Error('More than one default build task is configured in .lvce/tasks.json.')
  }
  const [task] = defaultBuildTasks
  if (typeof task.command !== 'string' || task.command.trim() === '' || /[\r\n]/.test(task.command)) {
    throw new Error('The default build task must have a command.')
  }
  if (task.type !== undefined && task.type !== 'shell' && task.type !== 'process') {
    throw new Error('The default build task uses an unsupported type.')
  }
  if (task.args !== undefined && (!Array.isArray(task.args) || task.args.some((arg: unknown) => typeof arg !== 'string' || /[\r\n]/.test(arg)))) {
    throw new Error('The default build task args must be an array of strings.')
  }
  return {
    ...(typeof task.label === 'string' && { label: task.label }),
    ...(typeof task.type === 'string' && { type: task.type }),
    args: (task.args as string[] | undefined) || [],
    command: task.command,
  }
}

const quoteArgument = (argument: string, powershell: boolean): string => {
  if (!powershell && /^[a-zA-Z0-9_./:@%+=,-]+$/.test(argument)) {
    return argument
  }
  return powershell ? `'${argument.replaceAll("'", "''")}'` : `'${argument.replaceAll("'", "'\\''")}'`
}

export const getCommandLine = (task: Task, shell = 'bash'): string => {
  const shellName = shell
    .split(/[\\/]/)
    .at(-1)
    ?.toLowerCase()
    .replace(/\.exe$/, '')
  const powershell = shellName === 'powershell' || shellName === 'pwsh'
  if (!powershell && shellName !== 'bash' && shellName !== 'zsh' && shellName !== 'sh') {
    throw new Error(`Task argument formatting is not supported for shell ${shell}.`)
  }
  const command = task.type === 'process' ? quoteArgument(task.command, powershell) : task.command
  const prefix = task.type === 'process' && powershell ? '& ' : ''
  const args = task.args.map((argument) => quoteArgument(argument, powershell))
  return prefix + [command, ...args].join(' ')
}
