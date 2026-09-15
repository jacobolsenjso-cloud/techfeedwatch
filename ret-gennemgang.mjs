// Retter fundene fra gennemgang.mjs i artiklernes markdown (15/9-2026).
//  A) Døde interne links: prøv den oprindelige stavemåde (forbudt-rensen
//     omdøbte "unleashing"→"releasing" osv. inde i adresser); findes målet
//     stadig ikke, fjernes linket og teksten bliver stående.
//  B) FAQ-svar, der har slugt brødteksten (indeholder "## " eller starter
//     med "** "): klippes ved første "##", og lange svar klippes ved sidste
//     punktum før 500 tegn. Tomt svar → spørgsmålet fjernes.
//  C) Rå HTML-tags i brødteksten (<h1>, <article> …) sættes i backticks, så
//     de vises som kode i stedet for at blive til rigtige tags.
//  D) "as stated in the source material" og andre forbudte ord i brødteksten.
// Kør: node ret-gennemgang.mjs [--dry-run]
import fs from 'fs';
import { fjernForbudteOrd } from './src/lib/forbudt.mjs';

const DRY = process.argv.includes('--dry-run');
const DIR = 'src/content/videos';
const slugs = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
const OMVENDT = [[/releasing/g, 'unleashing'], [/releases/g, 'unleashes'], [/release/g, 'unleash'], [/explained/g, 'demystified'], [/solid/g, 'robust']];
const TAGS = /(?<!`)<(\/?(?:h[1-6]|article|section|header|footer|nav|main|aside|title|meta|p|div|span|a|strong|em|ul|ol|li|img|table|head|body|html|script|link))>(?!`)/g;
const stat = { links: 0, linksFjernet: 0, faq: 0, faqFjernet: 0, tags: 0, forbudte: 0, filer: 0 };

for (const slug of slugs) {
  const sti = `${DIR}/${slug}.md`;
  const raw = fs.readFileSync(sti, 'utf8');
  const m = raw.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (!m) continue;
  let [, front, body] = m;

  // A) døde links
  body = body.replace(/\]\(\/video\/([^)\s#?]+?)\/?\)/g, (whole, s) => {
    if (slugs.has(s)) return whole;
    for (const [re, til] of OMVENDT) { const k = s.replace(re, til); if (slugs.has(k)) { stat.links++; return `](/video/${k}/)`; } }
    stat.linksFjernet++;
    return 'FJERN';
  });
  body = body.replace(/\[([^\]]+)\]FJERN/g, '$1');

  // B) FAQ-svar der har slugt artiklen
  front = front.replace(/^( {4}answer: ")(.*)("\s*)$/gm, (whole, a, svar, z) => {
    let s = svar;
    if (!/(^|\s)##\s|^\*\*\s/.test(s)) return whole;
    s = s.split(/\s##\s|^##\s/)[0].replace(/^\*\*\s*/, '').trim();
    if (s.length > 500) { const k = s.slice(0, 500).lastIndexOf('. '); if (k > 80) s = s.slice(0, k + 1); }
    s = s.replace(/\s*\*\*\s*$/, '').trim();
    stat.faq++;
    return s ? `${a}${s}${z}` : 'FAQFJERN';
  });
  front = front.replace(/^ {2}- question: ".*"\r?\nFAQFJERN\r?\n?/gm, () => { stat.faqFjernet++; return ''; });

  // C) rå HTML-tags i brødteksten
  body = body.replace(TAGS, (t) => { stat.tags++; return '`' + t + '`'; });

  // D) forbudte ord (link-adresser er nu beskyttet i forbudt.mjs)
  const renset = fjernForbudteOrd(body);
  if (renset !== body) { stat.forbudte++; body = renset; }

  const ny = front + body;
  if (ny !== raw) { stat.filer++; if (!DRY) fs.writeFileSync(sti, ny, 'utf8'); else console.log('ville rette:', slug); }
}
console.log(`${DRY ? 'TØR KØRSEL — ' : ''}filer ændret: ${stat.filer} · links rettet ${stat.links} · links fjernet ${stat.linksFjernet} · FAQ-svar klippet ${stat.faq} (fjernet ${stat.faqFjernet}) · HTML-tags i backticks ${stat.tags} · forbudte ord renset i ${stat.forbudte} artikler`);
