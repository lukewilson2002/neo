import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { STATE_DIR_ENV_VAR } from "../constants"
import type { ProjectState, EnvironmentState } from "../types"

export function getStateDir(): string {
  return process.env[STATE_DIR_ENV_VAR] || join(homedir(), ".neo")
}

function getStatePath(projectId: string): string {
  return join(getStateDir(), projectId, "environments.json")
}

export function readProjectState(projectId: string): ProjectState | null {
  const path = getStatePath(projectId)
  try {
    const content = readFileSync(path, "utf-8")
    return JSON.parse(content) as ProjectState
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return null
    }
    throw err
  }
}

export function writeProjectState(
  projectId: string,
  state: ProjectState
): void {
  const path = getStatePath(projectId)
  const dir = join(getStateDir(), projectId)
  mkdirSync(dir, { recursive: true })

  // Atomic write: write to temp file, then rename
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(state, null, 2))
  renameSync(tmp, path)
}

export function addEnvironment(
  projectId: string,
  env: EnvironmentState
): void {
  const state = readProjectState(projectId) ?? { environments: [] }
  // Replace if same name exists, otherwise append
  const idx = state.environments.findIndex((e) => e.name === env.name)
  if (idx >= 0) {
    state.environments[idx] = env
  } else {
    state.environments.push(env)
  }
  writeProjectState(projectId, state)
}

export function removeEnvironment(
  projectId: string,
  envName: string
): void {
  const state = readProjectState(projectId)
  if (!state) return
  state.environments = state.environments.filter((e) => e.name !== envName)
  writeProjectState(projectId, state)
}
