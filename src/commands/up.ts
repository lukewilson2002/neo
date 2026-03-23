import { Command } from "commander"
import { loadConfig, resolveConfig } from "../core/config"
import { getCurrentBranch, sanitizeBranch } from "../core/branch"
import { getProjectId } from "../core/project"
import { findFreePorts } from "../core/ports"
import { buildComposeSpec, serializeCompose } from "../core/compose"
import { isDockerAvailable, dockerComposeUp } from "../core/docker"
import { executeHook } from "../core/hooks"
import { generateEnvVars } from "../core/env-vars"
import { addEnvironment, readProjectState } from "../core/state"
import { success, info } from "../ui/output"
import { exitWithError } from "../ui/errors"
import type { CliFlags, AllocatedPorts } from "../types"

export const upCommand = new Command("up")
  .description("Start services for current branch environment")
  .option("--no-postgres", "Disable Postgres")
  .option("--no-redis", "Disable Redis")
  .option("--no-s3", "Disable S3 (MinIO)")
  .option("--postgres <version>", "Pin Postgres version")
  .option("--redis <version>", "Pin Redis version")
  .action(async (options) => {
    if (!isDockerAvailable()) {
      exitWithError(
        "Docker is not running.",
        "Start Docker Desktop and try again."
      )
    }

    const branch = getCurrentBranch()
    const envName = sanitizeBranch(branch)
    const projectId = getProjectId()
    const composeProjectName = `${projectId}-${envName}`

    const flags: CliFlags = {
      postgres: typeof options.postgres === "string" ? options.postgres : undefined,
      redis: typeof options.redis === "string" ? options.redis : undefined,
      noPostgres: options.postgres === false,
      noRedis: options.redis === false,
      noS3: options.s3 === false,
    }

    const fileConfig = loadConfig(process.cwd())
    const config = resolveConfig(fileConfig, flags)

    info(`Environment: ${envName}`)

    const enabledServices: string[] = []
    let portCount = 0
    if (config.services.postgres.enabled) { enabledServices.push("postgres"); portCount++ }
    if (config.services.redis.enabled) { enabledServices.push("redis"); portCount++ }
    if (config.services.s3.enabled) { enabledServices.push("s3"); portCount += 2 }

    if (portCount === 0) {
      exitWithError("No services enabled.", "Enable at least one service.")
    }

    const existingState = readProjectState(projectId)
    const existingEnv = existingState?.environments.find((e) => e.name === envName)

    let ports: AllocatedPorts

    if (existingEnv) {
      ports = existingEnv.ports
      info("  Environment already exists, re-checking health...")
    } else {
      const freePorts = await findFreePorts(portCount)
      let idx = 0
      ports = {}
      if (config.services.postgres.enabled) ports.postgres = freePorts[idx++]
      if (config.services.redis.enabled) ports.redis = freePorts[idx++]
      if (config.services.s3.enabled) {
        ports.s3 = freePorts[idx++]
        ports.s3Console = freePorts[idx++]
      }
    }

    const spec = buildComposeSpec(config, ports)
    const yaml = serializeCompose(spec)

    // --wait makes Docker Compose wait for health checks before returning
    const upResult = dockerComposeUp(yaml, composeProjectName)
    if (upResult.exitCode !== 0) {
      exitWithError(`Failed to start services: ${upResult.stderr}`)
    }

    if (config.services.postgres.enabled) success(`Postgres (${config.services.postgres.version}) → localhost:${ports.postgres}`)
    if (config.services.redis.enabled) success(`Redis (${config.services.redis.version}) → localhost:${ports.redis}`)
    if (config.services.s3.enabled) success(`MinIO → localhost:${ports.s3} (console: ${ports.s3Console})`)

    addEnvironment(projectId, {
      name: envName,
      ports,
      services: enabledServices,
      startedAt: new Date().toISOString(),
      projectId,
    })

    const envVars = generateEnvVars(config, ports)
    if (config.hooks.up) {
      info("")
      info(`Running hook: ${config.hooks.up}`)
      try {
        executeHook(config.hooks.up, envVars)
        success("Hook completed.")
      } catch (err) {
        exitWithError(err instanceof Error ? err.message : String(err))
      }
    }
  })
