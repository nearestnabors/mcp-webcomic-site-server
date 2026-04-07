#!/usr/bin/env node

/**
 * RTG Comics MCP Server - Stdio Entry Point
 *
 * A minimal MCP server with MCP Apps support.
 * Based on the working ASSA pattern.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Connect to stdio transport
  await server.connect(transport);

  console.error("RTG Comics MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
