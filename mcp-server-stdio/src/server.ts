/**
 * RTG Comics MCP Server Setup
 *
 * Registers tools with MCP Apps UI resources.
 * Modeled after ASSA's working pattern.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// UI Resource URIs
const UI_RESOURCES = {
  hello: "ui://rtg-comics/hello.html",
  reader: "ui://rtg-comics/reader.html",
};

// Tool definitions with UI metadata
const TOOLS: Tool[] = [
  {
    name: "hello_comic",
    description:
      "Test MCP App - displays a simple hello message in an interactive UI.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    _meta: {
      ui: {
        resourceUri: UI_RESOURCES.hello,
      },
    },
  },
  {
    name: "list_comics",
    description: "Get a list of all available comics in the archive.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    // No UI - data only tool
  },
  {
    name: "get_page",
    description: "Get a comic page and open the comic reader.",
    inputSchema: {
      type: "object",
      properties: {
        comic_id: { type: "string", description: "Comic ID" },
        storyline_id: { type: "string", description: "Storyline ID" },
        page_number: { type: "number", description: "Page number (1-indexed)" },
      },
      required: ["comic_id", "storyline_id", "page_number"],
    },
    _meta: {
      ui: {
        resourceUri: UI_RESOURCES.reader,
      },
    },
  },
];

// Tool handlers
async function helloComicHandler(): Promise<CallToolResult> {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          message: "Hello from RTG Comics!",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  };
}

async function listComicsHandler(): Promise<CallToolResult> {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          comics: [
            {
              id: "sample-comic",
              title: "Sample Comic",
              description: "A sample webcomic for demonstration",
              storylineCount: 2,
              pageCount: 10,
            },
          ],
        }),
      },
    ],
  };
}

async function getPageHandler(params: { comic_id: string; storyline_id: string; page_number: number }): Promise<CallToolResult> {
  // Return mock page data - the app will receive this via ontoolresult
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          page: {
            pageNumber: params.page_number,
            title: `${params.storyline_id} Page ${params.page_number}`,
            slug: `${params.storyline_id}-page-${params.page_number}`,
            image: `/images/comics/sample/page-${params.page_number}.jpg`,
            imageWidth: 800,
            imageHeight: 600,
            alt: "Sample comic page",
            transcript: "This is a sample transcript for the MCP App demo.",
            commentary: "Sample commentary.",
            publishedDate: "2026-04-05",
            comments: [],
            originalUrl: `/comics/${params.storyline_id}-page-${params.page_number}/`,
          },
          navigation: {
            totalPages: 10,
            hasPrev: params.page_number > 1,
            hasNext: params.page_number < 10,
            storylineTitle: params.storyline_id,
            comicTitle: params.comic_id,
          },
        }),
      },
    ],
  };
}

// Load UI HTML from ui/ directory
function loadUIResource(filename: string): string {
  // Try from dist/ui/ first (built), then from src/../ui/ (dev)
  const paths = [
    join(__dirname, "ui", filename),
    join(__dirname, "..", "ui", filename),
  ];

  for (const filePath of paths) {
    try {
      return readFileSync(filePath, "utf-8");
    } catch {
      // Try next path
    }
  }

  throw new Error(`UI resource not found: ${filename}`);
}

export function createServer(): Server {
  const server = new Server(
    {
      name: "rtg-comics-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return { tools: TOOLS };
  });

  // Handle resource listing (MCP Apps UI resources)
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: [
        {
          uri: UI_RESOURCES.hello,
          name: "Hello Comic UI",
          mimeType: RESOURCE_MIME_TYPE,
        },
        {
          uri: UI_RESOURCES.reader,
          name: "Comic Reader UI",
          mimeType: RESOURCE_MIME_TYPE,
        },
      ],
    };
  });

  // Handle resource reading (serve UI HTML)
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Map URI to filename
    const uriToFile: Record<string, string> = {
      [UI_RESOURCES.hello]: "hello.html",
      [UI_RESOURCES.reader]: "reader.html",
    };

    const filename = uriToFile[uri];
    if (!filename) {
      throw new Error(`Unknown resource URI: ${uri}`);
    }

    const html = loadUIResource(filename);

    return {
      contents: [
        {
          uri,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          // Note: Configure resourceDomains in your deployment to allow image loading
          // from your domain. For local development, images are loaded from relative paths.
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "hello_comic":
        return await helloComicHandler();
      case "list_comics":
        return await listComicsHandler();
      case "get_page":
        return await getPageHandler(args as { comic_id: string; storyline_id: string; page_number: number });
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}
