// PageSpeed-mellemmand på Cloudflare Workers.
//
// Hvorfor: Googles PageSpeed Insights API kræver en nøgle. Lå nøglen i sidens kode,
// kunne alle se den. Her ligger den som secret (PSI_KEY) hos Cloudflare: siden spørger
// Workeren, Workeren spørger Google med nøglen og sender kun et udsnit af svaret tilbage.
//
// Indgange:
//   GET /run?url=<adresse>&strategy=mobile|desktop  - kører testen (kun fra tilladte sider)
//   GET /health                                       - siger om nøglen er sat (ja/nej, aldrig værdien)
//
// Nøglen er i Google låst til KUN PageSpeed Insights API. Misbrug kan højst bruge dagens
// gratis kvote (25.000 tjek) - det koster ingen penge, der findes ingen betalt version.

const TILLADTE = [
  'https://techfeedwatch.com',
  'http://localhost:4321',
  'http://localhost:4329',
  'http://127.0.0.1:4329',
];
const PSI = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const KATEGORIER = ['performance', 'accessibility', 'best-practices', 'seo'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': TILLADTE.includes(origin) ? origin : TILLADTE[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const u = new URL(request.url);

    if (u.pathname === '/health') return json({ ok: true, keySet: Boolean(env.PSI_KEY) }, 200, cors);
    if (u.pathname !== '/run' || request.method !== 'GET') return json({ error: 'Not found.' }, 404, cors);
    // Kun vores egne sider. (Origin kan forfalskes uden for en browser - værst tænkeligt
    // bruges dagens gratis kvote op. Det er accepteret; nøglen kan ikke bruges til andet.)
    if (!TILLADTE.includes(origin)) return json({ error: 'This service only answers techfeedwatch.com.' }, 403, cors);
    if (!env.PSI_KEY) return json({ error: 'The speed test is not switched on yet. Please try again later.' }, 503, cors);

    const maal = tjekAdresse(u.searchParams.get('url') || '');
    if (!maal) return json({ error: 'Enter a full public web address, like https://example.com/' }, 400, cors);
    const strategi = u.searchParams.get('strategy') === 'desktop' ? 'desktop' : 'mobile';

    const q = new URLSearchParams({ url: maal, strategy: strategi, key: env.PSI_KEY });
    for (const k of KATEGORIER) q.append('category', k);
    let svar, data;
    try {
      svar = await fetch(`${PSI}?${q}`);
      data = await svar.json();
    } catch {
      return json({ error: 'Google did not answer. Please try again in a minute.' }, 502, cors);
    }
    if (!svar.ok) {
      if (svar.status === 429) return json({ error: "Today's free test quota is used up. Please try again tomorrow." }, 429, cors);
      // Googles fejltekst sendes videre, men alt der ligner en nøgle fjernes for en sikkerheds skyld.
      const msg = String(data?.error?.message || `Google answered ${svar.status}.`).replace(/key=[^&\s]+/gi, 'key=…').replace(/AIza[0-9A-Za-z_-]{20,}/g, '…');
      return json({ error: friendly(msg) }, 502, cors);
    }
    return json(udsnit(data, strategi), 200, cors);
  },
};

// Kun offentlige http(s)-adresser - ikke localhost eller private net.
export function tjekAdresse(raa) {
  let m;
  try { m = new URL(raa.trim()); } catch { return null; }
  if (!/^https?:$/.test(m.protocol) || raa.length > 2000) return null;
  const h = m.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || !h.includes('.')) return null;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.startsWith('[')) return null;
  return m.toString();
}

function friendly(msg) {
  if (/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP/i.test(msg)) {
    return 'Google could not load that page. Check that the address opens in a normal browser and is public.';
  }
  return msg.slice(0, 300);
}

// Plukker det, siden viser - resten af Googles store svar (flere MB) sendes ikke videre.
export function udsnit(d, strategi) {
  const lh = d.lighthouseResult || {};
  const audits = lh.audits || {};
  const score = (k) => (lh.categories?.[k]?.score == null ? null : Math.round(lh.categories[k].score * 100));
  const lab = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index']
    .map((id) => audits[id] && { id, title: audits[id].title, value: audits[id].displayValue || '', score: audits[id].score });
  const felt = (le) => {
    if (!le?.metrics) return null;
    const navne = {
      LARGEST_CONTENTFUL_PAINT_MS: 'Largest Contentful Paint',
      INTERACTION_TO_NEXT_PAINT: 'Interaction to Next Paint',
      CUMULATIVE_LAYOUT_SHIFT_SCORE: 'Cumulative Layout Shift',
      FIRST_CONTENTFUL_PAINT_MS: 'First Contentful Paint',
      EXPERIMENTAL_TIME_TO_FIRST_BYTE: 'Time to First Byte',
    };
    const metrics = Object.entries(navne)
      .filter(([k]) => le.metrics[k])
      .map(([k, title]) => ({ id: k, title, p75: le.metrics[k].percentile, category: le.metrics[k].category }));
    return metrics.length ? { overall: le.overall_category || null, metrics } : null;
  };
  // Forbedringer: revisioner der ikke bestod og som Google mener sparer tid.
  const forbedringer = Object.values(audits)
    .filter((a) => a && a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
    .map((a) => {
      const ms = a.details?.overallSavingsMs || 0;
      const ms2 = Math.max(0, ...Object.values(a.metricSavings || {}).filter((v) => typeof v === 'number' && v > 1));
      return { title: a.title, value: a.displayValue || '', savingsMs: Math.round(ms || ms2 || 0) };
    })
    .filter((a) => a.savingsMs > 0)
    .sort((a, b) => b.savingsMs - a.savingsMs)
    .slice(0, 8);
  return {
    url: lh.finalDisplayedUrl || lh.finalUrl || d.id,
    strategy: strategi,
    fetched: lh.fetchTime || null,
    scores: { performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo') },
    lab: lab.filter(Boolean),
    field: felt(d.loadingExperience),
    fieldIsOrigin: Boolean(d.loadingExperience?.origin_fallback),
    originField: felt(d.originLoadingExperience),
    improvements: forbedringer,
  };
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });
}
