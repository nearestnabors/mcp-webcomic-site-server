/**
 * MCP App Resource Registration
 *
 * Registers the MCP App as a UI resource that Claude can fetch and display.
 * When a tool returns _meta: { "ui/resourceUri": "ui://rtg-comics/reader.html" },
 * Claude will request this resource and render it in an iframe.
 *
 * @see spec.md "MCP App Integration with Claude (Phase 11)" for architecture details
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/** The URI for the comic reader app resource */
export const APP_RESOURCE_URI = 'ui://rtg-comics/reader.html';

/** The name/identifier for the resource listing */
export const APP_RESOURCE_NAME = 'RTG Comic Reader';

/**
 * Get the path to the bundled MCP app HTML file.
 * The app is bundled by Vite into mcp-app/dist/index.html
 */
function getAppHtmlPath(): string {
  // Handle both ESM and tests
  const currentDir =
    typeof import.meta?.url !== 'undefined'
      ? path.dirname(fileURLToPath(import.meta.url))
      : __dirname;

  // Navigate from mcp-server/src to mcp-app/dist
  return path.join(currentDir, '../../mcp-app/dist/index.html');
}

/**
 * Registers the MCP App as a UI resource on the server.
 *
 * This enables Claude to fetch the app HTML when tools return
 * `_meta: { "ui/resourceUri": "ui://rtg-comics/reader.html" }`.
 *
 * @param server - The McpServer instance to register the resource on
 */
export function registerAppResources(server: McpServer): void {
  const appHtmlPath = getAppHtmlPath();

  server.registerResource(
    APP_RESOURCE_NAME,
    APP_RESOURCE_URI,
    {
      description: 'Interactive comic reader for Rachel the Great and other comics',
      mimeType: 'text/html',
    },
    async () => {
      // Read the bundled HTML file
      const html = await fs.promises.readFile(appHtmlPath, 'utf-8');

      return {
        contents: [
          {
            uri: APP_RESOURCE_URI,
            mimeType: 'text/html',
            text: html,
          },
        ],
      };
    }
  );
}
