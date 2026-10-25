// Søgespørgsmål til artikler uden (25/10-2026, Jacob: "én opskrift til alle artikler"). Opskrift 3
// kræver et rigtigt Google-søgespørgsmål (targetQuestion), og 158 gamle artikler havde intet - de
// kunne ikke skrives om. Her får hver artikel ét:
//   1. Gemini giver artiklens kerneemne i 1-4 ord ud fra titel og resumé (ét billigt kald).
//   2. Googles søgeforslag (gratis, src/lib/suggest.mjs) giver rigtige spørgsmål om emnet.
//   3. Gemini vælger det spørgsmål, der ligger tættest på artiklens emne (artiklen skrives om til at svare på det) - eller INGEN.
// Et spørgsmål, en anden artikel allerede har, bruges ikke (to artikler må ikke kæmpe om samme søgning).
// Kør: node find-spoergsmaal.mjs [--antal=20] [--vis]
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';
import { hentForslag } from './src/lib/suggest.mjs';

const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=200').split('=')[1]) || 200;
const DIR = './src/content/videos';
const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const alle = filer.map((f) => {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8');
  const fm = raw.replace(/\r/g, '').split('---')[1] || '';
  return {
    f, raw, fm,
    titel: fm.match(/^title:\s*"(.*)"/m)?.[1] || '',
    resume: fm.match(/^summary:\s*"(.*)"/m)?.[1] || '',
    spm: fm.match(/^targetQuestion:\s*"(.*)"/m)?.[1] || '',
    short: /^isShort:\s*true/m.test(fm),
  };
});
const brugte = new Set(alle.map((a) => a.spm.toLowerCase()).filter(Boolean));
const koe = alle.filter((a) => !a.spm && !a.short);
console.log(`${koe.length} artikler mangler søgespørgsmål — tager ${Math.min(antal, koe.length)}`);
if (process.argv.includes('--vis')) { for (const a of koe.slice(0, antal)) console.log(`  ${a.titel}`); process.exit(0); }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const spoerg = async (p) => (await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { temperature: 0, maxOutputTokens: 2048 } }).generateContent(p)).response.text().trim();
let fundet = 0, ingen = 0;
for (const a of koe.slice(0, antal)) {
  try {
    const emne = (await spoerg(`Give the core search topic of this article in 1-4 lowercase words, the way people would type it into Google (for example "crypto market volatility" or "quantum computing"). Output only the words.\n\nTitle: ${a.titel}\nSummary: ${a.resume}`)).split('\n')[0].replace(/["'.]/g, '').toLowerCase().trim();
    // Ingen forslag for et langt emne: prøv de to første ord (målt 25/10: "notion ai automation" gav 0, "agentic ai" gav 100).
    let forslag = (await hentForslag(emne)).filter((q) => !brugte.has(q));
    if (!forslag.length && emne.split(' ').length > 2) forslag = (await hentForslag(emne.split(' ').slice(0, 2).join(' '))).filter((q) => !brugte.has(q));
    if (!forslag.length) { console.log(`INGEN  ${a.f}: ingen søgeforslag for "${emne}"`); ingen++; continue; }
    const valg = (await spoerg(`An article has this title and summary. The article will be rewritten from its source video so it fully answers ONE real Google search. Which ONE of these searches is closest to the article's main topic, so the rewritten article can answer it fully and honestly from the same material? Prefer a specific question over a vague one, and never pick one about a different product or brand than the article covers. Answer with the search exactly as written, or NONE only if every search is about something else.\n\nTitle: ${a.titel}\nSummary: ${a.resume}\n\nSearches:\n${forslag.map((q) => `- ${q}`).join('\n')}`)).split('\n')[0].replace(/^[-"\s]+|["\s]+$/g, '').toLowerCase();
    if (!forslag.includes(valg)) { console.log(`INGEN  ${a.f}: ingen søgning passer (emne "${emne}")`); ingen++; continue; }
    brugte.add(valg);
    // targetQuestion sættes lige efter metaDescription (eller summary), resten af filen røres ikke.
    // Filen læses igen lige før skrivning, så en anden kørsel (fx faktatjek) ikke overskrives.
    const raw = fs.readFileSync(`${DIR}/${a.f}`, 'utf8');
    if (/^targetQuestion:/m.test(raw)) { console.log(`SPRING  ${a.f}: har fået spørgsmål imens`); continue; }
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const anker = /^metaDescription:.*$/m.test(raw) ? /^metaDescription:.*$/m : /^summary:.*$/m;
    const ny = raw.replace(anker, (m) => `${m}${nl}targetQuestion: "${valg.replace(/"/g, "'")}"`);
    fs.writeFileSync(`${DIR}/${a.f}`, ny);
    console.log(`OK     ${a.f}: "${valg}" (emne "${emne}")`);
    fundet++;
  } catch (e) { console.log(`FEJL   ${a.f}: ${e.message.split('\n')[0]}`); }
}
console.log(`\nSPOERGSMAAL: ${JSON.stringify({ fundet, ingen, tilbage: koe.length - fundet - ingen })}`);
