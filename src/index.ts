#!/usr/bin/env bun

import { Command } from "commander"
import { initCommand } from "./commands/init"
import { upCommand } from "./commands/up"
import { downCommand } from "./commands/down"
import { envCommand } from "./commands/env"
import { statusCommand } from "./commands/status"
import { listCommand } from "./commands/list"
import { resetCommand } from "./commands/reset"

const program = new Command()

program
  .name("neo")
  .description("One command to get an isolated database for your branch")
  .version("0.1.0")

program.addCommand(initCommand)
program.addCommand(upCommand)
program.addCommand(downCommand)
program.addCommand(envCommand)
program.addCommand(statusCommand)
program.addCommand(listCommand)
program.addCommand(resetCommand)

program.parse()
