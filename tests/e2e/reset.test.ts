import { describe, it, expect, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"

describe("neo reset", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-reset")

  afterAll(async () => {
    await runNeo(["down"], { cwd: repo.dir, env: { ...ctx.env } }).catch(() => {})
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("resets the environment (destroys volumes)", async () => {
    // Start first
    await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })

    // Reset
    const result = await runNeo(["reset"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Reset")
    expect(result.stdout).toContain("volumes destroyed")

    // Verify environment is removed from state
    const list = await runNeo(["list"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(list.stdout).toContain("No active environments")
  }, 90_000)
})
