import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { readProjectState } from "../core/state"
import { envVarsFromPorts, formatEnvVars } from "../core/env-vars"
import { exitWithError } from "../ui/errors"

export const envCommand = new Command("env")
  .description("Print connection strings for current environment")
  .action(() => {
    const branch = getCurrentBranch()
    const envName = sanitizeBranch(branch)
    const projectId = getProjectId()

    const state = readProjectState(projectId)
    const env = state?.environments.find((e) => e.name === envName)

    if (!env) {
      exitWithError(
        `No active environment for branch "${branch}".`,
        "Run 'neo up' first."
      )
    }

    const vars = envVarsFromPorts(env.ports)
    console.log(formatEnvVars(vars))
  })
