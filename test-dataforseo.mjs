// Selvtest af søgetallene (src/lib/dataforseo.mjs, 10/11-2026). Intet net: fetch er udskiftet med falske svar,
// og hukommelsen skrives til en midlertidig fil (aldrig src/data/dataforseo.json). Kør: node test-dataforseo.mjs
// Slutter med kode 1 ved fejl.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { oversaet, vaerdi, gruppe, hentTal, laesHusk, talTekst, ordn, normaliser, logLinje, MIN_SOEGNINGER, TAG, KD_MAKS, forSvaer } from './src/lib/dataforseo.mjs';

let fejl = 0;
const t = (navn, ok) => { console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}`); if (!ok) fejl++; };
const mdr = (xs) => xs.map((v, i) => ({ year: 2026, month: 12 - i, search_volume: v }));
const item = (keyword, v, kd, kurve, yearly = 0) => ({ keyword, keyword_info: { search_volume: v, monthly_searches: mdr(kurve || Array(12).fill(v)), search_volume_trend: { yearly } }, keyword_properties: { keyword_difficulty: kd } });

// 1. Oversættelse, værdi, gruppe, tekst
const a = oversaet(item('how does a vpn work', 4400, 10));
t('jævn kurve = tidløs', a.j === true);
t('svingende kurve = ikke tidløs', oversaet(item('x', 500, 10, [2000, 100, 100, 100, 1500, 100, 100, 100, 100, 1500, 100, 100])).j === false);
t(`værdi: 4400 søgn., sværhed 10, tidløs = 4400×0,9³×1,5 = 4811 (${vaerdi(a)})`, vaerdi(a) === 4811);
t('under 20 søgninger = værdi 0', vaerdi(oversaet(item('x', MIN_SOEGNINGER - 1, 0))) === 0);
t('ukendt sværhed regnes som 50 (100×0,5³ = 13)', vaerdi({ v: 100, kd: null, j: false, a: null }) === 13);
t('faldet ≥ 50 % på et år ×0,7', vaerdi({ v: 1000, kd: 0, j: false, a: -70 }) === 700);
t('gruppe: ikke spurgt / ukendt / nok / for få = 1/1/0/2', gruppe(undefined) === 1 && gruppe(null) === 1 && gruppe({ v: 20 }) === 0 && gruppe({ v: 19 }) === 2);
// Sværhedsreglen (13/11): over KD_MAKS (30) = for svær → værdi 0 og bagerst; 30 er stadig med; ukendt er ikke for svær
t(`for svær: sværhed ${KD_MAKS + 1} = værdi 0 og gruppe 2`, vaerdi({ v: 4400, kd: KD_MAKS + 1, j: false, a: 0 }) === 0 && gruppe({ v: 4400, kd: KD_MAKS + 1 }) === 2 && forSvaer({ v: 4400, kd: KD_MAKS + 1 }));
t(`sværhed ${KD_MAKS} er stadig med (gruppe 0)`, gruppe({ v: 100, kd: KD_MAKS }) === 0 && vaerdi({ v: 100, kd: KD_MAKS, j: false, a: 0 }) === 34);
t('ukendt sværhed er ikke "for svær"', !forSvaer({ v: 100, kd: null }) && gruppe({ v: 100, kd: null }) === 0);
t('let spørgsmål med færre søgninger slår svært med flere (1000/sv.0 = 1000 > 2500/sv.30 = 858)', vaerdi({ v: 1000, kd: 0, j: false, a: 0 }) > vaerdi({ v: 2500, kd: 30, j: false, a: 0 }));
t('tekst viser "for svær"', talTekst({ v: 4400, kd: 46, j: false, a: 0 }).includes('for svær'));
t('tekst', talTekst(a) === '4400 søgn./md · sværhed 10 · tidløs' && talTekst(null).includes('ukendt') && talTekst(undefined).includes('ikke spurgt'));
t('normaliser: små bogstaver, uden "?" og dobbelte mellemrum', normaliser('  How does  a VPN work? ') === 'how does a vpn work');

// 2. Rækkefølge: nok søgninger efter værdi, så ukendte, så for få - lige stand bevarer rækkefølgen
const tal0 = { b: { v: 900, kd: 10, j: false, a: 0 }, c: { v: 5000, kd: 90, j: false, a: 0 }, d: null, e: { v: 5, kd: 0, j: false, a: 0 }, g: undefined, h: { v: 900, kd: 10, j: false, a: 0 } };
const r0 = ordn(['e', 'd', 'b', 'g', 'c', 'h'], (x) => tal0[x]);
// b = h (samme - b stod først); d og g ukendte (d stod først); e for få og c for svær (sværhed 90) bagerst i den
// rækkefølge, de kom i (e stod før c)
t(`ordn: ${r0.join(',')} = b,h,d,g,e,c`, r0.join(',') === 'b,h,d,g,e,c');
t('ordn uden tal ændrer intet (robotten vælger som før)', ordn(['x', 'y', 'z'], () => undefined).join('') === 'xyz');

// 3. hentTal med falsk fetch og midlertidig hukommelse
const fil = path.join(os.tmpdir(), `_dfs-tfw-test-${process.pid}.json`);
const nu = Date.parse('2026-11-10T12:00:00Z');
let sendtSidst = null, tagSidst = null, kaldt = 0, svarKode = 20000, netNede = false, httpKode = 200;
globalThis.fetch = async (url, opt) => {
  kaldt++;
  if (netNede) throw new Error('getaddrinfo ENOTFOUND api.dataforseo.com');
  if (!String(opt.headers.authorization).startsWith('Basic ')) throw new Error('ingen login sendt');
  const body = JSON.parse(opt.body)[0];
  sendtSidst = body.keywords; tagSidst = body.tag;
  return { ok: httpKode === 200, status: httpKode, json: async () => ({ status_code: 20000, tasks: [{ status_code: svarKode, status_message: svarKode === 20000 ? 'Ok.' : 'Daily limit exceeded', cost: 0.0124,
    result: [{ items: [item('how does a vpn work', 4400, 10), item('what is a vpn', 0, null)] }] }] }) };
};
delete process.env.DATAFORSEO_LOGIN; delete process.env.DATAFORSEO_PASSWORD;
let r = await hentTal(['how does a vpn work'], { nu, fil });
t('uden nøgle: intet kald, fejl i loggen, robotten kører videre', kaldt === 0 && /nøglen mangler/.test(r.log.fejl) && r.tal.size === 0);
process.env.DATAFORSEO_LOGIN = 'test'; process.env.DATAFORSEO_PASSWORD = 'test';
r = await hentTal(['How does a VPN work?', 'what is a vpn', 'what is a vpn', 'can ai be banned', 'x '.repeat(50)], { nu, fil });
t(`sender normaliseret, uden dubletter og uden for lange (${JSON.stringify(sendtSidst)})`, JSON.stringify(sendtSidst) === JSON.stringify(['how does a vpn work', 'what is a vpn', 'can ai be banned']));
t(`kaldet bærer mærket "tfw" (${tagSidst})`, tagSidst === 'tfw' && TAG === 'tfw');
t('fundet → tal, ukendt → null', r.tal.get('how does a vpn work')?.v === 4400 && r.tal.get('can ai be banned') === null && r.tal.get('what is a vpn')?.v === 0);
t('log: sendt 3, fundet 2, pris', r.log.sendt === 3 && r.log.fundet === 2 && r.log.pris === 0.0124);
t('logLinje: 1 med tal, 1 ukendt, 1 for få', /"medTal":1,"ukendt":1,"faa":1/.test(logLinje(r.log, ['how does a vpn work', 'can ai be banned', 'what is a vpn'], (q) => r.tal.get(q))));
const raa = fs.readFileSync(fil, 'utf8');
t('hukommelsen er gyldig JSON med én linje pr. spørgsmål', Object.keys(JSON.parse(raa)).length === 3 && raa.trim().split('\n').length === 5);
r = await hentTal(['how does a vpn work', 'can ai be banned', 'what is devops'], { nu: nu + 864e5, fil });
t('dagen efter: kun det nye sendes (hukommelsen bruges)', JSON.stringify(sendtSidst) === '["what is devops"]' && r.log.fraHusk === 2);
t('efter 30 dage er dag 1 glemt, dag 2 husket', JSON.stringify(Object.keys(laesHusk(nu + 30.25 * 864e5, fil))) === '["what is devops"]');
t('efter 32 dage er alt glemt', Object.keys(laesHusk(nu + 32 * 864e5, fil)).length === 0);
kaldt = 0;
await hentTal(['a b c', 'd e f', 'g h i'], { nu, fil, maks: 2, kald_: 1 });
t('højst maks søgeord pr. kald og højst kald_ kald', sendtSidst.length === 2 && kaldt === 1);

// 4. Fejl: robotten må aldrig gå i stå
const foer = fs.readFileSync(fil, 'utf8');
svarKode = 40203;
r = await hentTal(['how does a vpn work', 'brand new question'], { nu: nu + 864e5, fil });
t(`dagsloft nået (40203): fejl i loggen, hukommelsen uændret, kendte tal bruges stadig (${r.log.fejl})`, /40203/.test(r.log.fejl) && fs.readFileSync(fil, 'utf8') === foer && r.tal.get('how does a vpn work')?.v === 4400);
svarKode = 20000; httpKode = 401;
r = await hentTal(['another new question'], { nu: nu + 864e5, fil });
t(`forkert nøgle (401): fejl i loggen, ingen undtagelse (${r.log.fejl})`, /401/.test(r.log.fejl) && r.log.kald === 0);
httpKode = 200; netNede = true;
r = await hentTal(['third new question'], { nu: nu + 864e5, fil });
t(`net nede: ingen undtagelse, fejl i loggen (${r.log.fejl})`, /ENOTFOUND/.test(r.log.fejl));
t('nøglen står aldrig i en fejltekst', !/test:test|dGVzdDp0ZXN0/.test(JSON.stringify(r.log)));
netNede = false;
fs.writeFileSync(fil, '{ ødelagt');
r = await hentTal(['how does a vpn work'], { nu, fil });
t('ødelagt hukommelsesfil: læses som tom, robotten kører videre', r.log.fraHusk === 0 && r.log.kald === 1);

fs.rmSync(fil, { force: true });
console.log(fejl ? `\n${fejl} FEJL` : '\nalt OK');
process.exit(fejl ? 1 : 0);
