// Schema Validator-motoren (24/10-2026). Kører i browseren og i node (test).
// Kravene er Googles krav til "rich results" for de almindelige typer - hentet fra
// developers.google.com 24/10-2026 (SoftwareApplication og VideoObject slået op samme dag).
// Det er IKKE Googles officielle validator; siden henviser til Rich Results Test.

// p = påkrævet (fejl hvis den mangler), a = anbefalet (advarsel), en = mindst én af.
const KRAV = {
  Article: { a: ['headline', 'image', 'datePublished', 'author'] },
  NewsArticle: { a: ['headline', 'image', 'datePublished', 'author'] },
  BlogPosting: { a: ['headline', 'image', 'datePublished', 'author'] },
  VideoObject: { p: ['name', 'thumbnailUrl', 'uploadDate'], a: ['description', 'duration', 'contentUrl|embedUrl'] },
  SoftwareApplication: { p: ['name', 'offers.price'], en: [['aggregateRating', 'review']], a: ['applicationCategory', 'operatingSystem'] },
  Product: { p: ['name'], en: [['offers', 'review', 'aggregateRating']] },
  FAQPage: { p: ['mainEntity'] },
  BreadcrumbList: { p: ['itemListElement'] },
  Recipe: { p: ['name', 'image'] },
  Event: { p: ['name', 'startDate', 'location'] },
  LocalBusiness: { p: ['name', 'address'] },
  JobPosting: { p: ['title', 'description', 'datePosted', 'hiringOrganization'] },
  Organization: { a: ['name', 'url', 'logo'] },
  WebSite: { a: ['name', 'url'] },
};
const DATOFELTER = ['datePublished', 'dateModified', 'uploadDate', 'startDate', 'endDate', 'datePosted', 'validThrough', 'expires'];
const URLFELTER = ['url', 'logo', 'thumbnailUrl', 'contentUrl', 'embedUrl', 'sameAs'];
const KENDTE = Object.keys(KRAV).concat(['Person', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ItemList', 'ListItem', 'Question', 'Answer', 'ImageObject', 'Offer', 'AggregateRating', 'Review', 'Rating', 'PostalAddress', 'Place', 'Thing', 'CreativeWork', 'SearchAction', 'EntryPoint', 'HowTo', 'NewsMediaOrganization', 'DefinedTerm', 'DefinedTermSet', 'Course', 'Book', 'Movie', 'MusicRecording', 'Dataset', 'QAPage', 'ProfilePage', 'Clip', 'BroadcastEvent', 'InteractionCounter', 'MonetaryAmount', 'Brand', 'Country']);

// Henter JSON-LD-blokke fra indsat tekst: rå JSON, et <script>-tag eller en hel HTML-side.
export function udtraekBlokke(tekst, parseHtml) {
  const t = String(tekst || '').trim();
  if (!t) return [];
  if (/<script[^>]*application\/ld\+json/i.test(t)) {
    const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
    return [...t.matchAll(re)].map((m) => m[1].trim());
  }
  if (/^\s*</.test(t) && parseHtml) return [];
  return [t];
}

// Linje og kolonne ud fra "position N" i JSON-fejlbeskeden.
function fejlSted(tekst, besked) {
  const m = String(besked).match(/position (\d+)/i);
  if (!m) return '';
  const pos = Number(m[1]);
  const foer = tekst.slice(0, pos).split('\n');
  return ` (line ${foer.length}, column ${foer[foer.length - 1].length + 1})`;
}

const typer = (node) => [].concat(node && node['@type'] ? node['@type'] : []);
const har = (node, sti) => sti.split('|').some((alt) => {
  let v = node;
  for (const del of alt.split('.')) { v = Array.isArray(v) ? v[0] : v; if (v == null || !(del in Object(v))) return false; v = v[del]; }
  return v !== '' && v != null && !(Array.isArray(v) && !v.length);
});

function tjekNode(node, fund, sti, dybde = 0) {
  const navn = typer(node).join(', ') || '(no @type)';
  if (!node['@type']) fund.push({ niveau: 'fejl', sti, tekst: 'Missing @type - Google cannot tell what this describes.' });
  for (const t of typer(node)) {
    if (!KENDTE.includes(t)) {
      const rettet = KENDTE.find((k) => k.toLowerCase() === String(t).toLowerCase());
      fund.push(rettet
        ? { niveau: 'fejl', sti, tekst: `@type "${t}" should be "${rettet}" - types are case-sensitive.` }
        : { niveau: 'info', sti, tekst: `@type "${t}" is not in this checker's list. It may still be valid schema.org - check spelling.` });
    }
    if (t === 'HowTo') fund.push({ niveau: 'advarsel', sti, tekst: 'Google stopped showing HowTo rich results in 2023. The markup is harmless but earns nothing in Google.' });
    if (t === 'FAQPage') fund.push({ niveau: 'info', sti, tekst: 'Since August 2023 Google shows FAQ rich results only for well-known government and health sites. The markup can still help other search and AI systems.' });
    const k = KRAV[t];
    if (!k) continue;
    for (const p of k.p || []) if (!har(node, p)) fund.push({ niveau: 'fejl', sti, tekst: `${t}: required property "${p.replace('|', '" or "')}" is missing.` });
    for (const gruppe of k.en || []) if (!gruppe.some((p) => har(node, p))) fund.push({ niveau: 'fejl', sti, tekst: `${t}: needs at least one of ${gruppe.map((p) => `"${p}"`).join(', ')}.` });
    // Anbefalede felter kun på hovedobjekter - et indlejret objekt (fx udgiveren i en
    // artikel) får ellers advarsler, der intet betyder for resultatet i Google.
    if (dybde === 0) for (const a of k.a || []) if (!har(node, a)) fund.push({ niveau: 'advarsel', sti, tekst: `${t}: recommended property "${a.replace('|', '" or "')}" is missing.` });
    if (t === 'BreadcrumbList' && Array.isArray(node.itemListElement)) {
      node.itemListElement.forEach((li, i) => {
        if (li.position == null) fund.push({ niveau: 'fejl', sti, tekst: `Breadcrumb item ${i + 1}: "position" is missing.` });
        if (!li.name && !(li.item && li.item.name)) fund.push({ niveau: 'fejl', sti, tekst: `Breadcrumb item ${i + 1}: "name" is missing.` });
        if (!li.item && i < node.itemListElement.length - 1) fund.push({ niveau: 'fejl', sti, tekst: `Breadcrumb item ${i + 1}: "item" (the URL) is missing - only the last item may leave it out.` });
      });
    }
    if (t === 'FAQPage') {
      [].concat(node.mainEntity || []).forEach((q, i) => {
        if (!q.name) fund.push({ niveau: 'fejl', sti, tekst: `FAQ question ${i + 1}: "name" (the question) is missing.` });
        if (!(q.acceptedAnswer && q.acceptedAnswer.text)) fund.push({ niveau: 'fejl', sti, tekst: `FAQ question ${i + 1}: "acceptedAnswer.text" is missing.` });
      });
    }
  }
  for (const f of DATOFELTER) if (typeof node[f] === 'string' && (!/^\d{4}-\d{2}-\d{2}/.test(node[f]) || isNaN(Date.parse(node[f])))) {
    fund.push({ niveau: 'fejl', sti, tekst: `"${f}" is "${node[f]}" - use ISO 8601, e.g. 2026-10-24 or 2026-10-24T09:30:00+02:00.` });
  }
  for (const f of URLFELTER) for (const v of [].concat(node[f] || [])) {
    if (typeof v === 'string' && !/^https?:\/\//i.test(v)) fund.push({ niveau: 'advarsel', sti, tekst: `"${f}" is "${v}" - use a full URL starting with https://.` });
  }
  if (typeof node.duration === 'string' && !/^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/.test(node.duration)) {
    fund.push({ niveau: 'fejl', sti, tekst: `"duration" is "${node.duration}" - use ISO 8601, e.g. PT4M35S for 4 min 35 s.` });
  }
  return navn;
}

// Går alle noder igennem (@graph, lister og indlejrede objekter med @type).
function besoeg(v, fund, sti, navne, dybde = 0) {
  if (Array.isArray(v)) { v.forEach((x, i) => besoeg(x, fund, `${sti}[${i}]`, navne, dybde)); return; }
  if (!v || typeof v !== 'object') return;
  if (v['@graph']) { besoeg(v['@graph'], fund, `${sti}.@graph`, navne, dybde); }
  if (v['@type']) navne.push({ navn: tjekNode(v, fund, sti || 'root', dybde), dybde });
  for (const [k, x] of Object.entries(v)) if (k !== '@graph' && x && typeof x === 'object') besoeg(x, fund, `${sti}.${k}`, navne, dybde + 1);
}

export function valider(blok) {
  const fund = [];
  let data;
  try { data = JSON.parse(blok); }
  catch (e) { return { ok: false, fund: [{ niveau: 'fejl', sti: '', tekst: `Not valid JSON: ${e.message}${fejlSted(blok, e.message)}` }], typer: [] }; }
  const top = Array.isArray(data) ? data : [data];
  for (const n of top) {
    const ctx = n && (n['@context'] || '');
    if (!String(JSON.stringify(ctx)).includes('schema.org')) fund.push({ niveau: 'fejl', sti: 'root', tekst: 'Missing "@context": "https://schema.org" at the top level.' });
  }
  const navne = [];
  besoeg(data, fund, '', navne);
  return { ok: !fund.some((f) => f.niveau === 'fejl'), fund, typer: navne };
}
