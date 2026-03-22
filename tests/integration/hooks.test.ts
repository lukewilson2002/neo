import { describe, it, expect } from "bun:test"
import { executeHook } from "../../src/core/hooks"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

describe("executeHook", () => {
  it("executes a shell command with injected env vars", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "neo-hook-"))
    const outFile = join(tmpDir, "output.txt")

    try {
      executeHook(`echo "$DATABASE_URL" > "${outFile}"`, {
        DATABASE_URL: "postgresql://localhost:5432/test",
      })

      const output = readFileSync(outFile, "utf-8").trim()
      expect(output).toBe("postgresql://localhost:5432/test")
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("throws on non-zero exit code", () => {
    expect(() => executeHook("exit 1", {})).toThrow("Hook failed")
  })

  it("does nothing when command is empty", () => {
    // Should not throw
    executeHook("", {})
  })
})
