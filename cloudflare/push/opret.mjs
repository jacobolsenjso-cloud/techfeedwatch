// Opretter tfw-push (17/10-2026): laver VAPID-nøgleparret, deployer Workeren og lægger den HEMMELIGE
// halvdel direkte i Cloudflare som secret. Den hemmelige nøgle findes kun i hukommelsen her - den
// skrives aldrig til disk og vises aldrig. Den offentlige halvdel står i wrangler.toml (den er offentlig).
//
// Kør KUN én gang. Et nyt nøglepar gør alle eksisterende tilmeldinger ugyldige - derfor nægter
// scriptet, hvis wrangler.toml allerede har en offentlig nøgle.
// Brug (fra cloudflare/push):  node opret.mjs
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const TOML = 'wrangler.toml';
const KV_ID = '3545d63674414ecaaeb487e4c56baaed';
if (fs.existsSync(TOML) && /VAPID_PUBLIC/.test(fs.readFileSync(TOML, 'utf8'))) {
  console.log('STOP: wrangler.toml har allerede en nøgle. Nyt nøglepar ville afmelde alle læsere.');
  process.exit(1);
}
const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const raa = new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey));
const offentlig = Buffer.from(raa).toString('base64url');
const privat = JSON.stringify(await crypto.subtle.exportKey('jwk', par.privateKey));

fs.writeFileSync(TOML, [
  'name = "tfw-push"',
  'main = "worker.mjs"',
  'compatibility_date = "2026-09-01"',
  '# Offentlig adresse (workers.dev): sitet sender tilmeldinger hertil. Udsendelsen er IKKE en adresse,',
  '# men metoden Sender.sendPortion, som kun tfw-starter kan kalde (service binding).',
  'workers_dev = true',
  '',
  '[[kv_namespaces]]',
  'binding = "SUBS"',
  `id = "${KV_ID}"`,
  '',
  '[vars]',
  '# Den OFFENTLIGE halvdel af VAPID-nøglen (står også i sitets kode). Den hemmelige halvdel er secret',
  '# VAPID_PRIVATE_JWK, lagt af opret.mjs uden at blive vist eller gemt.',
  `VAPID_PUBLIC = "${offentlig}"`,
  '',
  '[observability]',
  'enabled = true',
  '',
].join('\n'));
console.log('wrangler.toml skrevet. Offentlig nøgle:', offentlig);

const deploy = execSync('npx --yes wrangler deploy', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
console.log(deploy.split('\n').filter((l) => /Uploaded|Deployed|https:\/\/|Version ID/.test(l)).join('\n'));
const ud = execSync('npx --yes wrangler secret put VAPID_PRIVATE_JWK', { input: privat, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
console.log(ud.split('\n').filter((l) => /Success|uploaded|Uploaded/i.test(l)).join('\n') || 'secret: intet svar - tjek manuelt');
fs.writeFileSync('vapid-public.txt', offentlig + '\n');
