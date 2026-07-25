import type { APIRoute } from 'astro';

const allVideos = Object.values(import.meta.glob('../content/videos/*.md', { eager: true }));

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
        summary: video.frontmatter.summary || '',
        tags,
      };
    })
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  return new Response(JSON.stringify(videos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
