// Tomgangsalarm: bliver RØD, hvis robotten er holdt op med at udgive.
//
// Hvorfor: husets mest gentagne fejlform er en kørsel, der bliver grøn uden at
// lave noget (25 tomme artikler, den grønne IndexNow-kørsel). En grøn kørsel
// sender ingen mail — så i dag ville ingen opdage, hvis robotten stod stille
// i tre dage. En RØD kørsel sender derimod mail (Jacobs GitHub-indstilling
// "Failed workflows only", målt 21/9). Dette script oversætter "stille" til
// "rød", så den eksisterende mail også dækker tomgang.
//
// Læser den LEVENDE fil på sitet, ikke filen i repoet. Så tjekkes hele
// kæden på én gang: robotten skrev, commit'et gik igennem, OG Cloudflare
// byggede og udgav. Går deploy i stykker, går filen i stå, og alarmen går.
//
// Rød hvis:
//   - filen ikke kan hentes eller læses
//   - sidste artikel er ældre end TOMGANG_TIMER timer (standard 36)
//   - ret-linktekster har meldt en advarsel inden for det sidste døgn
//
// Kør:  node tjek-tomgang.mjs
//       TOMGANG_TIMER=1 node tjek-tomgang.mjs     (bevis at alarmen virker)
import fs from 'node:fs';

const URL = process.env.TOMGANG_URL || 'https://techfeedwatch.com/robot-status.json';
const GRAENSE = Number(process.env.TOMGANG_TIMER || 36);
const nu = Date.now();

function skriv(tekst) {
  console.log(tekst);
  // Vises øverst på kørslens side i GitHub.
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst + '\n');
}
function alarm(tekst) {
  // ::error:: bliver en annotation, som også står i mailen og på kørslens side.
  console.log(`::error title=Tomgangsalarm::${tekst}`);
  skriv(`❌ ${tekst}`);
  process.exit(1);
}

// Første kørsel i GitHub 23/9 fik HTTP 403 fra sitet — fra pc'en og skyen
// svarede det 200. Cloudflare afviser en navnløs bot fra en ukendt maskine.
// Løsningen fandtes allerede i indexnow.mjs (målt 20/9): giv den et navn og
// prøv igen efter en pause, for Cloudflare lukker op efter første afvisning.
const UA = 'techfeedwatch-tomgang/1.0 (+https://techfeedwatch.com)';
const BLOKERET = [403, 429, 503];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let status;
let sidste = '';
for (let forsoeg = 0; forsoeg < 3 && !status; forsoeg++) {
  if (forsoeg) await pause(5000);
  try {
    // Cache-bust, så en gammel kopi i et mellemled aldrig kan skjule tomgang.
    const svar = await fetch(`${URL}?t=${Date.now()}`, {
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(30000),
    });
    if (svar.ok) { status = await svar.json(); break; }
    sidste = `HTTP ${svar.status}`;
    if (!BLOKERET.includes(svar.status)) break;     // 404 o.l. er ægte fejl — prøv ikke igen
  } catch (e) {
    sidste = e.message;
  }
}

if (!status) {
  // Blev vi AFVIST (firewall), er sitet ikke nede — vi må bare ikke komme ind.
  // Så falder vi tilbage på repoets egen kopi af filen, så alarmen stadig kan
  // se tomgang, og melder en advarsel (gul, ingen mail) om at deploy-delen af
  // tjekket ikke blev lavet. Alt andet — 404, timeout, nede — er rødt.
  const afvist = BLOKERET.some((k) => sidste === `HTTP ${k}`);
  if (afvist && fs.existsSync('public/robot-status.json')) {
    console.log(`::warning title=Tomgangsalarm::Sitet afviste GitHub (${sidste}) — tjekker repoets egen kopi i stedet. Tomgang ses stadig; deploy-kæden gør ikke.`);
    skriv(`⚠️ Live-siden svarede ${sidste} til GitHub; bruger repoets kopi af robot-status.json.`);
    status = JSON.parse(fs.readFileSync('public/robot-status.json', 'utf8'));
  } else {
    alarm(`robot-status.json kunne ikke hentes fra ${URL}: ${sidste}`);
  }
}

const at = status?.lastArticle?.at;
const t = Date.parse(at);
if (!at || Number.isNaN(t)) alarm(`robot-status.json har ingen gyldig lastArticle.at (fik ${JSON.stringify(at)})`);

const timer = (nu - t) / 3600000;
const slugs = (status.lastArticle.slugs || []).join(', ');
skriv(`Sidste artikel: ${at} — ${timer.toFixed(1)} timer siden (grænse ${GRAENSE} t). ${slugs}`);
skriv(`Artikler i alt: ${status.articleCount ?? '?'}`);

if (timer > GRAENSE) {
  alarm(`Robotten har ikke udgivet i ${timer.toFixed(0)} timer (grænse ${GRAENSE}). Sidste: ${slugs || '?'} (${at}). Tjek Actions → YouTube Auto Update.`);
}

const adv = status.lastLinkWarning;
if (adv?.at && (nu - Date.parse(adv.at)) / 3600000 <= 26) {
  alarm(`ret-linktekster meldte en advarsel ${adv.at}: ${adv.reason}${adv.message ? ' — ' + adv.message : ''}${adv.planned ? ` (${adv.planned} planlagt, loft ${adv.cap})` : ''}`);
}

skriv('✅ Robotten er i live.');
process.exit(0);
