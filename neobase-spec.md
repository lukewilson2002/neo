# Neobase — Feature Spec

> One command to get an isolated database for your branch.

**CLI command**: `neo`
**Package name**: `neobase`
**Runtime**: Bun (compiled to single binary for distribution)

## Core Thesis

AI agents need infrastructure. They can't provision it. Neo gives every branch its own isolated Postgres, Redis, and S3-compatible storage with a single command. No Docker knowledge required. No accounts. Works offline.

**Long-term vision**: the swiss army knife of local agentic development. MVP is the infrastructure layer.

---

## How It Works

```
$ neo init
  Created neo.toml with latest stable versions.

$ neo up
  Environment: feature-payments
  ✓ Postgres (17) → localhost:50123
  ✓ Redis (7) → localhost:50124
  ✓ MinIO → localhost:50125 (console: 50126)
  ✓ Hook: npx prisma db push && npx prisma db seed (ran)

$ neo env
  DATABASE_URL=postgresql://postgres:postgres@localhost:50123/neobase
  REDIS_URL=redis://localhost:50124
  S3_ENDPOINT=http://localhost:50125
  S3_CONSOLE_URL=http://localhost:50126

$ neo env > .env
$ npm run dev
```

---

## Commands

| Command | Description |
|---|---|
| `neo init` | Creates `neo.toml` with latest stable service versions |
| `neo up` | Start services, wait for healthy, run hook. **Idempotent** — re-run confirms health, re-runs hook, prints summary |
| `neo down` | Stop current environment |
| `neo down <name>` | Stop a specific environment by name |
| `neo down --all` | Stop all environments for current project |
| `neo env` | Print derived connection strings to stdout (`KEY=VALUE` format, pipe-friendly) |
| `neo status` | Health checks, ports, uptime, container info for current environment |
| `neo status <name>` | Same, for a specific environment by name |
| `neo list` | All active environments for current project |
| `neo reset` | Nuke volumes for current environment, re-provision, re-run hook |
| `neo reset --all` | Nuke all environments and volumes for current project |

---

## Configuration

### `neo.toml` (optional, committed to repo)

```toml
[services]
postgres = "17"
redis = "7"
s3 = true

[hooks]
up = "npx prisma db push && npx prisma db seed"
```

- **Without the file**: `neo up` uses latest stable versions of all three services, no hook
- **With the file**: pin versions, disable services, define hooks
- CLI flags override the file

### Default Services

| Service | Default | Disable | Pin version |
|---|---|---|---|
| Postgres | Latest stable | `--no-postgres` or `postgres = false` | `--postgres 15` or `postgres = "15"` |
| Redis | Latest stable | `--no-redis` or `redis = false` | `--redis 6` or `redis = "6"` |
| S3 (MinIO) | Latest stable | `--no-s3` or `s3 = false` | — |

All three start by default. Opt out per service.

### Hooks

- `hooks.up` runs after all services are healthy on every `neo up`
- Executes as a shell command on the host
- **Derived env vars are injected automatically**: `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_CONSOLE_URL` are available to the hook process without writing `.env` first
- Use for migrations, seeding, bucket creation — anything the environment needs before development starts

---

## Environments

- Every `neo up` creates an environment named after the current git branch
- `main` → `main`, `feature/payments` → `feature-payments`
- All environments are identical in behavior — same services, unique ports and derived connection strings
- Branch detection via `git rev-parse`, automatic
- Works in worktrees — CLI detects branch regardless of checkout method
- Same branch collision: if environment for that branch is already running, `neo up` confirms health and re-runs hook (idempotent)

### Isolation

Each environment gets its own:
- Docker containers (named: `<project>-<env>-postgres`, etc.)
- Docker volumes (data persists across `down`/`up`)
- Port assignments (no collisions)
- Derived connection strings

Environments are fully independent — one agent's migrations don't affect another's database.

---

## Port Management

- All environments use dynamic port allocation from range 50000–59999
- No default ports — avoids collisions with other local services or projects
- Ports recorded in `~/.neobase/<project>/environments.json`
- Apps read connection strings from `neo env` output — never hardcode ports

---

## Derived Connection Strings

`neo env` outputs these for each active service:

| Variable | Format |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:<port>/neobase` |
| `REDIS_URL` | `redis://localhost:<port>` |
| `S3_ENDPOINT` | `http://localhost:<port>` |
| `S3_CONSOLE_URL` | `http://localhost:<port>` |

Only variables for active services are included (e.g., if `--no-redis`, no `REDIS_URL`).

---

## Docker

- Docker is the only prerequisite
- If Docker isn't installed, `neo up` prints install guidance and exits
- All Docker details are hidden — no Compose files, no container management exposed
- Docker Compose YAML is generated ephemerally (temp file, passed to Docker, never written to project)

---

## Service Readiness

- `neo up` waits for all services to be healthy before running hooks or returning
- Postgres: `pg_isready` health check
- Redis: `redis-cli ping`
- MinIO: HTTP health endpoint
- Configurable timeout (default 30s), clear error on failure

---

## Data Lifecycle

- Docker volumes persist by default — data survives `neo down` / `neo up` cycles
- `neo reset` nukes all volumes for the current environment, re-provisions, re-runs hook
- `neo reset --all` nukes all environments and volumes for the project

---

## Project Identity

- Project identifier derived from git remote URL (fallback: directory name)
- Namespaces environments and state in `~/.neobase/<project>/`
- Multiple projects on the same machine are fully isolated

---

## Global State

- `~/.neobase/<project>/environments.json` — active environments (ports, container names, branch, start time)
- No other global state

---

## Config Architecture — Two Layers

- **`neo.toml` (static, committed)**: infrastructure definition — what services, what versions, what hooks. Agents read this to understand the project's infra without invoking the CLI.
- **`neo status` (dynamic, runtime)**: live environment state — actual ports, connection strings, container health, uptime. Agents invoke this when they need runtime details.

---

## Agent Workflow

**Agent develops on a feature branch:**
1. Developer creates worktree: `git worktree add ../my-saas-payments feature/payments`
2. Agent: `neo up` → services start, hook runs migrations + seed
3. Agent: `neo env > .env`
4. Agent: `npm run dev`
5. Agent tests with Playwright / browser MCP
6. Agent commits, pushes, opens PR
7. Agent: `neo down`

**Human reviews PR:**
1. Checks out branch (worktree or `git switch`)
2. `neo up` → services start, hook runs migrations + seed
3. `neo env > .env`
4. `npm run dev`
5. Tests manually
6. `neo down`

**Multiple agents in parallel:**
- Each agent in its own worktree, own branch, own environment
- Fully isolated — no shared databases, no port collisions
- A human can `neo up` any branch at any time to inspect work

---

## Undecided

- [ ] **CLI framework**: Commander vs oclif vs citty vs custom
- [ ] **Distribution**: npm + Homebrew? Compiled binary only?

---

## Out of Scope (MVP)

- Custom Docker images or arbitrary services beyond the three defaults
- Production / staging / deployment
- MCP server for agent access
- Secrets management (users manage `.env` themselves)
- Service detection / auto-inference
- `neo port` utility
- Multi-port service configuration
- Expose templates / custom connection string formats

---

## MVP Scope

**Goal**: `neo up` gives you an isolated Postgres, Redis, and S3 for your branch. Three commands to a fully running environment.

**What Neo owns**: Service provisioning (Postgres, Redis, MinIO), dynamic port allocation, branch-based environment isolation, service readiness, hooks, env export.

**What Neo does NOT own**: Application code, dev servers, migrations (handled by hook), secrets, deployment.

### Estimated Size

~1,500–2,500 lines of TypeScript (Bun)

| Component | Estimate |
|---|---|
| CLI argument parsing + command routing | ~300 lines |
| Docker Compose generation + container management | ~400 lines |
| Port allocation + environment tracking | ~200 lines |
| Service health checks + readiness polling | ~200 lines |
| Hook execution with env var injection | ~100 lines |
| Branch / worktree detection | ~100 lines |
| `neo.toml` parsing + flag merging | ~150 lines |
| Output formatting (env, status, list) | ~200 lines |
| Error handling, logging, utilities | ~200 lines |
