// Giver interne links den afsluttende skråstreg, som sidens rigtige adresser har.
//
// Baggrund (målt 23/9 på det levende site): 31.303 af 33.343 interne links
// pegede på fx /video/slug i stedet for /video/slug/. Cloudflare svarer med en
// 308-omdirigering, så hvert klik og hver Googlebot-tur kostede en ekstra
// rundtur, og Google så links til adresser, der ikke er sidens kanoniske.
//
// Hvorfor efter buildet og ikke i skabelonerne: linkene kommer fra ~40 filer,
// fra glossar-pluginnet OG fra artiklernes egen tekst, som robotten skriver.
// Her rettes de ét sted, også dem robotten skriver i morgen.
//
// Reglen er snæver: kun <a href="/sti"> (og sitets egne adresser i JSON-LD)
// uden skråstreg, og KUN hvis
// dist/sti/index.html findes. Filer (/rss.xml), omdirigeringer og ukendte
// adresser røres ikke. Fejler noget, afsluttes med 0 — et link med en
// omvej er bedre end et site, der ikke bliver lagt ud.
//
// Kører automatisk som en del af `npm run build`.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

function htmlFiler(dir) {
  const ud = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) ud.push(...htmlFiler(p));
    else if (e.name.endsWith('.html')) ud.push(p);
  }
  return ud;
}

try {
  const findes = new Map();
  const erSide = (sti) => {
    if (!findes.has(sti)) findes.set(sti, fs.existsSync(path.join(DIST, sti, 'index.html')));
    return findes.get(sti);
  };

  // <a ... href="/sti"> — stien uden skråstreg til sidst og uden punktum i
  // sidste led (så /rss.xml og /icon.png aldrig rammes). ?query og #anker bevares.
  const RE = /(<a\s[^>]*?href=")(\/[^"?#]*[^"?#/])([?#][^"]*)?"/g;

  let filerRettet = 0;
  let linksRettet = 0;
  for (const fil of htmlFiler(DIST)) {
    const før = fs.readFileSync(fil, 'utf8');
    let n = 0;
    let efter = før.replace(RE, (hel, start, sti, rest = '') => {
      const sidste = sti.split('/').pop();
      if (sidste.includes('.') || !erSide(sti)) return hel;
      n++;
      return `${start}${sti}/${rest}"`;
    });
    // Samme regel for sitets egne adresser i JSON-LD (schema): Google følger
    // også dem. Kun inde i ld+json-blokke, og kun når siden findes.
    efter = efter.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (hel, a, json, b) =>
      a + json.replace(/"https:\/\/techfeedwatch\.com(\/[^"?#]*[^"?#/])"/g, (h, sti) => {
        if (sti.split('/').pop().includes('.') || !erSide(sti)) return h;
        n++;
        return `"https://techfeedwatch.com${sti}/"`;
      }) + b);
    if (n) {
      fs.writeFileSync(fil, efter, 'utf8');
      filerRettet++;
      linksRettet += n;
    }
  }
  console.log(`slash-links: ${linksRettet} links fik skråstreg i ${filerRettet} sider`);
} catch (e) {
  console.log(`slash-links: sprang over (${e.message}) — sitet bygges alligevel`);
}
process.exit(0);
