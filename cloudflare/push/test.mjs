// Selvtest af push-logikken (17/10). Kør: node cloudflare/push/test.mjs - intet net, ingen rigtige nøgler.
import { gyldigtEndpoint, rensEmner, endpointId, nyeArtikler, valgtArtikel, beskedFor, vapidToken, metadataPasser, usDag } from './logik.mjs';
let fejl = 0, n = 0;
const t = (navn, ok) => { n++; console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}`); if (!ok) fejl++; };

t('Chrome-adresse godkendt', gyldigtEndpoint('https://fcm.googleapis.com/fcm/send/abc'));
t('Apple-adresse godkendt', gyldigtEndpoint('https://web.push.apple.com/QW1x'));
t('Firefox-adresse godkendt', gyldigtEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x'));
t('fremmed adresse afvist', !gyldigtEndpoint('https://evil.example.com/x'));
t('http afvist', !gyldigtEndpoint('http://fcm.googleapis.com/x'));
t('snydenavn afvist (fcm.googleapis.com.evil.com)', !gyldigtEndpoint('https://fcm.googleapis.com.evil.com/x'));
t('emner renses (dubletter, ikke-tekst, for lange)', JSON.stringify(rensEmner(['Crypto', 'Crypto', 5, 'x'.repeat(41), 'SEO'])) === '["Crypto","SEO"]');
t('emner: ikke en liste -> tom', rensEmner('Crypto').length === 0);

const id = await endpointId('https://fcm.googleapis.com/fcm/send/abc');
t('id er 64 hex-tegn', /^[0-9a-f]{64}$/.test(id));
t('samme adresse -> samme id', id === await endpointId('https://fcm.googleapis.com/fcm/send/abc'));

const nu = new Date('2026-10-17T16:37:00Z');
const alle = [
  { slug: 'a', title: 'A', date: '2026-10-17', tags: ['Coding'], minutesRead: 5 },
  { slug: 'b', title: 'B', date: '2026-10-16', tags: ['Robotics', 'AI & Tech'] },
  { slug: 'c', title: 'C', date: '2026-10-15', tags: ['Crypto'] },
  { slug: 's', title: 'S', date: '2026-10-17', tags: ['Crypto'], isShort: true },
];
const nye = nyeArtikler(alle, nu);
t('kun i dag og i går, uden Shorts', nye.map((a) => a.slug).join() === 'a,b');
t('følger intet -> nyeste', valgtArtikel(nye, [])?.slug === 'a');
t('følger Robotics -> b (andet mærke tæller)', valgtArtikel(nye, ['Robotics'])?.slug === 'b');
t('følger Crypto -> ingen (c er 2 dage gammel)', valgtArtikel(nye, ['Crypto']) === null);
t('samme dato: fast rækkefølge uanset listens orden', nyeArtikler([{ slug: 'z', date: '2026-10-17' }, { slug: 'm', date: '2026-10-17' }], nu).map((a) => a.slug).join() === 'm,z' && nyeArtikler([{ slug: 'm', date: '2026-10-17' }, { slug: 'z', date: '2026-10-17' }], nu).map((a) => a.slug).join() === 'm,z');
// Review 17/10: gårsdagens artikler sendes ikke igen
const iMorgen = new Date('2026-10-18T16:37:00Z');
t('dagen efter: a er "i går" men var med i går -> ikke igen', nyeArtikler(alle, iMorgen, ['a', 'b']).length === 0);
t('dagen efter: uden gårsdagens liste ville a komme igen (det var fejlen)', nyeArtikler(alle, iMorgen).map((a) => a.slug).join() === 'a');
// 13/11-2026: udsendelsen kører 23:17-00:37 UTC (amerikansk aften) og krydser UTC-midnat - det må aldrig give to beskeder
const foerMidnat = new Date('2026-11-13T23:17:00Z'), efterMidnat = new Date('2026-11-14T00:37:00Z');
t('samme udsendelse før og efter UTC-midnat = samme dag (samme vagt-nøgle)', usDag(foerMidnat) === '2026-11-13' && usDag(efterMidnat) === '2026-11-13');
t('"i går" efter UTC-midnat er stadig 12/11', usDag(efterMidnat, 1) === '2026-11-12');
t('sommertid: 23:17 UTC 15/7 er stadig 15/7 i New York', usDag(new Date('2026-07-15T23:17:00Z')) === '2026-07-15' && usDag(new Date('2026-07-16T00:37:00Z')) === '2026-07-15');
const midnatListe = [{ slug: 'x', date: '2026-11-13' }, { slug: 'y', date: '2026-11-12' }];
t('samme artikler før og efter UTC-midnat', nyeArtikler(midnatListe, foerMidnat).map((a) => a.slug).join() === nyeArtikler(midnatListe, efterMidnat).map((a) => a.slug).join());
// En artikel udgivet 00:30 UTC 14/11 (= 19:30 i New York 13/11) har datoen 14/11 - den kommer med næste aften
t('artikel med UTC-dato "i morgen" kommer med næste aften', nyeArtikler([{ slug: 'n', date: '2026-11-14' }], new Date('2026-11-14T23:17:00Z')).length === 1);
t('metadata: almindelig tilmelding passer', metadataPasser({ e: 'https://fcm.googleapis.com/fcm/send/' + 'x'.repeat(160), t: ['AI & Tech', 'Crypto'] }));
t('metadata: for stor afvises', !metadataPasser({ e: 'https://fcm.googleapis.com/' + 'x'.repeat(580), t: Array.from({ length: 18 }, (_, i) => 'Emne nummer ' + i + ' xxxxxxxx') }));
const bes = beskedFor(alle[0], []);
t('besked: titel, tekst og adresse', bes.title === 'A' && bes.body === 'New in Coding · 5 min read' && bes.url === '/video/a/');
t('besked: fulgt emne vises', beskedFor(alle[1], ['Robotics']).body === 'New in Robotics');

// VAPID: lav en prøvenøgle her (kun til testen) og verificér signaturen med den offentlige del.
const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', par.privateKey);
const tok = await vapidToken(jwk, 'https://fcm.googleapis.com', 'https://techfeedwatch.com', Date.parse('2026-10-17T16:37:00Z'));
const [h, p, s] = tok.split('.');
const fra = (x) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const krav = JSON.parse(new TextDecoder().decode(fra(p)));
t('token: aud og sub', krav.aud === 'https://fcm.googleapis.com' && krav.sub === 'https://techfeedwatch.com');
t('token: udløber om 12 timer', krav.exp === Date.parse('2026-10-17T16:37:00Z') / 1000 + 12 * 3600);
t('token: signatur er 64 bytes (r||s)', fra(s).length === 64);
t('token: signaturen holder', await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, par.publicKey, fra(s), new TextEncoder().encode(`${h}.${p}`)));

console.log(fejl ? `${fejl} FEJL` : `Alle OK (${n} test)`); process.exit(fejl ? 1 : 0);
