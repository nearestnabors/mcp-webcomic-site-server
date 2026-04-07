/**
 * Phase 30: Theme Simplification Tests
 *
 * These tests verify that the theme has been updated from Rachel's pink/magenta
 * theme to a neutral grey/blue theme with system fonts for the public demo repository.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 30.1: tokens.css Grey/Blue Palette', () => {
  const tokensPath = path.join(ROOT, 'shared/tokens.css');

  it('should have tokens.css file', () => {
    expect(fs.existsSync(tokensPath), 'shared/tokens.css should exist').toBe(true);
  });

  it('should have blue primary color (not pink)', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    // Should have blue primary color
    expect(content).toContain('--rtg-color-primary: #2563eb');
  });

  it('should have blue primary-light color', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-primary-light: #3b82f6');
  });

  it('should have blue primary-dark color', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-primary-dark: #1d4ed8');
  });

  it('should have cyan accent color', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-accent: #06b6d4');
  });

  it('should have slate background colors', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    // Slate 800
    expect(content).toContain('--rtg-color-bg-dark: #1e293b');
    // Slate 900
    expect(content).toContain('--rtg-color-bg-darker: #0f172a');
    // Slate 50
    expect(content).toContain('--rtg-color-bg-light: #f8fafc');
  });

  it('should NOT have pink primary color (#cd3baa)', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('#cd3baa');
  });

  it('should NOT have magenta accent color (#fa00bf)', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('#fa00bf');
  });

  it('should NOT have dark purple background (#0f000c)', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('#0f000c');
  });

  it('should use system font stack for body font', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    // Should have system font stack
    expect(content).toContain('-apple-system');
    expect(content).toContain('BlinkMacSystemFont');
    expect(content).toContain('Segoe UI');
    // Should assign to body font variable
    expect(content).toContain('--rtg-font-body:');
    // Body font should be system stack
    expect(content).toMatch(/--rtg-font-body:\s*-apple-system/);
  });

  it('should NOT have Aller font family reference', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('Aller');
    expect(content).not.toContain('AllerRegular');
    expect(content).not.toContain('AllerBold');
  });

  it('should NOT have ChunkFive font family reference', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('ChunkFive');
    expect(content).not.toContain('ChunkFiveRegular');
  });

  it('should have heading font using system font stack', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    // Heading should also use system fonts (var reference or direct)
    expect(content).toContain('--rtg-font-heading:');
  });

  it('should have monospace font variable', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-font-mono:');
    expect(content).toContain('ui-monospace');
  });

  it('should NOT have rachelthegreat.com URLs', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('rachelthegreat.com');
  });

  it('should NOT have external asset URLs', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('url(http');
  });

  it('should have spacing variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-space-xs');
    expect(content).toContain('--rtg-space-sm');
    expect(content).toContain('--rtg-space-md');
    expect(content).toContain('--rtg-space-lg');
    expect(content).toContain('--rtg-space-xl');
  });

  it('should have effect variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-shadow-sm');
    expect(content).toContain('--rtg-shadow-md');
    expect(content).toContain('--rtg-border-radius');
  });

  it('should have text color variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-text-light');
    expect(content).toContain('--rtg-color-text-dark');
    expect(content).toContain('--rtg-color-text-muted');
  });

  it('should have link color variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-link');
    expect(content).toContain('--rtg-color-link-hover');
    expect(content).toContain('--rtg-color-link-visited');
  });

  it('should have status color variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-color-success');
    expect(content).toContain('--rtg-color-warning');
    expect(content).toContain('--rtg-color-error');
  });

  it('should have layout variables', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).toContain('--rtg-content-max-width');
    expect(content).toContain('--rtg-masthead-height');
  });

  it('should NOT have "Rachel the Great" in header comment', () => {
    if (!fs.existsSync(tokensPath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(tokensPath, 'utf-8');
    expect(content).not.toContain('RACHEL THE GREAT');
  });
});

describe('Phase 30.2: components.css Blue Theme', () => {
  const componentsPath = path.join(ROOT, 'shared/components.css');

  it('should have components.css file', () => {
    expect(fs.existsSync(componentsPath), 'shared/components.css should exist').toBe(true);
  });

  it('should NOT reference "pink" in comments', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('pink');
  });

  it('should NOT reference "RACHEL THE GREAT" branding', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).not.toContain('RACHEL THE GREAT');
  });

  it('should have generic header comment', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    // Should have a generic comment header, not Rachel-specific
    expect(content).toContain('SHARED COMPONENTS');
  });

  it('should have .rtg-button class', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button');
  });

  it('should have .rtg-button using var(--rtg-color-primary) for background', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('var(--rtg-color-primary)');
  });

  it('should have .rtg-button--secondary variant', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button--secondary');
  });

  it('should have .rtg-button--secondary using surface color', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button--secondary');
    expect(content).toContain('var(--rtg-color-surface)');
  });

  it('should have hover state using primary-light color', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button:hover');
    expect(content).toContain('var(--rtg-color-primary-light)');
  });

  it('should have active state using primary-dark color', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button:active');
    expect(content).toContain('var(--rtg-color-primary-dark)');
  });

  it('should have disabled state with reduced opacity', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('.rtg-button:disabled');
    expect(content).toContain('opacity');
  });

  it('should use border-radius from tokens', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('var(--rtg-border-radius)');
  });

  it('should use font-family from tokens', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('var(--rtg-font-body)');
  });

  it('should use font-size from tokens', () => {
    if (!fs.existsSync(componentsPath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(componentsPath, 'utf-8');
    expect(content).toContain('var(--rtg-font-size-base)');
  });
});
