import { describe, it, expect } from "bun:test"
import {
  generateEnvVars,
  formatEnvVars,
  mergeEnvFile,
} from "../../src/core/env-vars"
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
      "postgresql://postgres:postgres@localhost:50001/neo"
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
      "DATABASE_URL=postgresql://postgres:postgres@localhost:50001/neo"
    )
  })
})

describe("mergeEnvFile", () => {
  it("appends all keys to an empty file with no leading separator", () => {
    const result = mergeEnvFile("", { FOO: "1", BAR: "2" })
    expect(result.content).toBe("FOO=1\nBAR=2\n")
    expect(result.added).toEqual(["FOO", "BAR"])
    expect(result.changed).toEqual([])
  })

  it("appends after a single blank-line separator when file has only comments", () => {
    const existing = "# my secrets\n# section two\n"
    const result = mergeEnvFile(existing, { FOO: "1" })
    expect(result.content).toBe("# my secrets\n# section two\n\nFOO=1\n")
    expect(result.added).toEqual(["FOO"])
    expect(result.changed).toEqual([])
  })

  it("rewrites an existing key in place and counts it as changed", () => {
    const result = mergeEnvFile("DATABASE_URL=old\n", {
      DATABASE_URL: "new",
    })
    expect(result.content).toBe("DATABASE_URL=new\n")
    expect(result.added).toEqual([])
    expect(result.changed).toEqual(["DATABASE_URL"])
  })

  it("does not count a no-op replacement as changed", () => {
    const result = mergeEnvFile("FOO=same\n", { FOO: "same" })
    expect(result.content).toBe("FOO=same\n")
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
  })

  it("handles append + update mix", () => {
    const existing = "FOO=old\nKEEP=me\n"
    const result = mergeEnvFile(existing, { FOO: "new", BAR: "2" })
    expect(result.content).toBe("FOO=new\nKEEP=me\n\nBAR=2\n")
    expect(result.added).toEqual(["BAR"])
    expect(result.changed).toEqual(["FOO"])
  })

  it("matches double-quote file style for appended keys", () => {
    const existing = 'FOO="bar"\n'
    const result = mergeEnvFile(existing, { BAZ: "qux" })
    expect(result.content).toBe('FOO="bar"\n\nBAZ="qux"\n')
  })

  it("matches single-quote file style for appended keys", () => {
    const existing = "FOO='bar'\n"
    const result = mergeEnvFile(existing, { BAZ: "qux" })
    expect(result.content).toBe("FOO='bar'\n\nBAZ='qux'\n")
  })

  it("uses no quotes when file style is unquoted", () => {
    const existing = "FOO=bar\n"
    const result = mergeEnvFile(existing, { BAZ: "qux" })
    expect(result.content).toBe("FOO=bar\n\nBAZ=qux\n")
  })

  it("preserves each line's own quote style on in-place update", () => {
    const existing = 'FOO="x"\nBAR=y\n'
    const result = mergeEnvFile(existing, { FOO: "newx", BAR: "newy" })
    expect(result.content).toBe('FOO="newx"\nBAR=newy\n')
    expect(result.changed).toEqual(["FOO", "BAR"])
  })

  it("preserves the export prefix on in-place update", () => {
    const existing = "export FOO=old\n"
    const result = mergeEnvFile(existing, { FOO: "new" })
    expect(result.content).toBe("export FOO=new\n")
    expect(result.changed).toEqual(["FOO"])
  })

  it("leaves comments and unrelated lines untouched", () => {
    const existing = "# top comment\nUNTOUCHED=keep\n# inline section\nFOO=old\n"
    const result = mergeEnvFile(existing, { FOO: "new" })
    expect(result.content).toBe(
      "# top comment\nUNTOUCHED=keep\n# inline section\nFOO=new\n"
    )
  })

  it("handles a file without a trailing newline", () => {
    const existing = "FOO=bar"
    const result = mergeEnvFile(existing, { BAZ: "qux" })
    expect(result.content).toBe("FOO=bar\n\nBAZ=qux\n")
  })

  it("does not double the blank line when file already ends in a blank line", () => {
    const existing = "FOO=bar\n\n"
    const result = mergeEnvFile(existing, { BAZ: "qux" })
    expect(result.content).toBe("FOO=bar\n\nBAZ=qux\n")
  })
})
