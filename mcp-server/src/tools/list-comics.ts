/**
 * MCP Tool: list_comics
 *
 * Returns a list of all available comics in the archive.
 * Each comic includes summary information (id, title, type, description,
 * storyline count, and total page count).
 */

import { loadManifest } from '../manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComicSummary {
  id: string;
  title: string;
  type: string;
  description: string;
  storylineCount: number;
  pageCount: number;
}

export interface ListComicsResult {
  comics: ComicSummary[];
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const listComicsTool = {
  name: 'list_comics',
  description: 'Get a list of all available comics in the archive. Returns summary information including comic ID, title, type (linear or episodic), description, number of storylines, and total page count.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the list_comics tool.
 * Loads the manifest and returns a summary of all comics.
 */
export async function listComicsHandler(): Promise<ListComicsResult> {
  const manifest = loadManifest();

  const comics: ComicSummary[] = manifest.comics.map((comic) => {
    // Calculate total page count across all storylines
    const pageCount = comic.storylines.reduce(
      (sum, storyline) => sum + storyline.pages.length,
      0
    );

    return {
      id: comic.id,
      title: comic.title,
      type: comic.type,
      description: comic.description,
      storylineCount: comic.storylines.length,
      pageCount,
    };
  });

  return { comics };
}
