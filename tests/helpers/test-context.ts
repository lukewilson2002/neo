import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"

export class TestContext {
  readonly stateDir: string
  readonly projectId: string
  readonly env: Record<string, string>

  private constructor(stateDir: string, projectId: string) {
    this.stateDir = stateDir
    this.projectId = projectId
    this.env = {
      NEO_STATE_DIR: stateDir,
      NEO_NO_UPDATE_CHECK: "1",
    }
  }

  static create(): TestContext {
    const id = randomBytes(4).toString("hex")
    const stateDir = mkdtempSync(join(tmpdir(), "neo-test-"))
    const projectId = `neo-test-${id}`
    return new TestContext(stateDir, projectId)
  }

  async cleanup(): Promise<void> {
    rmSync(this.stateDir, { recursive: true, force: true })
  }
}
