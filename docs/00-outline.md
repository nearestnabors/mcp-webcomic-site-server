# Tutorial Outline: Building an MCP-Enabled Webcomic Site

This tutorial covers how to build a webcomic archive that serves content to both humans and AI agents from a single source of truth.

## What We're Covering

**Technical file:** `01-what-were-covering.md`
- MCP Apps and how they work (HTML, CSS, JS)
- WebMCP (coming to browsers)
- When to return text vs. structured data vs. rendered UI

## One Server, Multiple Clients

**Technical file:** `02-architecture-overview.md`
- Architecture diagram showing single source of truth
- Three rendering surfaces: Static Site, MCP Server + App, WebMCP

## MCP HTTP Transport

**Technical file:** `03-http-vs-stdio.md`
- HTTP transport: web service, JSON-RPC over HTTP
- Connecting AI agents via MCP Connectors
- Local development with Netlify Dev (`http://localhost:8888/mcp`)
- Implementation tips: CORS, health checks, serverless limitations

## Tools, Resources, and Templates

**Technical file:** `04-tools-resources-templates.md`
- Difference between MCP Tools, MCP Resources, and Nunjucks Templates
- When agents call tools vs read resources
- WebMCP tool registration in templates
- What's implemented in this template

## The MCP App Comic Browser

**Technical file:** `05-mcp-apps-anatomy.md`
- Demo: Reading comics inside AI interfaces (Claude, ChatGPT)
- Anatomy of an MCP App
  - Communication protocol (`app.connect()`, `app.ontoolresult`, `app.callServerTool()`)
  - Single-file bundling with Vite
  - Registering apps as UI resources
  - Declaring `_meta.ui` on tools

## Navigating the Web with WebMCP

**Technical file:** `06-webmcp-anatomy.md`
- Demo: Using WebMCP to navigate forward/backward
- Anatomy of WebMCP
  - `navigator.modelContext.registerTool()`
  - Data embedding pattern
  - Tool categories (data, navigation, action)
  - Progressive enhancement

## Text vs. Data vs. UI

**Technical file:** `07-text-vs-data-vs-ui.md`
- Decision framework
- Examples by use case
- Anti-patterns to avoid

---

## File Index

| File | Content |
|------|---------|
| `00-outline.md` | This outline |
| `01-what-were-covering.md` | Overview of MCP Apps, WebMCP, return types |
| `02-architecture-overview.md` | Single source of truth, three surfaces |
| `03-http-vs-stdio.md` | MCP HTTP transport and local development |
| `04-tools-resources-prompts.md` | Tools vs Resources vs Prompts |
| `05-mcp-apps-anatomy.md` | How MCP Apps work, bundling, registration |
| `06-webmcp-anatomy.md` | WebMCP API, tool registration, templates |
| `07-text-vs-data-vs-ui.md` | Return type decision framework |
| `08-radio-plays.md` | Audio features: TTS and dramatic reading |

---

## Customization

This template is designed to be adapted for your own webcomic. The sample content uses public domain comics from Fran Hopper, but you can replace:

1. **manifest.json** — Add your own comics, storylines, and pages
2. **characters.json** — Define your own characters
3. **images** — Replace with your comic artwork
4. **Theme** — Modify `shared/tokens.css` for your color scheme

See each tutorial file for specific customization guidance.
