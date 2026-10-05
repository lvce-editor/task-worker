import { describe, expect, it } from '@jest/globals'
import { getCommandLine, getDefaultBuildTask } from '../src/parts/TaskConfiguration/TaskConfiguration.ts'

describe('getDefaultBuildTask', () => {
  it('returns the explicitly default build task', () => {
    const task = getDefaultBuildTask(
      '{"tasks":[{"command":"npm","group":{"isDefault":true,"kind":"test"},"label":"test"},{"args":["run","build"],"command":"npm","group":{"isDefault":true,"kind":"build"},"label":"build","type":"shell"}]}',
    )

    expect(task).toEqual({ args: ['run', 'build'], command: 'npm', label: 'build' })
    expect(getCommandLine(task)).toBe('npm run build')
    expect(
      getCommandLine(getDefaultBuildTask('{"tasks":[{"args":["hello there"],"command":"echo","group":{"isDefault":true,"kind":"build"}}]}')),
    ).toBe('echo "hello there"')
  })

  it('rejects malformed task configuration', () => {
    expect(() => getDefaultBuildTask('{')).toThrow(SyntaxError)
    expect(() => getDefaultBuildTask('{}')).toThrow('must contain a tasks array')
  })

  it('rejects configurations without a default build task', () => {
    expect(() => getDefaultBuildTask('{"tasks":[{"command":"npm run build"}]}')).toThrow('No default build task')
  })

  it('rejects ambiguous default build tasks', () => {
    expect(() =>
      getDefaultBuildTask(
        '{"tasks":[{"command":"npm run build","group":{"isDefault":true,"kind":"build"}},{"command":"make","group":{"isDefault":true,"kind":"build"}}]}',
      ),
    ).toThrow('More than one default build task')
  })

  it('rejects a selected task without a command or with unsupported arguments', () => {
    expect(() => getDefaultBuildTask('{"tasks":[{"group":{"isDefault":true,"kind":"build"}}]}')).toThrow('must have a command')
    expect(() => getDefaultBuildTask('{"tasks":[{"args":[1],"command":"npm","group":{"isDefault":true,"kind":"build"}}]}')).toThrow(
      'args must be an array of strings',
    )
    expect(() => getDefaultBuildTask('{"tasks":[{"command":"npm\\necho unsafe","group":{"isDefault":true,"kind":"build"}}]}')).toThrow(
      'must have a command',
    )
  })
})
