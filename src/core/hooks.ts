import { spawnSync } from "node:child_process"

export function executeHook(
  command: string,
  envVars: Record<string, string>,
  cwd?: string
): void {
  if (!command.trim()) return

  const result = spawnSync("sh", ["-c", command], {
    cwd,
    env: { ...process.env, ...envVars },
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(
      `Hook failed with exit code ${result.status}: ${command}`
    )
  }
}
