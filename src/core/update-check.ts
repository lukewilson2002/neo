import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs"
import { join } from "node:path"
import { getStateDir } from "./state"
import {
  GITHUB_REPO,
  UPDATE_CHECK_TTL_MS,
  UPDATE_CHECK_TIMEOUT_MS,
  FAST_COMMANDS,
} from "../constants"

export interface UpdateCache {
  checkedAt: string
  latestVersion: string
}

export interface UpdateNotice {
  current: string
  latest: string
}

function cachePath(): string {
  return join(getStateDir(), "update-check.json")
}

export function readCache(): UpdateCache | null {
  try {
    const raw = readFileSync(cachePath(), "utf-8")
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.checkedAt === "string" &&
      typeof parsed?.latestVersion === "string"
    ) {
      return parsed as UpdateCache
    }
    return null
  } catch {
    return null
  }
}

export function writeCache(cache: UpdateCache): void {
  const path = cachePath()
  mkdirSync(getStateDir(), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(cache, null, 2))
  renameSync(tmp, path)
}

export function isCacheStale(
  cache: UpdateCache | null,
  now: number = Date.now()
): boolean {
  if (!cache) return true
  const checkedAt = Date.parse(cache.checkedAt)
  if (Number.isNaN(checkedAt)) return true
  return now - checkedAt >= UPDATE_CHECK_TTL_MS
}

// Compares two semver-like versions ("1.2.3" or "v1.2.3"). Returns -1, 0, or 1.
// Pre-release suffixes (e.g. "1.2.3-beta.1") are treated as lower than the
// release; ordering between distinct pre-releases is lexicographic on the
// suffix, which is good enough for "is there a newer release".
export function compareVersions(a: string, b: string): number {
  const norm = (s: string) => s.replace(/^v/, "")
  const [aCore, aPre = ""] = norm(a).split("-", 2) as [string, string?]
  const [bCore, bPre = ""] = norm(b).split("-", 2) as [string, string?]

  const aParts = aCore.split(".").map((n) => Number.parseInt(n, 10) || 0)
  const bParts = bCore.split(".").map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < len; i++) {
    const ai = aParts[i] ?? 0
    const bi = bParts[i] ?? 0
    if (ai !== bi) return ai < bi ? -1 : 1
  }

  if (aPre === bPre) return 0
  if (aPre === "") return 1   // release > pre-release
  if (bPre === "") return -1
  return aPre < bPre ? -1 : 1
}

export function isUpdateAvailable(
  current: string,
  cache: UpdateCache | null
): boolean {
  if (!cache) return false
  return compareVersions(cache.latestVersion, current) > 0
}

export async function fetchLatestVersion(
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        signal,
        headers: { Accept: "application/vnd.github+json" },
      }
    )
    if (!res.ok) return null
    const body = (await res.json()) as { tag_name?: unknown }
    if (typeof body.tag_name !== "string") return null
    return body.tag_name.replace(/^v/, "")
  } catch {
    return null
  }
}

function isDisabled(): boolean {
  if (process.env["NEO_NO_UPDATE_CHECK"]) return true
  if (process.env["CI"]) return true
  return false
}

export function isFastCommand(argv: readonly string[]): boolean {
  // The subcommand is at different positions depending on how neo was invoked:
  //   compiled binary:    argv = [./neo, "up", ...]                → index 1
  //   bun run <script>:   argv = [bun, "src/index.ts", "up", ...]  → index 2
  // Skip any entry that looks like a script path, then check the next.
  for (let i = 1; i <= 2 && i < argv.length; i++) {
    const a = argv[i]
    if (!a) continue
    if (a.endsWith(".ts") || a.endsWith(".js") || a.endsWith(".mjs")) continue
    return FAST_COMMANDS.has(a)
  }
  // No subcommand → likely `neo` with no args (commander shows help).
  return true
}

export function startUpdateCheck(currentVersion: string): {
  printNoticeOnExit: () => void
} {
  const noop = { printNoticeOnExit: () => {} }
  if (isDisabled()) return noop

  const cache = readCache()
  let notice: UpdateNotice | null = null
  if (isUpdateAvailable(currentVersion, cache) && cache) {
    notice = { current: currentVersion, latest: cache.latestVersion }
  }

  if (isCacheStale(cache) && !isFastCommand(process.argv)) {
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      UPDATE_CHECK_TIMEOUT_MS
    )
    // Don't keep the event loop alive solely for the timeout.
    timer.unref?.()

    void fetchLatestVersion(controller.signal)
      .then((latest) => {
        clearTimeout(timer)
        if (!latest) return
        try {
          writeCache({
            checkedAt: new Date().toISOString(),
            latestVersion: latest,
          })
        } catch {
          // Cache write failures are non-fatal; we'll retry next stale check.
        }
      })
      .catch(() => clearTimeout(timer))
  }

  return {
    printNoticeOnExit: () => {
      if (!notice) return
      // Only show on a real terminal; never pollute pipes/scripts.
      if (!process.stderr.isTTY) return
      printNotice(notice)
    },
  }
}

function printNotice(notice: UpdateNotice): void {
  const useColor = !process.env["NO_COLOR"] && process.stderr.isTTY
  const cyan = useColor ? "\x1b[36m" : ""
  const dim = useColor ? "\x1b[2m" : ""
  const reset = useColor ? "\x1b[0m" : ""
  process.stderr.write(
    `\n${cyan}neo ${notice.latest} is available${reset} ${dim}(you have ${notice.current})${reset}\n` +
      `  Update: ${dim}curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/main/install.sh | sh${reset}\n`
  )
}
