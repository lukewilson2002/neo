import { spawnSync } from "node:child_process"

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function sanitizeBranch(branch: string): string {
  return slugify(branch)
}

export function getCurrentBranch(cwd?: string): string {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
    encoding: "utf-8",
  })

  if (result.status !== 0) {
    throw new Error(
      `Failed to detect git branch. Are you in a git repository?\n  ${result.stderr?.trim()}`
    )
  }

  const branch = result.stdout.trim()

  if (branch === "HEAD") {
    throw new Error(
      "Cannot detect branch (detached HEAD). Checkout a branch: git checkout -b <name>"
    )
  }

  return branch
}
