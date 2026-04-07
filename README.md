# MCP Webcomic Site Server

A template for building MCP-enabled webcomic archives that work across three surfaces:

1. **Static Website** - HTML pages for human readers, built with 11ty
2. **MCP Server** - Tools and UI for AI agents (Claude, ChatGPT, etc.)
3. **WebMCP** - Browser-based tools for web agents

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/nearestnabors/mcp-webcomic-site-server
cd mcp-webcomic-site-server
npm install
```

### Development

```bash
# Build the site
npm run build

# Start dev server
npm run serve
# Open http://localhost:8080

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Build All (including MCP apps)

```bash
npm run build:all
```

This builds the MCP apps, embeds them into the Netlify function, and builds the static site.

## Adding Your Own Comics

1. **Add images** to `src/images/comics/your-comic/`
   ```
   src/images/comics/
   └── your-comic/
       ├── storyline-1/
       │   ├── page-1.jpg
       │   ├── page-2.jpg
       │   └── ...
       └── storyline-2/
           └── ...
   ```

2. **Update manifest.json** at `src/_data/manifest.json`:
   ```json
   {
     "generated": "2026-04-07T00:00:00Z",
     "comics": [
       {
         "id": "your-comic-id",
         "title": "Your Comic Title",
         "type": "episodic",
         "description": "Your comic description",
         "storylines": [
           {
             "id": "storyline-1",
             "title": "Storyline Title",
             "order": 1,
             "pages": [
               {
                 "pageNumber": 1,
                 "title": "Page Title",
                 "slug": "storyline-1-page-1",
                 "image": "your-comic/storyline-1/page-1.jpg",
                 "imageWidth": 800,
                 "imageHeight": 1200,
                 "alt": "Alt text for accessibility",
                 "transcript": "Panel descriptions and dialogue",
                 "commentary": "Optional author notes",
                 "publishedDate": "2026-01-01",
                 "comments": [],
                 "characters": ["character-slug"],
                 "originalUrl": "/comics/storyline-1-page-1/"
               }
             ]
           }
         ]
       }
     ]
   }
   ```

3. **Update characters.json** at `src/_data/characters.json`:
   ```json
   {
     "character-slug": {
       "slug": "character-slug",
       "name": "Character Name",
       "comicId": "your-comic-id",
       "bio": "Character biography",
       "voice": "Voice description for TTS casting",
       "thumbnailPath": "images/characters/character-thumb.png",
       "thumbnailAlt": "Character portrait"
     }
   }
   ```

4. **Rebuild**: `npm run build`

See `docs/` for detailed tutorials.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOURCE OF TRUTH                              │
│                                                                     │
│   manifest.json  ←──────────────────────────────  characters.json   │
│   (all comics)                                    (cast info)       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────┼───────────────────────────────┐
        │                       │                               │
        ▼                       ▼                               ▼
┌───────────────┐     ┌─────────────────┐         ┌─────────────────┐
│ Static Site   │     │   MCP Server    │         │  WebMCP Tools   │
│ (11ty build)  │     │   (HTTP/stdio)  │         │  (on-page JS)   │
│               │     │                 │         │                 │
│ - HTML pages  │     │ - list_comics   │         │ - list_comics   │
│ - Pagefind    │     │ - get_page      │         │ - search_comics │
│ - WebMCP JS   │     │ - search_comics │         │ - get_page      │
│               │     │ - MCP App UI    │         │                 │
│ Netlify CDN   │     │ Netlify Func    │         │ Browser agents  │
└───────────────┘     └─────────────────┘         └─────────────────┘
```

## MCP Integration

### For Claude.ai / Claude Desktop

1. Deploy to Netlify (or your preferred host)
2. Add as MCP connector: `https://your-site.netlify.app/mcp`
3. Ask Claude to "show me the comics"

### Local Development with Claude Desktop

For local testing, add to your Claude Desktop MCP config:

```json
{
  "your-comics-local": {
    "command": "npx",
    "args": ["tsx", "/path/to/mcp-webcomic-site-server/mcp-server-stdio/src/index.ts"]
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `list_comics` | List all comics with metadata |
| `list_storylines` | List storylines for a comic |
| `get_page` | Get a comic page (opens reader UI in MCP App) |
| `search_comics` | Full-text search across transcripts and commentary |
| `get_transcript` | Get transcript text for a specific page |
| `list_characters` | List all characters (optionally filtered by comic) |
| `search_by_character` | Find all pages featuring a character |

### Tool Examples

**List all comics:**
```
list_comics()
→ { comics: [{ id: "fran-hopper-comics", title: "Fran Hopper Comics", ... }] }
```

**Get a specific page:**
```
get_page({ comic_id: "fran-hopper-comics", storyline_id: "gale-allen", page_number: 1 })
→ Opens the MCP App reader showing page 1
```

**Search transcripts:**
```
search_comics({ query: "space" })
→ { results: [{ title: "Gale Allen, Page 1", snippet: "...through the stars...", ... }] }
```

## WebMCP (Browser Agents)

When the WebMCP API is available, the site registers tools that browser-based AI agents can call:

- `get_current_page` - Returns data about the current comic page
- `get_transcript` - Returns the transcript of the current page
- `prev_page` / `next_page` - Navigate between pages
- `search_comics` - Search via Pagefind

Tools are registered via `navigator.modelContext.registerTool()` when supported.

## Project Structure

```
mcp-webcomic-site-server/
├── src/                    # 11ty source files
│   ├── _data/              # Data files (manifest.json, characters.json)
│   ├── _includes/          # Template partials
│   ├── _layouts/           # Page layouts
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   ├── images/             # Comic images
│   └── pages/              # Static pages
├── shared/                 # Shared design tokens
├── mcp-server/             # HTTP MCP server (for Netlify)
├── mcp-server-stdio/       # Stdio MCP server (for local development)
├── mcp-app/                # MCP App UI (comic reader)
├── netlify/                # Netlify Functions
├── scripts/                # Build scripts
├── tests/                  # Test suite
└── docs/                   # Documentation
```

## Sample Content

This template includes sample comics from **Fran Hopper** (1922-2017), a pioneering Golden Age comic artist who created groundbreaking female protagonists in science fiction. The included storylines are:

- **Gale Allen and the Girl Squadron** - An all-female space battalion
- **Mysta of the Moon** - A super-scientist guardian of Earth

The sample content demonstrates the manifest structure and serves as a starting point. Replace with your own comics!

Fran Hopper's work entered the public domain and is available via the Digital Comic Museum.

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build:all`
3. Publish directory: `_site`
4. Functions directory: `netlify/functions`

The MCP endpoint will be available at `https://your-site.netlify.app/mcp`

### Other Platforms

The static site can be deployed anywhere that serves static files. The MCP server requires a serverless function platform or a Node.js hosting environment.

## License

MIT License - see [LICENSE](LICENSE) file.

Framework code is MIT licensed. Sample comic content (Fran Hopper's work) is in the public domain.

## Credits

- Framework created by [RL Nabors](https://nearestnabors.com)
- Sample content from Fran Hopper (public domain, via Digital Comic Museum)
- Built with [11ty](https://www.11ty.dev/), [MCP SDK](https://modelcontextprotocol.io/), and [Pagefind](https://pagefind.app/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
