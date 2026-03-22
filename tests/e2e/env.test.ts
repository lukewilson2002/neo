import { describe, it, expect, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"
import { dockerComposeDown } from "../../src/core/docker"

describe("neo env", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-test-env")

  afterAll(async () => {
    const projectId = repo.dir.split("/").pop()!
    dockerComposeDown(`${projectId}-feature-test-env`, true)
    await runNeo(["down"], { cwd: repo.dir, env: { ...ctx.env } })
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("outputs KEY=VALUE env vars after neo up", async () => {
    // Start services first
    await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })

    // Now get env vars
    const result = await runNeo(["env"], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("DATABASE_URL=postgresql://")
    expect(result.stdout).toContain("REDIS_URL=redis://")
    expect(result.stdout).toContain("S3_ENDPOINT=http://")
    expect(result.stdout).toContain("S3_CONSOLE_URL=http://")
  }, 90_000)
})
