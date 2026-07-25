import rss from '@astrojs/rss';

const posts = Object.values(import.meta.glob('../content/videos/*.md', { eager: true }));

export function GET(context) {
  const items = posts
    .filter((p) => !p.frontmatter.isShort)
    .map((p) => ({ ...p, slug: p.file.split('/').pop().replace('.md', '') }))
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    .slice(0, 50)
    .map((p) => ({
      title: p.frontmatter.title,
      pubDate: new Date(p.frontmatter.date),
      description: p.frontmatter.metaDescription || p.frontmatter.summary || '',
      link: `/video/${p.slug}/`,
    }));

  return rss({
    title: 'Tech Feed Watch',
    description: 'Independent analysis of AI, tech, fintech, and crypto - a new article every few hours.',
    site: context.site,
    items,
    customData: `<language>en-us</language>`,
  });
}
