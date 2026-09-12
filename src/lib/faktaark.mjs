// Faktaark — robottens researchnotater, taget FØR artiklen skrives.
//
// Hvorfor: målt 12/9-2026 på de første tre artikler med regel 14 ("mindst tre
// konkrete detaljer fra kilden"): 0, 2 og 1 tal. Reglen stod i en prompt, der
// samtidig bad om titel, tags, resumé, meta, FAQ og hele artiklen i ét svar,
// og bad modellen "not summarize" og "add value the source does not provide".
// Modellen valgte det nemme: pæn, generel tekst. Og værnet bagefter godtog
// undskyldningen "kilden har ingen tal", uden at nogen tjekkede det.
//
// Sådan gør en journalist: notater først, artikel bagefter. Trin 1 læser
// transskriptet og skriver alle tal, navne, eksempler og citater ned — ordret.
// Trin 2 skriver artiklen med arket som ingrediensliste. Trin 3 kontrollerer,
// at tallene i artiklen findes i kilden (ingen opfundne tal) og at arket
// faktisk er brugt.

// Mindst så mange punkter skal kilden give, ellers er den for tynd til en
// artikel — og robotten prøver næste kandidat, FØR den dyre artikel-prompt.
export const MIN_FAKTA = 5;
// Mindst så mange punkter fra arket skal kunne genfindes i den færdige artikel.
export const MIN_BRUGT = 3;

// Prompt til trin 1. Svaret er JSON, så det kan læses maskinelt.
export function faktaarkPrompt(text, emne) {
  return `You are a research assistant taking notes from a transcript. Extract EVERY concrete, checkable detail the speaker gives${emne ? ` (the article will be about "${emne}", so prioritise details about that, but keep the rest too)` : ''}.

Return ONLY a JSON array, no prose, no code fence. Each item:
{"type": "tal" | "navn" | "eksempel" | "citat", "key": "...", "text": "..."}

- "tal": a number the speaker gives — price, percentage, date, count, duration, size, version. "key" is the number exactly as spoken (e.g. "12 megapixel", "$299", "40%", "2019"). "text" is the sentence it appears in, verbatim.
- "navn": a named product, company, tool, model, person or place. "key" is the name. "text" is what the speaker says about it, verbatim.
- "eksempel": a concrete example, step, case or demonstration the speaker gives. "key" is a 3-6 word label. "text" is the passage, verbatim.
- "citat": a sentence worth quoting — an opinion, a warning, a claim. "key" is the first 4 words. "text" is the sentence, verbatim.

Rules: copy the transcript's own words; never add facts that are not in it; never round or convert numbers; skip filler ("like and subscribe"), sponsor reads and the speaker's own channel name. Aim for completeness — 10 to 30 items for a typical video. If the transcript contains almost nothing concrete, return the few items it has.

TRANSCRIPT:
${text.substring(0, 30000)}`;
}

// Læser modellens svar. Tåler kodeblok-hegn og løs tekst rundt om JSON'en.
export function parseFaktaark(raw) {
  const s = String(raw || '').replace(/```(?:json)?/gi, '').trim();
  const start = s.indexOf('['), slut = s.lastIndexOf(']');
  let arr;
  try {
    if (start < 0 || slut <= start) throw new Error('ingen hel liste');
    arr = JSON.parse(s.slice(start, slut + 1));
  } catch {
    // Målt 12/9: ét svar (1t15m video) gav 0 punkter, fordi JSON'en var
    // klippet af midt i et objekt. Så redder vi de hele objekter enkeltvis i
    // stedet for at kassere alt.
    arr = [];
    for (const m of s.matchAll(/\{[^{}]*\}/g)) {
      try { arr.push(JSON.parse(m[0])); } catch { /* halvt objekt — spring over */ }
    }
  }
  if (!Array.isArray(arr)) return [];
  const typer = new Set(['tal', 'navn', 'eksempel', 'citat']);
  return arr
    .filter((x) => x && typer.has(x.type) && typeof x.key === 'string' && x.key.trim())
    .map((x) => ({ type: x.type, key: x.key.trim(), text: String(x.text || '').trim() }))
    .slice(0, 60);
}

// Er kilden rig nok? Tæller kun det, der kan gøre en artikel konkret
// (citater alene gør det ikke — de er tone, ikke fakta).
export function faktaarkScore(fakta) {
  return fakta.filter((f) => f.type !== 'citat').length;
}

// Arket som tekst til artikel-prompten.
export function faktaarkTekst(fakta) {
  const label = { tal: 'NUMBER', navn: 'NAME', eksempel: 'EXAMPLE', citat: 'QUOTE' };
  return fakta.map((f, i) => `${i + 1}. [${label[f.type]}] ${f.key}${f.text ? ` — "${f.text}"` : ''}`).join('\n');
}

// ---- Trin 3: kontrol ----

// Taltokens i en tekst, normaliseret så "$1,200" og "1200" er det samme.
// Bogstav lige før tallet (H100, GPT-4) udelukkes: det er et produktnavn, ikke et tal.
function talTokens(text) {
  const ud = new Set();
  for (const m of String(text).matchAll(/(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?/g)) {
    const t = m[0].replace(/,/g, '').replace(/\.$/, '');
    if (t) ud.add(t);
  }
  return ud;
}

// Tal vi ikke kontrollerer: små tal (listetal, "three steps", versioner) og
// årstal, som regel 11 tillader som almen viden. Alt andet skal stå i kilden.
function kontrolleresIkke(t) {
  const n = Number(t);
  if (!Number.isFinite(n)) return true;
  if (n <= 20) return true;
  if (Number.isInteger(n) && n >= 1900 && n <= 2035) return true;
  return false;
}

// Brødtekst uden link-tekster — de er titler på eksisterende artikler og kan
// indeholde tal, som ikke er denne artikels påstande.
function udenLinks(content) {
  return String(content).replace(/\[([^\]]*)\]\([^)]*\)/g, '');
}

// Kilden siger "75K" eller "4.4 million"; artiklen skriver "75,000" eller
// "4,400,000". Begge former regnes som kendte, så et korrekt udskrevet tal
// ikke udløser en unødig rettelse (målt 12/9: 75K/120K blev flaget).
// Returnerer et kort fra grundtal ("75") til udskrevet tal ("75000").
function udvidedeTal(text) {
  const faktor = { k: 1e3, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };
  const ud = new Map();
  for (const m of String(text).matchAll(/(?<![A-Za-z0-9])(\d[\d,]*(?:\.\d+)?)\s?(k|thousand|million|billion|trillion)\b/gi)) {
    const grund = m[1].replace(/,/g, '');
    const n = Number(grund) * faktor[m[2].toLowerCase()];
    if (Number.isFinite(n)) ud.set(grund, String(Math.round(n)));
  }
  return ud;
}

// Tal i artiklen, som hverken står i faktaarket eller i transskriptet.
export function ukendteTal(content, fakta, transcript) {
  const kilde = transcript + '\n' + fakta.map((f) => `${f.key} ${f.text}`).join('\n');
  const kendte = new Set([...talTokens(kilde), ...udvidedeTal(kilde).values()]);
  const artikel = udenLinks(content);
  const artikelUdv = udvidedeTal(artikel);
  const ud = [];
  for (const t of talTokens(artikel)) {
    if (kontrolleresIkke(t)) continue;
    if (kendte.has(t)) continue;
    // "75K" i artiklen mod "75,000" i kilden
    if (artikelUdv.has(t) && kendte.has(artikelUdv.get(t))) continue;
    ud.push(t);
  }
  return ud;
}

// Hvilke punkter fra arket kan genfindes i artiklen? Et tal-punkt tæller, når
// selve tallet står der; navne og eksempler, når nøglen (eller dens første to
// ord) står der. Citater tæller, når mindst 6 ord i træk fra citatet står der.
export function brugteFakta(content, fakta) {
  const tekst = udenLinks(content).toLowerCase();
  const tal = talTokens(tekst);
  const brugte = [];
  for (const f of fakta) {
    const key = f.key.toLowerCase();
    let ok = false;
    if (f.type === 'tal') {
      const tokens = [...talTokens(key)];
      ok = tokens.length > 0 && tokens.every((t) => tal.has(t));
    } else if (f.type === 'citat') {
      const ord = f.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      for (let i = 0; i + 6 <= ord.length && !ok; i++) ok = tekst.includes(ord.slice(i, i + 6).join(' '));
    } else {
      const kort = key.split(/\s+/).slice(0, 2).join(' ');
      ok = tekst.includes(key) || (kort.length >= 4 && tekst.includes(kort));
    }
    if (ok) brugte.push(f);
  }
  return brugte;
}
