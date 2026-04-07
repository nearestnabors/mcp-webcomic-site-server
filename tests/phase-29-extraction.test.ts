/**
 * Phase 29: Framework Extraction Tests
 *
 * These tests verify that framework files are correctly copied
 * from rtg2026 to the mcp-webcomic-site-server public repository.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 29.1: Root Configuration Files', () => {
  it('should have eleventy.config.cjs', () => {
    const filePath = path.join(ROOT, 'eleventy.config.cjs');
    expect(fs.existsSync(filePath), 'eleventy.config.cjs should exist').toBe(true);
  });

  it('eleventy.config.cjs should export a function', () => {
    const filePath = path.join(ROOT, 'eleventy.config.cjs');
    if (!fs.existsSync(filePath)) {
      expect.fail('eleventy.config.cjs does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('module.exports = function');
  });

  it('eleventy.config.cjs should configure src as input directory', () => {
    const filePath = path.join(ROOT, 'eleventy.config.cjs');
    if (!fs.existsSync(filePath)) {
      expect.fail('eleventy.config.cjs does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('input: "src"');
  });

  it('should have package.json', () => {
    const filePath = path.join(ROOT, 'package.json');
    expect(fs.existsSync(filePath), 'package.json should exist').toBe(true);
  });

  it('package.json should have build script for eleventy', () => {
    const filePath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(filePath)) {
      expect.fail('package.json does not exist');
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.scripts).toBeDefined();
    expect(content.scripts.build).toBeDefined();
    expect(content.scripts.build).toContain('eleventy');
  });

  it('package.json should have serve script', () => {
    const filePath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(filePath)) {
      expect.fail('package.json does not exist');
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.scripts.serve).toBeDefined();
    expect(content.scripts.serve).toContain('eleventy');
  });

  it('package.json should have @11ty/eleventy as devDependency', () => {
    const filePath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(filePath)) {
      expect.fail('package.json does not exist');
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.devDependencies).toBeDefined();
    expect(content.devDependencies['@11ty/eleventy']).toBeDefined();
  });

  it('package.json should NOT have parse or parse-blog scripts (content-specific)', () => {
    const filePath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(filePath)) {
      expect.fail('package.json does not exist');
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.scripts.parse).toBeUndefined();
    expect(content.scripts['parse-blog']).toBeUndefined();
  });

  it('should have tsconfig.json', () => {
    const filePath = path.join(ROOT, 'tsconfig.json');
    expect(fs.existsSync(filePath), 'tsconfig.json should exist').toBe(true);
  });

  it('tsconfig.json should have strict mode enabled', () => {
    const filePath = path.join(ROOT, 'tsconfig.json');
    if (!fs.existsSync(filePath)) {
      expect.fail('tsconfig.json does not exist');
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.compilerOptions).toBeDefined();
    expect(content.compilerOptions.strict).toBe(true);
  });

  it('should have vitest.config.ts', () => {
    const filePath = path.join(ROOT, 'vitest.config.ts');
    expect(fs.existsSync(filePath), 'vitest.config.ts should exist').toBe(true);
  });

  it('should have netlify.toml', () => {
    const filePath = path.join(ROOT, 'netlify.toml');
    expect(fs.existsSync(filePath), 'netlify.toml should exist').toBe(true);
  });

  it('netlify.toml should configure _site as publish directory', () => {
    const filePath = path.join(ROOT, 'netlify.toml');
    if (!fs.existsSync(filePath)) {
      expect.fail('netlify.toml does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('publish = "_site"');
  });

  it('netlify.toml should NOT reference rachelthegreat.com', () => {
    const filePath = path.join(ROOT, 'netlify.toml');
    if (!fs.existsSync(filePath)) {
      expect.fail('netlify.toml does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('rachelthegreat.com');
  });
});

describe('Phase 29.2: Template Files', () => {
  describe('_includes directory', () => {
    const includesDir = path.join(ROOT, 'src/_includes');

    it('should have base.njk', () => {
      const filePath = path.join(includesDir, 'base.njk');
      expect(fs.existsSync(filePath), 'base.njk should exist').toBe(true);
    });

    it('base.njk should have proper HTML structure', () => {
      const filePath = path.join(includesDir, 'base.njk');
      if (!fs.existsSync(filePath)) {
        expect.fail('base.njk does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('<head>');
      expect(content).toContain('</head>');
      expect(content).toContain('<body');
      expect(content).toContain('</body>');
      expect(content).toContain('</html>');
    });

    it('should have header.njk', () => {
      const filePath = path.join(includesDir, 'header.njk');
      expect(fs.existsSync(filePath), 'header.njk should exist').toBe(true);
    });

    it('should have footer.njk', () => {
      const filePath = path.join(includesDir, 'footer.njk');
      expect(fs.existsSync(filePath), 'footer.njk should exist').toBe(true);
    });

    it('should have comic-nav.njk', () => {
      const filePath = path.join(includesDir, 'comic-nav.njk');
      expect(fs.existsSync(filePath), 'comic-nav.njk should exist').toBe(true);
    });

    it('should have sidebar-comics.njk', () => {
      const filePath = path.join(includesDir, 'sidebar-comics.njk');
      expect(fs.existsSync(filePath), 'sidebar-comics.njk should exist').toBe(true);
    });

    it('should have comments.njk', () => {
      const filePath = path.join(includesDir, 'comments.njk');
      expect(fs.existsSync(filePath), 'comments.njk should exist').toBe(true);
    });

    it('should have search-form.njk', () => {
      const filePath = path.join(includesDir, 'search-form.njk');
      expect(fs.existsSync(filePath), 'search-form.njk should exist').toBe(true);
    });

    it('should have webmcp-base.njk', () => {
      const filePath = path.join(includesDir, 'webmcp-base.njk');
      expect(fs.existsSync(filePath), 'webmcp-base.njk should exist').toBe(true);
    });

    it('should have webmcp-comic.njk', () => {
      const filePath = path.join(includesDir, 'webmcp-comic.njk');
      expect(fs.existsSync(filePath), 'webmcp-comic.njk should exist').toBe(true);
    });

    it('should NOT have sidebar-blog.njk (blog removed)', () => {
      const filePath = path.join(includesDir, 'sidebar-blog.njk');
      expect(fs.existsSync(filePath), 'sidebar-blog.njk should NOT exist').toBe(false);
    });

    it('should NOT have webmcp-blogpost.njk (blog removed)', () => {
      const filePath = path.join(includesDir, 'webmcp-blogpost.njk');
      expect(fs.existsSync(filePath), 'webmcp-blogpost.njk should NOT exist').toBe(false);
    });
  });

  describe('_layouts directory', () => {
    const layoutsDir = path.join(ROOT, 'src/_layouts');

    it('should have comic-page.njk', () => {
      const filePath = path.join(layoutsDir, 'comic-page.njk');
      expect(fs.existsSync(filePath), 'comic-page.njk should exist').toBe(true);
    });

    it('comic-page.njk should extend base layout', () => {
      const filePath = path.join(layoutsDir, 'comic-page.njk');
      if (!fs.existsSync(filePath)) {
        expect.fail('comic-page.njk does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('{% extends');
    });

    it('should have comic-archive.njk', () => {
      const filePath = path.join(layoutsDir, 'comic-archive.njk');
      expect(fs.existsSync(filePath), 'comic-archive.njk should exist').toBe(true);
    });

    it('should have storyline-index.njk', () => {
      const filePath = path.join(layoutsDir, 'storyline-index.njk');
      expect(fs.existsSync(filePath), 'storyline-index.njk should exist').toBe(true);
    });

    it('should NOT have blog-index.njk (blog removed)', () => {
      const filePath = path.join(layoutsDir, 'blog-index.njk');
      expect(fs.existsSync(filePath), 'blog-index.njk should NOT exist').toBe(false);
    });

    it('should NOT have blog-post.njk (blog removed)', () => {
      const filePath = path.join(layoutsDir, 'blog-post.njk');
      expect(fs.existsSync(filePath), 'blog-post.njk should NOT exist').toBe(false);
    });
  });
});

describe('Phase 29.3: Client-Side JavaScript', () => {
  const jsDir = path.join(ROOT, 'src/js');

  it('should have nav-mobile.js', () => {
    const filePath = path.join(jsDir, 'nav-mobile.js');
    expect(fs.existsSync(filePath), 'nav-mobile.js should exist').toBe(true);
  });

  it('nav-mobile.js should handle mobile navigation toggle', () => {
    const filePath = path.join(jsDir, 'nav-mobile.js');
    if (!fs.existsSync(filePath)) {
      expect.fail('nav-mobile.js does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should handle toggle button click
    expect(content).toContain('nav-toggle');
    // Should update aria attributes
    expect(content).toContain('aria-expanded');
    // Should handle Escape key
    expect(content).toContain('Escape');
  });

  it('should have search.js', () => {
    const filePath = path.join(jsDir, 'search.js');
    expect(fs.existsSync(filePath), 'search.js should exist').toBe(true);
  });

  it('search.js should initialize Pagefind', () => {
    const filePath = path.join(jsDir, 'search.js');
    if (!fs.existsSync(filePath)) {
      expect.fail('search.js does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should reference PagefindUI
    expect(content).toContain('PagefindUI');
    // Should target search element
    expect(content).toContain('#search');
  });

  it('should have transcript-toggle.js', () => {
    const filePath = path.join(jsDir, 'transcript-toggle.js');
    expect(fs.existsSync(filePath), 'transcript-toggle.js should exist').toBe(true);
  });

  it('transcript-toggle.js should handle transcript disclosure', () => {
    const filePath = path.join(jsDir, 'transcript-toggle.js');
    if (!fs.existsSync(filePath)) {
      expect.fail('transcript-toggle.js does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should handle toggle buttons
    expect(content).toContain('transcript-toggle');
    // Should update aria-expanded
    expect(content).toContain('aria-expanded');
    // Should use aria-controls pattern
    expect(content).toContain('aria-controls');
  });

  it('should NOT have any blog-specific JavaScript', () => {
    // If there were blog-specific JS files, they should not exist
    const possibleBlogJs = ['blog.js', 'blog-search.js', 'comments-live.js'];
    possibleBlogJs.forEach(filename => {
      const filePath = path.join(jsDir, filename);
      expect(fs.existsSync(filePath), `${filename} should NOT exist`).toBe(false);
    });
  });
});

describe('Phase 29.4: CSS Files', () => {
  const cssDir = path.join(ROOT, 'src/css');

  it('should have styles-min.css', () => {
    const filePath = path.join(cssDir, 'styles-min.css');
    expect(fs.existsSync(filePath), 'styles-min.css should exist').toBe(true);
  });

  it('styles-min.css should contain CSS reset/normalize', () => {
    const filePath = path.join(cssDir, 'styles-min.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('styles-min.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should have basic CSS selectors
    expect(content).toContain('body');
    expect(content.length).toBeGreaterThan(1000); // Should be substantial
  });

  it('should have archive-grid.css', () => {
    const filePath = path.join(cssDir, 'archive-grid.css');
    expect(fs.existsSync(filePath), 'archive-grid.css should exist').toBe(true);
  });

  it('archive-grid.css should define grid layout', () => {
    const filePath = path.join(cssDir, 'archive-grid.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('archive-grid.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('grid');
  });

  it('should have responsive.css', () => {
    const filePath = path.join(cssDir, 'responsive.css');
    expect(fs.existsSync(filePath), 'responsive.css should exist').toBe(true);
  });

  it('responsive.css should have media queries', () => {
    const filePath = path.join(cssDir, 'responsive.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('responsive.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('@media');
  });

  it('should have nav-mobile.css', () => {
    const filePath = path.join(cssDir, 'nav-mobile.css');
    expect(fs.existsSync(filePath), 'nav-mobile.css should exist').toBe(true);
  });

  it('should have comic-nav-fix.css', () => {
    const filePath = path.join(cssDir, 'comic-nav-fix.css');
    expect(fs.existsSync(filePath), 'comic-nav-fix.css should exist').toBe(true);
  });

  it('should have comic-click-nav.css', () => {
    const filePath = path.join(cssDir, 'comic-click-nav.css');
    expect(fs.existsSync(filePath), 'comic-click-nav.css should exist').toBe(true);
  });

  it('should have print.css', () => {
    const filePath = path.join(cssDir, 'print.css');
    expect(fs.existsSync(filePath), 'print.css should exist').toBe(true);
  });

  it('print.css should have print-friendly styles', () => {
    const filePath = path.join(cssDir, 'print.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('print.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Print stylesheets typically: set white background, hide navigation
    // This file uses white background and hides header/footer/navigation
    expect(content).toContain('background: #fff');
    expect(content).toContain('display: none');
  });
});

describe('Phase 29.5: Shared Design System', () => {
  const sharedDir = path.join(ROOT, 'shared');

  it('should have shared directory', () => {
    expect(fs.existsSync(sharedDir), 'shared/ directory should exist').toBe(true);
  });

  it('should have tokens.css', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    expect(fs.existsSync(filePath), 'shared/tokens.css should exist').toBe(true);
  });

  it('tokens.css should define CSS custom properties', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain(':root');
    expect(content).toContain('--rtg-color-primary');
    expect(content).toContain('--rtg-font-body');
    expect(content).toContain('--rtg-masthead-height');
  });

  it('tokens.css should define color palette', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should have background colors
    expect(content).toContain('--rtg-color-bg-');
    // Should have text colors
    expect(content).toContain('--rtg-color-text-');
    // Should have link colors
    expect(content).toContain('--rtg-color-link');
  });

  it('tokens.css should define typography tokens', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('--rtg-font-heading');
    expect(content).toContain('--rtg-font-system');
  });

  it('tokens.css should define spacing and sizing tokens', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('--rtg-content-max-width');
    expect(content).toContain('--rtg-button-padding');
    expect(content).toContain('--rtg-button-border-radius');
  });

  it('tokens.css should define effect tokens', () => {
    const filePath = path.join(sharedDir, 'tokens.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('tokens.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('--rtg-button-shadow');
    expect(content).toContain('--rtg-text-shadow-button');
  });

  it('should have components.css', () => {
    const filePath = path.join(sharedDir, 'components.css');
    expect(fs.existsSync(filePath), 'shared/components.css should exist').toBe(true);
  });

  it('components.css should define .rtg-button class', () => {
    const filePath = path.join(sharedDir, 'components.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('.rtg-button');
  });

  it('components.css should use design tokens for button', () => {
    const filePath = path.join(sharedDir, 'components.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Button should use token variables (updated per Phase 30.2 spec)
    expect(content).toContain('var(--rtg-color-primary)');
    expect(content).toContain('var(--rtg-font-body)');
    expect(content).toContain('var(--rtg-border-radius)');
  });

  it('components.css should have button states', () => {
    const filePath = path.join(sharedDir, 'components.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('.rtg-button:hover');
    expect(content).toContain('.rtg-button:active');
    expect(content).toContain('.rtg-button:disabled');
  });

  it('components.css should handle button as link', () => {
    const filePath = path.join(sharedDir, 'components.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('a.rtg-button');
    expect(content).toContain('a.rtg-button:visited');
  });

  it('components.css should depend on tokens.css (documented)', () => {
    const filePath = path.join(sharedDir, 'components.css');
    if (!fs.existsSync(filePath)) {
      expect.fail('components.css does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should have a comment indicating dependency on tokens.css
    expect(content).toContain('tokens.css');
  });
});

describe('Phase 29.6: MCP Server', () => {
  describe('mcp-server directory', () => {
    const mcpServerDir = path.join(ROOT, 'mcp-server');

    it('should have mcp-server/src/index.ts', () => {
      const filePath = path.join(mcpServerDir, 'src/index.ts');
      expect(fs.existsSync(filePath), 'mcp-server/src/index.ts should exist').toBe(true);
    });

    it('index.ts should import MCP SDK', () => {
      const filePath = path.join(mcpServerDir, 'src/index.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@modelcontextprotocol/sdk');
    });

    it('index.ts should register tools', () => {
      const filePath = path.join(mcpServerDir, 'src/index.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should reference tool handlers
      expect(content).toContain('list_comics');
      expect(content).toContain('get_page');
    });

    it('should have mcp-server/src/manifest.ts', () => {
      const filePath = path.join(mcpServerDir, 'src/manifest.ts');
      expect(fs.existsSync(filePath), 'mcp-server/src/manifest.ts should exist').toBe(true);
    });

    it('manifest.ts should export manifest loading function', () => {
      const filePath = path.join(mcpServerDir, 'src/manifest.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('manifest.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('manifest');
    });

    it('should have mcp-server/src/app-resource.ts', () => {
      const filePath = path.join(mcpServerDir, 'src/app-resource.ts');
      expect(fs.existsSync(filePath), 'mcp-server/src/app-resource.ts should exist').toBe(true);
    });

    it('should have mcp-server/package.json', () => {
      const filePath = path.join(mcpServerDir, 'package.json');
      expect(fs.existsSync(filePath), 'mcp-server/package.json should exist').toBe(true);
    });

    it('mcp-server package.json should have @modelcontextprotocol/sdk dependency', () => {
      const filePath = path.join(mcpServerDir, 'package.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('package.json does not exist');
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.dependencies || content.devDependencies).toBeDefined();
      const allDeps = { ...content.dependencies, ...content.devDependencies };
      expect(allDeps['@modelcontextprotocol/sdk']).toBeDefined();
    });

    it('should have mcp-server/tsconfig.json', () => {
      const filePath = path.join(mcpServerDir, 'tsconfig.json');
      expect(fs.existsSync(filePath), 'mcp-server/tsconfig.json should exist').toBe(true);
    });
  });

  describe('mcp-server/src/tools directory', () => {
    const toolsDir = path.join(ROOT, 'mcp-server/src/tools');

    it('should have tools directory', () => {
      expect(fs.existsSync(toolsDir), 'mcp-server/src/tools/ should exist').toBe(true);
    });

    it('should have get-page.ts tool', () => {
      const filePath = path.join(toolsDir, 'get-page.ts');
      expect(fs.existsSync(filePath), 'get-page.ts should exist').toBe(true);
    });

    it('get-page.ts should export handler and schema', () => {
      const filePath = path.join(toolsDir, 'get-page.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('get-page.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export');
    });

    it('should have get-transcript.ts tool', () => {
      const filePath = path.join(toolsDir, 'get-transcript.ts');
      expect(fs.existsSync(filePath), 'get-transcript.ts should exist').toBe(true);
    });

    it('should have list-comics.ts tool', () => {
      const filePath = path.join(toolsDir, 'list-comics.ts');
      expect(fs.existsSync(filePath), 'list-comics.ts should exist').toBe(true);
    });

    it('should have list-storylines.ts tool', () => {
      const filePath = path.join(toolsDir, 'list-storylines.ts');
      expect(fs.existsSync(filePath), 'list-storylines.ts should exist').toBe(true);
    });

    it('should have list-characters.ts tool', () => {
      const filePath = path.join(toolsDir, 'list-characters.ts');
      expect(fs.existsSync(filePath), 'list-characters.ts should exist').toBe(true);
    });

    it('should have search-comics.ts tool', () => {
      const filePath = path.join(toolsDir, 'search-comics.ts');
      expect(fs.existsSync(filePath), 'search-comics.ts should exist').toBe(true);
    });

    it('should have search-by-character.ts tool', () => {
      const filePath = path.join(toolsDir, 'search-by-character.ts');
      expect(fs.existsSync(filePath), 'search-by-character.ts should exist').toBe(true);
    });
  });

  describe('mcp-server-stdio directory', () => {
    const mcpStdioDir = path.join(ROOT, 'mcp-server-stdio');

    it('should have mcp-server-stdio/src directory', () => {
      const srcDir = path.join(mcpStdioDir, 'src');
      expect(fs.existsSync(srcDir), 'mcp-server-stdio/src/ should exist').toBe(true);
    });

    it('should have mcp-server-stdio/src/index.ts', () => {
      const filePath = path.join(mcpStdioDir, 'src/index.ts');
      expect(fs.existsSync(filePath), 'mcp-server-stdio/src/index.ts should exist').toBe(true);
    });

    it('should have mcp-server-stdio/src/server.ts', () => {
      const filePath = path.join(mcpStdioDir, 'src/server.ts');
      expect(fs.existsSync(filePath), 'mcp-server-stdio/src/server.ts should exist').toBe(true);
    });

    it('server.ts should import MCP SDK', () => {
      const filePath = path.join(mcpStdioDir, 'src/server.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('server.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@modelcontextprotocol/sdk');
    });

    it('index.ts should use stdio transport', () => {
      const filePath = path.join(mcpStdioDir, 'src/index.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('StdioServerTransport');
    });

    it('should have mcp-server-stdio/package.json', () => {
      const filePath = path.join(mcpStdioDir, 'package.json');
      expect(fs.existsSync(filePath), 'mcp-server-stdio/package.json should exist').toBe(true);
    });

    it('should have mcp-server-stdio/tsconfig.json', () => {
      const filePath = path.join(mcpStdioDir, 'tsconfig.json');
      expect(fs.existsSync(filePath), 'mcp-server-stdio/tsconfig.json should exist').toBe(true);
    });
  });
});

describe('Phase 29.8: Netlify Function', () => {
  const netlifyDir = path.join(ROOT, 'netlify/functions');

  it('should have netlify/functions/mcp.ts', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    expect(fs.existsSync(filePath), 'netlify/functions/mcp.ts should exist').toBe(true);
  });

  it('mcp.ts should import @netlify/functions types', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    if (!fs.existsSync(filePath)) {
      expect.fail('mcp.ts does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('@netlify/functions');
  });

  it('mcp.ts should export a handler function', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    if (!fs.existsSync(filePath)) {
      expect.fail('mcp.ts does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export const handler');
  });

  it('mcp.ts should handle CORS', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    if (!fs.existsSync(filePath)) {
      expect.fail('mcp.ts does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Access-Control-Allow-Origin');
    expect(content).toContain('OPTIONS');
  });

  it('mcp.ts should define JSON-RPC handlers', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    if (!fs.existsSync(filePath)) {
      expect.fail('mcp.ts does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should handle MCP methods
    expect(content).toContain('initialize');
    expect(content).toContain('tools/list');
    expect(content).toContain('tools/call');
  });

  it('mcp.ts should register comic tools', () => {
    const filePath = path.join(netlifyDir, 'mcp.ts');
    if (!fs.existsSync(filePath)) {
      expect.fail('mcp.ts does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('list_comics');
    expect(content).toContain('list_storylines');
    expect(content).toContain('get_page');
    expect(content).toContain('search_comics');
  });

  it('embedded-apps.ts should NOT exist (it is auto-generated)', () => {
    const filePath = path.join(netlifyDir, 'embedded-apps.ts');
    expect(fs.existsSync(filePath), 'embedded-apps.ts should NOT exist').toBe(false);
  });
});

describe('Phase 29.7: MCP Apps', () => {
  describe('mcp-app directory', () => {
    const mcpAppDir = path.join(ROOT, 'mcp-app');

    it('should have mcp-app/index.html', () => {
      const filePath = path.join(mcpAppDir, 'index.html');
      expect(fs.existsSync(filePath), 'mcp-app/index.html should exist').toBe(true);
    });

    it('index.html should have proper HTML structure', () => {
      const filePath = path.join(mcpAppDir, 'index.html');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.html does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('<head>');
      expect(content).toContain('<body>');
    });

    it('index.html should have comic reader structure', () => {
      const filePath = path.join(mcpAppDir, 'index.html');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.html does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should have reader view
      expect(content).toContain('reader-view');
      // Should have comic image element
      expect(content).toContain('comic-image');
      // Should have navigation buttons
      expect(content).toContain('prev-btn');
      expect(content).toContain('next-btn');
    });

    it('index.html should have browser view for comics list', () => {
      const filePath = path.join(mcpAppDir, 'index.html');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.html does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('browser-view');
      expect(content).toContain('comic-list');
      expect(content).toContain('storyline-list');
    });

    it('index.html should have search view', () => {
      const filePath = path.join(mcpAppDir, 'index.html');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.html does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('search-view');
      expect(content).toContain('search-input');
    });

    it('should have mcp-app/styles.css', () => {
      const filePath = path.join(mcpAppDir, 'styles.css');
      expect(fs.existsSync(filePath), 'mcp-app/styles.css should exist').toBe(true);
    });

    it('styles.css should define app layout', () => {
      const filePath = path.join(mcpAppDir, 'styles.css');
      if (!fs.existsSync(filePath)) {
        expect.fail('styles.css does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should have app container
      expect(content).toContain('.app');
      // Should have masthead styling
      expect(content).toContain('.masthead');
      // Should have navigation button styling
      expect(content).toContain('.nav-btn');
    });

    it('should have mcp-app/app.js', () => {
      const filePath = path.join(mcpAppDir, 'app.js');
      expect(fs.existsSync(filePath), 'mcp-app/app.js should exist').toBe(true);
    });

    it('app.js should be substantial application code', () => {
      const filePath = path.join(mcpAppDir, 'app.js');
      if (!fs.existsSync(filePath)) {
        expect.fail('app.js does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should be substantial code (>10KB)
      expect(content.length).toBeGreaterThan(10000);
      // Should handle MCP tool calls
      expect(content).toContain('callServerTool');
    });

    it('should have mcp-app/package.json', () => {
      const filePath = path.join(mcpAppDir, 'package.json');
      expect(fs.existsSync(filePath), 'mcp-app/package.json should exist').toBe(true);
    });

    it('package.json should have @modelcontextprotocol/ext-apps dependency', () => {
      const filePath = path.join(mcpAppDir, 'package.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('package.json does not exist');
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.dependencies).toBeDefined();
      expect(content.dependencies['@modelcontextprotocol/ext-apps']).toBeDefined();
    });

    it('package.json should have vite as devDependency', () => {
      const filePath = path.join(mcpAppDir, 'package.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('package.json does not exist');
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.devDependencies).toBeDefined();
      expect(content.devDependencies['vite']).toBeDefined();
    });

    it('package.json should have build script', () => {
      const filePath = path.join(mcpAppDir, 'package.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('package.json does not exist');
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.scripts).toBeDefined();
      expect(content.scripts.build).toBeDefined();
      expect(content.scripts.build).toContain('vite');
    });

    it('should have mcp-app/vite.config.ts', () => {
      const filePath = path.join(mcpAppDir, 'vite.config.ts');
      expect(fs.existsSync(filePath), 'mcp-app/vite.config.ts should exist').toBe(true);
    });

    it('vite.config.ts should use singlefile plugin', () => {
      const filePath = path.join(mcpAppDir, 'vite.config.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('vite.config.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('singlefile');
    });

    it('should have mcp-app/tsconfig.json', () => {
      const filePath = path.join(mcpAppDir, 'tsconfig.json');
      expect(fs.existsSync(filePath), 'mcp-app/tsconfig.json should exist').toBe(true);
    });

    it('should have mcp-app/src directory', () => {
      const srcDir = path.join(mcpAppDir, 'src');
      expect(fs.existsSync(srcDir), 'mcp-app/src/ should exist').toBe(true);
    });

    it('should have mcp-app/src/mcp-bridge.ts', () => {
      const filePath = path.join(mcpAppDir, 'src/mcp-bridge.ts');
      expect(fs.existsSync(filePath), 'mcp-app/src/mcp-bridge.ts should exist').toBe(true);
    });

    it('mcp-bridge.ts should import MCP apps SDK', () => {
      const filePath = path.join(mcpAppDir, 'src/mcp-bridge.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('mcp-bridge.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@modelcontextprotocol/ext-apps');
    });
  });

  describe('mcp-app-minimal directory', () => {
    const mcpAppMinimalDir = path.join(ROOT, 'mcp-app-minimal');

    it('should have mcp-app-minimal directory', () => {
      expect(fs.existsSync(mcpAppMinimalDir), 'mcp-app-minimal/ should exist').toBe(true);
    });

    it('should have mcp-app-minimal/index.html', () => {
      const filePath = path.join(mcpAppMinimalDir, 'index.html');
      expect(fs.existsSync(filePath), 'mcp-app-minimal/index.html should exist').toBe(true);
    });

    it('index.html should be a minimal test harness', () => {
      const filePath = path.join(mcpAppMinimalDir, 'index.html');
      if (!fs.existsSync(filePath)) {
        expect.fail('index.html does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Should have status indicator for MCP connection
      expect(content).toContain('status');
    });

    it('should have mcp-app-minimal/main.ts', () => {
      const filePath = path.join(mcpAppMinimalDir, 'main.ts');
      expect(fs.existsSync(filePath), 'mcp-app-minimal/main.ts should exist').toBe(true);
    });

    it('main.ts should import MCP apps SDK', () => {
      const filePath = path.join(mcpAppMinimalDir, 'main.ts');
      if (!fs.existsSync(filePath)) {
        expect.fail('main.ts does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('@modelcontextprotocol/ext-apps');
    });

    it('should have mcp-app-minimal/package.json', () => {
      const filePath = path.join(mcpAppMinimalDir, 'package.json');
      expect(fs.existsSync(filePath), 'mcp-app-minimal/package.json should exist').toBe(true);
    });

    it('package.json should have @modelcontextprotocol/ext-apps dependency', () => {
      const filePath = path.join(mcpAppMinimalDir, 'package.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('package.json does not exist');
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.dependencies).toBeDefined();
      expect(content.dependencies['@modelcontextprotocol/ext-apps']).toBeDefined();
    });

    it('should have mcp-app-minimal/vite.config.ts', () => {
      const filePath = path.join(mcpAppMinimalDir, 'vite.config.ts');
      expect(fs.existsSync(filePath), 'mcp-app-minimal/vite.config.ts should exist').toBe(true);
    });

    it('should have mcp-app-minimal/tsconfig.json', () => {
      const filePath = path.join(mcpAppMinimalDir, 'tsconfig.json');
      expect(fs.existsSync(filePath), 'mcp-app-minimal/tsconfig.json should exist').toBe(true);
    });
  });
});

describe('Phase 29.9: Build Scripts', () => {
  const scriptsDir = path.join(ROOT, 'scripts');

  it('should have scripts directory', () => {
    expect(fs.existsSync(scriptsDir), 'scripts/ directory should exist').toBe(true);
  });

  it('should have embed-mcp-apps.js', () => {
    const filePath = path.join(scriptsDir, 'embed-mcp-apps.js');
    expect(fs.existsSync(filePath), 'scripts/embed-mcp-apps.js should exist').toBe(true);
  });

  it('embed-mcp-apps.js should read MCP app HTML files', () => {
    const filePath = path.join(scriptsDir, 'embed-mcp-apps.js');
    if (!fs.existsSync(filePath)) {
      expect.fail('embed-mcp-apps.js does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should read HTML files
    expect(content).toContain('readFileSync');
    // Should handle mcp-app directory
    expect(content).toContain('mcp-app');
  });

  it('embed-mcp-apps.js should write embedded-apps.ts', () => {
    const filePath = path.join(scriptsDir, 'embed-mcp-apps.js');
    if (!fs.existsSync(filePath)) {
      expect.fail('embed-mcp-apps.js does not exist');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should write to embedded-apps.ts
    expect(content).toContain('embedded-apps.ts');
    expect(content).toContain('writeFileSync');
  });

  it('should NOT have parse-site.ts (WordPress-specific)', () => {
    const filePath = path.join(scriptsDir, 'parse-site.ts');
    expect(fs.existsSync(filePath), 'parse-site.ts should NOT exist').toBe(false);
  });

  it('should NOT have parse-blog.ts (blog-specific)', () => {
    const filePath = path.join(scriptsDir, 'parse-blog.ts');
    expect(fs.existsSync(filePath), 'parse-blog.ts should NOT exist').toBe(false);
  });

  it('should NOT have parse-characters.ts (content-specific)', () => {
    const filePath = path.join(scriptsDir, 'parse-characters.ts');
    expect(fs.existsSync(filePath), 'parse-characters.ts should NOT exist').toBe(false);
  });

  it('should NOT have generate-transcripts.ts (content-specific)', () => {
    const filePath = path.join(scriptsDir, 'generate-transcripts.ts');
    expect(fs.existsSync(filePath), 'generate-transcripts.ts should NOT exist').toBe(false);
  });

  it('should NOT have any protection-*.ts scripts', () => {
    // Read directory and check for protection scripts
    if (!fs.existsSync(scriptsDir)) {
      expect.fail('scripts/ directory does not exist');
    }
    const files = fs.readdirSync(scriptsDir);
    const protectionScripts = files.filter(f => f.startsWith('protection-'));
    expect(protectionScripts.length, 'No protection scripts should exist').toBe(0);
  });

  it('should NOT have any extract-*.ts scripts (content-specific)', () => {
    if (!fs.existsSync(scriptsDir)) {
      expect.fail('scripts/ directory does not exist');
    }
    const files = fs.readdirSync(scriptsDir);
    const extractScripts = files.filter(f => f.startsWith('extract-'));
    expect(extractScripts.length, 'No extract scripts should exist').toBe(0);
  });
});

describe('Phase 29.12: Placeholder Data Files', () => {
  const dataDir = path.join(ROOT, 'src/_data');

  it('should have src/_data directory', () => {
    expect(fs.existsSync(dataDir), 'src/_data/ directory should exist').toBe(true);
  });

  describe('manifest.json', () => {
    it('should have manifest.json', () => {
      const filePath = path.join(dataDir, 'manifest.json');
      expect(fs.existsSync(filePath), 'manifest.json should exist').toBe(true);
    });

    it('manifest.json should be valid JSON', () => {
      const filePath = path.join(dataDir, 'manifest.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('manifest.json does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('manifest.json should have generated timestamp', () => {
      const filePath = path.join(dataDir, 'manifest.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('manifest.json does not exist');
      }
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(manifest.generated).toBeDefined();
      expect(typeof manifest.generated).toBe('string');
      // Should be ISO date format
      expect(manifest.generated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('manifest.json should have comics array', () => {
      const filePath = path.join(dataDir, 'manifest.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('manifest.json does not exist');
      }
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(manifest.comics).toBeDefined();
      expect(Array.isArray(manifest.comics)).toBe(true);
    });

    it('manifest.json comics array should exist (populated in Phase 34)', () => {
      const filePath = path.join(dataDir, 'manifest.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('manifest.json does not exist');
      }
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // Phase 29 creates empty placeholder, Phase 34 populates with Fran Hopper content
      expect(Array.isArray(manifest.comics)).toBe(true);
    });
  });

  describe('characters.json', () => {
    it('should have characters.json', () => {
      const filePath = path.join(dataDir, 'characters.json');
      expect(fs.existsSync(filePath), 'characters.json should exist').toBe(true);
    });

    it('characters.json should be valid JSON', () => {
      const filePath = path.join(dataDir, 'characters.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('characters.json does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('characters.json should be a valid object (populated in Phase 34)', () => {
      const filePath = path.join(dataDir, 'characters.json');
      if (!fs.existsSync(filePath)) {
        expect.fail('characters.json does not exist');
      }
      const characters = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // Phase 29 creates empty placeholder, Phase 34 populates with Fran Hopper characters
      expect(typeof characters).toBe('object');
      expect(characters).not.toBeNull();
    });
  });

  describe('characterPages.cjs', () => {
    // Note: Uses .cjs extension because package.json has "type": "module"
    // CommonJS files must use .cjs to avoid ES module errors in 11ty

    it('should have characterPages.cjs', () => {
      const filePath = path.join(dataDir, 'characterPages.cjs');
      expect(fs.existsSync(filePath), 'characterPages.cjs should exist').toBe(true);
    });

    it('characterPages.cjs should require characters.json', () => {
      const filePath = path.join(dataDir, 'characterPages.cjs');
      if (!fs.existsSync(filePath)) {
        expect.fail('characterPages.cjs does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('characters.json');
    });

    it('characterPages.cjs should export array of characters', () => {
      const filePath = path.join(dataDir, 'characterPages.cjs');
      if (!fs.existsSync(filePath)) {
        expect.fail('characterPages.cjs does not exist');
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('module.exports');
      expect(content).toContain('Object.values');
    });
  });

  describe('blog data files should NOT exist', () => {
    it('should NOT have blog.json', () => {
      const filePath = path.join(dataDir, 'blog.json');
      expect(fs.existsSync(filePath), 'blog.json should NOT exist').toBe(false);
    });

    it('should NOT have blogSidebar.js', () => {
      const filePath = path.join(dataDir, 'blogSidebar.js');
      expect(fs.existsSync(filePath), 'blogSidebar.js should NOT exist').toBe(false);
    });
  });
});
