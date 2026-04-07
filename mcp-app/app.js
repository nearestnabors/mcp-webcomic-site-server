/**
 * MCP App - Webcomic Reader
 *
 * This app runs inside MCP host iframes and uses the MCP Apps SDK
 * to communicate with the MCP server for comic data via the host (Claude).
 */

// ─── MCP Apps SDK Bridge ─────────────────────────────────────────────────────
import {
  callServerTool as mcpCallServerTool,
  setToolResultHandler,
  connect as mcpConnect,
  isConnected,
  getHostContext,
  openLink as mcpOpenLink,
} from './src/mcp-bridge';

// ─── Constants ───────────────────────────────────────────────────────────────

const READING_POSITION_KEY = 'rtg-reading-position';
const TEXT_MODE_KEY = 'rtg-text-mode';

// ─── State ───────────────────────────────────────────────────────────────────

let currentComicId = 'other-comics';
let currentStorylineId = 'crow-princess';
let currentPageNumber = 1;
let totalPages = 0;
let hasPrev = false;
let hasNext = false;

// Cross-storyline navigation
let nextStoryline = null; // { comicId, storylineId, pageNumber }
let prevStoryline = null; // { comicId, storylineId, pageNumber }

// Browser state
let currentView = 'reader'; // 'reader' | 'comics' | 'storylines' | 'search' | 'characters' | 'character-detail'
let selectedComicId = null;
let comicsCache = null;
let charactersCache = null;
let selectedCharacterSlug = null;
let lastSearchQuery = '';

// Track the last page the user was reading (for "Continue reading" button)
let lastReadPage = null; // { comicId, storylineId, pageNumber }

// Text mode state
let isTextMode = false;

// TTS state
let isSpeaking = false;
let currentUtterance = null;

// ─── DOM Elements ────────────────────────────────────────────────────────────

// Reader view elements
const readerView = document.getElementById('reader-view');
const comicTitle = document.getElementById('comic-title');
const pageIndicator = document.getElementById('page-indicator');
const comicImage = document.getElementById('comic-image');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const commentarySection = document.getElementById('commentary-section');
const commentaryToggle = document.getElementById('commentary-toggle');
const commentary = document.getElementById('commentary');
const commentaryContent = document.getElementById('commentary-content');
const commentsSection = document.getElementById('comments-section');
const commentsToggle = document.getElementById('comments-toggle');
const comments = document.getElementById('comments');
const commentsContent = document.getElementById('comments-content');

// Header masthead elements (Phase 23)
const headerNavBtn = document.getElementById('header-nav-btn');
const debugStatus = document.getElementById('debug-status');

// Text mode elements (transcript only shown in text mode - Task 24.6)
const textModeBtn = document.getElementById('text-mode-btn');
const textOnlyContent = document.getElementById('text-only-content');
const textOnlyTitle = document.getElementById('text-only-title');
const textOnlyPageIndicator = document.getElementById('text-only-page-indicator');
const textOnlyTranscript = document.getElementById('text-only-transcript');

// TTS elements
const ttsBtn = document.getElementById('tts-btn');

// Browser view elements
const browserView = document.getElementById('browser-view');
const browserTitle = document.getElementById('browser-title');
const backBtn = document.getElementById('back-btn');
const comicList = document.getElementById('comic-list');
const storylineList = document.getElementById('storyline-list');
const searchNavBtn = document.getElementById('search-nav-btn');
const charactersNavBtn = document.getElementById('characters-nav-btn');

// Character view elements
const characterList = document.getElementById('character-list');
const characterDetail = document.getElementById('character-detail');
const characterName = document.getElementById('character-name');
const characterBio = document.getElementById('character-bio');
const characterPages = document.getElementById('character-pages');

// Search view elements
const searchView = document.getElementById('search-view');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const searchBackBtn = document.getElementById('search-back-btn');

// Shared elements
const errorMessage = document.getElementById('error-message');

// ─── MCP Server Communication ────────────────────────────────────────────────

/**
 * Call an MCP server tool using the MCP Apps SDK bridge.
 * Falls back to mock data in development/testing environments.
 */
async function callTool(toolName, params = {}) {
  try {
    // Use the MCP Apps SDK bridge when connected
    if (isConnected()) {
      return await mcpCallServerTool(toolName, params);
    }

    // Fallback for testing: check for window.mcpTools mock
    if (window.mcpTools && typeof window.mcpTools[toolName] === 'function') {
      return await window.mcpTools[toolName](params);
    }

    throw new Error('MCP server communication not available');
  } catch (error) {
    console.error(`Error calling tool ${toolName}:`, error);
    throw error;
  }
}

/**
 * Fetch page data using the get_page MCP tool.
 */
async function fetchPage(comicId, storylineId, pageNumber) {
  // Mark that we initiated this call (prevents double updateUI from ontoolresult)
  appInitiatedToolCall = true;
  try {
    const result = await callTool('get_page', {
      comic_id: comicId,
      storyline_id: storylineId,
      page_number: pageNumber,
    });
    // Parse MCP response format: {content: [{type: 'text', text: '...'}]}
    return parseMcpResponse(result);
  } finally {
    appInitiatedToolCall = false;
  }
}

/**
 * Parse MCP tool response format into plain object.
 * MCP returns: {content: [{type: 'text', text: JSON}], isError: bool}
 * We need: the parsed JSON object
 */
function parseMcpResponse(result) {
  if (!result) return result;

  // If already parsed (e.g., from mock), return as-is
  if (result.page && result.navigation) {
    return result;
  }

  // Parse MCP content array format
  if (result.content && Array.isArray(result.content)) {
    const textContent = result.content.find(c => c.type === 'text');
    if (textContent && textContent.text) {
      try {
        return JSON.parse(textContent.text);
      } catch (e) {
        console.error('Failed to parse MCP response:', e);
      }
    }
  }

  return result;
}

// ─── External URL Handling ────────────────────────────────────────────────────

/**
 * Open a URL in the host browser.
 * MCP apps can't navigate directly from within an iframe, so we ask the host
 * to open URLs via the MCP SDK's openLink method.
 *
 * Falls back to window.open for standalone/testing environments.
 *
 * @param url - The URL to open
 */
async function openExternalUrl(url) {
  // Check if we have the MCP connection available
  if (isConnected()) {
    try {
      const result = await mcpOpenLink(url);
      if (!result.isError) {
        return; // Success
      }
      // Host denied the request, fall through to fallback
      console.warn('Host denied open link request, trying fallback');
    } catch (error) {
      console.error('Failed to open URL via MCP SDK:', error);
    }
  }

  // Fallback: try window.open (may not work in iframe)
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Fetch list of comics using the list_comics MCP tool.
 */
async function fetchComics() {
  if (comicsCache) {
    return comicsCache;
  }
  const result = await callTool('list_comics', {});
  const parsed = parseMcpResponse(result);
  comicsCache = parsed.comics;
  return comicsCache;
}

/**
 * Fetch storylines for a comic using the list_storylines MCP tool.
 */
async function fetchStorylines(comicId) {
  const result = await callTool('list_storylines', { comic_id: comicId });
  return parseMcpResponse(result);
}

/**
 * Search comics using the search_comics MCP tool.
 */
async function fetchSearch(query) {
  const result = await callTool('search_comics', { query: query });
  return parseMcpResponse(result);
}

/**
 * Fetch list of characters using the list_characters MCP tool.
 */
async function fetchCharacters() {
  if (charactersCache) {
    return charactersCache;
  }
  const result = await callTool('list_characters', {});
  const parsed = parseMcpResponse(result);
  charactersCache = parsed.characters;
  return charactersCache;
}

/**
 * Fetch pages featuring a character using the search_by_character MCP tool.
 */
async function fetchCharacterPages(characterSlug) {
  const result = await callTool('search_by_character', { character_slug: characterSlug });
  return parseMcpResponse(result);
}

// ─── Reading Position Persistence ─────────────────────────────────────────────

/**
 * Save the current reading position to localStorage.
 * Stores comic ID, storyline ID, and page number.
 */
function saveReadingPosition() {
  try {
    const position = {
      comicId: currentComicId,
      storylineId: currentStorylineId,
      pageNumber: currentPageNumber,
    };
    localStorage.setItem(READING_POSITION_KEY, JSON.stringify(position));
  } catch (error) {
    // localStorage may not be available (e.g., private browsing, storage quota)
    console.warn('Could not save reading position:', error);
  }
}

/**
 * Load the saved reading position from localStorage.
 * Returns the position object if valid, or null if not found/invalid.
 */
function loadReadingPosition() {
  try {
    const saved = localStorage.getItem(READING_POSITION_KEY);
    if (!saved) {
      return null;
    }
    const savedPosition = JSON.parse(saved);
    // Validate that the loaded data has required fields
    if (savedPosition.comicId && savedPosition.storylineId && savedPosition.pageNumber) {
      return savedPosition;
    }
    return null;
  } catch (error) {
    // Handle JSON parse errors or localStorage access errors
    console.warn('Could not load reading position:', error);
    return null;
  }
}

// ─── Text Mode Persistence ────────────────────────────────────────────────────

/**
 * Save the text mode preference to localStorage.
 */
function saveTextModePreference() {
  try {
    localStorage.setItem(TEXT_MODE_KEY, JSON.stringify(isTextMode));
  } catch (error) {
    console.warn('Could not save text mode preference:', error);
  }
}

/**
 * Load the saved text mode preference from localStorage.
 * Returns the boolean preference or false if not found/invalid.
 */
function loadTextModePreference() {
  try {
    const saved = localStorage.getItem(TEXT_MODE_KEY);
    if (saved === null) {
      return false;
    }
    return JSON.parse(saved) === true;
  } catch (error) {
    console.warn('Could not load text mode preference:', error);
    return false;
  }
}

// ─── Image Preloading ─────────────────────────────────────────────────────────

// Cache for preloaded images (to prevent garbage collection)
const preloadedImages = new Map();

/**
 * Preload adjacent images (previous and next) for smoother navigation.
 * Uses the prevImageUrl and nextImageUrl from the server response.
 * @param {Object} navigation - The navigation object from get_page response
 */
function preloadAdjacentImages(navigation) {
  const urlsToPreload = [];

  if (navigation.prevImageUrl) {
    urlsToPreload.push(navigation.prevImageUrl);
  }
  if (navigation.nextImageUrl) {
    urlsToPreload.push(navigation.nextImageUrl);
  }

  for (const url of urlsToPreload) {
    // Skip if already preloaded
    if (preloadedImages.has(url)) {
      continue;
    }

    // Create a new Image object to trigger browser caching
    const img = new Image();
    img.src = url;

    // Store in cache to prevent garbage collection
    preloadedImages.set(url, img);

    // Limit cache size to prevent memory bloat (keep last 10 images)
    if (preloadedImages.size > 10) {
      const oldestKey = preloadedImages.keys().next().value;
      preloadedImages.delete(oldestKey);
    }
  }
}

// ─── UI Update Functions ─────────────────────────────────────────────────────

/**
 * Update the UI with page data from get_page result.
 */
function updateUI(pageData) {
  const { page, navigation } = pageData;

  // Update comic image
  // Prefer base64 imageData (bypasses CSP) over URL
  if (pageData.imageData) {
    // Use base64 data URL from server (works with MCP App CSP)
    comicImage.src = pageData.imageData;
    comicImage.alt = page.alt || page.title;
  } else if (page.image) {
    // Fallback to URL (may be blocked by CSP in MCP App)
    const imageUrl = page.image.startsWith('http://') || page.image.startsWith('https://')
      ? page.image
      : `/${page.image}`;
    comicImage.src = imageUrl;
    comicImage.alt = page.alt || page.title;
  }

  // Update title
  comicTitle.textContent = page.title || 'Untitled';

  // Update page indicator
  totalPages = navigation.totalPages;
  pageIndicator.textContent = `Page ${currentPageNumber} of ${totalPages}`;

  // Update navigation state
  hasPrev = navigation.hasPrev;
  hasNext = navigation.hasNext;
  nextStoryline = navigation.nextStoryline || null;
  prevStoryline = navigation.prevStoryline || null;
  updateNavButtons();

  // Update TTS button based on transcript availability (Task 24.6: transcript now only in text mode)
  updateTTSButton(!!page.transcript);

  // Update commentary
  // Reset collapse state when loading a new page to prevent accumulation
  commentary.hidden = true;
  commentaryToggle.textContent = 'Show Commentary';
  if (page.commentary) {
    commentaryContent.innerHTML = parseMarkdown(page.commentary);
    commentarySection.hidden = false;
  } else {
    commentarySection.hidden = true;
  }

  // Update comments
  // Reset collapse state when loading a new page to prevent accumulation
  comments.hidden = true;
  if (page.comments && page.comments.length > 0) {
    renderComments(page.comments);
  } else {
    commentsSection.hidden = true;
  }

  // Update text-only content (for text mode)
  textOnlyTitle.textContent = page.title || 'Untitled';
  textOnlyPageIndicator.textContent = `Page ${currentPageNumber} of ${totalPages}`;
  textOnlyTranscript.innerHTML = page.transcript ? parseMarkdown(page.transcript) : '(No transcript available)';

  // Hide error message on success
  hideError();

  // Preload adjacent images for smoother navigation
  preloadAdjacentImages(navigation);
}

/**
 * Update the enabled/disabled state of navigation buttons.
 * Buttons are enabled if there's a prev/next page OR a prev/next storyline.
 */
function updateNavButtons() {
  prevBtn.disabled = !hasPrev && !prevStoryline;
  nextBtn.disabled = !hasNext && !nextStoryline;
}

/**
 * Show an error message to the user.
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

/**
 * Hide the error message.
 */
function hideError() {
  errorMessage.hidden = true;
}

/**
 * Show loading state.
 */
function showLoading() {
  comicTitle.textContent = 'Loading...';
  pageIndicator.textContent = '';
  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

// ─── View Management ─────────────────────────────────────────────────────────

/**
 * Show the reader view and hide other views.
 */
function showReader() {
  currentView = 'reader';
  readerView.classList.remove('hidden');
  browserView.classList.add('hidden');
  searchView.classList.add('hidden');
}

/**
 * Show the browser view and hide other views.
 */
function showBrowser() {
  currentView = 'comics';
  readerView.classList.add('hidden');
  browserView.classList.remove('hidden');
  searchView.classList.add('hidden');

  // Show comic list
  comicList.classList.remove('hidden');
  storylineList.classList.add('hidden');
  backBtn.classList.add('hidden');
  browserTitle.textContent = 'Comics';

  loadComics();
}

/**
 * Toggle to browser view.
 */
function toggleBrowser() {
  if (currentView === 'reader') {
    showBrowser();
  } else {
    showReader();
  }
}

/**
 * Handle header nav button click (Phase 23).
 * Toggles between reader and browser views with appropriate button text.
 */
async function handleHeaderNavClick() {
  if (currentView === 'reader') {
    // Currently in reader, go to browser
    showBrowser();
    // Update button text based on whether we have a page to return to
    if (headerNavBtn) {
      headerNavBtn.textContent = lastReadPage ? 'Continue reading' : 'Browse more comics';
    }
  } else {
    // Currently in browser/search/characters, go back to reader
    if (lastReadPage) {
      // Load the last read page
      currentComicId = lastReadPage.comicId;
      currentStorylineId = lastReadPage.storylineId;
      showReader();
      await loadPage(lastReadPage.pageNumber);
    } else {
      // No page to return to, just show reader (will load default)
      showReader();
    }
    // Update button text
    if (headerNavBtn) {
      headerNavBtn.textContent = 'Browse more comics';
    }
  }
}

/**
 * Update header nav button text when navigating to a page.
 * Called when user clicks on a comic/storyline to start reading.
 */
function updateHeaderNavBtnText() {
  if (headerNavBtn) {
    headerNavBtn.textContent = 'Browse more comics';
  }
}

// ─── Browser Functions ───────────────────────────────────────────────────────

/**
 * Load and render the comic list.
 */
async function loadComics() {
  try {
    const comics = await fetchComics();
    renderComics(comics);
  } catch (error) {
    showError(`Failed to load comics: ${error.message}`);
  }
}

/**
 * Render the comic list in the browser view.
 */
function renderComics(comics) {
  comicList.innerHTML = '';

  comics.forEach(comic => {
    const item = document.createElement('div');
    item.className = 'comic-item';
    item.innerHTML = `
      <h2>${escapeHtml(comic.title)}</h2>
      <p>${escapeHtml(comic.description)}</p>
      <div class="meta">${comic.storylineCount} storyline(s) &middot; ${comic.pageCount} pages</div>
    `;
    item.addEventListener('click', () => selectComic(comic.id));
    comicList.appendChild(item);
  });
}

/**
 * Handle comic selection - show storylines for the comic.
 */
async function selectComic(comicId) {
  selectedComicId = comicId;
  currentView = 'storylines';

  // Update UI
  comicList.classList.add('hidden');
  storylineList.classList.remove('hidden');
  backBtn.classList.remove('hidden');

  try {
    const result = await fetchStorylines(comicId);
    browserTitle.textContent = result.comic.title;
    renderStorylines(result.storylines, comicId);
  } catch (error) {
    showError(`Failed to load storylines: ${error.message}`);
  }
}

/**
 * Render the storyline list in the browser view.
 */
function renderStorylines(storylines, comicId) {
  storylineList.innerHTML = '';

  storylines.forEach(storyline => {
    const item = document.createElement('div');
    item.className = 'storyline-item';
    item.innerHTML = `
      <h3>${escapeHtml(storyline.title)}</h3>
      <div class="meta">${storyline.pageCount} pages</div>
    `;
    item.addEventListener('click', () => selectStoryline(comicId, storyline.id));
    storylineList.appendChild(item);
  });
}

/**
 * Handle storyline selection - start reading the storyline.
 */
function selectStoryline(comicId, storylineId) {
  currentComicId = comicId;
  currentStorylineId = storylineId;
  currentPageNumber = 1;

  showReader();
  loadPage(1);
  updateHeaderNavBtnText();
}

/**
 * Handle back navigation in browser.
 */
function goBack() {
  if (currentView === 'storylines') {
    // Go back to comic list
    currentView = 'comics';
    selectedComicId = null;
    comicList.classList.remove('hidden');
    storylineList.classList.add('hidden');
    backBtn.classList.add('hidden');
    browserTitle.textContent = 'Comics';
  } else if (currentView === 'character-detail') {
    // Go back to character list
    showCharacters();
  } else if (currentView === 'characters') {
    // Go back to comic list
    currentView = 'comics';
    characterList.classList.add('hidden');
    comicList.classList.remove('hidden');
    backBtn.classList.add('hidden');
    browserTitle.textContent = 'Comics';
  } else {
    // Go back to reader
    showReader();
  }
}

// ─── Search Functions ─────────────────────────────────────────────────────────

/**
 * Show the search view.
 */
function showSearch() {
  currentView = 'search';
  readerView.classList.add('hidden');
  browserView.classList.add('hidden');
  searchView.classList.remove('hidden');

  // Focus the search input
  searchInput.focus();
}

/**
 * Go back from search view.
 */
function goBackFromSearch() {
  showBrowser();
}

/**
 * Perform a search with the given query.
 */
async function performSearch(query) {
  if (!query || !query.trim()) {
    searchResults.innerHTML = '<div class="search-results-empty">Enter a search term to find comics</div>';
    return;
  }

  lastSearchQuery = query.trim();
  searchResults.innerHTML = '<div class="search-results-empty">Searching...</div>';

  try {
    const result = await fetchSearch(lastSearchQuery);
    renderSearchResults(result.results);
  } catch (error) {
    showError(`Search failed: ${error.message}`);
    searchResults.innerHTML = '<div class="search-results-empty">Search failed. Please try again.</div>';
  }
}

/**
 * Render search results in the search view.
 */
function renderSearchResults(results) {
  searchResults.innerHTML = '';

  if (!results || results.length === 0) {
    searchResults.innerHTML = '<div class="search-results-empty">No results found</div>';
    return;
  }

  results.forEach(result => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
      <h3>${escapeHtml(result.title)}</h3>
      <p class="snippet">${escapeHtml(result.snippet)}</p>
      <span class="match-field">${escapeHtml(result.matchField)}</span>
    `;
    item.addEventListener('click', () => selectSearchResult(result));
    searchResults.appendChild(item);
  });
}

/**
 * Handle search result selection - navigate to the page.
 */
function selectSearchResult(result) {
  currentComicId = result.comic_id;
  currentStorylineId = result.storyline_id;
  currentPageNumber = result.page_number;

  showReader();
  loadPage(result.page_number);
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convert a slug like "other-comics" to title case "Other Comics".
 */
function slugToTitleCase(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse basic markdown to HTML for transcript display.
 * Supports: ### headers, ## headers, **bold**, *italic*, [links](url), and paragraphs.
 */
function parseMarkdown(text) {
  if (!text) return '';

  return text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers - process ### before ## to avoid conflicts
    // ### Header (h3 markdown → h3 HTML for panel headings)
    .replace(/^### (.+)$/gm, '<h3 class="transcript-heading">$1</h3>')
    // ## Header (h2 markdown → h3 HTML for section headings)
    .replace(/^## (.+)$/gm, '<h3 class="transcript-heading">$1</h3>')
    // Bold (**text**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic (*text*)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links [text](url) - use target="_blank" for external links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br>')
    // Wrap in paragraph tags
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h3)/g, '$1')
    .replace(/(<\/h3>)<\/p>/g, '$1');
}

// ─── Character Functions ──────────────────────────────────────────────────────

/**
 * Show the characters list view.
 */
function showCharacters() {
  currentView = 'characters';
  selectedCharacterSlug = null;

  // Update UI
  comicList.classList.add('hidden');
  storylineList.classList.add('hidden');
  characterDetail.classList.add('hidden');
  characterList.classList.remove('hidden');
  backBtn.classList.remove('hidden');
  browserTitle.textContent = 'Characters';

  loadCharacters();
}

/**
 * Load and render the character list.
 */
async function loadCharacters() {
  try {
    const characters = await fetchCharacters();
    renderCharacters(characters);
  } catch (error) {
    showError(`Failed to load characters: ${error.message}`);
  }
}

/**
 * Render the character list in the browser view.
 */
function renderCharacters(characters) {
  characterList.innerHTML = '';

  if (!characters || characters.length === 0) {
    characterList.innerHTML = '<div class="characters-empty">No characters found</div>';
    return;
  }

  characters.forEach(character => {
    const item = document.createElement('div');
    item.className = 'character-item';

    // Build thumbnail HTML - use image if available, otherwise show initials placeholder
    const thumbUrl = character.thumbnailPath
      ? (character.thumbnailPath.startsWith('http://') || character.thumbnailPath.startsWith('https://')
          ? character.thumbnailPath
          : `/${character.thumbnailPath}`)
      : '';

    let thumbHtml;
    if (thumbUrl) {
      thumbHtml = `<img class="character-thumb" src="${thumbUrl}" alt="${escapeHtml(character.name)}">`;
    } else {
      // Generate initials placeholder with consistent color based on name
      const initials = character.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      // Generate a hue from the character name for consistent coloring
      const hue = character.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
      thumbHtml = `<div class="character-thumb character-thumb-placeholder" style="background-color: hsl(${hue}, 45%, 65%)">${escapeHtml(initials)}</div>`;
    }

    item.innerHTML = `
      ${thumbHtml}
      <div class="character-info">
        <span class="character-name">${escapeHtml(character.name)}</span>
        <span class="character-divider">|</span>
        <span class="character-comic">${escapeHtml(slugToTitleCase(character.comicId))}</span>
      </div>
    `;
    item.addEventListener('click', () => selectCharacter(character.slug));
    characterList.appendChild(item);
  });
}

/**
 * Handle character selection - show character detail view.
 */
async function selectCharacter(characterSlug) {
  selectedCharacterSlug = characterSlug;
  currentView = 'character-detail';

  // Update UI
  characterList.classList.add('hidden');
  characterDetail.classList.remove('hidden');

  try {
    // Get character info from cache
    const characters = await fetchCharacters();
    const character = characters.find(c => c.slug === characterSlug);

    if (character) {
      characterName.textContent = character.name;
      characterBio.textContent = character.bio || '(No bio available)';
      browserTitle.textContent = character.name;
    }

    // Get pages featuring this character
    const result = await fetchCharacterPages(characterSlug);
    renderCharacterDetail(result.pages || []);
  } catch (error) {
    showError(`Failed to load character: ${error.message}`);
  }
}

/**
 * Render the character detail view with pages.
 */
function renderCharacterDetail(pages) {
  characterPages.innerHTML = '';

  if (!pages || pages.length === 0) {
    characterPages.innerHTML = '<div class="character-pages-empty">No pages found for this character</div>';
    return;
  }

  pages.forEach(page => {
    const item = document.createElement('div');
    item.className = 'character-page-item';
    item.innerHTML = `
      <h4>${escapeHtml(page.title)}</h4>
      <div class="meta">${escapeHtml(slugToTitleCase(page.comic_id))} &middot; ${escapeHtml(slugToTitleCase(page.storyline_id))}</div>
    `;
    item.addEventListener('click', () => selectCharacterPage(page));
    characterPages.appendChild(item);
  });
}

/**
 * Handle page selection from character detail - navigate to the page.
 */
function selectCharacterPage(page) {
  currentComicId = page.comic_id;
  currentStorylineId = page.storyline_id;
  currentPageNumber = page.page_number;

  showReader();
  loadPage(page.page_number);
}

// ─── Navigation ──────────────────────────────────────────────────────────────

/**
 * Load a specific page.
 */
async function loadPage(pageNumber) {
  // Stop any ongoing TTS when navigating to a new page
  stopSpeaking();

  showLoading();

  try {
    const pageData = await fetchPage(currentComicId, currentStorylineId, pageNumber);
    currentPageNumber = pageNumber;
    updateUI(pageData);
    // Save reading position after successful page load
    saveReadingPosition();
    // Track last read page for "Continue reading" functionality
    lastReadPage = {
      comicId: currentComicId,
      storylineId: currentStorylineId,
      pageNumber: currentPageNumber,
    };
  } catch (error) {
    showError(`Failed to load page: ${error.message}`);
    console.error('Error loading page:', error);
  }
}

/**
 * Navigate to the previous page.
 * If at the first page of a storyline, go to the last page of the previous storyline.
 */
async function goToPrevPage() {
  if (hasPrev && currentPageNumber > 1) {
    await loadPage(currentPageNumber - 1);
  } else if (prevStoryline) {
    // Cross-storyline navigation: go to last page of previous storyline
    currentComicId = prevStoryline.comicId;
    currentStorylineId = prevStoryline.storylineId;
    currentPageNumber = prevStoryline.pageNumber;
    await loadPage(prevStoryline.pageNumber);
  }
}

/**
 * Navigate to the next page.
 * If at the last page of a storyline, go to the first page of the next storyline.
 */
async function goToNextPage() {
  if (hasNext && currentPageNumber < totalPages) {
    await loadPage(currentPageNumber + 1);
  } else if (nextStoryline) {
    // Cross-storyline navigation: go to first page of next storyline
    currentComicId = nextStoryline.comicId;
    currentStorylineId = nextStoryline.storylineId;
    currentPageNumber = nextStoryline.pageNumber;
    await loadPage(nextStoryline.pageNumber);
  }
}

// ─── Commentary Toggle ───────────────────────────────────────────────────────

function toggleCommentary() {
  const isHidden = commentary.hidden;
  commentary.hidden = !isHidden;
  commentaryToggle.textContent = isHidden ? 'Hide Commentary' : 'Show Commentary';
}

// ─── Comments Toggle and Rendering ───────────────────────────────────────────

function toggleComments() {
  const isHidden = comments.hidden;
  comments.hidden = !isHidden;
  const count = commentsContent.children.length;
  commentsToggle.textContent = isHidden
    ? `Hide Comments (${count})`
    : `Show Comments (${count})`;
}

// ─── Text Mode Toggle ─────────────────────────────────────────────────────────

/**
 * Toggle text-only reading mode.
 * When enabled, hides the comic image and shows only the transcript.
 */
function toggleTextMode() {
  isTextMode = !isTextMode;

  // Update UI
  if (isTextMode) {
    readerView.classList.add('text-mode');
    textOnlyContent.hidden = false;
    textModeBtn.textContent = 'Image Mode';
    textModeBtn.setAttribute('aria-pressed', 'true');
  } else {
    readerView.classList.remove('text-mode');
    textOnlyContent.hidden = true;
    textModeBtn.textContent = 'Text Mode';
    textModeBtn.setAttribute('aria-pressed', 'false');
  }

  // Save preference
  saveTextModePreference();
}

// ─── TTS (Text-to-Speech) ─────────────────────────────────────────────────────

/**
 * Check if the browser supports the Web Speech API.
 */
function isTTSSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Speak the transcript text using the Web Speech API.
 */
function speakTranscript() {
  if (!isTTSSupported()) {
    console.warn('Text-to-speech is not supported in this browser.');
    return;
  }

  // Get the transcript text (Task 24.6: transcript now only in text-only-content)
  const text = textOnlyTranscript.textContent;
  if (!text || text.trim() === '') {
    return;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  // Set up event handlers
  utterance.onstart = function() {
    isSpeaking = true;
    ttsBtn.textContent = '⏹ Stop';
    ttsBtn.setAttribute('aria-pressed', 'true');
  };

  utterance.onend = function() {
    isSpeaking = false;
    currentUtterance = null;
    ttsBtn.textContent = '🔊 Listen';
    ttsBtn.setAttribute('aria-pressed', 'false');
  };

  utterance.onerror = function(event) {
    console.error('TTS error:', event.error);
    isSpeaking = false;
    currentUtterance = null;
    ttsBtn.textContent = '🔊 Listen';
    ttsBtn.setAttribute('aria-pressed', 'false');
  };

  // Start speaking
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing speech.
 */
function stopSpeaking() {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  currentUtterance = null;
  if (ttsBtn) {
    ttsBtn.textContent = '🔊 Listen';
    ttsBtn.setAttribute('aria-pressed', 'false');
  }
}

/**
 * Toggle TTS playback - start speaking or stop if already speaking.
 */
function toggleTTS() {
  if (isSpeaking) {
    stopSpeaking();
  } else {
    speakTranscript();
  }
}

/**
 * Update the TTS button state based on whether a transcript is available.
 */
function updateTTSButton(hasTranscript) {
  if (ttsBtn) {
    ttsBtn.disabled = !hasTranscript;
  }
}

/**
 * Render a single comment with its nested replies.
 * Uses parseMarkdown for comment text to render markdown links as clickable <a> elements.
 * Author names are still escaped to prevent XSS.
 */
function renderComment(comment) {
  const div = document.createElement('div');
  div.className = 'comment-item';

  const authorDiv = document.createElement('div');
  authorDiv.className = 'comment-author';
  authorDiv.textContent = escapeHtml(comment.author);
  div.appendChild(authorDiv);

  const textDiv = document.createElement('div');
  textDiv.className = 'comment-text';
  // Use parseMarkdown to render markdown links like [text](url) as clickable <a> elements
  // parseMarkdown already handles HTML escaping before markdown processing, preventing XSS
  textDiv.innerHTML = parseMarkdown(comment.text);
  div.appendChild(textDiv);

  // Render nested replies recursively
  if (comment.replies && comment.replies.length > 0) {
    const repliesDiv = document.createElement('div');
    repliesDiv.className = 'comment-replies';
    comment.replies.forEach(reply => {
      repliesDiv.appendChild(renderComment(reply));
    });
    div.appendChild(repliesDiv);
  }

  return div;
}

/**
 * Render all comments into the comments content container.
 */
function renderComments(commentsArray) {
  commentsContent.innerHTML = '';

  if (!commentsArray || commentsArray.length === 0) {
    commentsSection.hidden = true;
    return;
  }

  commentsArray.forEach(comment => {
    commentsContent.appendChild(renderComment(comment));
  });

  commentsSection.hidden = false;
  commentsToggle.textContent = `Show Comments (${commentsArray.length})`;
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

function setupEventListeners() {
  // Navigation buttons
  prevBtn.addEventListener('click', goToPrevPage);
  nextBtn.addEventListener('click', goToNextPage);

  // Commentary toggle
  commentaryToggle.addEventListener('click', toggleCommentary);

  // Comments toggle
  commentsToggle.addEventListener('click', toggleComments);

  // Header navigation button (Phase 23 - replaces old browse-btn)
  if (headerNavBtn) {
    headerNavBtn.addEventListener('click', handleHeaderNavClick);
  }

  // Text mode toggle
  textModeBtn.addEventListener('click', toggleTextMode);

  // TTS button
  ttsBtn.addEventListener('click', toggleTTS);

  // Back button in browser
  backBtn.addEventListener('click', goBack);

  // Search navigation button in browser header
  searchNavBtn.addEventListener('click', showSearch);

  // Characters navigation button in browser header
  charactersNavBtn.addEventListener('click', showCharacters);

  // Search back button
  searchBackBtn.addEventListener('click', goBackFromSearch);

  // Search button
  searchBtn.addEventListener('click', () => {
    performSearch(searchInput.value);
  });

  // Enter key in search input
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch(searchInput.value);
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (event) => {
    if (currentView !== 'reader') return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      goToPrevPage();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      goToNextPage();
    }
  });

  // Note: Logo is now a non-interactive span (no click handler needed)
  // The logo displays "Comic Archive" as text

  // External link handler - intercept clicks on http(s) links
  // Uses event delegation to catch links in dynamically loaded content (comments, etc.)
  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href^="http"]');
    if (link && !link.href.startsWith(window.location.origin)) {
      event.preventDefault();
      await openExternalUrl(link.href);
    }
  });
}

// ─── Initialization ──────────────────────────────────────────────────────────

// Track whether we received initial data from MCP host
let receivedInitialData = false;

// Track the fallback timeout so we can cancel it when data arrives
let fallbackTimeoutId = null;

// Track whether we initiated a tool call (to avoid double updateUI from ontoolresult)
let appInitiatedToolCall = false;

/**
 * Handle initial tool result from the MCP host.
 * This is called when the host sends the initial page data for the tool call.
 * This is the PREFERRED way to get initial data - the host pushes it to us.
 */
function handleInitialToolResultInternal(result) {
  // Skip if we initiated this tool call - we'll handle the result in loadPage()
  if (appInitiatedToolCall) {
    return;
  }

  // If we receive page data, update the UI
  if (result && typeof result === 'object') {
    // Parse if result is a string (sometimes it comes as JSON string)
    let data = result;
    if (typeof result === 'string') {
      try {
        data = JSON.parse(result);
      } catch (e) {
        // Could not parse, use as-is
      }
    }

    // Check for content array (MCP SDK format)
    if (data.content && Array.isArray(data.content)) {
      const textContent = data.content.find(c => c.type === 'text');
      if (textContent && textContent.text) {
        try {
          data = JSON.parse(textContent.text);
        } catch (e) {
          // Could not parse content text
        }
      }
    }

    // The result might be page data from get_page tool
    if (data.page && data.navigation) {
      receivedInitialData = true;

      // Cancel the fallback timeout since we got data
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
        fallbackTimeoutId = null;
      }
      // Update state from the received data
      if (data.navigation.comicId) {
        currentComicId = data.navigation.comicId;
      }
      if (data.navigation.storylineId) {
        currentStorylineId = data.navigation.storylineId;
      }
      currentPageNumber = data.page.pageNumber || 1;
      updateUI(data);
    }
  }
}

/**
 * Initialize the app.
 *
 * CRITICAL: The MCP connection MUST happen first, before any other setup.
 * This matches the minimal app pattern that works reliably.
 */
async function init() {
  // STEP 1: Set up tool result handler FIRST (before connect)
  // This is the pattern the minimal app uses
  setToolResultHandler(handleInitialToolResultInternal);

  // STEP 2: Try to connect to MCP host immediately
  // Do NOT do any DOM setup before this - it may cause timing issues
  try {
    await mcpConnect();

    // STEP 3: Now that we're connected, do the rest of setup
    setupEventListeners();
    restoreTextModePreference();
    checkDebugUrlParam();

    // IMPORTANT: Do NOT call loadPage() here!
    // The host will push the initial tool result via ontoolresult.
    // Making our own tool call during init interferes with the visibility handshake.

    // Give the host time to push data
    // Increased to 5 seconds because Claude's shttp proxy can be slow
    fallbackTimeoutId = setTimeout(() => {
      fallbackTimeoutId = null;
      if (!receivedInitialData) {
        loadDefaultPage();
      }
    }, 5000);

  } catch (error) {
    // Connection error - but check if we already received data via ontoolresult
    if (receivedInitialData) {
      // We got data before the timeout, so we're actually fine!
      setupEventListeners();
      restoreTextModePreference();
      checkDebugUrlParam();
      return; // Don't fall back - we have the data
    }

    // Not running in MCP host, proceed with standalone/fallback mode
    setupEventListeners();
    restoreTextModePreference();
    checkDebugUrlParam();
    loadDefaultPage();
  }
}

/**
 * Restore text mode preference from localStorage.
 */
function restoreTextModePreference() {
  const savedTextMode = loadTextModePreference();
  if (savedTextMode) {
    isTextMode = true;
    readerView.classList.add('text-mode');
    textOnlyContent.hidden = false;
    textModeBtn.textContent = 'Image Mode';
    textModeBtn.setAttribute('aria-pressed', 'true');
  }
}

/**
 * Check URL parameters for debug mode (Phase 23).
 * Shows the debug status element if ?debug=true is in the URL.
 */
function checkDebugUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'true') {
    if (debugStatus) {
      debugStatus.hidden = false;
    }
  }
}

/**
 * Load default page for standalone mode or when no initial data is received.
 */
async function loadDefaultPage() {
  // Safety check: abort if we already received data from the host
  // This handles race conditions where timeout fires just as ontoolresult arrives
  if (receivedInitialData) {
    return;
  }

  // Try to restore saved reading position, or use defaults
  const savedPosition = loadReadingPosition();
  if (savedPosition) {
    currentComicId = savedPosition.comicId;
    currentStorylineId = savedPosition.storylineId;
    currentPageNumber = savedPosition.pageNumber;
    await loadPage(savedPosition.pageNumber);
  } else {
    // Load initial page (Crow Princess, page 1 - MVP default)
    currentComicId = 'other-comics';
    currentStorylineId = 'crow-princess';
    currentPageNumber = 1;
    await loadPage(1);
  }
}

// Start the app immediately (module scripts are deferred, so DOM is ready)
// Note: Using DOMContentLoaded caused SDK hanging issues - direct call works like minimal app
init();
