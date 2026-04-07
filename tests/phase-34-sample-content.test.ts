/**
 * Phase 34: Sample Content (Fran Hopper) Tests
 *
 * These tests verify that sample content has been added to the repository,
 * starting with the research documentation.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 34.1: Fran Hopper Research Documentation', () => {
  const researchPath = path.join(ROOT, 'docs', 'fran-hopper-research.md');

  it('should have docs/fran-hopper-research.md file', () => {
    expect(fs.existsSync(researchPath), 'Research document should exist').toBe(true);
  });

  describe('research document content', () => {
    // Only run these tests if the file exists
    const fileExists = fs.existsSync(researchPath);

    it.skipIf(!fileExists)('should contain biography section', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toMatch(/##?\s*Biography/i);
    });

    it.skipIf(!fileExists)('should mention birth year (1922)', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('1922');
    });

    it.skipIf(!fileExists)('should mention death year (2017)', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('2017');
    });

    it.skipIf(!fileExists)('should contain notable works section', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toMatch(/##?\s*Notable Works/i);
    });

    it.skipIf(!fileExists)('should mention Gale Allen', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('Gale Allen');
    });

    it.skipIf(!fileExists)('should mention Mysta of the Moon', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('Mysta of the Moon');
    });

    it.skipIf(!fileExists)('should mention Planet Comics', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toContain('Planet Comics');
    });

    it.skipIf(!fileExists)('should contain public domain status section', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toMatch(/##?\s*Public Domain/i);
    });

    it.skipIf(!fileExists)('should contain sources section', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toMatch(/##?\s*Sources/i);
    });

    it.skipIf(!fileExists)('should reference Comic Book Plus or Digital Comic Museum', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      expect(content).toMatch(/Comic Book Plus|Digital Comic Museum|comicbookplus\.com|digitalcomicmuseum\.com/i);
    });

    it.skipIf(!fileExists)('should list available comic issues', () => {
      const content = fs.readFileSync(researchPath, 'utf-8');
      // Should mention specific issue numbers
      expect(content).toMatch(/#\d+|issue\s+\d+/i);
    });
  });
});

describe('Phase 34.2: Comic Images Downloaded', () => {
  const imagesDir = path.join(ROOT, 'src', 'images', 'comics', 'fran-hopper');

  it('should have src/images/comics/fran-hopper/ directory', () => {
    expect(fs.existsSync(imagesDir), 'Fran Hopper images directory should exist').toBe(true);
  });

  describe('image files', () => {
    const dirExists = fs.existsSync(imagesDir);

    it.skipIf(!dirExists)('should have at least 10 image files', () => {
      const getAllImages = (dir: string): string[] => {
        const files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            files.push(...getAllImages(fullPath));
          } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)) {
            files.push(fullPath);
          }
        }
        return files;
      };
      const images = getAllImages(imagesDir);
      expect(images.length, `Expected at least 10 images, found ${images.length}`).toBeGreaterThanOrEqual(10);
    });

    it.skipIf(!dirExists)('should have gale-allen storyline directory', () => {
      const galeAllenDir = path.join(imagesDir, 'gale-allen');
      expect(fs.existsSync(galeAllenDir), 'gale-allen directory should exist').toBe(true);
    });

    it.skipIf(!dirExists)('should have mysta-of-the-moon storyline directory', () => {
      const mystaDir = path.join(imagesDir, 'mysta-of-the-moon');
      expect(fs.existsSync(mystaDir), 'mysta-of-the-moon directory should exist').toBe(true);
    });
  });
});

describe('Phase 34.3: Manifest Populated', () => {
  const manifestPath = path.join(ROOT, 'src', '_data', 'manifest.json');

  it('should have manifest.json file', () => {
    expect(fs.existsSync(manifestPath), 'manifest.json should exist').toBe(true);
  });

  describe('manifest content', () => {
    const fileExists = fs.existsSync(manifestPath);

    it.skipIf(!fileExists)('should have at least 1 comic', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.comics.length, 'Should have at least 1 comic').toBeGreaterThanOrEqual(1);
    });

    it.skipIf(!fileExists)('should have fran-hopper-comics as comic id', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      expect(franHopper, 'Should have fran-hopper-comics comic').toBeDefined();
    });

    it.skipIf(!fileExists)('should have 2 storylines', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      expect(franHopper?.storylines?.length, 'Should have 2 storylines').toBe(2);
    });

    it.skipIf(!fileExists)('should have gale-allen storyline', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      const galeAllen = franHopper?.storylines?.find((s: { id: string }) => s.id === 'gale-allen');
      expect(galeAllen, 'Should have gale-allen storyline').toBeDefined();
    });

    it.skipIf(!fileExists)('should have mysta-of-the-moon storyline', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      const mysta = franHopper?.storylines?.find((s: { id: string }) => s.id === 'mysta-of-the-moon');
      expect(mysta, 'Should have mysta-of-the-moon storyline').toBeDefined();
    });

    it.skipIf(!fileExists)('should have 5 pages per storyline', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      for (const storyline of franHopper?.storylines || []) {
        expect(storyline.pages?.length, `${storyline.id} should have 5 pages`).toBe(5);
      }
    });

    it.skipIf(!fileExists)('each page should have required fields', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const franHopper = manifest.comics.find((c: { id: string }) => c.id === 'fran-hopper-comics');
      for (const storyline of franHopper?.storylines || []) {
        for (const page of storyline.pages || []) {
          expect(page.pageNumber, 'Page should have pageNumber').toBeDefined();
          expect(page.title, 'Page should have title').toBeDefined();
          expect(page.slug, 'Page should have slug').toBeDefined();
          expect(page.image, 'Page should have image').toBeDefined();
          expect(page.alt, 'Page should have alt').toBeDefined();
          expect(page.transcript, 'Page should have transcript').toBeDefined();
        }
      }
    });
  });
});

describe('Phase 34.4: Characters Populated', () => {
  const charactersPath = path.join(ROOT, 'src', '_data', 'characters.json');

  it('should have characters.json file', () => {
    expect(fs.existsSync(charactersPath), 'characters.json should exist').toBe(true);
  });

  describe('characters content', () => {
    const fileExists = fs.existsSync(charactersPath);

    it.skipIf(!fileExists)('should have at least 2 characters', () => {
      const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
      const count = Object.keys(characters).length;
      expect(count, 'Should have at least 2 characters').toBeGreaterThanOrEqual(2);
    });

    it.skipIf(!fileExists)('should have gale-allen character', () => {
      const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
      expect(characters['gale-allen'], 'Should have gale-allen character').toBeDefined();
    });

    it.skipIf(!fileExists)('should have mysta character', () => {
      const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
      expect(characters['mysta'], 'Should have mysta character').toBeDefined();
    });

    it.skipIf(!fileExists)('characters should have required fields', () => {
      const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
      for (const [slug, char] of Object.entries(characters)) {
        const c = char as { slug: string; name: string; comicId: string; bio: string };
        expect(c.slug, `${slug} should have slug`).toBe(slug);
        expect(c.name, `${slug} should have name`).toBeDefined();
        expect(c.comicId, `${slug} should have comicId`).toBe('fran-hopper-comics');
        expect(c.bio, `${slug} should have bio`).toBeDefined();
      }
    });
  });
});

describe('Phase 34.7: About Page Updated', () => {
  const pagesDir = path.join(ROOT, 'src', 'pages');
  const aboutPath = path.join(pagesDir, 'about.njk');
  const oldAboutPath = path.join(pagesDir, 'about-rachel-the-great-nabors.njk');

  it('should have src/pages/about.njk file', () => {
    expect(fs.existsSync(aboutPath), 'about.njk should exist').toBe(true);
  });

  it('should NOT have the old Rachel-specific about page', () => {
    expect(fs.existsSync(oldAboutPath), 'about-rachel-the-great-nabors.njk should NOT exist').toBe(false);
  });

  describe('about page content', () => {
    const fileExists = fs.existsSync(aboutPath);

    it.skipIf(!fileExists)('should have permalink set to /about/', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toMatch(/permalink:\s*\/about\//);
    });

    it.skipIf(!fileExists)('should reference Fran Hopper', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toContain('Fran Hopper');
    });

    it.skipIf(!fileExists)('should mention her birth year (1922)', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toContain('1922');
    });

    it.skipIf(!fileExists)('should mention her death year (2017)', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toContain('2017');
    });

    it.skipIf(!fileExists)('should mention Golden Age or pioneering work', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toMatch(/Golden Age|pioneer/i);
    });

    it.skipIf(!fileExists)('should mention public domain status', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).toMatch(/public domain/i);
    });

    it.skipIf(!fileExists)('should NOT contain Rachel Nabors bio content', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).not.toContain('gURL.com');
      expect(content).not.toContain('jaw surgery');
      expect(content).not.toContain('web designer');
    });

    it.skipIf(!fileExists)('should NOT have Rachel-specific permalink', () => {
      const content = fs.readFileSync(aboutPath, 'utf-8');
      expect(content).not.toContain('about-rachel-the-great-nabors');
    });
  });
});
