export const PORT_RANGE_START = 50000
export const PORT_RANGE_END = 59999

export const DEFAULT_POSTGRES_VERSION = "17"
export const DEFAULT_REDIS_VERSION = "7"

export const HEALTH_CHECK_TIMEOUT_MS = 30_000
export const HEALTH_CHECK_INTERVAL_MS = 500

export const DEFAULT_DB_NAME = "neo"
export const DEFAULT_DB_USER = "postgres"
export const DEFAULT_DB_PASSWORD = "postgres"

export const STATE_DIR_ENV_VAR = "NEO_STATE_DIR"

export const GITHUB_REPO = "lukewilson2002/neo"
export const UPDATE_CHECK_TTL_MS = 24 * 60 * 60 * 1000
export const UPDATE_CHECK_TIMEOUT_MS = 2_000
// Read-only / fast-exit commands where we skip the background refresh fetch
// to avoid extending exit time for piped/scripted use.
export const FAST_COMMANDS = new Set([
  "env",
  "status",
  "list",
  "--help",
  "-h",
  "--version",
  "-V",
  "help",
])
