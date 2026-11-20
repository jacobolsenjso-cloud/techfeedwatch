# Systemkort — techfeedwatch.com

Kort over hvordan sitet og robotten hænger sammen. Læs det i starten af en ny tråd i stedet for hele dagbogen. **Koden er facit**: står kortet og koden ikke ens, er det kortet, der er forkert — ret det i samme commit. `_commit.mjs` nægter at committe, hvis en kørsel, en Cloudflare-funktion eller en Worker mangler her.

Opdateret 19/11-2026 (main c9477aa4). Målt: 409 artikler, 9 guides, 57 ordbogsord, 96 scripts i roden.

## Det vigtigste på én linje
Robotten skriver **kladder** → Jacob trykker **Godkend / Omskriv / Afvis** på `/godkend` → kladder-kørslen lægger det live inden for en time. **Intet går live uden Jacobs Godkend** (beslutning 19/11-2026).

## Stakken
- **Site:** Astro (statisk) bygget af Cloudflare Pages ved hvert push til `main` (commits, der kun rører robotdata, får `[CF-Pages-Skip]` af `.github/commit.sh`). Artikler: `src/content/videos/*.md`, guides `src/content/guides`, ordbog `src/content/glossary`, sider `src/content/pages`.
- **Robotten:** GitHub Actions (repoet er OFFENTLIGT). Skriver med Gemini (`src/lib/model.mjs`), søgetal fra DataForSEO (`src/lib/dataforseo.mjs`, konto fælles med techmediaarch, mærket `tfw`), Jacobs stemme fra det private repo `jacob-hjerne`.
- **Starteren:** Cloudflare Worker `tfw-starter` (`cloudflare/starter/`) — GitHubs egen tidsplan dropper de fleste kørsler, så starteren starter dem (xx:17 og xx:37 UTC).

## Vejen fra spørgsmål til artikel
1. `auto-youtube.mjs` vælger emne og spørgsmål (Google-forslag + DataForSEO), finder videoer og kalder `add-video.mjs`.
2. `add-video.mjs` skriver artiklen (faktaark → outline → tekst → slutkontrol → Jacobs stemme) og laver AI-billedet.
3. **Kontrollanten** (`src/lib/kontrollant.mjs`, 20/11-2026) tjekker hver kladde lige før den gemmes - i `gemKladde` og efter Jacobs "Omskriv"-note (`kontrollerKladde`): A) hver sætning, der nævner en kilde, holdes op mod kildens egen tekst (også PDF); B) ekspertlæsning af hele artiklen med søgning (misforståelser, selvmodsigelser, overdrivelser, navnløse kilder); C) faste regler. Rettelser + rapport gemmes i kladden og vises på /godkend. "Uden belæg"-fund og rettelser, der intet ændrer, rettes ikke - de vises som "Fundet, men ikke rettet - tjek selv" (20/11-2026). Kontakt: repo-variablen `KONTROLLANT` (`til`/tom). Selvtest: `test-kontrollant.mjs`. Måling: `_maal-kontrollant.mjs` (lokal).
4. **`src/lib/kladder.mjs` gemmer det hele krypteret** (`src/lib/kryptering.mjs`, nøgle `KLADDE_NOEGLE`): `public/_kladder/<id>.kladde` + `liste.json` (kun id). Billederne holdes tilbage i kladden. Kø-loft 6.
5. Jacob læser på `techfeedwatch.com/godkend` (Cloudflare Access). Beslutningen gemmes i KV `b:<id>` af `functions/api/godkend.js`.
6. `kladder.mjs` (kørslen "Kladder") henter beslutningerne fra `/api/kladde-beslutninger` og: **Godkend** → `src/content/videos/<slug>.md` + billeder i `public/billeder|kort|og` + byg-tjek → main · **Omskriv** → Gemini retter efter noten, ny version · **Afvis** → `kladder-afviste/` (krypteret, slettes aldrig).
Omskrivning af gamle artikler (`omskriv-gamle.mjs` → `add-video.mjs --erstat`) og faktatjek (`faktatjek-gamle.mjs`) går samme vej: kladde først, live efter Godkend.

## Kørslerne (`.github/workflows/`)
| Fil | Hvornår (UTC) | Hvad |
|---|---|---|
| `daily-update.yml` | starter xx:17 hver time; skriver kun man/ons/fre, 1-2 nye | robotten: selvtest (`test-skriveregler`, `test-noindex-gamle`, `test-kladder`) → `auto-youtube.mjs` → log, linktekster, tjek, byg |
| `kladder.yml` | starter xx:37 hver time | udfører Jacobs beslutninger (`kladder.mjs`); 15 sek. når intet venter |
| `omskriv-gamle.yml` | starter 06:37, kun man/ons/fre | 3 omskrivninger + stikprøve (`stikproeve.mjs`) + faktatjek → kladder |
| `daglig-rapport.yml` | starter 07:37 | morgenrapport (`daglig-rapport.mjs`) |
| `hent-kurser.yml` | starter den 1. kl. 03:37 | kryptokurser til DCA-værktøjet |
| `indexnow.yml` | egen tidsplan 02:41, 08:41, 14:41, 20:41 | melder nye/ændrede adresser til Bing |
| `tomgang.yml` | egen tidsplan 03:43, 11:43, 19:43 | alarm hvis robotten ikke har SKREVET i 100 t (ingen alarm når køen er fuld) |
| `prune-videos.yml` | egen tidsplan hver 3. dag 04:00 | fjerner artikler med slettet video (301), opdaterer visningstal, trend-punkt |
| `paastande.yml` | egen tidsplan mandag 06:23 | vagt over påstande på sitet |
| `dataforseo-maaling.yml` | i hånden / ved ændring af `.github/dataforseo-maal.txt` | måling af søgetal (koster lidt) |
| `proeveartikel.yml` | kun i hånden | prøveartikel på en gren (kommer ikke på main) |
| `rejudge-relevance.yml`, `rewrite-archive.yml` | slået fra | gamle engangskørsler (YouTube blokerer GitHub) |

## Cloudflare
- **Pages-projektet `techfeedwatch`** (konto `jacob-sites`): variabler `ACCESS_TEAM`, `ACCESS_AUD`, `GODKEND_EMAIL` (tekst), `KLADDE_NOEGLE`, `YOUTUBE_API_KEY` (Secret). KV-binding `GODKEND` = `tfw-godkend`.
- **Funktioner (`functions/api/`):** `godkend.js` (Access-låst: kladder + beslutninger), `kladde-beslutninger.js` (offentlig kun-læs), `video-data.js`.
- **Access-app "TechFeedWatch godkend":** kun `/godkend` og `/api/godkend`, kun Jacobs e-mail.
- **Workers:** `tfw-starter` (tidsplan + push-kald), `tfw-push` (app-beskeder, `cloudflare/push/`), `cloudflare/pagespeed/` og `cloudflare/transskript-proxy/` (status ikke målt; transskript-vejen lukket 16/9 — YouTube blokerer datacentre). Sendes op med `npx wrangler deploy` i mappen.

## GitHub-nøgler (secrets — kun navne)
`GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `HJERNE_NOEGLE` (læsenøgle til jacob-hjerne), `KLADDE_NOEGLE` (samme værdi som i Cloudflare). Starterens `GITHUB_TOKEN` ligger i Workeren. Repo-variabel (ikke hemmelig): `KONTROLLANT` (`til` = kontrollanten kører). Gemini-loftet: når det rammes, bliver omskrivningen rød (`.github/tjek-gemini-stop.mjs`), robotten var det i forvejen.

## Datafiler (`src/data/`) — hvem skriver dem
| Fil | Skrives af | Til |
|---|---|---|
| `kladde-log.json` | `src/lib/kladder.mjs` | dagsloft + tomgang (hvornår blev der skrevet) |
| `robot-log.jsonl` | `robot-log.mjs` | robottens logbog (pris, udfald) — læses af rapport og driftstavle |
| `used-questions.json`, `tried-questions.json` | `auto-youtube.mjs` | brugte spørgsmål / spørgsmål på is i 30 dage |
| `dataforseo.json`, `dataforseo-forslag.json` | `src/lib/dataforseo.mjs` | søgetal-hukommelse 30 dage |
| `omskriv-fejl.json`, `omskriv-log.json`, `omskriv-prioritet.json` | `omskriv-gamle.mjs`, `kladder.mjs`, `faktatjek-gamle.mjs` | omskrivningskøen (fejl, afvist af Jacob hviler 30 dage, rækkefølge) |
| `faktatjek-log.json`, `stikproeve-log.json`, `stikproeve-fund.json` | `faktatjek-gamle.mjs`, `stikproeve.mjs` | faktatjek og daglig stikprøve |
| `view-history.json`, `channel-averages.json`, `trend-history.json` | `update-view-counts.mjs`, `snapshot-trends.mjs` | visningstal og trends (serier, ingen bagudrettede punkter) |
| `kurser.json` | `hent-kurser.mjs` | DCA-værktøjet |
| `relevans.json`, `relevans2.json`, `rewrite-arkiv-log.json` | gamle relevans-/arkivkørsler | historik, bruges ikke i drift |

## Faste regler, kortet skal huske dig på
- Git kun fra Windows; commit med `node _commit.mjs <repo> <beskedfil>`; `git pull --rebase` før push (robotten pusher hver time).
- Nøgler og `.env` læses og vises aldrig; nøglesider fotograferes ikke.
- techfeedwatch og techmediaarch deler INGEN kode.
- Statusfilen ligger kun på Drev (`techfeedwatch-status`, ny version pr. arbejdsrunde via `_lav-status-tfw.mjs`). Dette kort ligger i repoet og ændres i samme commit som koden.
