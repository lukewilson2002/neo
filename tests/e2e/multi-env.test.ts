import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { runNeo } from "../helpers/cli"
import { TestContext } from "../helpers/test-context"
import { TestRepo } from "../helpers/test-repo"
import { spawnSync } from "node:child_process"

describe("multiple environments coexist", () => {
  const ctx = TestContext.create()
  const repoA = TestRepo.create("feature-alpha")
  const repoB = TestRepo.create("feature-beta")

  const sharedRemote = "https://github.com/test/multi-env-test.git"

  beforeAll(() => {
    spawnSync("git", ["remote", "add", "origin", sharedRemote], { cwd: repoA.dir })
    spawnSync("git", ["remote", "add", "origin", sharedRemote], { cwd: repoB.dir })
  })

  afterAll(async () => {
    await runNeo(["down"], { cwd: repoA.dir, env: { ...ctx.env } }).catch(() => {})
    await runNeo(["down"], { cwd: repoB.dir, env: { ...ctx.env } }).catch(() => {})
    await ctx.cleanup()
    await repoA.cleanup()
    await repoB.cleanup()
  })

  it("two branches get independent environments with different ports", async () => {
    const upA = await runNeo(["up"], { cwd: repoA.dir, env: { ...ctx.env } })
    expect(upA.exitCode).toBe(0)

    const upB = await runNeo(["up"], { cwd: repoB.dir, env: { ...ctx.env } })
    expect(upB.exitCode).toBe(0)

    const list = await runNeo(["list"], { cwd: repoA.dir, env: { ...ctx.env } })
    expect(list.exitCode).toBe(0)
    expect(list.stdout).toContain("feature-alpha")
    expect(list.stdout).toContain("feature-beta")

    const envA = await runNeo(["env"], { cwd: repoA.dir, env: { ...ctx.env } })
    const envB = await runNeo(["env"], { cwd: repoB.dir, env: { ...ctx.env } })
    expect(envA.exitCode).toBe(0)
    expect(envB.exitCode).toBe(0)

    const portA = envA.stdout.match(/localhost:(\d+)\/neobase/)?.[1]
    const portB = envB.stdout.match(/localhost:(\d+)\/neobase/)?.[1]
    expect(portA).toBeDefined()
    expect(portB).toBeDefined()
    expect(portA).not.toBe(portB)

    await runNeo(["down"], { cwd: repoA.dir, env: { ...ctx.env } })
    const listAfter = await runNeo(["list"], { cwd: repoB.dir, env: { ...ctx.env } })
    expect(listAfter.stdout).toContain("feature-beta")
    expect(listAfter.stdout).not.toContain("feature-alpha")
  }, 120_000)
})
