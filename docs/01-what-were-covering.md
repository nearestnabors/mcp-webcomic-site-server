# What We're Covering

This tutorial explores three ways to serve content to AI agents and humans from a single source of truth.

## MCP Apps

MCP Apps are HTML/CSS/JS applications that render inside AI agent interfaces like Claude. When an agent calls a tool, instead of just returning text, the tool can open an interactive UI.

**Key characteristics:**
- Standard web technologies (HTML, CSS, JavaScript)
- Run in a sandboxed iframe inside the agent host
- Communicate with the MCP server via `app.callServerTool()`
- Receive tool results via `app.ontoolresult` callback

## WebMCP

WebMCP is a browser API that lets web pages expose tools to AI agents browsing the web. When `navigator.modelContext` is available, pages can register tools that agents can discover and call.

**Key characteristics:**
- Tools are registered via `navigator.modelContext.registerTool()`
- Enables agents to interact with pages programmatically
- Tools can read page data, trigger navigation, perform searches
- Works alongside regular page rendering

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

1. **MCP Apps** — The reader UI in `mcp-app/` works generically with any comic data from your manifest
2. **WebMCP** — Tool registration in templates automatically uses your manifest data
3. **Return types** — The decision framework applies regardless of content type

The architecture is content-agnostic — swap out the sample content for your own comics and the same three rendering surfaces work automatically.
