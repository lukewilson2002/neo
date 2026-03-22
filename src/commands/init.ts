import { Command } from "commander"
import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { DEFAULT_POSTGRES_VERSION, DEFAULT_REDIS_VERSION } from "../constants"
import { success, info } from "../ui/output"
import { exitWithError } from "../ui/errors"

const DEFAULT_TOML = `[services]
postgres = "${DEFAULT_POSTGRES_VERSION}"
redis = "${DEFAULT_REDIS_VERSION}"
s3 = true

[hooks]
# up = "npx prisma db push && npx prisma db seed"
`

export const initCommand = new Command("init")
  .description("Create neo.toml with latest stable service versions")
  .action(() => {
    const configPath = join(process.cwd(), "neo.toml")

    if (existsSync(configPath)) {
      exitWithError(
        "neo.toml already exists.",
        "Delete it first if you want to reinitialize."
      )
    }

    writeFileSync(configPath, DEFAULT_TOML)
    success("Created neo.toml with latest stable versions.")
  })
