import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..');

describe('Phase 35: Final Polish & README', () => {
  describe('35.1 Comprehensive README', () => {
    const readmePath = join(ROOT_DIR, 'README.md');

    it('README.md file exists', () => {
      expect(existsSync(readmePath)).toBe(true);
    });

    it('has Quick Start section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/##\s*Quick Start/i);
    });

    it('has Prerequisites section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/Prerequisites/i);
      expect(content).toMatch(/Node\.js/i);
    });

    it('has Installation instructions', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/Installation/i);
      expect(content).toMatch(/npm install/i);
    });

    it('has Development section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/Development/i);
      expect(content).toMatch(/npm run build/i);
      expect(content).toMatch(/npm run serve/i);
      expect(content).toMatch(/npm test/i);
    });

    it('has Adding Your Own Comics section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/Adding Your Own Comics/i);
      expect(content).toMatch(/manifest\.json/i);
      expect(content).toMatch(/characters\.json/i);
    });

    it('has Architecture section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/##\s*Architecture/i);
    });

    it('has MCP Integration section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/MCP Integration/i);
    });

    it('documents available MCP tools', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/list_comics/);
      expect(content).toMatch(/list_storylines/);
      expect(content).toMatch(/get_page/);
      expect(content).toMatch(/search_comics/);
      expect(content).toMatch(/get_transcript/);
      expect(content).toMatch(/list_characters/);
    });

    it('has Sample Content section mentioning Fran Hopper', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/Sample Content/i);
      expect(content).toMatch(/Fran Hopper/i);
    });

    it('has License section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/##\s*License/i);
      expect(content).toMatch(/MIT/i);
    });

    it('has Credits section', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toMatch(/##\s*Credits/i);
    });

    it('does not reference Rachel the Great (wrong project)', () => {
      const content = readFileSync(readmePath, 'utf-8');
      expect(content).not.toMatch(/Rachel the Great/i);
    });
  });

  describe('35.2 Package.json metadata', () => {
    const packagePath = join(ROOT_DIR, 'package.json');

    it('name is mcp-webcomic-site-server', () => {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.name).toBe('mcp-webcomic-site-server');
    });

    it('license is MIT', () => {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.license).toBe('MIT');
    });

    it('author is Rachel Nabors', () => {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.author).toBe('Rachel Nabors');
    });

    it('has repository URL pointing to nearestnabors', () => {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.repository).toBeDefined();
      expect(pkg.repository.url).toMatch(/nearestnabors/);
      expect(pkg.repository.url).toMatch(/mcp-webcomic-site-server/);
    });

    it('has keywords for discoverability', () => {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.keywords).toBeDefined();
      expect(pkg.keywords).toContain('mcp');
      expect(pkg.keywords).toContain('webcomic');
    });
  });

  describe('35.3 CONTRIBUTING.md', () => {
    const contributingPath = join(ROOT_DIR, 'CONTRIBUTING.md');

    it('CONTRIBUTING.md file exists', () => {
      expect(existsSync(contributingPath)).toBe(true);
    });

    it('has contribution guidelines', () => {
      const content = readFileSync(contributingPath, 'utf-8');
      expect(content).toMatch(/Contributing/i);
      expect(content).toMatch(/pull request/i);
    });

    it('mentions code of conduct or respect', () => {
      const content = readFileSync(contributingPath, 'utf-8');
      expect(content).toMatch(/respect|code of conduct|welcoming/i);
    });
  });
});
