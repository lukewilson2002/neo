#!/usr/bin/env bun

import { Command } from "commander"
import pkg from "../package.json"
import { initCommand } from "./commands/init"
import { upCommand } from "./commands/up"
import { downCommand } from "./commands/down"
import { envCommand } from "./commands/env"
import { statusCommand } from "./commands/status"
import { listCommand } from "./commands/list"
import { resetCommand } from "./commands/reset"
import { startUpdateCheck } from "./core/update-check"

const updateCheck = startUpdateCheck(pkg.version)
process.on("exit", () => updateCheck.printNoticeOnExit())

const program = new Command()

program
  .name("neo")
  .description("One command to get an isolated database for your branch")
  .version(pkg.version)
  .addHelpText(
    "after",
    `
Quickstart:
  $ neo init             Create neo.toml with default service versions
  $ neo up               Start postgres/redis/s3 for the current branch
  $ neo env -w .env      Merge connection strings into .env (updates in place)
  $ neo down             Stop services when you're done

Run any command with --help for full options.
`
  )

program.addCommand(initCommand)
program.addCommand(upCommand)
program.addCommand(downCommand)
program.addCommand(envCommand)
program.addCommand(statusCommand)
program.addCommand(listCommand)
program.addCommand(resetCommand)

program.parse()
