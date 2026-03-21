const useColor = !process.env["NO_COLOR"]

export function success(msg: string): void {
  console.log(useColor ? `\x1b[32m✓\x1b[0m ${msg}` : `✓ ${msg}`)
}

export function error(msg: string): void {
  console.error(useColor ? `\x1b[31m✗\x1b[0m ${msg}` : `✗ ${msg}`)
}

export function info(msg: string): void {
  console.log(msg)
}
