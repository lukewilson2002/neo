import { describe, it, expect } from "bun:test"
import { generateEnvVars, formatEnvVars } from "../../src/core/env-vars"
import type { ResolvedConfig, AllocatedPorts } from "../../src/types"

describe("generateEnvVars", () => {
  it("generates all env vars when all services enabled", () => {
    const config: ResolvedConfig = {
      services: {
        postgres: { enabled: true, version: "17" },
        redis: { enabled: true, version: "7" },
        s3: { enabled: true },
      },
      hooks: {},
    }
    const ports: AllocatedPorts = {
      postgres: 50001,
      redis: 50002,
      s3: 50003,
      s3Console: 50004,
    }

    const vars = generateEnvVars(config, ports)
    expect(vars.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:50001/neobase"
    )
    expect(vars.REDIS_URL).toBe("redis://localhost:50002")
    expect(vars.S3_ENDPOINT).toBe("http://localhost:50003")
    expect(vars.S3_CONSOLE_URL).toBe("http://localhost:50004")
  })

  it("omits vars for disabled services", () => {
    const config: ResolvedConfig = {
      services: {
        postgres: { enabled: true, version: "17" },
        redis: { enabled: false, version: "7" },
        s3: { enabled: false },
      },
      hooks: {},
    }
    const ports: AllocatedPorts = { postgres: 50001 }

    const vars = generateEnvVars(config, ports)
    expect(vars.DATABASE_URL).toBeDefined()
    expect(vars).not.toHaveProperty("REDIS_URL")
    expect(vars).not.toHaveProperty("S3_ENDPOINT")
    expect(vars).not.toHaveProperty("S3_CONSOLE_URL")
  })

  it("generates correct format string output", () => {
    const config: ResolvedConfig = {
      services: {
        postgres: { enabled: true, version: "17" },
        redis: { enabled: false, version: "7" },
        s3: { enabled: false },
      },
      hooks: {},
    }
    const ports: AllocatedPorts = { postgres: 50001 }

    const vars = generateEnvVars(config, ports)
    const lines = formatEnvVars(vars)
    expect(lines).toBe(
      "DATABASE_URL=postgresql://postgres:postgres@localhost:50001/neobase"
    )
  })
})
