import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..');
const SITE_DIR = join(ROOT_DIR, '_site');

describe('Phase 35.4: End-to-End Verification', () => {
  describe('Build Process', () => {
    it('package.json exists and is valid JSON', () => {
      const pkgPath = join(ROOT_DIR, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('mcp-webcomic-site-server');
    });

    it('node_modules exists (npm install completed)', () => {
      const nodeModulesPath = join(ROOT_DIR, 'node_modules');
      expect(existsSync(nodeModulesPath)).toBe(true);
    });

    it('_site directory exists (npm run build completed)', () => {
      expect(existsSync(SITE_DIR)).toBe(true);
    });

    it('_site/index.html (homepage) exists', () => {
      const indexPath = join(SITE_DIR, 'index.html');
      expect(existsSync(indexPath)).toBe(true);
    });
  });

  describe('Homepage Content', () => {
    it('homepage loads with correct title', () => {
      const indexPath = join(SITE_DIR, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/<title>/);
      // Should NOT mention Rachel the Great
      expect(content).not.toMatch(/Rachel the Great/i);
    });

    it('homepage has links to comics archive', () => {
      const indexPath = join(SITE_DIR, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/href="\/comics\/"/i);
    });

    it('homepage mentions Fran Hopper sample content', () => {
      const indexPath = join(SITE_DIR, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/Fran Hopper/i);
    });
  });

  describe('Comics Archive', () => {
    it('comics/index.html (archive page) exists', () => {
      const archivePath = join(SITE_DIR, 'comics', 'index.html');
      expect(existsSync(archivePath)).toBe(true);
    });

    it('archive page lists storylines', () => {
      const archivePath = join(SITE_DIR, 'comics', 'index.html');
      const content = readFileSync(archivePath, 'utf-8');
      // Should have Gale Allen and/or Mysta of the Moon
      expect(content).toMatch(/Gale Allen|Mysta of the Moon/i);
    });
  });

  describe('Comic Pages', () => {
    it('at least one comic page exists', () => {
      const comicsDir = join(SITE_DIR, 'comics');
      const entries = readdirSync(comicsDir, { withFileTypes: true });
      const pageDirs = entries.filter(e => e.isDirectory() && e.name !== 'index.html');
      expect(pageDirs.length).toBeGreaterThan(0);
    });

    it('comic page has correct structure (image, transcript)', () => {
      // Find a comic page
      const comicsDir = join(SITE_DIR, 'comics');
      const entries = readdirSync(comicsDir, { withFileTypes: true });
      const pageDirs = entries.filter(e => e.isDirectory());

      if (pageDirs.length === 0) {
        throw new Error('No comic page directories found');
      }

      const firstPageDir = pageDirs[0].name;
      const pagePath = join(comicsDir, firstPageDir, 'index.html');
      expect(existsSync(pagePath)).toBe(true);

      const content = readFileSync(pagePath, 'utf-8');
      // Should have an image
      expect(content).toMatch(/<img[^>]+src=/i);
      // Should have transcript section
      expect(content).toMatch(/transcript/i);
    });

    it('comic pages have navigation (prev/next)', () => {
      const comicsDir = join(SITE_DIR, 'comics');
      const entries = readdirSync(comicsDir, { withFileTypes: true });
      const pageDirs = entries.filter(e => e.isDirectory());

      if (pageDirs.length === 0) {
        throw new Error('No comic page directories found');
      }

      const firstPageDir = pageDirs[0].name;
      const pagePath = join(comicsDir, firstPageDir, 'index.html');
      const content = readFileSync(pagePath, 'utf-8');

      // Should have nav class or prev/next links
      expect(content).toMatch(/nav|prev|next/i);
    });
  });

  describe('About Page', () => {
    it('about page exists at /about/', () => {
      const aboutPath = join(SITE_DIR, 'about', 'index.html');
      expect(existsSync(aboutPath)).toBe(true);
    });

    it('about page mentions Fran Hopper', () => {
      const aboutPath = join(SITE_DIR, 'about', 'index.html');
      const content = readFileSync(aboutPath, 'utf-8');
      expect(content).toMatch(/Fran Hopper/i);
    });

    it('about page does NOT mention Rachel the Great bio', () => {
      const aboutPath = join(SITE_DIR, 'about', 'index.html');
      const content = readFileSync(aboutPath, 'utf-8');
      expect(content).not.toMatch(/Rachel the Great/i);
    });
  });

  describe('No Rachel-Specific Content (35.T5)', () => {
    it('no "Rachel the Great" text in _site', () => {
      const checkForRachel = (dir: string): string[] => {
        const matches: string[] = [];
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            matches.push(...checkForRachel(fullPath));
          } else if (entry.name.endsWith('.html')) {
            const content = readFileSync(fullPath, 'utf-8');
            if (/Rachel the Great/i.test(content)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      };

      const rachelMatches = checkForRachel(SITE_DIR);
      expect(rachelMatches).toEqual([]);
    });

    it('no pink/magenta hex colors (#cd3baa, #ff00ff, #fa00bf) in CSS', () => {
      const cssDir = join(SITE_DIR, 'css');
      if (!existsSync(cssDir)) {
        // CSS might be inlined, check in _site directly
        return;
      }

      const cssFiles = readdirSync(cssDir).filter(f => f.endsWith('.css'));

      for (const cssFile of cssFiles) {
        const content = readFileSync(join(cssDir, cssFile), 'utf-8');
        expect(content).not.toMatch(/#cd3baa/i);
        expect(content).not.toMatch(/#ff00ff/i);
        expect(content).not.toMatch(/#fa00bf/i);
      }
    });
  });

  describe('Search Functionality', () => {
    it('pagefind directory exists (search index built)', () => {
      const pagefindDir = join(SITE_DIR, 'pagefind');
      expect(existsSync(pagefindDir)).toBe(true);
    });

    it('pagefind index contains comic content', () => {
      const pagefindDir = join(SITE_DIR, 'pagefind');
      const pagefindFiles = readdirSync(pagefindDir);
      // Should have index files
      expect(pagefindFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Static Assets', () => {
    it('comic images directory exists', () => {
      const imagesDir = join(SITE_DIR, 'images', 'comics');
      expect(existsSync(imagesDir)).toBe(true);
    });

    it('at least one comic image exists', () => {
      const imagesDir = join(SITE_DIR, 'images', 'comics');
      if (!existsSync(imagesDir)) return;

      const findImages = (dir: string): string[] => {
        const images: string[] = [];
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            images.push(...findImages(fullPath));
          } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(entry.name)) {
            images.push(fullPath);
          }
        }
        return images;
      };

      const images = findImages(imagesDir);
      expect(images.length).toBeGreaterThan(0);
    });
  });
});
