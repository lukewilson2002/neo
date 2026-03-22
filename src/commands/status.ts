import { Command } from "commander"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { readProjectState } from "../core/state"
import { dockerComposePs } from "../core/docker"
import { info } from "../ui/output"
import { exitWithError } from "../ui/errors"

export const statusCommand = new Command("status")
  .description("Show health, ports, and uptime for an environment")
  .argument("[name]", "Environment name to check")
  .action((name?: string) => {
    const projectId = getProjectId()
    const envName = name ?? sanitizeBranch(getCurrentBranch())

    const state = readProjectState(projectId)
    const env = state?.environments.find((e) => e.name === envName)

    if (!env) {
      exitWithError(
        `No active environment "${envName}".`,
        "Run 'neo up' first."
      )
    }

    info(`Environment: ${env.name}`)
    info(`Project:     ${env.projectId}`)
    info(`Started:     ${env.startedAt}`)
    info(`Services:    ${env.services.join(", ")}`)
    info("")

    if (env.ports.postgres) info(`  Postgres → localhost:${env.ports.postgres}`)
    if (env.ports.redis) info(`  Redis    → localhost:${env.ports.redis}`)
    if (env.ports.s3) info(`  MinIO    → localhost:${env.ports.s3} (console: ${env.ports.s3Console})`)

    info("")

    // Show Docker container status
    const ps = dockerComposePs(`${projectId}-${envName}`)
    if (ps.stdout.trim()) {
      info("Containers:")
      info(ps.stdout)
    }
  })
