/**
 * Phase 33: Tutorial Documentation Tests
 *
 * These tests verify that tutorial documentation has been created in docs/
 * and that it doesn't contain Rachel-specific content.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');

// The required tutorial files according to the implementation plan
const REQUIRED_TUTORIAL_FILES = [
  '00-outline.md',
  '01-what-were-covering.md',
  '02-architecture-overview.md',
  '03-http-vs-stdio.md',
  '04-tools-resources-prompts.md',
  '05-mcp-apps-anatomy.md',
  '06-webmcp-anatomy.md',
  '07-text-vs-data-vs-ui.md',
];

// Rachel-specific content that should NOT appear in the public repo tutorials
const RACHEL_SPECIFIC_PATTERNS = [
  /rachel\s+the\s+great/i,
  /rachel-the-great/i,
  /rachelthegreat\.com/i,
  /rtg-comics/i,
  /rachel\s+nabors/i,
  /\bTuna\b/,  // Character name (word boundary to avoid false positives)
  /Anti-Cupid/i,
  /nearestnabors/i,  // GitHub org
];

// Content that SHOULD appear (generic/sample content)
const EXPECTED_GENERIC_PATTERNS = [
  /sample-comic|fran-hopper|your[- ]comic/i,
  /MCP App/i,
  /WebMCP/i,
  /manifest\.json/i,
];

describe('Phase 33.1: Tutorial Files Created', () => {
  it('should have docs/ directory', () => {
    expect(fs.existsSync(DOCS_DIR), 'docs/ directory should exist').toBe(true);
  });

  for (const filename of REQUIRED_TUTORIAL_FILES) {
    const filePath = path.join(DOCS_DIR, filename);

    describe(`Tutorial file: ${filename}`, () => {
      it('should exist', () => {
        expect(fs.existsSync(filePath), `${filename} should exist in docs/`).toBe(true);
      });

      it('should not be empty', () => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.trim().length, `${filename} should not be empty`).toBeGreaterThan(100);
      });

      it('should have a title (h1 heading)', () => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/^#\s+.+/m);
      });
    });
  }
});

describe('Phase 33.2: No Rachel-Specific Content', () => {
  for (const filename of REQUIRED_TUTORIAL_FILES) {
    const filePath = path.join(DOCS_DIR, filename);

    describe(`${filename} content checks`, () => {
      for (const pattern of RACHEL_SPECIFIC_PATTERNS) {
        it(`should NOT contain Rachel-specific pattern: ${pattern.source}`, () => {
          if (!fs.existsSync(filePath)) return;
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).not.toMatch(pattern);
        });
      }
    });
  }
});

describe('Phase 33.3: Architecture Diagrams Updated', () => {
  const architectureFile = path.join(DOCS_DIR, '02-architecture-overview.md');

  it('should have architecture diagram (ASCII art)', () => {
    if (!fs.existsSync(architectureFile)) return;
    const content = fs.readFileSync(architectureFile, 'utf-8');
    // ASCII diagrams typically use box-drawing characters or dashes
    expect(content).toMatch(/┌|─|└|│|\+--/);
  });

  it('should mention manifest.json as source of truth', () => {
    if (!fs.existsSync(architectureFile)) return;
    const content = fs.readFileSync(architectureFile, 'utf-8');
    expect(content).toMatch(/manifest\.json/i);
  });

  it('should describe three surfaces', () => {
    if (!fs.existsSync(architectureFile)) return;
    const content = fs.readFileSync(architectureFile, 'utf-8');
    expect(content).toMatch(/Static Site|11ty/i);
    expect(content).toMatch(/MCP Server/i);
    expect(content).toMatch(/WebMCP/i);
  });
});

describe('Phase 33.4: Code Examples Use Generic IDs', () => {
  for (const filename of REQUIRED_TUTORIAL_FILES) {
    const filePath = path.join(DOCS_DIR, filename);

    describe(`${filename} code examples`, () => {
      it('should use generic comic_id in examples (not rachel-the-great)', () => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf-8');

        // If the file has any comic_id examples, they should use generic names
        if (content.includes('comic_id')) {
          expect(content).not.toMatch(/comic_id:\s*['"]rachel-the-great['"]/);
          expect(content).not.toMatch(/comic_id:\s*['"]rtg-/);
        }
      });

      it('should use generic character names in examples', () => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for Rachel-specific character names in code examples
        expect(content).not.toMatch(/character.*['"]tuna['"]/i);
        expect(content).not.toMatch(/character.*['"]anti-cupid['"]/i);
      });
    });
  }
});

describe('Phase 33.5: Customization Guidance', () => {
  const filesWithCustomization = [
    '02-architecture-overview.md',
    '05-mcp-apps-anatomy.md',
    '06-webmcp-anatomy.md',
  ];

  for (const filename of filesWithCustomization) {
    const filePath = path.join(DOCS_DIR, filename);

    it(`${filename} should mention customization or adaptation`, () => {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should have some guidance about customizing for your own use
      expect(content).toMatch(/custom|your own|adapt|replace|your comic/i);
    });
  }
});

describe('Phase 33: Additional Content Quality Checks', () => {
  it('should have at least one expected generic pattern in tutorials', () => {
    let foundGeneric = false;
    for (const filename of REQUIRED_TUTORIAL_FILES) {
      const filePath = path.join(DOCS_DIR, filename);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of EXPECTED_GENERIC_PATTERNS) {
        if (pattern.test(content)) {
          foundGeneric = true;
          break;
        }
      }
      if (foundGeneric) break;
    }
    expect(foundGeneric, 'Should have at least one generic pattern (MCP App, WebMCP, etc.)').toBe(true);
  });

  describe('00-outline.md specific checks', () => {
    const outlinePath = path.join(DOCS_DIR, '00-outline.md');

    it('should list all tutorial files', () => {
      if (!fs.existsSync(outlinePath)) return;
      const content = fs.readFileSync(outlinePath, 'utf-8');
      // Should reference the other tutorial files
      expect(content).toMatch(/01-what-were-covering/);
      expect(content).toMatch(/02-architecture-overview/);
      expect(content).toMatch(/03-http-vs-stdio/);
      expect(content).toMatch(/04-tools-resources-prompts/);
      expect(content).toMatch(/05-mcp-apps-anatomy/);
      expect(content).toMatch(/06-webmcp-anatomy/);
      expect(content).toMatch(/07-text-vs-data-vs-ui/);
    });
  });

  describe('05-mcp-apps-anatomy.md specific checks', () => {
    const mcpAppsPath = path.join(DOCS_DIR, '05-mcp-apps-anatomy.md');

    it('should explain the communication protocol', () => {
      if (!fs.existsSync(mcpAppsPath)) return;
      const content = fs.readFileSync(mcpAppsPath, 'utf-8');
      expect(content).toMatch(/ontoolresult|callServerTool|connect/i);
    });

    it('should mention single-file bundling', () => {
      if (!fs.existsSync(mcpAppsPath)) return;
      const content = fs.readFileSync(mcpAppsPath, 'utf-8');
      expect(content).toMatch(/bundle|vite|single[- ]?file/i);
    });
  });

  describe('06-webmcp-anatomy.md specific checks', () => {
    const webmcpPath = path.join(DOCS_DIR, '06-webmcp-anatomy.md');

    it('should explain tool registration', () => {
      if (!fs.existsSync(webmcpPath)) return;
      const content = fs.readFileSync(webmcpPath, 'utf-8');
      expect(content).toMatch(/navigator\.modelContext|registerTool/i);
    });

    it('should explain data embedding pattern', () => {
      if (!fs.existsSync(webmcpPath)) return;
      const content = fs.readFileSync(webmcpPath, 'utf-8');
      expect(content).toMatch(/embed|JSON|page-data/i);
    });
  });

  describe('07-text-vs-data-vs-ui.md specific checks', () => {
    const decisionPath = path.join(DOCS_DIR, '07-text-vs-data-vs-ui.md');

    it('should describe when to use each return type', () => {
      if (!fs.existsSync(decisionPath)) return;
      const content = fs.readFileSync(decisionPath, 'utf-8');
      expect(content).toMatch(/text/i);
      expect(content).toMatch(/structured|JSON/i);
      expect(content).toMatch(/UI|rendered/i);
    });

    it('should have decision framework or examples', () => {
      if (!fs.existsSync(decisionPath)) return;
      const content = fs.readFileSync(decisionPath, 'utf-8');
      expect(content).toMatch(/when|example|decision|framework/i);
    });
  });
});
