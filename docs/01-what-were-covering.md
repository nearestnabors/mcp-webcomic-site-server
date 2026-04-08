# What We're Covering

This tutorial explores three ways to serve content to AI agents and humans from a single source of truth.

## MCP Tools

MCP Tools are functions that an AI agent can call on your server. They're defined with a name, description, and input schema.

**Tools in this template:**

| Tool | Description | Returns |
|------|-------------|---------|
| `list_comics` | Get all available comics in the archive | JSON data (comic titles, descriptions, counts) |
| `list_storylines` | Get storylines for a specific comic | JSON data (storyline titles, page counts) |
| `list_characters` | Get all characters, optionally filtered by comic | JSON data (character names, bios, thumbnails) |
| `search_comics` | Full-text search across transcripts and commentary | JSON data (matching pages with snippets) |
| `search_by_character` | Find all pages featuring a specific character | JSON data (pages where character appears) |
| `get_transcript` | Get the transcript text for a specific page | Text (panel descriptions and dialogue) |
| `get_page` | Get a specific comic page | JSON data + **opens Comic Reader UI** |

Tools can return plain data (for the agent to reason about) or open an MCP App (for the user to interact with).

## MCP Resources

MCP Resources expose context and data to AI agents — things like files, database schemas, or application-specific information. Servers list available resources via `resources/list` and serve content via `resources/read`. Each resource has a unique URI.

**Common use cases:**
- File contents (`file:///project/src/main.rs`)
- Database schemas
- Configuration data
- Documentation

**Resources in this template:**

| Resource | URI | Purpose |
|----------|-----|---------|
| Transcript Index | `transcript://webcomic/index` | Index of all available comic transcripts |
| Commentary Index | `commentary://webcomic/index` | Index of all author commentary |
| Storyline Transcripts | `transcript://{comic-id}/{storyline-id}` | All transcripts for a storyline |
| Storyline Commentary | `commentary://{comic-id}/{storyline-id}` | All commentary for a storyline |

Resources provide context that AI agents can read without invoking tools — useful for grounding responses in your content.

## MCP Apps

MCP Apps are HTML/CSS/JS applications that render inside AI agent interfaces like Claude. When an agent calls a tool with a UI resource, the app opens in a sandboxed iframe.

**Key characteristics:**
- Standard web technologies (HTML, CSS, JavaScript)
- Run in a sandboxed iframe inside the agent host
- Communicate with the MCP server via `app.callServerTool()`
- Receive tool results via `app.ontoolresult` callback

**The Comic Reader App:**
- Displays comic images with proper scaling
- Shows transcript and commentary
- Provides navigation (prev/next page)
- Calls `get_page` to load new pages without leaving the UI

## WebMCP

WebMCP is a browser API that lets web pages expose tools to AI agents browsing the web. When `navigator.modelContext` is available, pages can register tools that agents can discover and call.

**WebMCP Tools on Comic Pages:**

| Tool | Description |
|------|-------------|
| `get_current_page` | Get data about the comic page being viewed |
| `get_transcript` | Get the transcript text for accessibility/TTS |
| `get_image_url` | Get the comic image URL |
| `first_page` | Navigate to the first page of the storyline |
| `prev_page` | Navigate to the previous page |
| `next_page` | Navigate to the next page |

**WebMCP Tools on All Pages:**

| Tool | Description |
|------|-------------|
| `list_comics` | Get list of all comics in the archive |
| `search_comics` | Search comic transcripts and commentary |

## Text vs. Structured Data vs. Rendered UI

Not every tool should open a UI. The decision depends on what the agent (and user) needs:

| Return Type | When to Use | Example |
|-------------|-------------|---------|
| **Text** | Agent needs to reason about or summarize data | `list_comics` returns comic titles for the agent to present conversationally |
| **Structured Data** | Agent needs to process or filter results | `search_comics` returns JSON results for further processing |
| **Rendered UI** | User needs to interact visually | `get_page` opens the comic reader so users can see and navigate the comic |

**Rule of thumb:** If the user will want to *look at* something, use a UI. If the agent will want to *think about* something, use text or structured data.

---

## Customization

When adapting this template for your own comic:

1. **MCP Tools** — Add or modify tools in `netlify/functions/mcp.ts`
2. **MCP Resources** — Add context resources (transcripts, commentary, etc.) in the same file
3. **MCP Apps** — UI components are built in `mcp-app/` and bundled into the server
4. **WebMCP** — Tool registration in templates automatically uses your manifest data

The architecture is content-agnostic — swap out the sample content for your own comics and the same rendering surfaces work automatically.
