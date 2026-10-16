// Henter månedlige slutkurser (USD) for BTC, ETH og SOL fra Binances offentlige markedsdata
// (ingen nøgle) til DCA-beregneren. Kør: node hent-kurser.mjs -> src/data/kurser.json
// Indført 16/10-2026. Kurserne er et øjebliksbillede; datoen "hentet" vises på siden.
// Den igangværende måned tages IKKE med (dens "slutkurs" er bare dagens kurs).
import fs from 'node:fs';
const MOENTER = { BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT' };
const ud = { hentet: new Date().toISOString().slice(0, 10), kilde: 'Binance spot market data (monthly closes, USDT pairs)', moenter: {} };
const nu = new Date().toISOString().slice(0, 7);
for (const [navn, par] of Object.entries(MOENTER)) {
  let r;
  for (let i = 0; i < 3; i++) {
    r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${par}&interval=1M&limit=1000`, { headers: { 'user-agent': 'TechFeedWatch/1.0 (+https://techfeedwatch.com)' } });
    if (r.ok) break;
    await new Promise((s) => setTimeout(s, 5000));
  }
  if (!r.ok) throw new Error(`${par}: ${r.status}`);
  const rows = await r.json();
  ud.moenter[navn] = rows.map((k) => [new Date(k[0]).toISOString().slice(0, 7), Number(Number(k[4]).toPrecision(6))]).filter(([m]) => m < nu);
  console.log(`${navn}: ${ud.moenter[navn].length} måneder (${ud.moenter[navn][0][0]} .. ${ud.moenter[navn].at(-1)[0]})`);
}
fs.writeFileSync('src/data/kurser.json', JSON.stringify(ud));
console.log('skrevet src/data/kurser.json');
