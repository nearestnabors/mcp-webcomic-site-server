/**
 * MCP Tool: list_storylines
 *
 * Returns a list of storylines for a specific comic.
 * Each storyline includes summary information (id, title, order, pageCount).
 */

import { loadManifest } from '../manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorylineSummary {
  id: string;
  title: string;
  order: number;
  pageCount: number;
}

export interface ListStorylinesInput {
  comic_id: string;
}

export interface ListStorylinesResult {
  comic: {
    id: string;
    title: string;
  };
  storylines: StorylineSummary[];
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const listStorylinesTool = {
  name: 'list_storylines',
  description:
    'Get a list of storylines for a specific comic. Returns the comic info and an array of storylines with ID, title, order, and page count. Use this to browse available storylines before retrieving individual pages.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      comic_id: {
        type: 'string',
        description:
          'The unique identifier for the comic (e.g., "crow-princess", "rachel-the-great")',
      },
    },
    required: ['comic_id'],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the list_storylines tool.
 * Loads the manifest, finds the specified comic, and returns its storylines.
 *
 * @param input - Object containing comic_id
 * @throws Error if comic_id is not found in manifest
 */
export async function listStorylinesHandler(
  input: ListStorylinesInput
): Promise<ListStorylinesResult> {
  const manifest = loadManifest();

  // Find the requested comic
  const comic = manifest.comics.find((c) => c.id === input.comic_id);

  if (!comic) {
    throw new Error(
      `Comic not found: "${input.comic_id}". Available comics: ${manifest.comics.map((c) => c.id).join(', ')}`
    );
  }

  // Map storylines to summary format
  const storylines: StorylineSummary[] = comic.storylines.map((storyline) => ({
    id: storyline.id,
    title: storyline.title,
    order: storyline.order,
    pageCount: storyline.pages.length,
  }));

  return {
    comic: {
      id: comic.id,
      title: comic.title,
    },
    storylines,
  };
}
