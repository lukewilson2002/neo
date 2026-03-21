import { error } from "./output"

export function exitWithError(message: string, suggestion?: string): never {
  error(message)
  if (suggestion) {
    console.error(`  ${suggestion}`)
  }
  process.exit(1)
}
