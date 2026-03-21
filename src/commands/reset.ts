import { Command } from "commander"

export const resetCommand = new Command("reset")
  .description("Destroy volumes and re-provision current environment")
  .option("--all", "Reset all environments for current project")
  .action((_options) => {
    console.log("neo reset: not implemented yet")
  })
