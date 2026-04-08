# When to Return Text vs. Structured Data vs. Rendered UI

A critical design decision in MCP tools is what format to return. The wrong choice makes agents clumsy and users frustrated.

## The Three Return Types

### 1. Plain Text
Human-readable prose that agents can quote or summarize.

```typescript
// Tool: describe_comic
return {
  content: [{
    type: 'text',
    text: 'This is a collection of Golden Age sci-fi comics featuring space adventures and heroic characters. The archive contains 10 pages across 2 storylines.'
  }]
};
```

**Best for:** Descriptions, summaries, explanations, anything the agent will quote verbatim or rephrase.

### 2. Structured Data (JSON)
Machine-readable data that agents can process, filter, or transform.

```typescript
// Tool: list_comics
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      comics: [
        { id: 'fran-hopper-comics', title: 'Fran Hopper Comics', storylines: 2, pages: 10 }
      ]
    }, null, 2)
  }]
};
```

**Best for:** Lists, search results, metadata, anything the agent needs to reason about or present selectively.

### 3. Rendered UI (MCP App)
Visual interface that users interact with directly.

```typescript
// Tool: get_page (with MCP App)
registerAppTool(server, 'get_page', {
  // ... schema
  _meta: { ui: { resourceUri: 'ui://comics/reader.html' } }
}, async (params) => {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(pageData)
    }]
  };
});
```

**Best for:** Visual content (images, comics, diagrams), interactive experiences, anything users want to *look at* rather than *read about*.

## Decision Framework

Ask yourself: **Who needs the result?**

```
                    ┌─────────────────────┐
                    │ Who needs this?     │
                    └─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Agent   │   │   Both   │   │   User   │
        │  only    │   │          │   │  only    │
        └──────────┘   └──────────┘   └──────────┘
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │Structured│   │Text or   │   │ Rendered │
        │  Data    │   │Structured│   │    UI    │
        └──────────┘   └──────────┘   └──────────┘
```

### Examples by Use Case

| User Request | What's Needed | Return Type |
|--------------|---------------|-------------|
| "What comics do you have?" | Agent describes options | **Text** (agent rephrases) |
| "List all storylines" | Agent presents a menu | **Structured** (agent formats) |
| "Show me page 5" | User views comic | **UI** (user sees image) |
| "Search for 'space'" | Agent reports findings | **Structured** (agent summarizes) |
| "Read me this page" | User hears transcript | **Text** (agent reads aloud) |
| "Let me browse the archive" | User navigates visually | **UI** (user clicks around) |

## Anti-Patterns

### Returning UI When Text Would Suffice

**Bad:** User asks "What's this comic about?" and you open a full reader.

**Good:** Return a text description the agent can present naturally.

```typescript
// User: "What's the comic about?"

// BAD: Opens UI for a simple question
_meta: { ui: { resourceUri: '...' } }

// GOOD: Return text the agent can use
return {
  content: [{
    type: 'text',
    text: 'Fran Hopper Comics features Golden Age sci-fi adventures...'
  }]
};
```

### Returning Text When Structured Data Is Needed

**Bad:** User asks "Which storylines have space battles?" and you return prose.

**Good:** Return structured results the agent can filter or count.

```typescript
// User: "Which storylines have space battles?"

// BAD: Agent can't process this easily
return {
  content: [{
    type: 'text',
    text: 'The storylines with space battles are Gale Allen and Mysta of the Moon...'
  }]
};

// GOOD: Agent can count, filter, present
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      query: 'space battles',
      results: [
        { storyline: 'Gale Allen', matches: 4 },
        { storyline: 'Mysta of the Moon', matches: 3 }
      ]
    })
  }]
};
```

### Returning Structured Data When UI Is Needed

**Bad:** User asks "Show me the comic" and you dump JSON.

**Good:** Open the visual reader.

```typescript
// User: "Show me the comic"

// BAD: User sees raw data
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ image_url: '...', transcript: '...' })
  }]
};

// GOOD: User sees the comic
registerAppTool(server, 'get_page', {
  _meta: { ui: { resourceUri: 'ui://comics/reader.html' } }
}, ...);
```

## Hybrid Approaches

Some tools benefit from returning both structured data AND opening a UI:

```typescript
registerAppTool(server, 'search_comics', {
  _meta: { ui: { resourceUri: 'ui://comics/search-results.html' } }
}, async ({ query }) => {
  const results = await search(query);
  return {
    content: [{
      type: 'text',
      // Agent can summarize: "I found 5 pages mentioning space"
      text: JSON.stringify({
        query,
        total: results.length,
        results: results.slice(0, 10)
      })
    }]
  };
  // UI shows clickable results the user can browse
});
```

The agent gets data to reason about ("I found 5 results") while the user gets a visual interface to explore.

## Summary

| When the user wants to... | Return... |
|---------------------------|-----------|
| Know something | Text |
| Choose from options | Structured data |
| See something | UI |
| Do something | Structured data (with status) |
| Explore something | UI |

---

## Customization

This decision framework applies regardless of your content:

1. **Comics** — Visual content usually needs UI (`get_page`)
2. **Listings** — Structured data lets agents present options naturally
3. **Descriptions** — Text for conversational summaries

When adding new tools for your comic, ask: "Who needs this result?" and choose accordingly.
