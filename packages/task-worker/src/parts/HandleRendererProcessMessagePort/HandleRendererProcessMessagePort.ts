import { PlainMessagePortRpc } from '@lvce-editor/rpc'
import * as TaskCommandMap from '../TaskCommandMap/TaskCommandMap.ts'

export const handleRendererProcessMessagePort = async (port: MessagePort): Promise<void> => {
  await PlainMessagePortRpc.create({
    commandMap: TaskCommandMap.commandMap,
    messagePort: port,
  })
}
