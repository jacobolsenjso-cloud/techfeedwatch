// Skriver public/robot-status.json — robottens eget, maskinlæsbare bevis på
// hvad den sidst har lavet. Filen havner både i git (robottens commit) og på
// det levende site (techfeedwatch.com/robot-status.json), så den kan læses
// fra hvor som helst: uden Jacobs pc, uden browser, uden GitHub-nøgle.
//
// Hvorfor: 22/9-2026 brugte vi en halv time på at finde en log i en browser
// for at bevise, at et trin havde virket. Og husets gamle hul — en kørsel,
// der bliver grøn uden at lave noget — er usynligt, så længe beviset kun
// ligger i GitHubs logs.
//
// Filen skrives KUN, når der sker noget (ny artikel, rettede linktekster,
// en advarsel). Ellers ville hver kørsel lave et commit og et Cloudflare-byg
// for ingenting. Står "lastArticle" stille i flere dage, er DET signalet.
//
// Kan aldrig gøre kørslen rød: alt ligger i try/catch, og der er kun kode 0.
//
// Kør:  node robot-status.mjs [--resultat=<fil fra ret-linktekster>]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const FIL = 'public/robot-status.json';
const VIDEOER = 'src/content/videos';
const nu = new Date().toISOString();

function arbejde() {
  let status = { schema: 1 };
  if (fs.existsSync(FIL)) status = JSON.parse(fs.readFileSync(FIL, 'utf8').replace(/^﻿/, ''));

  // Nye artikler i DENNE kørsel = filer, git ikke kender endnu.
  // (Actions tjekker ud med dybde 1, så git log kan ikke bruges her — git
  //  status kan.)
  const nye = execSync(`git status --porcelain --untracked-files=all -- ${VIDEOER}`, { encoding: 'utf8' })
    .split('\n')
    .filter((l) => /^(\?\?|A )/.test(l) && l.trim().endsWith('.md'))
    .map((l) => path.basename(l.slice(3).trim().replace(/"/g, ''), '.md'));

  // Hvad lavede ret-linktekster.mjs i samme kørsel? (Skrevet af den selv.)
  const arg = process.argv.find((a) => a.startsWith('--resultat='));
  const resFil = arg ? arg.slice('--resultat='.length) : null;
  // Egen try/catch: en ødelagt resultatfil må ikke koste en udgivet artikel
  // dens plads i statusen. (Fundet i test 23/9: uden denne gik ALT tabt.)
  let res = null;
  let resFejl = null;
  if (resFil && fs.existsSync(resFil)) {
    try { res = JSON.parse(fs.readFileSync(resFil, 'utf8').replace(/^﻿/, '')); }
    catch (e) { resFejl = e.message; }
  }

  const aendret = [];
  if (resFejl) {
    status.lastLinkWarning = { at: nu, reason: 'unreadable-result', message: resFejl.slice(0, 300) };
    aendret.push('ADVARSEL: resultatfilen fra ret-linktekster kunne ikke læses');
  }
  if (nye.length) {
    status.lastArticle = { at: nu, slugs: nye };
    aendret.push(`ny artikel: ${nye.join(', ')}`);
  }
  if (res && res.rettet > 0) {
    status.lastLinkRepair = { at: nu, count: res.rettet };
    aendret.push(`${res.rettet} linktekster rettet`);
  }
  // Advarsler er det vigtigste at få frem i lyset: det er netop dem, trinnet
  // ellers sluger i stilhed.
  if (res && (res.overLoft || res.fejl)) {
    status.lastLinkWarning = res.overLoft
      ? { at: nu, reason: 'over-cap', planned: res.planlagt, cap: res.loft }
      : { at: nu, reason: 'error', message: String(res.fejl).slice(0, 300) };
    aendret.push(`ADVARSEL fra ret-linktekster: ${status.lastLinkWarning.reason}`);
  }

  if (aendret.length === 0) {
    console.log('robot-status: intet nyt i denne kørsel — filen røres ikke.');
    return;
  }
  // Fast rækkefølge, så filen er let at læse for et menneske.
  const ud = {
    schema: 1,
    updated: nu,
    articleCount: fs.readdirSync(VIDEOER).filter((f) => f.endsWith('.md')).length,
    lastArticle: status.lastArticle ?? null,
    lastLinkRepair: status.lastLinkRepair ?? null,
    lastLinkWarning: status.lastLinkWarning ?? null,
    note: 'Written by the robot only when something happens. If lastArticle stops moving for days, the robot has gone idle.',
  };
  fs.writeFileSync(FIL, JSON.stringify(ud, null, 2) + '\n');
  console.log(`robot-status opdateret: ${aendret.join(' · ')}`);
}

try {
  arbejde();
} catch (e) {
  console.log(`⚠️  robot-status kunne ikke skrives: ${e.message}`);
  console.log('   Kørslen fortsætter — dette trin stopper aldrig robotten.');
}
process.exit(0);
