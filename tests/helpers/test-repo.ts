import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

export class TestRepo {
  readonly dir: string
  readonly branch: string

  private constructor(dir: string, branch: string) {
    this.dir = dir
    this.branch = branch
  }

  static create(branch: string = "test-branch"): TestRepo {
    const dir = mkdtempSync(join(tmpdir(), "neo-repo-"))

    spawnSync("git", ["init"], { cwd: dir })
    spawnSync("git", ["checkout", "-b", branch], { cwd: dir })
    spawnSync("git", ["config", "user.email", "test@test.com"], { cwd: dir })
    spawnSync("git", ["config", "user.name", "Test"], { cwd: dir })
    // Create an initial commit so the branch is fully established
    spawnSync("git", ["commit", "--allow-empty", "-m", "init"], { cwd: dir })

    return new TestRepo(dir, branch)
  }

  async cleanup(): Promise<void> {
    rmSync(this.dir, { recursive: true, force: true })
  }
}
