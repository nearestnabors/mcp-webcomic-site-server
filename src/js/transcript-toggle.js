/**
 * Transcript Toggle - Custom disclosure widget for accessibility
 *
 * This script handles the toggle behavior for the transcript widget.
 * The transcript content is always in the DOM and accessibility tree
 * (using .sr-only class for visual hiding), but when toggled, it
 * becomes visible to sighted users.
 */
document.querySelectorAll('.transcript-toggle').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var controlsId = btn.getAttribute('aria-controls');
    var content = document.getElementById(controlsId);
    if (!content) return;

    var isExpanded = content.classList.toggle('expanded');
    content.classList.toggle('sr-only', !isExpanded);
    btn.setAttribute('aria-expanded', isExpanded.toString());
  });
});
