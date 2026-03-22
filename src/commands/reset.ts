import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { readProjectState, removeEnvironment, writeProjectState } from "../core/state"
import { dockerComposeDown } from "../core/docker"
import { success, info } from "../ui/output"
import { exitWithError } from "../ui/errors"

export const resetCommand = new Command("reset")
  .description("Destroy volumes and re-provision current environment")
  .option("--all", "Reset all environments for current project")
  .action((options: { all?: boolean }) => {
    const projectId = getProjectId()

    if (options.all) {
      const state = readProjectState(projectId)
      if (!state || state.environments.length === 0) {
        info("No active environments to reset.")
        return
      }

      for (const env of state.environments) {
        const composeProjectName = `${projectId}-${env.name}`
        dockerComposeDown(composeProjectName, true)
        success(`Reset ${env.name} (volumes destroyed)`)
      }

      writeProjectState(projectId, { environments: [] })
      info("")
      info("All environments reset. Run 'neo up' to re-provision.")
      return
    }

    const envName = sanitizeBranch(getCurrentBranch())
    const composeProjectName = `${projectId}-${envName}`

    const state = readProjectState(projectId)
    const env = state?.environments.find((e) => e.name === envName)

    if (!env) {
      exitWithError(
        `No active environment "${envName}".`,
        "Run 'neo up' first."
      )
    }

    dockerComposeDown(composeProjectName, true)
    removeEnvironment(projectId, envName)
    success(`Reset ${envName} (volumes destroyed)`)
    info("Run 'neo up' to re-provision.")
  })
