/**
 * MCP Tool: search_by_character
 *
 * Returns all comic pages featuring a specific character.
 * Pages are sorted by comic, storyline, and page number.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadManifest } from '../manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharacterData {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
  thumbnailPath: string;
  thumbnailAlt: string;
}

export interface CharacterInfo {
  slug: string;
  name: string;
  comicId: string;
}

export interface PageResult {
  comic_id: string;
  storyline_id: string;
  page_number: number;
  title: string;
  slug: string;
}

export interface SearchByCharacterResult {
  character: CharacterInfo | null;
  pages: PageResult[];
  total: number;
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const searchByCharacterTool = {
  name: 'search_by_character',
  description:
    'Find all comic pages featuring a specific character. Returns a list of pages where the character appears, sorted by comic, storyline, and page number.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      character_slug: {
        type: 'string',
        description:
          'The character slug to search for (e.g., "tuna", "rachel_the_great", "olivia-bryce")',
      },
    },
    required: ['character_slug'],
  },
};

// ─── Character Data Loading ───────────────────────────────────────────────────

let charactersCache: Record<string, CharacterData> | null = null;

/**
 * Loads characters.json from the data directory.
 * Caches the result for subsequent calls.
 */
function loadCharacters(): Record<string, CharacterData> {
  if (charactersCache) {
    return charactersCache;
  }

  // Resolve path relative to this file's location in mcp-server/src/tools/
  const charactersPath = path.resolve(
    import.meta.dirname,
    '../../../src/_data/characters.json'
  );

  const content = fs.readFileSync(charactersPath, 'utf-8');
  charactersCache = JSON.parse(content);
  return charactersCache!;
}

/**
 * Clears the characters cache (useful for testing).
 */
export function clearCharactersCache(): void {
  charactersCache = null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the search_by_character tool.
 * Returns all pages featuring the specified character.
 */
export async function searchByCharacterHandler(params: {
  character_slug: string;
}): Promise<SearchByCharacterResult> {
  const { character_slug } = params;
  const characters = loadCharacters();
  const manifest = loadManifest();

  // Find the character
  const character = characters[character_slug];
  if (!character) {
    return {
      character: null,
      pages: [],
      total: 0,
    };
  }

  // Find all pages featuring this character
  const pages: PageResult[] = [];

  for (const comic of manifest.comics) {
    for (const storyline of comic.storylines) {
      for (const page of storyline.pages) {
        // Check if this page features the character
        if (page.characters && page.characters.includes(character_slug)) {
          pages.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
            slug: page.slug,
          });
        }
      }
    }
  }

  // Pages are already in reading order (comic -> storyline -> page number)
  // due to the way we iterate through the manifest

  return {
    character: {
      slug: character.slug,
      name: character.name,
      comicId: character.comicId,
    },
    pages,
    total: pages.length,
  };
}
