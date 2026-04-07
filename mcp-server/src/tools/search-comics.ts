/**
 * MCP Tool: search_comics
 *
 * Searches across all comics for matching text in titles, transcripts, and commentary.
 * Returns a list of matching pages with context snippets.
 */

import { loadManifest } from '../manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  comic_id: string;
  storyline_id: string;
  page_number: number;
  title: string;
  snippet: string;
  matchField: 'transcript' | 'commentary' | 'title';
}

export interface SearchComicsResult {
  results: SearchResult[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RESULTS = 50;
const SNIPPET_LENGTH = 100;

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const searchComicsTool = {
  name: 'search_comics',
  description:
    'Search comic transcripts, commentary, and titles for matching text. Returns a list of matching pages with context snippets showing where the match was found.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find in comic content',
      },
    },
    required: ['query'],
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Creates a snippet of text around the first match of the query.
 */
function createSnippet(text: string, query: string): string {
  if (!text || !query) {
    return '';
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    // No match, return start of text
    return text.slice(0, SNIPPET_LENGTH) + (text.length > SNIPPET_LENGTH ? '...' : '');
  }

  // Calculate snippet window around match
  const halfWindow = Math.floor(SNIPPET_LENGTH / 2);
  let start = Math.max(0, matchIndex - halfWindow);
  let end = Math.min(text.length, matchIndex + query.length + halfWindow);

  // Adjust to avoid cutting words
  if (start > 0) {
    // Find start of word
    while (start > 0 && text[start - 1] !== ' ') {
      start--;
    }
  }
  if (end < text.length) {
    // Find end of word
    while (end < text.length && text[end] !== ' ') {
      end++;
    }
  }

  let snippet = text.slice(start, end);

  // Add ellipsis if truncated
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < text.length) {
    snippet = snippet + '...';
  }

  return snippet;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tests if text contains the query (case-insensitive).
 */
function containsQuery(text: string | undefined, query: string): boolean {
  if (!text || !query.trim()) {
    return false;
  }
  const escapedQuery = escapeRegex(query.trim());
  const regex = new RegExp(escapedQuery, 'i');
  return regex.test(text);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the search_comics tool.
 * Searches across all comics for matching text.
 */
export async function searchComicsHandler(params: {
  query: string;
}): Promise<SearchComicsResult> {
  const { query } = params;

  // Handle empty or whitespace-only queries
  if (!query || !query.trim()) {
    return { results: [] };
  }

  const manifest = loadManifest();
  const results: SearchResult[] = [];

  // Search through all comics, storylines, and pages
  for (const comic of manifest.comics) {
    for (const storyline of comic.storylines) {
      for (const page of storyline.pages) {
        // Skip if we've reached the max results
        if (results.length >= MAX_RESULTS) {
          break;
        }

        // Check title
        if (containsQuery(page.title, query)) {
          results.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
            snippet: createSnippet(page.title, query),
            matchField: 'title',
          });
          continue; // Only count one match per page
        }

        // Check transcript
        if (containsQuery(page.transcript, query)) {
          results.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
            snippet: createSnippet(page.transcript, query),
            matchField: 'transcript',
          });
          continue;
        }

        // Check commentary
        if (containsQuery(page.commentary, query)) {
          results.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
            snippet: createSnippet(page.commentary || '', query),
            matchField: 'commentary',
          });
        }
      }

      if (results.length >= MAX_RESULTS) {
        break;
      }
    }

    if (results.length >= MAX_RESULTS) {
      break;
    }
  }

  return { results };
}
