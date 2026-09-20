// IndexNow — fortæller søgemaskinerne, at der er nyt, i stedet for at vente
// på at blive fundet.
//
// Hvorfor: robotten udgiver 1-3 artikler i døgnet, men intet siger det til
// nogen. Crawleren skal selv hente sitemappet igen og se forskellen, og det
// kan tage dage. IndexNow er ét HTTP-kald: her er adresserne, de er nye.
//
// Hvem lytter: Bing (og dermed Copilot og DuckDuckGo, der henter derfra),
// Yandex, Naver og Seznam. De deler indsendelsen med hinanden, så ét kald til
// api.indexnow.org rammer dem alle. GOOGLE DELTAGER IKKE — de testede
// protokollen i 2021 og valgte den fra. Google finder stadig sitet gennem
// sitemappet som hidtil; IndexNow er et supplement, ikke en erstatning.
//
// Sådan beviser vi, at vi ejer sitet: en fil med nøglen som navn OG indhold
// ligger i roden (public/<nøgle>.txt). Søgemaskinen henter den og
// sammenligner. Nøglen er offentlig efter hensigten — den er ikke en
// hemmelighed og hører derfor hjemme i repoet, i modsætning til alt i .env.
//
// Hvad der sendes: præcis det, der står i sitemappet. Det er allerede filtreret
// for noindex-sider, Shorts og paginering, så vi kan ikke komme til at bede om
// indeksering af noget, vi selv har bedt Google om at lade være.
//
// Hukommelse: indexnow-sendt.json husker, hvad der er sendt. Uden den ville
// hver kørsel sende de samme 527 adresser igen, og det er præcis den slags
// støj, en søgemaskine straffer.
//
// Brug:
//   node indexnow.mjs               (kræver dist/ — kør npm run build først)
//   node indexnow.mjs --dry-run     viser hvad der ville blive sendt
//   node indexnow.mjs --max=250     hæver loftet for denne kørsel
//   node indexnow.mjs --alle        sender alt igen (kun ved behov)

import fs from 'node:fs';
import path from 'node:path';

const VAERT = 'techfeedwatch.com';
const BASIS = `https://${VAERT}`;
const DIST = 'dist';
const HUKOMMELSE = 'indexnow-sendt.json';
const ENDEPUNKT = 'https://api.indexnow.org/IndexNow';

const args = process.argv.slice(2);
const toer = args.includes('--dry-run');
const alle = args.includes('--alle');
const LOFT = Number(args.find((a) => a.startsWith('--max='))?.slice(6) || 100);

// --- nøglen findes ud fra filen i public/, så den kun står ét sted ---
function findNoegle() {
  const kandidater = fs.readdirSync('public').filter((n) => /^[0-9a-fA-F-]{8,128}\.txt$/.test(n));
  if (kandidater.length !== 1) {
    throw new Error(`Forventede præcis én nøglefil i public/, fandt ${kandidater.length}: ${kandidater.join(', ') || '(ingen)'}`);
  }
  const fil = kandidater[0];
  const noegle = fs.readFileSync(path.join('public', fil), 'utf8').trim();
  if (noegle !== fil.replace(/\.txt$/, '')) {
    throw new Error(`Nøglefilen ${fil} indeholder ikke sit eget navn — så afviser søgemaskinen os med 403.`);
  }
  return { noegle, url: `${BASIS}/${fil}` };
}

// --- adresserne tages fra sitemappet, ikke fra indholdsmapperne ---
function adresserFraSitemap() {
  if (!fs.existsSync(DIST)) throw new Error('dist/ findes ikke — kør `npm run build` først.');
  const ud = new Set();
  for (const n of fs.readdirSync(DIST).filter((n) => n.startsWith('sitemap') && n.endsWith('.xml'))) {
    for (const m of fs.readFileSync(path.join(DIST, n), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (!m[1].endsWith('.xml')) ud.add(m[1]);
    }
  }
  return [...ud].sort();
}

// En adresse indsendes først, når den faktisk svarer. Bliver den indsendt,
// før Cloudflare har lagt den ud, henter søgemaskinen en 404 og lærer det
// modsatte af, hvad vi ville sige.
// Svarer med ÅRSAGEN, ikke bare ja/nej. Et bart "false" kostede os første
// kørsel: alle 100 adresser blev sprunget over, jobbet blev grønt, og loggen
// kunne ikke fortælle om det var en 403, en timeout eller en DNS-fejl.
async function tjekAdresse(url) {
  try {
    const r = await fetch(`${url}?indexnow=${Date.now()}`, {
      method: 'HEAD',
      redirect: 'follow',
      // Uden et navn sender Node ingen User-Agent, og en bot uden navn er
      // det første en firewall afviser. Nu kan vi også kendes i logfilerne.
      headers: { 'user-agent': `${VAERT}-indexnow/1.0 (+${BASIS})` },
      signal: AbortSignal.timeout(15000),
    });
    return { ok: r.status === 200, grund: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, grund: `netværk: ${e.cause?.code || e.name || e.message}` };
  }
}

async function main() {
  const { noegle, url: noegleUrl } = findNoegle();
  const sendt = fs.existsSync(HUKOMMELSE) ? JSON.parse(fs.readFileSync(HUKOMMELSE, 'utf8')) : {};
  const adresser = adresserFraSitemap();
  const nye = alle ? adresser : adresser.filter((u) => !sendt[u]);

  console.log(`${adresser.length} adresser i sitemappet · ${Object.keys(sendt).length} sendt før · ${nye.length} nye`);
  if (!nye.length) { console.log('Intet nyt at sende.'); return; }

  const udvalgte = nye.slice(0, LOFT);
  if (nye.length > LOFT) console.log(`Sender de første ${LOFT}; resten tages af næste kørsel.`);

  // Tjek at de er live, højst 8 ad gangen så vi ikke hamrer på vores eget site
  const live = [];
  const afvist = new Map(); // årsag -> adresser
  for (let i = 0; i < udvalgte.length; i += 8) {
    const hold = udvalgte.slice(i, i + 8);
    const svar = await Promise.all(hold.map(tjekAdresse));
    hold.forEach((u, j) => {
      if (svar[j].ok) live.push(u);
      else afvist.set(svar[j].grund, [...(afvist.get(svar[j].grund) || []), u]);
    });
  }

  // Årsagerne samlet i grupper. 100 ens linjer skjuler mønsteret; tre
  // grupper med tal viser med det samme, om det er sitet eller netværket.
  for (const [grund, urls] of [...afvist].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${urls.length} sprunget over — ${grund}`);
    for (const u of urls.slice(0, 3)) console.log(`      ${u}`);
    if (urls.length > 3) console.log(`      … og ${urls.length - 3} mere`);
  }
  console.log(`${live.length} af ${udvalgte.length} svarer 200 og sendes.`);

  // Ingen adresser sendt er IKKE en succes. Gik jobbet grønt her, ville vi
  // tro, IndexNow kørte, mens der i virkeligheden ikke blev sendt noget —
  // samme slags tavse fejl som de 25 tomme artikler, der lå ude i tre uger.
  if (!live.length) {
    console.error('❌ Ingen adresser bestod live-tjekket. Se årsagerne ovenfor.');
    process.exitCode = 1;
    return;
  }

  if (toer) {
    console.log('--dry-run: sender ikke. Ville sende:');
    for (const u of live) console.log('  ' + u);
    return;
  }

  const svar = await fetch(ENDEPUNKT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: VAERT, key: noegle, keyLocation: noegleUrl, urlList: live }),
  });
  const tekst = await svar.text().catch(() => '');
  // 200 = modtaget, 202 = modtaget men nøglen tjekkes senere. Begge er ok.
  if (svar.status !== 200 && svar.status !== 202) {
    console.error(`❌ IndexNow svarede ${svar.status} ${tekst.slice(0, 300)}`);
    // 429 er ikke en fejl i koden — vi har sendt for meget. Prøv igen senere.
    process.exit(svar.status === 429 ? 0 : 1);
  }
  console.log(`✅ ${live.length} adresser sendt (HTTP ${svar.status}).`);

  const nu = new Date().toISOString().slice(0, 10);
  for (const u of live) sendt[u] = nu;
  // Adresser, der ikke findes mere (slettede artikler), ryddes ud, så filen
  // ikke vokser i det uendelige med noget, der alligevel er 301'et videre.
  const levende = new Set(adresser);
  for (const u of Object.keys(sendt)) if (!levende.has(u)) delete sendt[u];
  const sorteret = {};
  for (const u of Object.keys(sendt).sort()) sorteret[u] = sendt[u];
  fs.writeFileSync(HUKOMMELSE, JSON.stringify(sorteret, null, 2) + '\n');
  console.log(`${HUKOMMELSE} opdateret: ${Object.keys(sendt).length} adresser.`);
}

main().catch((e) => { console.error('❌ ' + e.message); process.exit(1); });
