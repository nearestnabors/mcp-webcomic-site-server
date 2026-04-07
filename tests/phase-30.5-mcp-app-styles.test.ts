/**
 * Phase 30.5: MCP App Style Updates Tests
 *
 * These tests verify that the MCP app:
 * 1. Uses CSS-based arrows instead of sprite images for navigation
 * 2. Has no rachelthegreat.com CDN references in any file
 * 3. Uses system fonts (no custom font loading)
 * 4. Has no undefined CSS variable references (--rtg-url-*)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 30.5: MCP App Uses CSS Arrows (Not Sprites)', () => {
  const stylesPath = path.join(ROOT, 'mcp-app/styles.css');

  it('should have mcp-app/styles.css file', () => {
    expect(fs.existsSync(stylesPath)).toBe(true);
  });

  it('should NOT reference --rtg-url-sprite in nav button styles', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // Look for nav-related sections using sprite URLs
    const navSpritePattern = /\.nav-btn[\s\S]*?--rtg-url-sprite/;
    expect(navSpritePattern.test(content)).toBe(false);
  });

  it('should NOT reference var(--rtg-url-sprite) anywhere', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content).not.toContain('var(--rtg-url-sprite)');
  });

  it('should NOT reference var(--rtg-url-bg-ice) anywhere', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content).not.toContain('var(--rtg-url-bg-ice)');
  });

  it('should NOT reference var(--rtg-url-bg-masthead) anywhere', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content).not.toContain('var(--rtg-url-bg-masthead)');
  });

  it('should have CSS-based nav arrows (borders or Unicode)', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // Check for CSS triangle pattern (border-based arrows) or Unicode arrows
    const hasCSSArrows =
      content.includes('border-left') ||
      content.includes('border-right') ||
      content.includes('border-top') ||
      content.includes('border-bottom') ||
      content.includes('▶') ||
      content.includes('◀') ||
      content.includes('→') ||
      content.includes('←') ||
      content.includes('::before') ||
      content.includes('::after');

    expect(hasCSSArrows, 'Should use CSS-based arrows for navigation').toBe(true);
  });

  it('should have .nav-btn with basic button styling (no sprite)', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // The nav-btn should exist and have basic styles, but not reference sprites
    expect(content).toContain('.nav-btn');
    // Make sure there's no "background: var(--rtg-url-sprite)" in nav-btn context
    const navBtnSection = content.match(/\.nav-btn\s*\{[^}]+\}/)?.[0] || '';
    expect(navBtnSection).not.toContain('--rtg-url-sprite');
  });
});

describe('Phase 30.5: MCP App Logo Replacement', () => {
  const indexPath = path.join(ROOT, 'mcp-app/index.html');
  const stylesPath = path.join(ROOT, 'mcp-app/styles.css');

  it('should have mcp-app/index.html file', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('should NOT have logo linking to rachelthegreat.com', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).not.toContain('href="https://rachelthegreat.com"');
  });

  it('should have generic logo or text-based logo', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    // Should either have a generic title/text or CSS-based logo
    const hasGenericLogo =
      content.includes('Demo Comics') ||
      content.includes('Webcomic Reader') ||
      content.includes('class="logo"') ||
      content.includes('Comic Archive');
    expect(hasGenericLogo, 'Should have a generic logo/title').toBe(true);
  });

  it('should NOT use sprite background for logo in CSS', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // Look for logo section using sprite URL
    const logoMatch = content.match(/\.masthead\s+\.logo[\s\S]*?\{[^}]+\}/);
    if (logoMatch) {
      expect(logoMatch[0]).not.toContain('--rtg-url-sprite');
    }
    // Also check the span inside logo
    const logoSpanMatch = content.match(/\.masthead\s+\.logo\s+span[\s\S]*?\{[^}]+\}/);
    if (logoSpanMatch) {
      expect(logoSpanMatch[0]).not.toContain('--rtg-url-sprite');
    }
  });
});

describe('Phase 30.5: MCP App System Fonts (No Custom Fonts)', () => {
  const fontsPath = path.join(ROOT, 'mcp-app/fonts.css');
  const stylesPath = path.join(ROOT, 'mcp-app/styles.css');

  it('should NOT have fonts.css file (or it should be empty/minimal)', () => {
    // fonts.css should either not exist or not have rachelthegreat.com URLs
    if (fs.existsSync(fontsPath)) {
      const content = fs.readFileSync(fontsPath, 'utf-8');
      expect(content).not.toContain('rachelthegreat.com');
      // Check for actual @font-face rules (not just mentions in comments)
      // Real @font-face rules start with @font-face { or @font-face{
      const hasFontFaceRule = /@font-face\s*\{/.test(content);
      expect(hasFontFaceRule, 'Should not have @font-face rules').toBe(false);
    }
    // If it doesn't exist, that's also fine
    expect(true).toBe(true);
  });

  it('should NOT import fonts.css in styles.css', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content).not.toContain("@import './fonts.css'");
    expect(content).not.toContain('@import "./fonts.css"');
    expect(content).not.toContain("@import 'fonts.css'");
  });

  it('should use system font variables', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // Should reference the system font variable from tokens.css
    const hasSystemFontRef =
      content.includes('var(--rtg-font-body)') ||
      content.includes('var(--rtg-font-heading)') ||
      content.includes('-apple-system') ||
      content.includes('BlinkMacSystemFont');
    expect(hasSystemFontRef, 'Should use system font variables').toBe(true);
  });

  it('should NOT reference custom font families like Aller or ChunkFive', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('allerbold');
    expect(content.toLowerCase()).not.toContain('allerregular');
    expect(content.toLowerCase()).not.toContain('chunkfive');
    expect(content).not.toContain('var(--rtg-font-body-bold)');
    expect(content).not.toContain('var(--rtg-font-body-italic)');
  });
});

describe('Phase 30.5: MCP App app.js No External References', () => {
  const appJsPath = path.join(ROOT, 'mcp-app/app.js');

  it('should have mcp-app/app.js file', () => {
    expect(fs.existsSync(appJsPath)).toBe(true);
  });

  it('should NOT have hardcoded rachelthegreat.com URL', () => {
    const content = fs.readFileSync(appJsPath, 'utf-8');
    expect(content).not.toContain('rachelthegreat.com');
  });

  it('should NOT have logo click handler opening rachelthegreat.com', () => {
    const content = fs.readFileSync(appJsPath, 'utf-8');
    // Look for openExternalUrl('https://rachelthegreat.com')
    expect(content).not.toContain("openExternalUrl('https://rachelthegreat.com')");
    expect(content).not.toContain('openExternalUrl("https://rachelthegreat.com")');
  });
});

describe('Phase 30.5: MCP App Masthead Background', () => {
  const stylesPath = path.join(ROOT, 'mcp-app/styles.css');

  it('should have masthead with solid color background (not pattern)', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    const mastheadMatch = content.match(/\.masthead\s*\{[^}]+\}/);
    expect(mastheadMatch).toBeTruthy();

    if (mastheadMatch) {
      const mastheadStyles = mastheadMatch[0];
      // Should not reference background patterns/URLs
      expect(mastheadStyles).not.toContain('--rtg-url-bg-masthead');
      // Should have a solid color background
      expect(
        mastheadStyles.includes('background:') ||
          mastheadStyles.includes('background-color:')
      ).toBe(true);
    }
  });

  it('should have body with solid color background (not ice pattern)', () => {
    const content = fs.readFileSync(stylesPath, 'utf-8');
    // The body should use solid background color from tokens
    expect(content).not.toContain('var(--rtg-url-bg-ice)');
    // Check that body/html have background
    const bodyMatch = content.match(/html,\s*body\s*\{[^}]+\}/);
    expect(bodyMatch).toBeTruthy();
    if (bodyMatch) {
      expect(bodyMatch[0]).not.toContain('--rtg-url-');
    }
  });
});
