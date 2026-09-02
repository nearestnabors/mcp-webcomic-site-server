/**
 * MCP server parity: annotations, structured output, and search pagination
 * ported from the RTG site.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const index = () => fs.readFileSync(path.join(root, 'mcp-server', 'src', 'index.ts'), 'utf-8');
const search = () => fs.readFileSync(path.join(root, 'mcp-server', 'src', 'tools', 'search-comics.ts'), 'utf-8');
const count = (c: string, re: RegExp) => (c.match(re) || []).length;

describe('MCP server parity', () => {
  it('registers tools via registerTool (not the deprecated tool())', () => {
    const c = index();
    expect(c).toContain('server.registerTool(');
    expect(c).not.toMatch(/\bserver\.tool\(/);
  });

  it('marks read tools readOnlyHint and returns structuredContent', () => {
    const c = index();
    expect(c).toMatch(/readOnlyHint:\s*true/);
    // all 7 tools return structuredContent
    expect(count(c, /structuredContent:/g)).toBe(7);
  });

  it('search_comics accepts limit/offset and reports total/returned', () => {
    const idx = index();
    expect(idx).toMatch(/limit:\s*z\./);
    expect(idx).toMatch(/offset:\s*z\./);
    const s = search();
    expect(s).toMatch(/total:\s*all\.length/);
    expect(s).toMatch(/returned:\s*results\.length/);
    expect(s).toMatch(/\.slice\(\s*start\s*,\s*start\s*\+\s*max\s*\)/);
  });

  it('has no Rachel-specific example content in server tool schemas', () => {
    const c = index().toLowerCase();
    expect(c).not.toContain('rachel-the-great');
    expect(c).not.toContain('crow-princess');
    expect(c).not.toContain('"tuna"');
  });
});
