/**
 * 11ty data file for comics
 * Generates all comic pages from manifest.json
 *
 * This file is generic and works with any comic manifest.
 * It reads the first comic from the manifest and generates pages for all storylines.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const manifest = require('../_data/manifest.json');

export default function() {
  // Get the first comic (in the public demo repo, there's only one)
  const comic = manifest.comics[0];
  if (!comic) return { pages: [] };

  const allPages = [];

  // Sort storylines by order to find next storyline
  const sortedStorylines = [...comic.storylines].sort((a, b) => b.order - a.order);

  comic.storylines.forEach(storyline => {
    // Find adjacent storylines chronologically
    const currentIndex = sortedStorylines.findIndex(s => s.id === storyline.id);
    const nextStoryline = currentIndex < sortedStorylines.length - 1
      ? sortedStorylines[currentIndex + 1]
      : null;
    const prevStoryline = currentIndex > 0
      ? sortedStorylines[currentIndex - 1]
      : null;

    storyline.pages.forEach((page, index) => {
      const prevPage = index > 0 ? storyline.pages[index - 1] : null;
      const nextPage = index < storyline.pages.length - 1 ? storyline.pages[index + 1] : null;
      const isFirstPage = index === 0;
      const isLastPage = index === storyline.pages.length - 1;

      // For first page, link back to the last page of the previous storyline
      const prevStorylineLastPage = prevStoryline ? prevStoryline.pages[prevStoryline.pages.length - 1] : null;

      allPages.push({
        ...page,
        comic_id: comic.id,
        storyline_id: storyline.id,
        storylineTitle: storyline.title,
        storylines: comic.storylines,
        prevUrl: prevPage ? `/comics/${prevPage.slug}/` : null,
        prevTitle: prevPage ? prevPage.title : null,
        nextUrl: nextPage ? `/comics/${nextPage.slug}/` : null,
        nextTitle: nextPage ? nextPage.title : null,
        firstPageUrl: `/comics/${storyline.pages[0].slug}/`,
        // Add prev storyline link for first page of each storyline
        prevStorylineUrl: isFirstPage && prevStorylineLastPage ? `/comics/${prevStorylineLastPage.slug}/` : null,
        prevStorylineTitle: isFirstPage && prevStoryline ? prevStoryline.title : null,
        // Add next storyline link for last page of each storyline
        nextStorylineUrl: isLastPage && nextStoryline ? `/comics/${nextStoryline.pages[0].slug}/` : null,
        nextStorylineTitle: isLastPage && nextStoryline ? nextStoryline.title : null,
      });
    });
  });

  return {
    layout: 'comic-page.njk',
    pages: allPages,
    // Use eleventyComputed to push pagination item data into the data cascade
    eleventyComputed: {
      titleFormat: () => 'comics',
      comicId: (data) => data.comicPage?.comic_id,
      slug: (data) => data.comicPage?.slug,
      title: (data) => data.comicPage?.title,
      image: (data) => data.comicPage?.image,
      imageWidth: (data) => data.comicPage?.imageWidth,
      imageHeight: (data) => data.comicPage?.imageHeight,
      alt: (data) => data.comicPage?.alt,
      excerpt: (data) => data.comicPage?.excerpt,
      transcript: (data) => data.comicPage?.transcript,
      commentary: (data) => data.comicPage?.commentary,
      publishedDate: (data) => data.comicPage?.publishedDate,
      comments: (data) => data.comicPage?.comments,
      comic_id: (data) => data.comicPage?.comic_id,
      storyline_id: (data) => data.comicPage?.storyline_id,
      pageNumber: (data) => data.comicPage?.pageNumber,
      prevUrl: (data) => data.comicPage?.prevUrl,
      prevTitle: (data) => data.comicPage?.prevTitle,
      nextUrl: (data) => data.comicPage?.nextUrl,
      nextTitle: (data) => data.comicPage?.nextTitle,
      storylines: (data) => data.comicPage?.storylines,
      firstPageUrl: (data) => data.comicPage?.firstPageUrl,
      prevStorylineUrl: (data) => data.comicPage?.prevStorylineUrl,
      prevStorylineTitle: (data) => data.comicPage?.prevStorylineTitle,
      nextStorylineUrl: (data) => data.comicPage?.nextStorylineUrl,
      nextStorylineTitle: (data) => data.comicPage?.nextStorylineTitle,
    },
  };
}
