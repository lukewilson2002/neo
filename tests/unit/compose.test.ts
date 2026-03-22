import { describe, it, expect } from "bun:test"
import { buildComposeSpec, serializeCompose } from "../../src/core/compose"
import type { ResolvedConfig, AllocatedPorts } from "../../src/types"

function makeConfig(overrides?: Partial<ResolvedConfig>): ResolvedConfig {
  return {
    services: {
      postgres: { enabled: true, version: "17" },
      redis: { enabled: true, version: "7" },
      s3: { enabled: true },
    },
    hooks: {},
    ...overrides,
  }
}

function makePorts(): AllocatedPorts {
  return { postgres: 50001, redis: 50002, s3: 50003, s3Console: 50004 }
}

describe("buildComposeSpec", () => {
  it("includes all three services when enabled", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services).toHaveProperty("postgres")
    expect(spec.services).toHaveProperty("redis")
    expect(spec.services).toHaveProperty("minio")
  })

  it("uses correct postgres image and version", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.postgres!.image).toBe("postgres:17")
  })

  it("uses pinned postgres version", () => {
    const config = makeConfig({
      services: {
        postgres: { enabled: true, version: "15" },
        redis: { enabled: true, version: "7" },
        s3: { enabled: true },
      },
    })
    const spec = buildComposeSpec(config, makePorts())
    expect(spec.services.postgres!.image).toBe("postgres:15")
  })

  it("maps postgres port correctly", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.postgres!.ports).toContain("50001:5432")
  })

  it("maps redis port correctly", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.redis!.ports).toContain("50002:6379")
  })

  it("maps minio ports correctly (API + console)", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.minio!.ports).toContain("50003:9000")
    expect(spec.services.minio!.ports).toContain("50004:9001")
  })

  it("omits disabled services", () => {
    const config = makeConfig({
      services: {
        postgres: { enabled: true, version: "17" },
        redis: { enabled: false, version: "7" },
        s3: { enabled: false },
      },
    })
    const ports: AllocatedPorts = { postgres: 50001 }
    const spec = buildComposeSpec(config, ports)
    expect(spec.services).toHaveProperty("postgres")
    expect(spec.services).not.toHaveProperty("redis")
    expect(spec.services).not.toHaveProperty("minio")
  })

  it("includes health checks for postgres", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.postgres!.healthcheck).toBeDefined()
    expect(spec.services.postgres!.healthcheck.test).toBeDefined()
  })

  it("includes health checks for redis", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.redis!.healthcheck).toBeDefined()
  })

  it("includes health checks for minio", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.services.minio!.healthcheck).toBeDefined()
  })

  it("includes volumes for postgres", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    expect(spec.volumes).toHaveProperty("postgres_data")
  })
})

describe("serializeCompose", () => {
  it("produces valid YAML string", () => {
    const spec = buildComposeSpec(makeConfig(), makePorts())
    const yaml = serializeCompose(spec)
    expect(typeof yaml).toBe("string")
    expect(yaml).toContain("postgres:17")
    expect(yaml).toContain("redis:7")
    expect(yaml).toContain("minio/minio")
  })
})
