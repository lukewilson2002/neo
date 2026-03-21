import { spawnSync } from "node:child_process"

export function isDockerAvailable(): boolean {
  const result = spawnSync("docker", ["info"], {
    stdio: "pipe",
  })
  return result.status === 0
}

export function cleanupOrphans(): void {
  // Remove containers with neo-test- prefix
  const ps = spawnSync("docker", ["ps", "-a", "--filter", "name=neo-test-", "--format", "{{.ID}}"], {
    stdio: "pipe",
  })
  const containerIds = (ps.stdout?.toString() ?? "").trim().split("\n").filter(Boolean)
  if (containerIds.length > 0) {
    spawnSync("docker", ["rm", "-f", ...containerIds], { stdio: "pipe" })
  }

  // Remove volumes with neo-test- prefix
  const vs = spawnSync("docker", ["volume", "ls", "--filter", "name=neo-test-", "--format", "{{.Name}}"], {
    stdio: "pipe",
  })
  const volumeNames = (vs.stdout?.toString() ?? "").trim().split("\n").filter(Boolean)
  if (volumeNames.length > 0) {
    spawnSync("docker", ["volume", "rm", "-f", ...volumeNames], { stdio: "pipe" })
  }
}
