// Kladde-køen (Jacob 19/11-2026): Jacobs Godkend / Omskriv / Afvis på techfeedwatch.com/godkend udføres her,
// én gang i timen (workflowet "Kladder", .github/workflows/kladder.yml). Ingen ny GitHub-nøgle: beslutningerne
// hentes fra den offentlige læse-adresse /api/kladde-beslutninger - kun Jacob kan GEMME dem (Cloudflare Access).
// Adressen viser kun kladdens tilfældige id, version og handling; Jacobs note er krypteret med KLADDE_NOEGLE.
//   node kladder.mjs --tjek     er der noget at gøre? (kun Node selv - kører før npm install) -> noget=ja/nej
//   node kladder.mjs --udfoer   Godkend -> live, Afvis -> kladder-afviste/, Omskriv -> ny version af kladden
// En beslutning gælder kun den version, Jacob så. Godkend og Afvis fjerner kladden, så de kan aldrig ske to gange.
import fs from 'node:fs';
import { laesKladder, skrivKladde, fjernKladde, afvisKladde, visning, noegle, BESLUTNINGER_URL } from './src/lib/kladder.mjs';
import { dekrypter } from './src/lib/kryptering.mjs';
import { laesFelter, yaml } from './src/lib/artikelfelter.mjs';

const summary = (t) => { console.log(t); if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + '\n'); };
const UA = 'techfeedwatch-kladder/1.0 (+https://techfeedwatch.com)';

export async function hentBeslutninger(url = BESLUTNINGER_URL, hent = fetch) {
  let sidst;
  for (let forsoeg = 0; forsoeg < 3; forsoeg++) { // Cloudflare kan svare 403 til en ukendt maskine første gang (målt 23/9)
    if (forsoeg) await new Promise((r) => setTimeout(r, 5000));
    try {
      const r = await hent(`${url}?t=${Date.now()}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.ok) return (await r.json()) || [];
      sidst = `HTTP ${r.status}`;
    } catch (e) { sidst = e.message; }
  }
  throw new Error(`Kunne ikke hente beslutningerne (${sidst})`);
}

// Hvilke beslutninger skal udføres nu? Den nyeste for hver kladde, kun for den version Jacob så - og en Omskriv,
// der allerede er prøvet uden held (fejltid), først igen når Jacob har trykket på ny (nyere tid).
export function aktuelle(beslutninger, kladder) {
  const ud = [];
  for (const k of kladder) {
    const b = beslutninger.filter((x) => x && x.id === k.id).sort((a, c) => String(c.tid).localeCompare(String(a.tid)))[0];
    if (!b || Number(b.version) !== k.version || !['godkend', 'afvis', 'omskriv'].includes(b.handling)) continue;
    if (b.handling === 'omskriv' && k.fejltid && String(b.tid) <= k.fejltid) continue;
    ud.push({ ...b, kladde: k });
  }
  return ud;
}

// --- Frontmatter (artiklerne skrives af add-video.mjs i et fast format: ét felt pr. linje) ---
const delOp = (md) => { const m = String(md).replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); if (!m) throw new Error('kladden har ingen frontmatter'); return { fm: m[1], krop: m[2] }; };
const saml = (fm, krop) => `---\n${fm}\n---\n${krop.startsWith('\n') ? krop : '\n' + krop}`;
// Sæt et felt (erstat linjen, eller tilføj efter "efter"-feltet / sidst)
export function saetFelt(fm, navn, vaerdi, efter = null) {
  const linje = `${navn}: ${vaerdi}`;
  const re = new RegExp(`^${navn}:.*$`, 'm');
  if (re.test(fm)) return fm.replace(re, () => linje);
  const ef = efter && fm.match(new RegExp(`^${efter}:.*$`, 'm'));
  return ef ? fm.replace(ef[0], () => `${ef[0]}\n${linje}`) : `${fm}\n${linje}`;
}
const faqBlok = (faqs) => (faqs.length ? 'faqs:\n' + faqs.map((f) => `  - question: ${yaml(f.question)}\n    answer: ${yaml(f.answer)}`).join('\n') : '');
export function saetFaqs(fm, faqs) {
  const re = /^faqs:\n(?:[ \t]+.*\n?)*/m;
  const blok = faqBlok(faqs);
  if (re.test(fm)) return fm.replace(re, () => (blok ? blok + '\n' : '')).replace(/\n+$/, '');
  return blok ? `${fm}\n${blok}` : fm;
}

// Når Jacob trykker Godkend: datoerne sættes, så de passer til at artiklen går live NU.
//   ny: date = i dag (den dag den gik live) + skrevet = da robotten skrev den (auto-youtube.mjs' dagsloft)
//   omskrevet / faktatjek: date bevares (Jacob 25/10: udgivelsesdatoen ændres aldrig), updated = i dag
export function tilLive(k, nu = new Date().toISOString()) {
  const { fm, krop } = delOp(k.markdown); const idag = nu.slice(0, 10);
  let f = fm;
  if (k.type === 'ny') { f = saetFelt(f, 'date', `"${idag}"`); f = saetFelt(f, 'skrevet', `"${k.skrevet || nu}"`, 'date'); f = f.replace(/^updated:.*\n?/m, ''); }
  else { f = saetFelt(f, 'updated', `"${idag}"`, 'date'); if (k.type === 'omskrevet') f = saetFelt(f, 'rewrittenAt', `"${idag}"`); }
  // godkendt: forfatterboksen siger "I read this version in full and approved it" KUN, når feltet findes
  f = saetFelt(f, 'godkendt', `"${idag}"`);
  return saml(f.replace(/\n+$/, ''), krop);
}

// --- Omskriv efter Jacobs note ---
const afsnit = (md) => String(md).replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
const ren = (b) => b.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`|]/g, ' ').replace(/^\s*[-+]\s+/gm, '').replace(/\s+/g, ' ').trim();
// Begyndelsen (60 tegn) af hvert nyt eller ændret afsnit - godkend-siden markerer dem med gult
export function aendredeAfsnit(gammel, ny) {
  const foer = new Set(afsnit(gammel).map(ren));
  return afsnit(ny).map(ren).filter((t) => t && !foer.has(t)).map((t) => t.slice(0, 60));
}
const links = (md) => new Set([...String(md).matchAll(/\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g)].map((m) => m[1].replace(/\/$/, '')));
const ord = (md) => ren(String(md)).split(' ').filter(Boolean).length;
const kilder = (md) => (String(md).replace(/\r/g, '').match(/\n## Sources\n[\s\S]*$/) || [''])[0].trim();

// Kontrol af en omskrevet kladde. Returnerer en fejltekst eller ''.
//  - ingen NYE links (Gemini må ikke opfinde adresser), kildelisten (## Sources) ord for ord uændret
//  - mindst 85 % af ordene (en note må ikke blive til en halv artikel) og mindst 600 ord
//  - titel 20-90 tegn, beskrivelse 70-170 tegn, FAQ ikke tømt
export function tjekRettelse(gammel, ny) {
  const nyKrop = String(ny?.body || '');
  const n = ord(nyKrop); const g = ord(gammel.krop);
  if (n < Math.max(600, Math.round(g * 0.85))) return `kun ${n} ord (før ${g})`;
  const nye = [...links(nyKrop)].filter((h) => !links(gammel.krop).has(h));
  if (nye.length) return `nye links, som ikke stod i kladden: ${nye.slice(0, 3).join(', ')}`;
  if (kilder(gammel.krop) && kilder(nyKrop) !== kilder(gammel.krop)) return 'kildelisten (Sources) blev ændret';
  const t = String(ny?.title || '').trim();
  if (t.length < 20 || t.length > 90) return `titlen er ${t.length} tegn (20-90)`;
  const d = String(ny?.metaDescription || '').trim();
  if (d.length < 70 || d.length > 170) return `beskrivelsen er ${d.length} tegn (70-170)`;
  if (gammel.faqs.length && !(ny?.faqs || []).length) return 'FAQ blev fjernet';
  return '';
}

const PROMPT = (felter, krop, note) => `You are the editor of techfeedwatch.com. The site owner, Jacob S. Olsen, has read the draft article
below and asks for changes. Make EXACTLY the changes his note asks for, and nothing else.

Rules:
- Keep everything the note does not ask you to change, word for word where possible.
- Keep the Markdown structure (## headings, lists, tables, images). Keep every existing link exactly; add NO new links.
- Never change the "## Sources" section at the end - copy it unchanged.
- If the note contains Jacob's own experience or opinion, write it into the article in the first person as Jacob
  ("I", "in my experience"), using only what the note says. Never invent experiences, numbers or facts he did not give.
- If the note says a fact is wrong and gives the right one, correct it everywhere it appears (also title, description,
  summary and FAQ). If it says a fact is wrong without giving the right one, remove or soften the claim; never guess.
- Plain English a beginner understands, same journalistic tone as the draft. Keep about the same length.

Jacob's note (in Danish or English):
"""${note}"""

Current title: ${felter.title}
Current meta description: ${felter.meta}
Current summary: ${felter.summary}
Current FAQ (JSON): ${JSON.stringify(felter.faqs)}
Draft article (Markdown):
${krop}

Return JSON only: {"title": "...", "metaDescription": "120-160 characters", "summary": "...", "faqs": [{"question": "...", "answer": "..."}], "body": "the full revised article Markdown", "changes": "one short line in Danish: what you changed"}`;

export async function omskriv(k, note, kald) {
  const { fm, krop } = delOp(k.markdown);
  const lf = laesFelter(k.markdown);
  const felter = { title: lf.felt('title'), meta: lf.felt('metaDescription'), summary: lf.felt('summary'), faqs: lf.faqs };
  const ny = await kald(PROMPT(felter, krop, String(note).slice(0, 2000)));
  const fejl = tjekRettelse({ krop, faqs: lf.faqs }, ny);
  if (fejl) throw new Error(`omskrivningen bestod ikke kontrollen: ${fejl}`);
  let f = saetFelt(fm, 'title', yaml(String(ny.title).trim()));
  f = saetFelt(f, 'metaDescription', yaml(String(ny.metaDescription).trim()), 'summary');
  if (String(ny.summary || '').trim()) f = saetFelt(f, 'summary', yaml(String(ny.summary).trim()));
  f = saetFaqs(f, (ny.faqs || []).filter((q) => q && q.question && q.answer).map((q) => ({ question: String(q.question).trim(), answer: String(q.answer).trim() })));
  const body = String(ny.body).replace(/\r/g, '').trim() + '\n';
  const markdown = saml(f, '\n' + body);
  return { markdown, aendringer: String(ny.changes || '').slice(0, 300), aendret: aendredeAfsnit(krop, body) };
}

async function geminiKald() {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const { GEMINI_MODEL, hentModel, forbrug } = await import('./src/lib/model.mjs');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const kald = async (prompt) => {
    const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768, temperature: 0.3, responseMimeType: 'application/json' } }).generateContent(prompt);
    const t = r.response.text().trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    return JSON.parse(t);
  };
  return { kald, forbrug };
}

export async function udfoer(opgaver, { kald = null, rod = process.cwd() } = {}) {
  const nu = new Date().toISOString();
  const udgivne = []; let gemini = null;
  const fejlFil = `${rod}/src/data/omskriv-fejl.json`;
  for (const o of opgaver) {
    const k = o.kladde; const live = `${rod}/src/content/videos/${k.slug}.md`;
    let note = '';
    try { note = o.note ? await dekrypter(o.note, noegle()) : ''; } catch { note = ''; }
    try {
      if (o.handling === 'godkend') {
        if (k.type === 'ny' && fs.existsSync(live)) throw new Error(`der findes allerede en artikel med adressen /video/${k.slug}/`);
        if (k.type !== 'ny' && !fs.existsSync(live)) throw new Error(`den levende artikel /video/${k.slug}/ findes ikke mere`);
        fs.writeFileSync(live, tilLive(k, nu));
        fjernKladde(k.id);
        udgivne.push(`src/content/videos/${k.slug}.md`);
        summary(`**Godkendt og live:** ${k.visning?.title || k.slug} — https://techfeedwatch.com/video/${k.slug}/ (${k.type})`);
      } else if (o.handling === 'afvis') {
        await afvisKladde(k, note);
        // En afvist omskrivning hviler 30 dage (omskriv-gamle.mjs læser afvistTil), så den ikke straks skrives om igen
        if (k.type === 'omskrevet') {
          let f = {}; try { f = JSON.parse(fs.readFileSync(fejlFil, 'utf8')); } catch { /* ny fil */ }
          f[k.slug] = { ...(f[k.slug] || {}), grund: 'afvist af Jacob', afvistTil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) };
          fs.writeFileSync(fejlFil, JSON.stringify(f, null, 1) + '\n');
        }
        summary(`**Afvist og gemt væk:** ${k.visning?.title || k.slug} (${k.type})`);
      } else if (o.handling === 'omskriv') {
        if (!kald && !gemini) gemini = await geminiKald();
        const r = await omskriv(k, note, kald || gemini.kald);
        const { fejl: _f, fejltid: _ft, ...rest } = k;
        await skrivKladde({ ...rest, version: k.version + 1, markdown: r.markdown, visning: await visning(r.markdown), note, aendringer: r.aendringer, aendret: r.aendret, rettet: nu });
        summary(`**Omskrevet efter Jacobs note:** ${k.visning?.title || k.slug} (version ${k.version + 1}) — ${r.aendringer}`);
      }
    } catch (e) {
      // En Omskriv, der fejler, prøves ikke igen hver time: fejlen og tiden gemmes i kladden og vises på siden.
      if (o.handling === 'omskriv') await skrivKladde({ ...k, fejl: String(e.message).slice(0, 300), fejltid: nu });
      summary(`**Kunne ikke udføre ${o.handling} for ${k.slug}:** ${String(e.message).slice(0, 300)}`);
      if (o.handling !== 'omskriv') process.exitCode = 1;
    }
  }
  if (gemini) summary(`**Pris:** $${(Math.round(gemini.forbrug.usd * 10000) / 10000)} for omskrivning efter note`);
  return udgivne;
}

const arg = process.argv[2];
if (arg === '--tjek' || arg === '--udfoer') {
  const kladder = await laesKladder();
  const b = process.env.KLADDE_BESLUTNINGER_FIL ? JSON.parse(fs.readFileSync(process.env.KLADDE_BESLUTNINGER_FIL, 'utf8')) : await hentBeslutninger();
  const opgaver = aktuelle(b, kladder);
  if (arg === '--tjek') {
    summary(`**Kladder:** ${kladder.length} venter · ${opgaver.length} beslutning(er) at udføre${opgaver.length ? ': ' + opgaver.map((o) => `${o.handling} ${o.kladde.slug}`).join(', ') : ''}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `noget=${opgaver.length ? 'ja' : 'nej'}\n`);
  } else {
    const udgivne = await udfoer(opgaver);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `godkendt=${udgivne.length ? 'ja' : 'nej'}\n`);
  }
} else if (arg) { console.error('Brug: --tjek | --udfoer'); process.exitCode = 2; }
