// Fjerner artikler, hvis YouTube-video er væk (slettet, privat eller kanal lukket).
//
// Rettet 20/9-2026: scriptet slettede før KUN filen. Målt samme dag: 38 gamle
// adresser sendte Google videre til en 404, fordi to artikler var fjernet her
// uden 301'er, og 36 eksisterende regler pegede på den ene. Nu gør scriptet det
// samme som slet-artikler.mjs — og ét skridt mere, som den mangler: eksisterende
// regler, der pegede på den fjernede artikel, flyttes med. Reglerne ligger i
// src/lib/fjern-artikel.mjs, så begge scripts kan dele dem.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { alleArtikler, laesArtikel, bedsteErstatning, fjernIndgaaendeLinks, opdaterRedirects } from './src/lib/fjern-artikel.mjs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEOS_DIR = './src/content/videos';
const BATCH_SIZE = 50;             // YouTube videos.list tillader op til 50 id'er pr. kald.
const MAX_DELETE_RATIO = 0.30;     // Sikkerhedsgrænse: slet aldrig mere end 30% på én kørsel.

// Uden --apply kører scriptet som TØR-TEST og sletter intet. Workflowen kalder det med --apply.
const APPLY = process.argv.includes('--apply');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Læser alle video-filer og mapper youtubeId -> filsti. Springer filer uden youtubeId over.
function loadVideoFiles() {
  if (!fs.existsSync(VIDEOS_DIR)) return [];
  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
  const entries = [];
  for (const file of files) {
    const full = path.join(VIDEOS_DIR, file);
    const content = fs.readFileSync(full, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    if (match) entries.push({ id: match[1], file, full });
    else console.log(`⚠️ Ingen youtubeId i ${file} - springes over.`);
  }
  return entries;
}

// Slår en batch af id'er op og returnerer settet af id'er der STADIG findes (offentligt) på YouTube.
async function fetchExistingIds(ids) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=id&id=${ids.join(',')}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'ukendt API-fejl');
  return new Set((data.items || []).map((it) => it.id));
}

async function run() {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY er ikke sat!');
    process.exit(1);
  }

  const entries = loadVideoFiles();
  const total = entries.length;
  if (total === 0) {
    console.log('Ingen video-filer fundet.');
    return;
  }

  console.log(`Scanner ${total} videoer mod YouTube API${APPLY ? '' : '  (TØR-TEST - sletter intet)'}...`);

  const dead = [];
  let checked = 0;
  let failedBatches = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      const existing = await fetchExistingIds(batch.map((e) => e.id));
      checked += batch.length;
      // En video regnes som "død" hvis API'en ikke længere returnerer den (slettet, privat eller kanal lukket).
      for (const e of batch) {
        if (!existing.has(e.id)) dead.push(e);
      }
    } catch (err) {
      failedBatches++;
      console.log(`⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1} fejlede (${err.message}) - springes over, sletter intet for den.`);
    }
    if (i + BATCH_SIZE < entries.length) await sleep(300);
  }

  console.log(`\nTjekket ${checked}/${total} videoer. Fandt ${dead.length} døde.`);
  if (failedBatches > 0) console.log(`⚠️ ${failedBatches} batch(es) fejlede og blev sprunget over (intet slettet for dem).`);

  if (dead.length === 0) {
    console.log('✅ Ingen døde videoer. Intet at gøre.');
    return;
  }

  console.log('\nDøde videoer:');
  dead.forEach((e) => console.log(`   ${e.id}  ${e.file}`));

  // Sikkerhedsgrænse: hvis en usædvanlig stor andel ser "død" ud, er der nok noget galt med API/nøglen - stop.
  const ratio = checked > 0 ? dead.length / checked : 0;
  if (checked >= 10 && ratio > MAX_DELETE_RATIO) {
    console.log(`\n🛑 STOP: ${(ratio * 100).toFixed(0)}% ville blive slettet (over grænsen på ${MAX_DELETE_RATIO * 100}%). Sletter INTET - tjek om API/nøglen fejler.`);
    process.exit(1);
  }

  // Erstatninger findes FØR sletningen, så "de overlevende" er korrekt opgjort.
  const doedeSlugs = new Set(dead.map((e) => e.file.replace(/\.md$/, '')));
  const overlever = alleArtikler().filter((a) => !doedeSlugs.has(a.slug));
  const fjernede = dead.map((e) => {
    const slug = e.file.replace(/\.md$/, '');
    const a = laesArtikel(slug);
    const til = bedsteErstatning(a, overlever);
    console.log(`   ${slug}\n      → ${til.url}  (${til.tekst})`);
    return { slug, youtubeId: a.youtubeId || e.id, nyUrl: til.url };
  });

  if (!APPLY) {
    const plan = opdaterRedirects(fjernede, { dry: true });
    const links = fjernede.reduce((n, f) => n + fjernIndgaaendeLinks(f.slug, { dry: true }), 0);
    console.log(`\nTØR-TEST: ingen filer slettet, intet skrevet.`);
    console.log(`   Ville skrive ${plan.nyeRegler} nye 301-regler og flytte ${plan.flyttede} eksisterende regler med.`);
    console.log(`   Ville fjerne ${links} indgående link(s) inde på sitet.`);
    console.log(`   Kør 'node prune-deleted-videos.mjs --apply' for at gøre det rigtigt.`);
    return;
  }

  // Rækkefølge med vilje: links og redirects FØRST, filerne til sidst. Går noget
  // galt undervejs, står artiklen der stadig — bedre end en 404 uden redirect.
  let linksFjernet = 0;
  for (const f of fjernede) linksFjernet += fjernIndgaaendeLinks(f.slug);
  const { nyeRegler, flyttede } = opdaterRedirects(fjernede);
  console.log(`\n${nyeRegler} nye 301-regler skrevet, ${flyttede} eksisterende regler flyttet med, ${linksFjernet} indgående link(s) fjernet.`);

  let deleted = 0;
  for (const e of dead) {
    try {
      fs.unlinkSync(e.full);
      // Fjern også delekortet hvis det findes
      try { fs.unlinkSync(`./public/og/${e.file.replace(/\.md$/, '')}.jpg`); } catch (e2) {}
      deleted++;
      console.log(`🗑️ Slettet: ${e.file}`);
    } catch (err) {
      console.log(`❌ Kunne ikke slette ${e.file}: ${err.message}`);
    }
  }
  execSync('node sort-redirects.mjs', { stdio: 'inherit' });
  console.log(`\n✅ Færdig. ${deleted} døde video-filer fjernet, alle med 301 til en levende side.`);
}

run();
