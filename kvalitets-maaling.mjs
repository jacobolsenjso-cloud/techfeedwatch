// Kvalitetsmåling, trin 1 (13/11-2026, Jacobs ja: "du må gerne starte målingen i punkt 1 nu").
// En uafhængig "redaktør" (Gemini, temperatur 0) bedømmer hver artikel med ny opskrift (recipe: 3)
// på indsats, originalitet, faglighed og nøjagtighed (0-100), fem ja/nej-spørgsmål om hjælpsomhed
// og om artiklen har "noget eget". Formålet er at finde grænsen for den strenge kontrol og se,
// hvor mange artikler der ville falde igennem. Intet på sitet ændres; resultatet står i loggen
// og i kvalitet-maaling.json (gemt som bilag til kørslen).
// Bemærk: nøjagtighed bedømmes UDEN Google-søgning (billigere) - tallet er et groft skøn.
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';

const MAPPE = 'src/content/videos';
const SAMTIDIGE = 4;

// Frontmatter læses enkelt: kun de felter, målingen bruger.
function laes(fil) {
  const tekst = fs.readFileSync(fil, 'utf8');
  const m = tekst.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const felt = (navn) => (m[1].match(new RegExp(`^${navn}:\\s*(.*)$`, 'm'))?.[1] || '').trim().replace(/^"|"$/g, '');
  return { slug: path.basename(fil, '.md'), titel: felt('title'), spoergsmaal: felt('targetQuestion'), recipe: felt('recipe'), short: felt('isShort'), tekst: m[2] };
}

const prompt = (a) => `You are an independent senior editor and a Google search quality rater. You did NOT write this article and you have no reason to be kind to it.
Judge the article below honestly, as Google's guidance on helpful, people-first content would.

Score 0-100 (be strict; 50 = typical average web article, 80+ = clearly better than what already ranks):
- effort: how much real work went into it (depth, specifics, examples, structure) versus a quick rewrite
- originality: does it add something not found in the usual top results (own analysis, comparison, data, angle)
- skill: does it read as written by someone who knows the subject
- accuracy: are the facts, numbers, names and dates plausible and correct as far as you know (flag anything doubtful)

Answer yes/no:
- q1_firsthand: does it show first-hand experience or original information, not only a summary of others?
- q2_complete: does it fully answer the target question, so the reader does not need to search again?
- q3_trust: would you trust it - is it clear who wrote it and why, with sources where it matters?
- q4_value: does it add real value compared with other pages on the same question?
- q5_people: is it written for people rather than to rank in search engines?
- own: does it contain at least one concrete thing of its own (a test, a calculation, a comparison, a clear verdict, a worked example)?

Also give:
- weakest: the single biggest weakness, max 25 words
- doubtful_facts: up to 3 short claims that may be wrong or outdated (empty list if none)

Return ONLY JSON: {"effort":0,"originality":0,"skill":0,"accuracy":0,"q1_firsthand":true,"q2_complete":true,"q3_trust":true,"q4_value":true,"q5_people":true,"own":true,"weakest":"","doubtful_facts":[]}

Target question: ${a.spoergsmaal}
Title: ${a.titel}

ARTICLE:
${a.tekst.slice(0, 30000)}`;

const filer = fs.readdirSync(MAPPE).filter((f) => f.endsWith('.md')).map((f) => laes(path.join(MAPPE, f))).filter((a) => a && a.recipe === '3' && a.short !== 'true');
console.log(`Artikler med ny opskrift (recipe 3, ikke shorts): ${filer.length}`);
if (!process.env.GEMINI_API_KEY) { console.log('GEMINI_API_KEY mangler - stopper.'); process.exit(1); }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 4096, temperature: 0, responseMimeType: 'application/json' } });
const PUNKTER = ['effort', 'originality', 'skill', 'accuracy'];
const SPM = ['q1_firsthand', 'q2_complete', 'q3_trust', 'q4_value', 'q5_people'];

async function bedoem(a) {
  try {
    const r = await model.generateContent(prompt(a));
    const j = JSON.parse(r.response.text().replace(/^```(json)?|```$/g, '').trim());
    if (PUNKTER.some((p) => typeof j[p] !== 'number')) throw new Error('mangler point');
    return { slug: a.slug, ...j, laveste: Math.min(...PUNKTER.map((p) => j[p])), nej: SPM.filter((q) => j[q] === false).length };
  } catch (e) {
    return { slug: a.slug, fejl: String(e.message || e).slice(0, 1500) };
  }
}

const resultater = [];
for (let i = 0; i < filer.length; i += SAMTIDIGE) {
  resultater.push(...(await Promise.all(filer.slice(i, i + SAMTIDIGE).map(bedoem))));
  console.log(`   bedømt ${resultater.length}/${filer.length}`);
}
const ok = resultater.filter((r) => !r.fejl);
const fejl = resultater.filter((r) => r.fejl);
fs.writeFileSync('kvalitet-maaling.json', JSON.stringify(resultater, null, 1));

if (fejl.length) console.log('FØRSTE FEJL I FULD LÆNGDE: ' + fejl[0].fejl);
const snit = (p) => Math.round(ok.reduce((s, r) => s + r[p], 0) / (ok.length || 1));
const median = (p) => { const v = ok.map((r) => r[p]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] ?? 0; };
console.log(`\nRESULTAT: ${ok.length} bedømt, ${fejl.length} fejlede${fejl.length ? ' (' + fejl.map((f) => f.slug + ': ' + f.fejl).join(' | ') + ')' : ''}`);
console.log('Gennemsnit / median / laveste / højeste:');
for (const p of PUNKTER) console.log(`   ${p.padEnd(12)} ${snit(p)} / ${median(p)} / ${Math.min(...ok.map((r) => r[p]))} / ${Math.max(...ok.map((r) => r[p]))}`);
console.log('Fordeling af LAVESTE point pr. artikel (svageste punkt):');
for (const [fra, til] of [[0, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 100]]) console.log(`   ${fra}-${til}: ${ok.filter((r) => r.laveste >= fra && r.laveste <= til).length}`);
console.log('Ja/nej-spørgsmål (antal "nej"):');
for (const q of [...SPM, 'own']) console.log(`   ${q.padEnd(13)} ${ok.filter((r) => r[q] === false).length}`);
console.log('Ville falde igennem ved grænse (laveste point under X ELLER intet eget):');
for (const x of [50, 55, 60, 65, 70]) console.log(`   under ${x}: ${ok.filter((r) => r.laveste < x || r.own === false).length} af ${ok.length}`);
console.log(`Artikler med tvivlsomme fakta: ${ok.filter((r) => (r.doubtful_facts || []).length).length}`);
console.log('\nDe 12 svageste (laveste point):');
for (const r of [...ok].sort((a, b) => a.laveste - b.laveste).slice(0, 12)) console.log(`   ${r.laveste} ${r.slug} [${PUNKTER.map((p) => r[p]).join('/')}, eget: ${r.own ? 'ja' : 'nej'}] - ${r.weakest}`);
console.log('\nDe 5 stærkeste:');
for (const r of [...ok].sort((a, b) => b.laveste - a.laveste).slice(0, 5)) console.log(`   ${r.laveste} ${r.slug} [${PUNKTER.map((p) => r[p]).join('/')}]`);

// Rød kørsel, hvis over halvdelen fejlede - en grøn kørsel uden resultater skjuler fejlen (Lære 13/11).
if (fejl.length > resultater.length / 2) process.exit(1);
