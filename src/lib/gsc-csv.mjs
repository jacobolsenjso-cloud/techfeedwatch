// Læser Search Console-eksport (24/10-2026) til Quick Wins, Forecaster og Topic Map.
// Kører i browseren og i node (test). Tåler:
//  - ZIP-filen direkte fra "Eksportér -> Download CSV" (pakkes ud med browserens
//    egen DecompressionStream - intet bibliotek),
//  - engelske OG danske kolonnenavne (Jacobs Search Console er på dansk),
//  - komma eller semikolon som skilletegn (Excel på dansk gemmer med semikolon),
//  - decimalkomma ("3,45 %", "4,5") og tusindtalsskilletegn.
// Kolonnerne læses efter plads, ikke navn: GSC skriver altid
// [nøgle, klik, visninger, CTR, placering].

export function parseCsv(tekst) {
  const t = String(tekst || '').replace(/^﻿/, '');
  const foersteLinje = t.split(/\r?\n/, 1)[0] || '';
  const skil = (foersteLinje.match(/;/g) || []).length > (foersteLinje.match(/,/g) || []).length ? ';' : ',';
  const raekker = [];
  let felt = '', raekke = [], iCitat = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (iCitat) {
      if (c === '"' && t[i + 1] === '"') { felt += '"'; i++; }
      else if (c === '"') iCitat = false;
      else felt += c;
    } else if (c === '"') iCitat = true;
    else if (c === skil) { raekke.push(felt); felt = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      raekke.push(felt); felt = '';
      if (raekke.some((x) => x !== '')) raekker.push(raekke);
      raekke = [];
    } else felt += c;
  }
  raekke.push(felt);
  if (raekke.some((x) => x !== '')) raekker.push(raekke);
  return raekker;
}

const heltal = (v) => Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0;
const decimal = (v) => {
  const s = String(v ?? '').replace(/[%\s ]/g, '');
  if (!s) return 0;
  const sidsteKomma = s.lastIndexOf(','), sidstePunktum = s.lastIndexOf('.');
  const norm = sidsteKomma > sidstePunktum ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  return Number(norm) || 0;
};

// Gør rækker til objekter og gætter filtypen ud fra indholdet i første kolonne.
export function tolkGsc(raekker) {
  if (!raekker.length) return { type: 'empty', data: [], fejl: 'The file is empty.' };
  const [hoved, ...krop] = raekker;
  if (hoved.length < 5) return { type: 'unknown', data: [], fejl: `Expected 5 columns (key, clicks, impressions, CTR, position) but found ${hoved.length}. Use Queries.csv, Pages.csv or Dates.csv from a Search Console export.` };
  const data = krop.filter((r) => r.length >= 5 && r[0] !== '').map((r) => ({
    noegle: r[0].trim(), klik: heltal(r[1]), visninger: heltal(r[2]), ctr: decimal(r[3]) / 100, placering: decimal(r[4]),
  }));
  const prøve = data.slice(0, 20).map((d) => d.noegle);
  let type = 'queries';
  if (prøve.length && prøve.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))) type = 'dates';
  else if (prøve.length && prøve.every((k) => /^https?:\/\//.test(k))) type = 'pages';
  else if (/countr|land/i.test(hoved[0]) || /devic|enhed/i.test(hoved[0])) type = 'other';
  return { type, data, hoved: hoved[0], fejl: null };
}

// Minimal ZIP-læser: finder CSV-filerne i en GSC-eksport og pakker dem ud.
export async function laesZip(buffer) {
  const v = new DataView(buffer);
  let eocd = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not a valid ZIP file.');
  const antal = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const filer = {};
  const dec = new TextDecoder('utf-8');
  for (let n = 0; n < antal; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const metode = v.getUint16(p + 10, true);
    const kompStr = v.getUint32(p + 20, true);
    const navnLen = v.getUint16(p + 28, true), ekstraLen = v.getUint16(p + 30, true), kommLen = v.getUint16(p + 32, true);
    const lokal = v.getUint32(p + 42, true);
    const navn = dec.decode(new Uint8Array(buffer, p + 46, navnLen));
    p += 46 + navnLen + ekstraLen + kommLen;
    if (!/\.csv$/i.test(navn)) continue;
    const lNavn = v.getUint16(lokal + 26, true), lEkstra = v.getUint16(lokal + 28, true);
    const data = new Uint8Array(buffer, lokal + 30 + lNavn + lEkstra, kompStr);
    let raa;
    if (metode === 0) raa = data;
    else if (metode === 8) raa = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else continue;
    filer[navn.split('/').pop()] = dec.decode(raa);
  }
  return filer;
}

// Læser en uploadet fil (CSV eller ZIP) og returnerer den ønskede type.
// Navne i GSC-ZIP'en: engelsk Queries.csv/Pages.csv/Dates.csv, dansk Forespørgsler.csv/Sider.csv/Datoer.csv.
export async function laesFil(fil, oensket) {
  const buf = await fil.arrayBuffer();
  const erZip = new Uint8Array(buf.slice(0, 2))[0] === 0x50 && new Uint8Array(buf.slice(0, 2))[1] === 0x4b;
  const kandidater = erZip ? Object.values(await laesZip(buf)) : [new TextDecoder('utf-8').decode(buf)];
  const tolkede = kandidater.map((tekst) => tolkGsc(parseCsv(tekst)));
  const fundet = tolkede.find((x) => x.type === oensket);
  if (fundet) return fundet;
  const typer = { queries: 'Queries.csv (Forespørgsler)', pages: 'Pages.csv (Sider)', dates: 'Dates.csv (Datoer)' };
  const set = tolkede.map((x) => x.type).filter((x) => x !== 'other');
  const enkeltFejl = !erZip && tolkede[0]?.fejl;
  return { type: 'mismatch', data: [], fejl: enkeltFejl || `This file does not contain ${typer[oensket]}${set.length ? ` - it looks like ${set.map((s) => typer[s] || s).join(', ')}` : ''}. Upload the ZIP from Search Console, or the right CSV.` };
}
