import { parse as parseTOML } from "smol-toml"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { DEFAULT_POSTGRES_VERSION, DEFAULT_REDIS_VERSION } from "../constants"
import type { NeoConfig, ResolvedConfig, CliFlags } from "../types"

export function parseConfig(tomlContent: string): NeoConfig {
  let parsed: Record<string, unknown> = {}

  if (tomlContent.trim()) {
    try {
      parsed = parseTOML(tomlContent)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Invalid neo.toml: ${msg}`)
    }
  }

  const services = (parsed.services ?? {}) as Record<string, unknown>
  const hooks = (parsed.hooks ?? {}) as Record<string, unknown>

  return {
    services: {
      postgres: (services.postgres as string | boolean) ?? true,
      redis: (services.redis as string | boolean) ?? true,
      s3: (services.s3 as boolean) ?? true,
    },
    hooks: {
      up: hooks.up as string | undefined,
    },
  }
}

export function resolveConfig(
  config: NeoConfig | null,
  flags: CliFlags
): ResolvedConfig {
  const c = config ?? parseConfig("")

  const resolveService = (
    configValue: string | boolean,
    defaultVersion: string,
    flagVersion?: string,
    flagDisable?: boolean
  ) => {
    if (flagDisable) return { enabled: false, version: defaultVersion }
    if (flagVersion) return { enabled: true, version: flagVersion }
    if (configValue === false) return { enabled: false, version: defaultVersion }
    if (typeof configValue === "string") return { enabled: true, version: configValue }
    return { enabled: true, version: defaultVersion }
  }

  return {
    services: {
      postgres: resolveService(
        c.services.postgres,
        DEFAULT_POSTGRES_VERSION,
        flags.postgres,
        flags.noPostgres
      ),
      redis: resolveService(
        c.services.redis,
        DEFAULT_REDIS_VERSION,
        flags.redis,
        flags.noRedis
      ),
      s3: {
        enabled: flags.noS3 ? false : c.services.s3 !== false,
      },
    },
    hooks: c.hooks,
  }
}

export function loadConfig(cwd: string): NeoConfig | null {
  const configPath = join(cwd, "neo.toml")
  if (!existsSync(configPath)) return null
  const content = readFileSync(configPath, "utf-8")
  return parseConfig(content)
}
