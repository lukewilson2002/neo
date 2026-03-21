import { Command } from "commander"

export const statusCommand = new Command("status")
  .description("Show health, ports, and uptime for an environment")
  .argument("[name]", "Environment name to check")
  .action((_name) => {
    console.log("neo status: not implemented yet")
  })
