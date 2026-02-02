/**
 * Bike Tour blog posts - loaded from extracted content.
 * Run: node scripts/extract-modeling-and-bike-tour.js
 */

export interface BikeTourPost {
  slug: string;
  title: string;
  date: string;
  content: string;
  images: { url: string; filename: string }[];
}

import postsData from './bike-tour-posts.json';
import prologueData from './bike-tour-prologue.json';

function loadPosts(): BikeTourPost[] {
  return postsData as BikeTourPost[];
}

/** Convert WordPress [caption] shortcodes to HTML figure elements. Layout (tiled vs full-width) is driven by CSS based on consecutiveness. */
function convertCaptionShortcodes(html: string): string {
  return html.replace(
    /\[caption\s+[^\]]*width="(\d+)"[^\]]*\]\s*(<img[^>]*\/>)\s*([\s\S]*?)\s*\[\/caption\]/gi,
    (_match, _width, imgTag, captionText) => {
      const caption = captionText.trim();
      return `<figure class="blog-caption">${imgTag}${caption ? `<figcaption class="blog-caption-text">${caption}</figcaption>` : ''}</figure>`;
    }
  );
}

/** Wrap raw img tags in figure elements so they get the same consecutive tiling as captioned images. */
function wrapRawImages(html: string): string {
  const parts = html.split(/(<figure[\s\S]*?<\/figure>)/);
  return parts
    .map((part) =>
      part.startsWith('<figure')
        ? part
        : part.replace(/<img([^>]*)\s*\/?>/gi, '<figure class="blog-caption"><img$1/></figure>')
    )
    .join('');
}

function processPosts(posts: BikeTourPost[]): BikeTourPost[] {
  return posts.map((post) => {
    let content = post.content;
    content = convertCaptionShortcodes(content);
    content = wrapRawImages(content);
    for (const img of post.images) {
      const urlBase = img.url.split('?')[0];
      const localPath = `/img/bike-tour/${img.filename}`;
      content = content.replace(new RegExp(escapeRegExp(urlBase) + '(\\?[^"\\s]*)?', 'g'), localPath);
    }
    return { ...post, content };
  });
}

/** Ancient blogs: entries up through "Other post ideas." (Dec 5, 2014) */
export function getAncientBlogPosts(): BikeTourPost[] {
  const posts = loadPosts();
  const splitIndex = posts.findIndex((p) => p.title === 'Do what scares you.');
  const ancientPosts = splitIndex >= 0 ? posts.slice(0, splitIndex) : posts;
  return processPosts(ancientPosts);
}

/** 2015 Bike Tour: "Do what scares you." (Dec 5, 2014) and newer */
export function getBikeTour2015Posts(): BikeTourPost[] {
  const posts = loadPosts();
  const splitIndex = posts.findIndex((p) => p.title === 'Do what scares you.');
  const bikeTourPosts = splitIndex >= 0 ? posts.slice(splitIndex) : [];
  return processPosts(bikeTourPosts);
}

export interface BikeTourProloguePage {
  slug: string;
  title: string;
  content: string;
  images: { url: string; filename: string }[];
}

/** What, Where, How prologue pages for the 2015 Bike Tour */
export function getBikeTourProloguePages(): BikeTourProloguePage[] {
  const pages = prologueData as BikeTourProloguePage[];
  return pages.map((page) => ({
    ...page,
    content: wrapRawImages(convertCaptionShortcodes(page.content)),
  }));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
