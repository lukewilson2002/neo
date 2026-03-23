import { spawnSync } from "node:child_process"

export { isDockerAvailable } from "../../src/core/docker"

export function cleanupOrphans(): void {
  const ps = spawnSync("docker", ["ps", "-a", "--filter", "name=neo-test-", "--format", "{{.ID}}"], {
    stdio: "pipe",
  })
  const containerIds = (ps.stdout?.toString() ?? "").trim().split("\n").filter(Boolean)
  if (containerIds.length > 0) {
    spawnSync("docker", ["rm", "-f", ...containerIds], { stdio: "pipe" })
  }

  const vs = spawnSync("docker", ["volume", "ls", "--filter", "name=neo-test-", "--format", "{{.Name}}"], {
    stdio: "pipe",
  })
  const volumeNames = (vs.stdout?.toString() ?? "").trim().split("\n").filter(Boolean)
  if (volumeNames.length > 0) {
    spawnSync("docker", ["volume", "rm", "-f", ...volumeNames], { stdio: "pipe" })
  }
}
