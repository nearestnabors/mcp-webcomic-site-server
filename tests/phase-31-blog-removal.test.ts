/**
 * Phase 31: Blog Removal Tests
 *
 * Verifies that all blog functionality has been removed from the public demo repo.
 * The public repo is comics-only - no blog templates, navigation, or data files.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

describe('Phase 31: Blog Removal', () => {
  describe('31.1 Blog templates should not exist', () => {
    it('should NOT have a src/blog/ directory', () => {
      const blogDir = path.join(SRC_DIR, 'blog');
      expect(fs.existsSync(blogDir)).toBe(false);
    });

    it('should NOT have src/feed.njk', () => {
      const feedPath = path.join(SRC_DIR, 'feed.njk');
      expect(fs.existsSync(feedPath)).toBe(false);
    });

    it('should NOT have src/_includes/sidebar-blog.njk', () => {
      const sidebarBlogPath = path.join(SRC_DIR, '_includes', 'sidebar-blog.njk');
      expect(fs.existsSync(sidebarBlogPath)).toBe(false);
    });

    it('should NOT have src/_layouts/blog-index.njk', () => {
      const blogIndexPath = path.join(SRC_DIR, '_layouts', 'blog-index.njk');
      expect(fs.existsSync(blogIndexPath)).toBe(false);
    });

    it('should NOT have src/_layouts/blog-post.njk', () => {
      const blogPostPath = path.join(SRC_DIR, '_layouts', 'blog-post.njk');
      expect(fs.existsSync(blogPostPath)).toBe(false);
    });
  });

  describe('31.2 No blog in navigation', () => {
    it('should NOT have Blog link in header.njk navigation', () => {
      const headerPath = path.join(SRC_DIR, '_includes', 'header.njk');
      expect(fs.existsSync(headerPath)).toBe(true);
      const headerContent = fs.readFileSync(headerPath, 'utf-8');

      // Should NOT contain a link to /blog/
      expect(headerContent).not.toMatch(/href=["']\/blog\/["']/);
      // Should NOT contain "Blog" as a navigation item
      expect(headerContent).not.toMatch(/>Blog</);
    });

    it('should NOT have /blog/ URL pattern check in header.njk', () => {
      const headerPath = path.join(SRC_DIR, '_includes', 'header.njk');
      const headerContent = fs.readFileSync(headerPath, 'utf-8');

      // Should NOT have blog URL checks for navigation highlighting
      expect(headerContent).not.toMatch(/startsWith\(['"]\/blog\//);
    });
  });

  describe('31.3 No blog on homepage', () => {
    it('should NOT have a homepage with blog section (if index.njk exists)', () => {
      const indexPath = path.join(SRC_DIR, 'index.njk');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        // Should NOT reference blog posts
        expect(indexContent).not.toMatch(/blog\.?posts/i);
        expect(indexContent).not.toMatch(/recent.*blog/i);
      }
      // If index.njk doesn't exist yet, that's fine - this test passes
      expect(true).toBe(true);
    });
  });

  describe('31.4 No blog in footer', () => {
    it('should NOT have blog links in footer.njk', () => {
      const footerPath = path.join(SRC_DIR, '_includes', 'footer.njk');
      expect(fs.existsSync(footerPath)).toBe(true);
      const footerContent = fs.readFileSync(footerPath, 'utf-8');

      // Should NOT contain blog links
      expect(footerContent).not.toMatch(/href=["']\/blog\/["']/);
    });

    it('should NOT have RSS blog feed links in footer.njk', () => {
      const footerPath = path.join(SRC_DIR, '_includes', 'footer.njk');
      const footerContent = fs.readFileSync(footerPath, 'utf-8');

      // Should NOT reference RSS/feed for blog
      // Note: Comic RSS is OK, we're checking specifically for blog feed
      expect(footerContent).not.toMatch(/blog.*feed/i);
      expect(footerContent).not.toMatch(/feed.*blog/i);
    });
  });

  describe('31.6 No blog data files', () => {
    it('should NOT have src/_data/blog.json', () => {
      const blogJsonPath = path.join(SRC_DIR, '_data', 'blog.json');
      expect(fs.existsSync(blogJsonPath)).toBe(false);
    });

    it('should NOT have src/_data/blogSidebar.js', () => {
      const blogSidebarPath = path.join(SRC_DIR, '_data', 'blogSidebar.js');
      expect(fs.existsSync(blogSidebarPath)).toBe(false);
    });
  });

  describe('31.7 No blog scripts in package.json', () => {
    it('should NOT have parse-blog script', () => {
      const packageJsonPath = path.join(ROOT_DIR, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).not.toHaveProperty('parse-blog');
      expect(packageJson.scripts).not.toHaveProperty('build:blog');

      // Also check script values don't reference blog
      const scriptValues = Object.values(packageJson.scripts || {}) as string[];
      for (const script of scriptValues) {
        expect(script).not.toMatch(/parse-blog/);
        expect(script).not.toMatch(/blog\.ts/);
      }
    });
  });

  describe('31.8 No WebMCP blog template', () => {
    it('should NOT have src/_includes/webmcp-blogpost.njk', () => {
      const webmcpBlogPath = path.join(SRC_DIR, '_includes', 'webmcp-blogpost.njk');
      expect(fs.existsSync(webmcpBlogPath)).toBe(false);
    });
  });
});
