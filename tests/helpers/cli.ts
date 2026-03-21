import { resolve } from "node:path"

const CLI_PATH = resolve(import.meta.dir, "../../src/index.ts")

export interface CliResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function runNeo(
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> }
): Promise<CliResult> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd: options?.cwd,
    env: { ...process.env, ...options?.env },
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const exitCode = await proc.exited

  return { stdout, stderr, exitCode }
}
