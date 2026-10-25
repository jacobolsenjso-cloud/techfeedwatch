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
