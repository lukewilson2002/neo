import { describe, it, expect, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"
import { dockerComposeDown } from "../../src/core/docker"

describe("neo up + neo down", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-test-up-down")

  afterAll(async () => {
    // Clean up any containers
    const projectId = repo.dir.split("/").pop()!
    dockerComposeDown(`${projectId}-feature-test-up-down`, true)
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("starts services and prints summary", async () => {
    const result = await runNeo(["up"], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Postgres")
    expect(result.stdout).toContain("Redis")
    expect(result.stdout).toContain("MinIO")
  }, 90_000)

  it("neo down stops the environment", async () => {
    const result = await runNeo(["down"], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Stopped")
  })
})
