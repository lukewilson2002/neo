import { describe, it, expect, afterEach } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestRepo } from "../helpers/test-repo"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

describe("neo init", () => {
  let repo: TestRepo

  afterEach(async () => {
    await repo?.cleanup()
  })

  it("creates neo.toml with default versions", async () => {
    repo = TestRepo.create()

    const result = await runNeo(["init"], { cwd: repo.dir })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Created neo.toml")

    const tomlPath = join(repo.dir, "neo.toml")
    expect(existsSync(tomlPath)).toBe(true)

    const content = readFileSync(tomlPath, "utf-8")
    expect(content).toContain('postgres = "17"')
    expect(content).toContain('redis = "7"')
    expect(content).toContain("s3 = true")
  })

  it("refuses to overwrite existing neo.toml", async () => {
    repo = TestRepo.create()

    // First init
    await runNeo(["init"], { cwd: repo.dir })

    // Second init should fail
    const result = await runNeo(["init"], { cwd: repo.dir })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("already exists")
  })
})
