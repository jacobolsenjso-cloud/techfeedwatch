import type { APIRoute } from 'astro';

// Video-sitemap efter Googles specifikation. Det almindelige sitemap kan ikke
// bære video-udvidelser — @astrojs/sitemap's serialize() eksponerer kun url,
// lastmod, changefreq, priority og links — så vi laver denne selv og hænger den
// ind i sitemap-indekset via customSitemaps i astro.config.mjs.
//
// Google kræver: thumbnail_loc, title, description og enten content_loc eller
// player_loc. Resten er valgfrit, men hjælper.

const SITE = 'https://techfeedwatch.com';

const allVideos = Object.values(import.meta.glob('../content/videos/*.md', { eager: true }));

// "7:59" og "1:02:03" -> sekunder. Google accepterer 1-28800.
function toSeconds(duration: string): number | null {
  if (!duration) return null;
  const parts = duration.split(':').map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  let s = 0;
  for (const p of parts) s = s * 60 + p;
  return s > 0 && s <= 28800 ? s : null;
}

// & < > " ' skal escapes — artikeltitler indeholder ofte ampersand
const esc = (str: string) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Beskrivelsen må højst være 2048 tegn
const clamp = (str: string, max = 2000) => {
  const s = (str || '').trim().replace(/\s+/g, ' ');
  return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, '') + '…';
};

export const GET: APIRoute = () => {
  const entries = allVideos
    .map((v: any) => {
      const fm = v.frontmatter || {};
      const slug = v.file.split('/').pop().replace('.md', '');
      return { slug, fm };
    })
    // Shorts er nedlagt, men filteret bliver stående så et gensyn ikke smutter med
    .filter(({ fm }) => !fm.isShort && fm.youtubeId && fm.title)
    .sort((a, b) => new Date(b.fm.date).valueOf() - new Date(a.fm.date).valueOf());

  const urls = entries.map(({ slug, fm }) => {
    const seconds = toSeconds(fm.duration);
    const published = fm.publishedAt || (fm.date ? new Date(fm.date).toISOString() : null);

    return [
      '  <url>',
      `    <loc>${SITE}/video/${slug}/</loc>`,
      '    <video:video>',
      `      <video:thumbnail_loc>https://img.youtube.com/vi/${esc(fm.youtubeId)}/maxresdefault.jpg</video:thumbnail_loc>`,
      `      <video:title>${esc(clamp(fm.title, 100))}</video:title>`,
      `      <video:description>${esc(clamp(fm.summary || fm.title))}</video:description>`,
      `      <video:player_loc>https://www.youtube-nocookie.com/embed/${esc(fm.youtubeId)}</video:player_loc>`,
      seconds ? `      <video:duration>${seconds}</video:duration>` : null,
      published ? `      <video:publication_date>${published}</video:publication_date>` : null,
      fm.channelTitle ? `      <video:uploader>${esc(clamp(fm.channelTitle, 100))}</video:uploader>` : null,
      '      <video:family_friendly>yes</video:family_friendly>',
      '      <video:live>no</video:live>',
      '    </video:video>',
      '  </url>',
    ].filter(Boolean).join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    ...urls,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
