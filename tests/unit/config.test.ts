import { describe, it, expect } from "bun:test"
import { parseConfig, resolveConfig } from "../../src/core/config"
import type { CliFlags } from "../../src/types"

describe("parseConfig", () => {
  it("parses a full neo.toml", () => {
    const config = parseConfig(`
[services]
postgres = "15"
redis = "6"
s3 = true

[hooks]
up = "npm run migrate"
`)
    expect(config.services.postgres).toBe("15")
    expect(config.services.redis).toBe("6")
    expect(config.services.s3).toBe(true)
    expect(config.hooks.up).toBe("npm run migrate")
  })

  it("handles disabled services", () => {
    const config = parseConfig(`
[services]
postgres = false
redis = "7"
s3 = false
`)
    expect(config.services.postgres).toBe(false)
    expect(config.services.redis).toBe("7")
    expect(config.services.s3).toBe(false)
  })

  it("handles boolean true (use default version)", () => {
    const config = parseConfig(`
[services]
postgres = true
redis = true
s3 = true
`)
    expect(config.services.postgres).toBe(true)
    expect(config.services.redis).toBe(true)
    expect(config.services.s3).toBe(true)
  })

  it("defaults missing sections", () => {
    const config = parseConfig("")
    expect(config.services.postgres).toBe(true)
    expect(config.services.redis).toBe(true)
    expect(config.services.s3).toBe(true)
    expect(config.hooks.up).toBeUndefined()
  })

  it("throws on malformed TOML with a friendly message", () => {
    expect(() => parseConfig("not valid [[ toml")).toThrow()
  })
})

describe("resolveConfig", () => {
  const noFlags: CliFlags = {}

  it("uses defaults when no config and no flags", () => {
    const resolved = resolveConfig(null, noFlags)
    expect(resolved.services.postgres.enabled).toBe(true)
    expect(resolved.services.postgres.version).toBe("17")
    expect(resolved.services.redis.enabled).toBe(true)
    expect(resolved.services.redis.version).toBe("7")
    expect(resolved.services.s3.enabled).toBe(true)
  })

  it("respects config versions", () => {
    const config = parseConfig(`
[services]
postgres = "15"
redis = "6"
`)
    const resolved = resolveConfig(config, noFlags)
    expect(resolved.services.postgres.version).toBe("15")
    expect(resolved.services.redis.version).toBe("6")
  })

  it("respects config disabled services", () => {
    const config = parseConfig(`
[services]
postgres = false
s3 = false
`)
    const resolved = resolveConfig(config, noFlags)
    expect(resolved.services.postgres.enabled).toBe(false)
    expect(resolved.services.s3.enabled).toBe(false)
  })

  it("CLI flags override config", () => {
    const config = parseConfig(`
[services]
postgres = "15"
redis = "7"
`)
    const flags: CliFlags = { postgres: "16", noRedis: true }
    const resolved = resolveConfig(config, flags)
    expect(resolved.services.postgres.version).toBe("16")
    expect(resolved.services.redis.enabled).toBe(false)
  })

  it("--no-postgres flag disables postgres", () => {
    const flags: CliFlags = { noPostgres: true }
    const resolved = resolveConfig(null, flags)
    expect(resolved.services.postgres.enabled).toBe(false)
  })

  it("--no-s3 flag disables s3", () => {
    const flags: CliFlags = { noS3: true }
    const resolved = resolveConfig(null, flags)
    expect(resolved.services.s3.enabled).toBe(false)
  })

  it("preserves hooks from config", () => {
    const config = parseConfig(`
[hooks]
up = "npx prisma db push"
`)
    const resolved = resolveConfig(config, noFlags)
    expect(resolved.hooks.up).toBe("npx prisma db push")
  })
})
