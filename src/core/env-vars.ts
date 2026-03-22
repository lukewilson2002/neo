import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_USER,
  DEFAULT_DB_PASSWORD,
} from "../constants"
import type { ResolvedConfig, AllocatedPorts } from "../types"

export function generateEnvVars(
  config: ResolvedConfig,
  ports: AllocatedPorts
): Record<string, string> {
  const vars: Record<string, string> = {}

  if (config.services.postgres.enabled && ports.postgres) {
    vars.DATABASE_URL = `postgresql://${DEFAULT_DB_USER}:${DEFAULT_DB_PASSWORD}@localhost:${ports.postgres}/${DEFAULT_DB_NAME}`
  }

  if (config.services.redis.enabled && ports.redis) {
    vars.REDIS_URL = `redis://localhost:${ports.redis}`
  }

  if (config.services.s3.enabled && ports.s3) {
    vars.S3_ENDPOINT = `http://localhost:${ports.s3}`
  }

  if (config.services.s3.enabled && ports.s3Console) {
    vars.S3_CONSOLE_URL = `http://localhost:${ports.s3Console}`
  }

  return vars
}

export function formatEnvVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
}
