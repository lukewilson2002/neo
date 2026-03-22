import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { readProjectState } from "../core/state"
import { generateEnvVars, formatEnvVars } from "../core/env-vars"
import { resolveConfig } from "../core/config"
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

    // Reconstruct config from stored services to generate env vars
    const config = resolveConfig(null, {})
    // Only include services that were started
    config.services.postgres.enabled = env.services.includes("postgres")
    config.services.redis.enabled = env.services.includes("redis")
    config.services.s3.enabled = env.services.includes("s3")

    const vars = generateEnvVars(config, env.ports)
    console.log(formatEnvVars(vars))
  })
