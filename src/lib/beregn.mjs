// Regnelogik til de nye værktøjer (16/10-2026, Jacob: "alle de værktøjer skal bygges").
// Alt er rene funktioner uden browser-kode, så de kan selvtestes (test-beregn.mjs) og bruges
// ens af siderne. Ingen tal her ændrer sig med tiden - priser og grænser står på siderne med kilde.

const tal = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

// 1) DCA: køb for samme beløb hver måned til månedens slutkurs.
// raekker = [["2020-01", 9350], ...] (stigende). Sammenlignes med at købe for hele beløbet første måned.
export function dca(raekker, beloebPrMd, fraMd, gebyrPct = 0) {
  const b = tal(beloebPrMd), g = tal(gebyrPct) / 100;
  const rk = (raekker || []).filter(([m]) => m >= fraMd);
  if (!rk.length || b <= 0) return null;
  let coins = 0;
  for (const [, kurs] of rk) coins += (b * (1 - g)) / kurs;
  const sidste = rk.at(-1)[1];
  const investeret = b * rk.length;
  const vaerdi = coins * sidste;
  const engang = ((investeret * (1 - g)) / rk[0][1]) * sidste;
  return { maaneder: rk.length, fra: rk[0][0], til: rk.at(-1)[0], investeret, coins, vaerdi, gevinst: vaerdi - investeret, afkastPct: ((vaerdi - investeret) / investeret) * 100, snitKurs: (investeret * (1 - g)) / coins, sidsteKurs: sidste, engangVaerdi: engang };
}

// 2) Krypto-gevinst efter FIFO (først købt = først solgt), med gebyrer. Skat = positiv gevinst x sats.
// handler = [{ type: 'buy'|'sell', antal, pris, gebyr }] i den rækkefølge de skete.
export function fifo(handler, skatPct = 0) {
  const lager = []; // { antal, prisPrStk } (gebyr på køb lægges i anskaffelsesprisen)
  let realiseret = 0, solgtIalt = 0, fejl = null;
  for (const h of handler || []) {
    const antal = tal(h.antal), pris = tal(h.pris), gebyr = tal(h.gebyr);
    if (antal <= 0 || pris < 0) continue;
    if (h.type === 'buy') { lager.push({ antal, prisPrStk: (antal * pris + gebyr) / antal }); continue; }
    let rest = antal, kostpris = 0;
    while (rest > 1e-12 && lager.length) {
      const l = lager[0], tag = Math.min(rest, l.antal);
      kostpris += tag * l.prisPrStk; l.antal -= tag; rest -= tag;
      if (l.antal <= 1e-12) lager.shift();
    }
    if (rest > 1e-12) { fejl = 'You sold more than you had bought.'; break; }
    realiseret += antal * pris - gebyr - kostpris; solgtIalt += antal;
  }
  const beholdning = lager.reduce((s, l) => s + l.antal, 0);
  const kostBeholdning = lager.reduce((s, l) => s + l.antal * l.prisPrStk, 0);
  return { realiseret, skat: Math.max(0, realiseret) * (tal(skatPct) / 100), solgtIalt, beholdning, kostBeholdning, fejl };
}

// 3) Hvad koster handelsgebyrer og spread om året? (spread = forskel mellem købs- og salgskurs)
export function gebyrer({ beloeb, handlerPrMd, gebyrPct, spreadPct = 0 }) {
  const prHandel = tal(beloeb) * ((tal(gebyrPct) + tal(spreadPct) / 2) / 100);
  return { prHandel, prAar: prHandel * tal(handlerPrMd) * 12 };
}

// 4) AI: abonnement eller API? Tokens anslås som ord x 1,33 (engelsk tekst, typisk tommelfingerregel).
export const ORD_TIL_TOKENS = 1.33;
export function aiPris({ beskederPrDag, ordInd, ordUd, prisInd, prisUd, abonnement }) {
  const dage = 30;
  const tokInd = tal(beskederPrDag) * tal(ordInd) * ORD_TIL_TOKENS * dage;
  const tokUd = tal(beskederPrDag) * tal(ordUd) * ORD_TIL_TOKENS * dage;
  const api = (tokInd / 1e6) * tal(prisInd) + (tokUd / 1e6) * tal(prisUd);
  const prBesked = tal(beskederPrDag) > 0 ? api / (tal(beskederPrDag) * dage) : 0;
  return { tokInd, tokUd, api, abonnement: tal(abonnement), billigst: api <= tal(abonnement) ? 'api' : 'abonnement', breakEvenBeskederPrDag: prBesked > 0 ? tal(abonnement) / (prBesked * dage) : null };
}

// 5) Kan min computer køre en AI-model lokalt? Vægte = milliarder parametre x bits/8 GB,
// plus ca. 20 % til kontekst og drift (tommelfingerregel, ikke en garanti).
export function lokalAI({ paramsMia, bits, vramGB, ramGB }) {
  const vaegte = tal(paramsMia) * (tal(bits) / 8);
  const brug = vaegte * 1.2;
  const v = tal(vramGB), r = tal(ramGB);
  const dom = brug <= v ? 'gpu' : brug <= v + r * 0.75 ? 'delt' : 'nej';
  return { vaegteGB: vaegte, brugGB: brug, dom };
}

// 6) GPU-temperatur vs. hotspot. Grænser fra kilder (se siden): typisk forskel 12-20 °C under last
// (Tom's Hardware 2026), over 25-30 °C tyder på dårlig kontakt (samme kilde). Hotspot-loft:
// Nvidia 107 °C (Igor's Lab/TechPowerUp 2026), AMD 110 °C "within spec" (AMD 2019).
export const HOTSPOT_LOFT = { nvidia: 107, amd: 110 };
export function gpuTjek({ gpu, hotspot, maerke }) {
  const g = tal(gpu), h = tal(hotspot);
  const delta = h - g;
  const loft = HOTSPOT_LOFT[maerke] || null;
  const dDom = delta < 0 ? 'ulogisk' : delta <= 20 ? 'normal' : delta <= 25 ? 'hoej' : 'problem';
  const lDom = loft == null ? null : h >= loft ? 'ved-loft' : h >= loft - 7 ? 'taet-paa' : 'ok';
  return { delta, dDom, loft, lDom };
}

// 7) Lån: fast ydelse pr. måned (annuitet).
export function laan({ hovedstol, rentePct, aar }) {
  const L = tal(hovedstol), n = Math.round(tal(aar) * 12), r = tal(rentePct) / 100 / 12;
  if (L <= 0 || n <= 0) return null;
  const ydelse = r === 0 ? L / n : (L * r) / (1 - Math.pow(1 + r, -n));
  return { ydelse, total: ydelse * n, renter: ydelse * n - L, maaneder: n };
}

// 8) Inflation: hvad koster det samme om N år, og hvad er beløbet værd i dagens penge?
export function inflation({ beloeb, inflationPct, aar }) {
  const f = Math.pow(1 + tal(inflationPct) / 100, tal(aar));
  return { fremtidigPris: tal(beloeb) * f, koebekraft: tal(beloeb) / f, faldPct: (1 - 1 / f) * 100 };
}

// ---- Hold 2 og 3 (16/10-2026 aften) ----

// 9) Videofilens størrelse: (video Mbit/s + lyd kbit/s) x sekunder / 8 -> megabyte (1 MB = 1.000.000 byte,
// som disk- og kameraproducenter regner).
export function videoStoerrelse({ videoMbps, lydKbps = 0, minutter }) {
  const mbitPrSek = tal(videoMbps) + tal(lydKbps) / 1000;
  const mb = (mbitPrSek * tal(minutter) * 60) / 8;
  return { mb, gb: mb / 1000, mbPrMinut: (mbitPrSek * 60) / 8 };
}

// 10) Upload/download-tid: størrelse i MB (decimal) / hastighed i Mbit/s, ganget med en
// virkelighedsfaktor (en forbindelse når sjældent sin fulde hastighed).
export function overfoerselsTid({ mb, mbps, effektivitetPct = 100 }) {
  const fart = tal(mbps) * (tal(effektivitetPct) / 100);
  if (fart <= 0) return null;
  return { sekunder: (tal(mb) * 8) / fart };
}
export function tidTekst(sek) {
  if (sek == null || !Number.isFinite(sek)) return '-';
  if (sek < 60) return `${Math.max(1, Math.round(sek))} s`;
  const t = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), s = Math.round(sek % 60);
  return t ? `${t} h ${m} min` : `${m} min ${s} s`;
}

// 11) Strømforbrug: watt x timer pr. dag x dage / 1000 = kWh; x pris pr. kWh.
export function stroem({ watt, timerPrDag, prisPrKwh, dage = 365 }) {
  const kwh = (tal(watt) * tal(timerPrDag) * tal(dage)) / 1000;
  return { kwh, pris: kwh * tal(prisPrKwh), prisPrMd: (kwh * tal(prisPrKwh)) / 12 };
}

// 12) Lagerplads: hvor mange filer af en given størrelse kan være på en disk?
// Diskproducenter regner 1 GB = 1.000 MB; Windows viser binære enheder (1 TB vises som ca. 931 GB).
export function lagerplads({ diskGB, filMB, reservePct = 0 }) {
  const brugbar = tal(diskGB) * 1000 * (1 - tal(reservePct) / 100);
  return { antal: tal(filMB) > 0 ? Math.floor(brugbar / tal(filMB)) : 0, windowsGB: (tal(diskGB) * 1e9) / 2 ** 30 };
}

// 13) Kvante: n qubits beskriver 2^n tilstande på én gang. Søgning i N muligheder: en almindelig
// computer skal i snit prøve N/2, Grovers algoritme cirka (pi/4) x kvadratroden af N.
export function kvante({ qubits, muligheder }) {
  const n = Math.max(0, Math.floor(tal(qubits))), N = Math.max(1, tal(muligheder));
  return { tilstande: Math.pow(2, n), klassisk: N / 2, grover: (Math.PI / 4) * Math.sqrt(N), faktor: (N / 2) / ((Math.PI / 4) * Math.sqrt(N)) };
}
