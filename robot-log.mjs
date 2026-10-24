// Robottens logbog (14/10-2026): læser én kørsels output og tilføjer én linje til
// src/data/robot-log.jsonl. Den daglige rapport (daglig-rapport.mjs) bygger på filen.
//
// Hvorfor: før 14/10 fandtes prisen og udfaldet af hver kørsel KUN i GitHubs log, som kræver
// login at læse. At robotten skrev 1 artikel i stedet for 4, og at et filter var slået fra,
// blev opdaget ved et tilfælde. Nu gemmes det målte i repoet, og rapporten kan tælle det.
//
// Brug (i workflowet): node robot-log.mjs <logfil>   — slutter altid med kode 0 (må aldrig gøre kørslen rød).
import fs from 'node:fs';

const FIL = process.env.ROBOT_LOG_FIL || 'src/data/robot-log.jsonl'; // ROBOT_LOG_FIL kun til test
try {
  const log = fs.readFileSync(process.argv[2], 'utf8');
  const linjer = log.split(/\r?\n/);
  // FORBRUG fra alle processer (robotten selv + hver add-video). Ikke SOEG-FORBRUG: det er en
  // delmængde, der allerede er med i FORBRUG (Lære 13/10: regex fangede SOEG-FORBRUG først).
  let usd = 0, kald = 0;
  for (const l of linjer) {
    const m = l.match(/(?:^|[^-A-Z])FORBRUG: (\{.*\})\s*$/);
    if (!m) continue;
    try { const j = JSON.parse(m[1]); usd += Number(j.usd) || 0; kald += Number(j.kald) || 0; } catch { /* halv linje */ }
  }
  const alle = (re) => linjer.map((l) => l.match(re)).filter(Boolean).map((m) => m[1]);
  const post = {
    tid: new Date().toISOString(),
    koersel: Number(process.env.GITHUB_RUN_NUMBER) || null,
    udloest: process.env.GITHUB_EVENT_NAME || null,
    udgivet: alle(/Succes! Fil oprettet: (\S+)\.md/),
    emner: [...new Set(alle(/(?:Vælger emnet der halter mest|Skifter emne til det næstmindste): "([^"]+)"/))],
    spoergsmaal: alle(/Spørgsmål fra autocomplete \(\d\/\d\): "([^"]+)"/),
    paaIs: alle(/Info: "([^"]+)" lagt på is/),
    fuldtVurderet: linjer.filter((l) => /Vurderer kandidat:/.test(l)).length,
    forhaandSprunget: linjer.filter((l) => /forhåndstjek \d+\/10/.test(l)).length,
    loftNaaet: linjer.some((l) => /Dagsloftet er nået/.test(l)),
    klippet: linjer.filter((l) => /Gemini-svar KLIPPET/.test(l)).length,
    // Kanal-værn (24/10): kanaler slået op, videoer afvist, og opslag der fejlede (så værnet lukkede alt igennem).
    kanalVaern: {
      tjekket: alle(/Kanal-værn: (\d+) kanaler tjekket/).reduce((s, x) => s + Number(x), 0),
      afvist: linjer.filter((l) => /Springer over: kanal-værn:/.test(l)).length,
      fejlet: linjer.filter((l) => /Kanal-værn: YouTube-opslag fejlede/.test(l)).length,
    },
    fejl: linjer.filter((l) => /❌|Kritisk fejl|GEMINI STOPPET/.test(l)).map((l) => l.trim().slice(0, 200)).slice(0, 5),
    usd: Math.round(usd * 10000) / 10000,
    kald,
  };
  fs.mkdirSync('src/data', { recursive: true });
  fs.appendFileSync(FIL, JSON.stringify(post) + '\n', 'utf8');
  console.log(`robot-log: ${post.udgivet.length} udgivet, ${post.fuldtVurderet} vurderet fuldt, ${post.forhaandSprunget} sprunget over af forhåndstjek, ${post.usd} USD`);
} catch (e) {
  console.log(`robot-log: kunne ikke skrive (${e.message}) — kørslen fortsætter.`);
}
