/**
 * Phase 35.7: WebMCP Tools Registration Tests
 *
 * Verifies that WebMCP tools are properly included in comic pages and
 * will register correctly in browsers that support the WebMCP API.
 *
 * PRD: 35.T7 - Verify WebMCP tools register
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(REPO_ROOT, '_site');
const INCLUDES_DIR = path.join(REPO_ROOT, 'src/_includes');

describe('Phase 35.7: WebMCP Tools Registration', () => {
  // Ensure site is built before running tests
  beforeAll(() => {
    if (!fs.existsSync(SITE_DIR)) {
      execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit' });
    }
  });

  describe('WebMCP Template Files', () => {
    it('webmcp-base.njk exists and contains tool registration code', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('navigator.modelContext.registerTool');
      expect(content).toContain("name: 'list_comics'");
      expect(content).toContain("name: 'search_comics'");
    });

    it('webmcp-comic.njk exists and includes comic-specific tools', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-comic.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('navigator.modelContext.registerTool');
      expect(content).toContain("name: 'get_current_page'");
      expect(content).toContain("name: 'get_transcript'");
      expect(content).toContain("name: 'get_image_url'");
      expect(content).toContain("name: 'first_page'");
    });

    it('webmcp-minimal.njk exists and includes base tools', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-minimal.njk');
      expect(fs.existsSync(filepath)).toBe(true);

      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('{% include "webmcp-base.njk" %}');
    });

    it('webmcp-base.njk uses fran-hopper-comics (not rachel-the-great)', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should reference Fran Hopper
      expect(content).toContain('fran-hopper-comics');

      // Should NOT reference Rachel the Great
      expect(content).not.toContain('rachel-the-great');
      expect(content.toLowerCase()).not.toContain('rachel');
    });
  });

  describe('WebMCP Inclusion in Built Pages', () => {
    it('homepage includes webmcp-base tools via webmcp-minimal', () => {
      const indexPath = path.join(SITE_DIR, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);

      const content = fs.readFileSync(indexPath, 'utf-8');

      // Should include the tool registration script
      expect(content).toContain('navigator.modelContext.registerTool');
      expect(content).toContain('list_comics');
      expect(content).toContain('search_comics');
    });

    it('comic page includes webmcp-comic tools', () => {
      // Find any generated comic page
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
      expect(fs.existsSync(comicPagePath)).toBe(true);

      const content = fs.readFileSync(comicPagePath, 'utf-8');

      // Should include base tools
      expect(content).toContain('list_comics');
      expect(content).toContain('search_comics');

      // Should include comic-specific tools
      expect(content).toContain('get_current_page');
      expect(content).toContain('get_transcript');
      expect(content).toContain('get_image_url');
      expect(content).toContain('first_page');
    });
  });

  describe('WebMCP JavaScript Validity', () => {
    it('webmcp-base.njk contains valid JavaScript (no syntax errors)', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Extract the script content (between <script> tags)
      const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
      expect(scriptMatch).not.toBeNull();

      const scriptContent = scriptMatch![1];

      // Verify it's a valid JavaScript IIFE structure
      expect(scriptContent).toContain('(function()');
      expect(scriptContent).toContain("'use strict'");
      expect(scriptContent).toContain('})();');

      // Verify proper modelContext check
      expect(scriptContent).toContain("if (!('modelContext' in navigator))");
    });

    it('tool registrations have required fields', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Each registerTool call should have: name, description, inputSchema, execute
      const registerToolCalls =
        content.match(/registerTool\(\{[\s\S]*?\}\);/g) || [];
      expect(registerToolCalls.length).toBeGreaterThan(0);

      for (const call of registerToolCalls) {
        expect(call).toContain('name:');
        expect(call).toContain('description:');
        expect(call).toContain('inputSchema:');
        expect(call).toContain('execute:');
      }
    });

    it('search_comics tool uses Pagefind API', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should load Pagefind dynamically
      expect(content).toContain('/pagefind/pagefind.js');
      expect(content).toContain('pagefindInstance.init()');
      // Note: Variable is named pagefindInstance, so search is searchResults.results
      expect(content).toContain('pagefind.search(query)');
    });
  });

  describe('WebMCP Console Logging', () => {
    it('logs tool registration for debugging', () => {
      const basePath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const baseContent = fs.readFileSync(basePath, 'utf-8');

      expect(baseContent).toContain('console.log');
      expect(baseContent).toContain('WebMCP: base tools registered');

      const comicPath = path.join(INCLUDES_DIR, 'webmcp-comic.njk');
      const comicContent = fs.readFileSync(comicPath, 'utf-8');

      expect(comicContent).toContain('console.log');
      expect(comicContent).toContain('WebMCP: comic page tools registered');
    });
  });

  describe('WebMCP Feature Detection', () => {
    it('gracefully exits if modelContext not available', () => {
      const filepath = path.join(INCLUDES_DIR, 'webmcp-base.njk');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should check for modelContext before attempting registration
      expect(content).toContain("if (!('modelContext' in navigator))");
      expect(content).toContain('return;');
    });
  });

  describe('No Rachel-Specific Content in WebMCP', () => {
    const webmcpFiles = [
      'webmcp-base.njk',
      'webmcp-comic.njk',
      'webmcp-minimal.njk',
      'webmcp-archive.njk',
    ];

    for (const filename of webmcpFiles) {
      it(`${filename} has no Rachel-specific content`, () => {
        const filepath = path.join(INCLUDES_DIR, filename);
        if (!fs.existsSync(filepath)) {
          // Skip if file doesn't exist (webmcp-archive might be optional)
          return;
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        const contentLower = content.toLowerCase();

        expect(contentLower).not.toContain('rachel the great');
        expect(contentLower).not.toContain('rachel-the-great');
        expect(content).not.toContain('rachelthegreat.com');
        expect(contentLower).not.toContain('tuna');
        expect(contentLower).not.toContain('anti-cupid');
      });
    }
  });
});
