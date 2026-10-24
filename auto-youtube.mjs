import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import { hentForslag } from './src/lib/suggest.mjs';
import { faellesOrd } from './src/lib/question.mjs';
import { emneRaekke as beregnEmneRaekke } from './src/lib/emner.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel, geminiStop } from './src/lib/model.mjs';
import { fjernDubletter, eksisterendeArtikler } from './src/lib/dublet.mjs';
import { retSpoergsmaal, passerEmnet, redaktoerPrompt } from './src/lib/spoergsmaalsfilter.mjs';
import { forhaandsScorer, SKAER } from './src/lib/forhaandstjek.mjs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// (De gamle TOPIC_CLUSTERS er fjernet. De var 12 klynger mod 10 mærker, og
// forbindelsen mellem "hvad vi søgte på" og "hvilket mærke artiklen fik" blev
// smidt væk efter søgningen. Søgeemnerne bor nu i TOPIC_BY_TAG længere nede,
// ét pr. mærke, så de to ikke kan komme ud af sync.)

// Kuraterede kvalitetskanaler. Robotten henter også fra én roterende kanal pr. kørsel, kombineret med
// dagens emneklynge, så indholdet holder sig på-emne. Alle channelId er verificeret via YouTube API.
const CHANNELS = [
  { id: 'UCAuUUnT6oDeKwE6v1NGQxug', name: 'TED' },
  { id: 'UCcefcZRL2oaA_uBNeo5UOWg', name: 'Y Combinator' },
  { id: 'UCSHZKyawb77ixDdsGog4iWA', name: 'Lex Fridman' },
  { id: 'UC9cn0TuPq4dnbTY-CBsm8XA', name: 'a16z' },
  { id: 'UCbfYPyITQ-7l4upoX8nvctg', name: 'Two Minute Papers' },
  { id: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship' },
  { id: 'UCqK_GSMbpiV8spgD3ZGloSw', name: 'Coin Bureau' },
  { id: 'UCknLrEdhRCp1aegoMqRaCZg', name: 'DW News' },
  { id: 'UCrM7B7SL_g1edFOnmj-SDKg', name: 'Bloomberg Tech' },
  { id: 'UCIALMKvObZNtJ6AmdCLP7Lg', name: 'Bloomberg Television' },
  { id: 'UCUMZ7gohGI9HcU9VNsr2FJQ', name: 'Bloomberg Originals' },
  { id: 'UCEAZeUIeJs0IjQiqTCdVSIg', name: 'Yahoo Finance' },
  { id: 'UC_fyAp919RnkKmBrMXGwnUQ', name: 'Google Career Certificates' },
  { id: 'UCeeFfhMcJa1kjtfZAGskOCA', name: 'TechLinked' },
  // Nye høj-CPC / analyse-tunge kanaler. ID'er opløses fra @handle ved kørsel (forHandle),
  // så en evt. forkert handle bare springes pænt over uden at stoppe robotten.
  { handle: '@mreflow', name: 'Matt Wolfe' },
  { handle: '@matthew_berman', name: 'Matthew Berman' },
  { handle: '@IBMTechnology', name: 'IBM Technology' },
  { handle: '@ColdFusion', name: 'ColdFusion' },
  { handle: '@GrahamStephan', name: 'Graham Stephan' },
  { handle: '@CNBC', name: 'CNBC' },
  { handle: '@AhrefsCom', name: 'Ahrefs' },
  { handle: '@NetworkChuck', name: 'NetworkChuck' },
];

// Højst én artikel pr. kørsel. Det er med vilje: med 3 pr. kørsel og et lavt
// dagsloft blev hele dagens output udgivet i de første par kørsler, og dermed
// hentet fra den ene eller to kanaler og emneklynger, som netop de kørsler ramte.
// Med 1 pr. kørsel fordeles dagens artikler over fire forskellige tidspunkter,
// kanaler og klynger.
const MAX_NORMAL_PER_RUN = 1;

// Dagligt udgivelsesLOFT — ikke et mål. Loftet varierer deterministisk med
// datoen (samme dag = samme loft på tværs af døgnets kørsler, uden delt
// hukommelse): hverdage 2-3 artikler, weekend 1-3 (16/10). Præcis
// fire artikler hver eneste dag var et maskinaftryk; rigtige redaktioner
// svinger og udgiver mindre i weekenden. Kvaliteten bestemmer stadig: godkender
// kontrollerne kun én video en dag med loft 5, udgives én. En dag med 0 er OK.
function dagensLoft() {
  const nu = new Date();
  const dato = nu.toISOString().split('T')[0];
  let h = 0;
  for (let i = 0; i < dato.length; i++) h = (Math.imul(31, h) + dato.charCodeAt(i)) | 0;
  h = Math.abs(h);
  const ugedag = nu.getUTCDay(); // 0 = søndag, 6 = lørdag
  // Max 3 om dagen (Jacob, 16/10): med starteren nås loftet hver dag, og prisen fulgte med
  // (målt 15/10: 6 artikler, 4,72 USD). Før: max 5 (15/9), hverdage 2-5.
  const muligheder = (ugedag === 0 || ugedag === 6) ? [1, 2, 3] : [2, 3];
  return muligheder[h % muligheder.length];
}
const MAX_PER_DAY = dagensLoft();

// Friskheds-vindue: kun videoer nyere end dette, så feedet føles aktuelt. Nem at justere.
const FRESHNESS_DAYS = 180;
const PUBLISHED_AFTER = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

// Ét søgeemne pr. mærke — de samme mærker som artiklerne bruger, så en søgning
// altid kan oversættes direkte til ét mærke. Tidligere var der 12 emneklynger
// og 10 mærker, og forbindelsen mellem dem blev smidt væk efter søgningen.
// "|" betyder ELLER i YouTube-søgningen.
const TOPIC_BY_TAG = {
  "AI & Tech": "AI|artificial intelligence|machine learning|LLM|ChatGPT|Claude|Gemini|OpenAI|smart glasses|AR|VR|cloud computing|AWS|Azure|Kubernetes|DevOps",
  "Business & Money": "personal finance|passive income|retirement planning|wealth building|ecommerce|Shopify|dropshipping|online business|digital products|startup",
  "Fintech": "fintech|financial technology|neobank|digital banking|payments|stablecoins|algorithmic trading|open banking|AI in finance|core banking",
  "Automation": "workflow automation|AI automation|no-code|n8n|Zapier|business process automation|agentic workflows|RPA|automated pipelines",
  "Crypto": "cryptocurrency|crypto|bitcoin|ethereum|solana|DeFi|blockchain|Web3|smart contracts|tokenization|altcoins",
  "Coding": "coding|programming|software engineering|Python|JavaScript|developer tools|vibe coding|AI coding|open source|system design",
  "Productivity": "productivity|AI assistant|Notion|NotebookLM|second brain|note taking|AI workflow|digital productivity|knowledge management",
  "SEO": "SEO|search engine optimization|generative engine optimization|AEO|technical SEO|link building|content strategy|Google ranking",
  "Cybersecurity": "cybersecurity|infosec|data breach|ransomware|zero trust|network security|ethical hacking|penetration testing|cloud security|AI security",
  "AI Video": "AI video|text to video|Sora|Runway|Veo|Kling|AI filmmaking|Midjourney|AI image generation|AI content creation",
  // Kvante og hardware er egne emner, ikke undergrupper af AI. Kvantecomputere
  // har intet med sprogmodeller at gøre, og chips er sin egen industri med sin
  // egen søgning. De blev udskilt fra AI & Tech-paraplyen, hvor de lå begravet.
  "Quantum Computing": "quantum computing|qubit|quantum supremacy|quantum advantage|post-quantum cryptography|quantum hardware|QPU|quantum error correction",
  "Hardware & Chips": "AI chips|semiconductors|GPU|TPU|Nvidia|data center|AI infrastructure|chip manufacturing|foundry|silicon|compute costs|edge AI hardware",
  // AR/VR laa spredt under AI & Tech og Productivity, hvor ingen fandt dem.
  // 19 artikler — flere end Hardware & Chips havde da det blev skilt ud.
  "AR & VR": "augmented reality|virtual reality|mixed reality|smart glasses|spatial computing|AR glasses|VR headset|immersive technology",
  // Fem nye emner (Jacob 17/10). De tre første led er frø til Googles autocomplete.
  "AI Agents": "AI agents|agentic AI|autonomous agents|AI agent frameworks|multi-agent systems|computer use agents|MCP servers|AI agent tools",
  "Investing & Trading": "investing|stock market|trading|index funds|ETF|day trading|options trading|dividend investing|investing apps|portfolio",
  "Smartphones & Gadgets": "smartphones|iPhone|Android phones|gadgets|wearables|smartwatch|tablets|wireless earbuds|consumer tech",
  "Robotics": "robotics|humanoid robots|robots|industrial robots|Boston Dynamics|Tesla Optimus|physical AI|robot vacuum",
  "PC Building & Gaming": "PC building|gaming PC|PC build guide|graphics cards|gaming laptops|PC parts|PC upgrade|gaming performance",
};

// Tæller hvor mange artikler der bærer hvert mærke. Bruges til at vælge det
// mærke der halter bagud, så fordelingen retter sig selv over tid.
function countArticlesByTag() {
  const dir = './src/content/videos';
  const counts = Object.fromEntries(Object.keys(TOPIC_BY_TAG).map((t) => [t, 0]));
  if (!fs.existsSync(dir)) return counts;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const block = content.match(/^tags:\r?\n((?:\s*-\s*.*\r?\n?)*)/m);
    if (!block) continue;
    for (const line of block[1].split(/\r?\n/)) {
      const tag = line.replace(/^\s*-\s*/, '').replace(/^"|"$/g, '').trim();
      if (tag in counts) counts[tag]++;
    }
  }
  return counts;
}

// Vælger det mærke med færrest artikler. Ved uafgjort afgør klokkeslættet, så
// to kørsler i træk ikke rammer det samme. Det erstatter den gamle vægtede
// rotation, der med vilje favoriserede høj-CPC-emner og dermed holdt de tynde
// emner tynde.
function pickThinnestTag(counts) {
  const min = Math.min(...Object.values(counts));
  const tied = Object.keys(counts).filter((t) => counts[t] === min);
  const slot = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % tied.length;
  return tied[slot];
}

// Henter spørgsmål fra Googles autocomplete og vælger ét vi ikke har brugt før.
//
// Emnet i TOPIC_BY_TAG er en søgestreng med lodrette streger ("AI|machine
// learning|LLM"). Autocomplete skal have almindelig tekst, så vi tager det
// første led — resten er alternativer til YouTube-søgningen, ikke til Google.
//
// Brugte spørgsmål gemmes, så robotten ikke skriver om det samme igen. Filen
// er lille: ét spørgsmål pr. artikel.
// "Prøvet uden held" (18/9): et spørgsmål, hvor ingen kandidat bestod
// relevans-tjekket, lægges på is i PROEVET_DAGE dage — det er ikke brugt (ingen
// artikel), men det nytter ikke at prøve igen i morgen med samme videoer.
// Målt 18/9 (#543): "why ai videos look like dreams" gav 4 kandidater på 0–1/10.
const PROEVET = 'src/data/tried-questions.json';
const PROEVET_DAGE = 30;
function laesProevet() {
  try { return JSON.parse(fs.readFileSync(PROEVET, 'utf8')); } catch { return []; }
}
function markerSpoergsmaalProevet(q, tag) {
  const liste = laesProevet().filter((x) => x.q !== q);
  liste.push({ q, tag, dato: new Date().toISOString().slice(0, 10) });
  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync(PROEVET, JSON.stringify(liste, null, 1) + '\n', 'utf8');
}
function proevetForNylig() {
  const graense = Date.now() - PROEVET_DAGE * 864e5;
  return new Set(laesProevet().filter((x) => new Date(x.dato).getTime() > graense).map((x) => x.q));
}

// Sættes af vaelgSpoergsmaal, når der VAR ubrugte spørgsmål, men alle var
// dubletter af eksisterende artikler. Så skal kørslen ikke falde tilbage til
// "emnet alene", for det er netop sådan en dublet slipper uden om værnet.
let alleVarDubletter = false;

// udelad: spørgsmål der ikke må vælges (fx allerede prøvet i denne kørsel).
async function vaelgSpoergsmaal(tag, topic, udelad = new Set()) {
  alleVarDubletter = false;
  const BRUGTE = 'src/data/used-questions.json';
  let brugte = [];
  if (fs.existsSync(BRUGTE)) {
    try { brugte = JSON.parse(fs.readFileSync(BRUGTE, 'utf8')); } catch { brugte = []; }
  }
  const set = new Set([...brugte.map((x) => x.q), ...proevetForNylig(), ...udelad]);

  // Flere frø pr. emne (18/9): før kun første led af TOPIC_BY_TAG ("augmented
  // reality"); nu de tre første ("augmented reality", "virtual reality",
  // "mixed reality"), så et emne ikke løber tør, når ét frø er brugt op.
  const froe = String(topic).split('|').map((x) => x.trim()).filter(Boolean).slice(0, 3);
  let forslag = [];
  for (const f of froe) {
    try { forslag.push(...await hentForslag(f)); }
    catch (e) { console.log(`Info: autocomplete svarede ikke for "${f}" (${e.message}).`); }
  }
  forslag = [...new Set(forslag)];
  if (!forslag.length) return null;

  let ubrugte = forslag.filter((s) => !set.has(s));
  if (!ubrugte.length) return null;
  // Højst 40 forslag til redaktøren (14/10, målt i prøve #11): med 100+ forslag tænkte modellen
  // 7.864 tokens og ramte loftet på 8192 — svaret blev klippet, og listen gik ufiltreret videre.
  // Klokkeslættet vælger hvilke 40, så alle forslag kommer i spil over tid.
  const MAX_TIL_REDAKTOER = 40;
  if (ubrugte.length > MAX_TIL_REDAKTOER) {
    const s0 = Math.floor(Date.now() / 3600e3) % ubrugte.length;
    ubrugte = [...ubrugte.slice(s0), ...ubrugte.slice(0, s0)].slice(0, MAX_TIL_REDAKTOER);
  }

  // Gemini som redaktør: hvilke af forslagene er rigtige, klare spørgsmål,
  // man kan skrive en artikel om? Autocomplete gav 12/9 "how are ai chips
  // cooked" (slang for "færdige"), og overskrifts-værnet tvang ordet ind i
  // overskriften. Ét billigt kald pr. kørsel; fejler det, bruges listen som den er.
  if (process.env.GEMINI_API_KEY && ubrugte.length > 1) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Strammet 18/9: "why ai videos look like dreams" slap igennem — poetisk,
      // uden fakta at svare med. Nu skal spørgsmålet kunne besvares konkret.
      // Prompten bor i spoergsmaalsfilter.mjs (14/10), så den kan testes alene.
      const prompt = redaktoerPrompt(ubrugte);
      // 8192, ikke 512 (14/10, målt): tænkningen tæller med i loftet. Med ~100 forslag brugte
      // modellen 3438 tokens på at tænke + 266 på svaret; 512 gav INTET svar (3 af 3 forsøg), og
      // 4096 lå på kanten. Uden svar blev listen brugt ufiltreret uden et ord i loggen, og volapyk
      // som "how is programming com company" slap igennem. (Samme fejl som Lære 1/10.)
      const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0 } }).generateContent(prompt);
      const m = (r.response.text() || '').match(/\[[\d,\s]*\]/);
      if (!m) console.log(`Info: Spørgsmåls-redaktøren gav intet svar — bruger listen ufiltreret (${ubrugte.length} forslag).`);
      if (m) {
        const behold = new Set(JSON.parse(m[0]).map((n) => n - 1));
        const godkendte = ubrugte.filter((_, i) => behold.has(i));
        const afviste = ubrugte.filter((_, i) => !behold.has(i));
        if (afviste.length) console.log(`Info: Spørgsmål afvist som uklare/slang: ${afviste.map((s) => `"${s}"`).join(', ')}`);
        if (godkendte.length) ubrugte = godkendte;
      }
    } catch (e) {
      console.log(`Info: spørgsmåls-tjek fejlede (${e.message}) — bruger listen som den er.`);
    }
  }

  // Dublet-værn (1/10): ingen ny artikel om et spørgsmål, sitet allerede
  // besvarer. Er ALLE kandidater dubletter, springes kørslen over (se
  // alleVarDubletter) — hellere ingen artikel end en, der konkurrerer med vores egen.
  // Kandidaterne prøves ÉN AD GANGEN i den rækkefølge, klokkeslættet giver,
  // og den første, der ikke er en dublet, vælges. Målt 1/10: alle 17 på én
  // gang fik modellens svar klippet, og det koster 3 kald pr. kandidat — én ad
  // gangen er typisk 3 små kald i alt. Højst MAX_DUBLET_TJEK prøves pr. kørsel.
  // Klokkeslættet (timen) vælger startpunktet, så to kørsler i træk ikke
  // nødvendigvis tager det samme spørgsmål, hvis den første ikke fik udgivet noget.
  const MAX_DUBLET_TJEK = 6;
  const start = Math.floor(Date.now() / (1000 * 60 * 60)) % ubrugte.length;
  const raekke = [...ubrugte.slice(start), ...ubrugte.slice(0, start)].slice(0, MAX_DUBLET_TJEK);
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const artikler = eksisterendeArtikler();
  let valgt = null;
  for (const q of raekke) {
    const { behold, afvist } = await fjernDubletter([q], { genAI, hentModel, model: GEMINI_MODEL, artikler });
    if (afvist.length) { console.log(`Info: Dublet afvist: "${q}" ~ ${afvist[0].slug} [${afvist[0].lag}]`); continue; }
    if (behold.length) { valgt = q; console.log(`Info: Dublet-tjek bestået: "${q}" dækkes ikke af en eksisterende artikel.`); break; }
  }
  if (!valgt) { alleVarDubletter = true; return null; }
  // Spørgsmålet gemmes IKKE her — først når en artikel faktisk er udgivet
  // (se markerSpoergsmaalBrugt). Målt 15/9: kørsel #523 brugte "what is ai
  // video specialist" op uden artikel, fordi YouTube blokerede alle videoer.
  return valgt;
}

// Gemmer spørgsmålet som brugt. Kaldes kun, når en artikel er skrevet.
function markerSpoergsmaalBrugt(q, tag) {
  const BRUGTE = 'src/data/used-questions.json';
  let brugte = [];
  try { brugte = JSON.parse(fs.readFileSync(BRUGTE, 'utf8')); } catch { brugte = []; }
  if (brugte.some((x) => x.q === q)) return;
  brugte.push({ q, tag, dato: new Date().toISOString().slice(0, 10) });
  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync(BRUGTE, JSON.stringify(brugte, null, 1) + '\n', 'utf8');
}

// Vælger kanal ud fra tidspunktet, så hver kørsel også tager næste kanal i rækken (roterer uafhængigt af klynger).
function pickChannel() {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % CHANNELS.length;
  return CHANNELS[idx];
}

async function searchVideos(query, { videoDuration, order, maxResults }) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoCategoryId: '28',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    regionCode: 'US',
    videoDuration,
    order,
    publishedAfter: PUBLISHED_AFTER,
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}

// Opløser en @handle til et UC-kanal-ID via YouTube API (kanaler tilføjet med handle i stedet for fast id).
// Returnerer null ved fejl/ukendt handle, så robotten bare fortsætter med de øvrige søgninger.
async function resolveChannelId(handle) {
  const h = handle.startsWith('@') ? handle : '@' + handle;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items?.[0]?.id || null;
  } catch (e) {
    return null;
  }
}

// Henter videoer fra én specifik kanal, kombineret med dagens emne-query så vi holder os på-emne.
// Intet kategori-filter her (kanaler som TED spænder bredt) - engelsk-filter + Gemini-tjek fanger resten.
// --- Kanal-værn (24/10, Jacob) -------------------------------------------------
// Målt 24/10: "Remote AI Hub" (splinterny, autogeneret fabrikskanal med computer-
// stemme + baggrundsmusik) fik relevans 10/10 og endte i en artikel — relevans-
// dommen måler EMNET, ikke afsenderen. Værnet afviser kandidater fra kanaler, der
// ligner fabrikker: (a) under 90 dage gamle, (b) under 1 år gamle OG over 1 video
// om dagen, (c) under 1 år gamle OG skjuler abonnenttal. Reglerne gælder KUN unge
// kanaler: store etablerede outlets (fx nyhedskanaler) poster lovligt 5+/dag.
// Bevidst INTET abonnent-minimum — små kanaler med stærke videoer er sitets filosofi
// (Best of each topic). Fejler API-kaldet, siger værnet ok: det må aldrig vælte en
// kørsel. Pris: 1 quota-enhed pr. 50 kanaler pr. kørsel (cache på tværs af grupper).
const VAERN_MIN_KANAL_DAGE = 90;
const VAERN_UNG_KANAL_DAGE = 365;
const VAERN_MAKS_VIDEOER_PR_DAG = 1;
const kanalVaernCache = new Map(); // channelId -> { ok, grund }
async function kanalVaern(channelIds) {
  const ukendte = [...new Set(channelIds)].filter((id) => id && !kanalVaernCache.has(id));
  let tjekket = 0, fabrikker = 0; // 24/10: tælles og skrives i loggen, så robot-log.mjs kan vise det
  for (let i = 0; i < ukendte.length; i += 50) {
    const gruppe = ukendte.slice(i, i + 50);
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${gruppe.join(',')}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      // 24/10: et fejlsvar fra YouTube (fx opbrugt kvote) kaster IKKE — det kommer som { error } uden
      // items og blev før tavst til "alle ok". Nu går det til catch og skrives i loggen.
      // Fejlteksten bygges kun af status + årsagskode — URL'en (med nøglen) skrives aldrig.
      if (!res.ok || data.error) throw new Error(`HTTP ${res.status}${data.error?.errors?.[0]?.reason ? ` ${data.error.errors[0].reason}` : ''}`);
      tjekket += (data.items || []).length;
      for (const k of data.items || []) {
        const dage = Math.max(1, (Date.now() - new Date(k.snippet?.publishedAt || 0).getTime()) / 86400000);
        const videoer = Number(k.statistics?.videoCount || 0);
        let grund = '';
        if (dage < VAERN_MIN_KANAL_DAGE) grund = `kanalen er kun ${Math.round(dage)} dage gammel (kræver ${VAERN_MIN_KANAL_DAGE})`;
        else if (dage < VAERN_UNG_KANAL_DAGE && videoer / dage > VAERN_MAKS_VIDEOER_PR_DAG) grund = `${videoer} videoer på ${Math.round(dage)} dage (fabriks-kadence)`;
        else if (dage < VAERN_UNG_KANAL_DAGE && k.statistics?.hiddenSubscriberCount) grund = 'ung kanal, der skjuler abonnenttal';
        if (grund) fabrikker++;
        kanalVaernCache.set(k.id, grund ? { ok: false, grund } : { ok: true });
      }
      for (const id of gruppe) if (!kanalVaernCache.has(id)) kanalVaernCache.set(id, { ok: true });
    } catch (e) {
      // Fail-open som før (må aldrig vælte en kørsel) — men nu synligt. Ordlyden læses af robot-log.mjs.
      console.log(`⚠️ Kanal-værn: YouTube-opslag fejlede (${String(e?.message || e).slice(0, 120)}) — ${gruppe.length} kanaler lukket igennem uden tjek.`);
      for (const id of gruppe) kanalVaernCache.set(id, { ok: true });
    }
  }
  // Ordlyden læses af robot-log.mjs ("Kanal-værn: N kanaler tjekket").
  if (ukendte.length) console.log(`Info: Kanal-værn: ${tjekket} kanaler tjekket, ${fabrikker} ligner fabrikker.`);
  return kanalVaernCache;
}

async function searchChannel(channelId, query, maxResults) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    regionCode: 'US',
    order: 'relevance',
    publishedAfter: PUBLISHED_AFTER,
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}

// Ekstra opslag pr. video for at filtrere hårdere på engelsk lyd, før add-video.mjs kaldes
async function isEnglishAudio(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const snippet = data.items?.[0]?.snippet;
  const lang = snippet?.defaultAudioLanguage || snippet?.defaultLanguage;

  if (lang && !lang.toLowerCase().startsWith('en')) {
    console.log(`ℹ️ Sprunget over: ikke-engelsk lyd (${lang}) for ${videoId}`);
    return false;
  }
  return true; // Sprog ukendt -> lad add-video.mjs's Gemini-tjek afgøre det
}

// Bygger ét sæt af youtubeIds der allerede findes i src/content/videos, ved at læse frontmatter
// i alle .md-filer. Filnavnet er nu en titel-slug, ikke videoId, så fs.existsSync(`${videoId}.md`)
// virker ikke længere - vi må slå youtubeId op inde i filerne i stedet.
function loadExistingVideoIds() {
  const dir = './src/content/videos';
  const ids = new Set();
  if (!fs.existsSync(dir)) return ids;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    if (match) ids.add(match[1]);
  }
  // Slettede/sammenlagte artikler: deres gamle /video/<youtubeId> står i _redirects.
  // Uden dette kunne robotten vælge en slettet video igen (fx reklamen for Nas.io, slettet 7/10).
  const red = './public/_redirects';
  if (fs.existsSync(red)) {
    for (const m of fs.readFileSync(red, 'utf-8').matchAll(/^\/video\/([A-Za-z0-9_-]{11})\/?\s/gm)) ids.add(m[1]);
  }
  return ids;
}

// Tæller hvor mange artikler der allerede er udgivet i dag, så MAX_PER_DAY kan
// håndhæves på tværs af døgnets 12 kørsler. Datoen læses fra frontmatter, som
// add-video.mjs sætter til udgivelsesdagen i UTC.
function countPublishedToday() {
  const dir = './src/content/videos';
  if (!fs.existsSync(dir)) return 0;

  const today = new Date().toISOString().split('T')[0];
  let count = 0;

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const match = content.match(/^date:\s*"(.*?)"/m);
    if (match && match[1] === today) count++;
  }
  return count;
}

// Fjerner dubletter på videoId. `seen` deles på tværs af kald, så normale og shorts aldrig overlapper.
function dedupeById(items, seen) {
  return items.filter(item => {
    const videoId = item.id?.videoId;
    if (!videoId || seen.has(videoId)) return false;
    seen.add(videoId);
    return true;
  });
}

// Behandler op til maxCount videoer fra én gruppe (normale ELLER shorts). Robottens links er altid /watch?v=.
// spoergsmaal sendes med som parameter — den var tidligere refereret fra ydre
// scope og fandtes ikke her: ReferenceError på hver eneste kandidat, 20 grønne
// kørsler uden én artikel. Fundet ved lokal kørsel 23/8.
//
// Bedste kandidat, ikke første (12/9): før blev den første video, der slap
// gennem kontrollerne, til dagens artikel — uanset om nummer to var langt
// rigere på fakta. Nu laves faktaark for op til KANDIDATER videoer (billige
// kald: transskript + sprogtjek + relevans + faktaark), og artiklen skrives
// kun for den med flest konkrete punkter. Falder den igennem (fx tal uden
// dækning), prøves den næstbedste.
const KANDIDATER = 4;

function faktaarkScoreFor(videoUrl, tag, qArg) {
  try {
    const ud = execSync(`node add-video.mjs "${videoUrl}" --tag "${tag}"${qArg} --faktaark-only`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write(ud.split('\n').map((l) => '   │ ' + l).join('\n') + '\n');
    const m = ud.match(/FAKTAARK-SCORE:\s*(\d+)/);
    const score = m ? Number(m[1]) : 0;
    // Blokeret = YouTube droslede OG gav til sidst ingen undertekster. Det er
    // ikke videoens skyld men serverens adresse, så de næste kandidater er
    // blokeret med. Kalderen stopper kørslen efter to i træk.
    const blokeret = /drosler/.test(ud) && /ingen undertekster/.test(ud);
    // Afvist af et værn (sprog, relevans, for tynd) = ubrugelig, uanset score.
    return { score: /Sprunget over/.test(ud) ? 0 : score, blokeret };
  } catch (e) {
    console.log(`   │ faktaark fejlede: ${e.message.split('\n')[0]}`);
    return { score: 0, blokeret: false };
  }
}

// spoergsmaal: den rå søgning (gemmes som brugt). visSpoergsmaal: den rettede
// udgave fra spørgsmålsfilteret — det er den, artiklen får som targetQuestion.
// B (16/10): højst ét skrevet forsøg pr. kørsel. add-video lægger mærket, når skrivningen begynder.
const SKRIVE_MAERKE = '.cache/skrive-forsoeg';
let skrevetForsoegFejlet = false;
async function processGroup(items, label, maxCount, existingIds, tag, spoergsmaal, visSpoergsmaal = spoergsmaal) {
  let processed = 0;
  const qArg = visSpoergsmaal ? ` --question "${visSpoergsmaal.replace(/"/g, '')}"` : '';

  // Første sigte: dubletter og ikke-engelsk lyd væk, så vi ikke betaler for dem.
  // 14/10: første sigte samler op til 2 x KANDIDATER; forhåndstjekket nedenfor sorterer dem, og
  // kun de KANDIDATER bedste får et dyrt faktaark. Det dyre antal er altså uændret.
  await kanalVaern(items.map((it) => it.snippet?.channelId)); // 24/10: ét kald for alle kandidaters kanaler
  let kandidater = [];
  for (const item of items) {
    if (kandidater.length >= KANDIDATER * 2) break;
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    // Kanal-værn (24/10): fabrikskanaler sorteres fra, FØR der bruges tid og penge.
    const kv = kanalVaernCache.get(item.snippet?.channelId);
    if (kv && !kv.ok) {
      console.log(`ℹ️ Springer over: kanal-værn: "${item.snippet?.channelTitle || item.snippet?.channelId}" — ${kv.grund} (${videoId}).`);
      continue;
    }
    // Filnavnet er en titel-slug, ikke videoId - tjekker derfor mod det forudindlæste sæt af
    // youtubeIds i stedet for fs.existsSync(`${videoId}.md`)
    if (existingIds.has(videoId)) {
      console.log(`ℹ️ Springer over: Video ${videoId} er allerede udgivet.`);
      continue;
    }
    // Gratis for-tjek (ingen ventetid, ingen modelkald): deler videoens titel
    // eller beskrivelse ikke ét eneste kerneord med spørgsmålet, er den nok ikke
    // svaret. Målt 15/9 (#523): to DeepSeek-videoer fik 12 min hver for
    // spørgsmålet "what is ai video specialist" og karakter 0 og 1.
    // "ai" og "tech" tæller ikke — dem deler alt (samme regel som ankerTjek).
    const spmUdenAi = (spoergsmaal || '').replace(/\b(ai|tech)\b/gi, ' ').trim();
    if (spmUdenAi && /[a-z]{3,}/i.test(spmUdenAi)) {
      const tekst = `${item.snippet?.title || ''} ${item.snippet?.description || ''}`;
      if (faellesOrd(spmUdenAi, tekst) === 0) {
        console.log(`ℹ️ Springer over: "${item.snippet?.title}" deler intet kerneord med spørgsmålet (${videoId}).`);
        continue;
      }
    }
    if (!(await isEnglishAudio(videoId))) continue;
    kandidater.push(videoId);
  }

  // Forhåndstjek (14/10): ét billigt kald på titler + beskrivelser, før de dyre faktaark.
  // Målt på dagens 14 kandidater: 10 af 13 senere afviste var tydeligt urelevante, 0 gode tabt.
  if (spoergsmaal && kandidater.length && process.env.GEMINI_API_KEY) {
    const snippet = new Map(items.map((it) => [it.id?.videoId, it.snippet || {}]));
    const scorer = await forhaandsScorer(new GoogleGenerativeAI(process.env.GEMINI_API_KEY), visSpoergsmaal || spoergsmaal,
      kandidater.map((id) => ({ id, titel: snippet.get(id)?.title || '', beskrivelse: snippet.get(id)?.description || '' })));
    for (const id of [...kandidater]) {
      const s = scorer.get(id);
      if (s !== undefined && s <= SKAER) {
        console.log(`ℹ️ Springer over (forhåndstjek ${s}/10): "${snippet.get(id)?.title}" (${id}).`);
        kandidater.splice(kandidater.indexOf(id), 1);
      }
    }
    // De mest lovende først (stabil sortering: uden score beholdes søgningens rækkefølge).
    if (scorer.size) kandidater.sort((a, b) => (scorer.get(b) ?? 5) - (scorer.get(a) ?? 5));
  }
  if (kandidater.length > KANDIDATER) {
    console.log(`Info: ${kandidater.length} kandidater efter forhåndstjek — vurderer de ${KANDIDATER} mest lovende fuldt.`);
    kandidater = kandidater.slice(0, KANDIDATER);
  }

  // Andet sigte: faktaark for hver, rangeret efter score.
  // Blokerer YouTube to kandidater i træk (12 min ventetid hver), er resten
  // også blokeret — så stopper vi i stedet for at spilde 48 min. Målt 15/9:
  // kørsel #523 og #525 ventede 4 x 12 min på ingenting.
  const rangeret = [];
  let blokeretITraek = 0;
  for (const videoId of kandidater) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`🔎 Vurderer kandidat: ${videoUrl}`);
    const { score, blokeret } = faktaarkScoreFor(videoUrl, tag, qArg);
    console.log(`   score ${score}`);
    if (score > 0) rangeret.push({ videoId, score });
    blokeretITraek = blokeret ? blokeretITraek + 1 : 0;
    if (blokeretITraek >= 2 && !rangeret.length) {
      console.log('⛔ YouTube blokerer undertekster fra denne server — stopper kørslen her (2 kandidater i træk uden undertekster).');
      break;
    }
  }
  rangeret.sort((a, b) => b.score - a.score);
  if (rangeret.length) console.log(`Info: Rangering: ${rangeret.map((r) => `${r.videoId} (${r.score})`).join(' · ')}`);
  else console.log('Info: Ingen af kandidaterne bestod kontrollerne.');

  for (const { videoId } of rangeret) {
    if (processed >= maxCount) break;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`▶️ Behandler NY ${label}: ${videoUrl}`);

    fs.rmSync(SKRIVE_MAERKE, { force: true });
    try {
      // Mærket sendes med, så artiklen havner under det emne robotten ledte efter.
      execSync(`node add-video.mjs "${videoUrl}" --tag "${tag}"${qArg}`, { stdio: 'inherit' });
      // add-video kan afvise (sprogtjek, tyndt transskript) og alligevel slutte
      // pænt. Kun en faktisk skrevet artikel tæller mod dagens loft — ellers
      // æder afvisninger budgettet, og næste kandidat får aldrig chancen.
      if (loadExistingVideoIds().has(videoId)) {
        processed++;
        existingIds.add(videoId); // undgår dubletbehandling inden for samme kørsel
        if (spoergsmaal) markerSpoergsmaalBrugt(spoergsmaal, tag); // først NU er spørgsmålet brugt
      } else if (!fs.existsSync(SKRIVE_MAERKE)) {
        console.log(`ℹ️ Kandidat afvist af kvalitetsværn — prøver næste.`);
      }
    } catch (subError) {
      console.error(`❌ Fejl ved oprettelse af video ${videoId}:`, subError.message);
    }
    // B (16/10): en artikel blev SKREVET (dyre trin betalt) men ikke gemt -> stop kørslen.
    // Målt 15/10: 44 % af robottens pris gik til kasserede artikler, ofte 2 i samme kørsel.
    // Afvisninger FØR skrivningen (sprog, relevans, faktaark) må stadig prøve næste kandidat.
    if (!loadExistingVideoIds().has(videoId) && fs.existsSync(SKRIVE_MAERKE)) {
      skrevetForsoegFejlet = true;
      console.log('Info: STOP — en skrevet artikel blev kasseret. Ingen flere forsøg i denne kørsel (sparer penge); næste kørsel prøver igen.');
      break;
    }
  }

  return processed;
}

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // node auto-youtube.mjs --dry-run: viser fordelingen og hvad der ville blive
  // valgt, uden at bruge et eneste API-kald eller udgive noget. Ligger FØR
  // dagsloftet, så man kan tjekke fordelingen selv når dagens kvote er brugt.
  if (process.argv.includes('--dry-run')) {
    const dryCounts = countArticlesByTag();
    console.log('TØRT LØB — intet udgives.\n');
    for (const [t, n] of Object.entries(dryCounts).sort((a, b) => a[1] - b[1])) {
      console.log(`  ${String(n).padStart(4)}  ${t}`);
    }
    const dryAntal = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).length;
    const dryTag = beregnEmneRaekke(dryCounts, dryAntal, Math.floor(Date.now() / (1000 * 60 * 60 * 2)))[0];
    console.log(`\nVille vælge mærket: "${dryTag}"`);

    // Spørgsmålet hentes også i det tørre løb — ellers tester man kun halvdelen
    // af kæden. Autocomplete koster ingenting og kræver ingen nøgle.
    // --keep gemmer valget; uden det rulles filen tilbage, så et tjek ikke
    // bruger et spørgsmål op.
    const foer = fs.existsSync('src/data/used-questions.json')
      ? fs.readFileSync('src/data/used-questions.json', 'utf8') : null;
    const q = await vaelgSpoergsmaal(dryTag, TOPIC_BY_TAG[dryTag]);
    if (!process.argv.includes('--keep')) {
      if (foer === null) fs.rmSync('src/data/used-questions.json', { force: true });
      else fs.writeFileSync('src/data/used-questions.json', foer, 'utf8');
    }
    console.log(`Ville søge på:   "${q || TOPIC_BY_TAG[dryTag]}"`);
    console.log(q ? '                 (spørgsmål fra autocomplete)' : '                 (emnet alene — intet spørgsmål fundet)');
    return;
  }

  // Dagsloftet tjekkes FØRST, så en kørsel over kvoten ikke bruger API-kald.
  // --ignorer-loft: kun til lokale testkørsler af selve kæden (kandidater →
  // faktaark → artikel), når dagens kvote allerede er brugt. Robotten på
  // GitHub kører aldrig med flaget.
  const publishedToday = countPublishedToday();
  if (publishedToday >= MAX_PER_DAY && !process.argv.includes('--ignorer-loft')) {
    console.log(`⏸️ Dagsloftet er nået: ${publishedToday}/${MAX_PER_DAY} artikler udgivet i dag. Springer denne kørsel over.`);
    return;
  }
  const remainingToday = MAX_PER_DAY - publishedToday;
  // Aldrig flere end der er tilbage af dagens kvote.
  const runBudget = process.argv.includes('--ignorer-loft') ? MAX_NORMAL_PER_RUN : Math.min(MAX_NORMAL_PER_RUN, remainingToday);

  const counts = countArticlesByTag();
  // PROEVE_EMNE sættes KUN af "Prøveartikel"-workflowet (valgfrit felt). En prøve
  // uden artikel gemmer ikke, hvilke spørgsmål den prøvede, så uden feltet valgte
  // prøve #4 og #5 (7/10) det samme SEO-spørgsmål igen. Den daglige robot sætter
  // det aldrig, og et ukendt emne ignoreres.
  const tvunget = process.env.PROEVE_EMNE && TOPIC_BY_TAG[process.env.PROEVE_EMNE] ? process.env.PROEVE_EMNE : null;
  if (process.env.PROEVE_EMNE && !tvunget) console.log(`Info: PROEVE_EMNE "${process.env.PROEVE_EMNE}" findes ikke — vælger som normalt.`);
  // 50/50 (17/10): nye emner under 20 artikler får hver anden artikel, de gamle 13 resten.
  // Turen følger antallet af artikler (lige = nye, ulige = gamle), så den skifter ved hver udgivelse.
  const antalArtikler = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).length;
  const raekke = beregnEmneRaekke(counts, antalArtikler, Math.floor(Date.now() / (1000 * 60 * 60 * 2)));
  const forsteTag = tvunget || raekke[0];
  if (tvunget) console.log(`Info: Prøve: emnet er valgt i workflowet: "${tvunget}"`);
  // Emnerækken (14/10): kørslens 2. forsøg tager det NÆSTMINDSTE emne i stedet for et nyt
  // spørgsmål i samme emne. Målt 14/10: alle 4 kørsler valgte "Coding" (36 artikler); 3 af 4
  // endte uden artikel, fordi ingen video passede til Coding-spørgsmålene — og næste kørsel
  // valgte Coding igen. Antal forsøg pr. kørsel er uændret (MAX_SPOERGSMAAL), så prisen er det også.
  const emneRaekke = tvunget ? [tvunget] : raekke;

  // Emnet siger HVAD vi skriver om. Spørgsmålet siger hvad nogen faktisk
  // søger på inden for emnet. Uden det valgte robotten et emne, fandt en
  // video, og skrev en artikel uden at nogen i kæden spurgte om der var
  // efterspørgsel. Fejler opslaget, kører vi videre på emnet alene — det er en
  // forbedring, ikke en forudsætning.
  const channel = pickChannel();
  // Kanaler kan være defineret med fast id ELLER @handle (opløses her ved kørsel via forHandle).
  const channelId = channel.id || (channel.handle ? await resolveChannelId(channel.handle) : null);
  console.log(`Info: Udgivet i dag: ${publishedToday}/${MAX_PER_DAY} — plads til ${runBudget} i denne kørsel.`);
  console.log(`Info: Fordeling: ${Object.entries(counts).sort((a, b) => a[1] - b[1]).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
  console.log(`Info: Vælger emnet der halter mest: "${forsteTag}" (${counts[forsteTag]} artikler)`);
  console.log(`Info: Vælger kanal: "${channel.name}"${channel.handle ? ` (${channel.handle} -> ${channelId || 'intet id'})` : ''}`);

  // Op til to spørgsmål pr. kørsel (18/9): falder alle kandidater til det
  // første igennem, lægges det på is (tried-questions.json), og et nyt vælges
  // med det samme — i stedet for at vente en time på næste kørsel.
  const MAX_SPOERGSMAAL = 2;
  const proevetNu = new Set();
  let processed = 0;
  for (let runde = 1; runde <= MAX_SPOERGSMAAL && processed < runBudget && !skrevetForsoegFejlet; runde++) {
  const tag = emneRaekke[Math.min(runde - 1, emneRaekke.length - 1)];
  const topic = TOPIC_BY_TAG[tag];
  if (runde > 1 && tag !== emneRaekke[0]) console.log(`Info: Skifter emne til det næstmindste: "${tag}" (${counts[tag]} artikler).`);
  const spoergsmaal = await vaelgSpoergsmaal(tag, topic, proevetNu);
  const soegetekst = spoergsmaal || topic;
  // Intet brugbart spørgsmål i dette emne: videre til næste emne i rækken (før 14/10: kørslen stoppede).
  if (!spoergsmaal && alleVarDubletter) {
    console.log(`Info: De prøvede spørgsmål i "${tag}" er alle dækket af artikler, sitet allerede har.`);
    continue;
  }
  if (spoergsmaal) console.log(`Info: Spørgsmål fra autocomplete (${runde}/${MAX_SPOERGSMAAL}): "${spoergsmaal}"`);
  // Opskriften "søgning først" (12/10): artiklen skal svare på en søgning, så uden
  // et søgespørgsmål skrives ingen artikel — add-video.mjs ville alligevel afvise
  // hver kandidat, og robotten ville betale for at vurdere dem.
  if (!spoergsmaal) { console.log(`Info: Intet ubrugt søgespørgsmål i "${tag}" (opskriften kræver et).`); continue; }
  // Emnetjek (12/10): et spørgsmål uden for sitets emne (fx "what happens to sora in naruto"
  // under AI Video) lægges på is, FØR der bruges YouTube-kvote og Gemini-kald på kandidater.
  // null (tjekket kunne ikke køre) stopper ikke robotten.
  if (await passerEmnet(spoergsmaal, tag) === false) {
    markerSpoergsmaalProevet(spoergsmaal, tag);
    proevetNu.add(spoergsmaal);
    console.log(`Info: "${spoergsmaal}" lagt på is i ${PROEVET_DAGE} dage — handler ikke om "${tag}".`);
    continue;
  }
  try {
    // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
    // Medium + long (begge efter relevans) + én roterende kvalitetskanal.
    // Korte videoer søges ikke længere — de gav sider uden brødtekst.
    const [mediumVideos, longVideos, channelVideos] = await Promise.all([
      searchVideos(soegetekst, { videoDuration: 'medium', order: 'relevance', maxResults: 5 }),
      searchVideos(soegetekst, { videoDuration: 'long', order: 'relevance', maxResults: 5 }),
      searchChannel(channelId, soegetekst, 3),
    ]);

    const seen = new Set();
    // Spørgsmålets egne søgeresultater først, kanalens videoer SIDST. Før stod
    // kanalen forrest og fik de første (dyre) pladser, selv når dens videoer
    // ikke handlede om spørgsmålet (målt 15/9, #522/#523: Y Combinator og
    // Two Minute Papers gav kandidater uden om spørgsmålet).
    const normalItems = dedupeById([...mediumVideos, ...longVideos, ...channelVideos], seen);

    if (normalItems.length === 0) {
      console.log("ℹ️ Info: Fandt ingen videoer (eller API'en afviste søgningen).");
      if (spoergsmaal) { markerSpoergsmaalProevet(spoergsmaal, tag); proevetNu.add(spoergsmaal); }
      continue;
    }

    console.log(`Info: Fandt ${normalItems.length} kandidater. Behandler maks ${runBudget}...`);

    const existingIds = loadExistingVideoIds();
    // Spørgsmålsfilteret køres først her, når der er kandidater — så det ikke
    // koster tre modelkald på en runde, der alligevel ikke fandt videoer.
    const visSpoergsmaal = spoergsmaal ? await retSpoergsmaal(spoergsmaal, console.log, { afvisBrudte: true }) : spoergsmaal;
    // Brudt og ikke til at rette (14/10): på is, FØR der bruges penge på kandidater.
    if (spoergsmaal && visSpoergsmaal === null) {
      markerSpoergsmaalProevet(spoergsmaal, tag);
      proevetNu.add(spoergsmaal);
      console.log(`Info: "${spoergsmaal}" lagt på is i ${PROEVET_DAGE} dage — brudt søgning.`);
      continue;
    }
    const nu = await processGroup(normalItems, 'video', runBudget - processed, existingIds, tag, spoergsmaal, visSpoergsmaal);
    processed += nu;
    if (nu === 0 && spoergsmaal) {
      markerSpoergsmaalProevet(spoergsmaal, tag);
      proevetNu.add(spoergsmaal);
      console.log(`Info: "${spoergsmaal}" lagt på is i ${PROEVET_DAGE} dage — ingen kandidat bestod.`);
    }
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube:", error.message);
    break;
  }
  }
  console.log(`✅ Succes: Robot-kørsel er færdig. ${processed} artikler behandlet (${publishedToday + processed}/${MAX_PER_DAY} i dag).`);
  // Faktaark-filerne fra kandidatvurderingen er kun mellemregninger (git ignorerer dem).
  for (const f of fs.readdirSync('.').filter((x) => /^_faktaark-.*\.json$/.test(x))) fs.rmSync(f, { force: true });
  // Gemini-stop (8/10): kreditter brugt op, ugyldig nøgle eller dagsloft stopper alt, til et
  // menneske retter det. Kørslen må ikke være grøn: rød = GitHub sender mail til Jacob.
  // Filen læses af sidste trin i daily-update.yml, så en artikel, der nåede at blive skrevet
  // før fejlen, stadig bliver gemt (git ignorerer _*.txt).
  if (geminiStop.fejl) {
    const tekst = `GEMINI STOPPET — robotten kan ikke skrive artikler, før det er rettet: ${geminiStop.fejl}\nTypisk: fyld kreditter på i Google AI Studio (ai.studio/projects -> Billing).`;
    console.error(`❌ ${tekst}`);
    fs.writeFileSync('_gemini-stop.txt', tekst + '\n');
  }
}

findNewestVideos();
