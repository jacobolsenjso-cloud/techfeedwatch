// Skærmbilleder i rigtig mobil- og desktopbredde.
//
// Baggrund: `chrome --headless --screenshot --window-size=390,1200` virker IKKE.
// Chrome lægger siden ud i sin standardbredde og beskærer bagefter billedet, så
// mobilbilledet ser ødelagt ud selv når siden er i orden. Det narrede os én gang.
// Her sættes bredden i stedet via DevTools-protokollen (setDeviceMetricsOverride),
// som er den samme mekanisme Chromes egen enhedsvisning bruger.
//
// Brug: node shot.mjs /trends /tools
// Kræver at `npm run preview` kører. Billeder havner i _shots/.

import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:4321';
// IKKE 9222: den port er ofte optaget af andre programmer med indbygget browser
// (Lenovo Vantage gør det). Rammer man deres target, fotograferer man deres vindue
// i stedet for sitet — og billedet ser bare "forkert" ud uden at forklare hvorfor.
const PORT = 9333;
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, scale: 1, mobile: false },
  { name: 'mobile', width: 390, height: 844, scale: 2, mobile: true },
];

// --height=N sætter vindueshøjden. Sitet ruller i en indre beholder, ikke i
// dokumentet, så hverken window.scrollTo eller et fuldsides-billede kan vise
// noget under folden. Et højt vindue kan. Bredden styrer stadig media queries.
const heightArg = process.argv.slice(2).find((a) => a.startsWith('--height='));
const heightOverride = heightArg ? Number(heightArg.split('=')[1]) : 0;
const paths = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!paths.length) { console.error('Angiv mindst én sti, fx: node shot.mjs /trends'); process.exit(1); }
fs.mkdirSync('_shots', { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (p) => (p.replace(/^\//, '').replace(/\//g, '-') || 'home');

// Én Chrome i baggrunden, som vi styrer over DevTools-protokollen.
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + process.cwd() + '\\_shots\\.chrome',
  'about:blank',
], { stdio: 'ignore' });

// Lille CDP-klient. Node har WebSocket indbygget, så ingen ekstra pakker.
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let id = 0;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({
      send: (method, params = {}) => new Promise((res) => {
        const myId = ++id;
        pending.set(myId, res);
        ws.send(JSON.stringify({ id: myId, method, params }));
      }),
      close: () => ws.close(),
    });
  });
}

// Vent til Chrome svarer på debug-porten. Vi accepterer KUN vores egen about:blank —
// ellers risikerer vi at fotografere et fremmed program der lytter på samme port.
let target = null;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === 'page' && /^(about:blank|http:\/\/localhost:4321)/.test(t.url));
  } catch { /* ikke oppe endnu */ }
}
if (!target) { chrome.kill(); throw new Error('Chrome svarede ikke på debug-porten'); }

const cdp = await connect(target.webSocketDebuggerUrl);
await cdp.send('Page.enable');

for (const p of paths) {
  for (const v of VIEWPORTS) {
    const height = heightOverride || v.height;
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: v.width, height, deviceScaleFactor: v.scale, mobile: v.mobile,
    });
    await cdp.send('Page.navigate', { url: BASE + p });
    await sleep(1800); // nok til at CSS og skrifttyper er på plads
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const suffix = heightOverride ? `-${v.name}-h${heightOverride}` : `-${v.name}`;
    const file = `_shots/${slug(p)}${suffix}.png`;
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`${file}  ${v.width}x${height}`);
  }
}

cdp.close();
chrome.kill();
