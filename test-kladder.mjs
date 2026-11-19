// Selvtest af kladde-køen (19/11-2026): kryptering, kladder, Jacobs beslutninger og godkend-funktionen.
// Kører i en midlertidig mappe (KLADDE_ROD) med en test-nøgle - rører aldrig repoet, nettet eller Gemini.
// Kør: node test-kladder.mjs   (slutter med kode 1, hvis et tjek fejler)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const ROD = fs.mkdtempSync(path.join(os.tmpdir(), 'tfw-kladder-'));
process.env.KLADDE_ROD = ROD;
process.env.KLADDE_NOEGLE = crypto.randomBytes(32).toString('base64');
fs.mkdirSync(path.join(ROD, 'src/content/videos'), { recursive: true });
fs.mkdirSync(path.join(ROD, 'src/data'), { recursive: true });

const { krypter, dekrypter } = await import('./src/lib/kryptering.mjs');
const K = await import('./src/lib/kladder.mjs');
const { aktuelle, udfoer, tilLive, tjekRettelse } = await import('./kladder.mjs');

let ok = 0, fejl = 0;
const tjek = (navn, betingelse) => { if (betingelse) { ok++; console.log(`OK    ${navn}`); } else { fejl++; console.log(`FEJL  ${navn}`); } };
const kast = async (fn) => { try { await fn(); return false; } catch { return true; } };

// --- Kryptering ---
const hemmelig = await krypter('Hemmelig titel om bitcoin', process.env.KLADDE_NOEGLE);
tjek('krypteret tekst indeholder ikke klarteksten', !hemmelig.includes('bitcoin') && hemmelig.startsWith('tfwk1:'));
tjek('dekryptering giver klarteksten tilbage', (await dekrypter(hemmelig, process.env.KLADDE_NOEGLE)) === 'Hemmelig titel om bitcoin');
tjek('forkert nøgle afvises', await kast(() => dekrypter(hemmelig, crypto.randomBytes(32).toString('base64'))));
const rettet = hemmelig.slice(0, -6) + (hemmelig.slice(-6, -5) === 'A' ? 'B' : 'A') + hemmelig.slice(-5);
tjek('ændret fil afvises (kontrolmærket)', await kast(() => dekrypter(rettet, process.env.KLADDE_NOEGLE)));
tjek('manglende nøgle afvises', await kast(() => dekrypter(hemmelig, '')));

// --- Kladder ---
const lang = Array.from({ length: 700 }, (_, i) => `word${i % 50}`).join(' ');
const md = (titel, dato = '2026-11-19', ekstra = '') => `---\ntitle: "${titel}"\nyoutubeId: "abcdefghijk"\ndate: "${dato}"\n${ekstra}tags:\n  - "AI & Tech"\nsummary: "Kort resume af artiklen her."\nmetaDescription: "A clear meta description for the test article that is long enough to pass the length check here."\ntargetQuestion: "what is a test"\nisShort: false\nrecipe: 3\nfaqs:\n  - question: "What is it?"\n    answer: "A test."\n---\n\n## What is a test\n\n${lang}\n\nSee [this page](https://example.com/kilde).\n\n## Sources\n\n- [Example](https://example.com/kilde)\n`;
const k1 = await K.gemKladde({ slug: 'what-is-a-test', markdown: md('What Is a Test and Why It Matters'), type: 'ny' });
const fil = fs.readFileSync(path.join(ROD, K.KLADDE_DIR, `${k1.id}.kladde`), 'utf8');
tjek('kladden ligger krypteret (titel og adresse kan ikke læses)', !fil.includes('Test and Why') && !fil.includes('what-is-a-test'));
tjek('listen har kun id', JSON.stringify(K.liste()) === JSON.stringify([{ id: k1.id }]));
tjek('kladden er IKKE lagt i src/content/videos', !fs.existsSync(path.join(ROD, 'src/content/videos/what-is-a-test.md')));
tjek('loggen tæller én ny skrevet i dag', K.nyeSkrevetIDag() === 1);
tjek('visningen har titel, HTML og FAQ', k1.visning.title.startsWith('What Is a Test') && k1.visning.html.includes('<h2') && k1.visning.faqs.length === 1);
const k1b = await K.gemKladde({ slug: 'what-is-a-test', markdown: md('What Is a Test and Why It Matters Now'), type: 'ny' });
tjek('samme artikel igen = version 2 af samme kladde', k1b.id === k1.id && k1b.version === 2 && K.antalVenter() === 1);
tjek('nøgle mangler -> ingen kladde, ingen levende fil', await (async () => { const n = process.env.KLADDE_NOEGLE; delete process.env.KLADDE_NOEGLE; const r = await kast(() => K.gemKladde({ slug: 'x-y', markdown: md('Xxxxxxxxxxxxxxxxxxxxxxxx'), type: 'ny' })); process.env.KLADDE_NOEGLE = n; return r && !fs.existsSync(path.join(ROD, 'src/content/videos/x-y.md')); })());
const opt = await K.optagetAfKladder();
tjek('videoen og adressen i køen tæller som optaget', opt.videoer.has('abcdefghijk') && opt.slugs.has('what-is-a-test'));

// --- Beslutninger ---
const kl = await K.laesKladder();
tjek('gammel version af beslutningen udføres ikke', aktuelle([{ id: k1.id, version: 1, handling: 'godkend', tid: '2026-11-19T10:00:00Z' }], kl).length === 0);
tjek('nyeste beslutning vinder', aktuelle([{ id: k1.id, version: 2, handling: 'afvis', tid: '2026-11-19T10:00:00Z' }, { id: k1.id, version: 2, handling: 'godkend', tid: '2026-11-19T11:00:00Z' }], kl)[0]?.handling === 'godkend');
tjek('ukendt kladde ignoreres', aktuelle([{ id: '0123456789abcdef', version: 1, handling: 'godkend', tid: 'x' }], kl).length === 0);
tjek('mislykket Omskriv prøves ikke igen uden nyt tryk', aktuelle([{ id: k1.id, version: 2, handling: 'omskriv', tid: '2026-11-19T10:00:00Z' }], [{ ...kl[0], fejltid: '2026-11-19T10:30:00Z' }]).length === 0);

// --- Omskriv efter note (falsk Gemini) ---
const noteKrypt = await krypter('skriv at jeg selv har brugt det', process.env.KLADDE_NOEGLE);
const godSvar = async () => ({ title: 'What Is a Test and Why It Matters to You', metaDescription: 'A clear meta description for the test article that is long enough to pass the length check, rewritten.', summary: 'Nyt resume.', faqs: [{ question: 'What is it?', answer: 'A small test.' }], body: `## What is a test\n\nI have used tests myself for two years.\n\n${lang}\n\nSee [this page](https://example.com/kilde).\n\n## Sources\n\n- [Example](https://example.com/kilde)\n`, changes: 'Tilføjede Jacobs erfaring.' });
await udfoer(aktuelle([{ id: k1.id, version: 2, handling: 'omskriv', note: noteKrypt, tid: '2026-11-19T12:00:00Z' }], await K.laesKladder()), { kald: godSvar, rod: ROD });
let k = (await K.laesKladder())[0];
tjek('Omskriv giver version 3 med note, ændringslinje og gult afsnit', k.version === 3 && k.note === 'skriv at jeg selv har brugt det' && k.aendringer && k.aendret.some((a) => a.startsWith('I have used tests')));
tjek('omskrevet kladde er stadig ikke live', !fs.existsSync(path.join(ROD, 'src/content/videos/what-is-a-test.md')));
const ondtSvar = async () => ({ ...(await godSvar()), body: (await godSvar()).body + '\nAlso [new](https://snyd.example.com).\n' });
await udfoer(aktuelle([{ id: k1.id, version: 3, handling: 'omskriv', note: '', tid: '2026-11-19T13:00:00Z' }], await K.laesKladder()), { kald: ondtSvar, rod: ROD });
k = (await K.laesKladder())[0];
tjek('omskrivning med nyt link afvises og fejlen gemmes i kladden', k.version === 3 && /nye links/.test(k.fejl || ''));
tjek('kildelisten må ikke ændres', /Sources/.test(tjekRettelse({ krop: md('x').split('---\n')[2], faqs: [{}] }, { ...(await godSvar()), body: (await godSvar()).body.replace('[Example]', '[Andet]') })));

// --- Godkend ny ---
await udfoer(aktuelle([{ id: k1.id, version: 3, handling: 'godkend', tid: '2026-11-19T14:00:00Z' }], await K.laesKladder()), { rod: ROD });
const live = fs.readFileSync(path.join(ROD, 'src/content/videos/what-is-a-test.md'), 'utf8');
const idag = new Date().toISOString().slice(0, 10);
tjek('Godkend: artiklen er live med dagens dato, skrevet og godkendt', live.includes(`date: "${idag}"`) && /^skrevet: "/m.test(live) && live.includes(`godkendt: "${idag}"`) && live.includes('I have used tests'));
tjek('Godkend: kladden er væk fra køen', K.antalVenter() === 0 && !fs.existsSync(path.join(ROD, K.KLADDE_DIR, `${k1.id}.kladde`)));

// --- Omskrivning af levende artikel: dato bevares; Afvis hviler 30 dage ---
fs.writeFileSync(path.join(ROD, 'src/content/videos/old-one.md'), md('Old One That Is Live on the Site', '2025-03-01'));
const k2 = await K.gemKladde({ slug: 'old-one', markdown: md('Old One That Is Live, Rewritten', '2025-03-01'), type: 'omskrevet' });
tjek('levende artikel er urørt, mens omskrivningen venter', fs.readFileSync(path.join(ROD, 'src/content/videos/old-one.md'), 'utf8').includes('Old One That Is Live on the Site'));
const lv = tilLive(k2);
tjek('omskrevet: udgivelsesdatoen bevares, updated + rewrittenAt + godkendt = i dag', lv.includes('date: "2025-03-01"') && lv.includes(`updated: "${idag}"`) && lv.includes(`rewrittenAt: "${idag}"`) && lv.includes(`godkendt: "${idag}"`));
await udfoer(aktuelle([{ id: k2.id, version: 1, handling: 'afvis', note: noteKrypt, tid: '2026-11-19T15:00:00Z' }], await K.laesKladder()), { rod: ROD });
const afv = fs.readdirSync(path.join(ROD, K.AFVIST_DIR));
tjek('Afvis: gemt krypteret i kladder-afviste, levende artikel urørt', afv.length === 1 && !fs.readFileSync(path.join(ROD, K.AFVIST_DIR, afv[0]), 'utf8').includes('Old One') && fs.readFileSync(path.join(ROD, 'src/content/videos/old-one.md'), 'utf8').includes('on the Site'));
const of = JSON.parse(fs.readFileSync(path.join(ROD, 'src/data/omskriv-fejl.json'), 'utf8'));
tjek('Afvis af omskrivning: hviler 30 dage', of['old-one']?.afvistTil > idag);
tjek('afvist video tæller stadig som brugt', (await K.optagetAfKladder()).videoer.has('abcdefghijk'));

// --- Godkend må ikke overskrive en anden artikel ---
const k3 = await K.gemKladde({ slug: 'old-one', markdown: md('Collision Article Title Here'), type: 'ny' });
process.exitCode = 0;
await udfoer(aktuelle([{ id: k3.id, version: 1, handling: 'godkend', tid: '2026-11-19T16:00:00Z' }], await K.laesKladder()), { rod: ROD });
tjek('ny kladde med en adresse, der findes: ikke live, kladden bliver', process.exitCode === 1 && K.antalVenter() === 1 && fs.readFileSync(path.join(ROD, 'src/content/videos/old-one.md'), 'utf8').includes('on the Site'));
process.exitCode = 0;

// --- Kø-loft ---
for (let i = 0; i < 5; i++) await K.gemKladde({ slug: `fyld-${i}`, markdown: md(`Fill Article Number ${i} Title`), type: 'ny' });
tjek('kø-loftet: 6 kladder = fuld', K.antalVenter() === 6 && K.koeFuld());

// --- Godkend-funktionen (Cloudflare) med falsk KV og falsk Access ---
const kv = new Map();
const KV = { get: async (n, t) => (kv.has(n) ? (t === 'json' ? JSON.parse(kv.get(n)) : kv.get(n)) : null), put: async (n, v) => { kv.set(n, v); }, delete: async (n) => { kv.delete(n); }, list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((n) => n.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
const { onRequest, tjekBillet } = await import('./functions/api/godkend.js');
const { onRequestGet } = await import('./functions/api/kladde-beslutninger.js');
const env = { GODKEND: KV, KLADDE_NOEGLE: process.env.KLADDE_NOEGLE, ACCESS_TEAM: 'test', ACCESS_AUD: 'aud', GODKEND_EMAIL: 'jacob@example.com' };
const r403 = await onRequest({ request: new Request('https://techfeedwatch.com/api/godkend', { method: 'POST', body: '{}' }), env });
tjek('uden Access-billet: 403 (intet kan gemmes)', r403.status === 403);
// Ægte RS256-billet, underskrevet med en test-nøgle; certifikaterne leveres af en falsk fetch
const par = await crypto.webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await crypto.webcrypto.subtle.exportKey('jwk', par.publicKey)), kid: 'k1' };
const b64u = (b) => Buffer.from(b).toString('base64url');
const lavBillet = async (email) => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1' })); const p = b64u(JSON.stringify({ iss: 'https://test.cloudflareaccess.com', aud: ['aud'], email, exp: Math.floor(Date.now() / 1000) + 600 })); const s = b64u(await crypto.webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(`${h}.${p}`))); return `${h}.${p}.${s}`; };
const falskHent = async () => new Response(JSON.stringify({ keys: [jwk] }));
const reqMed = async (email) => new Request('https://techfeedwatch.com/api/godkend', { headers: { 'cf-access-jwt-assertion': await lavBillet(email) } });
tjek('rigtig billet med Jacobs e-mail godkendes', await tjekBillet(await reqMed('jacob@example.com'), env, falskHent));
tjek('billet med en anden e-mail afvises', !(await tjekBillet(await reqMed('ond@example.com'), env, falskHent)));
// Gem en beslutning direkte i KV, som funktionen gør, og se hvad den offentlige adresse viser
kv.set(`b:${k3.id}`, JSON.stringify({ id: k3.id, version: 1, handling: 'omskriv', note: await krypter('min hemmelige note', process.env.KLADDE_NOEGLE), tid: 'x' }));
const pub = await (await onRequestGet({ env })).text();
tjek('offentlig adresse: id og handling, men noten er krypteret', pub.includes(k3.id) && pub.includes('omskriv') && !pub.includes('hemmelige'));

fs.rmSync(ROD, { recursive: true, force: true });
console.log(`\n${ok} OK, ${fejl} fejl`);
process.exit(fejl ? 1 : 0);
