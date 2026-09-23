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

let status;
try {
  // Cache-bust, så en gammel kopi i et mellemled aldrig kan skjule tomgang.
  const svar = await fetch(`${URL}?t=${nu}`, { signal: AbortSignal.timeout(30000) });
  if (!svar.ok) alarm(`robot-status.json kunne ikke hentes: HTTP ${svar.status} fra ${URL}`);
  status = await svar.json();
} catch (e) {
  alarm(`robot-status.json kunne ikke hentes eller læses: ${e.message}`);
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
