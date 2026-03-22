import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { TestContext } from "../helpers/test-context"
import {
  readProjectState,
  writeProjectState,
  addEnvironment,
  removeEnvironment,
} from "../../src/core/state"
import type { EnvironmentState } from "../../src/types"

describe("state management", () => {
  let ctx: TestContext

  beforeEach(() => {
    ctx = TestContext.create()
    // Set env var so state module uses our temp dir
    process.env.NEO_STATE_DIR = ctx.stateDir
  })

  afterEach(async () => {
    delete process.env.NEO_STATE_DIR
    await ctx.cleanup()
  })

  it("returns null for non-existent project state", () => {
    const state = readProjectState("nonexistent")
    expect(state).toBeNull()
  })

  it("writes and reads project state", () => {
    const state = { environments: [] }
    writeProjectState("my-project", state)
    const read = readProjectState("my-project")
    expect(read).toEqual(state)
  })

  it("creates directories recursively on first write", () => {
    writeProjectState("brand-new-project", { environments: [] })
    const state = readProjectState("brand-new-project")
    expect(state).toEqual({ environments: [] })
  })

  it("adds an environment", () => {
    const env: EnvironmentState = {
      name: "feature-payments",
      ports: { postgres: 50001, redis: 50002 },
      services: ["postgres", "redis"],
      startedAt: new Date().toISOString(),
      projectId: "my-project",
    }
    addEnvironment("my-project", env)

    const state = readProjectState("my-project")
    expect(state?.environments).toHaveLength(1)
    expect(state?.environments[0]?.name).toBe("feature-payments")
  })

  it("removes an environment by name", () => {
    const env: EnvironmentState = {
      name: "feature-payments",
      ports: { postgres: 50001 },
      services: ["postgres"],
      startedAt: new Date().toISOString(),
      projectId: "my-project",
    }
    addEnvironment("my-project", env)
    removeEnvironment("my-project", "feature-payments")

    const state = readProjectState("my-project")
    expect(state?.environments).toHaveLength(0)
  })

  it("handles multiple environments", () => {
    addEnvironment("my-project", {
      name: "main",
      ports: { postgres: 50001 },
      services: ["postgres"],
      startedAt: new Date().toISOString(),
      projectId: "my-project",
    })
    addEnvironment("my-project", {
      name: "feature-x",
      ports: { postgres: 50003 },
      services: ["postgres"],
      startedAt: new Date().toISOString(),
      projectId: "my-project",
    })

    const state = readProjectState("my-project")
    expect(state?.environments).toHaveLength(2)

    removeEnvironment("my-project", "main")
    const updated = readProjectState("my-project")
    expect(updated?.environments).toHaveLength(1)
    expect(updated?.environments[0]?.name).toBe("feature-x")
  })
})
