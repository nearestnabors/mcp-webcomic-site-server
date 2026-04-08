# Tools, Resources, and Prompts

This chapter explains three MCP mechanisms for serving content to AI agents and how they differ.

## Overview

| Mechanism | What It Is | Who Initiates | When to Use |
|-----------|-----------|---------------|-------------|
| **Tools** | Functions the agent calls | Agent decides | Actions, queries, operations |
| **Resources** | Data the agent reads | Agent requests, harness can pre-load into context | Context, reference material |
| **Prompts** | Pre-built experiences | User selects | Guided workflows, complex tasks |

## MCP Tools

Tools are **functions** that AI agents invoke to perform actions or retrieve data. The agent decides when to call a tool based on the user's request.

**Characteristics:**
- Agent-initiated (the AI chooses to call them)
- Can have side effects (open UI, trigger actions)
- Return structured results
- Defined with name, description, and input schema

**Tools in this template:**

| Tool | Purpose | Opens UI? |
|------|---------|-----------|
| `list_comics` | Get all comics | No |
| `list_storylines` | Get storylines for a comic | No |
| `list_characters` | Get character roster | No |
| `search_comics` | Full-text search | No |
| `search_by_character` | Find pages by character | No |
| `get_transcript` | Get page transcript | No |
| `get_page` | Get page and show reader | **Yes** |

**Registration:** Tools are registered in `netlify/functions/mcp.ts` via the `tools/list` handler:

```typescript
case 'tools/list':
  return {
    tools: [
      {
        name: 'list_comics',
        description: 'Get all available comics in the archive',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      // ... more tools
    ]
  };
```

## MCP Resources

Resources are **data** that AI agents can read for context. Unlike tools, resources don't perform actions — they provide information the agent can use to answer questions or make decisions.

**Characteristics:**
- Agent-requested (agent asks for specific URIs)
- Read-only (no side effects)
- Identified by URI
- Can be listed (`resources/list`) and read (`resources/read`)
- Harness can pre-load resources into context before the conversation

**Resources in this template:**

| Resource | URI | Purpose |
|----------|-----|---------|
| Transcript Index | `transcript://webcomic/index` | List of all transcript URIs |
| Commentary Index | `commentary://webcomic/index` | List of all commentary URIs |
| Storyline Transcripts | `transcript://{comic-id}/{storyline-id}` | All transcripts for a storyline |
| Storyline Commentary | `commentary://{comic-id}/{storyline-id}` | All commentary for a storyline |

**How agents use resources:**

1. Agent calls `resources/list` to discover available resources
2. Agent calls `resources/read` with a specific URI to get content
3. Agent uses the content as context for responses

**Example flow:**
```
User: "What happens in the Gale Allen storyline?"

Agent thinks: "I should read the transcript resource for context"
Agent calls: resources/read({ uri: "transcript://fran-hopper-comics/gale-allen" })
Agent receives: All page transcripts for that storyline
Agent responds: "In the Gale Allen storyline, the Girl Squadron..."
```

**Registration:** Resources are listed in `netlify/functions/mcp.ts` via the `resources/list` handler:

```typescript
case 'resources/list':
  const resources = [];
  resources.push({
    uri: 'transcript://webcomic/index',
    name: 'Transcript Index',
    description: 'Index of all available comic page transcripts',
    mimeType: 'text/plain',
  });
  // ... more resources
  return { resources };
```

## MCP Prompts

Prompts are **pre-built experiences** that users can invoke directly. Unlike tools (which agents decide to call), prompts are user-initiated and provide guided workflows for complex tasks.

> **Note:** As of early 2025, Claude Desktop doesn't yet surface MCP prompts in its `/` command picker. The prompts are implemented and ready for when support arrives.

**Characteristics:**
- User-initiated (user selects from a list)
- Returns a message for the AI to process
- Can combine multiple data sources
- Good for complex, multi-step experiences

**Prompts in this template:**

| Prompt | Purpose | Parameters |
|--------|---------|------------|
| `dramatic-reading` | Perform a comic page as a radio play | `comic_id`, `storyline_id`, `page_number` |

**How prompts work:**

1. User sees available prompts in their AI interface
2. User selects a prompt and provides parameters
3. Server generates a rich message with context
4. AI processes the message and responds accordingly

**Example: Dramatic Reading**

```
User selects: "dramatic-reading" prompt
User provides: comic_id="fran-hopper-comics", storyline_id="gale-allen", page_number=1

Server generates message containing:
- Page transcript
- Character voice descriptions
- Instructions for dramatic reading

AI performs: A dramatic reading of the page with distinct character voices
```

**Registration:** Prompts are registered in `mcp-server/src/index.ts`:

```typescript
import {
  dramaticReadingPrompt,
  dramaticReadingSchema,
  dramaticReadingHandler,
} from './prompts/dramatic-reading.js';

// Register the prompt
server.prompt(
  dramaticReadingPrompt.name,
  dramaticReadingPrompt.description,
  dramaticReadingSchema,
  async (params) => {
    return await dramaticReadingHandler({
      comic_id: params.comic_id,
      storyline_id: params.storyline_id,
      page_number: params.page_number,
    });
  }
);
```

**Prompt handler example** (`mcp-server/src/prompts/dramatic-reading.ts`):

```typescript
export async function dramaticReadingHandler(input: DramaticReadingInput) {
  // Fetch page data and character voices
  const pageResult = await getPageHandler(input);
  const charactersResult = await listCharactersHandler({ comic_id: input.comic_id });

  // Build a rich prompt message
  const promptText = `# Dramatic Reading Request

Please perform a dramatic reading of this comic page...

## Character Voices
${charactersResult.characters
  .filter(c => c.voice)
  .map(c => `- **${c.name}**: ${c.voice}`)
  .join('\n')}

## Transcript
${pageResult.page.transcript}`;

  return {
    messages: [{ role: 'user', content: { type: 'text', text: promptText } }]
  };
}
```

## When to Use Each

### Use Tools When:
- Agent needs to **perform an action** (search, navigate, open UI)
- Result depends on **user input** (search query, page number)
- You want the agent to **decide** when to invoke it
- The operation is **atomic** (one request, one response)

### Use Resources When:
- Agent needs **reference material** for context
- Content is **static or slowly changing**
- You want agents to **proactively read** relevant content
- Content is useful for **grounding responses** in facts
- Harness might **pre-load** content into context

### Use Prompts When:
- User wants a **guided experience** (not ad-hoc)
- Task requires **combining multiple data sources**
- You want to **structure how the AI responds**
- The experience is **repeatable** with different parameters

## How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                        manifest.json                             │
│                     (source of truth)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  MCP Tools    │    │ MCP Resources │    │  MCP Prompts  │
│               │    │               │    │               │
│ Agent calls   │    │ Agent reads   │    │ User selects  │
│ to act/query  │    │ for context   │    │ for guided    │
│               │    │               │    │ experiences   │
│ list_comics   │    │ transcript:// │    │               │
│ get_page      │    │ commentary:// │    │dramatic-reading│
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │  MCP Server   │
                    │   (runtime)   │
                    └───────────────┘
```

## Customization

### Adding a New Tool

1. Add handler in `netlify/functions/mcp.ts`:
   ```typescript
   case 'tools/call':
     if (params.name === 'my_new_tool') {
       return myNewToolHandler(params.arguments);
     }
   ```

2. Register in `tools/list`:
   ```typescript
   {
     name: 'my_new_tool',
     description: 'What it does',
     inputSchema: { /* JSON Schema */ }
   }
   ```

### Adding a New Resource

1. Define URI scheme in `netlify/functions/mcp.ts`
2. Add to `resources/list` handler
3. Handle in `resources/read` switch statement

### Adding a New Prompt

1. Create prompt file in `mcp-server/src/prompts/`:
   ```typescript
   export const myPrompt = {
     name: 'my-prompt',
     description: 'What it does',
     arguments: [{ name: 'param1', required: true }]
   };

   export async function myPromptHandler(input) {
     // Fetch data, build message
     return { messages: [{ role: 'user', content: { type: 'text', text: '...' } }] };
   }
   ```

2. Register in `mcp-server/src/index.ts`:
   ```typescript
   server.prompt(myPrompt.name, myPrompt.description, schema, myPromptHandler);
   ```

## Summary

| | Tools | Resources | Prompts |
|-|-------|-----------|---------|
| **When** | Runtime | Runtime | Runtime |
| **Who initiates** | Agent | Agent or harness | User |
| **Purpose** | Actions/queries | Context/data | Guided experiences |
| **Side effects** | Yes (can open UI) | No (read-only) | No (returns message) |
| **File location** | `netlify/functions/mcp.ts` | `netlify/functions/mcp.ts` | `mcp-server/src/prompts/` |
