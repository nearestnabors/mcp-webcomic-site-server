/**
 * WebMCP parity: the browser tools ported from the RTG site.
 * Covers document.modelContext, structured output, annotations, search
 * pagination/metadata, get_page, open_comic_page, and character/storyline tools.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inc = path.join(root, 'src', '_includes');
const base = () => fs.readFileSync(path.join(inc, 'webmcp-base.njk'), 'utf-8');
const count = (c: string, re: RegExp) => (c.match(re) || []).length;
const slice = (c: string, from: string, to: string) => {
  const s = c.indexOf(from);
  const e = to ? c.indexOf(to, s + 1) : c.length;
  return c.slice(s, e === -1 ? c.length : e);
};

describe('WebMCP browser parity', () => {
  it('uses document.modelContext (not navigator)', () => {
    const c = base();
    expect(c).toMatch(/'modelContext'\s+in\s+document/);
    expect(c).toContain('document.modelContext.registerTool');
    expect(c).not.toContain('navigator.modelContext');
  });

  it('registers the full base tool set', () => {
    const c = base();
    for (const name of ['list_comics', 'search_comics', 'open_comic_page', 'get_page', 'list_characters', 'search_by_character', 'list_storylines']) {
      expect(c).toMatch(new RegExp(`name:\\s*['"]${name}['"]`));
    }
  });

  it('every tool returns structuredContent and declares outputSchema', () => {
    const c = base();
    expect(count(c, /outputSchema:/g)).toBe(7);
    expect(count(c, /structuredContent:/g)).toBe(7);
  });

  it('annotates read-only tools and flags untrusted (comment-bearing) tools', () => {
    const c = base();
    expect(slice(c, "'search_comics'", "'open_comic_page'")).toMatch(/readOnlyHint:\s*true[\s\S]*untrustedContentHint:\s*true/);
    expect(slice(c, "'get_page'", "'list_characters'")).toMatch(/readOnlyHint:\s*true[\s\S]*untrustedContentHint:\s*true/);
    expect(slice(c, "'open_comic_page'", "'get_page'")).toMatch(/readOnlyHint:\s*false/);
  });

  it('search_comics paginates, sorts, enriches, and strips markup', () => {
    const b = slice(base(), "'search_comics'", "'open_comic_page'");
    expect(b).toMatch(/limit:\s*\{[^}]*integer/s);
    expect(b).toMatch(/offset:\s*\{[^}]*integer/s);
    expect(b).toMatch(/sort:\s*\{/);
    expect(b).toMatch(/page_number/);
    expect(b).toMatch(/storyline/);
    expect(b).toMatch(/returned:\s*results\.length/);
    expect(b).toMatch(/replace\(\/<\[\^>\]\*>\/g/);
  });

  it('get_page fetches + parses same-site content without navigating', () => {
    const b = slice(base(), "'get_page'", "'list_characters'");
    expect(b).toMatch(/await fetch\(/);
    expect(b).toMatch(/DOMParser/);
    expect(b).toMatch(/origin\s*!==\s*window\.location\.origin/);
    expect(b).not.toMatch(/window\.location\.href\s*=/);
  });

  it('builds a catalog.json with Fran Hopper characters + storylines', () => {
    const cat = JSON.parse(fs.readFileSync(path.join(root, '_site', 'webmcp', 'catalog.json'), 'utf-8'));
    expect(Array.isArray(cat.characters)).toBe(true);
    expect(cat.characters.length).toBeGreaterThan(0);
    expect(Array.isArray(cat.storylines)).toBe(true);
    expect(cat.appearances['gale-allen'] && cat.appearances['gale-allen'].length).toBeGreaterThan(0);
  });

  it('comic layout indexes page_number/storyline/date as pagefind meta', () => {
    const layout = fs.readFileSync(path.join(root, 'src', '_layouts', 'comic-page.njk'), 'utf-8');
    expect(layout).toMatch(/data-pagefind-meta="page_number:/);
    expect(layout).toMatch(/data-pagefind-meta="storyline:/);
    expect(layout).toMatch(/data-pagefind-sort="date:/);
  });
});
