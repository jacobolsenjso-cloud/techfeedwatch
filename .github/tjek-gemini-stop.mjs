// Gør kørslen RØD, hvis Gemini-loftet eller -kreditten stoppede dagens omskrivning (20/11-2026).
// Læser den seneste post i src/data/omskriv-log.json: er nogen omskrivning stoppet med en blokerende fejl
// (loft, kredit, nøgle - samme liste som robotten bruger), skrives en fejl, og kørslen fejler.
import fs from 'node:fs';
import { erBlokerende } from '../src/lib/model.mjs';

const laes = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const sidst = laes('src/data/omskriv-log.json').slice(-1)[0];
const idag = new Date().toISOString().slice(0, 10);
if (!sidst || String(sidst.dato).slice(0, 10) !== idag) { console.log('Ingen omskrivning i dag.'); process.exit(0); }
const stop = (sidst.stoppet || []).filter((x) => erBlokerende(x.grund));
if (!stop.length) { console.log(`Gemini svarede: ${sidst.omskrevet?.length || 0} omskrevet, ${sidst.stoppet?.length || 0} stoppet af andre grunde.`); process.exit(0); }
console.log(`::error::GEMINI STOPPET - ${stop.length} omskrivning(er) stoppede på loft/kredit: ${stop[0].grund.slice(0, 220)}`);
console.log('Typisk: månedens udgiftsloft er nået - hæv det i AI Studio (Spend -> Edit spend cap) eller vent til den 1.');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `**Gemini stoppet:** ${stop.length} omskrivning(er) stoppede på udgiftsloftet/kreditten. Hæv loftet i AI Studio eller vent til den 1.\n`);
process.exit(1);
