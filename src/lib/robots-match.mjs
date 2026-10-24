// robots.txt-motor til robots.txt Tester og AI Crawler Access Checker (24/10-2026).
// Kører i browseren (og i node til test). Følger RFC 9309 og Googles dokumenterede
// opførsel, så svaret er det samme, som Googlebot ville give:
//  - Grupper: en eller flere User-agent-linjer efterfulgt af regler. Flere grupper
//    for samme robot lægges sammen.
//  - Gruppevalg: præcis match på robotnavnet (uden store/små bogstaver); ellers den
//    længste User-agent-værdi, som robotnavnet begynder med ("googlebot" gælder for
//    "Googlebot-Image"); ellers gruppen "*". Findes ingen af dem, er alt tilladt.
//  - Regelvalg: den længste matchende sti vinder. Er Allow og Disallow lige lange,
//    vinder Allow (den mindst begrænsende, som Google skriver).
//  - "*" matcher alt (også ingenting), "$" binder til slutningen af adressen.
//  - En tom Disallow betyder "ingen regel". /robots.txt selv er altid tilladt.
// Bevidst udeladt: procent-kodning af tegn (fx %2F) normaliseres ikke - det står
// som begrænsning på siderne.

export function parseRobots(text) {
  const grupper = [];
  const sitemaps = [];
  const signaler = [];
  const advarsler = [];
  let aktuel = null;
  let sidsteVarUa = false;
  const linjer = String(text || '').split(/\r\n|\r|\n/);
  linjer.forEach((raw, i) => {
    const nr = i + 1;
    const linje = raw.replace(/#.*$/, '').trim();
    if (!linje) return;
    const m = linje.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) { advarsler.push({ nr, tekst: `Line ${nr} is not a "field: value" line and is ignored.` }); return; }
    const felt = m[1].toLowerCase();
    const vaerdi = m[2].trim();
    if (felt === 'user-agent') {
      if (!aktuel || !sidsteVarUa) { aktuel = { agenter: [], regler: [], nr }; grupper.push(aktuel); }
      aktuel.agenter.push(vaerdi.toLowerCase());
      sidsteVarUa = true;
      return;
    }
    if (felt === 'sitemap') { sitemaps.push(vaerdi); return; }
    // Content-Signal (Cloudflare, 2025): en erklæring om AI-brug (ai-train, search, ai-input).
    // Den ændrer ikke, hvem der må crawle - derfor ingen advarsel, men vist som oplysning.
    if (felt === 'content-signal') { signaler.push({ nr, vaerdi }); return; }
    if (felt === 'allow' || felt === 'disallow') {
      sidsteVarUa = false;
      if (!aktuel) { advarsler.push({ nr, tekst: `Line ${nr}: "${m[1]}" appears before any User-agent line and is ignored.` }); return; }
      aktuel.regler.push({ type: felt, sti: vaerdi, nr, linje: raw.trim() });
      return;
    }
    sidsteVarUa = false;
    if (felt === 'crawl-delay') return; // Google ignorerer den; ikke en fejl
    if (felt === 'noindex') { advarsler.push({ nr, tekst: `Line ${nr}: "noindex" in robots.txt has not been supported by Google since 2019 and is ignored.` }); return; }
    advarsler.push({ nr, tekst: `Line ${nr}: unknown field "${m[1]}" is ignored.` });
  });
  return { grupper, sitemaps, signaler, advarsler };
}

// Vælger de grupper, en bestemt robot skal følge.
export function vaelgGrupper(parsed, robot) {
  const navn = String(robot || '').toLowerCase().trim();
  const praecis = parsed.grupper.filter((g) => g.agenter.includes(navn));
  if (praecis.length) return { grupper: praecis, valgt: navn, hvordan: 'exact' };
  let bedst = '';
  for (const g of parsed.grupper) for (const a of g.agenter) {
    if (a !== '*' && navn.startsWith(a) && a.length > bedst.length) bedst = a;
  }
  if (bedst) return { grupper: parsed.grupper.filter((g) => g.agenter.includes(bedst)), valgt: bedst, hvordan: 'prefix' };
  const stjerne = parsed.grupper.filter((g) => g.agenter.includes('*'));
  if (stjerne.length) return { grupper: stjerne, valgt: '*', hvordan: 'wildcard' };
  return { grupper: [], valgt: null, hvordan: 'none' };
}

// Oversætter en robots-sti til et regulært udtryk ("*" og "$").
function stiTilRegex(sti) {
  let s = sti;
  const ende = s.endsWith('$');
  if (ende) s = s.slice(0, -1);
  const esc = s.split('*').map((del) => del.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp('^' + esc + (ende ? '$' : ''));
}

// Gør en fuld adresse eller en sti til "sti + forespørgsel", som robots-regler matcher.
export function tilSti(input) {
  const v = String(input || '').trim();
  if (!v) return '/';
  try {
    const u = new URL(v);
    return (u.pathname || '/') + (u.search || '');
  } catch {
    return v.startsWith('/') ? v : '/' + v;
  }
}

// Hovedfunktionen: må robotten hente stien?
export function tjek(parsed, robot, input) {
  const sti = tilSti(input);
  const valg = vaelgGrupper(parsed, robot);
  if (sti === '/robots.txt') return { tilladt: true, regel: null, sti, ...valg, grund: 'robots.txt itself is always allowed.' };
  let vinder = null;
  for (const g of valg.grupper) for (const r of g.regler) {
    if (r.sti === '') continue; // tom regel = ingen regel
    if (!stiTilRegex(r.sti).test(sti)) continue;
    const laengde = r.sti.length;
    if (!vinder || laengde > vinder.sti.length || (laengde === vinder.sti.length && r.type === 'allow' && vinder.type === 'disallow')) vinder = r;
  }
  const tilladt = !vinder || vinder.type === 'allow';
  let grund;
  if (!valg.grupper.length) grund = 'No group applies to this crawler, so everything is allowed.';
  else if (!vinder) grund = 'No rule in the group matches this path, so it is allowed.';
  else grund = `The longest matching rule is line ${vinder.nr}: ${vinder.linje}`;
  return { tilladt, regel: vinder, sti, ...valg, grund };
}

// AI-crawlere (kilde: anagram.ai "AI crawler user agent list 2026", hentet 24/10-2026,
// suppleret med CCBot og Bingbot). "respekterer: false" = firmaet siger selv, at
// robots.txt ikke altid gælder, fordi en bruger har bedt om siden.
export const AI_CRAWLERE = [
  { token: 'GPTBot', firma: 'OpenAI', formaal: 'Training', respekterer: true },
  { token: 'OAI-SearchBot', firma: 'OpenAI', formaal: 'Search index (ChatGPT search)', respekterer: true },
  { token: 'ChatGPT-User', firma: 'OpenAI', formaal: 'Fetch on a user\'s request', respekterer: false },
  { token: 'ClaudeBot', firma: 'Anthropic', formaal: 'Training', respekterer: true },
  { token: 'Claude-SearchBot', firma: 'Anthropic', formaal: 'Search index', respekterer: true },
  { token: 'Claude-User', firma: 'Anthropic', formaal: 'Fetch on a user\'s request', respekterer: true },
  { token: 'PerplexityBot', firma: 'Perplexity', formaal: 'Search index', respekterer: true },
  { token: 'Perplexity-User', firma: 'Perplexity', formaal: 'Fetch on a user\'s request', respekterer: false },
  { token: 'Googlebot', firma: 'Google', formaal: 'Google Search, incl. AI Overviews', respekterer: true },
  { token: 'Google-Extended', firma: 'Google', formaal: 'Control token: Gemini training', respekterer: true, kontrol: true },
  { token: 'Bingbot', firma: 'Microsoft', formaal: 'Bing index (Copilot answers)', respekterer: true },
  { token: 'Applebot', firma: 'Apple', formaal: 'Siri, Spotlight, Safari', respekterer: true },
  { token: 'Applebot-Extended', firma: 'Apple', formaal: 'Control token: Apple model training', respekterer: true, kontrol: true },
  { token: 'meta-externalagent', firma: 'Meta', formaal: 'Training', respekterer: true },
  { token: 'meta-externalfetcher', firma: 'Meta', formaal: 'Fetch on a user\'s request', respekterer: true },
  { token: 'CCBot', firma: 'Common Crawl', formaal: 'Open web archive used to train many models', respekterer: true },
];
