// Kladder (Jacob 19/11-2026): INGEN artikel går live, før Jacob har godkendt den. Robotten (add-video.mjs),
// omskrivningen (omskriv-gamle.mjs via add-video --erstat) og faktatjekket (faktatjek-gamle.mjs) skriver derfor
// aldrig i src/content/videos - de gemmer en KRYPTERET kladde her. Jacob læser den på techfeedwatch.com/godkend
// (bag Cloudflare Access) og trykker Godkend, Omskriv (med note) eller Afvis; kladder.mjs udfører det hver time.
//   public/_kladder/<id>.kladde   krypteret kladde (src/lib/kryptering.mjs) - kommer med på sitet, så godkend-
//                                 siden kan læse den, men er tegnrod uden KLADDE_NOEGLE (også på GitHub)
//   public/_kladder/liste.json    kun de tilfældige id'er - siger intet om emnet
//   kladder-afviste/<id>-v<n>.kladde  afviste kladder, krypteret, slettes aldrig (bygges ikke ind i sitet)
//   src/data/kladde-log.json      [{ id, type, skrevet }] - robottens dagsloft og tomgangsalarmen tæller herfra
// Mangler nøglen, stopper skrivningen med en fejl - den falder ALDRIG tilbage til at skrive en levende artikel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { krypterJson, dekrypterJson } from './kryptering.mjs';
import { laesFelter } from './artikelfelter.mjs';

const ROD = () => process.env.KLADDE_ROD || process.cwd(); // KLADDE_ROD kun til test-kladder.mjs
export const KLADDE_DIR = 'public/_kladder';
export const AFVIST_DIR = 'kladder-afviste';
export const LOG_FIL = 'src/data/kladde-log.json';
export const KLADDE_LOFT = 6;       // venter 6, skriver robotten intet (hverken nye, omskrivninger eller faktatjek)
export const FORAELDET_DAGE = 30;   // ældre kladder mærkes "forældet" på siden (kan stadig godkendes)
export const BESLUTNINGER_URL = 'https://techfeedwatch.com/api/kladde-beslutninger';
export const TYPER = ['ny', 'omskrevet', 'faktatjek'];

const sti = (...d) => path.join(ROD(), ...d);
const laesJson = (f, tom) => { try { return JSON.parse(fs.readFileSync(sti(f), 'utf8')); } catch { return tom; } };
const skrivJson = (f, d) => { fs.mkdirSync(path.dirname(sti(f)), { recursive: true }); fs.writeFileSync(sti(f), JSON.stringify(d, null, 1) + '\n'); };
export const noegle = () => {
  const n = process.env.KLADDE_NOEGLE;
  if (!n) throw new Error('KLADDE_NOEGLE mangler - ingen kladde kan gemmes (og intet skrives live)');
  return n;
};

// Kun id'er - kan læses uden nøgle (kø-loftet og tomgangsalarmen bruger den)
export const liste = () => laesJson(`${KLADDE_DIR}/liste.json`, []).filter((x) => x && /^[a-f0-9]{16}$/.test(x.id));
export const antalVenter = () => liste().length;
export const koeFuld = () => antalVenter() >= KLADDE_LOFT;
const skrivListe = (l) => skrivJson(`${KLADDE_DIR}/liste.json`, l);
export const kladdeLog = () => laesJson(LOG_FIL, []);
// Nye artikler SKREVET i dag (UTC) - dagsloftet tæller hvornår robotten skrev, ikke hvornår Jacob godkendte
export const nyeSkrevetIDag = (idag = new Date().toISOString().slice(0, 10)) => kladdeLog().filter((x) => x.type === 'ny' && String(x.skrevet).slice(0, 10) === idag).length;
export const senestSkrevet = () => kladdeLog().map((x) => x.skrevet).filter(Boolean).sort().pop() || null;

// Det, Jacob skal se på siden: alt læseren ser (Googles vejledning 1/10-2026: også titel, beskrivelse og
// strukturerede data) - titel, meta-beskrivelse, resumé, FAQ, faktaboks og brødteksten som HTML.
// HTML'en laves her (Astros egen markdown-motor), så godkend-siden ikke skal kunne læse markdown.
let motor = null;
export async function visning(markdown) {
  const { felt, krop, faqs, faktaboks } = laesFelter(markdown);
  if (!motor) { const { createMarkdownProcessor } = await import('@astrojs/markdown-remark'); motor = await createMarkdownProcessor(); }
  const html = (await motor.render(krop)).code;
  return {
    title: felt('title'), meta: felt('metaDescription'), summary: felt('summary'), targetQuestion: felt('targetQuestion'),
    date: felt('date'), youtubeId: felt('youtubeId'), faqs, keyFacts: faktaboks, html,
    ord: krop.replace(/[#>*_`|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length,
  };
}

const kladdeFil = (id) => `${KLADDE_DIR}/${id}.kladde`;
// Lås (omskriv-gamle.mjs kører op til 4 add-video samtidig): liste.json og kladde-log.json læses og skrives
// om, og to samtidige skrivninger ville ellers kunne tabe en kladde. mkdir er atomisk - kun én får mappen.
function medLaas(fn) {
  const laas = sti(KLADDE_DIR, '.laas');
  fs.mkdirSync(sti(KLADDE_DIR), { recursive: true });
  for (let i = 0; ; i++) {
    try { fs.mkdirSync(laas); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // En lås ældre end 2 min er efterladt af en kørsel, der døde - den overtages
      try { if (Date.now() - fs.statSync(laas).mtimeMs > 120000) { fs.rmSync(laas, { recursive: true, force: true }); continue; } } catch { /* væk imens */ }
      if (i > 600) throw new Error('kladde-låsen blev ikke fri på 60 sek.');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  try { return fn(); } finally { fs.rmSync(laas, { recursive: true, force: true }); }
}
export async function skrivKladde(k, logLinje = null) {
  const data = await krypterJson(k, noegle()) + '\n';
  medLaas(() => {
    fs.writeFileSync(sti(kladdeFil(k.id)), data);
    const l = liste();
    if (!l.some((x) => x.id === k.id)) { l.push({ id: k.id }); skrivListe(l); }
    if (logLinje) { const log = kladdeLog(); log.push(logLinje); skrivJson(LOG_FIL, log.slice(-500)); }
  });
}

// Alle kladder, der venter, dekrypteret, ældste først. En fil, der ikke kan læses, springes over med en advarsel.
export async function laesKladder() {
  const ud = [];
  for (const { id } of liste()) {
    try { ud.push(await dekrypterJson(fs.readFileSync(sti(kladdeFil(id)), 'utf8'), noegle())); } catch (e) { console.log(`::warning::Kladde ${id} kunne ikke læses: ${e.message}`); }
  }
  return ud.sort((a, b) => String(a.oprettet).localeCompare(String(b.oprettet)));
}

// Gem en ny kladde. type: ny | omskrevet | faktatjek. Ligger der allerede en kladde for samme artikel, bliver
// den nye en ny VERSION af den (Jacobs beslutning gælder kun den version, han så).
// billeder: { "public/billeder/<slug>.webp": base64, ... } - holdes tilbage i den krypterede kladde og lægges
// først ud på sitet ved Godkend (Jacob 19/11-2026). Kun sitets tre billedmapper er tilladt.
export const gyldigBilledSti = (s) => /^public\/(kort|billeder|og)\/[a-z0-9-]{1,200}\.(webp|jpg)$/.test(String(s));
// 20/11-2026 (Jacob: "en ny konsulent, der dobbelttjekker"): kontrollanten (src/lib/kontrollant.mjs) tjekker
// ALLE kladder - nye, omskrevne, faktatjek (gemKladde) og Jacobs "Omskriv"-noter (kladder.mjs) - lige før de
// gemmes, så ingen vej udenom findes. Slået til med GitHub-variablen KONTROLLANT=til (fra, til den er målt -
// Gemini-loftet var nået 20/11). Kontrollen må aldrig koste en betalt kladde: fejler den, gemmes kladden med en
// besked, Jacob ser på /godkend.
export async function kontrollerKladde(slug, markdown) {
  if (process.env.KONTROLLANT !== 'til' || !process.env.GEMINI_API_KEY) return { markdown, kontrol: null };
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { kontrollerMarkdown } = await import('./kontrollant.mjs');
    return await kontrollerMarkdown(new GoogleGenerativeAI(process.env.GEMINI_API_KEY), markdown);
  } catch (e) {
    console.log(`::warning::Kontrollanten fejlede for ${slug}: ${String(e.message).split('\n')[0]}`);
    return { markdown, kontrol: { kunneIkke: [`kontrollanten fejlede: ${String(e.message).split('\n')[0].slice(0, 160)}`], rettelser: [] } };
  }
}
export async function gemKladde({ slug, markdown, type, billeder = {} }) {
  if (!TYPER.includes(type)) throw new Error(`ukendt kladdetype ${type}`);
  noegle();
  const nu = new Date().toISOString();
  const findes = (await laesKladder()).find((k) => k.slug === slug);
  const nyeBilleder = Object.fromEntries(Object.entries(billeder || {}).filter(([s]) => gyldigBilledSti(s)));
  let kontrol;
  ({ markdown, kontrol } = await kontrollerKladde(slug, markdown));
  const k = {
    id: findes?.id || crypto.randomBytes(8).toString('hex'), slug, type, version: (findes?.version || 0) + 1,
    oprettet: findes?.oprettet || nu, skrevet: nu, markdown, visning: await visning(markdown),
    billeder: Object.keys(nyeBilleder).length ? nyeBilleder : (findes?.billeder || {}),
    ...(kontrol ? { kontrol } : {}),
  };
  await skrivKladde(k, { id: k.id, type, skrevet: nu });
  // Linjen læses af omskriv-gamle.mjs og auto-youtube.mjs (var kladden gemt?). Ændr ikke formatet.
  console.log(`KLADDE: ${JSON.stringify({ id: k.id, slug, type, version: k.version })}`);
  return k;
}

// Godkendt (eller ikke længere aktuel): kladden fjernes fra køen
export function fjernKladde(id) {
  medLaas(() => { fs.rmSync(sti(kladdeFil(id)), { force: true }); skrivListe(liste().filter((x) => x.id !== id)); });
}

// Afvist: gemmes krypteret i kladder-afviste/ (slettes aldrig - Jacob: "slet aldrig noget uden mit ok")
export async function afvisKladde(k, note = '') {
  fs.mkdirSync(sti(AFVIST_DIR), { recursive: true });
  fs.writeFileSync(sti(AFVIST_DIR, `${k.id}-v${k.version}.kladde`), await krypterJson({ ...k, afvist: new Date().toISOString(), note }, noegle()) + '\n');
  fjernKladde(k.id);
}

// YouTube-id'er og artikelnavne i køen og blandt de afviste - så robotten ikke skriver samme video eller artikel igen
export async function optagetAfKladder() {
  const videoer = new Set(); const slugs = new Set();
  const filer = [...liste().map(({ id }) => kladdeFil(id)), ...(fs.existsSync(sti(AFVIST_DIR)) ? fs.readdirSync(sti(AFVIST_DIR)).map((f) => `${AFVIST_DIR}/${f}`) : [])];
  for (const f of filer) {
    try { const k = await dekrypterJson(fs.readFileSync(sti(f), 'utf8'), noegle()); if (k.visning?.youtubeId) videoer.add(k.visning.youtubeId); if (f.startsWith(KLADDE_DIR)) slugs.add(k.slug); } catch { /* ulæselig: springes over */ }
  }
  return { videoer, slugs };
}
