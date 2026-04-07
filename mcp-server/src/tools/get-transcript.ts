/**
 * MCP Tool: get_transcript
 *
 * Returns the transcript for a specific comic page in Markdown format,
 * with metadata for context. This is a text-only tool for agents that
 * want to read/summarize transcripts without visual rendering.
 *
 * Unlike get_page, this tool does NOT open the MCP App UI.
 */

import { loadManifest } from '../manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GetTranscriptInput {
  comic_id: string;
  storyline_id: string;
  page_number: number;
}

export interface GetTranscriptResult {
  comic_id: string;
  comic_title: string;
  storyline_id: string;
  storyline_title: string;
  page_number: number;
  page_title: string;
  transcript: string;
  has_transcript: boolean;
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const getTranscriptTool = {
  name: 'get_transcript',
  description:
    'Get the transcript for a specific comic page in Markdown format. Returns the transcript text along with metadata (comic title, storyline title, page title). Use this to read or summarize comic content as text without loading images. For visual reading, use get_page instead.',
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
  // NOTE: No _meta.ui property - this is a text-only tool that does NOT open the MCP App
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the get_transcript tool.
 * Loads the manifest, finds the specified page, and returns its transcript with metadata.
 *
 * @param input - Object containing comic_id, storyline_id, and page_number
 * @throws Error if comic_id, storyline_id, or page_number is not found
 */
export async function getTranscriptHandler(
  input: GetTranscriptInput
): Promise<GetTranscriptResult> {
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

  // Determine if transcript exists and is non-empty
  const transcript = page.transcript || '';
  const hasTranscript = transcript.trim().length > 0;

  return {
    comic_id: comic.id,
    comic_title: comic.title,
    storyline_id: storyline.id,
    storyline_title: storyline.title,
    page_number: page.pageNumber,
    page_title: page.title,
    transcript,
    has_transcript: hasTranscript,
  };
}
