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
    args: (task.args as string[] | undefined) || [],
    command: task.command,
  }
}

export const getCommandLine = (task: Task): string => {
  const args = task.args.map((arg) => (/\s/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg))
  return [task.command, ...args].join(' ')
}
