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

// Emnefarverne ét sted. Før lå den samme tabel kopieret i otte sider, så en
// farveændring skulle laves otte gange — og blev det ikke, var siderne uenige.
// Farven bruges som --tag-accent (chips, prikker, eyebrow) og --accent (guide-kort).
// Mørk tilstand: MainLayout lysner Fintech (#1e3a8a), som ellers forsvinder på sort.
export const TAG_COLORS: Record<string, string> = {
  "AI & Tech": "#06b6d4",
  "SEO": "#6366f1",
  "Automation": "#14b8a6",
  "Coding": "#2563eb",
  "Business & Money": "#059669",
  "AI Video": "#d926c8",
  "Productivity": "#8b5cf6",
  "Fintech": "#1e3a8a",
  "Crypto": "#f59e0b",
  "Cybersecurity": "#dc2626",
  "Quantum Computing": "#7c3aed",
  "Hardware & Chips": "#ea580c",
  "AR & VR": "#db2777",
};
