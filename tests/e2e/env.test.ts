import { describe, it, expect, afterAll } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
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

  it("creates .env with -w when file does not exist", async () => {
    const envPath = join(repo.dir, ".env.new")
    const result = await runNeo(["env", "-w", envPath], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/Updated .* \(\d+ added, \d+ changed\)/)

    const written = readFileSync(envPath, "utf-8")
    expect(written).toContain("DATABASE_URL=postgresql://")
    expect(written).toContain("REDIS_URL=redis://")
    expect(written).toContain("S3_ENDPOINT=http://")
    expect(written).toContain("S3_CONSOLE_URL=http://")
  }, 30_000)

  it("merges into existing .env, preserving comments and rewriting stale values", async () => {
    const envPath = join(repo.dir, ".env.merge")
    writeFileSync(
      envPath,
      "# my secrets\nAPI_KEY=keep-me\nDATABASE_URL=postgresql://stale:0/old\n"
    )

    const result = await runNeo(["env", "-w", envPath], {
      cwd: repo.dir,
      env: { ...ctx.env },
    })

    expect(result.exitCode).toBe(0)

    const written = readFileSync(envPath, "utf-8")
    expect(written).toContain("# my secrets")
    expect(written).toContain("API_KEY=keep-me")
    expect(written).toContain("DATABASE_URL=postgresql://postgres:")
    expect(written).not.toContain("postgresql://stale:0/old")
    expect(written).toContain("REDIS_URL=redis://")
  }, 30_000)
})
