import { Command } from "commander"

export const envCommand = new Command("env")
  .description("Print connection strings for current environment")
  .action(() => {
    console.log("neo env: not implemented yet")
  })
