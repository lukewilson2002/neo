import { describe, it, expect } from "bun:test"
import { findFreePorts } from "../../src/core/ports"
import { PORT_RANGE_START, PORT_RANGE_END } from "../../src/constants"

describe("findFreePorts", () => {
  it("returns the requested number of ports", async () => {
    const ports = await findFreePorts(3)
    expect(ports).toHaveLength(3)
  })

  it("all ports are within the valid range", async () => {
    const ports = await findFreePorts(4)
    for (const port of ports) {
      expect(port).toBeGreaterThanOrEqual(PORT_RANGE_START)
      expect(port).toBeLessThanOrEqual(PORT_RANGE_END)
    }
  })

  it("all ports are unique", async () => {
    const ports = await findFreePorts(4)
    const unique = new Set(ports)
    expect(unique.size).toBe(4)
  })

  it("returns empty array when 0 requested", async () => {
    const ports = await findFreePorts(0)
    expect(ports).toHaveLength(0)
  })
})
