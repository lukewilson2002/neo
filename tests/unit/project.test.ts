import { describe, it, expect, afterAll } from "bun:test"
import { parseProjectIdFromRemote, getProjectId } from "../../src/core/project"
import { TestRepo } from "../helpers/test-repo"

describe("parseProjectIdFromRemote", () => {
  it("parses HTTPS URL with .git suffix", () => {
    expect(parseProjectIdFromRemote("https://github.com/user/my-repo.git")).toBe("my-repo")
  })

  it("parses HTTPS URL without .git suffix", () => {
    expect(parseProjectIdFromRemote("https://github.com/user/my-repo")).toBe("my-repo")
  })

  it("parses SSH URL", () => {
    expect(parseProjectIdFromRemote("git@github.com:user/my-repo.git")).toBe("my-repo")
  })

  it("parses SSH URL without .git suffix", () => {
    expect(parseProjectIdFromRemote("git@github.com:user/my-repo")).toBe("my-repo")
  })

  it("handles nested paths (e.g., GitLab subgroups)", () => {
    expect(parseProjectIdFromRemote("https://gitlab.com/org/team/my-repo.git")).toBe("my-repo")
  })

  it("returns null for empty or invalid input", () => {
    expect(parseProjectIdFromRemote("")).toBeNull()
    expect(parseProjectIdFromRemote("not-a-url")).toBeNull()
  })
})

describe("getProjectId", () => {
  let repo: TestRepo

  afterAll(async () => {
    await repo?.cleanup()
  })

  it("falls back to directory name when no remote", () => {
    repo = TestRepo.create()
    const id = getProjectId(repo.dir)
    // TestRepo creates a temp dir like /tmp/neo-repo-XXXXXX
    // The directory name is used as fallback
    expect(id).toBeTruthy()
    expect(typeof id).toBe("string")
    expect(id!.length).toBeGreaterThan(0)
  })

  it("uses remote URL when available", () => {
    const repoWithRemote = TestRepo.create()
    const { spawnSync } = require("node:child_process")
    spawnSync("git", ["remote", "add", "origin", "https://github.com/user/cool-project.git"], {
      cwd: repoWithRemote.dir,
    })

    const id = getProjectId(repoWithRemote.dir)
    expect(id).toBe("cool-project")
    repoWithRemote.cleanup()
  })
})
