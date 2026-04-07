const fs = require("fs");
const path = require("path");

module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/favicon.gif");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/ai.txt");

  // Check if a file exists (relative to src directory)
  // Used by sidebar-characters.njk to conditionally show thumbnails
  eleventyConfig.addFilter("fileExists", function(filePath) {
    if (!filePath) return false;
    const fullPath = path.join(__dirname, "src", filePath);
    return fs.existsSync(fullPath);
  });

  // Collection for comic storylines (for archive pagination)
  // This is generic - works with any comic ID in the manifest
  eleventyConfig.addCollection("allStorylines", function() {
    const manifestPath = path.join(__dirname, "src/_data/manifest.json");
    if (!fs.existsSync(manifestPath)) return [];
    const manifest = require(manifestPath);
    // Flatten all storylines from all comics
    return manifest.comics.flatMap(comic =>
      comic.storylines.map(storyline => ({
        ...storyline,
        comicId: comic.id,
        comicTitle: comic.title
      }))
    );
  });

  // Date formatting filter (matches "Oct 22, 2006" format)
  eleventyConfig.addFilter("formatDate", function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  });

  // Markdown rendering for commentary
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true });
  eleventyConfig.addFilter("markdown", function(content) {
    if (!content) return "";
    return md.render(content);
  });

  // XML escape filter for RSS feed
  eleventyConfig.addFilter("xmlEscape", function(content) {
    if (!content) return "";
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  });

  // RFC 822 date format for RSS feeds
  eleventyConfig.addFilter("rssDate", function(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    // RFC 822 format: Day, DD Mon YYYY HH:MM:SS +0000
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = days[date.getUTCDay()];
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mon = months[date.getUTCMonth()];
    const yyyy = date.getUTCFullYear();
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${day}, ${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss} +0000`;
  });

  // Global data for current year in footer
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  // String padding filter for month numbers in archive URLs
  eleventyConfig.addFilter("padStart", function(value, length, char) {
    return String(value).padStart(length, char || '0');
  });

  // Regex test filter for checking URL patterns (used for navigation highlighting)
  eleventyConfig.addFilter("regex_test", function(value, pattern) {
    if (!value) return false;
    const regex = new RegExp(pattern);
    return regex.test(value);
  });

  // Slice filter for arrays (Nunjucks built-in slice creates chunks, not slices)
  // This provides JavaScript-style Array.slice() behavior
  eleventyConfig.addFilter("slice", function(arr, start, end) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.slice(start, end);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
