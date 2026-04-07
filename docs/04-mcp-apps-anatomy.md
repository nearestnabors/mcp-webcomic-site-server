# Anatomy of an MCP App

An MCP App is just HTML, CSS, and JavaScript bundled into a single file. What makes it special is how it communicates with the AI agent host.

## How MCP Apps Work

When an MCP tool declares a `_meta.ui.resourceUri` field, the host (Claude) knows to render a UI:

1. **Agent calls tool** - User asks "show me the comic"
2. **Host fetches UI resource** - Claude requests the HTML from `ui://comics/reader.html`
3. **UI renders in iframe** - The app appears in a sandboxed iframe
4. **Tool result is pushed** - The tool's response is sent to the app via `app.ontoolresult`
5. **App displays content** - The app parses the result and shows the comic

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   User      │      │   Claude    │      │ MCP Server  │
│  "show me   │ ──▶  │  calls      │ ──▶  │  get_page() │
│  the comic" │      │  get_page   │      │  returns    │
└─────────────┘      └─────────────┘      │  page data  │
                            │              └─────────────┘
                            ▼
                     ┌─────────────┐
                     │  MCP App    │
                     │  (iframe)   │
                     │  renders    │
                     │  comic page │
                     └─────────────┘
```

## The Communication Protocol

MCP Apps use `postMessage` over a JSON-RPC protocol. The `@modelcontextprotocol/ext-apps` SDK handles this:

```javascript
import { App } from '@modelcontextprotocol/ext-apps';

const app = new App({
  name: 'Comic Reader',
  version: '1.0.0'
});

// CRITICAL: Set ontoolresult BEFORE calling connect()
app.ontoolresult = (result) => {
  const data = JSON.parse(result.content?.[0]?.text || '{}');
  renderComic(data);
};

// Connect to the host (Claude)
await app.connect();

// Now safe to do DOM setup
setupEventListeners();

// Call tools on the MCP server (for subsequent navigation)
async function loadNextPage() {
  const result = await app.callServerTool({
    name: 'get_page',
    arguments: {
      comic_id: 'fran-hopper-comics',
      storyline_id: 'gale-allen',
      page_number: 5
    }
  });
  const data = JSON.parse(result.content?.[0]?.text || '{}');
  renderComic(data);
}
```

> **CRITICAL: MCP Apps are "push" not "pull"**
>
> The host (Claude) already has the tool result when it renders your app. It **pushes** this data to your app via `ontoolresult`. Your app should **NOT** make its own tool calls during initialization.
>
> **Wrong pattern (causes `visibility: hidden`):**
> ```javascript
> await app.connect();
> app.callServerTool('get_page', {...}); // Don't do this!
> ```
>
> **Correct pattern:**
> ```javascript
> app.ontoolresult = (result) => updateUI(result); // Wait for pushed data
> await app.connect();
> // Host pushes tool result automatically
> ```

> **GOTCHA: Init Order Matters!**
>
> The SDK's `connect()` must be called **before** any DOM setup or other initialization. If you do DOM work first, the PostMessage handshake may timeout.
>
> **Correct init order:**
> ```javascript
> async function init() {
>   app.ontoolresult = (result) => updateUI(result);
>   await app.connect();          // Connect IMMEDIATELY
>   setupEventListeners();        // DOM work AFTER connected
>   restoreUserPreferences();
> }
> ```

## File Structure

```
mcp-app/
├── index.html          # Main HTML structure
├── styles.css          # App styling
├── app.js              # Main app logic
├── src/
│   └── mcp-bridge.ts   # MCP SDK integration
├── dist/
│   └── index.html      # Bundled output (single file)
├── package.json
├── tsconfig.json
└── vite.config.ts      # Bundler config
```

## Bundling Into a Single File

Claude fetches the app as one HTML file, so all CSS and JS must be inlined. Vite with `vite-plugin-singlefile` handles this:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  }
});
```

Build with: `npm run build`

Output: `dist/index.html` contains everything.

## Registering the App on the Server

The server registers the bundled HTML as a `ui://` resource:

```typescript
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const resourceUri = 'ui://comics/reader.html';

registerAppResource(
  server,
  resourceUri,
  resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    const html = await fs.readFile(
      path.join(import.meta.dirname, '../../mcp-app/dist/index.html'),
      'utf-8'
    );
    return {
      contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }]
    };
  }
);
```

## Declaring UI on Tools

Tools that should open the app use `registerAppTool` with `_meta.ui`:

```typescript
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';

registerAppTool(
  server,
  'get_page',
  {
    title: 'Get Comic Page',
    description: 'Get a specific comic page with navigation context',
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: { type: 'string' },
        storyline_id: { type: 'string' },
        page_number: { type: 'number' }
      },
      required: ['comic_id', 'storyline_id', 'page_number']
    },
    _meta: {
      ui: { resourceUri: 'ui://comics/reader.html' }  // This opens the app
    }
  },
  async (params) => {
    const result = await getPageHandler(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }
);
```

## Which Tools Should Open the App?

Not every tool needs a UI:

| Tool | Opens App? | Why |
|------|------------|-----|
| `get_page` | Yes | Users want to *see* the comic |
| `list_comics` | No | Agent summarizes available comics |
| `list_storylines` | No | Agent describes storylines |
| `search_comics` | Maybe | Could show results in app, or let agent summarize |

**Rule:** Open the app when users need to interact with or view rich content.

## Key Constraints

1. **Single HTML file** - No external CSS/JS/images allowed in the bundle
2. **Sandboxed iframe** - Limited capabilities (no localStorage persistence across sessions)
3. **Async communication** - All tool calls are asynchronous
4. **No direct network access** - All data comes via `callServerTool()`
5. **Images load externally** - Comic images are fetched from the CDN, not embedded

---

## Customization

To adapt the MCP App for your own comic:

1. **The reader works generically** — It displays whatever data `get_page` returns
2. **Styling** — Modify `mcp-app/styles.css` for your look and feel
3. **Features** — Add or remove features in `mcp-app/app.js`
4. **Resource URI** — Update the `ui://` path if you change the namespace

The app reads comic data from the manifest via MCP tools, so swapping content is automatic once your manifest is populated.
