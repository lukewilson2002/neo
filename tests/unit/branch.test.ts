import { describe, it, expect, afterAll } from "bun:test"
import { sanitizeBranch, getCurrentBranch } from "../../src/core/branch"
import { TestRepo } from "../helpers/test-repo"

describe("sanitizeBranch", () => {
  it("passes through simple names", () => {
    expect(sanitizeBranch("main")).toBe("main")
    expect(sanitizeBranch("develop")).toBe("develop")
  })

  it("replaces slashes with dashes", () => {
    expect(sanitizeBranch("feature/payments")).toBe("feature-payments")
    expect(sanitizeBranch("fix/auth/login")).toBe("fix-auth-login")
  })

  it("replaces dots with dashes", () => {
    expect(sanitizeBranch("fix/foo.bar")).toBe("fix-foo-bar")
  })

  it("collapses consecutive special chars into a single dash", () => {
    expect(sanitizeBranch("feature//double")).toBe("feature-double")
    expect(sanitizeBranch("a..b--c")).toBe("a-b-c")
  })

  it("strips leading and trailing dashes", () => {
    expect(sanitizeBranch("/leading")).toBe("leading")
    expect(sanitizeBranch("trailing/")).toBe("trailing")
  })

  it("lowercases the result", () => {
    expect(sanitizeBranch("Feature/MyBranch")).toBe("feature-mybranch")
  })
})

describe("getCurrentBranch", () => {
  let repo: TestRepo

  afterAll(async () => {
    await repo?.cleanup()
  })

  it("returns the current branch name", () => {
    repo = TestRepo.create("feature/payments")
    const branch = getCurrentBranch(repo.dir)
    expect(branch).toBe("feature/payments")
  })

  it("throws on detached HEAD", () => {
    const detachedRepo = TestRepo.create("temp-branch")
    // Detach HEAD by checking out the commit directly
    const { spawnSync } = require("node:child_process")
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: detachedRepo.dir,
      encoding: "utf-8",
    })
    const sha = result.stdout.trim()
    spawnSync("git", ["checkout", sha], { cwd: detachedRepo.dir })

    expect(() => getCurrentBranch(detachedRepo.dir)).toThrow("detached HEAD")
    detachedRepo.cleanup()
  })
})
