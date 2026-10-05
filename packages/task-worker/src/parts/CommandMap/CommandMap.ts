import * as HandleRendererProcessMessagePort from '../HandleRendererProcessMessagePort/HandleRendererProcessMessagePort.ts'
import * as TaskCommandMap from '../TaskCommandMap/TaskCommandMap.ts'

export const commandMap = {
  ...TaskCommandMap.commandMap,
  'Task.handleRendererProcessMessagePort': HandleRendererProcessMessagePort.handleRendererProcessMessagePort,
}
