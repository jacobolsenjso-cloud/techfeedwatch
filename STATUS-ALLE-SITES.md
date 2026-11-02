# Status på Jacobs tre sites

Samlet 8. september 2026, opdateret 24. oktober (**version 215** — brug kun v215). Målt direkte i repoerne og på de levende sites — ikke afskrevet fra ældre dokumenter.

**Sådan bruges filen:** Start en ny session med "Læs `C:\Users\jacob\techfeedwatch\HOVEDPROMPT.md` og derefter `STATUS-ALLE-SITES.md`". Hovedprompten er arbejdsformen (og har faldgrubelisten); denne fil er, hvor vi står. De ældre dokumenter (se afsnit 5) er baggrund. **Koden i repoerne er altid facit.** Afsnit 7 er dagbogen — nyeste øverst.

## 0. Hvor vi er lige nu (24/10-2026) — læs dette først i en ny tråd

**Start sådan:** læs `HOVEDPROMPT.md` først (arbejdsform og faldgrubeliste), derefter dette afsnit. **Koden er facit.** Afsnit 2–4 er baggrund og kan være forældede; dagbogen (afsnit 7) viser den sidste uge, nyeste øverst. Ældre dagbog og Bilag A ligger i `STATUS-ARKIV.md` (flyttet 14/10) — læs den kun, når en ældre beslutning skal findes. Ret dette afsnit, hver gang noget ændrer sig, og slet det, der er løst.

**Seneste for techfeedwatch (2/11-2026 kl. 12:05, statusfil v215):** Ugentlig aflæsning af Search Console. Indekseringen står bit for bit stille (41 indekserede / 889 ikke indekserede, alle årsager uændrede) - fordi Google ikke har genberegnet data siden 23.10.2026, så der var intet nyt at læse. Sitemappet 628 -> 646 adresser. Valideringen for "Side med omdirigering" er skiftet til "Mislykkedes". Effektivitet 4/10-31/10: 26 klik, 56 eksponeringer, 46,4 %, position 2,6 (flere eksponeringer, lidt færre klik). Links: eksterne 1 -> 5 (nye: github.com 2, about.me 1, pinterest.com 1; alle peger på forsiden), interne 338 -> 333, Bing stadig uden data. Pris-opfølgning fra 27/10 står fortsat til 3/11.

### techfeedwatch.com — målt 24/10 kl. 13:56
- **Live:** `6f4f7db7` (se `https://techfeedwatch.com/build.json`, målt 24/10 kl. 14:16). **456 artikler** (robot-status.json).
- **Plan:** den nye opskrift ("søgning først"), artikelsiden og AI-billederne er live siden 13/10; de gamle artikler skrives om (loft 16/10: højst 3 nye + 3 omskrivninger om dagen). Næste beslutning: hvordan sitet opfylder Googles krav om menneskelig indsats og originalitet (1/10), før AdSense nr. 4, som Jacob selv sender.
- **Overvågning:** `robot-status.json` (står `lastArticle.at` mere end et døgn tilbage, er noget galt), `build.json` (hvilken commit der er live), workflowet "Tomgangsalarm" (3 gange i døgnet; rød kørsel og mail ved 36 timers tomgang).
- **Ældre åbne punkter, ikke genmålt 6/10 (detaljer i Bilag A i `STATUS-ARKIV.md`):** Search Console-måleserien (ugentlig aflæsning, seneste i git 26/10, `f30ea63e` — 8 punkter; link-serien 2 punkter), miniature-fejlen for Shorts, brandsuffikset i `<title>` måler tegn i stedet for bredde, VideoObject uden `duration`, beslutningen om hvad Jacob selv skriver ("menneske i loopet"), AlternativeTo-forslaget.

### techmediaarch.com — målt 6/10 (kun læsning)
- Kører på Astro (Cloudflare Workers) siden 25/9; forsiden svarer 200. GitHub `origin/main` = `13e2dc9` (6/10 kl. 11:29, "Robot: 1200-word minimum, more research, merge single sentences"). Repoet har 194 artikelfiler og 17 sider. AdSense-godkendt.
- Robotten udgiver selv (pr. 27/9: højst 2 om dagen, fri tirsdag og fredag). Sitet har ingen `robot-status.json`.
- Seneste status står i `OVERLEVERING-techmediaarch.md` og dagbogen 29/9. **Afsnit 3 er forældet** (beskriver Blogger, målt 8/9).
- **Regel (Jacob 28/9): techmediaarch og techfeedwatch blandes ikke.**

### gentleaiguide.com — målt 6/10 (kun læsning)
- Forsiden svarer 200; 42 adresser i sitemappet; 27 guide-filer i repoet. GitHub `origin/main` = `f266d59` (5/10, pull request #6 flettet). **Afsnit 4 er forældet** (målt 15/9, 23 artikler). Næste milepæl (fra 25/9): AdSense ved ca. 30 artikler.

### Fælles
- **Pinterest (24/10, venter på Jacob):** Jacob opretter selv Business-kontoen; derefter claimer Claude domænet via Cloudflare DNS (TXT) og sætter RSS-autodeling op. Målt forhindring: techfeedwatch.com/rss.xml har 0/50 indlæg med billede — feedet skal have artikelbilledet med først (gren, Jacobs ja).
- Statusfilen får nyt versionsnummer ved hver opdatering; md, pdf og docx ligger i roden og i `Claude outputs`. Google Drev opdateres af Claude (Jacobs beslutning 20/10): kopi af de versionerede filer til `C:\Users\jacob\Downloads` (synkroniseres af Google Drev for computer), overskriv aldrig en eksisterende, og tjek bagefter på drive.google.com i Jacobs Chrome.

---

## 1. Overblik

| Site | Platform | Tilstand i dag | Vigtigste næste skridt |
|---|---|---|---|
| techfeedwatch.com | Astro 7.3.8 + Cloudflare Pages, robot via GitHub Actions, startet af Cloudflare-Workeren `tfw-starter` | **456 artikler** (målt 24/10), live `6f4f7db7`. Robotten starter hver time; højst 3 nye artikler og 3 omskrivninger om dagen (16/10); tidligt stop A+B; faktaboks "Key facts" på nye/omskrevne artikler. Morgenrapport ca. 09:37. | Mål pris, A+B og faktabokse 17/10; plan for artikler uden video (punkt 3); primære kilder (punkt 5). |
| techmediaarch.com | Google Blogger + Cloudflare (Free) foran | AdSense-godkendt, annoncer virker (GDPR-fejl rettet 5/9). Hastighed ok. | **B valgt 23/9: flyt til Astro** (samme adresser — fra 29/9 uden .html, de gamle giver 301, Watch-siden med, Cloudflare Workers). **Trin 1–5 gjort: www kører på det nye site siden 25/9 kl. 12:30** (Workers-rute, Blogger urørt bagved, repo `5c0905e`, tjek 0 fejl). Zaraz slukket (Auto-inject fra). Næste: trin 6 — mål annoncer og 404. **28/9: Watch-siden (video åbner nu synligt) og videoerne på 130 sider (stribe over afspilleren) rettet, set live. Alle sider gennemgået som besøgende; Disclosure på Resources; fundene rettet (se dagbogen 28/9 kl. 12:50). 29/9: fejlgennemgang rettet (pladsholdere, gentagne afsnit, tomme overskrifter, 34 døde links), FAQ-boks med mindst 5 spørgsmål, Google AI-artiklen slettet med 301, robotten journalistisk, adresser uden .html med 301 fra de gamle, security.txt rettet (Cloudflares udgave slået fra), AdSense "Do not consent" slået til (dagbogen 29/9).** |
| gentleaiguide.com | Astro + Cloudflare Pages + **robot i skyen (Claude Code på nettet) + GitHub Actions** | Live, **23 artikler, ingen kladder** (15/9). I Search Console med sitemap (9/9). **Robotten virker fra ende til anden fra 15/9** — kørslerne 10/9 og 14/9 gav intet, fordi repoet ikke var koblet på den planlagte task (rettet 15/9). Repoet er OFFENTLIGT (15/9). | **Målt 21/9 kl. 19:20 i GitHub og i Routines: robotten er sund — den venter på Jacob.** `PR #3 "New article: Why Is AI Always Female?"` (artikel 24) har stået åben og grøn siden 17/9; `origin/main` er uændret på `12eeeaa`, altså **stadig 23 artikler**. Kørslen 21/9 kl. 07:05 kørte færdig og skrev bevidst ingen ny artikel, fordi #3 endnu ikke var behandlet — den sendte en påmindelse i stedet. **Ét klik løser det: Merge eller Close på #3.** Indtil da står både robotten og milepælen "AdSense ved ~30 artikler" stille. |

---

## 2. techfeedwatch.com

### Målt 15/9-2026 (repo `C:\Users\jacob\techfeedwatch`, `gennemgang.mjs` på dist/)

| | Nu (15/9) | 8/9 | I PROJECT-STATUS.md | I HANDOVER.md (18/8) |
|---|---|---|---|---|
| Sider i alt | **580** (611 før de 26 kl. 10:30) | 634 | – | – |
| Artikler | **384** (30 + 26 slettet 15/9, 7 slettet 9/9, robot +) | 426 | 367 | 391 |
| Værktøjer | **41 sider** (35 værktøjer + kategorisider) | 35 | 35 | 40 |
| Glossar | **57** | 56 | 28 | 50 |
| Guides | 10 | 9 | 9 | 9 |
| Redirect-linjer | **1.598** | 1.381 | 676 | 1.351 |

Kun kolonnen "Nu" er talt. De andre viser hvor forældede dokumenterne er.

### Hvad der virker

- Sitet svarer og renderer korrekt. **Robotten kører** (`daily-update.yml`, hver time på minut 17 fra 15/9 aften — men se kendt fejl 8). Prune/visningstal/trend-snapshot hver 3. dag.
- **Omskrivningen er færdig.** 384 artikler har `rewrittenAt`; de 49 uden er nye robot-artikler skrevet efter den nye metode.
- Titel-projektet (300 `seoTitled`) gennemført; `_titler-gennemsyn.html` er arkiv.
- Samtykke (Consent Mode v2 / Funding Choices) målt og i orden (commit `9695908`).
- **Meta-beskrivelser rettet 8/9** (commit `75d93c3`): alle 433 har en hel sætning under 155 tegn. Værktøj: `fix-meta-descriptions.mjs` (`--redo` fanger nye klippede).
- **Overskrifts-værn (beslutning A) er live 8/9** (commits `a6133df`, `2d80cd8`): robotten må ikke længere smide søgespørgsmålet væk i overskriften. Regel: spørgsmålets kerneord skal stå i overskriften i samme rækkefølge (huller tilladt, stammer matcher: "recipes"/"recipe"). Kan overskriften ikke repareres, bliver spørgsmålet selv overskriften. Reglerne ligger ét sted, `src/lib/headline.mjs`, og bruges af både `add-video.mjs` (robotten) og `retitle-to-demand.mjs` (bulk). META klippes ikke længere midt i en sætning med "…".
- Git er rent mod GitHub. **Kør ALDRIG git fra Linux-VM'en** — selv `git status` derfra efterlader en `index.lock`, der blokerer git på Windows (skete 8/9 i begge repoer; fjernes med `Remove-Item .git\index.lock`).

### B — de gamle overskrifter: GENNEMFØRT 9/9

Commit `94b24aa`: **222 artikler** har ny `title` + `targetQuestion`, hver med et rigtigt Google-søgeforslag bag. Adresserne er uændrede (ingen redirects). Sådan blev de 238 forslag til 222:

- 171 var værktøjets egne forslag og så fornuftige ud.
- 67 var tvivlsomme (31 fundet af Claude ved gennemlæsning, 36 markeret ⚠ af værktøjet). For dem læste Claude artiklens resumé og valgte selv et andet af de rigtige søgeforslag + skrev overskriften efter husets regel (`_retitle-picks.mjs`, tjekker kerneord/rækkefølge/længde/dubletter maskinelt). 51 kunne reddes sådan; **16 beholdt den gamle overskrift**, fordi intet søgeforslag passede til artiklen (`_retitle-afvist.txt`).
- Jacobs beslutning 9/9: "ret det hele" — han gennemgik ikke listen selv.

Målt efter (`audit-demand.mjs`, 433 artikler): overskrifter uden beslægtet søgeforslag **265 → 213**. Artikler med `targetQuestion` 49 → 271; 212 af dem (78 %) findes stadig i autocomplete (før: 42 af 49, 86 %). Faldet på 265→213 er mindre end de 222 rettelser, fordi audit'ens match er fuzzy og autocomplete svinger fra kørsel til kørsel — målestokken er grov, ikke facit. Det rigtige svar kommer fra Search Console om 2–4 uger.

Filer: `_retitle-plan.json` (endelig plan), `_retitle-tvivl.html` (de 67 med begrundelser), `_retitle-picks.mjs` (Claudes 51 valg), `_retitle-afvist.txt` (de 16). Alt arkiv nu.

**De 42 uden søgeforslag (28 "ingen efterspørgsel" + 14 "intet match"):** Beslutning 9/9 (Jacob): slet ikke alle — målestokken er for grov (fx "Zero Trust Security" og "GEO" står på listen, og det er værktøjets emnegæt, der fejlede). **7 rent forældede (video fra 2019–2022) slettet 9/9** (commit `21371e8`): Unity-2022-AR, SEO/developers-2021, Flink-streaming-2020, fluid-simulation-2020, Saudi-fintech-accelerators-2021, VR-beyond-gaming-2019, HTML/XML-SEO-2021. Hver har 301 til nærmeste beslægtede artikel (fluid-simulation → `/tag/ai-tech`), de gamle video-id-regler er drejet direkte til målet (ingen kæder), OG-billeder fjernet. Ingen interne links pegede på dem. **De resterende 35 venter på Search Console:** om ~4 uger slettes dem med 0 visninger, resten bliver.

### Kendte fejl og huller

1. **`stamp-sw.mjs` versionerer ikke service workeren** (hasher en tom mappe; `sw.js` siger altid `tfw-v2`). Ret: hash `dist/index.html` eller brug `Date.now()`.
2. **Tre statusdokumenter der modsiger hinanden** (afsnit 5). PROJECT-STATUS.md blev overskrevet 8/9 med tal fra 4/8 af en anden session.
3. **`CLAUDE.md` i repoet modarbejder din arbejdsform** ("zero fluff, ingen forklaringer"). Bør omskrives.
5. **AdSense:** tre afslag bag os; ansøgning nr. 4 sendes af Jacob ~26/9, når robotten har kørt en uge på den nye kode (beslutning 12/9).
6. Titler på 61–69 tegn (Google klipper ved ca. 60) — tæl igen efter B; de 222 nye er alle ≤ 62.
7. PWA offline aldrig testet på telefon. Lavt prioriteret.
8. **YouTube blokerer transskript-hentning fra GitHub Actions** (målt 14–15/9: "Transcript is disabled", 12 min ventetid pr. video, 4 af 4 kandidater i #523 og #525). Uden Plan B er robotten på GitHub reelt stum, indtil åbent punkt 1 er løst.
9. Samme spørgsmål vælges igen inden for samme time (indekset er timen), så to kørsler tæt på hinanden prøver det samme — billigt, men spild. Lavt prioriteret.

### Forslag — målt, ikke bygget, venter på Jacobs valg (20/9)

**1. IndexNow — BYGGET 20/9, se dagbogen.** Står her som baggrund: Bing, Yandex, Naver og Seznam deltager og deler indsendelsen med hinanden; Bing er samtidig den motor, Copilot og DuckDuckGo henter fra. **Google deltager ikke** — de testede protokollen i 2021 og valgte den fra; deres egen Indexing API gælder kun jobopslag og direkte udsendelser. Bygget som `indexnow.mjs` + eget workflow, ikke som linjer i `add-video.mjs`: adressen skal være live, før den indsendes, og Cloudflare bygger først et par minutter efter robottens push.

**2. `<lastmod>` i sitemappet.** Målt 20/9: `dist/sitemap-0.xml` har 527 `<loc>` og **nul** `<lastmod>`. For et site, der udgiver hver dag, er det det billigste signal, der findes — crawleren kan se hvad der er nyt uden at hente siden. Google bruger det, når datoen er konsekvent rigtig (og ignorerer det, hvis den ikke er, så den skal komme fra artiklens egen dato, ikke fra byggetidspunktet). Omfang: en `serialize`-funktion i `astro.config.mjs`.

**3. `<atom:link rel="self">` og `<lastBuildDate>` i RSS.** Feedet har `pubDate` på hver artikel, men mangler de to felter, feed-læsere og validatorer forventer. Lille ting, fem minutter.

**Undersøgt og valgt fra:** Googles Indexing API (kun jobopslag/udsendelser — ville være misbrug), `speakable`-schema (Google har trukket det tilbage til et lukket forsøg), sitelinks-søgefelt (udgået 2024). `llms.txt` og `Content-Signal` i robots.txt er der allerede.

### Hvorfor ingen organisk trafik (målt 8/9, `audit-demand.mjs`)

- Autocomplete-delen virker (42 af 49 `targetQuestion` findes i Google). Fejlen lå i overskrifterne: 26 af 49 nye artikler havde en overskrift uden beslægtet forslag → **løst fremadrettet med A**. 239 af de 384 gamle artikler handlede om det, en video handlede om, ikke om noget nogen søger → **løst med B 9/9** (222 rettet, 16 uden match).
- Sitet blev først færdigomskrevet ~24/8; Google har haft 2 uger. Search Console er det eneste sted, man kan se indeksering.

### Jacobs egne opgaver (10/9, stadig åbne 15/9)

AdSense-ansøgning nr. 4 er udskudt til ~26/9 (beslutning 12/9) — læs about-siden igennem én gang selv først · validér rettelser i Search Console (85 adresser med 404; efter 15/9 er der 56 nye 301'er oveni) · slet 4 døde sitemap-indsendelser · gen-scrape delecache hos Facebook/LinkedIn · test PWA offline.

### Aftalt plan efter AdSense-svar (masterguide §9)

1) Microsoft Clarity på eksisterende samtykke, 2) navigation rettes ud fra 4–6 ugers måling, 3) "Spørg arkivet" (Cloudflare Workers AI). Ikke besluttet: robot som assistent (Jacob godkender, som på gentleaiguide) frem for udgiver — spørg, antag ikke.

---

## 3. techmediaarch.com

### Målt 8/9-2026 (forsiden)

Sitet svarer. 178 indlæg (2024: 102 · 2025: 16 · 2026: 60). Blogger, custom domain, Cloudflare Free foran med HTML-cache (Edge TTL 2 timer).

### Hvad der er rettet (sept. 2026, alt med Jacobs ok)

- **Annoncer virker igen.** AdSense' "Optimer meddelelse om samtykke" viste en begrænset boks uden ægte samtykke. Slået fra 5/9. Verificeret.
- Hastighed: TTFB ~1,1 s → ~60–110 ms via Cloudflare-cacheregel. Nye indlæg kan tage op til 2 timer — eller "Purge Everything".
- Watch-siden: nye annonceenheder, miniaturer lazy-loades. Reglen "må ikke ændres" er ophævet af Jacob 28/9, så den virker som på Blogger. Rettet 28/9: tryk på en video ruller nu afspilleren frem (`e408810`).
- Videoer i artiklerne (130 sider): afspilleren fylder igen hele rammen (`29d279d`, 28/9).
- Tema: manglende `}` rettet, Bootstrap Icons → indlejret subset (127 KB → 4,7 KB), ubrugt CSS/script fjernet.
- GA4 (G-TJTC0HR0JK) kommer fra **Cloudflare Zaraz** på zonen (målt 25/9 i Cloudflare → Web tag management: ét værktøj, "Google Analytics 4", slået til; data modtaget inden for 48 timer). Det er IKKE i Blogger-HTML'en og heller ikke via GTM, som det stod her før. Zaraz' samtykkestyring er slået fra, så GA indlæses uden samtykke (det gjaldt også før). Cloudflare Web Analytics (beacon) er også slået til. DNS: Multi-provider fra, DNSSEC-advarsel væk.

### Stadig åbent

1. **Den store beslutning er truffet 23/9: B, flyt til Astro.** Se afsnit 0 og dagbogen 23/9 kl. 22:00. Punkterne herunder løses i det nye site i stedet for i Blogger-temaet.
2. Indholdet har referat-DNA ("Executive Summary:", kolon-titler) — risiko ved genvurdering hos AdSense.
3. Synlige småfejl: dansk streng "Kode Kopieret!", tom "No results found", eget AdBlocker/cookie-banner, dødt footer-link "News (coming soon)", %20 i en 2024-URL, rodet menu.
4. Cloudflare-forslag 2–12 fra 5/9 afventer valg. Email-spørgsmålet (SPF/DKIM/DMARC) ikke bekræftet lukket.
5. **Åbent (29/9, se `OVERLEVERING-techmediaarch.md`):** h1 på Trump/Meta-artiklen (kræver Jacobs ok), den første robotartikel på den nye instruks (30/9), Gemini-forbruget omkring 3/10, startordene i `robot/froe.json` (Claudes udkast), 1 artikel med kun 3 FAQ-spørgsmål (robotten fandt ikke flere). Blogger-forsidens "VIDEO"-blok findes ikke på den nye forside — ikke afklaret, om den skal genskabes. (Rettet 28/9: "We not Sell…"-linket og "Fintech_Companies".)

### Regler for dette site

Ingen kode uden udtrykkelig tilladelse. Rør ikke AdSense-indstillinger uden ok. Mål annoncer FØR ændringer. Purge Everything efter hver udgivelse. Blogger afviser tags i CSS-kommentarer i `b:skin`.

---

## 4. gentleaiguide.com

### Målt 15/9-2026 (repo `C:\Users\jacob\gentleaiguide`)

Sitet svarer. 5 kategorier, **23 udgivne artikler, ingen kladder** (21 `detect-fake-videos` udgivet 15/9 `80458cd`; 23 `responsible-for-ai-mistakes` via PR #2, merged 15/9 `97a2b73`). Seneste commit `12eeeaa` 15/9 (robot.md). Git rent mod GitHub. **Repoet er offentligt siden 15/9** (Jacob gjorde det selv) — nøgler kun i Secrets, aldrig i commits. **Skyens netværk kan ikke nå gentleaiguide.com (403 fra proxyen) — levende tjek af dét site skal ske fra Jacobs pc.**

### Hvad der er på plads

- Design låst: publikationsmodel, farve 3 (creme/kul/rav/teal), Atkinson 19 px, A/A+/A++. Illustrationsstil LÅST: flat2, objekt-motiver, Cloudflare Workers AI (FLUX.1-schnell).
- **Google Search Console + sitemap indsendt 9/9** (`sitemap-index.xml`). Åbnet for søgemaskiner 6/9.
- **Struktureret data (JSON-LD) tilføjet 9/9:** Organization + WebSite på alle sider, Article + BreadcrumbList på artikler. Logo `public/logo-512.png`. Googles rich-results-test gav fejl før — nu har sitet data at vise.
- **Kladde-tilstand:** `draft: true` i frontmatter → siden bygges, men er `noindex`, ude af forside, lister, sitemap og RSS. Kun den med linket ser den. (`src/site.ts` `isPublished()`, filter i `astro.config.mjs`.)
- hello@gentleaiguide.com (Hostinger), MX/SPF/DKIM/DMARC ok.

### Robotten — sådan hænger det sammen (bygget 9/9)

**Alt kører online. Din pc behøver ikke være tændt.** **Rettet 15/9:** den planlagte task havde IKKE repoet koblet på (feltet "Select a repository" i Routine-indstillingerne var tomt), så kørslerne 10/9 og 14/9 stoppede ved trin 0 ("Needs permissions" = robotten bad om repo-adgang, ingen svarede). Nu valgt. Testkørsel 15/9 gav PR #2 på ~10 min.

| Del | Hvor | Hvad |
|---|---|---|
| Skribent | Claude Code på nettet (claude.ai/code), miljø **"Gentle AI Guide robot"** (Network: Full — nødvendigt for Googles autocomplete) | Skriver artiklen. Det er Claude (samme model som her), ikke Gemini. |
| Tidsplan | Scheduled task ("Routine") på det miljø, **repoet `jacobolsenjso-cloud/gentleaiguide` valgt under "Select a repository" (fra 15/9 — før var feltet tomt, og robotten kunne intet)** | **Mandag og torsdag kl. ~07:05** dansk tid (bliver 06:05 efter overgang til vintertid — skal rettes til oktober). Kan fyres manuelt fra en Cowork-session med `fire_trigger` eller under Routines → ▷. |
| Opskrift | `docs/robot.md` i repoet | Læses forfra ved hver kørsel. Kategori med færrest artikler → spørgsmål fra Google-autocomplete (`scripts/find-topic.mjs`, filtreret til 50+) → artikel 900–1.400 ord → gren `draft/<slug>` → pull request. |
| Illustration | GitHub Actions-job **"Illustrate"** (`.github/workflows/illustrate.yml`) | Kører ved push til `draft/*`: tegner manglende billeder via Cloudflare og committer dem til grenen. Nøglerne ligger i repoets Secrets (`CF_API_TOKEN`, `CF_ACCOUNT_ID`). Jobbet viser længde/hash af nøglerne (aldrig værdien) til fejlsøgning. **Dør jobbet på 5 s uden log = GitHubs betalingsgrænse** (kontoens gratis minutter brugt op) — derfor er repoet offentligt fra 15/9. |
| Preview | Cloudflare Pages | `https://<alias>.gentleaiguide.pages.dev/guides/<slug>/` — **aliasset er de første 28 tegn af `draft-<slug>`** (fx `draft-responsible-for-ai-mis`); Cloudflares bot skriver den rigtige adresse på pull request'en. Noindex, fuldt layout. |
| Godkendelse | GitHub pull request → **mail til Jacob** | **Merge pull request** = udgiv · **Close** = drop · kommentar = robotten retter ved næste kørsel. Robotten udgiver aldrig selv. |
| Hukommelse | `docs/used-questions.json` | Brugte spørgsmål vælges aldrig igen. |

Hvorfor sådan: (1) push-beskeder fra scheduled tasks nåede aldrig frem — GitHubs PR-mail er pålidelig; (2) sky-sessionens sikkerhedsfilter blokerer kald til Cloudflare med nøgle, så billedet tegnes af GitHub Actions i stedet; (3) Jacob vil godkende før udgivelse — PR'en er GitHubs indbyggede godkend-knap. Når Jacob har set 5–10 gode artikler i træk, kan robotten ændres til at udgive direkte (5 minutters arbejde).

**Robot-artikler udgivet:** 22 "How to use AI for recipes" (PR #1, 9/9, Everyday use) · 23 "Who Is Responsible for AI Mistakes?" (PR #2, 15/9, Questions, 1.161 ord — første artikel fra en kørsel startet af tasken selv). Billeder tegnet af GitHub og tjekket for tekst begge gange.

### Åbent

0. **24/9: `main` er nu beskyttet (ruleset "Protect main", id 23950289, Active).** GitHub viste "Your main branch isn't protected". Kun to regler er slået til: **"Restrict deletions"** og **"Block force pushes"** — ingen krav om pull requests eller tjek, fordi robotten og billedjobbet (`illustrate.yml`) kun skubber til `draft/**`, og direkte pushes til `main` skal stadig kunne ske. Tom bypass-liste, så reglen også gælder Jacob. Oprettet i Jacobs Chrome med hans ja; GitHub krævede e-mailbekræftelse, som Jacob gav selv. **Set virke via GitHubs offentlige API:** `main` → `protected: true`, regler `deletion` + `non_fast_forward`. **Samtidig set:** PR #4 "New article: How to Learn AI for Seniors" (grenen `draft/learning-ai-for-seniors`) har ventet på Jacob siden 24/9 kl. 07:17 — indtil den er merget eller lukket, skriver robotten ingen ny artikel. 7 grene ud over `main` (bl.a. `design-b`, `design-options`, merget `draft/female-voice-assistants`) kan ryddes op; intet slettes uden Jacobs ok.
1. ~~Kladden `detect-fake-videos`~~ Udgivet 15/9 (`80458cd`) efter Jacobs godkendelse.
2. **BESVARET 21/9 — og robotten opfører sig helt rigtigt. Flaskehalsen er godkendelsen.** Målt to steder: (a) mod GitHub efter `git fetch` — kørslen torsdag 17/9 kl. 05:08 skabte grenen `draft/female-voice-assistants`, og **PR #3 "New article: Why Is AI Always Female?" står åben, grøn (1/1 tjek), umerget fem dage efter**; `origin/main` er uændret på `12eeeaa` fra 15/9 med 23 artikler. (b) i kørslens egen samtale på claude.ai/code → Routines: **kørslen mandag 21/9 kl. 07:05 kørte færdig (Completed) og skrev bevidst INGEN artikel.** Robotten tjekkede først for åbne PR'er, fandt #3 uden kommentar fra Jacob og fulgte sin egen regel — højst én artikel ad gangen, den forrige skal læses først. Den sendte i stedet en påmindelse med link til PR'en og preview-siden (`https://draft-female-voice-assistant.gentleaiguide.pages.dev/guides/female-voice-assistants/`). **Ingen fejl noget sted.** Routinen har "Push and Email notifications on" og kører på Sonnet 5 (High); næste kørsel torsdag 24/9 kl. 07:11. **Konsekvensen er, at robotten står stille, indtil Jacob trykker Merge eller Close på #3** — og dermed også milepælen "AdSense ved ~30 artikler". To ældre kørsler (10/9 og 14/9) står stadig som "Needs your approval · Bash" og er tabte, som noteret 15/9.
3. Vintertid: tidsplanen er i UTC (`0 5 * * 1,4`). Ret til 06:00 UTC i slutningen af oktober, hvis 06:05 dansk tid er for tidligt.
4. Ugentlig gennemgang af produkt-/indstillingsartikler (aftalt, ikke bygget endnu) — kan blive en tredje kørsel om ugen i robotten.
5. AdSense: ansøg ved ~30 artikler (privatlivsside findes, manuelle placeringer max 2/side, ingen Auto ads).
6. Oprydning: testgrene `design-v2`, `design-options`, `design-b`, `design-final` kan slettes (målt 15/9: `guided-path` er allerede væk).
7. Småting: artikel 18 har Apple-logo på laptop, 15 har små tastaturbogstaver i billedet.
8. techfeedwatch-repoet og gentleaiguide-repoet deler kontoens GitHub Actions-kvote; begge er nu offentlige, så kvoten er ikke længere et problem — men kommer der et tredje, privat repo, rammer det samme mur.

---

## 5. Dokumenterne — og hvad der bør ske med dem

| Fil | Dato | Indhold | Anbefaling |
|---|---|---|---|
| `STATUS-ALLE-SITES.md` (+ .pdf, Google Drive "Site-status") | **26/9 v56** (Drive: stadig v10 fra 15/9 — skal skiftes ud, se åbent punkt 11) | **Denne fil. Indgangen.** | Opdateres ved hver sessions afslutning. **Ændrer `.md` sig, bygges `.pdf` og `.docx` om i SAMME omgang** og måles efter på både bytes og indhold. |
| `gentleaiguide/docs/robot.md` | 15/9 | Robottens opskrift (repo-tilknytning, offentligt repo, betalingsfejl, preview-alias) | Robottens facit. Ret her OG i taskens prompt (Routines → Edit), når robotten skal opføre sig anderledes. |
| `PROJECT-STATUS.md` | overskrevet 8/9 med tal fra 4/8 | Forældet | Slet, eller erstat med henvisning hertil. |
| `HANDOVER.md` | 18/8 | Omskrivningsprojektet, faldgruber 1–12 | God baggrund; tallene er forældede. |
| `MASTERGUIDE-TechFeedWatch-v4.pdf` | 24/8 (v4.2) | Arkitektur, robot, kvalitetsværn, faldgruber 1–15 | **Bedste referencedokument.** Behold. |
| `HANDOVER-TECHMEDIAARCH.md` | 24/8 | Diagnose + A/B/C-valget | Korrekt, men sept.-rettelser står kun i afsnit 3 her. |
| `_retitle-gennemsyn.html` / `_retitle-tvivl.html` / `_retitle-plan.json` | 9/9 | B-gennemsynet | Gennemført 9/9. Arkiv. |
| `_titler-gennemsyn.html` | 21/8 | Titel-gennemsyn | Gennemført. Arkiv. |
| `_link-gennemsyn.html` (+ kopi i `Claude outputs\`) | **22/9** | **Interne links: 214 artikler uden ét eneste brødtekst-link ind, 114 med et konkret forslag til afsender, 100 emnemæssigt alene.** Bygget på kilderne, ikke på det færdige site. | **Ikke bygget — venter på Jacobs dom.** Lukker fortiden; fremtiden kræver at robotten selv placerer 2-3 i-tekst-links, når den skriver (ikke gjort). |
| `CLAUDE.md` (techfeedwatch) | 7/7 | Instruktioner til Claude Code | Modsiger din arbejdsform. Omskriv. |

Google Drive: mappen "Site-status" (id `1p_AE747Jp-sXdbheiSytiO-zsLzIS3WI`). Drive-værktøjet kan ikke overskrive indhold, så hver version uploades som ny fil, og den gamle lægges i papirkurven.

---

## 6. Fælles regler (gælder alle tre sites)

- Jacob er ikke udvikler: forklar hvorfor, ikke kun hvad. Dansk til Jacob, engelsk på sites, kommentarer på dansk, commits på engelsk. Kort.
- "Kode ikke før jeg siger til" betyder præcis det.
- **Browserarbejde kun i Jacobs egen Chrome** (Claude in Chrome), aldrig i den indbyggede browser-rude — Jacob skal kunne se, hvad der sker. Sig hvad du gør før hvert skridt.
- **Hemmeligheder:** `.env` og API-nøgler læses aldrig og vises aldrig i chatten. Jacob indsætter selv nøgler (GitHub Secrets, Claude-miljøets "API credentials"). Tjek nøgler via længde/hash, ikke ved at se dem.
- Mål før du retter; mål efter. Når et script melder mange fejl på én gang, er scriptet mistænkt før koden.
- Ret undervejs, rapportér til sidst. Skærmbilleder ved designændringer, mobil og desktop.
- **Binære filer fra skyen til pc'en** (`device_commit_files`) får C2PA-metadata lagt ind, så SHA256 afviger. Tekstfiler: kontrollér med SHA256. Billeder, video og lyd: kontrollér indholdet (`ffmpeg -f streamhash -hash md5` / pixel-MD5), ikke filens hash.
- Git-arbejde på Windows (Desktop Commander PowerShell), aldrig fra Linux-VM'en. Targeted `git add`, aldrig `add .`. `git pull --rebase` før push på techfeedwatch (robotten pusher). Commit-beskeder skrives til `_commitmsg.txt` uden BOM.
- **Én session ad gangen på et repo.** Skift emne = ny samtale, der starter med at læse denne fil.
- Jacob dømmer bedst når han ser tingene i sammenhæng på sitet — vis hele sæt, ikke ét eksempel.
- **Scheduled tasks i Claude Code:** repoet skal vælges eksplicit i taskens indstillinger ("Select a repository") — prompten giver ingen adgang. "Needs permissions" i historikken = kørslen stod og ventede på et svar, der aldrig kom; regn den som tabt. En anden sessions samtale kan læses i Jacobs Chrome på `claude.ai/code/session_<id>`.
- **GitHub Actions' gratis minutter er pr. konto**, ikke pr. repo; kun private repoer tæller. Fejlen viser sig som et job, der dør på 5 sekunder uden log.
- **Robotten på GitHub og arbejde i repoet samtidig:** workflowet rebaser nu før push, men kørsler startet FØR et push kører på gammel kode (set 15/9: #524 måtte afbrydes). Pusher du robot-kode, mens en kørsel er i gang, så afbryd den og start en ny (Actions → Run workflow).
- **Chrome-udvidelsen skal have lov pr. site** (github.com har den; dash.cloudflare.com havde den ikke 15/9). "Permission denied for this domain" = bed Jacob tillade sitet i udvidelsen, ikke prøve igen.
- **Skyen kan ikke tale med GitHubs API** (proxyen kræver `add_repo`); pc'ens Linux-VM kan læse det offentlige API, men ikke hente log-filerne (blob-domænet blokeret) — logs læses i Jacobs Chrome på kørslens side (klik trinnet ud, `get_page_text`).
- **Skyens netværk kan ikke nå gentleaiguide.com** (403 fra proxyen) — levende tjek af dét site sker fra Jacobs pc (PowerShell `Invoke-WebRequest`). techfeedwatch.com kan nås fra skyen.

---

## 7. Dagbog (nyeste øverst)

### 2/11-2026 kl. 12:05 - Ugentlig aflæsning af Search Console (niende punkt) + links
- **Indeksering står helt stille, og grunden er målt:** 41 indekserede / 889 ikke indekserede - bit for bit identisk med 26/10, og alle syv viste årsager uændrede (Registreret 561, Omdirigering 147, Dublet-bruger 65, 404 63, Crawlet 49, robots.txt 3, Dublet-Google 1). "Seneste opdatering" står fortsat på **23.10.2026**: Google har ikke genberegnet indekseringsdata i de syv dage, så der var intet nyt datasæt at læse. Sitemappet voksede 628 -> 646 adresser (+18).
- **Ny i brugerfladen:** valideringen for "Side med omdirigering" er skiftet fra "Startet" til **"Mislykkedes"** - den validering, der kørte 26/10, fejlede. De øvrige står som før.
- **Effektiviteten delte sig** (rullende 28-dages vindue, 4/10-31/10): klik 28 -> 26, eksponeringer 42 -> 56, klikrate 66,7 -> 46,4 %, position 3,1 -> 2,6. Flere eksponeringer, lidt færre klik. Jeg har ikke målt hvorfor.
- **LINKS - det største hul flyttede sig:** eksterne links **1 -> 5**. Tre nye linkende sites: github.com (2 links), about.me (1), pinterest.com (1); alternativeto.net står stadig. Alle fem peger på forsiden - ingen artikelside har endnu et eksternt link. Interne links 338 -> 333 (Googles stikprøve). Bing Webmaster Tools var logget ind, men Backlinks viser fortsat "No data available" -> `bing: null`.
- **Skrevet ned:** niende punkt i `search-console-serie.json` og tredje punkt i `link-serie.json`; `node serie.mjs` passerer alle tre kontroller (9 punkter), `link-serie.json` er gyldig JSON med 3 punkter. Commit `a7fb7dcd` er set på `origin/main`.


### 27/10-2026 kl. 11:47 - Pris, spild og kvalitet (26/10 eftermiddag til 27/10)
- **Filmora-artiklen uden AI-billede (26/10):** ny robotartikel; billedet blev afvist 2 gange for tekst ("text to video" + manuskript/undertekster i resuméet). Genskabt lokalt med samme afvisning; en prompt uden tekst-ord gav et rent billede, sat på live (`fe0a3e21`). 27/10: robotten laver nu selv et 3. forsøg med den prompt, når et billede afvises for tekst (`3ceee401`, testet 2 af 2 godkendt; ca. 0,03 USD ekstra, kun når det sker).
- **Omskrivning:** 8 om dagen var for dyrt (Jacob) - nu 4 om dagen (`d3c9705a`).
- **Prisen (Jacobs skærmbillede fra AI Studio: 306 kr. på ét døgn):** Google Cloud-fakturaen 20.-26/10 = 418 kr.: søgninger 228 kr. (2.471 stk., første gang betalt - de 5.000 gratis om måneden var brugt), tekst ud 143 kr., tekst/video ind 33 kr., billeder ca. 13 kr. Spidsen 25/10 var mine testkørsler. Pristælleren prissætter nu hver søgning med 0,014 USD; robot-, omskriv-, faktatjek- og stikprøvelog gemmer pris og antal søgninger; morgenrapporten viser "Hele døgnets pris" opdelt + "Google-søgninger" (`d3c9705a`, `5dfd1f63`). Set i rapporten 27/10: 6,14 USD og 97 søgninger. Normal drift skønnes ca. 3.000 søgninger/md. = under den gratis grænse.
- **Faktatjek (Jacobs valg):** kun artikler, stikprøven har fundet fejl i (+ opgivne omskrivninger), højst 20 min. De øvrige gamle artikler venter på omskrivning med fuld slutkontrol - ellers betales der to gange (`5dfd1f63`). 27/10: 0 artikler, 0 kr.
- **Belæg-tjekket søgte ikke:** målt 0 af 9 kald (lav, medium og ingen tænkning, også med "You MUST search"). Citat fra hukommelsen, der ikke stod på siden, blev dømt som fejl - også i rigtige sætninger. Nu: uden søgning kan svaret kun bekræfte, ikke dømme; skeptikeren afgør (`4044b653`).
- **27/10 morgen: robotten 1 artikel på 10 kørsler (4,93 USD), omskrivningen 2 af 4.** Smidt ud efter betaling: "kunne ikke køre" (Gemini) 2 gange og "fanget sætning kunne ikke findes" 2 gange. Årsager: Nodes fetch giver op efter 5 min (set live under måling) og to fund på samme sætning (målt: alle 6 fund i 5 udgivne artikler kunne findes igen). Rettet (`2d725df5`): 10 min ventetid (undici, testet på Node 22 og 26), 3 forsøg med pause i skeptiker og belæg, et belæg-kald der fejler giver "usikre" i stedet for stop, dobbeltfund springes over / rettes i den sætning der ligner mest; reelt tvivlsomme fund stopper stadig artiklen og logges. Tests: 5 nye + 13 slutkontrol + hjerne grønne.
- **Jacob:** sætter selv månedsloft i AI Studio ("Set spend cap", fx 1.000 kr.).
- **Opfølgning 3/11:** artikler pr. dag, smidte artikler, dagspris. Derefter beslutning om skeptikeren skal tvinges til at søge (skøn 10-25 søgninger pr. artikel, 0-300 kr./md.; prøves på 3 artikler først).
- **Det bør Jacob vide:** skeptikeren søgte 0 gange i 7 kald i min måling - den tjekker mest mod researchen og sin egen viden. Den ene omskrivning 27/10 stoppede med god grund (ubesvaret delspørgsmål).
- Lære: Pristælleren talte søgningerne, men prissatte dem ikke, og jeg sammenlignede den kun med sig selv. Et måleværktøj for penge skal stemmes af mod den rigtige regning (Cloud-fakturaen), før tallet gives videre.
- Lære: Jeg kaldte faktatjekket "dobbeltarbejde" uden at have læst koden - det var forkert. Læs koden, før en anbefaling gives.
- Lære: At et kald er sat op til at søge på Google, betyder ikke, at det søger. Mål det (groundingMetadata), før en dom bygger på det.
- Lære: "Midlertidig fejl hos Gemini" var vores egen 5-minutters grænse. En fejlbesked skal have årsagen med, ellers rettes det forkerte.


### 19-20/10-2026 - AI Second Brain: undersøgt (Hasans metode), plan foreslået - intet kodet
- Hasans "AI Second Brain" (learnwithhasan.com/guide/ai-second-brain) = markdown-filer i et privat GitHub-repo (identity: core/voice/beliefs + daterede vidensnoter); INGEN vektordatabase, og SimplerLLM bruges slet ikke i opskriften. Formål for Jacob: artikler der lyder som ham (Googles krav om menneskelig indsats/originalitet, åbent punkt 1/10).
- Plan foreslået: B (lokal hjerne, testes på 2-3 artikler, Jacob dømmer) -> derefter A (hjernen kobles på robottens Gemini-prompt via privat repo - techfeedwatch-repoet er offentligt, så hjernen må IKKE ligge der). VPS-udgaven (BrainOutside, ~14 $/md.) fravalgt indtil videre.
- NotebookLM (hedder nu "Gemini Notebook") undersøgt: god FØDEKANAL (taleoptagelser, noter, Goals-instruks op til 5.000 tegn), men ingen API til almindelige konti -> kan ikke være hjernen selv. Jacobs notebook er tom endnu; huskeliste med spørgsmål leveret i chatten. Venter på Jacobs input.


### Ældre dagbog og Bilag A → `STATUS-ARKIV.md`
- Dagbogen fra 7/10-2026 og tilbage samt Bilag A (afsnit 0, som det stod 6/10) er flyttet ordret til `STATUS-ARKIV.md` i samme mappe (14/10, for at statusfilen kan læses hurtigt i hver ny session). Søg dér, når en ældre beslutning eller "Lære:"-linje skal findes.
- Regel: dagbogsindgange ældre end 7 dage flyttes til arkivet ved næste opdatering. Arkivet får nyeste flytning øverst.
