# MCP HTTP Transport

MCP servers communicate with hosts (like Claude) through **transports**. This template uses HTTP transport — your server runs as a web service that AI agents connect to via URL.

## How HTTP Transport Works

```
┌─────────────┐   HTTP POST    ┌─────────────┐
│   Claude    │ ────────────▶  │ MCP Server  │
│  (any host) │ ◀────────────  │  (hosted)   │
└─────────────┘   JSON-RPC     └─────────────┘
```

**The flow:**
1. Server listens on an HTTP endpoint
2. Each tool call is a POST request with JSON-RPC body
3. Server responds with JSON-RPC result
4. Server is stateless (typically serverless)

## Connecting to Your Server

All major AI agents (Claude, ChatGPT, Gemini, Copilot) support HTTP connectors natively:

1. Go to Settings → MCP Connectors
2. Add connector URL: `https://your-site.netlify.app/mcp`
3. Done!

No local installation required — users just paste a URL.

## Local Development

For testing changes before deployment, use Netlify Dev:

```bash
# Start local server (serves site + functions on port 8888)
cd your-project
npx netlify dev
```

Then connect your AI agent to `http://localhost:8888/mcp`.

**In Claude Desktop:**
1. Open Settings → MCP Connectors
2. Add: `http://localhost:8888/mcp`
3. Test your tools

**After making changes to the MCP App:**
```bash
cd mcp-app && npm run build      # Rebuild the app
cd .. && npm run build:embed-apps # Embed into Netlify function
# Restart Netlify Dev to pick up changes
```

## Example: Netlify Function

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

## Implementation Tips

### Always Include CORS Headers

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

### Add a Health Check

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

### Handle Serverless Limitations

- **10s timeout** — Keep tool operations fast
- **Cold starts** — First request after idle may be slower
- **Stateless** — Each request is independent; use external storage for state

## This Template's Setup

```
netlify/functions/
  └── mcp.ts          # HTTP server with JSON-RPC handling

mcp-app/
  └── dist/
      └── index.html  # Bundled MCP App (embedded in server)
```

**Deploy to production:**
```bash
netlify deploy --prod

# Share the URL with users:
# https://your-site.netlify.app/mcp
```

## Summary

| Feature | HTTP Transport |
|---------|---------------|
| Deployment | Web service (Netlify, Vercel, etc.) |
| Setup for users | URL only — no installation |
| Accessibility | Anyone with the URL |
| Works with | Claude, ChatGPT, Gemini, Copilot |
| Local testing | `http://localhost:8888/mcp` via Netlify Dev |

## Customization

When adapting this template:

1. **Server logic** — Update `netlify/functions/mcp.ts` with your tools
2. **Server info** — Update name, version, and description
3. **MCP App** — Rebuild and embed after changes
