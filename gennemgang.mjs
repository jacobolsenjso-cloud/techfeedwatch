// Den store gennemgang (opgave 3 af 3, 15/9-2026): måler ALLE sider i dist/.
// Læser kun. Skriver _gennemgang.md (læsbar) og _gennemgang.json (til scripts).
//
// Måler pr. side: <title> (findes, længde), meta description (findes, 50-160),
// canonical, præcis én H1, JSON-LD kan parses, og:image, forældede ord,
// døde interne links (href der hverken er en fil i dist/ eller en redirect),
// tynde sider (få ord i <main>), og om menu/footer er ens på alle sider.
//
// Kør: npm run build && node gennemgang.mjs
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const FORAELDET = [
  /watch later/i, /video library/i, /video archive/i, /videos in #/i, /previous video|next video/i,
  /skip the video/i, /four are published a day/i, /founder & editor/i, /fact-checking/i,
  /summary of someone else/i, /new videos added/i, /videos free to watch/i, /save videos to watch/i,
  /as stated in the source material/i, /in today's digital age/i, /is a testament to/i,
  /\bCONTENT:/, /\bTITLE:/, /\bMETA:/, /\bFAQ:\s*$/m,
];

// Alle html-filer → url
const filer = [];
(function gaa(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) gaa(p); else if (e.name.endsWith('.html')) filer.push(p); } })(DIST);
const urlAf = (f) => '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
const findes = new Set(filer.map(urlAf).flatMap((u) => [u, u.replace(/\/$/, ''), u.endsWith('/') ? u : u + '/']));
// Redirect-kilder (kun statiske)
const redirects = new Set(fs.readFileSync('public/_redirects', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]).filter((s) => !s.includes('*')));
// Statiske filer (billeder, feeds, osv.)
const statisk = (u) => { const p = path.join(DIST, u.split(/[?#]/)[0]); return fs.existsSync(p) && fs.statSync(p).isFile(); };

const tekst = (h) => h.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const sidetype = (u) => u.startsWith('/video/') ? 'artikel' : u.startsWith('/tag/') ? 'emne' : u.startsWith('/tools/') ? 'værktøj' : u.startsWith('/glossary/') ? 'glossar' : u.startsWith('/guides/') ? 'guide' : u.startsWith('/archive/') ? 'arkiv' : u.startsWith('/page/') ? 'forside-side' : u.startsWith('/author/') ? 'forfatter' : 'side';

const fund = []; const menuer = new Map(); const footere = new Map(); const pr = { type: {}, };
for (const f of filer) {
  const u = urlAf(f); const h = fs.readFileSync(f, 'utf8'); const t = sidetype(u);
  pr.type[t] = (pr.type[t] || 0) + 1;
  const fejl = (kode, detalje) => fund.push({ url: u, type: t, kode, detalje });
  const title = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  if (!title) fejl('title-mangler', ''); else if (title.length > 70) fejl('title-lang', `${title.length} tegn: ${title}`);
  const meta = h.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || h.match(/<meta\s+content="([^"]*)"\s+name="description"/i)?.[1] || '';
  if (!meta) fejl('meta-mangler', ''); else if (meta.length < 50) fejl('meta-kort', `${meta.length} tegn: ${meta}`); else if (meta.length > 165) fejl('meta-lang', `${meta.length} tegn`);
  if (!/<link\s+rel="canonical"/i.test(h)) fejl('canonical-mangler', '');
  const h1 = (h.match(/<h1[\s>]/gi) || []).length; if (h1 !== 1) fejl('h1-antal', String(h1));
  if (!/property="og:image"/i.test(h)) fejl('og-image-mangler', '');
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { JSON.parse(m[1]); } catch (e) { fejl('jsonld-ugyldig', e.message.slice(0, 60)); } }
  const main = h.match(/<main[\s\S]*?<\/main>/i)?.[0] || h.match(/<article[\s\S]*?<\/article>/i)?.[0] || '';
  const mainTekst = tekst(main);
  const ord = mainTekst.split(' ').filter(Boolean).length;
  if (t === 'artikel' && ord < 250) fejl('tynd-artikel', `${ord} ord`);
  if (t !== 'artikel' && ord < 40) fejl('tynd-side', `${ord} ord`);
  const synlig = tekst(h);
  for (const re of FORAELDET) { const m = synlig.match(re); if (m) fejl('forældet-ord', `"${m[0]}"`); }
  if (/\*\*[^*]{3,}\*\*/.test(mainTekst) || /(^|\s)##\s/.test(mainTekst)) fejl('raa-markdown', mainTekst.match(/\*\*[^*]{3,}\*\*|(^|\s)##\s[^.]{0,40}/)?.[0]);
  // Links måles i HTML uden <script> — ellers tælles JavaScript-skabeloner ('/video/' + slug) som links.
  const hUdenScript = h.replace(/<script[\s\S]*?<\/script>/gi, '');
  for (const m of hUdenScript.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1]; if (href.startsWith('//')) continue;
    if (findes.has(href) || redirects.has(href) || redirects.has(href.replace(/\/$/, '')) || statisk(href)) continue;
    fejl('dødt-link', href);
  }
  const nav = tekst(h.match(/<nav[\s\S]*?<\/nav>/i)?.[0] || ''); const foot = tekst(h.match(/<footer[\s\S]*?<\/footer>/i)?.[0] || '');
  menuer.set(nav, (menuer.get(nav) || []).concat(u)); footere.set(foot, (footere.get(foot) || []).concat(u));
}

// Opsummering
const prKode = {};
for (const x of fund) (prKode[x.kode] ||= []).push(x);
const linjer = [`# Den store gennemgang — ${new Date().toISOString().slice(0, 10)}`, '', `Sider målt: ${filer.length} (${Object.entries(pr.type).map(([k, v]) => `${k} ${v}`).join(' · ')})`, '', `Fund i alt: ${fund.length}`, ''];
for (const [kode, liste] of Object.entries(prKode).sort((a, b) => b[1].length - a[1].length)) {
  linjer.push(`## ${kode} (${liste.length})`, '');
  const grupper = {}; for (const x of liste) (grupper[x.detalje] ||= []).push(x.url);
  const sorteret = Object.entries(grupper).sort((a, b) => b[1].length - a[1].length);
  for (const [detalje, urls] of sorteret.slice(0, 40)) linjer.push(`- ${detalje || '(ingen detalje)'} — ${urls.length} side(r): ${urls.slice(0, 3).join(', ')}${urls.length > 3 ? ' …' : ''}`);
  if (sorteret.length > 40) linjer.push(`- … og ${sorteret.length - 40} varianter mere`);
  linjer.push('');
}
linjer.push(`## Menu-varianter (${menuer.size})`, '');
for (const [nav, urls] of [...menuer.entries()].sort((a, b) => b[1].length - a[1].length)) linjer.push(`- ${urls.length} sider — fx ${urls.slice(0, 2).join(', ')}: "${nav.slice(0, 120)}"`);
linjer.push('', `## Footer-varianter (${footere.size})`, '');
for (const [foot, urls] of [...footere.entries()].sort((a, b) => b[1].length - a[1].length)) linjer.push(`- ${urls.length} sider — fx ${urls.slice(0, 2).join(', ')}: "${foot.slice(0, 160)}"`);
fs.writeFileSync('_gennemgang.md', linjer.join('\n'), 'utf8');
fs.writeFileSync('_gennemgang.json', JSON.stringify(fund, null, 1), 'utf8');
console.log(linjer.slice(0, 6).join('\n'));
console.log(Object.entries(prKode).map(([k, v]) => `${k}: ${v.length}`).join('\n'));
console.log(`Menu-varianter: ${menuer.size} · Footer-varianter: ${footere.size}`);
console.log('Skrevet: _gennemgang.md, _gennemgang.json');
