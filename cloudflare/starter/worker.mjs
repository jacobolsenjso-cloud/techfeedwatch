// Pålidelig starter for techfeedwatch (15/10-2026).
//
// Hvorfor: GitHubs egen tidsplan dropper de fleste kørsler (målt 14.-15/10: robotten
// startede 4 af ca. 24 gange, omskrivningen 0 af 1, morgenrapporten 0 af 3). Cloudflares
// tidsplan er pålidelig. Denne Worker gør kun én ting: på faste tidspunkter beder den
// GitHub om at starte et workflow (samme som at trykke "Run workflow").
//
// Én tidsplan i wrangler.toml ("17,37 * * * *", UTC) dækker alle tre opgaver, fordi
// Cloudflares gratis plan kun giver 5 tidsplaner for hele kontoen (delt med techmediaarch).
//
// Nøglen (GITHUB_TOKEN) er en GitHub-nøgle med KUN "Actions: Read and write" på
// repoet techfeedwatch. Den sættes af Jacob med "wrangler secret put GITHUB_TOKEN" og
// står aldrig i koden eller i git.

const REPO = 'jacobolsenjso-cloud/techfeedwatch';

// Hvilke workflows der startes hvornår. Tider i UTC (dansk sommertid = UTC+2,
// vintertid fra 25/10 = UTC+1, så omskrivning og rapport rykker en time tidligere i dansk tid).
export function opgaverTil(tid) {
  const t = tid.getUTCHours(), m = tid.getUTCMinutes();
  const ud = [];
  if (m === 17) ud.push('daily-update.yml');                 // robotten, hver time
  if (m === 37 && t === 6) ud.push('omskriv-gamle.yml');     // 5 gamle artikler, 08:37 dansk sommertid
  if (m === 37 && t === 7) ud.push('daglig-rapport.yml');    // morgenrapporten, 09:37 dansk sommertid
  return ud;
}

async function start(fil, env) {
  // GitHub svarer 204 (intet indhold), når kørslen er sat i gang.
  for (let forsoeg = 0; forsoeg < 3; forsoeg++) {
    if (forsoeg) await new Promise((r) => setTimeout(r, 5000));
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${fil}/dispatches`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'tfw-starter',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (r.status === 204) { console.log(`startet: ${fil}`); return true; }
    // 401/403/404/422 er en nøgle- eller navnefejl: at prøve igen hjælper ikke.
    const tekst = (await r.text()).slice(0, 200);
    console.log(`FEJL ${r.status} for ${fil}: ${tekst}`);
    if ([401, 403, 404, 422].includes(r.status)) return false;
  }
  return false;
}

export default {
  async scheduled(controller, env, ctx) {
    const opgaver = opgaverTil(new Date(controller.scheduledTime));
    if (!opgaver.length) return;
    if (!env.GITHUB_TOKEN) { console.log('FEJL: GITHUB_TOKEN mangler'); return; }
    ctx.waitUntil(Promise.all(opgaver.map((f) => start(f, env))));
  },
  // Ingen offentlig adresse: alt andet end tidsplanen svarer 404.
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
