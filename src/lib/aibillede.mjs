// AI-billede til artiklen (13/10-2026, Jacob valgte A+B+C): ét AI-genereret billede pr.
// artikel, brugt øverst i artiklen, på kortene i lister og som delebillede. Erstatter det
// abstrakte emnekort fra 12/10 (som er reserven, hvis noget her fejler).
//
// Ærlighed over for læseren: mærket "AI-generated" står synligt på billedet, og filen får
// IPTC-mærket "trainedAlgorithmicMedia" i sine metadata (den standard, Google læser for at
// vise, at et billede er AI-lavet). Vandmærket "TechFeedWatch.com" står diskret i hjørnet.
//
// Regler for billedet: ingen tekst, ingen logoer/varemærker, ingen genkendelige personer —
// AI-tekst bliver volapyk, og falske logoer/personer ville være vildledende. Et tjek med
// Gemini afviser billeder, der bryder reglerne (ét nyt forsøg, ellers reserven).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { GEMINI_MODEL, hentModel } from './model.mjs';

export const BILLED_MODEL = 'gemini-nano-banana-2.1'; // ca. 0,034 USD pr. billede (prisliste 12/10)
const RAA_MAPPE = './.cache/ai-billeder';             // originalerne: mærker kan laves om uden at betale igen

// Én fast stil, så sitet ser ensartet ud. Emnet giver en farvetone.
const TONE = {
  'AI & Tech': 'cyan', 'SEO': 'indigo', 'Automation': 'teal', 'Coding': 'blue', 'Business & Money': 'emerald green',
  'AI Video': 'magenta', 'Productivity': 'violet', 'Fintech': 'deep blue', 'Crypto': 'amber', 'Cybersecurity': 'red',
  'Quantum Computing': 'purple', 'Hardware & Chips': 'orange', 'AR & VR': 'pink',
};
export function billedPrompt({ titel, emne, resume }) {
  return `Create a 16:9 editorial illustration for a technology article titled "${titel}".
What the article explains: ${String(resume || '').slice(0, 600)}
Show the core idea as a clear visual metaphor or a realistic object scene that a reader instantly connects with the title.
Style: clean conceptual 3D illustration, soft studio lighting, dark charcoal background, ${TONE[emne] || 'cyan'} accent light, high detail, calm and professional, no clutter.
Strict rules: absolutely NO text, letters, numbers, words or labels anywhere; NO logos, brand names or trademarked products; NO real or recognizable people or faces; no screenshots of real apps or websites.
Avoid objects that usually carry writing: screens, monitors, phones, dashboards, charts, signs, documents, books, labels, price tags, banknotes and keyboards. Show the idea with shapes, light, materials and physical objects instead.`;
}
// (13/10) Den sidste linje i prompten er tilføjet, fordi 6 af de første 8 artikler fik det første
// billede afvist for tekst — modellen skriver typisk på skærme, skilte, dokumenter og grafer.

// Tjekker billedet. Returnerer en liste med fund (tom = godkendt), eller null hvis tjekket ikke kørte.
export async function tjekBillede(genAI, buf) {
  try {
    const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 1024, temperature: 0, responseMimeType: 'application/json' } })
      .generateContent([{ inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') } },
        'Inspect this image. Does it contain any readable or pseudo text, letters or digits; any logo or brand mark; or a recognizable real person or human face? Return JSON only: {"text":false,"logo":false,"person":false}']);
    const j = JSON.parse((r.response.text() || '').replace(/^```(json)?\s*|\s*```$/g, ''));
    return ['text', 'logo', 'person'].filter((k) => j[k] === true);
  } catch { return null; }
}

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Mærkerne lægges på EFTER skalering, så de har samme størrelse i forhold til billedet overalt.
function maerkerSvg(w, h) {
  const fs1 = Math.round(h * 0.034), pad = Math.round(h * 0.035);
  const badgeB = Math.round(fs1 * 0.62 * 'AI-generated'.length + fs1 * 1.2), badgeH = Math.round(fs1 * 1.7);
  const fs2 = Math.round(h * 0.03);
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${pad}" y="${pad}" width="${badgeB}" height="${badgeH}" rx="${Math.round(badgeH / 2)}" fill="#000" fill-opacity="0.6"/>
  <text x="${pad + badgeB / 2}" y="${pad + badgeH * 0.68}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fs1}" font-weight="bold" fill="#fff">AI-generated</text>
  <text x="${w - pad + 1}" y="${h - pad + 1}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${fs2}" font-weight="bold" fill="#000" fill-opacity="0.55">TechFeedWatch.com</text>
  <text x="${w - pad}" y="${h - pad}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${fs2}" font-weight="bold" fill="#fff" fill-opacity="0.8">TechFeedWatch.com</text>
</svg>`);
}

// IPTC-mærket for AI-genererede billeder + kredit og beskrivelse (XMP-metadata i filen).
function xmp(titel) {
  return `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" photoshop:Credit="TechFeedWatch.com (AI-generated)"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">AI-generated illustration: ${xml(titel)}</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>`;
}

// Laver (eller genbruger) det rå billede og skriver de to udgaver.
// ud = { kort: '…/kort/<slug>.webp'     480x270 — kortene i lister (lille fil, 12-21 KB målt 13/10)
//        stor: '…/billeder/<slug>.webp' 960x540 — øverst i artiklen
//        og:   '…/og/<slug>.jpg'        1200x630 — delebillede (Facebook, LinkedIn, X) }
// To størrelser (Jacob 13/10): ét stort billede pr. kort ville gøre forsiden tung (27 kort x 45-86 KB).
// Returnerer { forsoeg, fraCache } eller null (så beholdes reserven: det abstrakte emnekort).
export async function lavAiBillede(genAI, { slug, titel, emne, resume }, ud, { log = console.log, tving = false } = {}) {
  fs.mkdirSync(RAA_MAPPE, { recursive: true });
  const raaSti = path.join(RAA_MAPPE, `${slug}.jpg`);
  let raa = null, forsoeg = 0;
  const fraCache = !tving && fs.existsSync(raaSti);
  if (fraCache) raa = fs.readFileSync(raaSti);
  while (!raa && forsoeg < 2) {
    forsoeg++;
    try {
      const m = genAI.getGenerativeModel({ model: BILLED_MODEL, generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } } });
      const r = await m.generateContent(billedPrompt({ titel, emne, resume }));
      const del = (r.response.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData);
      if (!del) { log(`🖼️ AI-billede forsøg ${forsoeg}: intet billede i svaret`); continue; }
      const buf = Buffer.from(del.inlineData.data, 'base64');
      const fund = await tjekBillede(genAI, buf);
      if (fund && fund.length) { log(`🖼️ AI-billede forsøg ${forsoeg} afvist: ${fund.join(', ')}`); continue; }
      if (fund === null) log(`🖼️ AI-billede forsøg ${forsoeg}: tjekket kunne ikke køre — billedet bruges`);
      raa = buf;
      fs.writeFileSync(raaSti, raa);
    } catch (e) { log(`🖼️ AI-billede forsøg ${forsoeg} fejlede: ${String(e.message).split('\n')[0]}`); }
  }
  if (!raa) { log('🖼️ AI-billede: intet godkendt billede — emnekortet bruges'); return null; }
  const meta = xmp(titel);
  for (const [sti, w, h, fmt, q] of [[ud.kort, 480, 270, 'webp', 72], [ud.stor, 960, 540, 'webp', 80], [ud.og, 1200, 630, 'jpeg', 84]]) {
    if (!sti) continue;
    fs.mkdirSync(path.dirname(sti), { recursive: true });
    const base = await sharp(raa).resize(w, h, { fit: 'cover', position: 'centre' }).toBuffer();
    let s = sharp(base).composite([{ input: maerkerSvg(w, h) }]).withXmp(meta);
    s = fmt === 'webp' ? s.webp({ quality: q }) : s.jpeg({ quality: q });
    await s.toFile(sti);
  }
  log(`🖼️ AI-billede: ${fraCache ? 'genbrugt fra cache' : `lavet (forsøg ${forsoeg})`} — ${path.basename(ud.kort)}`);
  return { forsoeg, fraCache };
}

// Sitets standardstier for en artikel (bruges af robotten og af portionskørslen).
export const sitetsStier = (slug) => ({ kort: `./public/kort/${slug}.webp`, stor: `./public/billeder/${slug}.webp`, og: `./public/og/${slug}.jpg` });
// Har artiklen allerede et AI-billede? (det store billede findes kun, når AI-billedet lykkedes)
export const harAiBillede = (slug) => fs.existsSync(`./public/billeder/${slug}.webp`);
