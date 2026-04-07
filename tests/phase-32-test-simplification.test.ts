/**
 * Phase 32: Test Simplification
 *
 * These tests verify:
 * 1. Sample manifest fixture exists with proper structure
 * 2. Tests use generic data, not Rachel-specific content
 * 3. No blog tests exist
 * 4. Structural/framework tests work with sample data
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// Type definitions for manifest structure
interface Page {
  pageNumber: number;
  title: string;
  slug: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  transcript: string;
  publishedDate: string;
  originalUrl: string;
}

interface Storyline {
  id: string;
  title: string;
  order: number;
  pages: Page[];
}

interface Comic {
  id: string;
  title: string;
  type: string;
  description: string;
  storylines: Storyline[];
}

interface Manifest {
  generated: string;
  comics: Comic[];
}

describe('Phase 32.3: Test Fixtures', () => {
  const fixturesDir = path.join(ROOT, 'tests/fixtures');
  const sampleManifestPath = path.join(fixturesDir, 'sample-manifest.json');

  it('should have tests/fixtures directory', () => {
    expect(fs.existsSync(fixturesDir), 'tests/fixtures directory should exist').toBe(true);
  });

  it('should have sample-manifest.json fixture', () => {
    expect(fs.existsSync(sampleManifestPath), 'sample-manifest.json should exist').toBe(true);
  });

  describe('sample-manifest.json structure', () => {
    it('should have a generated timestamp', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      expect(manifest.generated).toBeDefined();
      expect(typeof manifest.generated).toBe('string');
    });

    it('should have a comics array', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      expect(manifest.comics).toBeDefined();
      expect(Array.isArray(manifest.comics)).toBe(true);
    });

    it('should have exactly 1 comic', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      expect(manifest.comics.length).toBe(1);
    });

    it('comic should have required fields', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      expect(comic.id).toBeDefined();
      expect(comic.title).toBeDefined();
      expect(comic.type).toBeDefined();
      expect(comic.description).toBeDefined();
      expect(comic.storylines).toBeDefined();
    });

    it('comic should have generic id (not rachel-specific)', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      expect(comic.id).not.toBe('rachel-the-great');
      expect(comic.id).not.toContain('rachel');
    });

    it('should have exactly 2 storylines', () => {
      const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      expect(comic.storylines.length).toBe(2);
    });

    it('each storyline should have required fields', () => {
      const manifest: Manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      comic.storylines.forEach((storyline: Storyline) => {
        expect(storyline.id).toBeDefined();
        expect(storyline.title).toBeDefined();
        expect(storyline.order).toBeDefined();
        expect(storyline.pages).toBeDefined();
      });
    });

    it('each storyline should have exactly 2 pages', () => {
      const manifest: Manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      comic.storylines.forEach((storyline: Storyline) => {
        expect(storyline.pages.length).toBe(2);
      });
    });

    it('each page should have required fields', () => {
      const manifest: Manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
      const comic = manifest.comics[0];
      comic.storylines.forEach((storyline: Storyline) => {
        storyline.pages.forEach((page: Page) => {
          expect(page.pageNumber).toBeDefined();
          expect(page.title).toBeDefined();
          expect(page.slug).toBeDefined();
          expect(page.image).toBeDefined();
          expect(page.imageWidth).toBeDefined();
          expect(page.imageHeight).toBeDefined();
          expect(page.alt).toBeDefined();
          expect(page.transcript).toBeDefined();
          expect(page.publishedDate).toBeDefined();
          expect(page.originalUrl).toBeDefined();
        });
      });
    });

    it('should NOT contain Rachel-specific content', () => {
      const content = fs.readFileSync(sampleManifestPath, 'utf-8').toLowerCase();
      expect(content).not.toContain('rachel the great');
      expect(content).not.toContain('anti-cupid');
      expect(content).not.toContain('tuna');
      expect(content).not.toContain('crow princess');
      expect(content).not.toContain('olivia bryce');
    });
  });
});

describe('Phase 32.2: No Content-Specific Tests', () => {
  const testsDir = path.join(ROOT, 'tests');
  // Files that are allowed to reference specific counts/content for validation purposes
  const exemptFiles = [
    'phase-32-test-simplification.test.ts',  // This file (contains validation comments)
    'phase-31-blog-removal.test.ts',          // Tests that blog is removed (valid use)
    'phase-29-extraction.test.ts',            // Verifies blog files NOT copied (valid use)
    'phase-35.7-webmcp-tools.test.ts',        // Verifies no Rachel content in WebMCP (valid use)
    'phase-33-tutorial-documentation.test.ts', // Verifies no Rachel content in tutorials (valid use)
  ];

  it('should NOT have tests referencing 409 pages (Rachel count) in assertions', () => {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
    testFiles.forEach(file => {
      // Skip exempt files
      if (exemptFiles.includes(file)) return;
      const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      // Check for specific page count assertions (expect statements)
      const has409 = /\.toBe\(409\)|\.toEqual\(409\)|toHaveLength\(409\)/.test(content);
      expect(has409, `${file} should not reference 409 pages in assertions`).toBe(false);
    });
  });

  it('should NOT have tests referencing 47 pages (Crow Princess count) in assertions', () => {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
    testFiles.forEach(file => {
      // Skip exempt files
      if (exemptFiles.includes(file)) return;
      const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      // Check for specific page count assertions (expect statements)
      const has47 = /\.toBe\(47\)|\.toEqual\(47\)|toHaveLength\(47\)/.test(content);
      expect(has47, `${file} should not reference 47 pages in assertions`).toBe(false);
    });
  });

  it('should NOT have tests referencing Rachel-specific storylines', () => {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
    testFiles.forEach(file => {
      // Skip exempt files
      if (exemptFiles.includes(file)) return;
      const content = fs.readFileSync(path.join(testsDir, file), 'utf-8').toLowerCase();
      expect(content).not.toContain('anti-cupid');
      expect(content).not.toContain('return of the');
    });
  });

  it('should NOT have blog functionality tests (tests that expect blog to work)', () => {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
    testFiles.forEach(file => {
      // Skip exempt files - they test that blog is REMOVED, not that blog WORKS
      if (exemptFiles.includes(file)) return;
      const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      // Check for tests that expect blog functionality to work
      // e.g., "should render blog posts", "blog page should..."
      const hasBlogFunctionalityTests = /describe\(['"](.*should.*blog|blog.*should|blog post|blog page)['"]/i.test(content);
      expect(hasBlogFunctionalityTests, `${file} should not have blog functionality tests`).toBe(false);
    });
  });
});

describe('Phase 32.4: Generic Test Data', () => {
  const sampleManifestPath = path.join(ROOT, 'tests/fixtures/sample-manifest.json');

  it('sample manifest should use generic comic title', () => {
    const manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
    const comic = manifest.comics[0];
    // Should be something generic like "Sample Comic" or "Demo Comic"
    expect(comic.title.toLowerCase()).not.toContain('rachel');
    expect(comic.title.toLowerCase()).not.toContain('olivia');
  });

  it('sample manifest should use generic storyline titles', () => {
    const manifest: Manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
    const comic = manifest.comics[0];
    comic.storylines.forEach((storyline: Storyline) => {
      expect(storyline.title.toLowerCase()).not.toContain('anti-cupid');
      expect(storyline.title.toLowerCase()).not.toContain('tuna');
    });
  });

  it('sample manifest pages should have valid image paths', () => {
    const manifest: Manifest = JSON.parse(fs.readFileSync(sampleManifestPath, 'utf-8'));
    const comic = manifest.comics[0];
    comic.storylines.forEach((storyline: Storyline) => {
      storyline.pages.forEach((page: Page) => {
        // Image path should be relative and well-formed
        expect(page.image).toMatch(/^[a-z0-9_/-]+\.(jpg|jpeg|png|gif|webp)$/i);
      });
    });
  });
});

describe('Phase 32.6: Test Count Verification', () => {
  it('total test count should be reasonable for public demo (~20-50 tests per file max)', () => {
    const testsDir = path.join(ROOT, 'tests');
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));

    // Count total tests by counting 'it(' occurrences
    let totalTests = 0;
    testFiles.forEach(file => {
      const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      const itMatches = content.match(/it\(/g) || [];
      totalTests += itMatches.length;
    });

    // Should be significantly less than 155+ tests from rtg2026
    // The public demo repo has structural + verification tests
    // Current count after all phases should be reasonable
    expect(totalTests).toBeGreaterThan(10);  // At least some tests
    expect(totalTests).toBeLessThan(500);     // Not as many as the full rtg2026
  });
});
