import { Command } from "commander"

export const initCommand = new Command("init")
  .description("Create neo.toml with latest stable service versions")
  .action(() => {
    console.log("neo init: not implemented yet")
  })
