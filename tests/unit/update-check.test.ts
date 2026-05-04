import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { TestContext } from "../helpers/test-context"
import {
  compareVersions,
  isCacheStale,
  isFastCommand,
  isUpdateAvailable,
  readCache,
  writeCache,
} from "../../src/core/update-check"
import { UPDATE_CHECK_TTL_MS } from "../../src/constants"

describe("compareVersions", () => {
  it("returns 0 for equal versions", () => {
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0)
  })

  it("strips a leading v", () => {
    expect(compareVersions("v1.2.3", "1.2.3")).toBe(0)
    expect(compareVersions("v1.2.4", "v1.2.3")).toBe(1)
  })

  it("orders by major, then minor, then patch", () => {
    expect(compareVersions("2.0.0", "1.9.9")).toBe(1)
    expect(compareVersions("1.3.0", "1.2.9")).toBe(1)
    expect(compareVersions("1.2.4", "1.2.3")).toBe(1)
    expect(compareVersions("1.2.3", "1.2.4")).toBe(-1)
  })

  it("handles missing parts as zero", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0)
    expect(compareVersions("1", "1.0.0")).toBe(0)
    expect(compareVersions("1.2.1", "1.2")).toBe(1)
  })

  it("treats pre-release as lower than the release", () => {
    expect(compareVersions("1.2.3-beta.1", "1.2.3")).toBe(-1)
    expect(compareVersions("1.2.3", "1.2.3-rc.1")).toBe(1)
  })
})

describe("isUpdateAvailable", () => {
  it("returns false when cache is null", () => {
    expect(isUpdateAvailable("1.0.0", null)).toBe(false)
  })

  it("returns false when versions match", () => {
    expect(
      isUpdateAvailable("1.0.0", {
        checkedAt: new Date().toISOString(),
        latestVersion: "1.0.0",
      })
    ).toBe(false)
  })

  it("returns true when latest is newer", () => {
    expect(
      isUpdateAvailable("1.0.0", {
        checkedAt: new Date().toISOString(),
        latestVersion: "1.1.0",
      })
    ).toBe(true)
  })

  it("returns false when current is ahead of cache (e.g. dev build)", () => {
    expect(
      isUpdateAvailable("2.0.0", {
        checkedAt: new Date().toISOString(),
        latestVersion: "1.0.0",
      })
    ).toBe(false)
  })
})

describe("isCacheStale", () => {
  it("treats null as stale", () => {
    expect(isCacheStale(null)).toBe(true)
  })

  it("treats malformed timestamps as stale", () => {
    expect(
      isCacheStale({ checkedAt: "not-a-date", latestVersion: "1.0.0" })
    ).toBe(true)
  })

  it("is fresh just under the TTL", () => {
    const now = Date.now()
    const cache = {
      checkedAt: new Date(now - UPDATE_CHECK_TTL_MS + 1000).toISOString(),
      latestVersion: "1.0.0",
    }
    expect(isCacheStale(cache, now)).toBe(false)
  })

  it("is stale at or past the TTL", () => {
    const now = Date.now()
    const cache = {
      checkedAt: new Date(now - UPDATE_CHECK_TTL_MS).toISOString(),
      latestVersion: "1.0.0",
    }
    expect(isCacheStale(cache, now)).toBe(true)
  })
})

describe("isFastCommand", () => {
  it("recognizes fast commands under the compiled-binary argv shape", () => {
    expect(isFastCommand(["/usr/local/bin/neo", "env"])).toBe(true)
    expect(isFastCommand(["/usr/local/bin/neo", "status"])).toBe(true)
    expect(isFastCommand(["/usr/local/bin/neo", "list"])).toBe(true)
    expect(isFastCommand(["/usr/local/bin/neo", "--version"])).toBe(true)
  })

  it("recognizes fast commands under the bun-run argv shape", () => {
    expect(isFastCommand(["bun", "/path/src/index.ts", "env"])).toBe(true)
    expect(isFastCommand(["bun", "/path/src/index.ts", "--help"])).toBe(true)
  })

  it("returns false for slow commands", () => {
    expect(isFastCommand(["/usr/local/bin/neo", "up"])).toBe(false)
    expect(isFastCommand(["/usr/local/bin/neo", "down"])).toBe(false)
    expect(isFastCommand(["/usr/local/bin/neo", "reset"])).toBe(false)
    expect(isFastCommand(["/usr/local/bin/neo", "init"])).toBe(false)
    expect(isFastCommand(["bun", "/path/src/index.ts", "up"])).toBe(false)
  })

  it("treats no-subcommand invocation as fast (help-equivalent)", () => {
    expect(isFastCommand(["/usr/local/bin/neo"])).toBe(true)
    expect(isFastCommand(["bun", "/path/src/index.ts"])).toBe(true)
  })
})

describe("cache read/write", () => {
  let ctx: TestContext

  beforeEach(() => {
    ctx = TestContext.create()
    process.env.NEO_STATE_DIR = ctx.stateDir
  })

  afterEach(async () => {
    delete process.env.NEO_STATE_DIR
    await ctx.cleanup()
  })

  it("returns null when cache file doesn't exist", () => {
    expect(readCache()).toBeNull()
  })

  it("round-trips a cache entry", () => {
    const cache = {
      checkedAt: new Date().toISOString(),
      latestVersion: "1.2.3",
    }
    writeCache(cache)
    expect(readCache()).toEqual(cache)
  })

  it("returns null when the cache file is malformed", () => {
    writeCache({ checkedAt: "now", latestVersion: "1.0.0" })
    // Overwrite with garbage
    const { writeFileSync } = require("node:fs") as typeof import("node:fs")
    const { join } = require("node:path") as typeof import("node:path")
    writeFileSync(join(ctx.stateDir, "update-check.json"), "{not json")
    expect(readCache()).toBeNull()
  })

  it("returns null when the cache file is missing required fields", () => {
    const { writeFileSync } = require("node:fs") as typeof import("node:fs")
    const { join } = require("node:path") as typeof import("node:path")
    writeFileSync(
      join(ctx.stateDir, "update-check.json"),
      JSON.stringify({ checkedAt: "x" })
    )
    expect(readCache()).toBeNull()
  })
})
