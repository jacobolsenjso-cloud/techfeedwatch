import type { APIRoute } from 'astro';
import { TOOLS, TOOL_CATEGORIES } from '../lib/tools';
import { tagSlug } from '../lib/tags';

// Søgeindeks for alt det på sitet, der IKKE er en artikel: værktøjer,
// værktøjskategorier, glossar, guides, emnesider og de faste hovedsider.
//
// Hvorfor (24/9-2026): Jacob søgte på "Hreflang Generator" og fik 0 resultater,
// selv om værktøjet findes. Søgningen kiggede kun i /videos.json. Målt samme dag:
// søger man på titlen af en af de 118 ikke-artikel-sider (40 værktøjssider,
// 56 glossaropslag, 9 guides, 13 emnesider), kommer siden selv aldrig frem.
//
// Filen bygges fra de samme kilder som siderne selv (tools.ts og content-
// mapperne), så et nyt værktøj eller et nyt glossarord kommer med af sig selv.
// Både søgesiden og forslagslisten i toppen læser den.

const glossar = Object.values(import.meta.glob('../content/glossary/*.md', { eager: true })) as any[];
const guides = Object.values(import.meta.glob('../content/guides/*.md', { eager: true })) as any[];
const videos = Object.values(import.meta.glob('../content/videos/*.md', { eager: true })) as any[];

const liste = (v: any): string[] => (Array.isArray(v) ? v : [v]).filter(Boolean);

// Samme udvælgelse af emner som src/pages/tag/[tag].astro, så der kun er
// adresser med, som faktisk bliver bygget.
const emner = [...new Set(videos.flatMap((v) => liste(v.frontmatter.tags || v.frontmatter.tag)))].sort();

// Faste hovedsider, man kunne finde på at søge efter ved navn.
// `text` er kun til at matche søgeord; `desc` er det, der vises.
const HOVEDSIDER = [
  { title: 'All free tools', text: 'tools calculators generators converters', url: '/tools/', icon: '🧰' },
  { title: 'Glossary', text: 'glossary definitions terms dictionary', url: '/glossary/', icon: '📖' },
  { title: 'Guides', text: 'guides overview topics', url: '/guides/', icon: '🧭' },
  { title: 'Trends', text: 'trends trending topics', url: '/trends/', icon: '📈' },
  { title: 'Library', text: 'library all articles videos', url: '/library/', icon: '📚' },
  { title: 'Start here', text: 'start here new about the site', url: '/start-here/', icon: '👋' },
  { title: 'About', text: 'about us who editorial', url: '/about/', icon: 'ℹ️' },
  { title: 'Contact', text: 'contact email', url: '/contact/', icon: '✉️' },
];

export const GET: APIRoute = () => {
  const sider = [
    ...TOOLS.map((t) => ({ type: 'Tool', icon: t.icon, title: t.title, text: `${t.short} ${t.description}`, desc: t.description, url: `/tools/${t.slug}/` })),
    ...TOOL_CATEGORIES.map((c) => ({ type: 'Tools', icon: c.icon, title: c.heading, text: `${c.name} ${c.description}`, desc: c.description, url: `/tools/${c.slug}/` })),
    ...glossar.map((g) => ({
      type: 'Glossary', icon: '📖', title: g.frontmatter.term,
      text: [...liste(g.frontmatter.aliases), g.frontmatter.definition].join(' '),
      desc: g.frontmatter.definition,
      url: `/glossary/${g.frontmatter.slug}/`,
    })),
    ...guides.map((g) => ({
      type: 'Guide', icon: '🧭', title: g.frontmatter.title,
      text: `${liste(g.frontmatter.tags).join(' ')} ${g.frontmatter.description || ''}`,
      desc: g.frontmatter.description || '',
      url: `/guides/${g.frontmatter.slug}/`,
    })),
    ...emner.map((tag) => ({ type: 'Topic', icon: '#', title: tag, text: `${tag} articles topic`, desc: `All articles tagged ${tag}.`, url: `/tag/${tagSlug(tag)}/` })),
    ...HOVEDSIDER.map((s) => ({ type: 'Page', ...s })),
  ];
  return new Response(JSON.stringify(sider), { headers: { 'Content-Type': 'application/json' } });
};
