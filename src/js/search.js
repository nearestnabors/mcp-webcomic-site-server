// Pagefind search initialization
// This script initializes the Pagefind UI for site-wide search functionality.
// It renders a search interface in the #search element found in sidebar-comics.njk.

window.addEventListener('DOMContentLoaded', () => {
  if (typeof PagefindUI !== 'undefined') {
    new PagefindUI({
      element: "#search",
      showSubResults: true,
      showImages: false,
    });
  }
});
