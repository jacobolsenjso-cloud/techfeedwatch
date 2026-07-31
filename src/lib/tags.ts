// Fælles tag-slug. Ét sted, så tag-URL'er ikke kan komme ud af sync mellem
// getStaticPaths og de links der peger på dem.
//
// Tidligere brugte vi kun .replace(/\s+/g, '-'), hvilket lod '&' stå råt i
// URL'en: /tag/ai-&-tech. Nu strippes alt der ikke er a-z eller 0-9:
//   "AI & Tech"        -> "ai-tech"
//   "Business & Money" -> "business-money"
//   "Cybersecurity"    -> "cybersecurity"
export const tagSlug = (tag: string): string =>
  String(tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Den gamle slug-form. Bruges til at generere 301-redirects i _redirects,
// så tidligere delte/indekserede tag-URL'er ikke ender i 404.
export const legacyTagSlug = (tag: string): string =>
  String(tag).toLowerCase().replace(/\s+/g, '-');
