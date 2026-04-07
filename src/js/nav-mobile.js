/**
 * Mobile Navigation Toggle Script
 *
 * Task: 18.2
 *
 * Handles the toggle behavior for the mobile navigation overlay.
 * - Toggles 'nav-expanded' class on body when button clicked
 * - Updates aria-expanded and aria-hidden attributes
 * - Closes overlay when a link inside is clicked
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const body = document.body;
  const overlay = document.getElementById('nav-overlay');

  if (!toggle || !overlay) return;

  // Toggle navigation on button click
  toggle.addEventListener('click', () => {
    const isExpanded = body.classList.toggle('nav-expanded');
    toggle.setAttribute('aria-expanded', isExpanded.toString());
    overlay.setAttribute('aria-hidden', (!isExpanded).toString());
  });

  // Close navigation when any link in overlay is clicked
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-expanded');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('nav-expanded')) {
      body.classList.remove('nav-expanded');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
      toggle.focus();
    }
  });
});
