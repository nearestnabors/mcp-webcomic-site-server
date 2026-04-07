/**
 * Phase 34.6 - Verify Comic Pages Are Generated
 *
 * PRD: 34.T6
 * Task: Verify site builds and displays comics
 *
 * This test verifies:
 * - Comic pages are generated from manifest data
 * - Archive index page is generated
 * - Homepage is generated
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Phase 34.6: Comic Pages Generated', () => {
  // Run build once before all tests
  beforeAll(() => {
    // Build the site
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: 'pipe'
    });
  }, 90000);

  describe('homepage', () => {
    it('should generate index.html at root', () => {
      const indexPath = path.join(PROJECT_ROOT, '_site/index.html');
      expect(fs.existsSync(indexPath), 'index.html should exist').toBe(true);
    });

    it('should have link to comics archive', () => {
      const indexPath = path.join(PROJECT_ROOT, '_site/index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        expect(content).toContain('/comics/');
      }
    });
  });

  describe('comics archive', () => {
    it('should generate comics/index.html', () => {
      const archivePath = path.join(PROJECT_ROOT, '_site/comics/index.html');
      expect(fs.existsSync(archivePath), 'comics/index.html should exist').toBe(true);
    });

    it('should list storylines', () => {
      const archivePath = path.join(PROJECT_ROOT, '_site/comics/index.html');
      if (fs.existsSync(archivePath)) {
        const content = fs.readFileSync(archivePath, 'utf-8');
        // Should contain links to storyline pages
        expect(content).toContain('Gale Allen');
      }
    });
  });

  describe('comic pages', () => {
    // Read manifest to know expected pages
    const manifestPath = path.join(PROJECT_ROOT, 'src/_data/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');

    it('should generate comic page for first storyline, first page', () => {
      const firstStoryline = franHopper?.storylines?.[0];
      const firstPage = firstStoryline?.pages?.[0];
      if (firstPage) {
        const pagePath = path.join(PROJECT_ROOT, `_site/comics/${firstPage.slug}/index.html`);
        expect(fs.existsSync(pagePath), `${firstPage.slug}/index.html should exist`).toBe(true);
      }
    });

    it('should generate at least 10 comic pages (5 per storyline)', () => {
      // Count HTML files in comics directory (excluding archive pages)
      const comicsDir = path.join(PROJECT_ROOT, '_site/comics');
      if (fs.existsSync(comicsDir)) {
        const countComicPages = (dir: string): number => {
          let count = 0;
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            if (item.isDirectory()) {
              const subdir = path.join(dir, item.name);
              // Check if it's a comic page directory (has index.html)
              const indexPath = path.join(subdir, 'index.html');
              if (fs.existsSync(indexPath)) {
                // Skip pagination directories (page/2/, page/3/, etc.)
                if (item.name !== 'page') {
                  count++;
                }
              }
              // Also check subdirectories recursively
              count += countComicPages(subdir);
            }
          }
          return count;
        };
        const pageCount = countComicPages(comicsDir);
        expect(pageCount, `Expected at least 10 comic pages, found ${pageCount}`).toBeGreaterThanOrEqual(10);
      }
    });

    it('comic pages should have comic image', () => {
      const firstStoryline = franHopper?.storylines?.[0];
      const firstPage = firstStoryline?.pages?.[0];
      if (firstPage) {
        const pagePath = path.join(PROJECT_ROOT, `_site/comics/${firstPage.slug}/index.html`);
        if (fs.existsSync(pagePath)) {
          const content = fs.readFileSync(pagePath, 'utf-8');
          // Should have the comic image
          expect(content).toContain('the_comic-image');
        }
      }
    });

    it('comic pages should have navigation', () => {
      const firstStoryline = franHopper?.storylines?.[0];
      const secondPage = firstStoryline?.pages?.[1]; // Use second page so both prev/next may exist
      if (secondPage) {
        const pagePath = path.join(PROJECT_ROOT, `_site/comics/${secondPage.slug}/index.html`);
        if (fs.existsSync(pagePath)) {
          const content = fs.readFileSync(pagePath, 'utf-8');
          // Should have navigation elements
          expect(content).toContain('nav_comic');
        }
      }
    });

    it('comic pages should have transcript section', () => {
      const firstStoryline = franHopper?.storylines?.[0];
      const firstPage = firstStoryline?.pages?.[0];
      if (firstPage) {
        const pagePath = path.join(PROJECT_ROOT, `_site/comics/${firstPage.slug}/index.html`);
        if (fs.existsSync(pagePath)) {
          const content = fs.readFileSync(pagePath, 'utf-8');
          // Should have transcript toggle
          expect(content).toContain('transcript');
        }
      }
    });
  });
});
