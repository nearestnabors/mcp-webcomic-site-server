/**
 * MCP Tool: list_characters
 *
 * Returns a list of all characters in the archive, optionally filtered by comic.
 * Each character includes their slug, name, comic ID, and bio.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharacterData {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
  voice: string;
  thumbnailPath: string;
  thumbnailAlt: string;
}

export interface CharacterSummary {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
  voice: string;
}

export interface ListCharactersResult {
  characters: CharacterSummary[];
}

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const listCharactersTool = {
  name: 'list_characters',
  description:
    'Get a list of all characters in the comic archive. Optionally filter by comic ID to see only characters from a specific comic series.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      comic_id: {
        type: 'string',
        description:
          'Optional comic identifier to filter characters (e.g., "rachel-the-great", "olivia-bryce"). If not provided, returns all characters.',
      },
    },
    required: [] as string[],
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
 * Handler for the list_characters tool.
 * Returns all characters, optionally filtered by comic ID.
 */
export async function listCharactersHandler(params: {
  comic_id?: string;
}): Promise<ListCharactersResult> {
  const { comic_id } = params;
  const characters = loadCharacters();

  // Convert to array of CharacterSummary
  let characterList: CharacterSummary[] = Object.values(characters).map((char) => ({
    slug: char.slug,
    name: char.name,
    comicId: char.comicId,
    bio: char.bio,
    voice: char.voice,
  }));

  // Filter by comic_id if provided
  if (comic_id) {
    characterList = characterList.filter((char) => char.comicId === comic_id);
  }

  // Sort alphabetically by name
  characterList.sort((a, b) => a.name.localeCompare(b.name));

  return { characters: characterList };
}
