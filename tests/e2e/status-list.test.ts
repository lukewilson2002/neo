import { describe, it, expect, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"

describe("neo status + neo list", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-status-list")

  afterAll(async () => {
    await runNeo(["down"], { cwd: repo.dir, env: { ...ctx.env } })
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("neo list shows the environment after neo up", async () => {
    await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })

    const result = await runNeo(["list"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("feature-status-list")
  }, 90_000)

  it("neo status shows environment details", async () => {
    const result = await runNeo(["status"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("feature-status-list")
    expect(result.stdout).toContain("Postgres")
  })
})
