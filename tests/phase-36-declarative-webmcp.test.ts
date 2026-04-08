/**
 * Phase 36: Declarative WebMCP Tests
 *
 * Verifies that search forms have data-mcp-* attributes for declarative
 * WebMCP tool discovery by browser-based agents.
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

  describe('36.T1: search-form.njk has data-mcp-tool attribute', () => {
    it('form element has data-mcp-tool="search_comics"', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('data-mcp-tool="search_comics"');
    });

    it('form element has data-mcp-description attribute with meaningful description', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-description=');
      // Verify description contains meaningful text (not empty)
      const descMatch = content.match(/data-mcp-description="([^"]+)"/);
      expect(descMatch).not.toBeNull();
      expect(descMatch![1].length).toBeGreaterThan(10);
    });
  });

  describe('36.T2: search input has data-mcp-param attribute', () => {
    it('input element has data-mcp-param="query"', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-param="query"');
    });

    it('input element has data-mcp-description attribute', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // There should be two data-mcp-description attributes:
      // one on the form, one on the input
      const matches = content.match(/data-mcp-description=/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('input element has data-mcp-required="true"', () => {
      const filepath = path.join(INCLUDES_DIR, 'search-form.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-required="true"');
    });
  });

  describe('36.T3: search.njk form has matching attributes', () => {
    it('form has data-mcp-tool="search_comics"', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('data-mcp-tool="search_comics"');
    });

    it('form has data-mcp-description attribute', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-description=');
    });

    it('input has data-mcp-param="query"', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-param="query"');
    });

    it('input has data-mcp-required="true"', () => {
      const filepath = path.join(PAGES_DIR, 'search.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('data-mcp-required="true"');
    });
  });

  describe('36.T4: imperative WebMCP unchanged', () => {
    it('webmcp-base.njk still registers search_comics via navigator.modelContext.registerTool', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('navigator.modelContext.registerTool');
      expect(content).toContain("name: 'search_comics'");
    });

    it('webmcp-base.njk execute function still contains Pagefind search logic', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('pagefind.search(query)');
      expect(content).toContain('/pagefind/pagefind.js');
    });

    it('webmcp-base.njk has not been accidentally modified (no data-mcp-* attributes)', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // webmcp-base.njk should NOT have declarative attributes
      // (those go in the form templates, not the JS registration)
      expect(content).not.toContain('data-mcp-tool');
      expect(content).not.toContain('data-mcp-param');
    });
  });

  describe('36.T5: site builds without errors', () => {
    it('_site directory exists with built content', () => {
      expect(fs.existsSync(SITE_DIR)).toBe(true);
      expect(fs.existsSync(path.join(SITE_DIR, 'index.html'))).toBe(true);
    });

    it('built search page contains data-mcp-* attributes', () => {
      const searchPagePath = path.join(SITE_DIR, 'search/index.html');
      expect(fs.existsSync(searchPagePath)).toBe(true);

      const content = fs.readFileSync(searchPagePath, 'utf-8');
      expect(content).toContain('data-mcp-tool="search_comics"');
      expect(content).toContain('data-mcp-param="query"');
    });

    it('built comic page has data-mcp-* attributes in sidebar search', () => {
      // Comic pages include sidebar-comics.njk which has the search form
      // (Homepage has "Quick Links" sidebar without search form)
      const comicsDir = path.join(SITE_DIR, 'comics');
      if (!fs.existsSync(comicsDir)) {
        throw new Error('Comics directory not found - site may not be built');
      }

      const entries = fs.readdirSync(comicsDir, { withFileTypes: true });
      const comicDir = entries.find(
        (e) => e.isDirectory() && e.name !== 'index.html'
      );

      if (!comicDir) {
        throw new Error('No comic page directories found');
      }

      const comicPagePath = path.join(comicsDir, comicDir.name, 'index.html');
      const content = fs.readFileSync(comicPagePath, 'utf-8');

      // Comic pages include sidebar with search form
      expect(content).toContain('data-mcp-tool="search_comics"');
      expect(content).toContain('data-mcp-param="query"');
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
      // Comic pages have both:
      // - Declarative: search form in sidebar with data-mcp-* attributes
      // - Imperative: JS registration via webmcp-comic.njk
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
      expect(content).toContain('data-mcp-tool="search_comics"');

      // Imperative: JS registration
      expect(content).toContain('navigator.modelContext.registerTool');
      expect(content).toContain("name: 'search_comics'");
    });
  });
});
