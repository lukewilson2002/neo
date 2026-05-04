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
  return envVarsFromPorts({
    postgres: config.services.postgres.enabled ? ports.postgres : undefined,
    redis: config.services.redis.enabled ? ports.redis : undefined,
    s3: config.services.s3.enabled ? ports.s3 : undefined,
    s3Console: config.services.s3.enabled ? ports.s3Console : undefined,
  })
}

export function envVarsFromPorts(ports: AllocatedPorts): Record<string, string> {
  const vars: Record<string, string> = {}

  if (ports.postgres) {
    vars.DATABASE_URL = `postgresql://${DEFAULT_DB_USER}:${DEFAULT_DB_PASSWORD}@localhost:${ports.postgres}/${DEFAULT_DB_NAME}`
  }

  if (ports.redis) {
    vars.REDIS_URL = `redis://localhost:${ports.redis}`
  }

  if (ports.s3) {
    vars.S3_ENDPOINT = `http://localhost:${ports.s3}`
  }

  if (ports.s3Console) {
    vars.S3_CONSOLE_URL = `http://localhost:${ports.s3Console}`
  }

  return vars
}

export function formatEnvVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
}

export type MergeResult = {
  content: string
  added: string[]
  changed: string[]
}

type QuoteStyle = "double" | "single" | "none"

const ENV_LINE_RE = /^(\s*)(export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/

function detectQuoteStyle(rawValue: string): QuoteStyle {
  if (rawValue.length >= 2) {
    if (rawValue.startsWith('"') && rawValue.endsWith('"')) return "double"
    if (rawValue.startsWith("'") && rawValue.endsWith("'")) return "single"
  }
  return "none"
}

function unquote(rawValue: string, style: QuoteStyle): string {
  if (style === "none") return rawValue
  return rawValue.slice(1, -1)
}

function wrap(value: string, style: QuoteStyle): string {
  if (style === "double") return `"${value}"`
  if (style === "single") return `'${value}'`
  return value
}

export function mergeEnvFile(
  existing: string,
  newVars: Record<string, string>
): MergeResult {
  const lines = existing === "" ? [] : existing.split("\n")
  const handled = new Set<string>()
  const changed: string[] = []
  let fileStyle: QuoteStyle = "none"
  let fileStyleDetected = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const m = line.match(ENV_LINE_RE)
    if (!m) continue
    const leading = m[1] ?? ""
    const exportPrefix = m[2] ?? ""
    const key = m[3] ?? ""
    const rawValue = m[4] ?? ""

    if (!fileStyleDetected) {
      fileStyle = detectQuoteStyle(rawValue)
      fileStyleDetected = true
    }

    if (!(key in newVars) || handled.has(key)) continue

    const lineStyle = detectQuoteStyle(rawValue)
    const existingValue = unquote(rawValue, lineStyle)
    const newValue = newVars[key] ?? ""

    handled.add(key)

    if (existingValue === newValue) continue

    lines[i] = `${leading}${exportPrefix}${key}=${wrap(newValue, lineStyle)}`
    changed.push(key)
  }

  const added = Object.keys(newVars).filter((k) => !handled.has(k))

  let content = lines.join("\n")

  if (added.length > 0) {
    if (content !== "") {
      if (!content.endsWith("\n")) content += "\n"
      if (!content.endsWith("\n\n")) content += "\n"
    }
    content += added
      .map((k) => `${k}=${wrap(newVars[k] ?? "", fileStyle)}`)
      .join("\n")
  }

  if (!content.endsWith("\n")) content += "\n"

  return { content, added, changed }
}
