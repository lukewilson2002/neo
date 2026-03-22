import { dockerComposePs } from "./docker"
import { HEALTH_CHECK_TIMEOUT_MS, HEALTH_CHECK_INTERVAL_MS } from "../constants"

interface ContainerStatus {
  Name: string
  State: string
  Health: string
}

function parseContainerStatuses(psOutput: string): ContainerStatus[] {
  if (!psOutput.trim()) return []

  // docker compose ps --format json outputs one JSON object per line
  return psOutput
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as ContainerStatus)
}

export async function waitForHealthy(
  projectName: string,
  timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const result = dockerComposePs(projectName)

    if (result.exitCode === 0 && result.stdout.trim()) {
      const statuses = parseContainerStatuses(result.stdout)

      if (statuses.length > 0) {
        const allHealthy = statuses.every(
          (s) => s.Health === "healthy" || s.State === "running"
        )
        if (allHealthy) return
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS)
    )
  }

  throw new Error(
    `Services did not become healthy within ${timeoutMs / 1000}s. Run 'neo status' for details.`
  )
}
