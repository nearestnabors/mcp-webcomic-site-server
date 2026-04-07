# MCP Transports: HTTP vs Stdio

MCP servers communicate with hosts (like Claude) through **transports**. The transport defines *how* messages flow between your server and the AI agent. Choose the right transport for your deployment scenario.

## The Two Transports

### Stdio Transport

The server runs as a local process. Communication happens via standard input/output streams.

```
┌─────────────┐     stdin      ┌─────────────┐
│   Claude    │ ────────────▶  │ MCP Server  │
│   Desktop   │ ◀────────────  │  (local)    │
└─────────────┘    stdout      └─────────────┘
```

**How it works:**
1. Claude Desktop spawns your server as a child process
2. JSON-RPC messages flow through stdin/stdout
3. Server stays alive for the duration of the session

**Example: Minimal stdio server**

```typescript
// mcp-server-stdio/src/index.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server(
  { name: "comic-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// Register tools...
server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [{ name: "get_page", description: "Get a comic page", inputSchema: {...} }]
}));

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Claude Desktop config** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "comic-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-stdio/dist/index.js"]
    }
  }
}
```

### HTTP Transport

The server runs as a web service. Communication happens via HTTP.

```
┌─────────────┐   HTTP POST    ┌─────────────┐
│   Claude    │ ────────────▶  │ MCP Server  │
│  (any host) │ ◀────────────  │  (hosted)   │
└─────────────┘   JSON-RPC     └─────────────┘
```

**How it works:**
1. Server listens on an HTTP endpoint
2. Each tool call is a POST request with JSON-RPC body
3. Server responds with JSON-RPC result
4. Server is stateless (typically serverless)

**Example: Netlify Function**

```typescript
// netlify/functions/mcp.ts
import type { Handler } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Parse JSON-RPC request
  const request = JSON.parse(event.body || '{}');

  // Route based on method
  let result;
  switch (request.method) {
    case 'initialize':
      result = { protocolVersion: '2024-11-05', serverInfo: {...}, capabilities: {...} };
      break;
    case 'tools/list':
      result = { tools: [...] };
      break;
    case 'tools/call':
      result = await handleToolCall(request.params);
      break;
    default:
      return errorResponse(request.id, -32601, 'Method not found');
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id: request.id, result }),
  };
};
```

**Setup (Claude, ChatGPT, Gemini, Copilot):**
1. Go to Settings → MCP Connectors
2. Add connector URL: `https://your-site.netlify.app/mcp`
3. Done!

All major AI agents support HTTP connectors natively — no local installation required.

## Comparison

| Aspect | Stdio | HTTP |
|--------|-------|------|
| **Deployment** | Local process | Web service |
| **Setup for users** | Config file + local code | URL only |
| **State** | Stateful (process stays alive) | Stateless (each request independent) |
| **Data locality** | All data stays local | Data travels over network |
| **Accessibility** | Local machine only | Anyone with the URL |
| **Cold starts** | None | Yes (serverless) |
| **MCP Apps support** | Full | Full |

## When to Use Which

### Use Stdio When:

- **Development** — Fast iteration without deployment
- **Privacy-sensitive** — Data never leaves the machine
- **Local tools** — File system access, local databases
- **Stateful operations** — Long-running processes, file watchers

### Use HTTP When:

- **Public distribution** — Anyone can connect with a URL
- **Multi-agent support** — Claude, ChatGPT, Gemini, Copilot all work
- **Serverless fits** — Stateless tool calls, pay-per-invocation
- **No installation** — Users just paste a URL

## This Template's Setup

This webcomic template includes both transports:

```
mcp-server-stdio/     # Stdio server for local development
  └── src/
      ├── index.ts    # Entry point with StdioServerTransport
      └── server.ts   # Shared server logic

netlify/functions/    # HTTP server for deployment
  └── mcp.ts          # Serverless function with JSON-RPC handling
```

**For local development:**
```bash
# Build and run stdio server
cd mcp-server-stdio
npm run build

# Add to Claude Desktop config:
{
  "mcpServers": {
    "comic-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-stdio/dist/index.js"]
    }
  }
}
```

**For production:**
```bash
# Deploy to Netlify
netlify deploy --prod

# Share the URL with users:
# https://your-site.netlify.app/mcp
```

## Implementation Tips

### HTTP: Remember CORS

Browser-based clients need CORS headers:

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',  // Or specific origins
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Always handle OPTIONS preflight
if (event.httpMethod === 'OPTIONS') {
  return { statusCode: 204, headers: CORS_HEADERS, body: '' };
}
```

### HTTP: Add a Health Check

GET requests should return server info for discovery:

```typescript
if (event.httpMethod === 'GET') {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      name: 'comic-mcp-server',
      version: '1.0.0',
      description: 'MCP server for webcomic archive',
    }),
  };
}
```

### Stdio: Log to stderr

Stdout is for MCP messages only. Debug logs go to stderr:

```typescript
console.error('Debug info goes here');  // ✅ Goes to stderr
console.log('This breaks the protocol'); // ❌ Goes to stdout
```

### Both: Same Tool Logic

Keep tool implementations transport-agnostic:

```typescript
// tools/get-page.ts
export async function getPageHandler(params: {
  comic_id: string;
  storyline_id: string;
  page_number: number
}) {
  // Pure business logic - no transport concerns
  const manifest = loadManifest();
  const page = findPage(manifest, params);
  return { page, navigation: buildNavigation(params) };
}

// Use in stdio server
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'get_page') {
    const result = await getPageHandler(req.params.arguments);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
});

// Use in HTTP server
case 'tools/call':
  if (params.name === 'get_page') {
    return await getPageHandler(params.arguments);
  }
```

## Summary

| You want... | Use... |
|-------------|--------|
| Local development | Stdio |
| Public access | HTTP |
| Privacy (data stays local) | Stdio |
| Zero-install for users | HTTP |
| Works with all major AI agents | HTTP |

## Customization

When adapting this template for your webcomic:

1. **Stdio server** — Update `mcp-server-stdio/src/server.ts` with your tools
2. **HTTP server** — Update `netlify/functions/mcp.ts` with matching logic
3. **Server info** — Update name, version, and description in both servers

Keep the tool handlers in sync between both servers, or extract them to a shared module.
