import { Command } from "commander"

export const listCommand = new Command("list")
  .description("List all active environments for current project")
  .action(() => {
    console.log("neo list: not implemented yet")
  })
