#!/usr/bin/env bun

import { cleanupOrphans } from "./docker"

console.log("Cleaning up orphaned neo-test-* Docker resources...")
cleanupOrphans()
console.log("Done.")
