# One Server, Three Clients

The architecture centers on a single **source of truth** (the manifest) that feeds three different rendering surfaces.

## The Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOURCE OF TRUTH                               │
│                                                                      │
│          manifest.json  +  characters.json                          │
│              (canonical data for all comics)                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────┼───────────────────────────────┐
        │                       │                               │
        ▼                       ▼                               ▼
┌───────────────┐     ┌─────────────────┐         ┌─────────────────┐
│ Static Site   │     │   MCP Server    │         │  WebMCP Tools   │
│ (11ty build)  │     │   (Node.js)     │         │  (on-page JS)   │
│               │     │                 │         │                 │
│ Human readers │     │ AI agents       │         │ Browser agents  │
│ via browser   │     │ (Claude, etc.)  │         │ (AI + browser)  │
└───────────────┘     └─────────────────┘         └─────────────────┘
```

## Surface 1: Static Website

For humans browsing directly. Built with 11ty (Eleventy), outputs pure HTML.

- **Audience:** Human readers
- **Delivery:** Netlify CDN (or any static host)
- **Search:** Pagefind (static search index)
- **Features:** Full comic archive, keyboard navigation

## Surface 2: MCP Server + MCP App

For AI agents in chat interfaces like Claude Desktop or Claude.ai.

- **Audience:** AI agents (and their users)
- **Transport:** HTTP (streamable) — hosted as Netlify Function
- **Tools:**
  - `list_comics` — List all available comics
  - `list_storylines` — List storylines for a comic
  - `get_page` — Get a comic page (opens MCP App)
  - `get_transcript` — Get transcript text only
  - `search_comics` — Full-text search across transcripts/commentary
  - `list_characters` — List characters (optionally filtered by comic)
  - `search_by_character` — Find pages featuring a specific character
- **UI:** MCP App renders comic pages inside the agent interface

The MCP App is a vanilla HTML/CSS/JS application bundled into a single HTML file. When tools like `get_page` are called, the host (Claude) renders the app in an iframe and pushes tool results to it.

## Surface 3: WebMCP

For AI agents browsing the live website in a browser.

- **Audience:** Browser-based agents (Operator, Computer Use, etc.)
- **Registration:** Tools registered via `navigator.modelContext.registerTool()`
- **Data:** Page data embedded as JSON in script tags
- **Features:** Navigate comics, search transcripts, read current page

## Why This Architecture?

### Single Source of Truth

All three surfaces read from the same `manifest.json`. When you add a new comic page:
1. Update the manifest
2. Rebuild the static site
3. Restart the MCP server (or redeploy)

Both human readers and AI agents see the same content.

### Right Tool for the Job

| Surface | Strength | Use Case |
|---------|----------|----------|
| Static Site | Fast, SEO-friendly, accessible | Casual browsing, search engines |
| MCP Server | Structured tools, rich UI | "Show me the comic" in Claude |
| WebMCP | Programmatic control | Agent navigating the live site |

### Progressive Enhancement

- If WebMCP isn't supported, humans still see the normal site
- If the MCP server is down, the static site still works
- Each surface degrades gracefully

---

## Customization

To adapt this architecture for your own comic:

1. **Replace manifest.json** — Add your comics, storylines, and pages following the schema
2. **Replace characters.json** — Define your own characters with bios and voice descriptions
3. **Replace images** — Put your comic artwork in `src/images/comics/`
4. **Update branding** — Modify `shared/tokens.css` for your color scheme
5. **Deploy** — The same Netlify setup works for any comic archive

The architecture is designed to be content-agnostic. The MCP tools, WebMCP registrations, and static site templates all read from the manifest automatically.
