// Søgetal fra DataForSEO Labs til techfeedwatch (Jacob 10/11-2026: "samme setup som Tech Media Archive").
// Idéen er techmediaarchs (9/11-2026); koden er techfeedwatchs egen - de to sites blandes ikke.
//
// Hvorfor: robotten vælger spørgsmål fra Googles autocomplete, men vidste ikke, hvor mange der søger på dem.
// Et spørgsmål med 10 søgninger om måneden vejede det samme som et med 5.000. Omskrivningskøen (ca. 410 gamle
// artikler, 2-3 om dagen) gik efter dato, ikke efter hvad folk søger på.
//
// Hvad robotten får pr. spørgsmål: søgninger pr. måned (USA, engelsk), sværhedsgrad 0-100 (chancen for top 10),
// om kurven er jævn over 12 måneder ("tidløs") og udviklingen over et år.
// Pris: $0,012 pr. kald + $0,00012 pr. fundet søgeord; højst 700 søgeord pr. kald. Ukendte søgeord koster intet.
// Hukommelse: src/data/dataforseo.json gemmer svarene i 30 dage, så samme spørgsmål ikke betales igen.
// Kontoen deles med techmediaarch (ingen underkonti) - mærket "tfw" på hvert kald skiller forbruget ad.
// Dagsloft for hele kontoen: $3 (Jacob 10/11-2026). Saldo-vagten ligger i techmediaarchs tomgangsalarm (én er nok).
// Fejler noget (ingen nøgle, dagsloftet nået, tom saldo, nede), returneres tallene uden de nye, fejlen står i
// loggen, og robotten kører videre som før. Den går aldrig i stå på grund af DataForSEO.
// Nøglerne (DATAFORSEO_LOGIN/PASSWORD) skrives ALDRIG ud.
import fs from 'node:fs';
import path from 'node:path';

export const TAG = 'tfw';
export const MAKS_PR_KALD = 700;   // DataForSEO's grænse
export const MAKS_KALD = 2;        // pr. kørsel: robotten ser typisk under 200 forslag, omskrivningskøen ca. 470 spørgsmål
export const HUSK_DAGE = 30;       // søgetal er månedstal; ældre svar hentes igen
export const MIN_SOEGNINGER = 20;  // under dette tæller et spørgsmål som "for få søgninger"
const HUSK_STD = 'src/data/dataforseo.json';
const huskFil = () => process.env.DATAFORSEO_HUSK || HUSK_STD;   // DATAFORSEO_HUSK kun til test (midlertidig fil)

const skjul = (t) => String(t).replace(/[A-Za-z0-9+/=_-]{24,}/g, '***').slice(0, 160);
export const harNoegle = () => Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);

// Samme stavemåde for samme spørgsmål: små bogstaver, uden tegnsætning, enkelte mellemrum.
export const normaliser = (q) => String(q || '').toLowerCase().replace(/[?!.,;:"“”()]+/g, ' ').replace(/\s+/g, ' ').trim();
// DataForSEO afviser søgeord over 80 tegn eller 10 ord
const gyldig = (q) => q.length > 0 && q.length <= 80 && q.split(' ').length <= 10;

async function kald(vej, body) {
  const auth = 'Basic ' + Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const r = await fetch(`https://api.dataforseo.com/v3/${vej}`, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: auth, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  let j = null; try { j = await r.json(); } catch { /* intet JSON - fejlen står i status */ }
  return { ok: r.ok, status: r.status, j };
}

// Ét svar fra DataForSEO → robottens korte form. j = jævn kurve ("tidløs"): månederne svinger mindre end 35 %
// omkring snittet, og der er mindst 10 søgninger i snit.
export function oversaet(it) {
  const mdr = (it?.keyword_info?.monthly_searches || []).slice(0, 12).map((m) => m.search_volume || 0);
  const snit = mdr.length ? mdr.reduce((a, b) => a + b, 0) / mdr.length : 0;
  const spredning = snit ? Math.sqrt(mdr.reduce((a, b) => a + (b - snit) ** 2, 0) / mdr.length) / snit : null;
  return {
    v: it?.keyword_info?.search_volume ?? 0,                       // søgninger pr. måned
    kd: it?.keyword_properties?.keyword_difficulty ?? null,         // sværhed 0-100 (null = ukendt)
    j: spredning !== null && spredning < 0.35 && snit >= 10,        // tidløs
    a: it?.keyword_info?.search_volume_trend?.yearly ?? null,       // udvikling over et år, %
  };
}

// Sværhed over KD_MAKS = for svær til et lille site (Jacob 13/11-2026, samme regel som techmediaarch 4e92594):
// målt 13/11 havde 65 af 193 brugbare spørgsmål sværhed > 30, og fire af dem lå i top 20 (fx "how does quantum
// computing work", 4.400 søgn., sværhed 46). Dem kommer vi ikke op på - de lægges bagerst (gruppe 2).
// Ukendt sværhed tæller IKKE som for svær (vi ved det ikke).
export const KD_MAKS = 30;
export const forSvaer = (t) => !!t && t.kd !== null && t.kd !== undefined && t.kd > KD_MAKS;

// Faldende (Jacob 13/11-2026: tidløse artikler): søgningerne er faldet mindst FALD_MAKS % på et år - typisk en
// nyhed, der dør ud. Målt 13/11: 852 af 5.014 brugbare søgeord, fx "why is crypto crashing" (-70 %), der var
// førstevalget for Crypto, og "what is sora" (-76 %). Før vejede de ×0,7; nu lægges de bagerst som de for svære.
export const FALD_MAKS = 50;
export const faldende = (t) => !!t && t.a !== null && t.a !== undefined && t.a <= -FALD_MAKS;

// Værdi = søgninger × lethed³. Lethed i 3. potens, så et let spørgsmål med færre søgninger slår et svært med
// mange (sværhed 10 → ×0,73; sværhed 30 → ×0,34). Ukendt sværhed regnes som 50. Tidløs ×1,5 (Jacob vil have
// tidløse artikler). Under MIN_SOEGNINGER, for svær eller faldende → 0.
export function vaerdi(t) {
  if (!t || (t.v || 0) < MIN_SOEGNINGER || forSvaer(t) || faldende(t)) return 0;
  const lethed = 1 - (t.kd ?? 50) / 100;
  return Math.round(t.v * Math.max(lethed, 0.05) ** 3 * (t.j ? 1.5 : 1));
}

// Gruppe: 0 = kendt med nok søgninger, ikke for svær og ikke faldende · 1 = ukendt (ikke i DataForSEO, eller ikke
// spurgt) · 2 = kendt, men for få søgninger, for svær eller faldende.
// NB: null betyder "spurgt, men DataForSEO kendte det ikke" - det er IKKE det samme som 0 søgninger.
export const gruppe = (t) => (t === undefined || t === null ? 1 : (t.v || 0) >= MIN_SOEGNINGER && !forSvaer(t) && !faldende(t) ? 0 : 2);

// Rækkefølge: gruppe 0 efter værdi (størst først), derefter de ukendte, til sidst dem med for få søgninger.
// Inden for samme gruppe og værdi bevares den rækkefølge, listen kom i (fx klokkeslæt eller dato).
export function ordn(liste, talFor) {
  return liste.map((x, i) => ({ x, i, t: talFor(x) }))
    .sort((a, b) => gruppe(a.t) - gruppe(b.t) || vaerdi(b.t) - vaerdi(a.t) || a.i - b.i)
    .map((y) => y.x);
}

export function laesHusk(nu = Date.now(), fil = huskFil()) {
  try {
    const alle = JSON.parse(fs.readFileSync(fil, 'utf8'));
    const graense = nu - HUSK_DAGE * 864e5;
    return Object.fromEntries(Object.entries(alle).filter(([, x]) => Date.parse(x.d) >= graense));
  } catch { return {}; }
}
function gemHusk(husk, fil) {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  // Sorteret og én linje pr. spørgsmål, så git-ændringer er til at læse (og robottens datafletning virker)
  const linjer = Object.entries(husk).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => `${JSON.stringify(k)}:${JSON.stringify(x)}`);
  fs.writeFileSync(fil, `{\n${linjer.join(',\n')}\n}\n`);
}

// Søgetal for en liste spørgsmål i PRIORITERET rækkefølge (de vigtigste først, hvis der er flere end loftet).
// Returnerer { tal: Map(normaliseret → {v,kd,j,a} | null), log }. null = DataForSEO kender ikke spørgsmålet.
// Spørgsmål, der hverken er i hukommelsen eller blev sendt (over loftet), står ikke i tal (= undefined).
export async function hentTal(qs, { nu = Date.now(), maks = MAKS_PR_KALD, kald_ = MAKS_KALD, fil = huskFil() } = {}) {
  const husk = laesHusk(nu, fil);
  const tal = new Map();
  const nye = [];
  const nyeSet = new Set();
  for (const q0 of qs) {
    const q = normaliser(q0);
    if (!q || tal.has(q) || nyeSet.has(q)) continue;
    if (husk[q]) tal.set(q, husk[q].t);
    else if (gyldig(q) && nye.length < maks * kald_) { nye.push(q); nyeSet.add(q); }
  }
  const log = { fraHusk: tal.size, sendt: 0, fundet: 0, kald: 0, pris: 0, fejl: null };
  if (!nye.length) return { tal, log };
  if (!harNoegle()) { log.fejl = 'nøglen mangler (DATAFORSEO_LOGIN/PASSWORD)'; return { tal, log }; }
  const d = new Date(nu).toISOString().slice(0, 10);
  // Op til kald_ kald à maks søgeord. Fejler et kald, stoppes der; svarene fra de kald, der lykkedes, gemmes alligevel.
  for (let i = 0; i < nye.length; i += maks) {
    const del = nye.slice(i, i + maks);
    try {
      const r = await kald('dataforseo_labs/google/keyword_overview/live', [{ keywords: del, location_code: 2840, language_code: 'en', tag: TAG }]);
      const opg = r.j?.tasks?.[0];
      if (!r.ok || opg?.status_code !== 20000) {
        // Fx 40203 = dagsloftet ($3 for hele kontoen) er nået, 40200 = saldoen er tom, 40100/401 = forkert nøgle
        log.fejl = `HTTP ${r.status} ${opg?.status_code || r.j?.status_code || ''} ${skjul(opg?.status_message || r.j?.status_message || '')}`.trim();
        break;
      }
      const fundet = new Map((opg.result?.[0]?.items || []).map((it) => [normaliser(it.keyword), oversaet(it)]));
      for (const q of del) { const t = fundet.get(q) ?? null; tal.set(q, t); husk[q] = { d, t }; }
      log.sendt += del.length; log.fundet += fundet.size; log.kald++; log.pris = Math.round((log.pris + (opg.cost || 0)) * 1e6) / 1e6;
    } catch (e) { log.fejl = skjul(e.message); break; }
  }
  if (log.kald) gemHusk(husk, fil);
  return { tal, log };
}

// Kort tekst til logge: "4400 søgn./md · sværhed 10 · tidløs"
export function talTekst(t) {
  if (t === undefined) return 'søgetal: ikke spurgt';
  if (t === null) return 'søgetal: ukendt hos DataForSEO';
  return [`${t.v} søgn./md`, t.kd !== null && t.kd !== undefined ? `sværhed ${t.kd}` : null, t.j ? 'tidløs' : null,
    faldende(t) ? `faldende (${t.a} %)` : null,
    forSvaer(t) ? `for svær (over ${KD_MAKS})` : null].filter(Boolean).join(' · ');
}

// Én linje til robottens log (offentlig - kun autocomplete-spørgsmål og antal, aldrig Search Console-data).
export function logLinje(log, liste, talFor) {
  const g = [0, 0, 0];
  let svaer = 0, fald = 0;
  // Gruppe 2 deles i tre, der tilsammen giver gruppen: for svær først, så faldende, resten = for få søgninger
  for (const x of liste) { const t = talFor(x); g[gruppe(t)]++; if (forSvaer(t)) svaer++; else if (faldende(t)) fald++; }
  return `SOEGETAL: ${JSON.stringify({ spoergsmaal: liste.length, medTal: g[0], ukendt: g[1], faa: g[2] - svaer - fald, forSvaer: svaer, faldende: fald, fraHusk: log.fraHusk, sendt: log.sendt, fundet: log.fundet, kald: log.kald, usd: log.pris, fejl: log.fejl })}`;
}

// --- Anden kilde: spørgsmål FRA DataForSEO (Jacob 13/11-2026: "det skal selvfølgelig også rettes til") -----------
// Hvorfor: Googles autoforslag giver højst ca. 10 forslag pr. præfiks og startord, og målt 11-13/11 havde kun 6-20 %
// af dem mindst 20 søgninger om måneden (7/103, 35/169, 18/122). DataForSEO's "Keyword Suggestions" giver de søgninger
// i databasen, der INDEHOLDER startordet (USA, engelsk), med søgetal og sværhed. Vi beder kun om dem med mindst
// MIN_SOEGNINGER søgninger og sværhed højst KD_MAKS, de mest søgte først, og beholder dem, der er spørgsmål
// (starter med et af robottens præfikser) og består robottens egne filtre (godt - fra src/lib/suggest.mjs).
// De lægges i samme bunke som autoforslagene og går gennem samme redaktør, dublet-værn og brugte-liste.
// Pris (dataforseo.com/pricing, 13/11-2026): $0,012 pr. kald + $0,00012 pr. fundet søgeord → ca. $0,024 pr. startord
// med 100 svar. Ét kald pr. startord, gemt i FORSLAG_DAGE dage (src/data/dataforseo-forslag.json): robotten henter kun
// for det emne, kørslen arbejder på (3 startord), så 18 emner × 3 = 54 startord koster ca. $1,30 hver 30. dag.
// Søgetallene lægges også i den almindelige hukommelse, så hentTal ikke betaler for dem igen.
// Fejler noget, kommer der bare ingen nye forslag (fejlen står i loggen) - robotten kører videre med autoforslagene.
export const FORSLAG_DAGE = 30;
export const FORSLAG_GRAENSE = 100;   // højst så mange søgeord pr. startord (de mest søgte)
// Kun spørgsmål (Jacob 13/11-2026, forslag 2): målt 13/11 gav AI & Tech, SEO og PC Building 0 spørgsmål af 226-300
// svar, fordi de mest søgte søgeord med startordet ikke er spørgsmål ("chatgpt", "seo tools"). DataForSEO filtrerer
// nu selv på, at søgeordet STARTER med et af robottens spørgeord (regex) - så alle 100 svar er spørgsmål.
// FORSLAG_UDGAVE: svar gemt før filteret (uden u: 2) hentes igen, når robotten næste gang arbejder på emnet.
export const FORSLAG_UDGAVE = 2;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const spoergsmaalsRegex = (praefikser) => `^(${[...praefikser].sort((a, b) => b.length - a.length).map(escRe).join('|')}) `;
const FORSLAG_STD = 'src/data/dataforseo-forslag.json';
const forslagFil = () => process.env.DATAFORSEO_FORSLAG || FORSLAG_STD;   // DATAFORSEO_FORSLAG kun til test

// Hvilket præfiks starter spørgsmålet med? Det længste, der passer ("what is the best way to" før "what is").
export function praefiksFor(q, praefikser) {
  return [...praefikser].sort((a, b) => b.length - a.length).find((p) => q === p || q.startsWith(p + ' ')) || null;
}

// Står startordet SAMLET i spørgsmålet? DataForSEO matcher enkeltord, så "mixed reality" kan give "mixed results in
// reality". Hvert ord må have flertals-s/-es ("ai agent" ⊂ "ai agents"); ordene skal stå i rækkefølge, side om side.
export function indeholderFrase(q, froe) {
  const ord = normaliser(froe).split(' ').filter(Boolean).map((w) => w.replace(/s$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return ord.length > 0 && new RegExp(`\\b${ord.map((w) => `${w}(s|es)?`).join(' ')}\\b`).test(normaliser(q));
}

function laesForslag(fil) {
  try { return JSON.parse(fs.readFileSync(fil, 'utf8')); } catch { return {}; }
}
function gemForslag(alle, fil) {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  // Ét startord pr. linje, sorteret, så git-ændringer kan læses og datafletningen virker
  const linjer = Object.entries(alle).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => `${JSON.stringify(k)}:${JSON.stringify(x)}`);
  fs.writeFileSync(fil, `{\n${linjer.join(',\n')}\n}\n`);
}

// froer: startordene (fx emnets tre første led). praefikser: robottens spørgeord. godt(q, froe): robottens filtre.
// Returnerer { spoergsmaal: [{ q, t, froe }], log }. Svarene fra hukommelsen (under FORSLAG_DAGE dage) koster intet.
export async function hentSpoergsmaal(froer, praefikser, godt = () => true, { nu = Date.now(), fil = forslagFil(), husk_ = huskFil() } = {}) {
  const gemt = laesForslag(fil);
  const graense = nu - FORSLAG_DAGE * 864e5;
  const log = { froer: froer.length, fraHusk: 0, kald: 0, fundet: 0, spoergsmaal: 0, pris: 0, fejl: null };
  const ud = [];
  const set = new Set();
  const laeg = (f, liste) => { for (const x of liste || []) if (!set.has(x.q)) { set.add(x.q); ud.push({ ...x, froe: f }); } };
  const nye = [];
  for (const f0 of froer) {
    const f = normaliser(f0);
    if (!f) continue;
    const g = gemt[f];
    // Gemte svar går gennem filtrene igen (13/11: et filter tilføjet efter hentningen skal også virke på hukommelsen)
    if (g && Date.parse(g.d) >= graense && (g.u || 1) >= FORSLAG_UDGAVE) { laeg(f, (g.s || []).filter((x) => godt(x.q, f))); log.fraHusk++; } else nye.push(f);
  }
  if (nye.length && !harNoegle()) log.fejl = 'nøglen mangler (DATAFORSEO_LOGIN/PASSWORD)';
  else if (nye.length) {
    const husk = laesHusk(nu, husk_);
    const d = new Date(nu).toISOString().slice(0, 10);
    for (const f of nye) {
      try {
        const r = await kald('dataforseo_labs/google/keyword_suggestions/live', [{
          keyword: f, location_code: 2840, language_code: 'en', tag: TAG, limit: FORSLAG_GRAENSE,
          include_seed_keyword: false, order_by: ['keyword_info.search_volume,desc'],
          filters: [['keyword_info.search_volume', '>=', MIN_SOEGNINGER], 'and', ['keyword_properties.keyword_difficulty', '<=', KD_MAKS],
            'and', ['keyword', 'regex', spoergsmaalsRegex(praefikser)]],
        }]);
        const opg = r.j?.tasks?.[0];
        if (!r.ok || opg?.status_code !== 20000) {
          log.fejl = `HTTP ${r.status} ${opg?.status_code || r.j?.status_code || ''} ${skjul(opg?.status_message || r.j?.status_message || '')}`.trim();
          break;   // fx dagsloftet: stop, resten prøves næste gang
        }
        const items = opg.result?.[0]?.items || [];
        const s = [];
        for (const it of items) {
          const q = normaliser(it.keyword || '');
          if (!gyldig(q)) continue;
          const t = oversaet(it);
          husk[q] = { d, t };   // søgetallet er betalt - gem det, så hentTal ikke spørger igen
          if (praefiksFor(q, praefikser) && indeholderFrase(q, f) && godt(q, f)) s.push({ q, t });
        }
        gemt[f] = { d, u: FORSLAG_UDGAVE, s };
        laeg(f, s);
        log.kald++; log.fundet += items.length;
        log.pris = Math.round((log.pris + (opg.cost || 0)) * 1e6) / 1e6;
      } catch (e) { log.fejl = skjul(e.message); break; }
    }
    if (log.kald) { gemForslag(gemt, fil); gemHusk(husk, husk_); }
  }
  log.spoergsmaal = ud.length;
  return { spoergsmaal: ud, log };
}

// Én linje til robottens log (offentlig: kun startord-antal, antal og pris).
export const forslagLinje = (log) => `SOEGEFORSLAG: ${JSON.stringify(log)}`;
