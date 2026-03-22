import { describe, it, expect } from "bun:test"
import {
  isDockerAvailable,
  getDockerComposeCommand,
} from "../../src/core/docker"

describe("Docker availability", () => {
  it("detects Docker is available", () => {
    expect(isDockerAvailable()).toBe(true)
  })

  it("detects Docker Compose command", () => {
    const cmd = getDockerComposeCommand()
    expect(cmd.length).toBeGreaterThan(0)
    // Should be either ["docker", "compose"] or ["docker-compose"]
    expect(cmd[0]).toMatch(/docker/)
  })
})
