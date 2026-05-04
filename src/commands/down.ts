import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import {
  readProjectState,
  removeEnvironment,
  writeProjectState,
} from "../core/state"
import { dockerComposeDown } from "../core/docker"
import { success, info } from "../ui/output"
import { exitWithError } from "../ui/errors"

export const downCommand = new Command("down")
  .description("Stop environment services")
  .argument("[name]", "Environment name to stop")
  .option("--all", "Stop all environments for current project")
  .action((name: string | undefined, options: { all?: boolean }) => {
    const projectId = getProjectId()

    if (options.all) {
      const state = readProjectState(projectId)
      if (!state || state.environments.length === 0) {
        info("No active environments.")
        return
      }

      for (const env of state.environments) {
        const composeProjectName = `${projectId}-${env.name}`
        dockerComposeDown(composeProjectName)
        success(`Stopped ${env.name}`)
      }

      writeProjectState(projectId, { environments: [] })
      return
    }

    const envName = name ?? sanitizeBranch(getCurrentBranch())
    const composeProjectName = `${projectId}-${envName}`

    const state = readProjectState(projectId)
    const env = state?.environments.find((e) => e.name === envName)

    if (!env) {
      exitWithError(
        `No active environment "${envName}".`,
        "Run 'neo list' to see active environments.",
      )
    }

    dockerComposeDown(composeProjectName)
    removeEnvironment(projectId, envName)
    success(`Stopped ${envName}`)
  })
