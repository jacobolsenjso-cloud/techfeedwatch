// Daglig robotrapport (14/10-2026, Jacobs ønske): én kort mail hver morgen om de sidste 24 timer.
//
// Leveres som en kommentar på GitHub-issuet "Daglig robotrapport". GitHub mailer kommentarer til
// den, der følger repoet — Jacobs notifikationsmail er jacobolsenjso@gmail.com (tjekket 14/10 i
// github.com/settings/notifications). Ingen ekstra nøgler eller adgangskoder: workflowets egen
// GITHUB_TOKEN er nok.
//
// Workflowet starter flere gange hver morgen, fordi GitHub dropper mange planlagte kørsler (målt
// 14/10). Er dagens rapport allerede sendt, gør scriptet intet. RAPPORT_TVING=1 sender alligevel.
//
// Kilder (alle målte, intet skønnet): src/data/robot-log.jsonl (robot-log.mjs, én linje pr.
// robotkørsel), src/data/omskriv-log.json (omskrivningen), GitHubs liste over kørsler, og
// techfeedwatch.com/build.json + robot-status.json.
import fs from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY || 'jacobolsenjso-cloud/techfeedwatch';
const TOKEN = process.env.GITHUB_TOKEN;
const TITEL = 'Daglig robotrapport';
const TZ = 'Europe/Copenhagen';
const nu = new Date();
const siden = new Date(nu.getTime() - 24 * 3600e3);
const dagDK = (d) => new Date(d).toLocaleDateString('da-DK', { timeZone: TZ });
const tidDK = (d) => new Date(d).toLocaleString('da-DK', { timeZone: TZ, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
// Kroner er et skøn (kurs ca. 6,9) — USD er det målte.
const kr = (usd) => `${usd.toFixed(2)} USD (ca. ${Math.round(usd * 6.9)} kr.)`;

async function gh(sti, opts = {}) {
  const r = await fetch(`https://api.github.com${sti}`, {
    ...opts,
    headers: { ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}), accept: 'application/vnd.github+json', 'user-agent': 'techfeedwatch-rapport', ...(opts.headers || {}) },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} på ${sti}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}
const laesJson = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };

// --- data ---
const robot = (fs.existsSync('src/data/robot-log.jsonl') ? fs.readFileSync('src/data/robot-log.jsonl', 'utf8').split('\n') : [])
  .filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const robot24 = robot.filter((p) => new Date(p.tid) >= siden);
const omskriv = laesJson('src/data/omskriv-log.json', []);
const omskriv24 = omskriv.filter((p) => new Date(p.dato) >= siden);
const maaned = nu.toISOString().slice(0, 7);
const maanedUsd = robot.filter((p) => p.tid.startsWith(maaned)).reduce((s, p) => s + (p.usd || 0), 0)
  + omskriv.filter((p) => String(p.dato).startsWith(maaned)).reduce((s, p) => s + (p.usd || 0), 0);

let koersler = [];
try { koersler = (await gh(`/repos/${REPO}/actions/runs?per_page=100&created=%3E${siden.toISOString().slice(0, 19)}Z`)).workflow_runs; }
catch (e) { console.log('Kunne ikke hente kørsler:', e.message); }
const pr = {};
for (const k of koersler) {
  const n = (pr[k.name] ??= { i_alt: 0, planlagt: 0, fejl: [] });
  n.i_alt++; if (k.event === 'schedule') n.planlagt++;
  if (k.conclusion && !['success', 'skipped'].includes(k.conclusion)) n.fejl.push(`${tidDK(k.created_at)} ${k.conclusion} ${k.html_url}`);
}
// Cloudflare svarer ofte 403 til GitHubs maskiner. Derfor: navn (user-agent) OG 3 forsøg
// med 5 sekunders pause — samme opskrift som tjek-tomgang.mjs (15/10: første rapport
// fik "build.json kunne ikke læses", fordi kun navnet var med).
async function hentSitetsJson(sti) {
  for (let forsoeg = 0; forsoeg < 3; forsoeg++) {
    if (forsoeg) await new Promise((r) => setTimeout(r, 5000));
    try {
      const r = await fetch(`https://techfeedwatch.com/${sti}?t=${Date.now()}`, { headers: { 'user-agent': 'techfeedwatch-rapport' } });
      if (r.ok) return await r.json();
    } catch { /* prøv igen */ }
  }
  return null;
}
const live = await hentSitetsJson('build.json');
const status = await hentSitetsJson('robot-status.json');

// --- beregn ---
const udgivet = robot24.flatMap((p) => p.udgivet || []);
const robotUsd = robot24.reduce((s, p) => s + (p.usd || 0), 0);
const omskrevet = omskriv24.flatMap((p) => p.omskrevet || []);
const omskrivStop = omskriv24.flatMap((p) => p.stoppet || []);
const omskrivUsd = omskriv24.reduce((s, p) => s + (p.usd || 0), 0);
const tomme = robot24.filter((p) => !(p.udgivet || []).length && !p.loftNaaet).length;
const klippet = robot24.reduce((s, p) => s + (p.klippet || 0), 0);
const fejlLinjer = robot24.flatMap((p) => p.fejl || []);
const sprunget = robot24.reduce((s, p) => s + (p.forhaandSprunget || 0), 0);
const vurderet = robot24.reduce((s, p) => s + (p.fuldtVurderet || 0), 0);

const advarsler = [];
if (!robot.length) advarsler.push('Robottens logbog er ny (startet 14/10) — robot-tallene kommer med fra næste kørsel.');
else if (!robot24.length) advarsler.push('Robotten har ikke kørt (eller ikke skrevet i sin logbog) de sidste 24 timer.');
if (robot24.length && !udgivet.length) advarsler.push('0 nye artikler de sidste 24 timer.');
for (const [navn, n] of Object.entries(pr)) for (const f of n.fejl) advarsler.push(`Fejlet kørsel: ${navn} — ${f}`);
if (klippet) advarsler.push(`${klippet} Gemini-svar blev KLIPPET ved loftet — søg "KLIPPET" i robottens log.`);
for (const f of fejlLinjer.slice(0, 3)) advarsler.push(`Fejl i robotten: ${f}`);
if (status?.lastArticle?.at && nu - new Date(status.lastArticle.at) > 36 * 3600e3) advarsler.push(`Seneste artikel er fra ${tidDK(status.lastArticle.at)} (over 36 timer siden).`);

const rob = pr['YouTube Auto Update'] || { i_alt: 0, planlagt: 0 };
const tekst = [
  `## ${dagDK(nu)} — de sidste 24 timer`,
  '',
  advarsler.length ? `**⚠️ Værd at se på:**\n${advarsler.map((a) => `- ${a}`).join('\n')}` : '**✅ Ingen advarsler.**',
  '',
  `**Nye artikler: ${udgivet.length}**${udgivet.length ? '\n' + udgivet.map((s) => `- https://techfeedwatch.com/video/${s}/`).join('\n') : ''}`,
  '',
  `**Robotten:** startet ${rob.i_alt} af 24 gange (Cloudflare-starteren, hver time). ${robot24.length} kørsler i logbogen, ${tomme} uden artikel. Videoer vurderet fuldt: ${vurderet}; sorteret fra af forhåndstjekket: ${sprunget}. Pris: ${kr(robotUsd)}${udgivet.length ? `, ${kr(robotUsd / udgivet.length)} pr. artikel` : ''}.`,
  `**Omskrivning af gamle artikler:** ${omskrevet.length} omskrevet, ${omskrivStop.length} stoppet. Pris: ${kr(omskrivUsd)}.`,
  `**Brugt i ${maaned} (målt; logbøgerne startede 13.-14/10, så tidligere forbrug er ikke med):** ${kr(maanedUsd)}. Kreditten selv kan kun ses i Google AI Studio.`,
  '',
  `**Andre kørsler:** ${Object.entries(pr).filter(([n]) => n !== 'YouTube Auto Update').map(([n, v]) => `${n} ${v.i_alt}`).join(' · ') || 'ingen'}`,
  `**Live:** ${live?.commitShort ? `commit ${live.commitShort}, bygget ${tidDK(live.builtAt)}` : 'build.json kunne ikke læses'} · ${status?.articleCount ?? '?'} artikler i alt`,
  '',
  '<sub>Automatisk rapport fra daglig-rapport.mjs. Tallene er målt; robot-tal fra src/data/robot-log.jsonl.</sub>',
].join('\n');

console.log(tekst);
if (!TOKEN) { console.log('\n(Ingen GITHUB_TOKEN — kun vist, ikke sendt.)'); process.exit(0); }

// --- send: én kommentar pr. dag på issuet ---
const issues = await gh(`/repos/${REPO}/issues?state=open&per_page=100`);
let issue = issues.find((i) => i.title === TITEL && !i.pull_request);
if (!issue) {
  issue = await gh(`/repos/${REPO}/issues`, { method: 'POST', body: JSON.stringify({ title: TITEL, body: 'Robottens daglige rapport kommer som kommentarer her. GitHub mailer hver kommentar til dem, der følger repoet. Luk ikke dette issue — så oprettes et nyt.' }) });
  console.log('Oprettede issue #' + issue.number);
}
const komm = await gh(`/repos/${REPO}/issues/${issue.number}/comments?per_page=100`);
const sendtIdag = komm.some((c) => dagDK(c.created_at) === dagDK(nu) && /de sidste 24 timer/.test(c.body || ''));
if (sendtIdag && process.env.RAPPORT_TVING !== '1') { console.log(`\nDagens rapport er allerede sendt (issue #${issue.number}) — intet gjort.`); process.exit(0); }
const ny = await gh(`/repos/${REPO}/issues/${issue.number}/comments`, { method: 'POST', body: JSON.stringify({ body: tekst }) });
console.log(`\nSendt: ${ny.html_url}`);
