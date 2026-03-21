# CLAUDE.md — Neobase Development Guide

## Project Overview

Neobase (`neo`) is a CLI tool that gives every git branch its own isolated
Postgres, Redis, and S3 (MinIO) via Docker. Built with Bun + TypeScript,
compiled to a single binary.

**Package**: `neobase` | **CLI command**: `neo` | **Runtime**: Bun

## Commands

```bash
bun install                     # Install dependencies
bun test                        # Run all tests
bun test tests/unit             # Unit tests only (no Docker required)
bun test tests/integration      # Integration tests (requires Docker)
bun test tests/e2e              # E2E tests (requires Docker)
bun run typecheck               # TypeScript type checking
bun run build                   # Compile to single binary
bun run test:cleanup            # Remove orphaned neo-test-* Docker resources
```

## Architecture

```
src/
  commands/    One file per CLI command (init, up, down, env, status, list, reset)
  core/        Business logic modules
  ui/          Output formatting and error messages
tests/
  unit/        Pure function tests — no Docker, no I/O
  integration/ Real Docker containers via neo's own modules
  e2e/         CLI invocation as subprocess
  helpers/     TestContext, TestRepo, CLI runner, Docker cleanup
```

## Key Patterns

- **State directory**: Resolved in `src/core/state.ts` via `process.env.NEO_STATE_DIR || ~/.neobase`.
  All modules use this single resolution point.
- **Test isolation**: `TestContext` (tests/helpers/test-context.ts) creates a unique temp state dir
  and Docker project prefix per test run. Safe for parallel worktrees.
- **Compose generation**: Pure function `buildComposeSpec()` in `src/core/compose.ts` produces a
  JS object. `serializeCompose()` converts to YAML. This separation keeps the logic easily testable.
- **Port allocation**: TCP probe in range 50000-59999, recorded in state file.
  Retry on conflict (up to 3 attempts).
- **Docker naming**: All containers/volumes include the project ID prefix to prevent collisions.

## Testing Philosophy

- Write the test first, then implement.
- Unit tests: pure functions, no Docker, no filesystem side effects (except state.test.ts which uses temp dirs).
- Integration tests: real Docker containers started via neo's own core modules + TestContext for isolation.
- E2E tests: spawn `bun run src/index.ts` as subprocess via TestRepo + TestContext.

## Conventions

- Named exports only (no default exports).
- Error messages must suggest a fix, not just describe the problem.
- Docker resource names always include the project ID.
- Respect `NO_COLOR` environment variable.
- Atomic writes for state files (write to tmp, then rename).

## Important Files

- `neobase-spec.md` — Full feature specification
- `src/core/state.ts` — State directory resolution (NEO_STATE_DIR)
- `tests/helpers/test-context.ts` — Test isolation primitive
- `src/constants.ts` — Port range, default versions, timeouts
