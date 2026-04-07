/**
 * MCP Tool: get_page
 *
 * Returns a single comic page with full data and navigation context.
 * This is the primary tool for reading comic pages in the MCP App.
 */

import { loadManifest, Page } from '../manifest.js';
import { APP_RESOURCE_URI } from '../app-resource.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GetPageInput {
  comic_id: string;
  storyline_id: string;
  page_number: number;
}

export interface GetPageNavigation {
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  storylineTitle: string;
  comicTitle: string;
}

export interface GetPageResult {
  page: Page;
  navigation: GetPageNavigation;
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const getPageTool = {
  name: 'get_page',
  description:
    'Get a single comic page with full data and navigation context. Returns the page content (title, image, transcript, commentary, comments) along with navigation information (total pages, has prev/next, storyline and comic titles). Use this to display a comic page in the reader.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      comic_id: {
        type: 'string',
        description:
          'The unique identifier for the comic (e.g., "crow-princess", "rachel-the-great")',
      },
      storyline_id: {
        type: 'string',
        description:
          'The unique identifier for the storyline (e.g., "main", "return-anti-cupid")',
      },
      page_number: {
        type: 'number',
        description: 'The 1-indexed page number within the storyline',
      },
    },
    required: ['comic_id', 'storyline_id', 'page_number'],
  },
  /**
   * MCP Apps metadata - tells Claude to render the MCP App UI when this tool is called.
   * The resourceUri points to the registered UI resource in app-resource.ts.
   */
  _meta: {
    ui: {
      resourceUri: APP_RESOURCE_URI,
    },
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the get_page tool.
 * Loads the manifest, finds the specified page, and returns it with navigation context.
 *
 * @param input - Object containing comic_id, storyline_id, and page_number
 * @throws Error if comic_id, storyline_id, or page_number is not found
 */
export async function getPageHandler(
  input: GetPageInput
): Promise<GetPageResult> {
  const manifest = loadManifest();

  // Find the requested comic
  const comic = manifest.comics.find((c) => c.id === input.comic_id);

  if (!comic) {
    throw new Error(
      `Comic not found: "${input.comic_id}". Available comics: ${manifest.comics.map((c) => c.id).join(', ')}`
    );
  }

  // Find the requested storyline
  const storyline = comic.storylines.find((s) => s.id === input.storyline_id);

  if (!storyline) {
    throw new Error(
      `Storyline not found: "${input.storyline_id}". Available storylines in "${comic.id}": ${comic.storylines.map((s) => s.id).join(', ')}`
    );
  }

  // Find the requested page (1-indexed)
  const pageIndex = input.page_number - 1;
  const totalPages = storyline.pages.length;

  if (pageIndex < 0 || pageIndex >= totalPages) {
    throw new Error(
      `Page not found: page ${input.page_number} is out of range. Storyline "${storyline.id}" has ${totalPages} pages (1-${totalPages}).`
    );
  }

  const page = storyline.pages[pageIndex];

  // Build navigation context
  const navigation: GetPageNavigation = {
    totalPages,
    hasPrev: pageIndex > 0,
    hasNext: pageIndex < totalPages - 1,
    storylineTitle: storyline.title,
    comicTitle: comic.title,
  };

  return { page, navigation };
}
