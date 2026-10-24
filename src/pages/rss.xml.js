import rss from '@astrojs/rss';
import fs from 'node:fs';

// Billede pr. artikel (24/10-2026): Pinterest laver kun pins af feed-punkter med et billede,
// og feedet havde ingen (0/50). Vi bruger artiklens eget delebillede - det samme som
// og:image på artikelsiden (public/og/<slug>.jpg, 1200x630). Mangler filen for en ny
// artikel, springes billedet over i stedet for at stoppe hele byggeriet.
// Absolut adresse: med en relativ adresse kan @astrojs/rss sætte "/" bag på .jpg.
function billede(slug) {
  try {
    const length = fs.statSync(`public/og/${slug}.jpg`).size;
    return { url: `https://techfeedwatch.com/og/${slug}.jpg`, length, type: 'image/jpeg' };
  } catch {
    return undefined;
  }
}

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
      enclosure: billede(p.slug),
    }));

  return rss({
    title: 'TechFeedWatch',
    description: 'Straight answers to the questions people search for about AI, tech, fintech and crypto, in plain language. Updated daily.',
    site: context.site,
    items,
    customData: `<language>en-us</language>`,
  });
}
