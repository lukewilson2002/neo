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

describe("neo down <name>", () => {
  const ctx = TestContext.create()
  const repo = TestRepo.create("feature-down-by-name")

  afterAll(async () => {
    await ctx.cleanup()
    await repo.cleanup()
  })

  it("stops an environment by explicit name", async () => {
    // Start environment
    const up = await runNeo(["up"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(up.exitCode).toBe(0)

    // Verify it's listed
    const list = await runNeo(["list"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(list.stdout).toContain("feature-down-by-name")

    // Stop by explicit name (not relying on current branch detection)
    const down = await runNeo(["down", "feature-down-by-name"], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })
    expect(down.exitCode).toBe(0)
    expect(down.stdout).toContain("Stopped")

    // Verify it's gone
    const listAfter = await runNeo(["list"], { cwd: repo.dir, env: { ...ctx.env } })
    expect(listAfter.stdout).toContain("No active environments")
  }, 90_000)
})
