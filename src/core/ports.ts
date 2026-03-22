import { createServer } from "node:net"
import { PORT_RANGE_START, PORT_RANGE_END } from "../constants"

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close(() => resolve(true))
    })
    server.listen(port, "127.0.0.1")
  })
}

export async function findFreePorts(count: number): Promise<number[]> {
  if (count === 0) return []

  const ports: number[] = []
  // Start from a random offset within the range to reduce collision probability
  const rangeSize = PORT_RANGE_END - PORT_RANGE_START + 1
  const startOffset = Math.floor(Math.random() * rangeSize)

  for (let i = 0; i < rangeSize && ports.length < count; i++) {
    const port = PORT_RANGE_START + ((startOffset + i) % rangeSize)
    if (await isPortFree(port)) {
      ports.push(port)
    }
  }

  if (ports.length < count) {
    throw new Error(
      `Could not find ${count} free ports in range ${PORT_RANGE_START}-${PORT_RANGE_END}. ` +
        `Only found ${ports.length}.`
    )
  }

  return ports
}
