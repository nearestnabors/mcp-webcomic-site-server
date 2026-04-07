/**
 * Phase 34.6 - Verify Site Builds Without ES Module Errors
 *
 * PRD: 34.T6
 * Task: Fix characterPages.cjs ES module error blocking build
 *
 * This test verifies:
 * - characterPages data file uses correct .cjs extension (CommonJS)
 * - Site builds without ES module errors
 * - Sample manifest data is accessible
 *
 * Note: Full comic page generation requires src/index.njk, src/comics/
 * templates which are tracked separately. This test focuses on the
 * ES module fix that was blocking all builds.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Phase 34.6: Site Builds Without ES Module Errors', () => {
  describe('characterPages data file', () => {
    it('should use .cjs extension for CommonJS module', () => {
      // The file should be .cjs, not .js, since package.json has "type": "module"
      const cjsPath = path.join(PROJECT_ROOT, 'src/_data/characterPages.cjs');

      expect(fs.existsSync(cjsPath), 'characterPages.cjs should exist').toBe(true);
    });

    it('should NOT have .js version (prevents ES module errors)', () => {
      const jsPath = path.join(PROJECT_ROOT, 'src/_data/characterPages.js');

      // The .js file should not exist or should be a stub
      if (fs.existsSync(jsPath)) {
        const content = fs.readFileSync(jsPath, 'utf-8');
        // If .js exists, it should be an ES module stub, not CommonJS
        expect(content).not.toContain("require('./characters.json')");
      }
    });

    it('should export character data from characters.json', () => {
      const filePath = path.join(PROJECT_ROOT, 'src/_data/characterPages.cjs');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Should require characters.json
      expect(content).toContain("require('./characters.json')");
      // Should export Object.values
      expect(content).toContain('Object.values(characters)');
    });
  });

  describe('site build', () => {
    it('should build without ES module errors', () => {
      // This test runs the actual build to verify ES module issue is fixed
      let buildOutput: string;
      let buildExitedWithError = false;

      try {
        buildOutput = execSync('npm run build 2>&1', {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          timeout: 60000
        });
      } catch (error: unknown) {
        buildExitedWithError = true;
        if (error && typeof error === 'object' && 'stdout' in error) {
          buildOutput = (error as { stdout: string }).stdout;
        } else {
          throw error;
        }
      }

      // Should not have ES module errors
      expect(buildOutput).not.toContain('require is not defined in ES module scope');
      expect(buildOutput).not.toContain('EleventyImportError');

      // Build should complete (may write few files if templates missing)
      expect(buildExitedWithError).toBe(false);
    });

    it('should create _site directory', () => {
      const sitePath = path.join(PROJECT_ROOT, '_site');
      expect(fs.existsSync(sitePath), '_site directory should exist after build').toBe(true);
    });

    it('should generate about page (proof of working build)', () => {
      // about.njk exists in src/pages/, so it should be built
      const aboutPath = path.join(PROJECT_ROOT, '_site/about/index.html');
      expect(fs.existsSync(aboutPath), 'about/index.html should exist').toBe(true);
    });
  });

  describe('manifest data', () => {
    it('should have valid manifest.json with comics', () => {
      const manifestPath = path.join(PROJECT_ROOT, 'src/_data/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      expect(manifest.comics).toBeDefined();
      expect(Array.isArray(manifest.comics)).toBe(true);
      expect(manifest.comics.length).toBeGreaterThan(0);
    });

    it('should have valid characters.json', () => {
      const charactersPath = path.join(PROJECT_ROOT, 'src/_data/characters.json');
      const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));

      expect(typeof characters).toBe('object');
      // Should have at least one character
      expect(Object.keys(characters).length).toBeGreaterThan(0);
    });
  });
});
