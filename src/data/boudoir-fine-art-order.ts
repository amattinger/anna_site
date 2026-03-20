/**
 * Boudoir & Fine Art gallery — order and visibility (same idea as work-order.ts).
 * - List slugs in display order (top = first). Slugs must match filenames in src/content/work/
 *   without the .md extension.
 * - Remove a slug from this array to hide that piece from the Boudoir & Fine Art page only.
 * - Keep non-nude / portrait-only pieces in work-order.ts; list nude or sensitive work here.
 */
export const BOUDOIR_FINE_ART_ORDER: string[] = [
  // Example: 'columbarium-blue',
];
