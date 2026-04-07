/**
 * Manifest loading utilities for the MCP Server.
 *
 * Separated from index.ts to avoid circular dependency issues
 * when tool modules import loadManifest.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ─── Manifest Types ─────────────────────────────────────────────────────────

export interface Manifest {
  generated: string;
  comics: Comic[];
}

export interface Comic {
  id: string;
  title: string;
  type: 'linear' | 'episodic';
  description: string;
  coverImage?: string;
  storylines: Storyline[];
}

export interface Storyline {
  id: string;
  title: string;
  order: number;
  description?: string;
  pages: Page[];
}

export interface Page {
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
  characters?: string[];  // Character slugs appearing on this page
}

export interface Comment {
  id: string;
  author: string;
  authorUrl?: string;
  date?: string;
  text: string;
  replies: Comment[];
}

// ─── Manifest Loading ───────────────────────────────────────────────────────

let cachedManifest: Manifest | null = null;

/**
 * Loads the comic manifest from disk.
 * Caches the result for subsequent calls.
 *
 * Supports MANIFEST_PATH environment variable for deployment scenarios.
 */
export function loadManifest(): Manifest {
  if (cachedManifest) {
    return cachedManifest;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Check for environment variable first (for Docker/Railway deployment)
  // Then fall back to relative path (for local development)
  const manifestPath = process.env.MANIFEST_PATH
    ? path.resolve(process.env.MANIFEST_PATH)
    : path.resolve(__dirname, '../../src/_data/manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const content = fs.readFileSync(manifestPath, 'utf-8');
  cachedManifest = JSON.parse(content) as Manifest;

  return cachedManifest;
}

/**
 * Clears the cached manifest (useful for testing).
 */
export function clearManifestCache(): void {
  cachedManifest = null;
}
