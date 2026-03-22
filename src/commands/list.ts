import { Command } from "commander"
import { getProjectId } from "../core/project"
import { readProjectState } from "../core/state"
import { info } from "../ui/output"

export const listCommand = new Command("list")
  .description("List all active environments for current project")
  .action(() => {
    const projectId = getProjectId()
    const state = readProjectState(projectId)

    if (!state || state.environments.length === 0) {
      info("No active environments.")
      return
    }

    info(`Project: ${projectId}`)
    info("")

    for (const env of state.environments) {
      const services = env.services.join(", ")
      info(`  ${env.name}`)
      info(`    Services: ${services}`)
      info(`    Started:  ${env.startedAt}`)
      if (env.ports.postgres) info(`    Postgres: localhost:${env.ports.postgres}`)
      if (env.ports.redis) info(`    Redis:    localhost:${env.ports.redis}`)
      if (env.ports.s3) info(`    MinIO:    localhost:${env.ports.s3}`)
      info("")
    }
  })
