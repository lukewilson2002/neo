import { spawnSync } from "node:child_process"
import { basename } from "node:path"

function sanitizeProjectId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function parseProjectIdFromRemote(remoteUrl: string): string | null {
  if (!remoteUrl) return null

  // Handle SSH: git@github.com:user/repo.git
  // Handle HTTPS: https://github.com/user/repo.git
  const match = remoteUrl.match(/[/:]([^/:]+?)(?:\.git)?$/)
  return match?.[1] ?? null
}

export function getProjectId(cwd?: string): string {
  const result = spawnSync("git", ["remote", "get-url", "origin"], {
    cwd,
    encoding: "utf-8",
  })

  if (result.status === 0) {
    const parsed = parseProjectIdFromRemote(result.stdout.trim())
    if (parsed) return sanitizeProjectId(parsed)
  }

  // Fallback: use directory name
  const dir = cwd ?? process.cwd()
  return sanitizeProjectId(basename(dir))
}
