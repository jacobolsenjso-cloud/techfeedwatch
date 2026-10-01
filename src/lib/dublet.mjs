// Dublet-værn (1/10-2026): robotten må ikke skrive en artikel, sitet allerede har.
//
// Baggrund: robotten tjekkede kun, om PRÆCIS samme spørgsmålstekst var brugt
// før. Målt 1/10 på 418 artikler: 8 grupper med samme søgehensigt, fx
// "what is ai chipset" og "what are ai chipsets" — to af vores egne sider, der
// konkurrerer om samme søgning (kannibalisering). To af dem kom de sidste 3 dage.
//
// To lag:
//  1) Samme kerneord: is/are, ental/flertal og spørgeord tæller ikke. Afvises
//     uden modelkald.
//  2) Samme hensigt: Gemini ser hver kandidat med de 5 mest lignende
//     eksisterende artikler og svarer, om en af dem allerede dækker søgningen.
//     Ordoverlap alene er for groft (målt 1/10: "ai videos use water" og
//     "can i make ai videos" deler ord, men er to forskellige spørgsmål).
// Fejler modelkaldet, gælder lag 1 alene — robotten går ikke i stå.
import fs from 'fs';
import { kerneord, stamme } from './headline.mjs';

const DIR = './src/content/videos';

// Nøgle til lag 1: ALLE ord inkl. spørgeordene, men is/are, does/do, a/an/the
// og ental/flertal tæller som ens. "what is ai chipset" = "what are ai chipsets".
// Spørgeordene SKAL med: uden dem blev "how are ai videos" = "can i ai videos",
// og "how to use X" = "what is X" (målt i testen 1/10) — det er forskellige
// ønsker, og dem skal lag 2 dømme.
const ENS = { is: 'are', does: 'do', a: '', an: '', the: '' };
export function noegle(q) {
  const ord = String(q || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    .map((w) => (Object.hasOwn(ENS, w) ? ENS[w] : stamme(w))).filter(Boolean);
  return [...new Set(ord)].sort().join(' ');
}
function ordSaet(t) { return new Set(kerneord(String(t || '')).map(stamme)); }
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let f = 0; for (const x of a) if (b.has(x)) f++;
  return f / (a.size + b.size - f);
}

// Alle udgivne artikler: slug, titel og søgespørgsmål (hvis der er et).
export function eksisterendeArtikler(dir = DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const t = fs.readFileSync(`${dir}/${f}`, 'utf8');
    const fm = (t.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
    const felt = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [, ''])[1].trim().replace(/^["']|["']$/g, '');
    return { slug: f.replace(/\.md$/, ''), title: felt('title'), q: felt('targetQuestion') };
  });
}

// De n mest lignende artikler (målt mod både spørgsmål og titel).
export function naermeste(kandidat, artikler, n = 5) {
  const k = ordSaet(kandidat);
  return artikler
    .map((a) => ({ a, s: Math.max(jaccard(k, ordSaet(a.q)), jaccard(k, ordSaet(a.title))) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, n);
}

// Under denne lighed sendes en kandidat ikke til Gemini — den har intet at
// ligne. Lavt sat med vilje: lag 2 skal se grænsetilfældene, ikke kun de tydelige.
const MIN_LIGHED = 0.25;

// Returnerer { behold: [...], afvist: [{ q, slug, lag }] }.
// genAI + hentModel + model gives udefra, så modulet ikke kender nøglen.
export async function fjernDubletter(kandidater, { genAI = null, hentModel = null, model = null, artikler = eksisterendeArtikler(), log = console.log } = {}) {
  const afvist = [];
  // Lag 1: samme kerneord som en eksisterende artikels spørgsmål eller titel.
  const kendte = new Map();
  for (const a of artikler) for (const t of [a.q, a.title]) { const n = noegle(t); if (n && !kendte.has(n)) kendte.set(n, a.slug); }
  let tilbage = [];
  for (const q of kandidater) {
    const slug = kendte.get(noegle(q));
    if (slug) afvist.push({ q, slug, lag: 'samme ord' }); else tilbage.push(q);
  }

  // Lag 2: samme søgehensigt, dømt af Gemini.
  const tilDom = tilbage.map((q) => ({ q, naboer: naermeste(q, artikler).filter((x) => x.s >= MIN_LIGHED) })).filter((x) => x.naboer.length);
  if (genAI && hentModel && model && tilDom.length) {
    try {
      const blokke = tilDom.map((x, i) => `CANDIDATE ${i + 1}: "${x.q}"\n${x.naboer.map((nb, j) => `  ${j + 1}. ${nb.a.q ? `"${nb.a.q}" — ` : ''}${nb.a.title}`).join('\n')}`).join('\n\n');
      const prompt = `A website publishes one article per search question. For each CANDIDATE search below, decide whether one of the listed EXISTING articles already answers the same search intent, so a new article would compete with it in Google.\n\nSame intent = same subject AND a reader would be satisfied by the existing article. Treat definition-type questions about the same subject as the same intent ("what is X", "what are X", "how does X work", "what does X do", "what does X mean"). Treat it as a DIFFERENT intent when the reader wants a clearly different answer: a ranking ("best X"), step-by-step use ("how to use X"), a comparison with something else ("X vs Y"), a specific aspect ("X energy use", "X in laptops"), or a different subject.\n\nReturn ONLY a JSON object mapping each candidate number to the number of the existing article that already covers it, or 0 if none does. Example: {"1":0,"2":3}\n\n${blokke}`;
      // Tre kald, flertallet afgør. Målt 1/10: ét kald vendte på
      // "how to use ai for seo and content optimization" mellem to kørsler —
      // samme ustabilitet som relevans-dommeren 13/9, samme kur (relevans.mjs).
      const svarListe = [];
      for (let k = 0; k < 3; k++) {
        try {
          // 4096: modellen tænker først, og tænkningen tæller med i loftet.
          // Målt 1/10: med 512 brugte den 491 på at tænke og klippede JSON-svaret.
          const r = await hentModel(genAI, { model, generationConfig: { maxOutputTokens: 4096, temperature: 0 } }).generateContent(prompt);
          const m = (r.response.text() || '').match(/\{[\s\S]*?\}/);
          if (m) svarListe.push(JSON.parse(m[0]));
        } catch (e) { log(`Info: dublet-dom ${k + 1}/3 fejlede (${e.message}).`); }
      }
      if (svarListe.length < 2) throw new Error(`kun ${svarListe.length} af 3 svar`);
      const ud = new Set();
      tilDom.forEach((x, i) => {
        const stemmer = svarListe.map((s) => Number(s[String(i + 1)]) || 0).filter((j) => j >= 1 && j <= x.naboer.length);
        // Dublet kræver flertal af ALLE afgivne svar (2 af 3, eller 2 af 2).
        if (stemmer.length * 2 <= svarListe.length) return;
        const hyppigst = stemmer.sort((a, b) => stemmer.filter((v) => v === b).length - stemmer.filter((v) => v === a).length)[0];
        ud.add(x.q); afvist.push({ q: x.q, slug: x.naboer[hyppigst - 1].a.slug, lag: `samme hensigt ${stemmer.length}/${svarListe.length}` });
      });
      tilbage = tilbage.filter((q) => !ud.has(q));
    } catch (e) {
      log(`Info: dublet-tjekkets lag 2 fejlede (${e.message}) — kun lag 1 (samme ord) er brugt.`);
    }
  }
  return { behold: tilbage, afvist };
}
