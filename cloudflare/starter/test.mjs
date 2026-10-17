// Selvtest af starterens tidsplan (kør: node cloudflare/starter/test.mjs). Intet net.
import { opgaverTil } from './worker.mjs';
let fejl = 0;
const t = (navn, ok) => { console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}`); if (!ok) fejl++; };
const u = (h, m) => new Date(Date.UTC(2026, 9, 15, h, m));
let robot = 0, omskriv = 0, rapport = 0;
for (let h = 0; h < 24; h++) for (const m of [17, 37]) for (const f of opgaverTil(u(h, m))) {
  if (f === 'daily-update.yml') robot++; if (f === 'omskriv-gamle.yml') omskriv++; if (f === 'daglig-rapport.yml') rapport++;
}
t(`robotten startes 24 gange i døgnet (${robot})`, robot === 24);
t(`omskrivningen startes 1 gang, kl. 06:37 UTC (${omskriv})`, omskriv === 1 && opgaverTil(u(6, 37)).includes('omskriv-gamle.yml'));
t(`rapporten startes 1 gang, kl. 07:37 UTC (${rapport})`, rapport === 1 && opgaverTil(u(7, 37)).includes('daglig-rapport.yml'));
t('intet på andre minutter', opgaverTil(u(6, 0)).length === 0 && opgaverTil(u(7, 36)).length === 0);
// Kryptokurser (17/10): kun den 1. kl. 03:37 UTC - én gang om måneden.
let kurser = 0;
for (let d = 1; d <= 31; d++) for (let h = 0; h < 24; h++) for (const m of [17, 37]) if (opgaverTil(new Date(Date.UTC(2026, 9, d, h, m))).includes('hent-kurser.yml')) kurser++;
t(`kurserne startes 1 gang i oktober (${kurser})`, kurser === 1 && opgaverTil(new Date(Date.UTC(2026, 10, 1, 3, 37))).includes('hent-kurser.yml'));
t('robotten startes stadig den 1. kl. 03:17', opgaverTil(new Date(Date.UTC(2026, 10, 1, 3, 17))).includes('daily-update.yml'));
console.log(fejl ? `${fejl} FEJL` : 'alt OK'); process.exit(fejl ? 1 : 0);
