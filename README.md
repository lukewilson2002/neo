# neobase

One command to get an isolated database for your branch.

Neo gives every git branch its own isolated Postgres, Redis, and S3-compatible storage. No Docker knowledge required. No accounts. Works offline.

## Quick Start

```bash
neo init          # Create neo.toml with latest stable versions
neo up            # Start Postgres, Redis, MinIO for your branch
neo env > .env    # Export connection strings
npm run dev       # Develop with isolated infrastructure
```

## Install

Download a prebuilt binary from [GitHub Releases](https://github.com/lukewilson2002/neo/releases), or build from source:

```bash
git clone https://github.com/lukewilson2002/neo.git
cd neo
bun install
bun run build    # Compiles to ./neo binary
```

**Prerequisite**: [Docker](https://docs.docker.com/get-docker/) must be installed and running.

## Commands

| Command | Description |
|---|---|
| `neo init` | Create `neo.toml` with latest stable service versions |
| `neo up` | Start services for current branch (idempotent) |
| `neo down` | Stop current environment |
| `neo down <name>` | Stop a specific environment by name |
| `neo down --all` | Stop all environments for current project |
| `neo env` | Print connection strings (`KEY=VALUE`, pipe-friendly) |
| `neo status` | Health checks, ports, uptime for current environment |
| `neo status <name>` | Same, for a specific environment |
| `neo list` | List all active environments for current project |
| `neo reset` | Destroy volumes, re-provision current environment |
| `neo reset --all` | Destroy all environments and volumes |

## Configuration

Create a `neo.toml` in your project root (optional, committed to repo):

```toml
[services]
postgres = "17"
redis = "7"
s3 = true

[hooks]
up = "npx prisma db push && npx prisma db seed"
```

Without `neo.toml`, all three services start with latest stable versions.

Disable a service with `--no-postgres`, `--no-redis`, or `--no-s3`, or set it to `false` in the config. Pin a version with `--postgres 15` or `postgres = "15"`.

## Environment Variables

`neo env` outputs these for each active service:

| Variable | Format |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:<port>/neobase` |
| `REDIS_URL` | `redis://localhost:<port>` |
| `S3_ENDPOINT` | `http://localhost:<port>` |
| `S3_CONSOLE_URL` | `http://localhost:<port>` |

## Development

```bash
git clone <repo-url>
cd neo
bun install
bun test              # Run all tests
bun test tests/unit   # Unit tests only (no Docker required)
bun run typecheck     # Type checking
bun run build         # Compile to binary
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Write tests first, then implement
4. Ensure all tests pass (`bun test`)
5. Open a pull request

## License

[MIT](LICENSE)
