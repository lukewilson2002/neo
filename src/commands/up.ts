import { Command } from "commander"

export const upCommand = new Command("up")
  .description("Start services for current branch environment")
  .option("--no-postgres", "Disable Postgres")
  .option("--no-redis", "Disable Redis")
  .option("--no-s3", "Disable S3 (MinIO)")
  .option("--postgres <version>", "Pin Postgres version")
  .option("--redis <version>", "Pin Redis version")
  .action((_options) => {
    console.log("neo up: not implemented yet")
  })
