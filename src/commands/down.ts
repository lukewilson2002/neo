import { Command } from "commander"

export const downCommand = new Command("down")
  .description("Stop environment services")
  .argument("[name]", "Environment name to stop")
  .option("--all", "Stop all environments for current project")
  .action((_name, _options) => {
    console.log("neo down: not implemented yet")
  })
