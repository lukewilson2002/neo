import { describe, it, expect, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"

describe("neo up idempotency", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-idempotent")

  afterAll(async () => {
    await runNeo(["down"], { cwd: repo.dir, env: { ...ctx.env } })
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("neo up twice succeeds without error", async () => {
    const first = await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(first.exitCode).toBe(0)

    const second = await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(second.exitCode).toBe(0)
    expect(second.stdout).toContain("already exists")
  }, 90_000)
})
