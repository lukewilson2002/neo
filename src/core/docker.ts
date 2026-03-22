import { spawnSync } from "node:child_process"
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"

let cachedComposeCommand: string[] | null = null

export function getDockerComposeCommand(): string[] {
  if (cachedComposeCommand) return cachedComposeCommand

  // Try Docker Compose v2 (plugin)
  const v2 = spawnSync("docker", ["compose", "version"], { stdio: "pipe" })
  if (v2.status === 0) {
    cachedComposeCommand = ["docker", "compose"]
    return cachedComposeCommand
  }

  // Try Docker Compose v1 (standalone)
  const v1 = spawnSync("docker-compose", ["version"], { stdio: "pipe" })
  if (v1.status === 0) {
    cachedComposeCommand = ["docker-compose"]
    return cachedComposeCommand
  }

  throw new Error(
    "Docker Compose not found. Install Docker Desktop (includes Compose v2): https://docs.docker.com/get-docker/"
  )
}

export function isDockerAvailable(): boolean {
  const result = spawnSync("docker", ["info"], { stdio: "pipe" })
  return result.status === 0
}

export interface ComposeRunResult {
  stdout: string
  stderr: string
  exitCode: number
}

function runCompose(
  args: string[],
  projectName?: string,
  composeFile?: string
): ComposeRunResult {
  const cmd = getDockerComposeCommand()
  const fullArgs = [...cmd.slice(1)]

  if (projectName) fullArgs.push("-p", projectName)
  if (composeFile) fullArgs.push("-f", composeFile)
  fullArgs.push(...args)

  const result = spawnSync(cmd[0]!, fullArgs, {
    stdio: "pipe",
    encoding: "utf-8",
  })

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  }
}

export function dockerComposeUp(
  composeYaml: string,
  projectName: string
): ComposeRunResult {
  const tmpFile = join(
    tmpdir(),
    `neo-compose-${randomBytes(4).toString("hex")}.yml`
  )

  try {
    writeFileSync(tmpFile, composeYaml)
    return runCompose(["up", "-d", "--wait"], projectName, tmpFile)
  } finally {
    try {
      unlinkSync(tmpFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

export function dockerComposeDown(
  projectName: string,
  removeVolumes: boolean = false
): ComposeRunResult {
  const args = ["down"]
  if (removeVolumes) args.push("-v")
  return runCompose(args, projectName)
}

export function dockerComposePs(projectName: string): ComposeRunResult {
  return runCompose(["ps", "--format", "json"], projectName)
}
