/**
 * WebMCP catalog data
 *
 * Builds a compact JSON catalog (characters, storylines, and per-character
 * page appearances) that the browser-side WebMCP tools fetch at runtime.
 * The full manifest.json is ~1.4 MB and too large to inline on every page,
 * so this endpoint exposes just what list_characters / search_by_character /
 * list_storylines need.
 *
 * Emitted to /webmcp/catalog.json by webmcp-catalog.njk.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const manifest = require('./_data/manifest.json');
const charactersData = require('./_data/characters.json');

export default function () {
  const comics = manifest.comics || [];

  // Storylines across all comics
  const storylines = [];
  // Character slug -> list of page appearances
  const appearances = {};

  for (const comic of comics) {
    for (const storyline of comic.storylines || []) {
      const pages = storyline.pages || [];
      const firstPage = pages[0];
      storylines.push({
        id: storyline.id,
        title: storyline.title,
        comic: comic.id,
        order: storyline.order,
        page_count: pages.length,
        first_page_url: firstPage ? firstPage.originalUrl : undefined,
      });

      for (const page of pages) {
        for (const slug of page.characters || []) {
          (appearances[slug] = appearances[slug] || []).push({
            url: page.originalUrl,
            title: page.title,
            page_number: page.pageNumber,
            storyline: storyline.id,
            comic: comic.id,
            date: page.publishedDate,
          });
        }
      }
    }
  }

  const characters = Object.values(charactersData).map((char) => ({
    slug: char.slug,
    name: char.name,
    comic: char.comicId,
    bio: char.bio,
    appearance_count: (appearances[char.slug] || []).length,
  }));

  return {
    catalog: { characters, storylines, appearances },
  };
}
