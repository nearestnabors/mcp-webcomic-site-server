/**
 * Phase 36: Declarative WebMCP Tests
 *
 * Verifies that search forms use the standard declarative WebMCP attributes
 * (toolname / tooldescription / toolparamdescription) for tool discovery by
 * browser-based agents. Migrated from the legacy data-mcp-* attributes.
 *
 * PRD: 36.T1, 36.T2, 36.T3, 36.T4, 36.T5, 36.T6, 36.T7, 36.T8
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(REPO_ROOT, '_site');
const INCLUDES_DIR = path.join(REPO_ROOT, 'src/_includes');
const PAGES_DIR = path.join(REPO_ROOT, 'src/pages');

describe('Phase 36: Declarative WebMCP', () => {
  // Ensure site is built before running tests
  beforeAll(() => {
    if (!fs.existsSync(SITE_DIR)) {
      execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit' });
    }
  });

  describe('36.T1: search-form.njk uses standard tool attributes', () => {
    it('form element has toolname="search_comics"', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('toolname="search_comics"');
    });

    it('form element has a meaningful tooldescription', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      const descMatch = content.match(/tooldescription="([^"]+)"/);
      expect(descMatch).not.toBeNull();
      expect(descMatch![1].length).toBeGreaterThan(10);
    });
  });

  describe('36.T2: search input describes its parameter', () => {
    it('input element has toolparamdescription', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      const descMatch = content.match(/toolparamdescription="([^"]+)"/);
      expect(descMatch).not.toBeNull();
      expect(descMatch![1].length).toBeGreaterThan(10);
    });

    it('input element is marked required (standard HTML)', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toMatch(/\brequired\b/);
    });
  });

  describe('36.T3: search.njk form has matching attributes', () => {
    it('form has toolname="search_comics"', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('toolname="search_comics"');
    });

    it('form has tooldescription attribute', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('tooldescription=');
    });

    it('input has toolparamdescription', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('toolparamdescription=');
    });
  });

  describe('36.T4: imperative WebMCP intact', () => {
    it('webmcp-base.njk registers search_comics via document.modelContext.registerTool', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('document.modelContext.registerTool');
      expect(content).toContain("name: 'search_comics'");
    });

    it('webmcp-base.njk execute function still contains Pagefind search logic', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('pagefind.search(query');
      expect(content).toContain('/pagefind/pagefind.js');
    });

    it('no legacy data-mcp-* attributes remain in the forms', () => {
      const files = [
        path.join(INCLUDES_DIR, 'search-form.njk'),
        path.join(PAGES_DIR, 'search.njk'),
      ];
      for (const f of files) {
        const content = fs.readFileSync(f, 'utf-8');
        expect(content).not.toContain('data-mcp-tool');
        expect(content).not.toContain('data-mcp-param');
        expect(content).not.toContain('data-mcp-description');
      }
    });
  });

  describe('36.T5: site builds without errors', () => {
    it('_site directory exists with built content', () => {
      expect(fs.existsSync(SITE_DIR)).toBe(true);
      expect(fs.existsSync(path.join(SITE_DIR, 'index.html'))).toBe(true);
    });

    it('built search page uses standard tool attributes', () => {
      const searchPagePath = path.join(SITE_DIR, 'search/index.html');
      expect(fs.existsSync(searchPagePath)).toBe(true);

      const content = fs.readFileSync(searchPagePath, 'utf-8');
      expect(content).toContain('toolname="search_comics"');
      expect(content).toContain('toolparamdescription=');
    });

    it('built comic page has standard tool attributes in sidebar search', () => {
      const comicsDir = path.join(SITE_DIR, 'comics');
      const entries = fs.readdirSync(comicsDir, { withFileTypes: true });
      const comicDir = entries.find(
        (e) => e.isDirectory() && e.name !== 'index.html'
      );
      if (!comicDir) {
        throw new Error('No comic page directories found');
      }

      const comicPagePath = path.join(comicsDir, comicDir.name, 'index.html');
      const content = fs.readFileSync(comicPagePath, 'utf-8');

      expect(content).toContain('toolname="search_comics"');
    });
  });

  describe('36.T6: search still works for humans (form attributes preserved)', () => {
    it('search form has action="/search/" for form submission', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('action="/search/"');
      expect(content).toContain('method="get"');
    });

    it('search input has name="q" for query parameter', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('name="q"');
    });

    it('search form has submit button', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('type="submit"');
    });
  });

  describe('36.T7: declarative and imperative coexist', () => {
    it('comic page has both declarative (form) and imperative (JS) search_comics', () => {
      const comicsDir = path.join(SITE_DIR, 'comics');
      const entries = fs.readdirSync(comicsDir, { withFileTypes: true });
      const comicDir = entries.find(
        (e) => e.isDirectory() && e.name !== 'index.html'
      );
      if (!comicDir) {
        throw new Error('No comic page directories found');
      }

      const comicPagePath = path.join(comicsDir, comicDir.name, 'index.html');
      const content = fs.readFileSync(comicPagePath, 'utf-8');

      // Declarative: form attribute
      expect(content).toContain('toolname="search_comics"');

      // Imperative: JS registration
      expect(content).toContain('document.modelContext.registerTool');
      expect(content).toContain("name: 'search_comics'");
    });
  });
});
