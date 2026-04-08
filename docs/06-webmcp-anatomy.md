# Anatomy of WebMCP

WebMCP is a browser API that lets web pages expose tools to AI agents. When an agent browses a page that supports WebMCP, it can discover and call tools instead of parsing HTML.

## How WebMCP Works

1. **Page loads** - Normal HTML page renders for humans
2. **Tools register** - JavaScript registers tools via `navigator.modelContext`
3. **Agent arrives** - Browser-based agent visits the page
4. **Agent discovers tools** - Agent queries available tools
5. **Agent calls tools** - Agent invokes tools to get structured data or trigger actions
6. **Agent proceeds** - Agent uses results to navigate, summarize, or respond

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │     │   Browser   │     │   Page JS   │
│  "what's    │ ──▶ │  loads page │ ──▶ │  registers  │
│   here?"    │     │             │     │  tools      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │         list tools                    │
       │ ────────────────────────────────────▶ │
       │                                       │
       │         [get_current_page,            │
       │          next_page, prev_page,        │
       │          get_transcript]              │
       │ ◀──────────────────────────────────── │
       │                                       │
       │         call get_current_page()       │
       │ ────────────────────────────────────▶ │
       │                                       │
       │         { comic_id, page_number,      │
       │           transcript, ... }           │
       │ ◀──────────────────────────────────── │
```

## Registering Tools

Tools are registered when `navigator.modelContext` is available:

```javascript
if ('modelContext' in navigator) {
  // Register a tool to get current page data
  navigator.modelContext.registerTool({
    name: 'get_current_page',
    description: 'Get structured data about the current comic page',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      // Return the embedded page data
      const data = JSON.parse(
        document.getElementById('page-data').textContent
      );
      return data;
    }
  });

  // Register navigation tools
  navigator.modelContext.registerTool({
    name: 'next_page',
    description: 'Navigate to the next comic page',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const nextLink = document.querySelector('link[rel="next"]');
      if (nextLink) {
        window.location.href = nextLink.href;
        return { navigated: true, url: nextLink.href };
      }
      return { navigated: false, reason: 'No next page' };
    }
  });
}
```

## Data Embedding Pattern

Pages embed structured data for WebMCP tools to return:

```html
<!-- Embedded in each comic page -->
<script type="application/json" id="page-data">
{
  "comic_id": "fran-hopper-comics",
  "storyline_id": "gale-allen",
  "page_number": 4,
  "title": "Gale Allen, Page 4",
  "image_url": "/images/comics/fran-hopper/gale-allen/page-4.png",
  "transcript": "Panel 1: Gale stands at the control console...",
  "commentary": "",
  "has_prev": true,
  "has_next": true
}
</script>
```

This is invisible to human readers but immediately available to agents.

## Template Integration (11ty/Nunjucks)

WebMCP tools are registered via template partials:

```
_includes/
├── webmcp-base.njk       # Tools available on all pages
└── webmcp-comic.njk      # Comic-specific tools (extends base)
```

**webmcp-base.njk:**
```html
<script>
if ('modelContext' in navigator) {
  navigator.modelContext.registerTool({
    name: 'list_comics',
    description: 'Get a list of all comics in the archive',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => ({
      comics: [
        { id: 'fran-hopper-comics', title: 'Fran Hopper Comics', pages: 10 }
      ]
    })
  });

  navigator.modelContext.registerTool({
    name: 'search_comics',
    description: 'Search comic transcripts and commentary',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    },
    execute: async ({ query }) => {
      // Use Pagefind's JavaScript API
      const pagefind = await import('/pagefind/pagefind.js');
      const results = await pagefind.search(query);
      return {
        query,
        results: results.results.slice(0, 10).map(r => ({
          title: r.meta.title,
          url: r.url,
          excerpt: r.excerpt
        }))
      };
    }
  });
}
</script>
```

**webmcp-comic.njk:**
```html
{% include "webmcp-base.njk" %}

<script type="application/json" id="page-data">
{{ page | pageDataJson | safe }}
</script>

<script>
if ('modelContext' in navigator) {
  navigator.modelContext.registerTool({
    name: 'get_current_page',
    description: 'Get data about the current comic page including transcript',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => JSON.parse(document.getElementById('page-data').textContent)
  });

  navigator.modelContext.registerTool({
    name: 'get_transcript',
    description: 'Get the transcript of the current comic page for accessibility',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const data = JSON.parse(document.getElementById('page-data').textContent);
      return {
        title: data.title,
        transcript: data.transcript
      };
    }
  });

  navigator.modelContext.registerTool({
    name: 'prev_page',
    description: 'Navigate to the previous comic page',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const link = document.querySelector('link[rel="prev"]');
      if (link) {
        window.location.href = link.href;
        return { navigated: true };
      }
      return { navigated: false, reason: 'At first page' };
    }
  });

  navigator.modelContext.registerTool({
    name: 'next_page',
    description: 'Navigate to the next comic page',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const link = document.querySelector('link[rel="next"]');
      if (link) {
        window.location.href = link.href;
        return { navigated: true };
      }
      return { navigated: false, reason: 'At last page' };
    }
  });
}
</script>
```

## Tool Categories

### Data Tools (read-only)
- `get_current_page` — Returns embedded page metadata (comic_id, storyline_id, page_number, title, transcript, image_url)
- `get_transcript` — Returns transcript text for accessibility/TTS
- `get_image_url` — Returns absolute URL to comic image
- `list_comics` — Returns available comics
- `search_comics` — Searches via Pagefind

### Navigation Tools (side effects)
- `next_page` — Navigates forward
- `prev_page` — Navigates backward

### Action Tools (interactions)
- Could trigger UI actions like opening modals, playing audio, etc.

## Progressive Enhancement

WebMCP is purely additive. If the browser doesn't support `navigator.modelContext`:

- Humans see the normal page
- Search engines index normal HTML
- Agents without WebMCP can still parse the page visually

```javascript
if ('modelContext' in navigator) {
  // Register tools
} else {
  // Nothing happens - page works normally
}
```

## Comparison: WebMCP vs MCP Server

| Aspect | WebMCP | MCP Server |
|--------|--------|------------|
| **Where it runs** | In the browser | On your server |
| **Who calls it** | Browser-based agents | Any MCP client |
| **Data access** | Only what's in the page | Full manifest |
| **UI rendering** | The page IS the UI | Can return MCP App |
| **Offline** | Works with cached pages | Requires server |
| **Use case** | Agent browsing your site | Agent in chat interface |

## Why Both?

**MCP Server** is for when users talk to an agent directly:
> "Show me the comic about space adventures"

**WebMCP** is for when agents browse the web:
> Agent navigates to your-comic-site.com, discovers tools, reads comics

They serve different interaction models but share the same underlying data.

---

## Customization

To adapt WebMCP for your own comic:

1. **Data embedding** — The templates automatically embed your manifest data
2. **Tool registration** — Tools work generically with any comic structure
3. **Custom tools** — Add domain-specific tools in `webmcp-comic.njk`

The WebMCP partials read from your manifest, so replacing content is automatic once your `manifest.json` is populated.
