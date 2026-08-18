import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, 'src/content/videos');

// Bygger et sæt af Short-slugs (isShort: true), så deres noindex'ede /video/{slug}-URL'er
// kan udelukkes fra XML-sitemappet. Læses direkte fra frontmatter, da sitemap-integrationen
// kun ser den færdige URL, ikke video-collectionens data.
const shortSlugs = new Set(
  fs.readdirSync(videosDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => /isShort:\s*true/.test(fs.readFileSync(path.join(videosDir, file), 'utf-8')))
    .map((file) => file.replace(/\.md$/, ''))
);

// --- Auto-glossar-links: byg term -> slug-kort fra glossar-filerne (læses ved build-tid) ---
//
// Hvert opslag kan have et aliases-felt med de skrivemåder artiklerne faktisk
// bruger. Uden det matchede kun den fulde term: opslaget "Large Language Model"
// fandtes, men de 33 artikler der skriver "LLM" linkede ingen steder. Et alias
// koster én linje og forbinder flere artikler end et helt nyt opslag ville.
const glossaryDir = path.join(__dirname, 'src/content/glossary');
const glossaryTerms = fs.existsSync(glossaryDir)
  ? fs.readdirSync(glossaryDir)
      .filter((f) => f.endsWith('.md'))
      .flatMap((f) => {
        const c = fs.readFileSync(path.join(glossaryDir, f), 'utf-8');
        const term = (c.match(/term:\s*"(.*?)"/) || [])[1];
        const slug = (c.match(/slug:\s*"(.*?)"/) || [])[1];
        if (!term || !slug) return [];
        // aliases: ["LLM", "LLMs"] — valgfri liste på én linje
        const raw = (c.match(/aliases:\s*\[(.*?)\]/) || [])[1] || '';
        const aliases = raw.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
        return [{ term, slug }, ...aliases.map((a) => ({ term: a, slug }))];
      })
      // Længste termer først, så fx "Machine Learning" vinder over kortere delmatch
      .sort((a, b) => b.term.length - a.term.length)
  : [];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Rehype-plugin: linker første forekomst af hvert glossar-ord i videoer/guides (ikke i selve glossaret).
function rehypeGlossaryLinks() {
  const SKIP = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style']);
  const MAX_LINKS = 8;
  return (tree, file) => {
    const src = (file && (file.path || (file.history && file.history[0]))) || '';
    if (!/[\\/]content[\\/](videos|guides)[\\/]/.test(src)) return;
    if (glossaryTerms.length === 0) return;
    const remaining = glossaryTerms.map((t) => ({ ...t, re: new RegExp('\\b' + escapeRegExp(t.term) + '\\b', 'i') }));
    let linked = 0;

    const tryLinkText = (value) => {
      if (!remaining.length) return null;
      let best = null;
      for (const t of remaining) {
        const m = t.re.exec(value);
        if (m && (best === null || m.index < best.index)) best = { index: m.index, matched: m[0], slug: t.slug, term: t.term };
      }
      if (!best) return null;
      // Fjern ALLE skrivemåder der peger på samme opslag, ikke kun den der ramte.
      // Ellers ville en artikel der bruger både "Large Language Model" og "LLM"
      // få to links til den samme side.
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (remaining[i].slug === best.slug) remaining.splice(i, 1);
      }
      const before = value.slice(0, best.index);
      const after = value.slice(best.index + best.matched.length);
      const nodes = [];
      if (before) nodes.push({ type: 'text', value: before });
      nodes.push({
        type: 'element', tagName: 'a',
        properties: { href: `/glossary/${best.slug}`, className: ['glossary-link'] },
        children: [{ type: 'text', value: best.matched }],
      });
      if (after) nodes.push({ type: 'text', value: after });
      return nodes;
    };

    const walk = (node) => {
      if (linked >= MAX_LINKS) return;
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        if (linked >= MAX_LINKS) return;
        const child = node.children[i];
        if (child.type === 'element') {
          if (SKIP.has(child.tagName)) continue;
          walk(child);
        } else if (child.type === 'text') {
          const replacement = tryLinkText(child.value);
          if (replacement) {
            node.children.splice(i, 1, ...replacement);
            i += replacement.length - 1;
            linked++;
          }
        }
      }
    };

    try { walk(tree); } catch (e) { /* aldrig lade et link-fejl vælte hele buildet */ }
  };
}

// Remark-plugin: beregner læsetid (ord / 200 wpm) og lægger den i frontmatter som minutesRead
function remarkReadingTime() {
  return (tree, file) => {
    let text = '';
    const visit = (node) => {
      if (node.type === 'text' || node.type === 'inlineCode') text += node.value + ' ';
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    file.data.astro = file.data.astro || {};
    file.data.astro.frontmatter = file.data.astro.frontmatter || {};
    file.data.astro.frontmatter.minutesRead = minutes;
  };
}

export default defineConfig({
  site: 'https://techfeedwatch.com',
  markdown: {
    // Astro 6.4+: rehype/remark-plugins sættes via unified()-processoren
    processor: unified({
      remarkPlugins: [remarkReadingTime],
      rehypePlugins: [rehypeGlossaryLinks],
    }),
  },
  integrations: [
    sitemap({
      // Video-sitemappet laves i src/pages/video-sitemap.xml.ts, fordi denne
      // integration ikke kan bære video-udvidelser. Her hænges det ind i
      // indekset, så Google finder det gennem den ene adresse vi indsender.
      customSitemaps: ['https://techfeedwatch.com/video-sitemap.xml'],
      filter: (page) => {
        const pathname = new URL(page).pathname;
        // Sider der bevidst er noindex hører ikke hjemme i sitemappet — Google
        // advarer om det i Search Console. /offline vises kun af service
        // workeren; history og watch-later er personlige og bor i browseren.
        // /search har ingen tekst uden JS. Paginering fra side 2 og frem er
        // rene lister på 130-160 ord — 40 tynde sider i indekset uden grund.
        if (/^\/(offline|history|watch-later|search)\/?$/.test(pathname)) return false;
        if (/\/page\/\d+\/?$/.test(pathname)) return false;
        const match = pathname.match(/^\/video\/([^/]+)\/?$/);
        return match ? !shortSlugs.has(match[1]) : true;
      },
    }),
  ],
});