import { describe, it, expect, afterAll } from "bun:test"
import { TestContext } from "../helpers/test-context"
import { buildComposeSpec, serializeCompose } from "../../src/core/compose"
import { dockerComposeUp, dockerComposeDown } from "../../src/core/docker"
import { waitForHealthy } from "../../src/core/health"
import { findFreePorts } from "../../src/core/ports"
import type { ResolvedConfig } from "../../src/types"

describe("health checks with real Docker", () => {
  const ctx = TestContext.create()

  afterAll(async () => {
    dockerComposeDown(ctx.projectId, true)
    await ctx.cleanup()
  })

  it("starts services and waits for healthy", async () => {
    const ports = await findFreePorts(4)
    const config: ResolvedConfig = {
      services: {
        postgres: { enabled: true, version: "17" },
        redis: { enabled: true, version: "7" },
        s3: { enabled: true },
      },
      hooks: {},
    }
    const allocatedPorts = {
      postgres: ports[0]!,
      redis: ports[1]!,
      s3: ports[2]!,
      s3Console: ports[3]!,
    }

    const spec = buildComposeSpec(config, allocatedPorts)
    const yaml = serializeCompose(spec)

    const upResult = dockerComposeUp(yaml, ctx.projectId)
    expect(upResult.exitCode).toBe(0)

    // Wait for all services to be healthy
    await waitForHealthy(ctx.projectId, 60_000)
  }, 90_000) // 90s timeout for container pull + startup
})
