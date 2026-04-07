/**
 * Phase 35.6: MCP Tools Verification
 *
 * These tests verify that the MCP server tools work correctly with the
 * sample Fran Hopper comic content. This is critical for the public demo repo
 * because it validates the core functionality that AI agents will use.
 *
 * Tests cover:
 * - initialize request returns valid server info
 * - tools/list returns all expected tools
 * - list_comics returns the sample comic
 * - list_storylines returns storylines for the sample comic
 * - get_page returns page data with navigation
 * - get_transcript returns transcript text
 * - search_comics finds content in transcripts
 * - list_characters returns character data
 * - search_by_character finds pages by character
 *
 * Note: These tests use static code analysis and data file verification.
 * Full runtime testing requires running `npx netlify dev` and sending
 * actual HTTP requests, which is covered by manual verification.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT_DIR, 'src/_data/manifest.json');
const CHARACTERS_PATH = join(ROOT_DIR, 'src/_data/characters.json');
const MCP_FUNCTION_PATH = join(ROOT_DIR, 'netlify/functions/mcp.ts');

// Load manifest and characters for test assertions
interface Page {
  pageNumber: number;
  title: string;
  slug: string;
  image: string;
  transcript: string;
  commentary?: string;
  characters?: string[];
}

interface Storyline {
  id: string;
  title: string;
  order: number;
  pages: Page[];
}

interface Comic {
  id: string;
  title: string;
  type: string;
  description: string;
  storylines: Storyline[];
}

interface Manifest {
  generated: string;
  comics: Comic[];
}

interface Character {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
}

let manifest: Manifest;
let characters: Record<string, Character>;

beforeAll(() => {
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  }
  if (existsSync(CHARACTERS_PATH)) {
    characters = JSON.parse(readFileSync(CHARACTERS_PATH, 'utf-8'));
  }
});

describe('Phase 35.6: MCP Tools Verification (35.T6)', () => {
  describe('Prerequisites', () => {
    it('manifest.json exists and has sample comic data', () => {
      expect(existsSync(MANIFEST_PATH)).toBe(true);
      expect(manifest).toBeDefined();
      expect(manifest.comics).toBeDefined();
      expect(manifest.comics.length).toBeGreaterThan(0);
    });

    it('characters.json exists', () => {
      expect(existsSync(CHARACTERS_PATH)).toBe(true);
    });

    it('MCP function file exists', () => {
      expect(existsSync(MCP_FUNCTION_PATH)).toBe(true);
    });

    it('manifest contains fran-hopper-comics', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      expect(franHopper).toBeDefined();
      expect(franHopper?.title).toBe('Fran Hopper Comics');
    });

    it('manifest has at least 2 storylines', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      expect(franHopper?.storylines.length).toBeGreaterThanOrEqual(2);
    });

    it('each storyline has at least 5 pages', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      for (const storyline of franHopper?.storylines || []) {
        expect(storyline.pages.length).toBeGreaterThanOrEqual(5);
      }
    });
  });

  describe('MCP Function Structure', () => {
    it('MCP function exports a handler', () => {
      const content = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
      expect(content).toMatch(/export const handler/);
    });

    it('MCP function handles initialize method', () => {
      const content = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
      expect(content).toMatch(/['"]initialize['"]/);
      expect(content).toMatch(/handleInitialize/);
    });

    it('MCP function handles tools/list method', () => {
      const content = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
      expect(content).toMatch(/['"]tools\/list['"]/);
      expect(content).toMatch(/handleToolsList/);
    });

    it('MCP function handles tools/call method', () => {
      const content = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
      expect(content).toMatch(/['"]tools\/call['"]/);
      expect(content).toMatch(/handleToolsCall/);
    });
  });

  describe('Tool Definitions', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('defines list_comics tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]list_comics['"]/);
    });

    it('defines list_storylines tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]list_storylines['"]/);
    });

    it('defines get_page tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]get_page['"]/);
    });

    it('defines get_transcript tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]get_transcript['"]/);
    });

    it('defines search_comics tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]search_comics['"]/);
    });

    it('defines list_characters tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]list_characters['"]/);
    });

    it('defines search_by_character tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]search_by_character['"]/);
    });

    it('defines get_transcripts batch tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]get_transcripts['"]/);
    });

    it('defines get_commentary batch tool', () => {
      expect(mcpContent).toMatch(/name:\s*['"]get_commentary['"]/);
    });
  });

  describe('Tool Handlers Implementation', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('has listComicsHandler function', () => {
      expect(mcpContent).toMatch(/function listComicsHandler/);
    });

    it('has listStorylinesHandler function', () => {
      expect(mcpContent).toMatch(/function listStorylinesHandler/);
    });

    it('has getPageHandler function', () => {
      expect(mcpContent).toMatch(/function getPageHandler|async function getPageHandler/);
    });

    it('has getTranscriptHandler function', () => {
      expect(mcpContent).toMatch(/function getTranscriptHandler/);
    });

    it('has searchComicsHandler function', () => {
      expect(mcpContent).toMatch(/function searchComicsHandler/);
    });

    it('has listCharactersHandler function', () => {
      expect(mcpContent).toMatch(/function listCharactersHandler/);
    });

    it('has searchByCharacterHandler function', () => {
      expect(mcpContent).toMatch(/function searchByCharacterHandler/);
    });

    it('has getTranscriptsHandler function', () => {
      expect(mcpContent).toMatch(/function getTranscriptsHandler/);
    });

    it('has getCommentaryHandler function', () => {
      expect(mcpContent).toMatch(/function getCommentaryHandler/);
    });
  });

  describe('MCP Protocol Compliance', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('returns JSON-RPC 2.0 format', () => {
      expect(mcpContent).toMatch(/jsonrpc:\s*['"]2\.0['"]/);
    });

    it('includes protocol version in initialize response', () => {
      expect(mcpContent).toMatch(/protocolVersion/);
    });

    it('includes serverInfo in initialize response', () => {
      expect(mcpContent).toMatch(/serverInfo/);
    });

    it('includes capabilities in initialize response', () => {
      expect(mcpContent).toMatch(/capabilities/);
    });

    it('handles CORS headers', () => {
      expect(mcpContent).toMatch(/Access-Control-Allow-Origin/);
      expect(mcpContent).toMatch(/Access-Control-Allow-Headers/);
      expect(mcpContent).toMatch(/Access-Control-Allow-Methods/);
    });

    it('handles OPTIONS preflight requests', () => {
      expect(mcpContent).toMatch(/httpMethod\s*===\s*['"]OPTIONS['"]/);
    });

    it('handles GET for health check', () => {
      expect(mcpContent).toMatch(/httpMethod\s*===\s*['"]GET['"]/);
    });

    it('validates JSON-RPC format', () => {
      expect(mcpContent).toMatch(/request\.jsonrpc\s*!==\s*['"]2\.0['"]/);
    });
  });

  describe('Sample Content Verification', () => {
    it('Gale Allen storyline exists', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      const galeAllen = franHopper?.storylines.find((s) => s.id === 'gale-allen');
      expect(galeAllen).toBeDefined();
      expect(galeAllen?.title).toMatch(/Gale Allen/i);
    });

    it('Mysta of the Moon storyline exists', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      const mysta = franHopper?.storylines.find((s) => s.id === 'mysta-of-the-moon');
      expect(mysta).toBeDefined();
      expect(mysta?.title).toMatch(/Mysta/i);
    });

    it('pages have transcripts', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      const firstStoryline = franHopper?.storylines[0];
      const firstPage = firstStoryline?.pages[0];
      expect(firstPage?.transcript).toBeDefined();
      expect(firstPage?.transcript.length).toBeGreaterThan(0);
    });

    it('pages have image paths', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      const firstStoryline = franHopper?.storylines[0];
      const firstPage = firstStoryline?.pages[0];
      expect(firstPage?.image).toBeDefined();
      expect(firstPage?.image).toMatch(/fran-hopper/);
    });

    it('pages have character references', () => {
      const franHopper = manifest.comics.find((c) => c.id === 'fran-hopper-comics');
      const firstStoryline = franHopper?.storylines[0];
      const firstPage = firstStoryline?.pages[0];
      expect(firstPage?.characters).toBeDefined();
      expect(firstPage?.characters?.length).toBeGreaterThan(0);
    });
  });

  describe('MCP App UI Resource', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('defines UI resource URI', () => {
      expect(mcpContent).toMatch(/UI_RESOURCE_URI/);
      expect(mcpContent).toMatch(/ui:\/\/.*reader\.html/);
    });

    it('defines UI resource MIME type for MCP Apps', () => {
      expect(mcpContent).toMatch(/UI_RESOURCE_MIME_TYPE/);
      expect(mcpContent).toMatch(/text\/html;profile=mcp-app/);
    });

    it('get_page tool has _meta.ui.resourceUri', () => {
      // The get_page tool should open the MCP App
      expect(mcpContent).toMatch(/name:\s*['"]get_page['"][\s\S]*?_meta:\s*\{[\s\S]*?ui:\s*\{[\s\S]*?resourceUri/);
    });

    it('loads MCP App HTML', () => {
      expect(mcpContent).toMatch(/function loadMcpAppHtml/);
    });

    it('handles resources/list method', () => {
      expect(mcpContent).toMatch(/['"]resources\/list['"]/);
      expect(mcpContent).toMatch(/handleResourcesList/);
    });

    it('handles resources/read method', () => {
      expect(mcpContent).toMatch(/['"]resources\/read['"]/);
      expect(mcpContent).toMatch(/handleResourcesRead/);
    });
  });

  describe('Error Handling', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('returns error for unknown comic_id', () => {
      expect(mcpContent).toMatch(/Comic not found/);
    });

    it('returns error for unknown storyline_id', () => {
      expect(mcpContent).toMatch(/Storyline not found/);
    });

    it('returns error for out of range page number', () => {
      expect(mcpContent).toMatch(/out of range/);
    });

    it('returns error for unknown tool', () => {
      expect(mcpContent).toMatch(/Unknown tool/);
    });

    it('returns error for unknown method', () => {
      expect(mcpContent).toMatch(/Method not found/);
    });

    it('handles JSON parse errors', () => {
      expect(mcpContent).toMatch(/Parse error/);
    });
  });

  describe('Search Functionality', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('searches across transcripts', () => {
      expect(mcpContent).toMatch(/containsQuery\(page\.transcript/);
    });

    it('searches across commentary', () => {
      expect(mcpContent).toMatch(/containsQuery\(page\.commentary/);
    });

    it('searches across titles', () => {
      expect(mcpContent).toMatch(/containsQuery\(page\.title/);
    });

    it('creates context snippets', () => {
      expect(mcpContent).toMatch(/function createSnippet/);
    });

    it('limits search results', () => {
      expect(mcpContent).toMatch(/MAX_SEARCH_RESULTS/);
    });
  });

  describe('Characters Integration', () => {
    it('characters.json has expected format', () => {
      expect(typeof characters).toBe('object');
    });

    it('gale-allen character exists', () => {
      expect(characters['gale-allen']).toBeDefined();
      expect(characters['gale-allen']?.name).toMatch(/Gale Allen/i);
    });

    it('mysta character exists', () => {
      expect(characters['mysta']).toBeDefined();
      expect(characters['mysta']?.name).toMatch(/Mysta/i);
    });

    it('characters have comicId field', () => {
      for (const char of Object.values(characters)) {
        expect(char.comicId).toBeDefined();
        expect(char.comicId).toBe('fran-hopper-comics');
      }
    });
  });

  describe('Batch Tools', () => {
    let mcpContent: string;

    beforeAll(() => {
      mcpContent = readFileSync(MCP_FUNCTION_PATH, 'utf-8');
    });

    it('get_transcripts supports pagination', () => {
      expect(mcpContent).toMatch(/pagination/);
      expect(mcpContent).toMatch(/next_cursor/);
    });

    it('get_transcripts supports filtering by comic_id', () => {
      expect(mcpContent).toMatch(/comic_id && comic\.id !== comic_id/);
    });

    it('get_transcripts supports filtering by storyline_id', () => {
      expect(mcpContent).toMatch(/storyline_id && storyline\.id !== storyline_id/);
    });

    it('get_commentary follows same pattern as get_transcripts', () => {
      expect(mcpContent).toMatch(/function getCommentaryHandler/);
      expect(mcpContent).toMatch(/commentary:/);
    });

    it('has limit validation (default 50, max 100)', () => {
      expect(mcpContent).toMatch(/DEFAULT_LIMIT\s*=\s*50/);
      expect(mcpContent).toMatch(/MAX_LIMIT\s*=\s*100/);
    });
  });
});
