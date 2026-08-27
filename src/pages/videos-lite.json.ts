import type { APIRoute } from 'astro';

// Slankt videokatalog til klokke-badge, emne-filter, cinema-browser, historik
// og watch-later. Målt 27/8: summary-feltet fyldte 216 af 297 KiB rå JSON i
// /videos.json, og PageSpeed viste kataloget som den tungeste post i forsidens
// kritiske kæde (2,7 s på langsom 4G). Kortene viser kun de første 145 tegn af
// resuméet — så det er alt lite-udgaven bærer. Feltet HEDDER stadig summary,
// så al klientkode virker uændret. Søgesiden bruger fortsat /videos.json
// (fulde resuméer til match og visning).
const allVideos = Object.values(import.meta.glob('../content/videos/*.md', { eager: true }));

const EXCERPT = 145;
const udpluk = (s: string) => {
  const t = (s || '').trim();
  if (t.length <= EXCERPT) return t;
  return t.slice(0, EXCERPT).replace(/\s+\S*$/, '').trim() + '…';
};

export const GET: APIRoute = () => {
  const videos = allVideos
    .map((video: any) => {
      const t = video.frontmatter.tags || video.frontmatter.tag || [];
      const tags = (Array.isArray(t) ? t : [t]).filter(Boolean);

      return {
        slug: video.file.split('/').pop().replace('.md', ''),
        title: video.frontmatter.title,
        youtubeId: video.frontmatter.youtubeId,
        date: video.frontmatter.date,
        duration: video.frontmatter.duration,
        isShort: video.frontmatter.isShort,
        summary: udpluk(video.frontmatter.summary),
        // Kildeangivelse, så klient-renderede kort kan kreditere den rigtige kanal
        channelTitle: video.frontmatter.channelTitle || '',
        tags,
      };
    })
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  return new Response(JSON.stringify(videos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
