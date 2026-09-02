/**
 * Rachel the Great Comic Archive - MCP Server
 *
 * This server provides MCP tools and prompts for browsing and searching the comic archive.
 * It loads the comic manifest and exposes:
 *
 * Tools (AI-invoked):
 * - list_comics: List all available comics
 * - list_storylines: List storylines for a specific comic
 * - get_page: Get a specific comic page with navigation context
 * - search_comics: Search across transcripts and commentary
 * - list_characters: List all characters, optionally filtered by comic
 * - search_by_character: Find pages featuring a specific character
 *
 * Prompts (User-invoked experiences):
 * - dramatic-reading: Perform a comic page with distinct character voices
 *
 * Supports two transport modes:
 * - stdio: For Claude Desktop (default)
 * - http: For web-based MCP hosts and the MCP App
 *
 * Usage:
 *   npm start          # stdio mode (default)
 *   npm start -- --http # HTTP mode on port 3001
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';

// Re-export types and functions from manifest for backward compatibility
export {
  loadManifest,
  clearManifestCache,
  type Manifest,
  type Comic,
  type Storyline,
  type Page,
  type Comment,
} from './manifest.js';

import { loadManifest } from './manifest.js';
import { registerAppResources } from './app-resource.js';

// Import tool handlers
import { listComicsTool, listComicsHandler } from './tools/list-comics.js';
import { listStorylinesTool, listStorylinesHandler } from './tools/list-storylines.js';
import { getPageTool, getPageHandler } from './tools/get-page.js';
import { searchComicsTool, searchComicsHandler } from './tools/search-comics.js';
import { getTranscriptTool, getTranscriptHandler } from './tools/get-transcript.js';
import { listCharactersTool, listCharactersHandler } from './tools/list-characters.js';
import { searchByCharacterTool, searchByCharacterHandler } from './tools/search-by-character.js';

// Import prompt handlers
import {
  dramaticReadingPrompt,
  dramaticReadingSchema,
  dramaticReadingHandler,
} from './prompts/dramatic-reading.js';

// ─── Server Setup ───────────────────────────────────────────────────────────

const server = new McpServer(
  {
    name: 'rtg2026-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ─── App Resource Registration ───────────────────────────────────────────────

// Register the MCP App as a UI resource (for Claude to fetch and display)
registerAppResources(server);

// ─── Tool Registration ───────────────────────────────────────────────────────

// All of these tools only read from the static manifest; none mutate state,
// and they operate on a closed dataset. readOnlyHint helps agents decide when
// human confirmation is unnecessary. Each also returns structuredContent so
// clients get typed data without parsing the text block.
const READ_ONLY = { readOnlyHint: true, openWorldHint: false };

// Register list_comics tool (no parameters)
server.registerTool(
  listComicsTool.name,
  {
    description: listComicsTool.description,
    inputSchema: {},
    annotations: READ_ONLY,
  },
  async () => {
    const result = await listComicsHandler();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register list_storylines tool
server.registerTool(
  listStorylinesTool.name,
  {
    description: listStorylinesTool.description,
    inputSchema: {
      comic_id: z.string().describe('The unique identifier for the comic (e.g., "fran-hopper-comics")'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await listStorylinesHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register get_page tool
server.registerTool(
  getPageTool.name,
  {
    description: getPageTool.description,
    inputSchema: {
      comic_id: z.string().describe('The unique identifier for the comic'),
      storyline_id: z.string().describe('The unique identifier for the storyline'),
      page_number: z.number().describe('The 1-indexed page number within the storyline'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await getPageHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register get_transcript tool (text-only, no UI)
server.registerTool(
  getTranscriptTool.name,
  {
    description: getTranscriptTool.description,
    inputSchema: {
      comic_id: z.string().describe('The unique identifier for the comic'),
      storyline_id: z.string().describe('The unique identifier for the storyline'),
      page_number: z.number().describe('The 1-indexed page number within the storyline'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await getTranscriptHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register search_comics tool
server.registerTool(
  searchComicsTool.name,
  {
    description: searchComicsTool.description,
    inputSchema: {
      query: z.string().describe('The search query to find in comic content'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum number of results to return (default 10, max 50)'),
      offset: z.number().int().min(0).optional().describe('Number of results to skip, for paging through large result sets (default 0)'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await searchComicsHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register list_characters tool
server.registerTool(
  listCharactersTool.name,
  {
    description: listCharactersTool.description,
    inputSchema: {
      comic_id: z.string().optional().describe('Optional comic identifier to filter characters (e.g., "fran-hopper-comics")'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await listCharactersHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// Register search_by_character tool
server.registerTool(
  searchByCharacterTool.name,
  {
    description: searchByCharacterTool.description,
    inputSchema: {
      character_slug: z.string().describe('The character slug to search for (e.g., "gale-allen", "mysta")'),
    },
    annotations: READ_ONLY,
  },
  async (params) => {
    const result = await searchByCharacterHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

// ─── Prompt Registration ─────────────────────────────────────────────────────

// Register dramatic-reading prompt
// Prompts are user-invocable experiences (unlike tools which the AI decides to call)
server.prompt(
  dramaticReadingPrompt.name,
  dramaticReadingPrompt.description,
  dramaticReadingSchema,
  async (params) => {
    const result = await dramaticReadingHandler({
      comic_id: params.comic_id,
      storyline_id: params.storyline_id,
      page_number: params.page_number,
    });
    return result;
  }
);

// ─── Main Entry Point ───────────────────────────────────────────────────────

const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

/**
 * Start the server in stdio mode (for Claude Desktop).
 */
async function startStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Server] Server started and listening on stdio');
}

/**
 * Start the server in HTTP mode (for web-based MCP hosts and MCP App).
 */
async function startHttpServer() {
  const app = express();

  // Enable CORS for cross-origin requests from Claude and the MCP App
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'http', port: HTTP_PORT });
  });

  // MCP endpoint - handles all MCP protocol messages
  app.post('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // Clean up transport when response closes
      res.on('close', () => {
        transport.close();
      });

      // Connect server to this transport instance
      await server.connect(transport);

      // Handle the incoming request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP Server] Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Handle SSE for streaming (GET /mcp for server-sent events)
  app.get('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on('close', () => {
        transport.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('[MCP Server] Error handling SSE request:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.listen(HTTP_PORT, () => {
    console.error(`[MCP Server] HTTP server listening on http://localhost:${HTTP_PORT}/mcp`);
    console.error(`[MCP Server] Health check: http://localhost:${HTTP_PORT}/health`);
  });
}

async function main() {
  // Verify manifest is loadable
  const manifest = loadManifest();
  console.error(`[MCP Server] Loaded manifest with ${manifest.comics.length} comics`);

  // Check for --http flag to determine transport mode
  const useHttp = process.argv.includes('--http');

  if (useHttp) {
    await startHttpServer();
  } else {
    await startStdioServer();
  }
}

// Run if this is the main module
main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});

export { server };
