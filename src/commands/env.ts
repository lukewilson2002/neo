import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs"
import { dirname } from "node:path"
import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { readProjectState } from "../core/state"
import {
  envVarsFromPorts,
  formatEnvVars,
  mergeEnvFile,
} from "../core/env-vars"
import { exitWithError } from "../ui/errors"
import { success } from "../ui/output"

export const envCommand = new Command("env")
  .description("Print connection strings, or merge them into an env file")
  .option("-w, --write <path>", "Merge env vars into <path>, updating in place")
  .action((options: { write?: string }) => {
    const branch = getCurrentBranch()
    const envName = sanitizeBranch(branch)
    const projectId = getProjectId()

    const state = readProjectState(projectId)
    const env = state?.environments.find((e) => e.name === envName)

    if (!env) {
      exitWithError(
        `No active environment for branch "${branch}".`,
        "Run 'neo up' first.",
      )
    }

    const vars = envVarsFromPorts(env.ports)

    if (options.write) {
      writeEnvToFile(options.write, vars)
      return
    }

    console.log(formatEnvVars(vars))
  })

function writeEnvToFile(path: string, vars: Record<string, string>): void {
  let existing = ""
  try {
    existing = readFileSync(path, "utf-8")
  } catch (err: unknown) {
    if (
      !(
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "ENOENT"
      )
    ) {
      throw err
    }
  }

  const result = mergeEnvFile(existing, vars)

  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, result.content)
  renameSync(tmp, path)

  if (result.added.length === 0 && result.changed.length === 0) {
    success(`No changes to ${path}`)
  } else {
    success(
      `Updated ${path} (${result.added.length} added, ${result.changed.length} changed)`,
    )
  }
}
