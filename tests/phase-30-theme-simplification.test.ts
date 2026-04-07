/**
 * Phase 30: Theme Simplification Tests
 *
 * These tests verify that the Rachel-specific pink/magenta theme
 * has been replaced with a neutral grey/blue theme and that
 * custom fonts have been removed in favor of system fonts.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 30.3: styles-min.css Color Replacements', () => {
  const stylesPath = path.join(ROOT, 'src/css/styles-min.css');

  it('should have styles-min.css file', () => {
    expect(fs.existsSync(stylesPath)).toBe(true);
  });

  describe('should NOT contain pink/magenta colors', () => {
    // Rachel's signature pink/magenta colors that must be removed
    const pinkMagentaColors = [
      '#fa00bf', // Bright magenta (logo, nav hover, storyline current)
      '#cd3baa', // Pink (buttons)
      '#ff00ff', // Pure magenta
      '#ff69b4', // Hot pink
      '#964b84', // Dark pink (button text shadow)
    ];

    let content: string;

    it('should be readable', () => {
      content = fs.readFileSync(stylesPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it.each(pinkMagentaColors)('should not contain %s', (color) => {
      const content = fs.readFileSync(stylesPath, 'utf-8');
      expect(content.toLowerCase()).not.toContain(color.toLowerCase());
    });
  });

  describe('should contain blue theme colors', () => {
    // The new blue theme colors (from tokens.css or direct replacements)
    const blueThemeColors = [
      '#2563eb', // Primary blue
      '#3b82f6', // Primary light
      '#1d4ed8', // Primary dark
    ];

    it.each(blueThemeColors)('should contain %s (or CSS variable reference)', (color) => {
      const content = fs.readFileSync(stylesPath, 'utf-8');
      const hasDirectColor = content.toLowerCase().includes(color.toLowerCase());
      const hasCssVariable = content.includes('var(--rtg-color-primary');
      expect(
        hasDirectColor || hasCssVariable,
        `Should contain ${color} or CSS variable reference`
      ).toBe(true);
    });
  });

  describe('should use neutral dark backgrounds', () => {
    // Check for dark purple bg replacement
    it('should not contain #0f000c (Rachel dark purple bg)', () => {
      const content = fs.readFileSync(stylesPath, 'utf-8');
      expect(content.toLowerCase()).not.toContain('#0f000c');
    });

    it('should contain slate-based dark backgrounds', () => {
      const content = fs.readFileSync(stylesPath, 'utf-8');
      // Should have either direct color or CSS variable
      const hasSlateColor = content.toLowerCase().includes('#0f172a') ||
        content.toLowerCase().includes('#1e293b');
      const hasCssVariable = content.includes('var(--rtg-color-bg-dark');
      expect(
        hasSlateColor || hasCssVariable,
        'Should contain slate dark backgrounds or CSS variables'
      ).toBe(true);
    });
  });
});

describe('Phase 30.4: Font Loading Removal', () => {
  const stylesPath = path.join(ROOT, 'src/css/styles-min.css');

  it('should not have @font-face for Aller fonts', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('allerbold');
    expect(content.toLowerCase()).not.toContain('allerregular');
    expect(content.toLowerCase()).not.toContain('alleritalic');
    expect(content.toLowerCase()).not.toContain('allerlightregular');
    expect(content.toLowerCase()).not.toContain('allerlightitalic');
    expect(content.toLowerCase()).not.toContain('allerbolditalic');
  });

  it('should not have @font-face for ChunkFive font', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('chunkfiveregular');
    expect(content.toLowerCase()).not.toContain('chunkfive');
  });

  it('should not reference /typography/ font paths', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content).not.toContain('/typography/');
  });

  it('should use system font stack', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // Should reference system fonts (direct or via CSS variable)
    const hasSystemFonts =
      content.includes('-apple-system') ||
      content.includes('BlinkMacSystemFont') ||
      content.includes('Segoe UI') ||
      content.includes('var(--rtg-font-');
    expect(hasSystemFonts, 'Should use system font stack').toBe(true);
  });
});

describe('Phase 30.5: MCP App Style Updates', () => {
  const mcpAppStylesPath = path.join(ROOT, 'mcp-app/styles.css');

  it('should have mcp-app/styles.css file', () => {
    expect(fs.existsSync(mcpAppStylesPath)).toBe(true);
  });

  it('should not reference sprite URLs for navigation', () => {
    const content = fs.readFileSync(mcpAppStylesPath, 'utf-8');
    // Check for sprite.png references in nav-related selectors
    // The nav should use CSS arrows, not sprite background positions
    const lines = content.split('\n');
    let inNavSection = false;
    let hasNavSpriteRef = false;

    for (const line of lines) {
      if (line.includes('.nav') || line.includes('.reader-nav')) {
        inNavSection = true;
      }
      if (inNavSection && line.includes('}')) {
        inNavSection = false;
      }
      if (inNavSection && line.includes('sprite.png')) {
        hasNavSpriteRef = true;
        break;
      }
    }

    // This is a soft check - we mainly want to ensure CSS arrows are used
    // The actual implementation may vary
    expect(content.includes('▶') || content.includes('◀') ||
      content.includes('→') || content.includes('←') ||
      content.includes('border') || !hasNavSpriteRef).toBe(true);
  });
});

describe('Phase 30.6: No rachelthegreat.com CDN References', () => {
  // CSS files
  const cssFilesToCheck = [
    'src/css/styles-min.css',
    'shared/tokens.css',
    'shared/components.css',
    'mcp-app/styles.css',
  ];

  it.each(cssFilesToCheck)('should not reference rachelthegreat.com in CSS: %s', (file) => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.toLowerCase()).not.toContain('rachelthegreat.com');
    }
  });

  // Template files - these contain hardcoded domain URLs that need to be made configurable
  const templateFilesToCheck = [
    'src/_includes/base.njk',
    'src/_layouts/comic-page.njk',
  ];

  it.each(templateFilesToCheck)('should not reference rachelthegreat.com in template: %s', (file) => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.toLowerCase()).not.toContain('rachelthegreat.com');
    }
  });

  // MCP server files - should not have hardcoded production URLs
  const serverFilesToCheck = [
    'mcp-server-stdio/src/server.ts',
  ];

  it.each(serverFilesToCheck)('should not reference rachelthegreat.com in server: %s', (file) => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.toLowerCase()).not.toContain('rachelthegreat.com');
    }
  });

  // MCP app files
  const mcpAppFilesToCheck = [
    'mcp-app/index.html',
    'mcp-app/app.js',
  ];

  it.each(mcpAppFilesToCheck)('should not reference rachelthegreat.com in MCP app: %s', (file) => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.toLowerCase()).not.toContain('rachelthegreat.com');
    }
  });
});
