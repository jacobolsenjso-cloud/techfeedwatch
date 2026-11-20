// Læser de felter i en artikel, læseren ser (titel, meta, resumé, FAQ, faktaboks, brødtekst),
// så faktatjek-gamle.mjs og stikproeve.mjs læser artiklen PRÆCIS ens (25/10-2026).
export const yaml = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export function laesFelter(raw) {
  const [, fm = '', ...rest] = String(raw).replace(/\r/g, '').split('---');
  const krop = rest.join('---');
  const felt = (navn) => { const m = fm.match(new RegExp(`^${navn}:\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*$`, 'm')); return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : ''; };
  const faqs = [...fm.matchAll(/^\s*- question:\s*"((?:[^"\\]|\\.)*)"\s*\n\s*answer:\s*"((?:[^"\\]|\\.)*)"/gm)].map((m) => ({ question: m[1].replace(/\\"/g, '"'), answer: m[2].replace(/\\"/g, '"') }));
  const faktaboks = [...fm.matchAll(/^\s*- text:\s*"((?:[^"\\]|\\.)*)"\s*\n\s*source:\s*"((?:[^"\\]|\\.)*)"\s*\n\s*url:\s*"((?:[^"\\]|\\.)*)"/gm)].map((m) => ({ text: m[1].replace(/\\"/g, '"'), source: m[2], url: m[3] }));
  // f = kopier, som kontrollen må ændre; faqs/faktaboks = originalerne, til at skrive tilbage.
  const f = { titel: felt('title'), meta: felt('metaDescription'), resume: felt('summary'), faqs: faqs.map((q) => ({ ...q })), brodtekst: krop, faktaboks: faktaboks.map((k) => ({ ...k })) };
  return { fm, krop, felt, faqs, faktaboks, f };
}

// Skriver de felter, kontrollen har ændret (f), tilbage i artiklen. Kun de tjekkede felter skrives om; alt andet i
// frontmatter bevares tegn for tegn. Flyttet hertil fra faktatjek-gamle.mjs 20/11-2026, så faktatjekket og
// kontrollanten skriver PRÆCIS ens. Nyt 20/11: et faktabokspunkt, kontrollen har fjernet, fjernes også i filen
// (før stod det gamle punkt tilbage).
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function medFelter(raw, l) {
  const { fm, felt, faqs, faktaboks, f } = l;
  let nyFm = fm;
  const saetFelt = (navn, gammel, ny) => { if (gammel && ny !== gammel) nyFm = nyFm.replace(`${navn}: ${yaml(gammel)}`, `${navn}: ${yaml(ny)}`); };
  saetFelt('title', felt('title'), f.titel); saetFelt('metaDescription', felt('metaDescription'), f.meta); saetFelt('summary', felt('summary'), f.resume);
  for (const q of faqs) {
    const nq = f.faqs.find((y) => y.question === q.question);
    nyFm = nq ? nyFm.replace(`answer: ${yaml(q.answer)}`, `answer: ${yaml(nq.answer)}`)
      : nyFm.replace(new RegExp(`\\s*- question: ${esc(yaml(q.question))}\\s*\\n\\s*answer: ${esc(yaml(q.answer))}`), '');
  }
  for (const k of faktaboks) {
    const nk = f.faktaboks.find((y) => y.url === k.url && y.source === k.source);
    nyFm = nk ? nyFm.replace(`text: ${yaml(k.text)}`, `text: ${yaml(nk.text)}`)
      : nyFm.replace(new RegExp(`\\s*- text: ${esc(yaml(k.text))}\\s*\\n\\s*source: ${esc(yaml(k.source))}\\s*\\n\\s*url: ${esc(yaml(k.url))}`), '');
  }
  return { fm: nyFm, krop: f.brodtekst, raw: `---${nyFm}---${f.brodtekst}` };
}
