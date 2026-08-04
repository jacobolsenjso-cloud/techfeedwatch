# techfeedwatch.com — teknisk status

Sidst opdateret: 4. august 2026 · Commit `a241b86`

Dette dokument er en overdragelse. Det beskriver hvad siden er, hvordan den er
bygget, hvad der er rettet, og hvad der stadig mangler. Læs det først i en ny
session — så behøver vi ikke grave det hele frem igen.

---

## 1. Projektet på 30 sekunder

techfeedwatch.com er et statisk site der omsætter YouTube-videoer om AI, tech,
fintech og krypto til læsbare artikler. En robot finder videoerne, Gemini
skriver analysen, og hver artikel krediterer den oprindelige kanal og linker til
kilden.

**Ejer:** Jacob (ikke udvikler — forklar hvorfor, ikke kun hvad).
**Mål:** AdSense-godkendelse (afvist 3 gange), organisk trafik, et site der
virker sammenhængende og professionelt.
**Sprog:** Sitet er på engelsk. Al kommunikation med Jacob foregår på dansk.
Kodekommentarer skrives på dansk.

### Nøgletal

| | |
|---|---|
| Artikler | 367 |
| Guides | 9 |
| Glossar-opslag | 28 |
| Værktøjer | 27 |
| Sider i alt (byggede) | 513 |
| Redirects | 676 |

---

## 2. Teknisk stak

- **Astro 6.4.6**, statisk build (`npm run build` → `dist/`)
- **Cloudflare Pages** hoster. Push til `main` udløser deploy.
- **GitHub Actions** kører robotten
- **Gemini API** (`gemini-2.5-flash`) skriver artiklerne
- Indhold ligger som markdown i `src/content/videos/`, `guides/`, `glossary/`

### Vigtige filer

| Fil | Rolle |
|---|---|
| `auto-youtube.mjs` | Robottens indgang: finder kandidater, styrer loft og rotation |
| `add-video.mjs` | Henter metadata, kalder Gemini, skriver markdown-filen |
| `src/lib/tools.ts` | Eneste sandhed om de 27 værktøjer og deres 5 kategorier |
| `src/lib/tags.ts` | `tagSlug()` — ét sted, så tag-URL'er ikke kommer ud af sync |
| `src/layouts/MainLayout.astro` | Nav, head, samtykke, brødkrumme-schema |
| `src/pages/video/[slug].astro` | Artikelsiden (~1350 linjer) |
| `src/pages/video-sitemap.xml.ts` | Video-sitemap (sitemap-integrationen kan ikke video-udvidelser) |
| `astro.config.mjs` | Sitemap-filter, glossar-autolinks, læsetid |
| `public/_redirects` | 676 regler |
| `public/sw.js` | Service worker, `tfw-v2` |

### Byg og test

```
npm run build      # → dist/, ca. 20-50 sek
npm run preview    # → http://localhost:4321
node audit-tools-nav.mjs   # verificerer værktøjsstrukturen mod dist/
```

Der ligger en række `audit-*.mjs` i roden fra tidligere gennemgange
(sider, værktøjer, links, feed, videoschema). De læser `dist/` og kræver
altså et build først.

---

## 3. Robotten

`.github/workflows/daily-update.yml` kører `0 */2 * * *` — hver 2. time, 12
gange i døgnet. De fleste kørsler bruges på at opdage kandidater og stopper før
de bruger API-kvote.

**Nuværende indstillinger:**

```js
MAX_NORMAL_PER_RUN = 1   // højst én artikel pr. kørsel
MAX_PER_DAY        = 4   // dagsloft
FRESHNESS_DAYS     = 180 // kun videoer nyere end dette
MIN_DURATION_SECONDS = 180  // i add-video.mjs: ingen Shorts
```

`countPublishedToday()` tjekkes før noget API-kald, så en kørsel der rammer
loftet koster ingenting.

**Hvorfor 1 pr. kørsel:** med 3 pr. kørsel og et lavt dagsloft landede hele
dagens output i de første par kørsler — og dermed fra den ene eller to kanaler
og emneklynger, som netop de kørsler ramte. Med 1 pr. kørsel fordeles dagen over
fire forskellige tidspunkter, kanaler og klynger.

**Rotation:** 8 kanaler (`CHANNELS`), der roteres på klokkeslæt
(`Date.now() / 2 timer % 8`). 12 emneklynger (`TOPIC_CLUSTERS`) med en vægtet
rotationstabel på 20 pladser, der rammer høj-CPC-emner oftest: fintech, krypto,
SEO/automation, cybersikkerhed, cloud/SaaS, privatøkonomi, e-commerce, AI.

`prune-videos.yml` kører `0 4 */3 * *` og fjerner artikler hvis kildevideo er
slettet.

---

## 4. Faldgruber — læs denne inden du retter noget

Det her er ting der allerede er gået galt én gang.

**`public/_redirects`: statiske regler skal stå før dynamiske.** Cloudflare
Pages holder op med at læse ved den første splat-regel der matcher. En splat-regel
midt i filen dræbte i stilhed 205+ regler under den. `sort-redirects.mjs` sorterer
dem rigtigt. Grænser: 2.000 statiske, 100 dynamiske.

**Tjek indgående links før du sletter sider.** Da 205 tomme Shorts blev slettet,
pegede 589 interne links og 200 redirects pludselig på 404. Det blev ryddet op
med `fix-internal-links.mjs` og `fix-redirect-chains.mjs`, men det skulle have
været tjekket først.

**Mine egne målescripts har taget fejl flere gange end koden har.** Konkrete
eksempler: `&amp;` talt som 5 tegn gav 64 falske "for lange titler". `<h1>` inde
i JSON-LD talt som overskrift. `page.setOfflineMode()` påvirker ikke service
workeren, så alle offline-resultater var værdiløse. Et link-tjek der skannede
`<script>`-blokke meldte 29 døde links som alle var falske.
**Regel: når et script melder mange fejl på én gang, er scriptet mistænkt før koden er.**

**Astro: statiske ruter vinder over dynamiske.** `/tools/json-formatter` (egen
fil) rammer sin egen side, selvom `[category].astro` findes i samme mappe. Det er
det, der får værktøjs- og kategorisider til at kunne dele mappe.

**`_headers` kan ikke overskrive `Cache-Control` på statiske filer** i Cloudflare
Pages. Brug versionerede filnavne i stedet.

**Service worker: et omdirigeret svar kan ikke returneres til en navigation.**
`storeClean()` i `sw.js` bygger svaret om for at rydde `redirected`-flaget.

**Samtykke: Funding Choices (Google LLC, cmpId 300) er allerede aktiv.** Byg ikke
et banner mere — det gav to dialoger oven på hinanden sidst.

---

## 5. Hvad der er rettet

### Troværdighed og AdSense-risiko

- **Opdigtede like-tal fjernet.** Artiklerne viste 500-4500 likes udregnet af en
  hash af titlen. Like-knappen er nu en lokal "Helpful / Not helpful" uden tal.
- **VideoObject-schema påstod at Jacob havde lavet videoerne.** Nu står
  kildekanalen som `creator` og `publisher`, og `isBasedOn` peger på originalen.
- **Kildeangivelse er gjort synlig** på alle kort og artikler (`SourceLine.astro`):
  YouTube-ikon, kanalnavn, dato.
- **205 tomme Shorts-sider slettet** (686 → 486 sider). Robotten afviser nu alt
  under 3 minutter.
- **`http://localhost:3000/...` lå live i en artikel.** Rettet, og
  `sanitizeLinks()` i `add-video.mjs` forhindrer det fremover.

### Teknisk SEO

- Tag-URL'er: `/tag/ai-&-tech` → `/tag/ai-tech`, med redirects fra de gamle
- 153 for lange titler forkortet; brandsuffiks tilføjes kun hvis der er plads (60 tegn)
- Video-sitemap med 339+ poster (thumbnail, varighed, uploader)
- Kategorisider under `/tools` med ItemList-schema
- Brødkrumme-schema på `/tools/*` sagde "Tools/json formatter" — rettet
- HSTS slået til; `pages.dev` omdirigerer til hoveddomænet via Bulk Redirects

### Design og brugsting

- Forsiden: hero med "Skip the video. Keep the insight." + kildeangivelse
- Lead-sektion med hovedartikel og fire sekundære
- Watch Later: nyeste øverst (`unshift` + sortering på `savedAt`)
- Favicon og delebilleder skiftet til det nye logo; de gamle slettet
- PWA: manifest, maskable ikon, screenshots, genveje

### Værktøjerne (seneste arbejde, commit `a241b86`)

De 27 værktøjer er det eneste på sitet der ikke er afledt af andres videoer. De
lå bag ét menupunkt. Nu:

- `src/lib/tools.ts` er eneste sandhed — værktøj, kategori, kort navn, beskrivelse
- Fem kategorisider: `/tools/seo` (9), `/tools/content` (4),
  `/tools/developer` (6), `/tools/media` (5), `/tools/finance` (3)
- `/tools` er grupperet i sektioner med genvejsrække
- Værktøjsstribe på forsiden under første række artikler: 6 udvalgte + link til alle 27

**Verificeret:** alle 27 nås fra både oversigt og kategoriside, 0 døde interne
links, 0 konsolfejl, alle 5 kategorisider i sitemap, ItemList-schema validt,
tag-filteret på forsiden skjuler og viser striben korrekt, mobil og desktop
tjekket med skærmbilleder.

---

## 6. Hvad der stadig mangler

### Kode / mit ansvar

| Opgave | Status |
|---|---|
| **Trend-analyse fra sitets egne data** | Aftalt, ikke påbegyndt. Første skridt er at se om der er nok data til en historie, eller om vi skal vente et par måneder. |
| **Et originalt lag oven på artiklerne** | Konceptets svageste punkt. Se afsnit 7. |
| **Offline-oplevelsen (PWA)** | Aldrig bevist ende-til-ende. Kræver en rigtig telefon i flytilstand — mine værktøjer kan ikke teste det. |

### Jacobs ansvar (uden for koden)

- Slet 4 døde sitemap-indsendelser i Search Console
- Klik "VALIDÉR RETTELSE" på Videos-problemerne i Search Console
- Genindsend AdSense-ansøgningen
- Gen-scrape delecachen hos Facebook og LinkedIn, så det nye logo vises
- Overvej Bot Fight Mode i Cloudflare, hvis Google melder crawl-fejl

---

## 7. Den åbne strategiske diskussion

Udførelsen er god. Konceptet er skrøbeligt — og det er værd at være ærlig om,
fordi det er dét AdSense og Google reelt vurderer.

**Problemet:** et referat af en video, skrevet af en maskine, tilføjer i sig selv
ikke noget verden ikke havde i forvejen. Ingen linker til det, og Google har
ingen grund til at rangere det over kilden.

**Det er ikke fatalt.** Idéen — "lange videoer bliver til læsbar analyse" — er
fin. Det der mangler er et lag hvor et menneske eller sitets egne data bidrager
med noget originalt.

Fire retninger, i den rækkefølge de blev foreslået:

1. **Værktøjerne frem** — gennemført. De er sitets eneste originale aktiv og
   den eneste realistiske kilde til backlinks. Næste skridt er at bruge dem
   aktivt udadtil.
2. **Skær ned, ikke op** — gennemført. 4 om dagen i stedet for 8.
3. **Tilføj ét originalt lag** — udestående. Trend-analysen er det mest
   nærliggende: sitet har 367 artikler med kanal, emne og dato. Det er data
   ingen andre har.
4. **Gør robotten til assistent, ikke udgiver** — udestående. I dag udgiver den
   direkte. Alternativet er at den forbereder, og Jacob godkender.

Punkt 3 og 4 er ikke besluttet. Tag dem ikke som givet — spørg.

---

## 8. Sådan arbejder vi

- **Jacob er ikke udvikler.** Forklar hvorfor noget skal gøres, ikke kun hvad.
  Ingen jargon uden en linjes oversættelse.
- **Svar på dansk. Kommentér koden på dansk. Sitets indhold er engelsk.**
- **Kort.** Han beder om det, og han mener det.
- **"Kode ikke før jeg siger til" betyder præcis det.** Han bruger den formulering
  ofte, når han vil have en vurdering først. Vent.
- **Ret undervejs, rapportér til sidst** — det er hans udtrykte præference ved
  gennemgange.
- **Vis skærmbilleder ved designændringer**, mobil såvel som desktop.
- **Vær ærlig når noget ikke virker.** Han har flere gange fået mest ud af at få
  at vide, at mit eget måleværktøj tog fejl. Skjul det ikke.

---

## 9. Standard-arbejdsgang for en ændring

```
1. Læs de relevante filer først — gæt ikke på hvad de indeholder
2. Ret
3. npm run build          # skal give 0 fejl
4. npm run preview + audit-script eller skærmbilleder
5. git pull --rebase      # robotten pusher hver 2. time, du er næsten altid bagud
6. git commit -F <fil>    # commit-beskeder på engelsk, forklar hvorfor
7. git push               # Cloudflare deployer selv
```

Punkt 5 er ikke valgfrit. Robotten commit'er selv, så et push uden rebase bliver
afvist næsten hver gang.
