# Task Worker

Basic workspace task support for LVCE Editor. The first supported configuration is JSON in `.lvce/tasks.json` with a `tasks` array. A default build task has `group: { "kind": "build", "isDefault": true }`, a non-empty `command`, and optional string `args`.

Example:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": { "kind": "build", "isDefault": true }
    }
  ]
}
```

The task worker validates the file and selects the explicitly configured default build task. It does not support JSONC, task variables, dependencies, problem matchers, or multiple workspace folders yet.
