/**
 * Netlify Function: MCP Server
 *
 * This serverless function wraps the MCP server tools for Netlify deployment.
 * It handles JSON-RPC requests for the MCP protocol, enabling Claude and other
 * MCP clients to interact with the comic archive without a dedicated server.
 *
 * Supports:
 * - initialize: Returns server info and capabilities
 * - tools/list: Returns available tool definitions
 * - tools/call: Executes a tool and returns results
 *
 * CORS is enabled to allow requests from Claude.ai and other MCP hosts.
 */

import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';
import { mcpAppHtml } from './embedded-apps.js';

// ─── Manifest Types ────────────────────────────────────────────────────────────

interface Manifest {
  generated: string;
  comics: Comic[];
}

interface Comic {
  id: string;
  title: string;
  type: 'linear' | 'episodic';
  description: string;
  coverImage?: string;
  storylines: Storyline[];
}

interface Storyline {
  id: string;
  title: string;
  order: number;
  description?: string;
  pages: Page[];
}

interface Page {
  pageNumber: number;
  title: string;
  slug: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  transcript: string;
  commentary?: string;
  publishedDate: string;
  comments: Comment[];
  originalUrl: string;
  characters?: string[];
  thumbnail?: string;
}

interface Comment {
  id: string;
  author: string;
  authorUrl?: string;
  date?: string;
  text: string;
  replies: Comment[];
}

// ─── JSON-RPC Types ────────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ─── Tool Result Types ─────────────────────────────────────────────────────────

interface ComicSummary {
  id: string;
  title: string;
  type: string;
  description: string;
  storylineCount: number;
  pageCount: number;
}

interface ListComicsResult {
  comics: ComicSummary[];
}

interface StorylineSummary {
  id: string;
  title: string;
  order: number;
  pageCount: number;
}

interface ListStorylinesResult {
  comic: { id: string; title: string };
  storylines: StorylineSummary[];
}

interface GetPageNavigation {
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  storylineTitle: string;
  comicTitle: string;
  comicId: string;
  storylineId: string;
  nextStoryline: { comicId: string; storylineId: string; pageNumber: number } | null;
  prevStoryline: { comicId: string; storylineId: string; pageNumber: number } | null;
  prevImageUrl: string | null;
  nextImageUrl: string | null;
}

interface GetPageResult {
  page: Page;
  navigation: GetPageNavigation;
}

interface GetTranscriptResult {
  comic_id: string;
  comic_title: string;
  storyline_id: string;
  storyline_title: string;
  page_number: number;
  page_title: string;
  transcript: string;
  has_transcript: boolean;
}

interface SearchResult {
  comic_id: string;
  storyline_id: string;
  page_number: number;
  title: string;
  snippet: string;
  matchField: 'transcript' | 'commentary' | 'title';
}

interface SearchComicsResult {
  results: SearchResult[];
}

// ─── Batch Transcript Types ─────────────────────────────────────────────────────

interface TranscriptEntry {
  comic_id: string;
  comic_title: string;
  storyline_id: string;
  storyline_title: string;
  page_number: number;
  page_title: string;
  transcript: string;
  has_transcript: boolean;
}

interface PaginationInfo {
  total_pages: number;
  returned: number;
  has_more: boolean;
  next_cursor?: string;
}

interface GetTranscriptsResult {
  transcripts: TranscriptEntry[];
  pagination: PaginationInfo;
}

interface GetTranscriptsParams {
  comic_id?: string;
  storyline_id?: string;
  page_numbers?: number[];
  limit?: number;
  cursor?: string;
}

// ─── Batch Commentary Types ─────────────────────────────────────────────────────

interface CommentaryEntry {
  comic_id: string;
  comic_title: string;
  storyline_id: string;
  storyline_title: string;
  page_number: number;
  page_title: string;
  commentary: string;
  has_commentary: boolean;
}

interface GetCommentaryResult {
  commentary: CommentaryEntry[];
  pagination: PaginationInfo;
}

interface GetCommentaryParams {
  comic_id?: string;
  storyline_id?: string;
  page_numbers?: number[];
  limit?: number;
  cursor?: string;
}

interface CursorData {
  comic_id: string;
  storyline_id: string;
  page_number: number;
}

// ─── Character Types ────────────────────────────────────────────────────────────

interface CharacterData {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
  voice: string;
  thumbnailPath: string;
  thumbnailAlt: string;
}

interface CharacterSummary {
  slug: string;
  name: string;
  comicId: string;
  bio: string;
  voice: string;
  thumbnailPath: string | undefined;
  thumbnailAlt: string;
}

interface ListCharactersResult {
  characters: CharacterSummary[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const SERVER_INFO = {
  name: 'webcomic-mcp-server',
  version: '1.0.0',
};

// Base URL for the static site (used for absolute image URLs)
// Configure this for your deployment
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || process.env.URL || '';

// Site base URL for other purposes (may be localhost in dev)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _SITE_BASE_URL = process.env.URL || '';

const MAX_SEARCH_RESULTS = 50;
const SNIPPET_LENGTH = 100;

// MCP App UI Resource (auto-versioned to bust Claude's shttp cache)
// Uses git commit hash from Netlify's COMMIT_REF, or falls back to timestamp
const BUILD_VERSION = process.env.COMMIT_REF?.slice(0, 8) || Date.now().toString(36);
const UI_RESOURCE_URI = `ui://webcomic/reader.html?v=${BUILD_VERSION}`;
// MCP Apps require this specific MIME type profile to be recognized
const UI_RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

// Resource URI templates for transcripts and commentary
const TRANSCRIPT_URI_PREFIX = 'transcript://webcomic/';
const COMMENTARY_URI_PREFIX = 'commentary://webcomic/';

// Index URIs for listing all available transcripts/commentary
const TRANSCRIPT_INDEX_URI = 'transcript://webcomic/index';
const COMMENTARY_INDEX_URI = 'commentary://webcomic/index';

// ─── Image Base64 Encoding ─────────────────────────────────────────────────────

/**
 * Fetch an image and convert it to a base64 data URL.
 * Returns null if the fetch fails.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image: ${error}`);
    return null;
  }
}

// ─── MCP App Loading ───────────────────────────────────────────────────────────

let cachedAppHtml: string | null = null;

function loadMcpAppHtml(): string | null {
  if (cachedAppHtml) {
    console.log('[MCP] Returning cached HTML');
    return cachedAppHtml;
  }

  // First, try the embedded HTML (bundled at build time)
  if (mcpAppHtml) {
    console.log('[MCP] Loading from embedded HTML, length:', mcpAppHtml.length);
    // Log a snippet to verify content
    const snippet = mcpAppHtml.substring(0, 200);
    console.log('[MCP] HTML snippet:', snippet);
    cachedAppHtml = mcpAppHtml;
    return cachedAppHtml;
  }

  // Fallback to filesystem for local development
  const cwd = process.cwd();
  const funcDir = typeof __dirname !== 'undefined' ? __dirname : cwd;
  const possiblePaths = [
    process.env.MCP_APP_PATH,
    path.join(funcDir, 'mcp-app/dist/index.html'),
    path.join(funcDir, '../mcp-app/dist/index.html'),
    path.join(funcDir, '../../mcp-app/dist/index.html'),
    path.join(cwd, 'mcp-app/dist/index.html'),
    path.join('/var/task', 'mcp-app/dist/index.html'),
  ].filter(Boolean) as string[];

  for (const appPath of possiblePaths) {
    try {
      if (fs.existsSync(appPath)) {
        cachedAppHtml = fs.readFileSync(appPath, 'utf-8');
        return cachedAppHtml;
      }
    } catch {
      // Continue to next path
    }
  }

  return null;
}

// ─── Manifest Loading ──────────────────────────────────────────────────────────

let cachedManifest: Manifest | null = null;

function loadManifest(): Manifest {
  if (cachedManifest) {
    return cachedManifest;
  }

  // Try multiple paths for the manifest
  // Netlify Functions bundle files differently - try various locations
  const cwd = process.cwd();
  const possiblePaths = [
    // Environment variable (for custom deployment)
    process.env.MANIFEST_PATH,
    // Netlify Functions: included_files are relative to function
    path.join(cwd, 'src/_data/manifest.json'),
    // Netlify Functions: alternative bundled location
    path.join('/var/task', 'src/_data/manifest.json'),
    // Local development paths
    path.join(cwd, '../src/_data/manifest.json'),
    path.join(cwd, '../../src/_data/manifest.json'),
  ].filter(Boolean) as string[];

  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        cachedManifest = JSON.parse(content) as Manifest;
        return cachedManifest;
      }
    } catch {
      // Continue to next path
    }
  }

  throw new Error(`Manifest not found. Tried paths: ${possiblePaths.join(', ')}`);
}

// ─── Characters Loading ─────────────────────────────────────────────────────────

let cachedCharacters: Record<string, CharacterData> | null = null;

function loadCharacters(): Record<string, CharacterData> {
  if (cachedCharacters) {
    return cachedCharacters;
  }

  // Try multiple paths for characters.json (same pattern as manifest)
  const cwd = process.cwd();
  const possiblePaths = [
    process.env.CHARACTERS_PATH,
    path.join(cwd, 'src/_data/characters.json'),
    path.join('/var/task', 'src/_data/characters.json'),
    path.join(cwd, '../src/_data/characters.json'),
    path.join(cwd, '../../src/_data/characters.json'),
  ].filter(Boolean) as string[];

  for (const charactersPath of possiblePaths) {
    try {
      if (fs.existsSync(charactersPath)) {
        const content = fs.readFileSync(charactersPath, 'utf-8');
        cachedCharacters = JSON.parse(content) as Record<string, CharacterData>;
        return cachedCharacters;
      }
    } catch {
      // Continue to next path
    }
  }

  // Return empty object if characters.json not found (graceful fallback)
  cachedCharacters = {};
  return cachedCharacters;
}

// ─── Tool Definitions ──────────────────────────────────────────────────────────

const tools = [
  {
    name: 'list_comics',
    description: 'Get a list of all available comics in the archive. Returns summary information including comic ID, title, type (linear or episodic), description, number of storylines, and total page count.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_storylines',
    description: 'Get a list of storylines for a specific comic. Returns storyline ID, title, reading order, and page count.',
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: {
          type: 'string',
          description: 'The unique identifier for the comic',
        },
      },
      required: ['comic_id'],
    },
  },
  {
    name: 'get_page',
    description: 'Get a single comic page with full data and navigation context. Returns the page content (title, image, transcript, commentary, comments) along with navigation information. Opens an interactive comic reader.',
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: {
          type: 'string',
          description: 'The unique identifier for the comic',
        },
        storyline_id: {
          type: 'string',
          description: 'The unique identifier for the storyline',
        },
        page_number: {
          type: 'number',
          description: 'The 1-indexed page number within the storyline',
        },
      },
      required: ['comic_id', 'storyline_id', 'page_number'],
    },
    _meta: {
      ui: {
        resourceUri: UI_RESOURCE_URI,
      },
    },
  },
  {
    name: 'get_transcript',
    description: 'Get just the transcript text for a comic page. Use this for text-to-speech or accessibility purposes.',
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: { type: 'string', description: 'The unique identifier for the comic' },
        storyline_id: { type: 'string', description: 'The unique identifier for the storyline' },
        page_number: { type: 'number', description: 'The 1-indexed page number' },
      },
      required: ['comic_id', 'storyline_id', 'page_number'],
    },
  },
  {
    name: 'search_comics',
    description: 'Search comic transcripts, commentary, and titles for matching text. Returns a list of matching pages with context snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find in comic content',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_characters',
    description: 'Get a list of characters. Optionally filter by comic ID.',
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: {
          type: 'string',
          description: 'Optional comic identifier to filter characters',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_by_character',
    description: 'Find all pages featuring a specific character.',
    inputSchema: {
      type: 'object',
      properties: {
        character_slug: {
          type: 'string',
          description: 'The character slug to search for',
        },
      },
      required: ['character_slug'],
    },
  },
  {
    name: 'get_transcripts',
    description: `Get transcripts for multiple comic pages. Returns panel-by-panel descriptions of comic content.

Filtering options (cascading):
- No params: returns all pages (paginated)
- comic_id: returns all pages from that comic
- comic_id + storyline_id: returns all pages from that storyline
- comic_id + storyline_id + page_numbers: returns specific pages

Use this tool when:
- Reading an entire storyline to a user
- Searching for content across multiple pages
- Loading context about a story arc

For a single specific page, use get_transcript instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: {
          type: 'string',
          description: 'Filter to specific comic',
        },
        storyline_id: {
          type: 'string',
          description: 'Filter to specific storyline (requires comic_id)',
        },
        page_numbers: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific page numbers to fetch (requires comic_id and storyline_id)',
        },
        limit: {
          type: 'number',
          description: 'Max pages to return (default 50, max 100)',
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_commentary',
    description: `Get author commentary for multiple comic pages. Returns commentary text (may be empty for pages without commentary).

Filtering options (cascading):
- No params: returns all pages (paginated)
- comic_id: returns all pages from that comic
- comic_id + storyline_id: returns all pages from that storyline
- comic_id + storyline_id + page_numbers: returns specific pages

Use this tool when:
- Exploring author thoughts behind a storyline
- Finding pages with interesting commentary
- Getting context about comic creation

Note: Many pages have no commentary. The has_commentary field helps identify which entries have content.`,
    inputSchema: {
      type: 'object',
      properties: {
        comic_id: {
          type: 'string',
          description: 'Filter to specific comic',
        },
        storyline_id: {
          type: 'string',
          description: 'Filter to specific storyline (requires comic_id)',
        },
        page_numbers: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific page numbers to fetch (requires comic_id and storyline_id)',
        },
        limit: {
          type: 'number',
          description: 'Max pages to return (default 50, max 100)',
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response',
        },
      },
      required: [],
    },
  },
];

// ─── Tool Handlers ─────────────────────────────────────────────────────────────

function listComicsHandler(): ListComicsResult {
  const manifest = loadManifest();

  const comics: ComicSummary[] = manifest.comics.map((comic) => {
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

function listStorylinesHandler(params: { comic_id: string }): ListStorylinesResult {
  const manifest = loadManifest();
  const comic = manifest.comics.find((c) => c.id === params.comic_id);

  if (!comic) {
    throw new Error(
      `Comic not found: "${params.comic_id}". Available: ${manifest.comics.map((c) => c.id).join(', ')}`
    );
  }

  const storylines: StorylineSummary[] = comic.storylines.map((s) => ({
    id: s.id,
    title: s.title,
    order: s.order,
    pageCount: s.pages.length,
  }));

  return {
    comic: { id: comic.id, title: comic.title },
    storylines,
  };
}

async function getPageHandler(params: { comic_id: string; storyline_id: string; page_number: number }): Promise<GetPageResult & { imageData?: string }> {
  const manifest = loadManifest();

  const comic = manifest.comics.find((c) => c.id === params.comic_id);
  if (!comic) {
    throw new Error(`Comic not found: "${params.comic_id}"`);
  }

  const storyline = comic.storylines.find((s) => s.id === params.storyline_id);
  if (!storyline) {
    throw new Error(`Storyline not found: "${params.storyline_id}"`);
  }

  const pageIndex = params.page_number - 1;
  const totalPages = storyline.pages.length;

  if (pageIndex < 0 || pageIndex >= totalPages) {
    throw new Error(`Page ${params.page_number} out of range (1-${totalPages})`);
  }

  const page = storyline.pages[pageIndex];

  // Convert relative image path to absolute URL
  const imageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${page.image}` : page.image;
  const pageWithAbsoluteUrl = {
    ...page,
    image: imageUrl,
    thumbnail: page.thumbnail ? (IMAGE_BASE_URL ? `${IMAGE_BASE_URL}${page.thumbnail}` : page.thumbnail) : undefined,
  };

  // Calculate cross-storyline navigation
  // Sort storylines by order DESCENDING (order 1 = newest/most recent, higher = older)
  // This way "Next" goes to older storylines and "Prev" goes to newer ones
  const sortedStorylines = [...comic.storylines].sort((a, b) => a.order - b.order);
  const currentStorylineIndex = sortedStorylines.findIndex((s) => s.id === storyline.id);

  // Next storyline: available when at last page and there's a PREVIOUS storyline (older)
  // Since order is reverse-chronological, "next" in reading order = lower index
  let nextStoryline: { comicId: string; storylineId: string; pageNumber: number } | null = null;
  if (pageIndex === totalPages - 1 && currentStorylineIndex > 0) {
    const next = sortedStorylines[currentStorylineIndex - 1];
    nextStoryline = {
      comicId: comic.id,
      storylineId: next.id,
      pageNumber: 1,
    };
  }

  // Previous storyline: available when at first page and there's a NEXT storyline (newer)
  // Since order is reverse-chronological, "prev" in reading order = higher index
  let prevStoryline: { comicId: string; storylineId: string; pageNumber: number } | null = null;
  if (pageIndex === 0 && currentStorylineIndex < sortedStorylines.length - 1) {
    const prev = sortedStorylines[currentStorylineIndex + 1];
    prevStoryline = {
      comicId: comic.id,
      storylineId: prev.id,
      pageNumber: prev.pages.length, // Last page of previous storyline
    };
  }

  // Calculate adjacent image URLs for preloading
  // Previous image: within current storyline or from previous storyline's last page
  let prevImageUrl: string | null = null;
  if (pageIndex > 0) {
    // Previous page in same storyline
    const prevImage = storyline.pages[pageIndex - 1].image;
    prevImageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${prevImage}` : prevImage;
  } else if (prevStoryline) {
    // Last page of previous storyline
    const prevStorylineData = sortedStorylines[currentStorylineIndex + 1];
    const lastPage = prevStorylineData.pages[prevStorylineData.pages.length - 1];
    prevImageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${lastPage.image}` : lastPage.image;
  }

  // Next image: within current storyline or from next storyline's first page
  let nextImageUrl: string | null = null;
  if (pageIndex < totalPages - 1) {
    // Next page in same storyline
    const nextImage = storyline.pages[pageIndex + 1].image;
    nextImageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${nextImage}` : nextImage;
  } else if (nextStoryline) {
    // First page of next storyline
    const nextStorylineData = sortedStorylines[currentStorylineIndex - 1];
    const firstPage = nextStorylineData.pages[0];
    nextImageUrl = IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${firstPage.image}` : firstPage.image;
  }

  return {
    page: pageWithAbsoluteUrl,
    navigation: {
      totalPages,
      hasPrev: pageIndex > 0,
      hasNext: pageIndex < totalPages - 1,
      comicId: comic.id,
      storylineId: storyline.id,
      storylineTitle: storyline.title,
      comicTitle: comic.title,
      nextStoryline,
      prevStoryline,
      prevImageUrl,
      nextImageUrl,
    },
  };
}

function getTranscriptHandler(params: { comic_id: string; storyline_id: string; page_number: number }): GetTranscriptResult {
  const manifest = loadManifest();

  const comic = manifest.comics.find((c) => c.id === params.comic_id);
  if (!comic) {
    throw new Error(`Comic not found: "${params.comic_id}"`);
  }

  const storyline = comic.storylines.find((s) => s.id === params.storyline_id);
  if (!storyline) {
    throw new Error(`Storyline not found: "${params.storyline_id}"`);
  }

  const pageIndex = params.page_number - 1;
  if (pageIndex < 0 || pageIndex >= storyline.pages.length) {
    throw new Error(`Page ${params.page_number} out of range`);
  }

  const page = storyline.pages[pageIndex];

  return {
    comic_id: params.comic_id,
    comic_title: comic.title,
    storyline_id: params.storyline_id,
    storyline_title: storyline.title,
    page_number: params.page_number,
    page_title: page.title,
    transcript: page.transcript || '',
    has_transcript: Boolean(page.transcript && page.transcript.trim()),
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsQuery(text: string | undefined, query: string): boolean {
  if (!text || !query.trim()) return false;
  const regex = new RegExp(escapeRegex(query.trim()), 'i');
  return regex.test(text);
}

function createSnippet(text: string, query: string): string {
  if (!text || !query) return '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text.slice(0, SNIPPET_LENGTH) + (text.length > SNIPPET_LENGTH ? '...' : '');
  }

  const halfWindow = Math.floor(SNIPPET_LENGTH / 2);
  const start = Math.max(0, matchIndex - halfWindow);
  const end = Math.min(text.length, matchIndex + query.length + halfWindow);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

function searchComicsHandler(params: { query: string }): SearchComicsResult {
  const { query } = params;
  if (!query || !query.trim()) return { results: [] };

  const manifest = loadManifest();
  const results: SearchResult[] = [];

  for (const comic of manifest.comics) {
    for (const storyline of comic.storylines) {
      for (const page of storyline.pages) {
        if (results.length >= MAX_SEARCH_RESULTS) break;

        if (containsQuery(page.title, query)) {
          results.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
            snippet: createSnippet(page.title, query),
            matchField: 'title',
          });
          continue;
        }

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
      if (results.length >= MAX_SEARCH_RESULTS) break;
    }
    if (results.length >= MAX_SEARCH_RESULTS) break;
  }

  return { results };
}

// Characters - loads from characters.json with optional filtering
function listCharactersHandler(params: { comic_id?: string }): ListCharactersResult {
  const { comic_id } = params;
  const characters = loadCharacters();

  // Convert to array of CharacterSummary with absolute thumbnail URLs
  let characterList: CharacterSummary[] = Object.values(characters).map((char) => ({
    slug: char.slug,
    name: char.name,
    comicId: char.comicId,
    bio: char.bio,
    voice: char.voice,
    thumbnailPath: char.thumbnailPath ? (IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/${char.thumbnailPath}` : char.thumbnailPath) : undefined,
    thumbnailAlt: char.thumbnailAlt,
  }));

  // Filter by comic_id if provided
  if (comic_id) {
    characterList = characterList.filter((char) => char.comicId === comic_id);
  }

  // Sort alphabetically by name
  characterList.sort((a, b) => a.name.localeCompare(b.name));

  return { characters: characterList };
}

function searchByCharacterHandler(params: { character_slug: string }): { character: unknown; pages: unknown[]; total: number } {
  const manifest = loadManifest();
  const pages: { comic_id: string; storyline_id: string; page_number: number; title: string }[] = [];

  for (const comic of manifest.comics) {
    for (const storyline of comic.storylines) {
      for (const page of storyline.pages) {
        if (page.characters?.includes(params.character_slug)) {
          pages.push({
            comic_id: comic.id,
            storyline_id: storyline.id,
            page_number: page.pageNumber,
            title: page.title,
          });
        }
      }
    }
  }

  return {
    character: { slug: params.character_slug },
    pages,
    total: pages.length,
  };
}

// ─── Batch Transcripts Handler ──────────────────────────────────────────────────

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded) as CursorData;
  } catch {
    return null;
  }
}

function getTranscriptsHandler(params: GetTranscriptsParams): GetTranscriptsResult {
  const manifest = loadManifest();
  const { comic_id, storyline_id, page_numbers, cursor } = params;

  // Validate: storyline_id requires comic_id
  if (storyline_id && !comic_id) {
    throw new Error('storyline_id requires comic_id');
  }

  // Validate comic_id if provided
  if (comic_id) {
    const comic = manifest.comics.find((c) => c.id === comic_id);
    if (!comic) {
      throw new Error(`Comic not found: ${comic_id}`);
    }

    // Validate storyline_id if provided
    if (storyline_id) {
      const storyline = comic.storylines.find((s) => s.id === storyline_id);
      if (!storyline) {
        throw new Error(`Storyline not found: ${storyline_id}`);
      }
    }
  }

  // Calculate effective limit (default 50, max 100)
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);

  // Build flat list of all matching pages
  interface PageRef {
    comic: Comic;
    storyline: Storyline;
    page: Page;
  }

  const allPages: PageRef[] = [];

  for (const comic of manifest.comics) {
    // Filter by comic_id if provided
    if (comic_id && comic.id !== comic_id) continue;

    for (const storyline of comic.storylines) {
      // Filter by storyline_id if provided
      if (storyline_id && storyline.id !== storyline_id) continue;

      for (const page of storyline.pages) {
        // Filter by page_numbers if provided
        if (page_numbers && page_numbers.length > 0) {
          if (!page_numbers.includes(page.pageNumber)) continue;
        }

        allPages.push({ comic, storyline, page });
      }
    }
  }

  const totalPages = allPages.length;

  // Find starting position based on cursor
  let startIndex = 0;
  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData) {
      // Find the page after the cursor position
      const cursorIndex = allPages.findIndex(
        (ref) =>
          ref.comic.id === cursorData.comic_id &&
          ref.storyline.id === cursorData.storyline_id &&
          ref.page.pageNumber === cursorData.page_number
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
  }

  // Get the page slice
  const endIndex = Math.min(startIndex + limit, allPages.length);
  const pageSlice = allPages.slice(startIndex, endIndex);

  // Build transcripts array
  const transcripts: TranscriptEntry[] = pageSlice.map((ref) => ({
    comic_id: ref.comic.id,
    comic_title: ref.comic.title,
    storyline_id: ref.storyline.id,
    storyline_title: ref.storyline.title,
    page_number: ref.page.pageNumber,
    page_title: ref.page.title,
    transcript: ref.page.transcript || '',
    has_transcript: Boolean(ref.page.transcript && ref.page.transcript.trim()),
  }));

  // Build pagination info
  const hasMore = endIndex < allPages.length;
  const pagination: PaginationInfo = {
    total_pages: totalPages,
    returned: transcripts.length,
    has_more: hasMore,
  };

  if (hasMore && pageSlice.length > 0) {
    const lastPage = pageSlice[pageSlice.length - 1];
    pagination.next_cursor = encodeCursor({
      comic_id: lastPage.comic.id,
      storyline_id: lastPage.storyline.id,
      page_number: lastPage.page.pageNumber,
    });
  }

  return { transcripts, pagination };
}

// ─── Batch Commentary Handler ──────────────────────────────────────────────────

function getCommentaryHandler(params: GetCommentaryParams): GetCommentaryResult {
  const manifest = loadManifest();
  const { comic_id, storyline_id, page_numbers, cursor } = params;

  // Validate: storyline_id requires comic_id
  if (storyline_id && !comic_id) {
    throw new Error('storyline_id requires comic_id');
  }

  // Validate comic_id if provided
  if (comic_id) {
    const comic = manifest.comics.find((c) => c.id === comic_id);
    if (!comic) {
      throw new Error(`Comic not found: ${comic_id}`);
    }

    // Validate storyline_id if provided
    if (storyline_id) {
      const storyline = comic.storylines.find((s) => s.id === storyline_id);
      if (!storyline) {
        throw new Error(`Storyline not found: ${storyline_id}`);
      }
    }
  }

  // Calculate effective limit (default 50, max 100)
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);

  // Build flat list of all matching pages
  interface PageRef {
    comic: Comic;
    storyline: Storyline;
    page: Page;
  }

  const allPages: PageRef[] = [];

  for (const comic of manifest.comics) {
    // Filter by comic_id if provided
    if (comic_id && comic.id !== comic_id) continue;

    for (const storyline of comic.storylines) {
      // Filter by storyline_id if provided
      if (storyline_id && storyline.id !== storyline_id) continue;

      for (const page of storyline.pages) {
        // Filter by page_numbers if provided
        if (page_numbers && page_numbers.length > 0) {
          if (!page_numbers.includes(page.pageNumber)) continue;
        }

        allPages.push({ comic, storyline, page });
      }
    }
  }

  const totalPages = allPages.length;

  // Find starting position based on cursor
  let startIndex = 0;
  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData) {
      // Find the page after the cursor position
      const cursorIndex = allPages.findIndex(
        (ref) =>
          ref.comic.id === cursorData.comic_id &&
          ref.storyline.id === cursorData.storyline_id &&
          ref.page.pageNumber === cursorData.page_number
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
  }

  // Get the page slice
  const endIndex = Math.min(startIndex + limit, allPages.length);
  const pageSlice = allPages.slice(startIndex, endIndex);

  // Build commentary array
  const commentary: CommentaryEntry[] = pageSlice.map((ref) => ({
    comic_id: ref.comic.id,
    comic_title: ref.comic.title,
    storyline_id: ref.storyline.id,
    storyline_title: ref.storyline.title,
    page_number: ref.page.pageNumber,
    page_title: ref.page.title,
    commentary: ref.page.commentary || '',
    has_commentary: Boolean(ref.page.commentary && ref.page.commentary.trim()),
  }));

  // Build pagination info
  const hasMore = endIndex < allPages.length;
  const pagination: PaginationInfo = {
    total_pages: totalPages,
    returned: commentary.length,
    has_more: hasMore,
  };

  if (hasMore && pageSlice.length > 0) {
    const lastPage = pageSlice[pageSlice.length - 1];
    pagination.next_cursor = encodeCursor({
      comic_id: lastPage.comic.id,
      storyline_id: lastPage.storyline.id,
      page_number: lastPage.page.pageNumber,
    });
  }

  return { commentary, pagination };
}

// ─── MCP Protocol Handling ─────────────────────────────────────────────────────

function handleInitialize(id: string | number, params?: { capabilities?: { extensions?: string[] } }): JsonRpcResponse {
  // Check if client supports MCP Apps UI extension
  // Safely handle extensions - could be array, object, or undefined
  const rawExtensions = params?.capabilities?.extensions;
  const clientExtensions = Array.isArray(rawExtensions) ? rawExtensions : [];
  const supportsUi = clientExtensions.includes('io.modelcontextprotocol/ui');

  // Build server capabilities, echoing UI support if client has it
  const capabilities: {
    tools: Record<string, never>;
    resources: Record<string, never>;
    extensions?: string[];
  } = {
    tools: {},
    resources: {},
  };

  // Echo back UI extension support to enable MCP Apps
  if (supportsUi) {
    capabilities.extensions = ['io.modelcontextprotocol/ui'];
  }

  return {
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: SERVER_INFO,
      capabilities,
    },
  };
}

// ─── Resource Handlers ─────────────────────────────────────────────────────────

function handleResourcesList(id: string | number): JsonRpcResponse {
  const resources = [];
  const manifest = loadManifest();

  // Only list the main UI resource if the app HTML is available
  const appHtml = loadMcpAppHtml();
  if (appHtml) {
    resources.push({
      uri: UI_RESOURCE_URI,
      name: 'Comic Reader App',
      description: 'Interactive comic reader',
      mimeType: UI_RESOURCE_MIME_TYPE,
    });
  }

  // Add index resources for discovering all available transcripts/commentary
  resources.push({
    uri: TRANSCRIPT_INDEX_URI,
    name: 'Transcript Index',
    description: 'Index of all available comic page transcripts with URIs',
    mimeType: 'text/plain',
  });
  resources.push({
    uri: COMMENTARY_INDEX_URI,
    name: 'Commentary Index',
    description: 'Index of all available author commentary with URIs',
    mimeType: 'text/plain',
  });

  // Add storyline-level resources for transcripts and commentary
  for (const comic of manifest.comics) {
    for (const storyline of comic.storylines) {
      const pageCount = storyline.pages.length;

      // Transcript resource for this storyline
      resources.push({
        uri: `transcript://${comic.id}/${storyline.id}`,
        name: `${storyline.title} - Transcripts`,
        description: `Panel-by-panel transcripts for all ${pageCount} pages of "${storyline.title}" from ${comic.title}`,
        mimeType: 'text/markdown',
      });

      // Commentary resource for this storyline
      resources.push({
        uri: `commentary://${comic.id}/${storyline.id}`,
        name: `${storyline.title} - Commentary`,
        description: `Author commentary for "${storyline.title}" from ${comic.title} (${pageCount} pages)`,
        mimeType: 'text/markdown',
      });
    }
  }

  // Add resource templates for page-level access (for future client support)
  const resourceTemplates = [
    {
      uriTemplate: `${TRANSCRIPT_URI_PREFIX}{comic_id}/{storyline_id}/{page_number}`,
      name: 'Comic Page Transcript',
      description: 'Text transcript of a comic page for accessibility and text-to-speech',
      mimeType: 'text/plain',
    },
    {
      uriTemplate: `${COMMENTARY_URI_PREFIX}{comic_id}/{storyline_id}/{page_number}`,
      name: 'Comic Page Commentary',
      description: 'Author commentary for a comic page',
      mimeType: 'text/plain',
    },
  ];

  return {
    jsonrpc: '2.0',
    id,
    result: { resources, resourceTemplates },
  };
}

/**
 * Parse a resource URI to extract comic_id, storyline_id, and page_number.
 * Returns null if the URI doesn't match the expected pattern.
 */
function parseResourceUri(uri: string, prefix: string): { comic_id: string; storyline_id: string; page_number: number } | null {
  if (!uri.startsWith(prefix)) {
    return null;
  }

  const path = uri.slice(prefix.length);
  const parts = path.split('/');

  if (parts.length !== 3) {
    return null;
  }

  const [comic_id, storyline_id, pageNumStr] = parts;
  const page_number = parseInt(pageNumStr, 10);

  if (isNaN(page_number) || page_number < 1) {
    return null;
  }

  return { comic_id, storyline_id, page_number };
}

function handleResourcesRead(id: string | number, params: { uri: string }): JsonRpcResponse {
  const { uri } = params;

  // Strip version query parameter for matching (handles cached old versions in Claude Desktop)
  const uriBase = uri.replace(/\?v=[^&]*/, '');

  // Handle transcript index
  if (uri === TRANSCRIPT_INDEX_URI) {
    const manifest = loadManifest();
    const lines: string[] = [
      '# Transcript Index',
      '',
      'All available comic page transcripts:',
      '',
    ];

    for (const comic of manifest.comics) {
      lines.push(`## ${comic.title}`);
      for (const storyline of comic.storylines) {
        lines.push(`### ${storyline.title}`);
        for (const page of storyline.pages) {
          const hasTranscript = page.transcript && page.transcript.trim();
          const transcriptUri = `${TRANSCRIPT_URI_PREFIX}${comic.id}/${storyline.id}/${page.pageNumber}`;
          lines.push(`- [${page.title}](${transcriptUri})${hasTranscript ? '' : ' (no transcript)'}`);
        }
        lines.push('');
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [{ uri, mimeType: 'text/plain', text: lines.join('\n') }],
      },
    };
  }

  // Handle commentary index
  if (uri === COMMENTARY_INDEX_URI) {
    const manifest = loadManifest();
    const lines: string[] = [
      '# Commentary Index',
      '',
      'All available author commentary:',
      '',
    ];

    for (const comic of manifest.comics) {
      lines.push(`## ${comic.title}`);
      for (const storyline of comic.storylines) {
        const pagesWithCommentary = storyline.pages.filter(p => p.commentary && p.commentary.trim());
        if (pagesWithCommentary.length > 0) {
          lines.push(`### ${storyline.title}`);
          for (const page of pagesWithCommentary) {
            const commentaryUri = `${COMMENTARY_URI_PREFIX}${comic.id}/${storyline.id}/${page.pageNumber}`;
            lines.push(`- [${page.title}](${commentaryUri})`);
          }
          lines.push('');
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [{ uri, mimeType: 'text/plain', text: lines.join('\n') }],
      },
    };
  }

  // Handle UI resource
  if (uriBase === 'ui://webcomic/reader.html') {
    const appHtml = loadMcpAppHtml();

    if (appHtml) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri: UI_RESOURCE_URI,
              mimeType: UI_RESOURCE_MIME_TYPE,
              text: appHtml,
              _meta: {
                ui: {
                  csp: {
                    resourceDomains: IMAGE_BASE_URL ? [IMAGE_BASE_URL] : [],
                    fontDomains: IMAGE_BASE_URL ? [IMAGE_BASE_URL] : [],
                  },
                },
              },
            },
          ],
        },
      };
    } else {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: 'MCP App HTML not found. Ensure mcp-app is built.',
        },
      };
    }
  }

  // Handle storyline-level transcript resource (transcript://comic-id/storyline-id)
  const storylineTranscriptMatch = uri.match(/^transcript:\/\/([^/]+)\/([^/]+)$/);
  if (storylineTranscriptMatch) {
    const [, comicId, storylineId] = storylineTranscriptMatch;
    const manifest = loadManifest();

    const comic = manifest.comics.find((c) => c.id === comicId);
    if (!comic) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: `Comic not found: "${comicId}"`,
        },
      };
    }

    const storyline = comic.storylines.find((s) => s.id === storylineId);
    if (!storyline) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: `Storyline not found: "${storylineId}"`,
        },
      };
    }

    // Build markdown content with all pages
    let content = `# ${storyline.title}\n\n`;
    content += `**Comic:** ${comic.title}\n`;
    content += `**Pages:** ${storyline.pages.length}\n\n---\n\n`;

    for (const page of storyline.pages) {
      content += `## Page ${page.pageNumber}: ${page.title}\n\n`;
      content += page.transcript || '*No transcript available*';
      content += '\n\n---\n\n';
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      },
    };
  }

  // Handle storyline-level commentary resource (commentary://comic-id/storyline-id)
  const storylineCommentaryMatch = uri.match(/^commentary:\/\/([^/]+)\/([^/]+)$/);
  if (storylineCommentaryMatch) {
    const [, comicId, storylineId] = storylineCommentaryMatch;
    const manifest = loadManifest();

    const comic = manifest.comics.find((c) => c.id === comicId);
    if (!comic) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: `Comic not found: "${comicId}"`,
        },
      };
    }

    const storyline = comic.storylines.find((s) => s.id === storylineId);
    if (!storyline) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: `Storyline not found: "${storylineId}"`,
        },
      };
    }

    // Build markdown content with all pages
    let content = `# ${storyline.title}\n\n`;
    content += `**Comic:** ${comic.title}\n`;
    content += `**Pages:** ${storyline.pages.length}\n\n---\n\n`;

    for (const page of storyline.pages) {
      content += `## Page ${page.pageNumber}: ${page.title}\n\n`;
      content += page.commentary || '*No commentary available*';
      content += '\n\n---\n\n';
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      },
    };
  }

  // Handle page-level transcript resource (legacy/template: transcript://webcomic/comic-id/storyline-id/page-number)
  const transcriptParams = parseResourceUri(uri, TRANSCRIPT_URI_PREFIX);
  if (transcriptParams) {
    try {
      const result = getTranscriptHandler(transcriptParams);
      const text = result.has_transcript
        ? `# ${result.page_title}\n\n${result.transcript}`
        : `# ${result.page_title}\n\n(No transcript available for this page)`;

      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text,
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: error instanceof Error ? error.message : 'Failed to load transcript',
        },
      };
    }
  }

  // Handle commentary resource
  const commentaryParams = parseResourceUri(uri, COMMENTARY_URI_PREFIX);
  if (commentaryParams) {
    try {
      const manifest = loadManifest();
      const comic = manifest.comics.find((c) => c.id === commentaryParams.comic_id);
      if (!comic) {
        throw new Error(`Comic not found: "${commentaryParams.comic_id}"`);
      }

      const storyline = comic.storylines.find((s) => s.id === commentaryParams.storyline_id);
      if (!storyline) {
        throw new Error(`Storyline not found: "${commentaryParams.storyline_id}"`);
      }

      const pageIndex = commentaryParams.page_number - 1;
      if (pageIndex < 0 || pageIndex >= storyline.pages.length) {
        throw new Error(`Page ${commentaryParams.page_number} out of range`);
      }

      const page = storyline.pages[pageIndex];
      const text = page.commentary
        ? `# Author Commentary: ${page.title}\n\n${page.commentary}`
        : `# ${page.title}\n\n(No commentary available for this page)`;

      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text,
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: error instanceof Error ? error.message : 'Failed to load commentary',
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32002,
      message: `Resource not found: ${uri}`,
    },
  };
}

function handleToolsList(id: string | number): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: { tools },
  };
}

async function handleToolsCall(id: string | number, params: { name: string; arguments?: Record<string, unknown> }): Promise<JsonRpcResponse> {
  const { name, arguments: args = {} } = params;

  try {
    let result: unknown;
    let includeUi = false;

    switch (name) {
      case 'list_comics':
        result = listComicsHandler();
        break;
      case 'list_storylines':
        result = listStorylinesHandler(args as { comic_id: string });
        break;
      case 'get_page':
        result = await getPageHandler(args as { comic_id: string; storyline_id: string; page_number: number });
        includeUi = true; // This tool opens the MCP App
        break;
      case 'get_transcript':
        result = getTranscriptHandler(args as { comic_id: string; storyline_id: string; page_number: number });
        break;
      case 'search_comics':
        result = searchComicsHandler(args as { query: string });
        break;
      case 'list_characters':
        result = listCharactersHandler(args as { comic_id?: string });
        break;
      case 'search_by_character':
        result = searchByCharacterHandler(args as { character_slug: string });
        break;
      case 'get_transcripts':
        result = getTranscriptsHandler(args as GetTranscriptsParams);
        break;
      case 'get_commentary':
        result = getCommentaryHandler(args as GetCommentaryParams);
        break;
      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`,
          },
        };
    }

    // Build result with optional _meta for UI-enabled tools
    const toolResult: { content: Array<{ type: string; text: string }>; _meta?: { ui: { resourceUri: string } } } = {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };

    if (includeUi) {
      toolResult._meta = {
        ui: {
          resourceUri: UI_RESOURCE_URI,
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: toolResult,
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

async function handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const { id, method, params } = request;

  // Notifications don't have an id and don't expect a response
  if (method.startsWith('notifications/')) {
    // Notification received - no response needed
    console.log(`MCP notification received: ${method}`);
    return null;
  }

  switch (method) {
    case 'initialize':
      return handleInitialize(id, params as { capabilities?: { extensions?: string[] } });
    case 'tools/list':
      return handleToolsList(id);
    case 'tools/call':
      return await handleToolsCall(id, params as { name: string; arguments?: Record<string, unknown> });
    case 'resources/list':
      return handleResourcesList(id);
    case 'resources/read':
      return handleResourcesRead(id, params as { uri: string });
    case 'ping':
      // Ping is a request that expects a response
      return { jsonrpc: '2.0', id, result: {} };
    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

// ─── Netlify Handler ───────────────────────────────────────────────────────────

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
): Promise<HandlerResponse> => {
  // Handle CORS preflight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Handle GET for server discovery/health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'webcomic-mcp-server',
        version: '1.0.0',
        protocolVersion: '2024-11-05',
        description: 'MCP server for webcomic archive',
        capabilities: ['tools', 'resources'],
      }),
    };
  }

  // Only accept POST for MCP protocol
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Method not allowed. Use POST for MCP protocol.',
        },
      }),
    };
  }

  // Parse JSON body
  let request: JsonRpcRequest;
  try {
    if (!event.body) {
      throw new Error('Empty request body');
    }
    request = JSON.parse(event.body);

    // Validate JSON-RPC format
    if (request.jsonrpc !== '2.0' || !request.method) {
      throw new Error('Invalid JSON-RPC request');
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
        },
      }),
    };
  }

  // Handle the MCP request
  const response = await handleRequest(request);

  // Notifications return null - send empty 200 response
  if (response === null) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(response),
  };
};
