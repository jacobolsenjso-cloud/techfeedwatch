# Status på Jacobs tre sites

Samlet 8. september 2026, opdateret 16. oktober (**version 154** — brug kun v154). Målt direkte i repoerne og på de levende sites — ikke afskrevet fra ældre dokumenter.

**Sådan bruges filen:** Start en ny session med "Læs `C:\Users\jacob\techfeedwatch\HOVEDPROMPT.md` og derefter `STATUS-ALLE-SITES.md`". Hovedprompten er arbejdsformen (og har faldgrubelisten); denne fil er, hvor vi står. De ældre dokumenter (se afsnit 5) er baggrund. **Koden i repoerne er altid facit.** Afsnit 7 er dagbogen — nyeste øverst.

## 0. Hvor vi er lige nu (16/10-2026 kl. 10:37) — læs dette først i en ny tråd

**Start sådan:** læs `HOVEDPROMPT.md` først (arbejdsform og faldgrubeliste), derefter dette afsnit. **Koden er facit.** Afsnit 2–4 er baggrund og kan være forældede; dagbogen (afsnit 7) viser den sidste uge, nyeste øverst. Ældre dagbog og Bilag A ligger i `STATUS-ARKIV.md` (flyttet 14/10) — læs den kun, når en ældre beslutning skal findes. Ret dette afsnit, hver gang noget ændrer sig, og slet det, der er løst.

**Seneste for techfeedwatch (18/10-2026 kl. 14:25, live `f2d0708c`): LIVE. Knaprækken under sticky video viser nu, at der er flere knapper: svag toning ved højre kant (væk ved enden) + et roligt kig 60 px til højre og tilbage de første 2 gange pr. læser. Afstanden mellem knaprækken og listen er 12 px (før 31) og bygger på rækkens målte højde, så den holder ved alle skriftstørrelser. Knapperne skifter listen blødt (0,12 s ud + 0,2 s ind; video og knapper står stille). Service workeren bruger navigation preload (~100 -> ~40 ms ekstra pr. sideskift). Glidende sideskift, kort blinker ikke, sticky video glider ind/ud. Forhåndshentning ligger der, men er ikke set virke.** FAST REGEL: videodelen ændres aldrig uden Jacobs ja til netop den del. "New look"-boble til og med 24/10. **Næste:** Jacob prøver afstanden, kig og toning på sin telefon (kigget kommer kun de første 2 gange pr. browser); tjek Googles ikon ca. 25/10; slå Jacobs localhost-testtilmelding fra med ok; slet boblen efter 25/10; tjek 1/11 at kurserne kom; 9 forældreløse billeder + og-default-v2.png kan slettes med Jacobs ok.

### techfeedwatch.com — målt 15/10
- **Live:** `a01022e8` (se `https://techfeedwatch.com/build.json`). **432 artikler** (`https://techfeedwatch.com/robot-status.json`), seneste robotartikel 15/10 kl. 11:29 dansk.
- **Plan:** den nye opskrift ("søgning først"), artikelsiden og AI-billederne er live siden 13/10; de gamle artikler skrives om (5/dag). Næste beslutning: hvordan sitet opfylder Googles krav om menneskelig indsats og originalitet (1/10), før AdSense nr. 4, som Jacob selv sender.
- **Overvågning:** `robot-status.json` (står `lastArticle.at` mere end et døgn tilbage, er noget galt), `build.json` (hvilken commit der er live), workflowet "Tomgangsalarm" (3 gange i døgnet; rød kørsel og mail ved 36 timers tomgang).
- **Ældre åbne punkter, ikke genmålt 6/10 (detaljer i Bilag A i `STATUS-ARKIV.md`):** Search Console-måleserien (ugentlig aflæsning, seneste i git 5/10), miniature-fejlen for Shorts, brandsuffikset i `<title>` måler tegn i stedet for bredde, VideoObject uden `duration`, beslutningen om hvad Jacob selv skriver ("menneske i loopet"), AlternativeTo-forslaget.

### techmediaarch.com — målt 6/10 (kun læsning)
- Kører på Astro (Cloudflare Workers) siden 25/9; forsiden svarer 200. GitHub `origin/main` = `13e2dc9` (6/10 kl. 11:29, "Robot: 1200-word minimum, more research, merge single sentences"). Repoet har 194 artikelfiler og 17 sider. AdSense-godkendt.
- Robotten udgiver selv (pr. 27/9: højst 2 om dagen, fri tirsdag og fredag). Sitet har ingen `robot-status.json`.
- Seneste status står i `OVERLEVERING-techmediaarch.md` og dagbogen 29/9. **Afsnit 3 er forældet** (beskriver Blogger, målt 8/9).
- **Regel (Jacob 28/9): techmediaarch og techfeedwatch blandes ikke.**

### gentleaiguide.com — målt 6/10 (kun læsning)
- Forsiden svarer 200; 42 adresser i sitemappet; 27 guide-filer i repoet. GitHub `origin/main` = `f266d59` (5/10, pull request #6 flettet). **Afsnit 4 er forældet** (målt 15/9, 23 artikler). Næste milepæl (fra 25/9): AdSense ved ca. 30 artikler.

### Fælles
- Statusfilen får nyt versionsnummer ved hver opdatering; md, pdf og docx ligger i roden og i `Claude outputs`. Google Drive opdateres af Jacob selv.

---

## 1. Overblik

| Site | Platform | Tilstand i dag | Vigtigste næste skridt |
|---|---|---|---|
| techfeedwatch.com | Astro 7.3.8 + Cloudflare Pages, robot via GitHub Actions, startet af Cloudflare-Workeren `tfw-starter` | **436 artikler** (målt 16/10), live `71d3a34d`. Robotten starter hver time; højst 3 nye artikler og 3 omskrivninger om dagen (16/10); tidligt stop A+B; faktaboks "Key facts" på nye/omskrevne artikler. Morgenrapport ca. 09:37. | Mål pris, A+B og faktabokse 17/10; plan for artikler uden video (punkt 3); primære kilder (punkt 5). |
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

### 18/10-2026 kl. 14:25 - techfeedwatch: afstanden under knaprækken bygger på rækkens målte højde (LIVE `f2d0708c`)
- **Jacob kl. 14:13:** "så skal det da rettes også... alt skal være perfekt" (efter jeg viste, at stor skrift fik listen ind under rækken).
- **Ændret:** `padding-top: calc(56.25vw + var(--chips-h, 55px) - 4px)`. Scriptet måler rækkens højde og lægger den på hele siden (`--chips-h` på html, før kun på knapområdet); en ResizeObserver måler igen, når rækken skifter størrelse. Toningen ved højre kant bruger samme måling.
- **Målt live:** bredde 320-430: liste 12 / artikel 11 px; skrift 125/150/175/200 %: 12 px hver gang (række 60/63/68/72 px); skrift skiftet til 200 % MENS sticky er åben: 12 -> 12 px, toning 72 px = rækken; mørk tilstand ens; scroll dækket; ud af sticky = 0 px; bløde skift, kig 2 gange og desktop uændret; 0 fejl.
- **Lære:** når en plads regnes ud fra et elements højde, så brug den målte højde - et fast tal (55 px) holder kun ved standardskrift. Test altid også med forstørret skrift.

### 18/10-2026 kl. 14:15 - techfeedwatch: 12 px mellem knaprækken og listen under sticky video (LIVE `bb8d540c`)
- **Jacob sagde ja kl. 14:00** ("du sætter den ned til 12 px ... Tjek også om der er fejl").
- **Ændret (én linje):** `body.cinema-mode .video-primary { padding-top: calc(56.25vw + 51px) }` (før `56.25vw + 15px + 55px`). Kun telefon i sticky-tilstand; desktop uændret (padding 0).
- **Fejltjek live:** bredde 320/360/375/390/412/430: liste 12 px, artikel 11 px overalt; rækken dækker stadig indholdet ved scroll; ud af sticky igen = 0 px som før; mørk tilstand ens; større skrift 125 % = 7 px, 150 % = 4 px (ingen overlap); de bløde skift (Related 235, For You 235, AI & Tech 221, Read Article, to hurtige tryk) og kigget 2 gange virker stadig; desktop uden fejl; 0 fejl i alt.
- **Kendt grænse (målt, skrift forstørret i testbrowseren):** knaprækkens højde (55 px) er fast i regnestykket, som før. Ved 175 % skrift går listens øverste kant 1 px ind under rækken, ved 200 % 5 px (før ændringen var der stadig ca. 14 px luft ved 200 %). Kan gøres robust ved at bruge rækkens målte højde (`--chips-h`) - det er en ændring i videodelen og kræver Jacobs ja.

### 18/10-2026 kl. 14:10 - techfeedwatch: kigget kører 2 gange; afstanden under knaprækken undersøgt (LIVE `c73cd811`)
- **Jacob kl. 13:50:** "det skal ske de første 2 gange, 1 gang er for lidt" + "vi kigger på afstand under rækken".
- **Lavet:** tælleren `tfw_chips_kig` i browseren tæller nu op til 2 (før: ja/nej). Målt live: ny læser - kig 1. gang (tæller 1), 2. gang (2), ikke 3. gang; læser med det gamle "1" får præcis én til; 0 fejl.
- **Afstanden (kun undersøgt, intet ændret - videodelen er fredet):** 31 px mellem knaprækkens bund og første kort, både ved 390 og 360 bredde, og 30 px til artiklen under Read Article. Årsag: `body.cinema-mode .video-primary { padding-top: calc(56.25vw + 15px + 55px) }` reserverer plads til rækken + 15 px, og siden har i forvejen 15 px luft over indholdet - de to lægges oven i hinanden. Forslag: `calc(56.25vw + 51px)` = 12 px, samme luft som mellem kortene. Prøvet kun i testbrowseren: liste 12 px, artikel 11 px, rækken dækker stadig indholdet ved scroll. Venter på Jacobs ja.

### 18/10-2026 kl. 13:40 - techfeedwatch: knaprækken under sticky video viser, at der er flere knapper (LIVE `afb7ad6b`)
- **Jacob:** knapperne bør vise, at rækken fortsætter mod højre. Mit forslag (kig + kanttoning) godkendt kl. 13:25 ("du koder dit forslag").
- **Lavet:** (1) svag toning (44 px) ved højre kant af rækken i sidens baggrundsfarve - lys og mørk tilstand - forsvinder, når man har swipet til enden, og kommer igen, når man swiper tilbage. (2) Første gang en læser får sticky video, glider rækken 60 px til højre og tilbage (ca. 1 sek., starter 0,7 sek. efter videoen sætter sig). Kun én gang pr. læser (husket i browseren), stopper straks ved berøring, springes over ved "reducer bevægelse". Selve videodelen og knapperne er ellers uændrede.
- **Målt live på mobilskærm (390x844, touch, ren Chromium):** toning ligger præcis over rækken (top 279, højde 55 = rækkens); synlig ved start (1), væk ved enden (0), tilbage ved start (1). Kig: 0 -> 60 -> 0 px på ca. 1,05 sek.; andet forsøg kører ikke; berøring midt i kigget stopper det (blev stående ved 22 px, hvor fingeren tog over); reducer bevægelse = intet kig og intet husket; mørk tilstand toner i rgb(11,16,32) = rækkens baggrund; 0 fejl.

### 18/10-2026 kl. 13:11 - techfeedwatch: knapperne under sticky video skifter listen blødt (LIVE `d8378c3d` + `7bd5ed87`)
- **Jacob: skiftet ved knaptryk er for hurtigt - "kan man lave en lille forsinkelse?"** Forslag sendt før kodning (videodelen er fredet); Jacob sagde ja kl. 12:59.
- **Lavet:** knappen markeres straks; kun indholdet under knapperne (listen eller artiklen) toner ud på 0,12 sek., skiftes, og det nye toner ind og glider 8 px op på 0,2 sek. Videoen og knapperne rører sig ikke. Et nyere tryk vinder. "Reducer bevægelse" = med det samme som før. Ren pause uden bevægelse fravalgt (føles som en langsom side).
- **Fundet ved test og rettet (7bd5ed87):** i en fane, der ikke tegner billeder (Jacobs Chrome-vindue tegnede 1 billede pr. ½ sek. under testen), blev udtoningen aldrig "færdig", og trykket gik tabt (listen skiftede ikke). Nu skiftes der under alle omstændigheder efter højst 250 ms. Bekræftet i samme fane: All 440, Related 235, Read Article viser artiklen.
- **Målt live på mobilskærm (390x844, touch, ren Chromium):** knap markeret straks; listen halvvejs udtonet efter 60 ms (0,04-0,26); slut helt synlig (1,00) med rigtige tal (Related 235, For You 235 = samme emner uden læsehistorik, AI & Tech 221); Read Article viser artiklen; to hurtige tryk Related->All ender på All, 440 kort, synlig, 0 hængende animationer; 0 fejl.
- **Lære:** test også i en fane, der ikke tegner (baggrund/skjult vindue) - animationer, der venter på "færdig", kan hænge dér; en tidsgrænse som sikring hører med.


### 18/10-2026 kl. 12:48 - techfeedwatch: service workeren henter sider samtidig med at den vågner (navigation preload) (LIVE `f463d3c8`)
- **Jacob sagde ja** til forslaget efter undersøgelsen af forhåndshentning.
- **Ændret (public/sw.js):** navigation preload slås til, når den nye service worker aktiveres, og sidevisninger bruger det forhåndshentede svar. "Netværket først" og reservesiden uden net er uændret. Ny version tfw-4e5e449926 (gamle cacher ryddes som altid ved ny version).
- **Målt (ren Chromium, live site, median pr. sideskift):** før: 288 ms med service worker mod 186 ms uden (16 sideskift hver) = ~100 ms ekstra. Efter: 217 ms med mod 177 ms uden (24 sideskift hver) = ~40 ms ekstra. Navigation preload bekræftet slået til i browseren. Uden net: besøgt side vises fra cachen ("Latest"), ubesøgt side giver reservesiden ("You're offline") - som før.
- Resten af ekstratiden (~40 ms) er service workerens eget led; den kan kun fjernes ved at lade være med at håndtere sidevisninger, og så forsvinder offline-reservesiden. Ikke foreslået ændret.


### 18/10-2026 kl. 12:34 - techfeedwatch: knapperne under sticky video skifter med det samme igen (LIVE `5cd53f77`) + undersøgelse af forhåndshentning
- **Jacob (mobilvisning): knapperne under den sticky video "skifter meget hurtigt ... kører ikke som den skal".** Fast regel gentaget: videodelens opsætning må ikke ændres uden at spørge ham først.
- **Årsag (min egen ændring 90593cad, forslag 3):** jeg havde også lagt den bløde overgang på knapperne All/Related/For You/Read Article/emner, så hele skærmen tonede ud og ind (~0,4 sek.) ved hvert tryk. Funktionen var korrekt (All 440, Related 235, For You 435, AI & Tech 221, Read Article viser artiklen, 0 fejl).
- **Rettet med Jacobs ja:** knapperne skifter med det samme, præcis som før i dag (koden er identisk med før, kun en kommentar tilføjet). Overgangen ved ind/ud af sticky video er beholdt. Målt live: ind 1 overgang, 6 knaptryk 0 overgange, ud 1 overgang, 0 fejl.
- **Forslag 2 undersøgt (forhåndshentning):** virker ikke i nogen browser, jeg kan teste - Jacobs Chrome 155 og en ren Chromium (Playwright), med OG uden service worker, også med en "hent straks"-regel. Testbrowsere styret af værktøjer kan selv slå forhåndshentning fra, så det er ikke bevist, at den virker eller ikke virker hos almindelige læsere. Reglen er ufarlig og bliver liggende.
- **Fund ved målingen:** sitets service worker gør hvert sideskift langsommere: median 374 mod 194 ms og 229 mod 176 ms (8 sider, to runder) med/uden. Artiklens HTML er kun 52 KB komprimeret (199 KB ukomprimeret) og kommer på ~0,27 s direkte fra Cloudflare - det er altså ikke sidevægten, men service workerens ekstra led. Løsningsforslag ("navigation preload": netværket hentes samtidig med at service workeren starter) sendt til Jacob - ikke kodet.
- **Lære:** en overgang, der passer til ét skift (ind/ud af sticky video), passer ikke til knapper man trykker på igen og igen; og jeg lagde den på videodelens knapper uden at nævne det specifikt - videodelen: hver enkelt del skal nævnes og godkendes for sig.


### 18/10-2026 kl. 12:10 - techfeedwatch: glidende sideskift, roligere kort, sticky video som én bevægelse (LIVE `2726131e` + `90593cad`)
- **Jacob: "alle de skift ... skal køre meget mere glidende"**, valgte forslag 5 (mål) -> 1+2 -> 4 -> 3 til sidst; "du koder".
- **Målt før (Jacobs Chrome, desktop):** CLS (hvor meget siden hopper) var allerede ~0 (forside 0, artikel 0, emne 0,0093, Latest 0, værktøj 0) - hakket kom ikke fra hop, men fra hårde sideskift og fra at synlige kort blev gjort usynlige og tonet frem (artikel 2, emne 4, Latest 5 kort pr. sidevisning). PageSpeed-API'et var spærret (dagskvote 0 uden nøgle); lokal Lighthouse gav ingen rapport - droppet.
- **1 Bløde sideskift (view transitions):** indholdet toner over med et lille løft (150/280 ms); topbjælke og computerens menu står stille; kortets billede glider over i artiklens topbillede. Målt live: overgangen kører (pageswap: overgang=true, ét navngivet kortbillede, artiklens eget navn slået fra -> ingen dobbelt-navne). Chrome/Edge/Safari 18.2+; Firefox som før; fra ved "reducer bevægelse".
- **2 Forhåndshentning (speculation rules, prefetch ved hover/tryk):** lagt ind, men IKKE set virke i Jacobs Chrome 155 - heller ikke med en "hent straks"-regel; siden kom fra nettet (735-853 ms). Sandsynlig årsag: sitets service worker håndterer hver sidevisning. Ufarlig at have; ikke bevist. Fund: en artikel er ~198 KB over nettet (285 ms ventetid + 437 ms download) - det er den egentlige ventetid.
- **4 Kort:** kort på skærmen ved start vises straks (målt: 0 skjulte på Latest/emne/artikel, før 5/4/2); resten toner frem på 0,35 s/8 px (før 0,65 s/16 px). CLS efter: 0 på emne/artikel/Latest.
- **3 Sticky video (Jacobs ja; videodelen ellers fredet 12/10):** ind/ud af biograf-tilstand og skift liste/artikel under videoen kører som én overgang: videoen glider som ét objekt (samme 280 ms som Jacobs valg 12/10), resten toner over, springet til toppen skjules, listen tegnes inde i overgangen. Gentagne "afspil"-signaler starter den ikke igen. Gammel FLIP er reserve. Målt live (desktop, ?slow): ind og ud uden fejl, billede taget på ~21-25 ms, færdig på ~380-400 ms, navnet ryddet bagefter. Ikke set på en rigtig telefon endnu.
- **Lære:** PageSpeed-API uden nøgle har kvote 0; mål i Jacobs Chrome med PerformanceObserver i stedet. Og "seen working" holdt ikke for forhåndshentningen - skrevet som ikke-bevist i stedet for at antage.


### 18/10-2026 kl. 11:27 - techfeedwatch: afspil-ikonet ▶ fjernet fra alle artikelkort + blødt løft ved tryk på telefon (LIVE `4b3c68a4`)
- **Jacob: "de skal også væk"** (▶ antyder video, men kortene åbner en artikel) **+ "kan man ikke lave en lille effekt når man trykker ... hopper lidt op blødt".**
- **Fjernet:** ▶ alle 15 steder (forside x3 + forsidens JS-kort, emnesider, emnesider side 2+, Latest, Library, arkiv, side 2+, søgning, History, Best of each topic, Related articles, Up Next) + CSS-reglerne - 29 linjer i 12 filer. TOC-mærket ▶ ved videoafsnittet i artiklen er bevaret (dér ER det en video).
- **Ny tryk-effekt (MainLayout, gælder alle sider):** på telefon/pen løfter kortet sig 5 px og 2 % større med blød skygge, mens fingeren er på det. 60 ms forsinkelse, så kort man ruller forbi ikke hopper (pointercancel). Computeren har stadig sit eget løft ved hover. Slås fra ved "reducer bevægelse". Gælder artikelkort, sticky-listen og anbefalingerne i artiklen.
- **Målt live i Jacobs Chrome (4b3c68a4, Cloudflare success):** 0 ▶ på forside, Latest, Library, Best of each topic, søgning, History, emneside og artikel. Simuleret fingertryk på /latest/: kortet får løft (matrix 1.02, -5 px) og skygge; tryk der bliver til rulning: intet løft; efter slip: 0 kort løftet.
- **Lære:** første måling af løftet viste "intet" (taget mens overgangen stadig kørte); målt igen bagefter: løftet var der. Mål en animation efter den er færdig, ikke midt i.


### 18/10-2026 kl. 11:06 - techfeedwatch: sticky-listen på mobil viser artiklens billede, ikke YouTube-miniaturen (LIVE `c4a55d53`)
- **Jacob så det selv på mobilen:** listen under den sticky video viste kildevideoernes YouTube-miniaturer + videolængde. Det lignede "næste video" på YouTube, men et tryk åbner en artikel om et andet spørgsmål end miniaturen viser. Beslutningen 13/10 (artiklens AI-billede overalt) havde overset netop denne liste.
- **Rettet (Jacobs ok, selvom videodelen ellers er fredet 12/10 - kun billede og tal ændret, ikke funktionen):** kortene bruger /kort/<slug>.webp med lazy-loading; videolængden fjernet.
- **Fundet ved dobbelttjek og rettet:** hvert 4. kort var en annonceplads med annonce-id "XXXXX" (pladsholder) og dansk mærkat "Annonce" - kunne kun vise en tom boks; fjernet (AdSense' automatiske annoncer placerer selv). Luk-knappen havde dansk skærmlæser-tekst ("Luk fastlåst video") på et engelsk site -> "Close pinned video". Før blev alle ~440 YouTube-miniaturer hentet på én gang; nu kun dem på skærmen.
- **Målt live i Jacobs Chrome (c4a55d53):** 440 kort, 440 med artiklens billede, 0 YouTube-miniaturer, 0 tidsangivelser, 0 annoncebokse; de 8 første billeder indlæst, 416 venter til man scroller. Skærmbillede på mobil (lokal forhåndsvisning af samme kode).
- **Ikke rettet (Jacobs afgørelse):** afspil-ikonet ▶ på artikelkort findes 15 steder på sitet (forside, emner, Latest, Library, arkiv, søgning, History, Related articles m.fl.) og antyder video - spurgt.
- **Lære:** Chrome uden vindue hang på artikelsiden, fordi YouTube-rammen aldrig blev færdig; peg YouTube- og annoncedomæner væk (--host-resolver-rules) og mål med en side, der venter aktivt i stedet for faste pauser.


### 17/10-2026 kl. 22:50 - techfeedwatch: menuen siger "Best of each topic" (LIVE `ec8cdadd`)
- **Jacob: "du retter menuen også".** Menupunktet hed "Best by Topic", mens siden, sitemap og om-/start-siderne siger "Best of each topic". Kun ét sted i koden (MainLayout.astro).
- **Målt:** skærmbilleder mobil (menu åben) + desktop - teksten står på én linje begge steder. Live (ec8cdadd, Cloudflare success): forside, /popular/, /about/ og en artikel har det nye navn, 0 steder med "Best by Topic".


### 17/10-2026 kl. 22:37 - techfeedwatch: guides, ordliste og værktøjer siger nu ærligt "written with AI" (LIVE `880231b5`)
- **Jacob valgte** "planned, checked and maintained by me"; Claude tilføjede "written with AI", fordi sætningen alene stadig lader læseren tro, at Jacob har skrevet teksten.
- **Rettet:** about (to steder), start-here (to steder), editorial guidelines, forfatternoten under alle guides og slutlinjen i 8 guides ("Written and maintained by Jacob S. Olsen." -> "Planned, checked and maintained by Jacob S. Olsen, and written with AI."). Rettelsespolitikken: beskrivelsen "Written and maintained" -> "Maintained", den gamle opskrift ("videos as research material") rettet, "Last reviewed October 2026".
- **Målt live (880231b5, Cloudflare success):** alle 224 sider undtagen artikler og artikellister gennemsøgt for 20 forældede formuleringer: 0 fund. Ny tekst bekræftet på about, start-here, editorial-guidelines, corrections og to guides.
- **Lære:** v142-tjekket dækkede kun de 10 sider, jeg selv havde rettet, så rettelsespolitikken med samme gamle opskrift slap igennem. Et tjek af en tekstrettelse skal søge alle byggede sider, ikke kun dem, jeg ved, jeg har rørt (_tjek-alle-sider.mjs gør det nu).


### 17/10-2026 kl. 22:27 - techfeedwatch: om-/start-/politiksider og /sitemap/ beskriver sitet, som det er nu (LIVE `dbb89eab`)
- **Jacob: "det skal også med eller rettes ... er der flere fejl, så ret dem også" + "husk /sitemap/".** Siderne målt mod koden (add-video.mjs, soegning.mjs, kildetjek.mjs, auto-youtube.mjs, MainLayout).
- **Fundet forældet:** about, start-here, terms, contact, author og editorial-guidelines beskrev den gamle opskrift (videoens transskript som eneste research, "independent creator", "højst fem om dagen"). Målt: 32 artikler har nu "## Sources" med websider; 3 omskrivninger om dagen 15.-17/10; dagsloft max 3 (kode). 59+ af 438 artikler bygger på store medier/firmaer (TED, Bloomberg, CNBC, IBM ...), så "independent creator" passede ikke.
- **Rettet:** ny opskrift beskrevet (Google-søgning, navngivne kilder, stærke/svage kilder, videoen som ét afsnit, regler for tal/afskrift/læsertjek, loft 3 om dagen). About + start-here har nu klokken, følg emner, 18 emner ({{TOPICS}} tælles fra src/lib/emner.mjs), daglig push-besked, Read later og History. "Guides ... one per subject" rettet (9 guides, 18 emner). Trends/popular: "draws on" i stedet for "comes from". Privatlivspolitik: skabelon-linjer om konti, køb, tilbud og affiliate-betaling fjernet. Kommentar i daily-update.yml (2-6 -> 2-3).
- **/sitemap/:** viste 8 af 50 værktøjer og 46 af 56 ordlisteord (3 kategorier manglede); manglede Start here, Latest, Best of each topic, Trends, Search og alle politiksider; linkede ikke til emnesiderne. Nu læses værktøjer og kategorier fra data. Målt live: 55 værktøjslinks (50 + 5 kategorier), 56 ord, 17 emner (PC Building & Gaming har 0 artikler og vises først, når den får en), 9 guides, alle artikler.
- **Målt live (dbb89eab, Cloudflare success):** 10 sider, 0 forældede formuleringer, alle beskrivelser højst 160 tegn. Skærmbilleder af /sitemap/ mobil + desktop.
- **Ikke rørt (Jacobs afgørelse):** fire steder siger, at guides, ordliste og værktøjer er skrevet af Jacob selv ("I write myself", "written and maintained by hand"). Git-historikken viser, at de er lavet af AI (Gemini-scripts + Claude-sessioner) efter Jacobs anvisning. Spurgt.
- **Lære:** Select-String fandt ikke en linje, som den fandt et kvarter før (author-siden) - et enkelt søg er ikke et bevis for "ingen fund"; slutmålingen skal køre på den byggede side (dist/live), ikke kun på kilden.


### 17/10-2026 kl. 21:50 - techfeedwatch: /about/ og /start-here/ tjekket - "summaries" fjernet (LIVE `871a584e`)
- **Jacob: "er disse sider opdateret?"** Læst live: navn (TechFeedWatch), logo og budskab (rigtige søgespørgsmål, klare svar, krediteret skaber) passer allerede.
- **Fakta målt:** 50 værktøjer = korrekt (50 sider; tools.ts' 55 inkl. 5 kategorier); 56 ordlisteord = korrekt; "two or three a day, fewer at weekends" = korrekt (sidste 28 dage: 2,5 pr. hverdag, 1,1 pr. weekenddag).
- **Rettet:** artiklerne blev stadig kaldt "summaries" tre steder, i strid med sitets egen beskrivelse: arkiv-boksen øverst på om-/start-siderne ("a machine drafted the summaries" -> "drafted the articles, with the videos as research"), Trends-forbeholdet og guide-forfatternoten. Bekræftet live på /about/, /start-here/, /trends/ og en guide.
- **Ikke tilføjet (Jacobs stemme - spørges først):** de nye funktioner (daglig push-besked, følg emner, 18 emner) nævnes ikke i "What is here".
- **Lære:** mit første tal for artikler pr. dag læste videoens dato (`publishedAt`) i stedet for artiklens (`date`) - tjek hvilket felt der faktisk betyder det, jeg måler.


### 17/10-2026 kl. 21:41 - techfeedwatch: 33 for lange sidebeskrivelser forkortet + vagt i buildet (LIVE `9369ea39`)
- **Jacob: "ja du går igang"** (anbefaling: forkort + ret ved kilden). Målt live: 14 sider over 170 tegn, men 33 over 160 (Googles grænse): 23 ordliste, 7 værktøjer, 2 guides, regelsiden. Alle 33 rettet til højst 155 tegn (artiklerne var allerede højst 155 - robotten har grænse).
- **Ordlisten:** nyt felt `metaDescription` KUN til Google; den synlige forklaring (`definition`) og DefinedTerm-schema beholder den fulde tekst (bekræftet uændret på 56/56 sider live).
- **Ved kilden:** `generate-glossary.mjs` beder nu også om en META-linje (højst 155) og gemmer den som metaDescription, når definitionen er længere (advarer ellers). Nyt `tjek-beskrivelser.mjs` kører sidst i hvert build og lister indekserbare sider over 160 tegn - advarer kun, stopper ALDRIG buildet (må ikke blokere robottens udgivelser). Første kørsel: "alle 662 sider er højst 160 tegn".
- **Vagterne i rettescriptet greb to af mine egne fejl før noget blev skrevet:** (1) nye tekster starter med samme ord som de gamle, så søgningen fandt sin egen indsatte tekst igen; (2) mit søgeværktøj fandt tekster på deres første 45 tegn og ramte dermed tools.ts/vaerktoej.mjs' EGNE korte tekster for GPU- og AI-værktøjet - længdetjekket stoppede overskrivningen.
- **Live (595 sider):** præcis de 33 planlagte ændret til præcis de planlagte tekster; længste nu 160; og:description = description overalt.
- **Lære:** jeg sagde "før det går live, viser jeg dig alle med før og efter" - og lagde det live uden. Et løfte om at vise før live holdes, også når Jacob har sagt "gå i gang".
- **Lære:** find tekster på HELE strengen, ikke kun begyndelsen, og behold længdevagten - den reddede to filer i dag.
- **Lære:** ved erstatning hvor ny tekst kan ligne den gamle: søg videre efter den indsatte tekst, aldrig fra start.


### 17/10-2026 kl. 21:14 - techfeedwatch: navnet hedder TechFeedWatch overalt + nye beskrivelser (LIVE `c8b2c1d2`) + Google bedt om at hente forsiden
- **Jacob: opdatér beskrivelserne til den nye "hvad TechFeedWatch er"** + valgte navnet **TechFeedWatch** (ét ord, som logo, titler og domæne); "Tech Feed Watch" beholdes kun som `alternateName` i schema, så søgninger på det gamle navn stadig rammer.
- **Målt først:** alle 595 sider i sitemap hentet live. Gammel beskrivelse fundet i: standardbeskrivelsen ("daily archive of the best AI, Tech, and SEO videos"), emneside-skabelonen ("curated tech videos turned into clear, readable articles" - AR & VR, Hardware & Chips, Quantum Computing), app-manifestet, RSS og llms.txt. Navnet med tre ord stod 100 steder i 48 filer (sider, layout, schema, copyright, byline, om/kontakt/vilkår/privatliv, guides, robottens prompts).
- **Ny beskrivelse (= forsidens overskrift):** "Straight answers on AI, tech, fintech and crypto. Every article answers a question people actually search for, in plain language. Updated daily." (145 tegn) - forside, standard og WebSite-schema. Emnesider uden egen tekst: "<emne> explained in plain language: straight answers to the questions people search for, each crediting the creator whose video it draws on." RSS, manifest og llms.txt omskrevet til samme budskab.
- **Rettescript med vagt:** stopper uden at skrive, hvis en tekst ikke findes præcis det forventede antal gange (stoppede én gang: tankestreg i kilden - rettet til mønster).
- **Tjek live (602 sider inkl. noindex-sider):** 0 "Tech Feed Watch" tilbage, og:site_name = TechFeedWatch overalt, alle sider har beskrivelse, beskrivelse = og:description overalt; 20 beskrivelser ændret (vist før/efter for Jacob). Manifest, RSS og llms.txt bekræftet live.
- **Search Console (Jacobs Chrome):** forsiden undersøgt (indekseret) -> "Anmod om indeksering" -> "Der er anmodet om indeksering" (prioriteret crawlkø). Googles gemte favicon i Search Console var stadig det gamle.
- **Ikke ændret (med vilje):** artiklernes egne beskrivelser (sidespecifikke, intet sitenavn i dem); 14 ordliste-/regelsider har beskrivelser over 170 tegn (Google afkorter) - kan forkortes senere.
- **Lære:** mit søgeværktøj udelukkede ".astro" som mønster og sprang dermed ALLE .astro-filer over - gennemgangen "0 rester" i v138 manglede skabelonerne. Gentaget med rettet værktøj: farverne var stadig rene. Fremover: test et søgeværktøj på et kendt fund, før "0 fundet" troes.
- **Lære:** PowerShell `Select-String -Path` med [klammer] i filnavnet finder stille ingenting (klammer = jokertegn) - brug `-LiteralPath`.
- **Lære:** min vente-løkke på buildet reagerede på ordet "error" i en artikels adresse og læste resultatet for tidligt - vent kun på buildets egen slutlinje.


### 17/10-2026 kl. 20:58 - techfeedwatch: gennemgang af ALLE steder det gamle logo kan sidde (Jacob: "du tjekker alle steder")
- **Koden (alle filer undtagen artikler/node_modules):** søgt efter gammel teal, pink, gamle mørke farver, og-default/-v2, favicon v1/v2, gammel logotekst: 0 rester på sitet (3 fund: 2 er den nye AI Video-farve, 1 er en intern rapportskabelon i retitle-to-demand.mjs, ikke på sitet).
- **Live, filer andre tjenester læser:** Googles logo-felt (Organization + artiklernes Article-udgiver) = /icon-512.png (nyt); og:image = og-default-v3.png på forside/guides/guide-side/værktøj/emne/ordliste, /og/<slug>.jpg på artikler (nye); manifest = nye ikoner + #2563eb; offline-siden har nyt logo; RSS har intet logo; ingen browserconfig. Push-ikonet = /icon-192.png (nyt).
- **Cache-lag:** server/CDN 182/182 ens (v136); service worker rettet (v137); browser-cache max 4 t (retter sig selv).
- **techmediaarch.com + gentleaiguide.com:** ingen links/billeder til TechFeedWatch - intet at opdatere.
- **Kun Jacob/tredjepart kan opdatere:** Googles søgeresultater (favicon/logo - ved næste crawl, kan fremskyndes i Search Console), allerede delte links på Facebook/LinkedIn/X (genhentes via deres delings-værktøjer), profilbilleder på sociale medier/YouTube med gammelt logo, installerede app-ikoner på telefoner (styresystemet opdaterer selv).
- **Lære:** "tjek alle steder" = en fast liste: kode, server/CDN, service worker, browser-cache, filer andre tjenester læser (schema, og, manifest, RSS, push), egne andre sites, tredjeparter. Bruges ved hver udskiftning af filer under samme adresse.


### 17/10-2026 kl. 20:48 - techfeedwatch: Safari-billeder undersøgt + service worker fornyer nu billeder (LIVE `eddc3c89`)
- **Jacob: "fejl på Safari - kan ikke se billederne"** (lånt Mac fra 2013, skærmbillede: alle AI-billeder viste "?").
- **Undersøgt:** filerne er gyldige WebP/JPEG (chunks tjekket); WebKit 26 (Playwright, iPhone + Mac, også som tilbagevendende besøgende med service worker) viste ALLE billeder. AI-billedernes opbygning (VP8X + XMP) er uændret siden 13/10 - dagens logoarbejde var ikke årsagen. Testside "Safari billedtest" (artifact) med 6 varianter: heller ingen vist på den lånte Mac.
- **Årsag (meget sandsynlig):** Safari på macOS 10.15 og ældre bruger systemets billedmotor, som ikke kender WebP. Mac fra 2013 = højst macOS 10.15/11. Ikke en fejl på sitet; gælder alle sites med WebP. Anbefalet: ingen JPEG-reserve (meget få besøgende).
- **Ægte fejl fundet undervejs og rettet (Jacob: "alt hvad der kan opdateres, skal opdateres"):** service workeren viste billeder fra sin gemte kopi og fornyede den ALDRIG - tilbagevendende læsere så gamle billeder (uden nyt logo). Og versionsnavnet talte ikke sw.js selv med, så gamle kopier blev heller ikke ryddet.
  - Nu: gemt kopi vises straks, frisk udgave hentes altid i baggrunden (`cache: 'no-cache'`, 304 hvis uændret) og gemmes til næste visning. Billeder i egen cache med loft på 400 (før uden grænse).
  - `stamp-sw.mjs`: sw.js' egen kode indgår i versions-id'et -> ny version `tfw-dff3e2ddf6` (før `0cbec0d867`), gamle caches slettes ved aktivering.
  - Testet på isoleret testsite i Chromium OG WebKit: udskiftet billede vises ved næste visning; besøgende med GAMMEL service worker får nyt billede ved 3. sidevisning og de gamle caches slettes. Den gamle fejl genskabt i samme test.
  - Live: sw.js har ny version + ny kode; i Jacobs Chrome er ny service worker aktiv, gamle caches væk, ny billed-cache fyldes.
- **Lære:** min WebKit-test (Linux, libwebp) kan ikke fange Safari på Mac, der bruger Apples egen billedmotor. Ved "virker ikke i Safari": spørg FØRST om enhed og macOS-version.
- **Lære:** når filer erstattes under samme adresse, tjek ALLE lag der kan holde den gamle: service worker, browser-cache (4 t), CDN og sociale medier. Jeg tjekkede kun serveren og CDN i dag.
- **Lære:** Chrome-værktøjets javascript returnerer `{}` for et løfte (async) - gem svaret i en global variabel og læs den bagefter.
- **Udestående:** første push 18:37 kunne ikke tjekkes (Jacobs pc sov) - KV-tilstand og om beskeden kom, er ikke bekræftet.


### 17/10-2026 kl. 18:20 - techfeedwatch: nyt logo på ALLE billeder + logo i AI-vandmærket + nye app-skærmbilleder
- **Jacob: "ja, alt skal opdateres" + "ja til alle"** (logo i vandmærket, også fremover).
- **Delingsbilleder + listekort:** `lav-kortbilleder.mjs` lavede 399 af hver (alle artikler uden AI-billede), 0 fejl. Før/efter-ark tjekket for 6 emner: nyt ikon + **TechFeed**Watch, blæk-baggrund, AI Video nu teal. Listekort er 960x540 med vilje (står i og-card.mjs).
- **AI-vandmærket:** `aibillede.mjs` sætter nu logoikonet til venstre for "TechFeedWatch.com" i alle 3 størrelser. Tekstbredden MÅLES med den skrift maskinen har - tjekket at skyens skrift (Liberation Sans) har samme mål som Arial på et rigtigt skybillede. Robotten bruger samme funktion, så nye AI-billeder får ikonet automatisk.
- **De 39 eksisterende AI-billeder:** kun 14 originaler var gemt lokalt (robottens egne gemmes ikke i skyen). Målt lighed original/publiceret: 13 tegnet forfra fra originalen (forskel 4,5-9,8), 26 fik ikonet lagt oven på de færdige filer, samme position (heraf 1 hvor originalen IKKE passede - forskel 22,9 - så motivet blev bevaret). XMP "AI-genereret" bevaret i 117/117 filer. Engangsscriptet husker færdige (`_vandmaerke-gjort.json`), så intet får to ikoner.
- **App-skærmbilleder (Android installer-dialog):** de 3 fra 31/7 viste gammelt logo/forside. Nye: 412x915 forside + bibliotek, 1280x800 forside, taget lokalt med Chrome uden vindue og midlertidig profil (Jacobs profil urørt).
- **Ikke rørt (med vilje):** 9 billeder fra slettede artikler (8 og + 1 kort) - ingen side bruger dem; `og-default-v2.png` (gammelt, ubrugt). Slettes kun med Jacobs ok.
- **Tjek:** 5 testsæt grønne, syntaks ok for add-video/lav-ai-billeder. LIVE `037e5d9b` (919 filer).
- **Lære:** mit størrelsestjek forventede 480x270 listekort - de er 960x540 med vilje. Slå målet op i koden før jeg kalder noget en fejl.
- **Lære:** sharp holder læste filer åbne på Windows -> "unable to open for write". Scripts der læser OG overskriver samme fil: `sharp.cache(false)`.
- **Lære:** Chrome uden vindue kan ikke lave vindue under ca. 500 px - mobilbilleder blev lagt ud for bredt. Løsning: siden i en 412 px ramme (iframe) + beskæring. puppeteer-core hang ved hvert kald til siden (også desktop) - opgivet efter 4 forsøg; en hængt kørsel efterlod 8 Chrome-processer, der låste profilen -> ny profil pr. kørsel.
- **Lære:** tal i commit-beskeden skrevet før kørslen var talt op ("12 forfra / 27 ovenpå") - rigtigt er 13/26. Commit-tekster skrives FRA målt output, aldrig fra hukommelsen.
- **Lære:** svar til Jacob midt i en opgave skal sendes som besked - tekst mellem værktøjskald når ham ikke (han måtte spørge "vil du svare på mit spørgsmål?").


### 17/10-2026 kl. 17:42 - techfeedwatch: nyt logo, nye farver og "New look"-boble LIVE
- **Jacobs valg:** logo "app-ikon" (afrundet firkant, cyan-blå-violet forløb, tre hvide nyhedslinjer, cyan "live"-prik), 36 px desktop / 32 px mobil, ordmærke **TechFeed**Watch i neutral farve. Farver: links blå #1d4ed8 (lys) / cyan #67e8f9 (mørk), knapper violet #6d28d9 (lys) / #7c3aed (mørk) via `--btn`, mørk baggrund blæk #0b1020, ingen pink.
- **Opbygning:** fælles SVG-kilde `src/lib/logo.mjs`; `lav-ikoner.mjs` laver favicon (svg/ico/48), PWA-ikoner (192/512/maskable), apple-touch-icon og `og-default-v3.png`. Farveskift i 49 filer (30 knapper, 23 hover, 49 blå), pink fjernet overalt, AI Video-emnet nu dyb teal. Delingskort-skabelonen (og-card.mjs) bruger det nye mærke.
- **Gammel fejl fundet og rettet:** Fintech-prikken var usynlig i mørk tilstand (1,5:1). Reglen der skulle gøre den lysere har aldrig virket, fordi farven står inline på knappen og vinder. Nu `!important` -> #6d9eff (6,6:1).
- **Jacob valgte A - "New look"-boble ved logoet:** "👋 New look — same TechFeedWatch." med ✕. Vises KUN for læsere med spor fra et tidligere besøg (tfw_notif_since/-seen, tfw_read, tfw_follow, videoHistory, watchLater), kun én gang (nøgle `tfw_nytlogo`: vis/set/ny), og ikke efter 24/10 (dansk tid). Kører som is:inline lige efter `</header>`, før klokken gemmer noget - så en ny læser aldrig får den på side 2. Markeres først som set når den faktisk vises (skjult top fx Shorts -> venter).
- **Tjek lokalt:** ny læser = ingen boble (heller ikke side 2), kendt læser = boble én gang, ✕ lukker, mobil inden for skærmen (54-378 px af 390), lys+mørk, 0 konsolfejl. Jacobs localhost-lager kopieret før test og lagt tilbage (8 nøgler, bekræftet ens).
- **LIVE `c9397c0c`**, Cloudflare success, build.json bekræftet. Live: 8 sider + 404-siden har nyt logo og boble, ingen pink/gammel teal, 10 ikon/billed-filer 200 med rigtige typer, manifest theme_color #2563eb. I Jacobs Chrome: boblen kom ÉN gang (han er kendt læser), ikke ved genindlæsning; links cyan i mørk, Format-knap violet, mobil 390 px uden sidelæns scroll, 0 konsolfejl.
- **Lære:** _ret-scripts: søgetekst der allerede indeholder \r må ikke konverteres igen (fejlen i _ret-logo); tjek "LF-alene=0" efter hver rettelse.
- **Lære:** `node -e` med regex i PowerShell igen (parserfejl, ingen skade). Opskriften gælder: altid scriptfil.
- **Lære:** skærmbillede lige efter skift af lys/mørk fanger farveovergangen (0,15 s) - ordmærket så gråt ud uden at være det. Vent 1 s efter skift.
- **Lære:** PowerShells Invoke-WebRequest kan ikke læse et 404-svar (gav "status 0") - mit måleværktøj, ikke sitet. Statuskoder måles med `curl.exe -w "%{http_code}"`.
- **Lære:** broen til Jacobs pc afbryder kald efter 60 s - lange vente-løkker deles i kald under 55 s.
- **Udestående:** slet boble-blokken i MainLayout efter 25/10 (med Jacobs ok). De ca. 398 gamle delingskort (og-jpg uden AI-billede) har stadig det gamle logo - ikke spurgt Jacob endnu.


### 17/10-2026 kl. 15:51 - techfeedwatch: push-beskeder (klokke E) LIVE
- **Jacob valgte A:** højst 1 besked om dagen pr. læser - den nyeste artikel fra det sidste døgn i de fulgte emner (følger man intet: alle emner). Ingen ny artikel = ingen besked.
- **iPhone (Jacobs ønske):** Apple tillader kun beskeder fra installerede apps. Uinstalleret iPhone/iPad får en 3-trins guide "Add to Home Screen" (sitet ER en installérbar app: manifest standalone + service worker). En rigtig App Store-app findes ikke (kræver Apple-udviklerkonto 99 USD/år) - sagt ærligt til Jacob. Mac: virker direkte i Safari (macOS 13+).
- **Opbygning (0 kr., Cloudflare gratis):** ny Worker `tfw-push` (tfw-push.jacobolsenjso.workers.dev): POST /subscribe, /unsubscribe, GET /besked. KV `tfw-push-subs` (id 3545d636...), tilmelding = anonym push-adresse + emner, udløber efter 180 dage uden besøg. Begrænsning 10 tilmeldinger/min. pr. afsender. Logning slået fra (privatlivsløftet).
- **Udsendelse:** metoden Sender.sendPortion (RPC) - kun tfw-starter kan kalde den (service binding PUSH). Kl. 16:37 UTC, fortsætter 17:37-20:37 kun hvis dagen ikke blev færdig. 40 pr. portion (gratis plans 50-grænse). Beskeder UDEN indhold; service workeren henter teksten fra /besked (4 s grænse, neutral reserve). VAPID-nøgle: offentlig i wrangler.toml/sitet, hemmelig kun som Cloudflare-secret (lavet af opret.mjs i hukommelsen, aldrig vist eller gemt).
- **Test i Jacobs Chrome:** tilmelding via Google (fcm), /besked gav rigtig artikel, 2 rigtige push-beskeder sendt og SET af Jacob på skærmen; klik åbnede artiklen. Testadressen /test-send var kun midlertidig og er fjernet (404 bekræftet).
- **Uafhængigt review (separat agent):** 7 + 5 fund, alle relevante rettet: samme artikel to dage i træk (gårsdagens artikler udelukkes nu), tilstand læst forældet mellem portioner (sendes nu med), fejl der flyttede markøren, Apple-token højst hver time (genbruges 11 t), tom POST (krop sat), for store metadata, ingen begrænsning, genopfriskning ved besøg, privatlivstekst præciseret (sletning, emner sendes når push er til). Fast rækkefølge ved samme dato (artikler har kun dato).
- **Tjek:** cloudflare/push/test.mjs 25 OK, starter-test OK, alle test-*.mjs grønne, audit 0 fejl. LIVE `5d7e521f`, Cloudflare success, live-site: knap, sw og politik bekræftet, 0 konsolfejl.
- **Lære:** browserens getNotifications() viser intet på Windows (Chrome bruger Windows' beskedcenter) - mit måleværktøj kunne ikke se beskederne; Jacobs øjne var målingen. Fremover: push-test = spørg Jacob, ikke getNotifications.
- **Værd at vide:** den gratis plan rækker til ca. 2.000 tilmeldte (5 timer x 10 portioner x 40). Om hver RPC-portion får sin egen grænse på 50 forespørgsler er ikke bekræftet - koden stopper pænt og fortsætter næste time. Jacobs localhost-tilmelding får aftenens udsendelse som kontrol.


### 17/10-2026 kl. 15:13 - techfeedwatch: 5 nye emner LIVE (18 i alt)
- **Jacob valgte** alle 5: AI Agents, Investing & Trading, Smartphones & Gadgets, Robotics, PC Building & Gaming. Hans idé: en venlig tekst på tynde emnesider; min justering: noindex under 8 artikler + "Follow this topic" i stedet for "gem siden" + robot 50/50.
- **Én fælles emneliste:** `src/lib/emner.mjs` (18 emner, INDEX_GRAENSE 8, VOKSE_GRAENSE 20, emneSlug, emneRaekke). Bruges af robot (auto-youtube, add-video, også Shorts-prompten), emnesider, sitemap og de gamle scripts backfill-tags/revise-articles.
- **Robot 50/50:** nye emner under 20 artikler får hver anden artikel (turen følger antal artikler: lige = nye, ulige = gamle 13); 2. forsøg i en kørsel tager den anden gruppe, så ingen sulter. `test-emner.mjs` 18 test. Første version gav AI Agents 7 af de gamles 20 - testen fangede det, rettet til præcis 20/20. Tørt løb: næste emne = PC Building & Gaming.
- **Emnesider:** alle 18 bygges (også med 0 artikler). Under 8: noindex, ude af sitemappet, boks "We're building this topic right now". Alle: knap "Follow this topic" (samme liste som klokken, tallet opdateres med det samme). Maskinelt tjekket for alle 18.
- **66 gamle artikler ommærket** med regler på titel + resumé (`retag-nye-emner.mjs`, ingen AI): 89 fund i tørt løb, 23 holdt ude efter gennemsyn ét for ét. Resultat: AI Agents 43, Investing & Trading 15, Smartphones & Gadgets 5, Robotics 3, PC Building & Gaming 0. AI & Tech 273 -> 222. Kun tags-linjer ændret (66 filer, 0 andet, 0 blandede linjeskift).
- **Fundet ved skærmtjek:** listekortene har emnet skrevet i billedet - 64 reservekort lavet om (2 med AI-billede urørt).
- **Uafhængigt review (separat agent):** ingen fejl der bryder bygget; 5 mindre fund rettet (nye filer skal i git, følg-tekst forklarer at klokken kun tæller fulgte emner, Shorts-prompt, 2 gamle scripts, llms.txt).
- **Tjek:** alle test-*.mjs grønne, audit 0 fejl, interne links ok, build 663 sider, 0 konsolfejl, skærmbilleder desktop + mobil lyst/mørkt vist Jacob. LIVE `0e861f6f`.
- **Lære:** brugte igen `node -e` med regex i PowerShell minutter efter at have skrevet reglen - ingen skade (PowerShell afviste). Og CRLF-faldgruben i min egen hjælpefunktion: søgetekster omsættes nu altid til filens linjeskift i _ret-scripts.
- **Værd at vide:** robottens spørgsmålsfilter afviser mange iPhone-spørgsmål ("how much does iphone 17 cost") som uklare - ikke rørt.


### 17/10-2026 kl. 14:29 - techfeedwatch: ny notifikations-klokke (A-D) LIVE
- **Jacob valgte A-D** (E = push-beskeder venter). Før: åbning af panelet markerede alt som læst; ingen emner; første besøg viste intet.
- **A - rigtigt ulæst:** en artikel er læst, når den åbnes (`tfw_read`). Åbning af panelet rører ikke tallet. "Mark all read" virker. Kun de sidste 14 dage tæller.
- **B - følg emner:** knappen "Topics" viser alle 13 emner som knapper (`tfw_follow`). Tallet tæller kun fulgte emner; fulgte artikler øverst, andre nedtonet.
- **C - liste:** grupperet Today / This week / Earlier, emne + læsetid + dato på hver linje, link "See all latest articles". videos-lite.json fik `minutesRead`.
- **D - første besøg:** den seneste udgivelsesdags artikler tæller som nye + tip "Choose topics" (forsvinder når man har valgt/lukket). Gamle læsere: deres sete artikler fra den gamle klokke regnes som læst.
- **Tjek:** lokalt i Jacobs Chrome - alle tilstande testet med tal (ny læser 2, følg Coding 1, læst -> 0, mark all -> 0, migrering), desktop + mobil 390 px, lyst + mørkt, 0 konsolfejl. Rettet undervejs: panelet gik ud over lave skærme; tip og Topics spurgte om det samme.
- **Fejl i min egen første version (fanget efter live):** emner matchede kun artiklens FØRSTE mærke. Målt: Productivity 39 artikler, men kun 1 med det som første mærke; Automation 39 / 0. Rettet til alle mærker + alle 13 emner som knapper. LIVE `d3d7696e` (klokken) og `0a8f5ede` (rettelsen), Cloudflare success, build.json bekræftet, set live i Jacobs Chrome.
- **Jeg tog fejl i en rapport:** skrev at forsidens emneknapper mangler Automation - forkert, forsiden bruger alle mærker (13 emner). Jeg så kun et beskåret skærmbillede.
- **Worker efter deploy:** robot #720 startet 12:17 UTC af den nye Worker - grøn.
- **Lære:** byg aldrig emne-logik på `tags[0]` - mål først fordelingen af ALLE mærker (51 artikler har 1 mærke, 385 har 2).
- **Målt til Jacobs spørgsmål om flere emner:** kandidater i titel/spørgsmål: AI Agents 33 artikler (ligger under AI & Tech/Automation), Trading 8 (Fintech/Crypto), Smartphones & Gadgets 5, resten 1. "Trading" findes ikke som emne i dag.


### 17/10-2026 kl. 13:45 - techfeedwatch: DCA-kurser hentes nu selv hver måned (LIVE)
- **Jacob: "kod".** Pris: 0 kr. - Binances åbne markedsdata (ingen nøgle, ingen AI), et par sekunder på GitHub (gratis for offentligt repo).
- **Fundet før kodning:** hent-kurser.mjs brugte api.binance.com, som afviser amerikanske servere - GitHubs maskiner står i USA. Det virkede kun, fordi scriptet blev kørt fra Jacobs pc. Skiftet til data-api.binance.vision. Målt fra pc: samme slutkurser i alle 294 afsluttede måneder (BTC 110, ETH 110, SOL 74), 0 forskelle.
- **Vagt:** færre måneder end sidst -> intet skrives, kørslen bliver rød (morgenrapporten viser røde kørsler). Testet med en falsk fil: exit 1, filen urørt, rigtig fil sat tilbage.
- **Nyt job** `hent-kurser.yml` (kun workflow_dispatch, samme kø som robotten). Startes af Workeren tfw-starter den 1. i måneden kl. 03:37 UTC. Workerens selvtest udvidet (1 start i oktober, robotten stadig kl. :17) - alt OK. Worker deployet (version aa3ceca0, tidsplan uændret "17,37 * * * *").
- **Set virke:** commit `5dc3af2f`; kørsel #1 startet med hånden i Jacobs Chrome -> grøn; robotten gemte `bf6b91b7` (hentet 2026-10-17, 110/110/74 måneder, BTC sep. 83.623,6); Cloudflare success; build.json = bf6b91b7; DCA-siden live viser "downloaded 2026-10-17".
- **Næste automatiske kørsel:** 1/11-2026 kl. 04:37 dansk vintertid.


### 17/10-2026 kl. 13:23 - techfeedwatch: nattens kørselslogs tjekket, 2 fejl rettet LIVE
- **Logs læst i Jacobs Chrome:** #708 (00:17 UTC) udgav "What Happens When Programming Runs in a Computer?" - DAEKNING 5/0 droppet, FAKTABOKS 3, VAERKTOEJ intet, 0,40 USD. #709 (01:17 UTC) udgav "Productivity Software and What It Means for Modern Work" - DAEKNING 3 beholdt/2 droppet, FAKTABOKS 0 (kun 4 fakta med kilde), VAERKTOEJ intet, 0,55 USD. Begge: audit 0 fejl, build grøn. Hver kørsel lagde først ét spørgsmål på is (ingen kandidat bestod). B (stop efter fejlet skrivning) blev ikke udløst - skrivningen lykkedes begge gange.
- **Fejl 1 - svaret klippet (#709):** Gemini brugte 15.119 af 16.384 output-tokens på tænkning, svaret blev klippet (MAX_TOKENS) og skrevet forfra. Fejler det to gange, er artiklen tabt. Rettet: skrivekaldet og dets genforsøg har nu loft 32.768 (der betales kun for brugte tokens).
- **Fejl 2 - nist.gov afvist:** domænetjekket krævede et ord fra navnet i domænet; "National Institute of Standards and Technology" -> nist.gov fejlede. Rettet: initialer, der passer præcist (mindst 3 bogstaver), godkendes. Testet: NIST, IBM, Otter godkendt; forkert domæne afvist.
- **LIVE `ba269e55`:** alle test-*.mjs grønne, `node --check` ok, Cloudflare Pages success, build.json viser ba269e55.
- **Ikke rettet, men værd at vide:** i #708 var 9 af 13 kilder britannica.com (tynd kildebredde); Britannica og IBM svarer ikke på robottens link-tjek (blokerer sandsynligvis GitHub-maskiner). #709 bygger på en video med relevans 5/10 - søgningen bærer artiklen (videoandel 14 %).
- **Jacob valgte:** "alle sider til nyt setup" = faktaboks på gamle artikler via omskrivningen (3/dag). Bekræftet i koden: omskriv-gamle.mjs kører add-video.mjs --erstat, så faktaboksen kommer med automatisk. Ingen kodeændring nødvendig. Værktøjsboksen virker allerede på alle 438.
- **Lære:** PowerShell spiste `$1` i min erstatning i en node -e kommando, så en linje i add-video gik i stykker. `node --check` fangede det før push. Opskriften fandtes (script-fil, aldrig `$` i kommandoen) - jeg fulgte den ikke. Samme fejl for 2. gang: opskriften strammes til "ALDRIG node -e med regex/replace i PowerShell - altid script-fil".


### 16/10-2026 kl. 22:57 - techfeedwatch: værktøjslisten hold 2+3 LIVE (7 nye, nu 58)
- **Listen (aftalt med Jacob i telefonen i pausen):** hold 1 (token-tæller, AI-pris, lokal AI) fandtes allerede - token-beregneren tæller tokens i indsat tekst og viser prisen pr. model, og lokal-AI blev bygget i dag. Bygget nu: hold 2 og 3.
- **LIVE (`4d0fe64f`, build.json bekræftet):** Merge PDF Files, Split PDF, Video File Size Calculator, Upload & Download Time Calculator, PC Power Cost Calculator, Storage Space Calculator, Quantum Speed-up Calculator. Nu 58 værktøjer.
- **PDF:** pdf-lib 1.17.1 (MIT, 0 sårbarheder) kører i browseren - filerne uploades aldrig. `test-pdf.mjs` laver rigtige PDF'er og tjekker sidetal og rækkefølge (12 OK). Testet i Chrome lokalt og live: sammenlæg 5 sider fra 2 filer, opdel i intervaller og enkeltsider, forkerte intervaller afvises, ødelagte filer markeres "could not be read". PDF-komprimering bevidst IKKE bygget: rigtig komprimering i browseren kræver, at siderne laves om til billeder, så teksten ikke kan markeres længere.
- **Tal:** video-forvalg = YouTubes egne anbefalede upload-bitrates (support.google.com, læst 16/10); lagerplads-eksempler for video/musik regnet ud fra bitrate; ingen indbygget strømpris (skifter, afhænger af land). Kvanteværktøjet er ren matematik (2^n og Grovers √N) med en ærlig forklaring på, hvad tallene IKKE betyder.
- **Tjek:** 16 nye håndregnede selvtests i `test-beregn.mjs` (49 i alt), alle grønne; alle 7 regnet efter i browseren (fx upload 2 GB ved 42,5 Mbit/s = 6 min 16 s); desktop + mobil 390 px uden vandret rulning; 0 konsolfejl; audit-site, audit-content og interne links 0 fejl. Rettet undervejs: "0.00 MB" ved små PDF'er, et link i standardblå.
- **Kobling til artikler:** 40 af 436 artikler får nu et passende værktøj (før 9) - heraf 31 kvante-artikler.
- Lære: mit eget PDF-sidetal-tjek (søgning efter "/Type /Page" i filen) gav 0, fordi pdf-lib pakker siderne - fejlen var i måleværktøjet, ikke værktøjet. Tjekket i stedet ved at lade Split-værktøjet læse filen.
- Lære: i telefonsamtalen sagde jeg "43 værktøjer i alt" - det rigtige var 51 (nu 58). Tal i en rapport skal være målt, også mundtligt.
- **Fejl i statusfilen v128 (min):** `_lav-version.mjs` indsatte dagbogen med en tekst-erstatning, hvor "$1" betyder "gruppe 1" - så "$19.99" i v128 blev til dagbogens overskrift midt i en sætning. Opdaget, da v129 ikke kunne laves (overskriften stod to gange). Rettet ved roden: scriptet bruger nu funktioner i stedet for tekst, retter netop den skade og stopper, hvis overskriften står mere end én gang. v128 på Drive har stadig den ødelagte sætning; v129 er rigtig.
- Lære: tekst, der indsættes med `replace`, må aldrig være en almindelig streng, hvis den kan indeholde `$` - brug en funktion (`() => tekst`).


### 16/10-2026 kl. 13:25 - techfeedwatch: præcis værktøjsboks + 8 nye værktøjer LIVE (trin 4 del 2)
- **Værktøjsboksen efter spørgsmål (`43355c38`, Jacobs ok):** før valgt efter mærke - 149 af 436 artikler viste "Password Generator" uden grund, 82 intet. Nu `src/lib/vaerktoej.mjs`: kun når titel/spørgsmål handler om det, værktøjet løser; ellers ingen boks. Fejl fanget ved måling: "SEC ... Wall Street Tokens" (krypto) fik AI-token-beregneren - rettet + test. Nye/omskrevne artikler får én brugssætning med link før kildelisten (log `VAERKTOEJ:`). Set live: Nike-artiklen uden boks, indeksfonde-artiklen med.
- **8 nye værktøjer (`603fecda`, Jacob: "alle skal bygges og lægges live"):** Crypto DCA Calculator, Crypto Gains & Tax Estimator (FIFO), Trading Fee & Spread Calculator, AI Subscription vs API Cost Calculator, Can My Computer Run This AI Model?, GPU Temperature & Hotspot Checker, Loan Payment Calculator, Inflation & Purchasing Power Calculator. Nu 51 værktøjer.
- **Tal og kilder:** DCA bruger rigtige månedlige slutkurser fra Binance (BTC/ETH fra 2017-08, SOL fra 2020-08, til 2026-09) i `src/data/kurser.json` (`node hent-kurser.mjs`). AI-priserne flyttet til `src/lib/ai-priser.mjs`, så token-beregneren og abonnement-værktøjet viser samme tal; abonnementer læst på claude.com (Pro $20) og gemini.google (AI Pro $19.99) 16/10 - ChatGPT Plus udeladt, fordi siden ikke viste prisen som tekst (hellere intet tal end et gæt). GPU-grænser med kilder (Tom's Hardware, TechPowerUp, AMD). Skat, gebyrer og inflation uden indbyggede satser - de skifter og afhænger af land; brugeren indtaster sine egne.
- **Tjek før live:** al regnelogik i `src/lib/beregn.mjs` med 33 håndregnede selvtests (`test-beregn.mjs`); DCA også tjekket uafhængigt (11.133,09 begge veje); FIFO, gebyr, AI-tokens, lån (391,32 = standardtabel) regnet efter i hånden; alle 8 testet i Chrome (lokalt og live), 0 konsolfejl, desktop + mobil 390 px uden vandret rulning; `audit-site` 0 fejl. Fundet og rettet undervejs: GPU-teksten sagde "Normal" og "throttling" i samme sætning; en kluntet overskrift på lokal-AI-siden.
- **Kobling til artikler:** 9 af 436 artikler får nu et passende værktøj (før det tilfældige: 354 med boks). De fleste titler handler om nyheder, ikke om noget læseren kan regne ud - værktøjerne skal især vinde på egne søgninger.
- Lære: `tools.ts` har Windows-linjeskift - mit indsæt-script fejlede første gang på `\n];`. Samme fejl som faktaboks-prøven tidligere i dag (2. gang) -> opskrift i HOVEDPROMPT: alle regex/indexOf på repo-filer skal tåle `\r?\n`.


### 16/10-2026 kl. 12:37 - techfeedwatch: prøve af dagens rettelser (#13) + gamle grene slettet
- **Prøveartikel #13 (Jacob: "vi tester alle de nye rettelser"):** robotten på main uden dagsloft, gemt på grenen `udkast-13`. Artikel skrevet og godkendt: `FAKTABOKS: 3 fakta` (links til YouTube, Music Business Worldwide, PCMag = de udgivere, sætningerne nævner), 1 tvunget link fanget og rettet, 0 AI-vendinger, redaktørtjek "alle 6 delspørgsmål besvaret", indholdstjek 0 fejl. Faktaboksen set på den rigtige prøveartikel (lokal visning). Pris ca. 0,30 USD.
- **A** kørte, men havde intet at droppe (alle 6 delspørgsmål havde fakta). Loggen skrev intet i det tilfælde - nu skrives `DAEKNING:` altid (`1ed19d65`, live). **B** blev ikke udløst (artiklen bestod); første bevis kommer, når en skrevet artikel kasseres i en rigtig kørsel.
- Robotkørsel 12:17 (#694): dagsloft nået (2/2), 0 USD.
- **Grene slettet (Jacobs ok 16/10):** `udkast-13` og derefter alle gamle: `fase2-regler`, `laesertjek`, `reklame-vaern`, `stil-1-2`, `udkast-1/2/3/6/8/10/12`. Tjekket før: de 4 arbejdsgrene havde intet, der mangler i main (`stil-1-2`'s 2 commits findes i main som andre commits - `tvungetAnker`, `aiFraser`, `hentSitetsJson` står i main). Nu er kun `main` tilbage.
- Lære: et tjek, der kun logger, når det finder noget, kan ikke skelnes fra et tjek, der ikke kørte. Opskrift: nye værn skriver altid én linje.


### 16/10-2026 kl. 12:12 - techfeedwatch: robottjek (2 af mine fejl rettet) + faktaboks "Key facts" LIVE (trin 4)
- **Robottjek (Jacob bad om det):** (1) 3 outline-test i `test-kildetjek.mjs` havde været røde siden 15/10 - rettet i `2fedbc6f`. (2) Loggen skrev "prøver næste kandidat", også når B stoppede kørslen - rettet (`88a03bbd`). (3) v125's tabel stod stadig med "5/dag" og 432 artikler - rettet her. A+B er IKKE prøvet endnu: dagsloftet var nået fra kl. 09:17 (robot-log #691-#693 "loftNaaet"), så første rigtige prøve er i nat; tjek 17/10 kl. 09:50 (planlagt opgave).
- **Faktaboks LIVE (`71d3a34d`, build.json bekræftet live, Cloudflare-tjek "success"):** Jacob valgte nøglefakta fra søgningen (ikke ordbogsdefinition - den ville stå ens i 25 artikler). `noegleFakta()` + `delFaktum()` i `src/lib/kildetjek.mjs`: 3 fakta fra robottens egen Google-research; "According to X," flyttes ud som kilde; linket SKAL være X' eget domæne (målt: ellers "According to IBM" med link til statisticsfundamentals.com); sætninger, der ikke kan stå alene ("which ...", "The company ..."), droppes; fakta med tal først. Gemmes som `keyFacts` i frontmatter. 0 ekstra modelkald.
- **Visning (`src/pages/video/[slug].astro`):** efter første sektion, før videoen. Første faktum vises; centreret pilleknap "Show 2 more facts" folder resten ud (`<details>`, ingen JavaScript; al tekst står i HTML'en, så Google læser den). Design efter Jacobs ønske (16/10): hel farvet ramme, skygge, farvet top-bånd med ikon, nummererede cirkler, centreret boks (max 620 px), egne farver i mørk tilstand. Set på desktop + mobil 390 px (lukket/åben/mørk), ingen vandret rulning.
- **Dækning (målt på de 11 artikler med gemt søgning):** 7 af 11 ville få en boks. Kun nye og omskrevne artikler får den (ca. 6/dag) - gamle har ikke de gemte fakta.
- **Browser (Jacob 16/10):** alt browserarbejde nu KUN i den Chrome, han forbandt i dag ("Browser 1" i udvidelsen). Står i HOVEDPROMPT.
- Lære: prøvescriptet indsatte ikke faktaboksen, fordi artiklerne har Windows-linjeskift (`\r\n`) og regex'en ledte efter `\n---\n`. Opskrift: regex på artikelfiler skal tåle `\r?\n`.


### 16/10-2026 kl. 11:20 - techfeedwatch: prisloft 3+3 og tidligt stop (A+B) LIVE
- **Loft (Jacob 16/10, `f4397752`):** højst 3 nye artikler om dagen (hverdag 2-3, weekend 1-3) og 3 omskrivninger om dagen (var 6). Morgenrapporten skriver nu "startet X af 24 gange (Cloudflare-starteren)".
- **A - dækningstjek (`2fedbc6f`):** efter Google-søgningen droppes delspørgsmål, hvor INGEN af spørgsmålets egne ord står i noget faktum - før outline og skrivning, uden modelkald (`daekning()` i `src/lib/soegning.mjs`, log-linje `DAEKNING:`). Er der under 3 tilbage, springes spørgsmålet over, før videoen hentes. **Målt på de 25 gemte søgninger:** første udgave (halvdelen af ordene) droppede 85 af 128 - for strengt, også dækkede spørgsmål. Endelig regel: 8 af 128 droppet (fx "leadership changes at Nike", "causes of a data breach" uden fakta om årsager), 0 ekstra overspringninger.
- **B - ét skrevet forsøg pr. kørsel (`2fedbc6f`):** add-video lægger mærket `.cache/skrive-forsoeg`, når den dyre skrivning begynder. Bliver artiklen kasseret, stopper auto-youtube kørslen (ingen ny kandidat, intet nyt spørgsmål); næste time prøver igen. Afvisninger FØR skrivningen (sprog, relevans, faktaark) prøver stadig næste kandidat.
- **Ærligt forbehold:** A fanger kun delspørgsmål helt uden ord i fakta. CMMC-fejlen (#670, "timeline and phase-in") var måske ikke fanget (fakta nævner sandsynligvis "phase"). B er det sikre loft: højst én betalt fejl pr. time.
- Selvtest: `test-kildetjek.mjs` Alle OK (3 nye dækningstest), `test-skriveregler.mjs` 66 OK. Bekræftes på robottens næste kørsler og i morgenrapporten.
- Lære: 3 outline-test i `test-kildetjek.mjs` havde fejlet siden spørgsmålsreglen 15/10 - jeg kørte kun `test-skriveregler.mjs`. Opskrift: kør ALLE `test-*.mjs` før push.
- Lære: første dækningsregel var for streng; den blev fanget, fordi den blev målt på gemte søgninger FØR brug.


### 16/10-2026 kl. 10:37 - techfeedwatch: første døgn med starteren og de nye regler (målt)
- **Starteren virker:** robotten startet 23 af 24 timer (#670-#692, alle "workflow_dispatch" kl. xx:17:02-04), omskrivningen kl. 08:37 (#3) og morgenrapporten kl. 09:37 (#2, kom frem). Før: 4-5 af 24.
- **Udgivet:** 6 nye artikler på 24 timer (rapporten) + 5 gamle omskrevet (2 kørsler). Dagsloftet nås nu tidligt: fra 15/10 kl. 17:17 og 16/10 kl. 06:17 dansk tid stod robotten stille med "loft nået" (koster 0).
- **Kvalitet målt (`_maal-nye.mjs`) på de 9 artikler skrevet med 15/10-reglerne:** 0 tvungne links, 0 AI-vendinger, 1-2 naturlige links, 2 af 5 H2 som spørgsmål i alle 9, længste første sætning 17-27 ord. **Længde: 946-1.373 ord, snit 1.147** — infosec-prøven (810) var en undtagelse. De 2 artikler fra før reglerne (#668, #669) havde 2-3 tvungne links. Bemærk: præcis "2 af 5" i alle 9 er selv et ensartet mønster.
- **PRIS (vigtigt):** robot 4,72 USD + omskrivning 2,01 USD = ca. 6,73 USD (ca. 47 kr.) på ét døgn, 0,79 USD pr. ny artikel. Årsag: starteren giver 5 gange så mange kørsler, og mislykkede forsøg koster (fx CMMC-kørslen 0,98 USD uden artikel; omskrivning 5 af 10 stoppet). Med den fart rækker Gemini-kreditten (182 kr. fyldt på 14/10) kun få dage. Beslutning til Jacob.
- Stop-årsager i døgnet: ubesvaret delspørgsmål (3), video-andel 31 % (1), 3-5 videoafsnit (2), tal uden kilde (2), for få tal (2).
- Morgenrapporten skriver stadig "GitHub dropper mange" — forældet tekst efter starteren (rettes).
- Jacob sendte TV 2-eksempel (faktaboks, citat-fremhævning, mellemrubrik) og spurgte, om det gør indholdet mere hans eget. Vurdering givet: form, ikke originalitet; faktaboks fra sitets egen ordbog foreslået.
- Lære: Jeg forudså ikke, at en pålidelig starter også øger Gemini-forbruget (flere forsøg = flere betalte fejl). Regn prisen ud, før noget, der ændrer antallet af kørsler, går live.


### 15/10-2026 kl. 12:18 - techfeedwatch: pålidelig starter (Cloudflare) LIVE, robot 1+2 LIVE, spørgsmål i overskrifterne LIVE
- **Morgen (målt):** robotten udgav 2 artikler i nat (#667, #668). Morgenrapporten og omskrivningen startede IKKE: GitHubs tidsplan droppede dem (rapport 0 af 3 tidspunkter, omskrivning 0 af 1, robot 4 af ~24). Tidsplanerne var rigtige og workflowene "active" — årsagen er GitHub, ikke koden.
- **Rapport-fejl rettet** (`262462f5`): "build.json kunne ikke læses" — `daglig-rapport.mjs` hentede med navn men uden genforsøg; nu 3 forsøg med 5 s pause (opskriften fra `tjek-tomgang.mjs`).
- **Prøve #12** (gren `stil-1-2`, udgives ikke): grøn, artikel "Why Do Text-to-Video Models Work the Way They Do" — 1 tvunget link i første udkast, rettet til 0; 0 AI-vendinger; 0,07 USD. **Robot 1+2 + rapportrettelse + ny infosec-artikel LIVE** (`faf05b78`, Jacobs ok 11:47), set live: 2 naturlige links, 0 tvungne, "invariably" væk.
- **Starteren (Jacob: "ja, byg den nu", 10:43):** Cloudflare Worker `tfw-starter` (`cloudflare/starter/`, én tidsplan "17,37 * * * *" UTC — gratisplanen har 5 tidsplaner for hele kontoen): robot hvert :17, omskrivning 06:37 UTC, rapport 07:37 UTC (vintertid fra 25/10: en time tidligere i dansk tid). Kalder GitHubs "Run workflow" med en GitHub-nøgle (kun "Actions: Read and write" på techfeedwatch, udløber om et år), som Jacob selv lavede og lagde som Secret `GITHUB_TOKEN` (set: `secret_text`). Ingen offentlig adresse. Selvtest 4 OK. **Set virke:** kørsel #669 startet 11:17:03 og #670 12:17:03 af starteren (Cloudflare-loggen: "startet: daily-update.yml"). GitHubs egne tidsplaner for robot, omskrivning og rapport slået fra (`a01022e8`), så intet kører to gange. Tomgangsalarm, IndexNow og Prune kører stadig på GitHubs tidsplan (uafhængig vagt).
- **Spørgsmål i overskrifterne (Jacobs idé, min variant, `0422cbb1`):** ca. halvdelen af H2 er læserens spørgsmål ("What core principles govern infosec requirements?"), første sætning svarer direkte (højst ca. 40 ord); planen afvises, hvis ingen eller alle H2 er spørgsmål. H1 uændret (varierer allerede). Infosec-artiklen skrevet om og live: 2 af 4 H2 som spørgsmål, svar i første sætning, 0,08 USD. **Den blev kortere: 810 ord mod 1.127** — Jacob vil have længere artikler; følges på de næste artikler.
- Jacobs vurdering af ideen bad om ærlighed: spørgsmål-overskrifter er god struktur (og svar-bokse hos Google), men ikke originalitet — det kræver stadig punkt 4 (egne værktøjer) eller Jacobs egen linje.
- Lære: Jeg åbnede Cloudflare i SAMME fane som Jacobs nye GitHub-nøgle, og nøglen (vises kun én gang) gik tabt — han måtte lave den om. Åbn altid en ny fane, når Jacob har noget åbent.
- Lære (2. gang → opskrift rettet i HOVEDPROMPT): et Desktop Commander-kald med 108 s ventetid blev tabt (60 s-grænsen, kendt fra 8/10).
- Lære (2. gang → opskrift rettet i HOVEDPROMPT): jeg meldte "ingen kørsel kl. 12:17", før klokken var 12:17. Slå klokken op, før noget tidsbestemt meldes manglende.


### 14/10-2026 kl. 21:57 - techfeedwatch: robotten skriver bedre (punkt 1+2) — KUN LOKALT, ikke pushet
- **Jacob (21:48):** "vi tager 1,2 og 3 nu her så.. du koder". Punkt 3 (artikler uden video) er større end først sagt: robot OG artikelside er bygget om en video. Planlægges særskilt med måling først.
- **Målt før (alle 429 artikler, `_maal-links-ai.mjs`):** 491 tvungne interne links i 181 artikler, heraf **42 i de 15 nyeste** (linktekst = hel titel 330, spørgsmål 91, kolon 60, over 7 ord 10). 201 AI-vendinger i 150 artikler ("not just X, but Y" 78, "Ultimately,/At its core," 71, "plays a key role" 25 ...). "does not automatically" o.l. gav falske fund og blev taget ud af reglen.
- **Bygget** (`src/lib/skriveregler.mjs`: `tvungneLinks`, `fjernTvungneLinks`, `aiFraser`; `add-video.mjs`): (1) 0-2 interne links med 2-6 naturlige ord, aldrig hel titel/spørgsmål/kolon; tvungne links bedes rettet, ellers fjernes sætningen (liste: linket bliver tekst) — før læsertjekket og igen til sidst. (2) Ny regel 24 mod AI-vendinger + rettelsespunkt 17; ensidige sætninger skrives nu om med navngiven kilde, ikke med forbehold (regel 23 + redaktørtjekkets punkt 3). Ny logline `STIL:`. Selvtest 66 OK (12 nye).
- **Prøvet lokalt** (`--erstat infosec-requirements-defining-core-security-baselines`, 0,13 USD): første udkast havde **0 tvungne links og 0 AI-vendinger** (før: 3 tvungne + 1 forbehold). Resultat: 2 naturlige links, video-andel 25 %, 0 tal uden kilde, alle tjek bestået. Den nye fil ligger KUN på pc'en (ikke committet, ikke udgivet).
- **I MORGEN:** 1) Jacob ser den nye infosec-artikel, 2) prøve på GitHub ("Prøveartikel"), 3) push. Koden er committet lokalt, ikke pushet — robotten kører på den gamle kode i nat.
- Lære: Skøn ikke størrelsen af en opgave, før koden er læst — punkt 3 blev præsenteret som lige så stort som 1 og 2.


### 14/10-2026 kl. 21:39 - techfeedwatch: første robotkørsel på 14/10-koden læst + Googles nye krav vurderet
- **Jacob (21:31):** "du tjekker robottens kørsel nu". **Kørsel #665** (planlagt, 20:40-20:44 dansk, commit `a90fd1a`, log læst i Jacobs Chrome): grøn, **0 artikler**. Emneskift virkede (AR & VR -> AI Video). Spørgsmåls-redaktøren svarede (39 forslag afvist). Forhåndstjekket sprang 7 videoer over (alle tydeligt forkerte, fx "How to Disable GDID in Windows 11"); 1 vurderet fuldt (relevans 1/10). KLIPPET 0, fejl 0. Logbogen `robot-log.jsonl` fik sin første linje: 0,085 USD, 29 kald. Begge spørgsmål på is i 30 dage. **Flaskehalsen er nu: ingen passende video til smalle spørgsmål** — ikke fejl.
- **Hold øje med:** alle 7 forhåndstjek-scorer var præcis 1/10. Rigtigt her, men giver næste kørsel også 1 til alt, skal tjekket undersøges.
- **Robottens commit `2648773c`** fjernede 102 linjer i `package-lock.json`. Målt: kun `libc`-felter (npm-versionen på GitHub er en anden end på pc'en), 0 versioner ændret. Live `ad1ee0d7` bygget uden fejl. Ufarligt, men filen kan skifte frem og tilbage.
- **Googles nye krav (1/10)**, set i Matt Kenyons video og bekræftet i 3 artikler: "main content"; fire kriterier (indsats, originalitet, dygtighed, nøjagtighed); opdigtede forfattere = bedrag; manuelt faktatjek af AI-indhold er "critical", også titler, beskrivelser og alt-tekst; "AI til store mængder tekst uden manuel overvågning" nævnt som lav indsats. **Vurdering:** techfeedwatch består nøjagtighed og åbenhed (forfatterboksen siger "I do not read every article before it goes live"), ikke indsats og originalitet. Stikprøve `infosec-requirements-defining-core-security-baselines`: stærke kilder (NIST, IBM), men 3 tvungne interne links giver meningsløse sætninger, 1 maskinagtigt forbehold, IBM-tallet hentet via ResearchGate.
- **Jacob spurgte, hvorfor techmediaarch er godkendt:** gennem Bloggers host-konto, før vores arbejde startede (`HANDOVER-TECHMEDIAARCH.md`, 24/8) — ikke fordi indholdet var bedre. techmediaarch-robotten udgiver nu selv (op til 2/dag), så samme risiko gælder dér (ikke målt).
- **Google Cloud `techmediaarch-tools`:** "OAuth consent screen" skal ikke udfyldes — ingen OAuth-klienter; nøglerne og tjenestekontoen bruger det ikke.
- Arbejdsfiler (ikke i git, ikke slettet): `_video-laes.mjs`, `_video-qMUAU7E3dCA.txt`, `_tjek-*.txt`, `_v121-*.md`.
- Lære: Slå op i arkivet og koden, før jeg svarer på, om noget er sat op — jeg svarede først på Google Cloud-spørgsmålet uden opslag.
- Lære: "Denne session" betød denne samtale. Jeg antog en anden session og udskød tjekket. Er det uklart, hvem der gør noget: spørg med det samme.
- Lære: `_lav-version.mjs` skiftede kun den første `{KL}` ud — en stod tilbage i afsnit 0 (fundet ved at læse PDF'en). Rettet til `replaceAll`. Læs altid afsnit 0 i den byggede PDF.


### 14/10-2026 kl. 20:35 - statusfilen gjort kort (trin 4)
- **Jacob (20:25):** "vi tager trin 4 nu".
- Dagbogen fra 7/10 og tilbage + Bilag A flyttet **ordret** til nyt `STATUS-ARKIV.md` (script `_status-del.mjs` tjekkede, at alle 1.563 linjer findes i præcis én af de to filer, i samme rækkefølge, før noget blev skrevet). **Målt:** statusfilen 431.115 → ca. 96.000 bytes (ca. 22 %, ikke en tiendedel som jeg skønnede — den sidste uges dagbog fylder resten). Henvisninger til Bilag A peger nu på arkivet. Ny regel i HOVEDPROMPT: indgange ældre end 7 dage flyttes til arkivet.
- Lære: Skøn ikke en besparelse før den er målt ("en tiendedel" blev 22 %).

### 14/10-2026 kl. 20:20 - techfeedwatch: forhåndstjek + daglig rapport (LIVE)
- **Jacob (19:44):** "vi tager 1 og 2" (forhåndstjek af videoer; daglig rapport til jacobolsenjso@gmail.com).
- **1. Forhåndstjek** (`src/lib/forhaandstjek.mjs`, commit `9f038e42`): ét billigt Gemini-kald på titel+beskrivelse før de dyre faktaark; tydeligt urelevante (≤2/10) springes over. Første sigte ser nu 8 videoer, de 4 mest lovende vurderes fuldt (dyrt antal uændret). **Testet på dagens 14 rigtige kandidater:** 10 af 13 senere afviste sprunget over, 0 gode tabt (artiklens video fik 4/10 og blev vurderet), pris 0,007 USD; sparet ca. 0,48 USD på dagens kørsler.
- **2. Daglig rapport:** `robot-log.mjs` skriver én linje pr. robotkørsel i `src/data/robot-log.jsonl` (udgivet, emner, spørgsmål, vurderet/sprunget over, KLIPPET, fejl, målt USD fra FORBRUG-linjerne; SOEG-FORBRUG udelukket). Robot-trinnet kører nu med `tee` + `pipefail`. `daglig-rapport.mjs` + workflow "Daglig robotrapport" (4 forsøg 09:23-10:53 dansk, sender kun én pr. dag) poster en kommentar på issue #1 "Daglig robotrapport"; GitHub mailer den til Jacobs notifikationsmail **jacobolsenjso@gmail.com** (tjekket i github.com/settings/notifications; Watching = on GitHub + Email). Ingen nye nøgler. **Sendt én gang manuelt 20:0x — issue #1 oprettet, kommentar postet; om mailen kom frem, skal Jacob bekræfte.**
- **Prøve #11 (manuel, main `9f038e42`, udgives ikke):** npm install med Astro 7 OK (0 sårbarheder), redaktøren svarede og afviste ~100 forslag, forhåndstjek sprang 4 over, emneskift Coding/AI Video → AR & VR virkede, artikel skrevet ("Best Virtual Reality Game System for Home Gaming", score 89), build + alle tjek grønne. Sidste trin (gem på egen gren) afvist af GitHub: grenen indeholdt mine workflow-ændringer pushet midt i kørslen, og GITHUB_TOKEN må ikke ændre workflows — engangsfejl, rammer ikke robottens push til main.
- **KLIPPET-advarslen fandt 3 nye fejl i prøven:** redaktøren med 166-249 forslag (tænkning 7.864 af 8.192) → højst 40 forslag sendes (`587bdaff`; målt: 249 → intet svar, 40 → svar, tænkning 1.215); redaktørtjekkets omskrivning (4096) og eksterne links (1024 → "0 links sat") → 8192 sammen med redaktoertjek.mjs og overskriftsrettelsen (`fc4971e2`).
- Lære: En ny advarsel betaler sig straks — KLIPPET fandt 3 skjulte fejl i første kørsel. Kør en prøve på GitHub efter robot-ændringer, ikke kun lokale tests.
- Lære: Push ikke workflow-ændringer, mens en prøve kører — dens gren kan så ikke gemmes.

### 14/10-2026 kl. 19:55 - techfeedwatch: robotten - hvorfor så få artikler, og to rettelser (LIVE i robotten)
- **Jacob (19:02):** "ja undersøg. Se efter fejl også"; valgte forslag 1 og 2 (19:18).
- **Målt (GitHub API + logs i Jacobs Chrome):** "YouTube Auto Update" (cron hver time) blev kun startet 5 gange fra 13/10 12:31 til 14/10 19:00 (GitHub dropper planlagte kørsler; IndexNow fik 21/28 og Tomgangsalarm 13/21 den seneste uge). 0 fejlede siden 10/10 (de 4 røde 9-10/10 var tom Gemini-kredit). Pausen 10/10-13/10 var Jacobs beslutning.
- **Hvorfor 1 artikel i dag (loft 4):** alle 4 kørsler valgte "Coding" (færrest artikler, 36). Kørsel 09:41: 2 spørgsmål, 6 videoer, relevans 0-4/10 → ingen artikel, ca. 0,38 USD spildt. 15:46: 1. spørgsmål "how is programming com company" (volapyk) fejlede, 2. ("what is coding for kids") gav dagens artikel. (Kørsel 00:48 og 03:55 ikke læst.)
- **Årsag til volapyk (fundet ved test):** spørgsmåls-redaktøren (Gemini vælger blandt ~100 autocomplete-forslag) havde `maxOutputTokens: 512`. Modellen bruger ~3.400 tokens på at tænke → INTET svar (3 af 3 forsøg), og listen blev brugt ufiltreret uden et ord i loggen. Filteret har reelt været slået fra.
- **Rettet** (commit `44b3bfd4` + `2c2eb686`): (1) kørslens 2. forsøg tager det næstmindste emne; også når et emne ikke har brugbare spørgsmål (før: kørslen stoppede). Antal forsøg pr. kørsel uændret = samme pris. (2) Redaktøren får 8192 tokens og logger, hvis den ikke svarer; prompten (nu i `spoergsmaalsfilter.mjs`) afviser også spørgsmål om ét firmas omdømme og domænenavne skrevet som ord. (3) Grammatikfilteret springer et spørgsmål over, når 2/3 kalder det brudt og rettelsen ikke kan godkendes (`afvisBrudte`). (4) `model.mjs` skriver "⚠️ Gemini-svar KLIPPET", hver gang et svar rammer loftet — for alle kald.
- **Testet:** redaktøren svarede 2 af 2 gange (beholdt 43 og 48 af 103) og afviste "how is programming com company" begge gange; brudt-filteret: 4/5 som forventet (5. gang foreslog dommerne "how is programming com as a company", som slap — derfor også rettelse 2); KLIPPET-advarslen ses ved loft 64, ikke ved 8192; robottens 54 tests OK.
- **Ikke set virke på GitHub endnu** — næste robotkørsel læses (planlagt tjek).
- Lære: Samme fejl to gange (for lavt maxOutputTokens, 1/10 og 14/10) → opskriften rettet: central KLIPPET-advarsel i `model.mjs` + regel i HOVEDPROMPTs faldgrubeliste.
- Lære: Test en rettelse mod det rigtige input (100 forslag), ikke kun mod det ene eksempel — testen afslørede, at det egentlige filter aldrig svarede.
- Lære: Statusfilens .pdf/.docx blev ikke bygget om i v112-v117 (regel 6 i HOVEDPROMPT) — bygget nu fra v118.

### 14/10-2026 kl. 19:05 - techfeedwatch: Astro 6.4.6 → 7.3.8 (sikkerhed trin 2) (LIVE)
- **Jacob (18:32):** "vi tager trin 2 nu"; så skærmbilleder og sagde ja (18:56).
- **Ændret** (sidegren `astro-7`, flettet ind i main, commit `5ca13525`, live 18:58): astro 7.3.8, @astrojs/sitemap 3.7.4, @astrojs/rss 4.0.19, **@astrojs/markdown-remark 7.3.2 tilføjet** (Astro 7 installerer den ikke længere selv, og sitets læsetid + ordbogslinks bruger den via `unified()`), `compressHTML: true` i astro.config (Astro 7's nye standard 'jsx' kan fjerne mellemrum mellem ord). npm audit: 0 sårbarheder.
- **Målt før udgivelse** (gammel build gemt i `_dist-a6`): alle 633 sider byte-ændret (ny Rust-compiler), men **tekst, links, overskrifter, billeder, head og elementantal identiske på alle 633** (`_sammenlign-sider.mjs`). 22 skærmbilleder (11 sider × pc/mobil) pixel-identiske på nær billedindlæsnings-støj (`_pixel-sammenlign.mjs`, `_pixel-hvor.mjs`); biograf-tilstand 0 px forskel; 0 JS-fejl; hop fra indholdsfortegnelsen 24 px på telefon i begge. Husets tre tjek grønne. Kontaktark: `_shots/a6a7-pc.png`, `_shots/a6a7-mobil.png`.
- **Målt live:** forside, latest, glossary, schema-generator, sitemap, rss, video-sitemap svarer 200; hop 24 px på telefon og pc.
- Advarslen "Skipping src/pages/.well-known/security.txt.js" fandtes også i Astro 6 — ikke ny.
- Lære: Ved en ny hovedversion: gem den gamle build og sammenlign indhold og pixels side for side — en byte-sammenligning siger kun "alt er ændret".

### 14/10-2026 kl. 12:36 - techfeedwatch: sikkerhedsopdatering trin 1 (LIVE)
- **Jacob (12:24):** "vi tager trin 1 nu".
- `npm audit fix` (kun package-lock.json ændret, ingen brydende ændringer): npm audit gik fra 11 til 3 sårbare pakker. **Målt:** buildet før og efter er identisk — 1564 filer, 0 nye/væk/ændrede (nyt script `_dist-fingeraftryk.mjs`, ser bort fra build.json og sw.js). Husets tre tjek grønne.
- Commit `8c1e7db4`, live 12:33 (Cloudflare byggede med de nye versioner uden fejl). **Dependabot: 30 → 9 åbne** (21 lukket automatisk).
- **Tilbage (trin 2, ikke aftalt endnu):** astro (kritisk), sharp, esbuild kræver Astro 6.4.6 → 7.3.8 — ny hovedversion, testes og vises før udgivelse.

### 14/10-2026 kl. 12:25 - techfeedwatch: GitHub-sikkerhed slået til (Jacobs ok)
- Repoet er **offentligt** (målt via API), så funktionerne er gratis ("No additional licenses will be consumed").
- **Slået til** i Jacobs Chrome: Dependabot alerts, Secret Protection (secret scanning), Push protection. Slået fra/urørt: Dependabot security updates (automatiske PR'er — kan rode i robottens arbejde), code scanning, private vulnerability reporting, security policy, Malware alerts (dukkede op efter Dependabot; ikke aftalt).
- **Secret scanning:** 0 fundne hemmeligheder.
- **Dependabot: 30 advarsler** (npm audit: 11 pakker — 1 kritisk, 9 høje, 1 lav). Alle i byggeværktøjer, ikke i det, besøgende får (sitet er statisk HTML). 8 pakker kan rettes med `npm audit fix` uden brydende ændringer; astro (kritisk), sharp og esbuild kræver Astro 6.4.6 → 7.3.8 (ny hovedversion). **Intet rettet endnu** — afventer Jacob.

### 14/10-2026 kl. 12:07 - techfeedwatch: hop til overskrift virker nu også på rigtige telefoner (LIVE)
- **Jacob (11:52):** virker på pc og i pc'ens mobilvisning, men ikke på hans telefon. Har tømt Cloudflares cache.
- **Årsag (fundet og genskabt):** `body` var `100vh` høj. På en rigtig telefon er 100vh højere end det synlige (adresselinjen, ca. 56 px), så selve siden kunne rulle. Et hop til en overskrift rullede derfor hele siden ~56 px op, og overskriften endte under topbaren (målt: 28 px fra toppen, topbaren slutter ved 60). Pc'ens mobilvisning har ingen adresselinje, derfor virkede den dér. Cloudflare-cachen var ikke årsagen.
- **Rettet** (commit `6bab75e7`, live 12:04, `MainLayout.astro` = alle sider): `height: 100dvh` (den synlige højde) + en sikring, der ruller selve siden tilbage til 0, når al rulning er stoppet. Første udgave af sikringen nulstillede midt i hoppet og afbrød det (målt lokalt, rettet før udgivelse).
- **Målt live** med rigtigt klik: telefon med adresselinje (efterlignet), mobil og pc lander alle 24 px under topbaren; siden selv rullet 0.
- **Cloudflare tjekket 12:15** (Jacob loggede ind; kun læst, intet ændret): Caching Level Standard, Browser Cache TTL 4 timer, Development Mode fra, Crawler Hints til, Always Online til, CSAM-scanning til. Artikel-HTML sendes med `max-age=0, must-revalidate` og `cf-cache-status: DYNAMIC` = gemmes hverken hos Cloudflare eller i browseren, så Purge/Invalidate er ikke nødvendigt efter et deploy.
- Lære: Pc'ens mobilvisning er ikke en telefon — den har ingen adresselinje. Mål med `_maal-tochop.mjs ... telefon`, som efterligner den.

### 14/10-2026 kl. 11:37 - techfeedwatch: hop til overskrift med 24 px luft (LIVE)
- **Jacob:** med 16 px mangler overskriftens øverste linje, og "Watch: the video" forsvinder — foreslog 24 px.
- **Målt før rettelse**, rigtigt klik i synlig fane (nyt script `_maal-tochop.mjs`, logger overskriftens top hver 100 ms): landede 16 px under topbaren på både pc (1536x646) og mobil (390x750); intet lå over overskriften, og topbaren skjules ikke af noget script. Jeg kunne altså **ikke genskabe** det afskårne — årsagen er ikke fundet.
- **Rettet** til 24 px (commit `bfab5bea`, live 11:35, alle 428 artikler). **Målt live:** overskriften 24 px under topbaren på pc og mobil; videoens bund 555 af 644 px — hele videoen synlig.
- Lære: Mål hoppet med et rigtigt klik i en synlig fane (headless Chrome), ikke kun med et øjeblikkeligt hop — og spørg, på hvilken skærm fejlen ses, når målingen ikke genskaber den.
- Fundet undervejs: linjen "Seneste for techfeedwatch" i afsnit 0 var skrevet med ødelagte danske tegn ("KÃ˜RER") af en tidligere session — rettet med nyt script `_ret-mojibake.mjs` (kun den ene linje var ramt).
- Lære: Efter hver rettelse i statusfilen: kør `node _ret-mojibake.mjs STATUS-ALLE-SITES.md` — skal sige "0 linjer rettet".

### 14/10-2026 kl. 11:19 - techfeedwatch: hop fra indholdsfortegnelsen lander rigtigt (LIVE)
- **Jacob (11:13):** klik på "Watch: the video" lander lidt for langt nede. **Målt** i Jacobs Chrome: overskriften landede 90 px under topbaren, og videoens bund blev skåret af. **Årsag (min fejl 13/10):** `scroll-margin-top: 90px` blev sat ud fra, at topbaren lå over teksten — men sitet ruller i `.content-area`, som starter under topbaren, så luften kom oven i. Gjaldt alle punkter i indholdsfortegnelsen.
- **Rettet** (commit `ffb8d169`, live 11:19): 16 px. Målt lokalt: overskriften 16 px under topbaren, hele videoen synlig (bund 547 af 644 px). Live-tjek: reglen er 16px.
- Lære: Mål hvilken boks der ruller (`.content-area`), før en scroll-luft sættes. Og: en fane i baggrunden kører ikke blød rulning — mål med et øjeblikkeligt hop.


### 14/10-2026 kl. 11:00 - techfeedwatch: omskrivning 5/dag på GitHub, video i indholdsfortegnelsen, "Keep reading"-boks (LIVE)
- **13/10 aften:** indholdsfortegnelsen 600 px (v109). Robotten udgav 2 nye artikler i nat; alle kørsler grønne.
- **AI-billedkørslen kl. 05:43 blev ikke startet af GitHub** (planlagte kørsler kan udeblive); dagens 12 lavet ved manuel start. **Jacob (09:58-10:10):** billeder og omskrivning slås sammen — **5 omskrivninger om dagen, nyeste først**; kreditten 182 kr.
- **Bygget** (commit `2280c19e`): `omskriv-gamle.mjs` + workflow "Omskriv gamle artikler" (dagligt 08:37, 5 artikler, fejlliste `src/data/omskriv-fejl.json`, log med målt pris `src/data/omskriv-log.json`, stop ved 3 i træk, indholdstjek før gem). Omskrivning genbruger eksisterende AI-billede. Billedkørslen sat på pause. Fælles kø (`concurrency: site-skriver`) for robot, omskrivning og billeder.
- **Første kørsel (manuel, 10:12-10:33, `b9c0e323`):** 2 af 5 omskrevet (Sora, VR-briller — live med kildeliste), 3 stoppet (SEO: 3 delspørgsmål ubesvaret; VR-goggles: kilden handler ikke om spørgsmålet; programming: midlertidig 500-fejl hos Google). **Målt pris på GitHub: 0,795 USD for 5 forsøg = 0,16 USD pr. forsøg (som på pc), 0,40 USD (ca. 2,70 kr.) pr. omskrevet** — dyrere pr. artikel end på pc, fordi færre lykkedes (2/5 mod 7/10). **Fejl i min sikring:** den midlertidige 500-fejl satte artiklen på "aldrig igen"-listen — rettet (`29339aec`), artiklen fjernet fra listen.
- **"Watch: the video" i indholdsfortegnelsen** (Jacob, commit `0d216a35`, live 10:27): ▶ i cirklen på videoens rigtige plads, også i "On this page". Målt på 428 sider: punkt, mål og plads rigtige.
- **"Keep reading on Tech Feed Watch"** (Jacob, commit `d72f5f29`, live 10:59): 2 forslag (før 3 på computer / 4 på mobil), samme emne først, helst artikler med AI-billede og kildeliste, ikke forrige/næste; teal top-bjælke; emne + læsetid på kortene; liste på mobil; 600 px. Tjekket computer, mobil og mørk tilstand.
- **Jacob spurgte (10:35)** om teksten var blevet gjort smallere — målt: nej, teksten har været 600 px siden 7/10 (`fcecccd3`); kun boksen blev ændret 13/10.
- Lære: En sikring, der husker fejl, skal skelne midlertidige fejl (500/503/429) fra egentlige stop. Og: kør aldrig tjek, før buildet er færdigt (audit-site gav 6310 "fund" på et halvt build) — vent på "page(s) built".


### 13/10-2026 kl. 21:21 - techfeedwatch: indholdsfortegnelsen samme bredde som teksten (LIVE)
- **Jacob (21:15):** "In this article" var lige så bred som billedet — "ser dumt ud". Mit forslag: samme bredde som artikelteksten (600 px, venstrestillet). Jacob: ret uden at vise.
- **Gjort** (commit `6a96537d`, live 21:21): `.toc-container { max-width: 600px }`. Målt i browseren: 602 px med kant på computer (før 766), mobil uændret (370). Build 632 sider 0 fejl; live-tjek: reglen findes på Wolfram-artiklen.


### 13/10-2026 kl. 21:05 - techfeedwatch: forrige/næste i samme emne + ærlig forfattertekst (LIVE)
- **Jacob (20:53-20:55):** "Previous/Next" skal stå lige over "Explore Topics". Jeg foreslog også: inden for samme emne (før efter dato på tværs af emner) og at rette forfatterboksens tekst, der stadig sagde "using the video's transcript as its research material". Jacob: ja.
- **Gjort** (commit `95063d79`, live 21:04): forrige/næste står lige efter del-boksen og før Explore Topics, valgt inden for samme første emne ("← Previous in Hardware & Chips"); Shorts og emner med kun én artikel som før. Forfatterboksen: ny tekst (Google-søgning, navngivne kilder, video som supplement, automatiske tjek, AI-billede-linje) på artikler med kildeliste; den gamle, stadig sande tekst på de gamle artikler. Forfattersiden `/author/jacob-olsen` (to afsnit med samme forældede beskrivelse) rettet: beskriver den nye metode og siger, at artikler fra før oktober 2026 byggede på transskriptet og bliver skrevet om.
- **Målt** (`_tael-nav.mjs`, alle 428 artikelsider): placering rigtig 428/428, 834/834 forrige/næste-links i samme emne, forfattertekst rigtig (12 nye, 416 gamle). Build 632 sider 0 fejl, audit-site og audit-content 0 fejl. Live-tjek: GPU-artikel, gammel SEO-artikel og forfattersiden.
- Lære: Hent tekst, der skal erstattes, fra filen selv — den lange tankestreg (—) i forfattersiden fik min rettelse til at fejle stille, og buildet kørte med den gamle tekst. Tjek også, at et build er færdigt (tidsstempel), før resultatet bruges.


### 13/10-2026 kl. 20:48 - techfeedwatch: ny indholdsfortegnelse (LIVE)
- **Jacob (20:11-20:43):** indholdsfortegnelsen "flyder sammen med artiklen" — skal være tydelig; flydende udgave? Første udgave (venstrekant) lignede resuméboksen. Tre forslag vist som skærmbilleder (A tidslinje, B fliser, C top-bjælke); Jacob valgte C + tidslinjens linje mellem cirklerne, prikket. "Du bygger det."
- **Bygget** (commit `524ddebe`, live 20:48): "In this article · N sections" i en teal top-bjælke (hvid tekst på fast #0e7490), nummererede cirkler forbundet af en prikket linje (runde prikker 2 px / 3 px mellemrum; fra cirkel 1 til sidste nummer, ikke til Sources), lidt mere luft på computer. Flydende "On this page" øverst i sidebjælken på computer (skjult under 900 px), afsnittet man læser fremhæves. Overskrifter man hopper til gemmer sig ikke under topbaren (scroll-margin).
- **Kontrol:** build 632 sider 0 fejl, audit-site 0 fejl, skærmbilleder af den indbyggede udgave (computer + mobil), fremhævning prøvet ved at rulle (`_shot-rul.mjs`), biograf-tilstand på mobil uændret. Live-tjek: "In this article", "On this page" og den nye CSS findes på Wolfram-artiklen.
- **Nye værktøjer:** `_shot-toc.mjs` (lægger en variants CSS ind før skærmbilledet — viser forslag uden at røre sitet), `_shot-rul.mjs` (skærmbillede efter at have rullet til en overskrift).
- Lære: Skærmbilleder med udsnit (clip) virker ikke på dette site, fordi det ruller i en indre boks — tag hele skærmen og klip bagefter. Og: stop ikke forhåndsvisningen, før alle tjek, der bruger den, har kørt.


### 13/10-2026 kl. 20:04 - techfeedwatch: kildelisten sidst + del-knap øverst (LIVE)
- **Jacob (19:55-20:00):** "People also ask" skal ikke stå under kilderne; "bare ret det" (ingen skærmbilleder ønsket). Del-knap øverst, "som du mener er det bedste sted".
- **Kildelisten sidst** (commit `20a4976f`): "## Sources" klippes ud af artikelteksten og sættes ind efter FAQ. Rækkefølge nederst: artikel, People also ask, FAQ, Sources, del-boksen. Ankeret #sources følger med. "Listen" læser ikke kildelisten op. Målt på build (`_tael-kilder.mjs`): 12 artikler med kildeliste, 12 i rigtig rækkefølge, 0 dobbelte; videoens placering uændret (405/23).
- **Del-knap øverst** (commit `78e1b8c9`, live 20:04): Share-knap i højre side af byline-linjen (under titlen), samme stil og delefunktion (`share-trigger`) som knapperne under videoen. Mine skærmbilleder (computer + mobil): står pænt uden at skubbe titlen. Live-tjek af GPU-artiklen: del-knap øverst, kildeliste før del-boksen, "Sources" kun én gang.


### 13/10-2026 kl. 19:40 - techfeedwatch: de 7 omskrevne gamle artikler udgivet
- **Jacob (19:36):** "ja udgiv de 7". Commit `98722bec` (de 7 artikler + billeder + forbrugstælleren i `src/lib/model.mjs`), live 19:39. Før push: audit-content 0/0, interne links OK, build 631 sider 0 fejl, audit-site 0 fejl. Tjekket på techfeedwatch.com: alle 7 har kildeliste og AI-billede; de 3 stoppede (quantum mechanics, Nike, quantum hype) viser stadig den gamle version.


### 13/10-2026 kl. 19:33 - techfeedwatch: 10 gamle artikler omskrevet lokalt og målt (IKKE udgivet)
- **Jacob (18:46):** "ret 10 gamle artikler nu her, og mål på dem". Valgt (`_vaelg-gamle.mjs`): gammel opskrift (ingen kildeliste), har søgespørgsmål, flest visninger på kildevideoen, højst 2 pr. emne. 265 af 423 gamle artikler har et søgespørgsmål; 158 har ikke.
- **Nyt måleværktøj:** forbrugstæller i `src/lib/model.mjs` (alle Gemini-kald gennem `hentModel`, også billedmodellen): linjen `FORBRUG:` med tokens, søgninger, billeder og USD pr. kørsel.
- **Resultat** (`_gamle-10.ps1`, 18:47-19:32, kun lokalt): **7 af 10 omskrevet** — Wolfram, no-code AI-agenter, Nvidia, RAM-mangel, Anthropic Mythos, privat AI-video, S&P 500: video-andel 17-26 %, 0 tal uden kilde, 4-9 websider, outline 5/5-6/6, FAQ fra rigtige søgninger 2/3-4/4, alle med AI-billede. **3 stoppet:** quantum mechanics (kildevideoen handler om noget andet, relevans 4/10), Nike (4 ensidige sætninger efter rettelse), quantum hype (1 delspørgsmål ubesvaret efter rettelse). De gamle versioner af de 3 er urørte.
- **Målt pris:** i alt 1,661 USD (ca. 11 kr.) for 10 forsøg = 0,166 USD pr. forsøg, 0,237 USD (ca. 1,50 kr.) pr. omskrevet artikel. Mit skøn (0,05-0,10) var for lavt. De 2 redaktør-stop kostede fuld pris uden resultat; relevans-stoppet kun 0,02 USD.
- **Fremskrivning:** de 265 gamle med søgespørgsmål ≈ 44 USD (ca. 285 kr.), ca. 185 bliver omskrevet. De 158 uden søgespørgsmål kræver en anden løsning.
- Lære: Et opsamlingsscript, der leder efter "FORBRUG:", fangede "SOEG-FORBRUG:" først — søg på linjestart (`^`), når et navn indgår i et andet.


### 13/10-2026 kl. 13:43 - techfeedwatch: AI-billeder til arkivet — 12 om dagen, set virke på GitHub
- **Jacob (13:36-13:39):** først 20 om dagen ("83 kr tilbage i AI Studio"), rettet til **12 om dagen**. Advaret: 83 kr. rækker ca. 10 dage alene til billeder (20/dag) og kreditten deles med robotten — tom kredit stopper robotten som 9.-10/10. Hele arkivet koster ca. 165 kr.
- **Gjort:** workflow "AI-billeder (gamle artikler)" kører hver morgen kl. 05:43 dansk tid med 12 artikler (commit `1590b5ee`); stopper selv ved 3 fejl i træk. Prøvekørsel med 2 artikler på GitHub: gennemført (1 min 30 s), commit `8bc65f25` — "how do VR glasses work" fik billede i 1. forsøg, "programming can make you rich…" afvist for tekst i begge forsøg (emnekortet beholdt).
- **Rettet bagefter** (commit `24825b5a`): 1) prompten beder nu billedmodellen undgå ting, der bærer tekst (skærme, skilte, dokumenter, grafer, tastaturer …) — 6 af de første 8 artikler fik 1. forsøg afvist for tekst; 2) fejlhukommelse `src/data/ai-billeder-fejl.json`: en artikel afvist i 2 kørsler prøves ikke igen (ellers koster den penge hver morgen). Prøvet lokalt på "programming…": godkendt i 1. forsøg med den nye prompt (kode -> rør -> mønter).
- **Status:** AI-billede på 8 artikler; ca. 420 tilbage, ca. 5 uger med 12/dag.
- Lære: Tekst i filer med danske tegn rettes med edit_block eller node-script, ikke PowerShell — gik godt denne gang, men reglen står i HOVEDPROMPT.


### 13/10-2026 kl. 13:30 - techfeedwatch: AI-billeder (LIVE for 5 artikler + robotten; arkivet venter på tempo)
- **Jacob valgte (13:07-13:21):** A mærket hedder "AI-generated" (ikke "AI Foto": sitet er engelsk, og "foto" lover et fotografi); B samme billede øverst i artiklen, på kortene og som delebillede; C alle artikler — prøv 5 først; to billedstørrelser.
- **Bygget** (`src/lib/aibillede.mjs`, commit `f4956e66`, live 13:29): Googles billedmodel `gemini-nano-banana-2.1` (ca. 0,034 USD pr. billede), fast stil (konceptuel 3D-illustration, mørk baggrund, emnefarve), regler: ingen tekst/logoer/personer. Gemini tjekker hvert billede og afviser tekst/logo/person (ét nyt forsøg, ellers emnekortet). Mærker: "AI-generated" øverst til venstre, "TechFeedWatch.com" diskret nederst til højre. IPTC-mærket `trainedAlgorithmicMedia` + kredit i filens XMP (tjekket i både webp og jpg). Tre filer pr. artikel: `public/kort` 480x270 (lister, 12-21 KB), `public/billeder` 960x540 (artiklens top + forsidens tophistorie), `public/og` 1200x630 (deling). Alt-tekst "AI-generated illustration: <titel>". Robotten laver billedet til hver ny artikel (`add-video.mjs`; reserve: emnekortet). `lav-kortbilleder.mjs` springer artikler med AI-billede over. Originalerne gemmes i `.cache/ai-billeder` (mærker kan laves om uden at betale igen).
- **Prøver:** 5 artikler (GPU, data breach, SEO vs PPC, quantum, "does SEO help") — Jacob: "de ser fine ud". 4 af 5 første forsøg afvist for tekst → ca. 0,06 USD pr. artikel i snit. Live nu: quantum, GPU, SEO vs PPC, "does SEO help", Sora (data breach er ikke blandt de 5 nyeste og venter på arkivkørslen).
- **Arkivet:** `lav-ai-billeder.mjs` + workflow "AI-billeder (gamle artikler)" (nyeste først, --antal pr. kørsel). Tidsplanen er SLÅET FRA: tempoet afhænger af Gemini-loftet (30 USD/md., delt med robotten). Min fejl undervejs: jeg anbefalede først 50/dag, men 50 x 0,06 x 9 dage = 27 USD — næsten hele loftet.
- **Kontrol:** build 632 sider 0 fejl, audit-site og audit-content 0 fejl, selvtest grøn, skærmbilleder af forside og artikel (computer + mobil).
- Lære: Regn prisen ud mod loftet, før et tempo anbefales — "50 om dagen" lød rimeligt, men ville have brugt næsten hele månedens Gemini-loft.


### 13/10-2026 kl. 12:52 - techfeedwatch: videoen efter artiklens første sektion, indholdsfortegnelsen op (LIVE)
- **Jacob (12:36):** videoen lige under første afsnit "ser dumt ud". Mine forslag: A efter første sektion, B ved artiklens eget videoafsnit, C efter andet afsnit. **Jacob valgte A (12:43)**, sagde ja til udgivelse (12:51).
- **Gjort** (commit `e665acf9`, live kl. 12:52): artiklens HTML deles nu lige før ANDEN overskrift (åbning + første sektion før videoen; under to overskrifter: efter første afsnit). Indholdsfortegnelsen flyttet op under billedet (i første læseblok, skjules i biograf-tilstand). Afspiller, videoliste, linje og knapper urørte.
- **Målt** (`_tael-deling.mjs` på alle 428 artikelsider): 404 med videoen efter første sektion, 24 efter første afsnit (færre end to overskrifter), rækkefølge rigtig på alle. Gammel artikel sammenlignet (`_sammenlign-artikel.mjs`): samme tekst, links og ankre. Biograf-tilstand på mobil: cinema-mode, video fixed, videoliste vist. Build 632 sider 0 fejl, audit-site og interne links OK. Live-tjek af GPU-artiklen: rækkefølge rigtig, 1 overskrift før videoen. Skærmbilleder: `Claude outputs/fase-D2-video-efter-foerste-sektion`.
- Lære: Når et tjekscript leder efter en klasse, så søg på elementet (`class="…"`), ikke ordet — ordet står også i sidens CSS (gav "428 forkerte" i første måling).


### 13/10-2026 kl. 12:31 - techfeedwatch: FASE D — LIVE, robotten tændt og set virke
- **Jacob: "Du fortsætter og det er ja til alt" (11:53).**
- **Sidste prøve:** GPU-artiklen omskrevet med den rettede tal-detektor (°C m.fl.): robotten fandt selv 3 tal uden kilde og rettede dem til 0. Uafhængig måling af de 3 prøver (fase A-værktøjet, `Claude outputs/fase-D-proever-maaling-2026-10-13.md`): tal uden navngiven kilde **2 %** (fase A 77 %, fase C 11 %), video-andel median **27 %** (fase A 75 %), overskrifter der svarer på søgningen **71 %** (fase A 47 %), kildelister 3/3.
- **Live:** grenen `soegning-foerst` lagt oven på origin/main (`515f0f9d`, kun påstandsregister — ingen konflikt) med `git pull --rebase --autostash`; commit-numrene skiftede ved omlægningen (fx `cb433495` -> `7772eaa0`). Build 631 sider 0 fejl, alle tjek grønne, `_tael-videolinje.mjs`: 3 B / 424 A / 0 ingen. Pushet `515f0f9d..8ad9e4b5` kl. 12:04; live (build.json) kl. 12:05. Tjekket på techfeedwatch.com: GPU-artiklen (Watch: the video, In the video, Sources, billede, "Based on 7 web sources"), gammel artikel ("N min video by …", gammel tekst væk), forsiden (27 egne kort, 0 YouTube-miniaturer).
- **Robotten:** "YouTube Auto Update" og "Tomgangsalarm" slået til i Jacobs Chrome (gh-værktøjet findes ikke på pc'en). **Fundet:** de 4 sidste kørsler før pausen (#655-#658, 9.-10/10) fejlede med "402 Payment Required — prepayment credits are depleted" (Gemini-kreditten brugt op). Manuel kørsel #659 på den nye kode: **gennemført uden fejl (11 min 31 s)** og udgav selv "What Does Quantum Computing Solve for Molecules and Crypto?" (commit `4baf9e16`, live kl. 12:30): overskrifter der svarer på søgningen inkl. begrænsninger, videoafsnit, 12 kilder, FAQ fra rigtige søgninger. Robottens egen KILDETJEK-linje kunne ikke læses (GitHub skjuler for store logtrin) — udgivelsen betyder, at alle stop-tjek blev bestået.
- **Åbent:** Gemini-kreditten skal holdes øje med (Jacob, AI Studio -> Billing); Search Console-faldet 82 -> 54; gamle grene på GitHub (inkl. den lokale `soegning-foerst`, slet kun med Jacobs ok); forkert varighed på gamle artikler (ikke målt).
- Lære: Tjek robottens seneste kørsler, FØR den tændes igen — de 4 fejlede kørsler (tom kredit) var usynlige bag "pause".


### 12/10-2026 kl. 21:27 - techfeedwatch: "ja til alt" — kildetjek B, outline-trin, FAQ fra rigtige søgninger (kun lokalt, PAUSE til i morgen)
- **Jacob sagde ja til alt (20:57):** 1) kildetjek B, 2) outline-trin, 3) FAQ fra rigtige søgninger, 4) behold prøverne data breach, SEO vs PPC, GPU — slet fintech og Sora, 5) live når 1-4 er prøvet og han har sagt ok.
- **Gjort** (commits `cb433495` m.fl. på `soegning-foerst`, IKKE skubbet): kildetjek B (firmaers egne data og officiel dokumentation tæller som stærk) + ekstra søgerunde efter primærkilder, når kildetjekket gør søgningen for tynd (SEO: Google Ads Help, Google Research, NBER, Chicago Booth, FTC i stedet for 10 bureau-blogs). Outline-trin (`src/lib/artikelplan.mjs`). FAQ fra Googles autocomplete. Fintech- og Sora-prøven slettet (6 filer, med Jacobs ok).
- **Målt:** data breach: outline 6/6, FAQ 4/4, 0 tal uden kilde, video 26 %. SEO vs PPC: outline 6/6, FAQ 4/4, 7 websider, video 19 %. GPU: outline 5/5, FAQ 4/4. Uafhængig måling (fase A-værktøj) af de 3: overskrifter der svarer på søgningen 76 % (fase C 65 %), MEN tal uden navngiven kilde 32 % — årsag: tal-detektoren kendte ikke °C/GHz m.fl. (15 af 16 fund i GPU) og tabelrækker. Rettet (enheder + tabelregel + afsnit delt efter tjekket), selvtest grøn.
- **Afbrudt ved pausen:** GPU-artiklen var ved at blive skrevet om med den rettede detektor; kørslen blev stoppet (intet halvt skrevet — robotten skriver kun ved succes). GPU-filen er den fra kl. 21:19 (før rettelsen).
- **I MORGEN, i denne rækkefølge:** 1) kør GPU-omskrivningen igen og mål de 3 med fase A-værktøjet (mål: tal uden kilde tilbage på ~10 %), 2) build + skærmbilleder til Jacob, 3) Jacobs ok, 4) fase D: flet `soegning-foerst` ind i main, git pull --rebase, push, tænd "YouTube Auto Update" og "Tomgangsalarm".
- Lære: En tal-detektor skal kende de enheder, emnet bruger — temperaturer gled igennem, fordi listen kun havde økonomi- og datamængde-enheder.


### 12/10-2026 kl. 20:38 - techfeedwatch: tre svagheder fra fase C rettet i robotten (kun lokalt)
- **Jacob godkendte artikelsiden (20:24, "det er ok. du koder").** Jeg tolkede "du koder" som: ret de tre svagheder fra fase C før live (ikke fase D).
- **Gjort** (commit `a939f6aa` på `soegning-foerst`, ikke skubbet): 1) **Emnetjek** før videosøgningen (`passerEmnet` i `src/lib/spoergsmaalsfilter.mjs`, 3 domme, flertal; null stopper aldrig robotten) — prøvet på 9 spørgsmål: 9/9 rigtige (Naruto, Kingdom Hearts og fodbold afvist). 2) **Kildetjek** i søgningen (`svageKilder` i `src/lib/soegning.mjs`, cache v3): svage sider (indholdsfarme, markedsrapport-sider, SEO-/affiliate-blogs) og deres fakta fjernes. 3) **Præmis-spørgsmål:** søgningen skal finde fakta for OG imod; ny regel 23 i artikel-prompten; redaktørtjekket finder ensidige sætninger, retter dem, og stopper ved 3+ efter rettelse (`MAKS_ENSIDIGE = 2`).
- **Målt:** redaktørtjekket fandt "Despite clear operational superiority …" i fintech-prøven. Ensidige sætninger i de 5 prøver, to kørsler: 0/1, 3/4, 5/3, 0/0, 0/0 — dommen svinger, derfor grænsen 3 og ikke 1. Fintech omskrevet: 5 svage kilder fjernet (bl.a. novus-loyalty.com), FDIC/Federal Reserve/CFPB kom med, men 3 ensidige sætninger efter rettelse -> ingen artikel (den gamle prøve urørt). SEO vs PPC omskrevet: 6 af 7 kilder dømt svage (mailchimp, seomator m.fl.) -> 1 faktum tilbage -> "for tynd", ingen artikel.
- **Åben beslutning (Jacobs):** kildetjekket er så strengt, at SEO-spørgsmål (og formentlig Productivity/Automation) næsten altid stoppes, fordi topresultaterne er SEO-firmaers egne blogs.


### 12/10-2026 kl. 20:21 - techfeedwatch: læsetiden fjernet fra linjen under videoen (kun lokalt)
- **Jacobs indvending (20:17):** "8 min video · 6 min read" får læseren til at tro, at artiklen er lavet ud fra videoen. Enig: tallene side om side lægger op til "læs i stedet for at se", og læsetiden står allerede ved byline.
- **Gjort** (commit `02f1b835` på `soegning-foerst`, ikke skubbet): linjen er nu "8 min video. In the video: <afsnittets overskrift>" (nye) / "25 min video by PhotoBiz." (gamle). Læsetiden kun øverst.
- **Målt på alle 429 sider:** B 5, A 424, ingen 0, "min read" i linjen 0, gammel tekst/overskrift 0. Build 633 sider 0 fejl, audit-site 0 fejl. Skærmbilleder: `Claude outputs/fase-B5-uden-laesetid`.


### 12/10-2026 kl. 20:13 - techfeedwatch: ny linje under videoen + overskriften "Watch: the video" (kun lokalt)
- **Jacobs valg (20:09):** min anbefaling — B med A som reserve, og ny overskrift. Begrundelse: "Spend X min here to decide whether the other Y are worth it" beskrev artiklen som en smagsprøve på videoen og modsagde "Based on N web sources"; "The video behind this article" sagde, at artiklen var lavet ud fra videoen.
- **Gjort** (commit `5c62c3bc` på `soegning-foerst`, ikke skubbet, kun tekst — afspiller og knapper urørte): B = artikler med kildeliste: "8 min video · 6 min read. In the video: <overskriften på artiklens videoafsnit>" med link til afsnittet. A = de andre: "8 min video by <kanal> · 6 min read." Videoens minutter regnes nu direkte af varigheden (før skjulte `compareTimes` linjen, når videoen var under 2 min længere end læsetiden). Overskriften over afspilleren: "Watch: the video".
- **Målt på alle 429 byggede artikelsider** (`_tael-videolinje.mjs`): B 5 (alle prøveartiklerne, 0 brudte links), A 424, ingen linje 0; den gamle tekst og den gamle overskrift står 0 steder. Build 633 sider 0 fejl, audit-site 0 fejl. Skærmbilleder: `Claude outputs/fase-B4-linje-under-videoen`.


### 12/10-2026 kl. 19:48 - techfeedwatch: videoen lige under artiklens første afsnit (kun lokalt)
- **Jacobs ønske (19:44):** videoen skal ligge lige under artiklens første afsnit (ikke under billedet).
- **Gjort** (commit `3757e0a5` på `soegning-foerst`, ikke skubbet): artiklens HTML (`compiledContent()`) deles efter første `</p>`. Rækkefølge: titel, byline, kildelinje, resumé, billede, artiklens første afsnit, "The video behind this article", afspiller + videoliste (urørt), tidslinje + knapper (urørt), emner, indholdsfortegnelse, resten af artiklen. Første afsnit ligger i første `.cinema-reading-block` (skjules i biograf-tilstand som titlen); afspilleren står stadig MELLEM læseblokkene, så biograf-tilstand og hjørnevindue virker som før. Starter en artikel ikke med et afsnit, står hele artiklen efter videoen. "Listen" læser nu begge dele i rækkefølge (før kun første element med klassen `video-content`).
- **Kontrol:** build 633 sider 0 fejl · audit-site 0 fejl · interne links OK · artikelteksten før/efter sammenlignet (`_sammenlign-artikel.mjs`) på en ny og en gammel artikel: samme tekst, samme links, samme antal afsnit, samme overskrift-id'er · biograf-tilstand på mobil: video `fixed`, videoliste vist, tekst skjult. Skærmbilleder: `Claude outputs/fase-B3-video-efter-foerste-afsnit`.


### 12/10-2026 kl. 13:28 - techfeedwatch: artikelsiden — videodelen tilbage som før, billede under intro (kun lokalt)
- **Jacobs krav (13:22):** videoen må ikke ligge i bunden; boksen "The video behind this article" skal meget højere op; knapperne under videoen (Listen, Helpful, Share, Save) skal blive; videodelens opsætning på pc og mobil MÅ IKKE ændres; et billede lige under den korte intro; intet udgives før han har set det.
- **Gjort** (commit `b8045eb0` på `soegning-foerst`, ikke skubbet): `src/pages/video/[slug].astro` er bygget fra versionen før fase B (`06454d46`) med `_byg-slug.mjs`. Afspiller (#stickyVideo), videoliste (#cinemaBrowser), tidslinjen ("Spend X min here …"), knapperne og AL CSS/JS til biograf-tilstand og hjørnevindue er identiske med originalen (diff tjekket linje for linje). Nyt: sitets eget billede (`/kort/<slug>.webp`) under resuméet + overskriften "The video behind this article" lige over afspilleren — begge i første `.cinema-reading-block`, så biograf-tilstanden skjuler dem som titlen. Bevaret fra fase B: "Based on N web sources …" og sitets kort i relaterede/"You might also like"/gemte.
- **Kontrol:** build 633 sider 0 fejl · audit-site 0 fejl · biograf-tilstand på mobil prøvet med sidens testkrog (`?slow=2` + `__fxEnter`): cinema-mode til, video `fixed`, videoliste vist, billede/overskrift skjult — samme tilstand som live-siden. Skærmbilleder: `Claude outputs/fase-B2-video-hoejere`.
- Lære: Jeg flyttede videodelen i fase B uden at spørge, selv om den er Jacobs mest gennemarbejdede del. Før en del af siden, Jacob har bygget med omhu, ændres: læs hvordan den virker, og spørg hvor den må stå.


### 12/10-2026 kl. 13:04 - techfeedwatch: fase C — 5 prøveartikler med den nye opskrift (kun lokalt)
- **Kørt** (`_fase-c.ps1`, 12:21-12:59, 38 min, intet pushet): 1) `--erstat` "what does a data breach mean", 2) `--erstat` "difference between SEO and pay per click" (transskriptet var arabisk — kom nu på engelsk), 3-5) robotten selv (`auto-youtube.mjs --ignorer-loft`, PROEVE_EMNE) i Fintech, AI Video og Hardware & Chips -> "why fintech is better than banks", "what happens when sora ai shuts down", "difference between gpu temp and hotspot". `src/data/tried-questions.json` og `used-questions.json` sat tilbage bagefter (prøverne må ikke bruge rigtige spørgsmål op). Prøveartiklerne ligger UCOMMITTEDE på grenen.
- **Robottens egne tjek** (KILDETJEK): video-andel 22/24/17/16/19 %, tal uden navngiven kilde 0/1/0/0/0, websider 13/6/9/7/11, alle delspørgsmål besvaret.
- **Uafhængig måling** (samme metode som fase A, `_maal-fase-a.mjs` + rapport, kildelisten talt fra): video-andel median **21 %** (A: 75 %), vægtet 27 % (A: 69 %); tal uden navngiven kilde **14 af 129 = 11 %** (A: 77 %); H2 der svarer på søgespørgsmålet **65 %** (A: 47 %); første afsnit svarer 5/5; kildelister 5/5 (A: 0/10). Hele sæt: `Claude outputs/fase-C-maaling-2026-10-12.md`.
- **Sora-prøven** målt til 67 % video af dommeren mod 16 % af robotten. Opdelt (`_tjek-sora.mjs`): 13 % i videoafsnittet, 30 % sætninger med navngiven webkilde, som videoen også nævner (videoen genfortæller samme nyhed), 24 % almene sætninger. Overlap, ikke referat. De 4 andre: videoindhold uden for videoafsnittet 0-4 %.
- **Pris** (målt i loggen, priser fra ai.google.dev 12/10, kurs ca. 6,5 kr/USD): 6 betalte søgninger, 26 Google-søgninger (4,3 i snit), 3.574 input- + 16.694 output-/tænke-tokens = 0,065 USD i alt, ca. 0,011 USD (0,07 kr) pr. søgning. Søgegebyr: 5.000 gratis søgninger/md. (delt for hele Gemini 3-kontoen), derefter 14 USD pr. 1.000 — robotten bruger skønnet under 1.000/md. Token-prisen fordobles 1/1-2027. Redaktørtjekkets og rettelsernes ekstra kald er IKKE målt.
- **Fejl fundet og rettet:** redaktørtjekket kaldte henvisninger til sitets egne artikler "reklame" og stoppede prøve 4's første video; nu undtaget (`src/lib/redaktoertjek.mjs`). Robotten tog næste video og bestod.
- **Fundet, ikke rettet (Jacobs valg):** svage andenhåndskilder slipper med (statisticsfundamentals.com, businessresearchinsights.com, novus-loyalty.com, kirkhamirontech.com); spørgsmålsfilteret godkendte "what happens to sora in naruto" (titelfiltret stoppede den, intet betalt); dublet-tjekket godkendte "what happens when sora ai shuts down" tæt på den eksisterende Sora-artikel; "why fintech is better than banks" overtager spørgsmålets præmis ("clear operational superiority"); tvungne link-sætninger ("X is examined in [link]"); grimme kildetitler fra adresser ("Psd2 and open banking market 125648"); "100,000 NRA" (sandsynligvis Naira, hørt forkert).
- Lære: Et tjek mod "henvisning til noget, artiklen ikke indeholder" skal undtage sitets egne links, og rettelsesprompten må ikke modsige tjekket ("behold links").
- Lære: `node -e` med anførselstegn i PowerShell fejlede igen (anden gang i dag) — HOVEDPROMPT siger det allerede; brug edit_block eller en scriptfil, altid.
- Lære: En rapport, der læser artikelfilerne igen, kan ikke genskabe en tidligere måling — fase A-rapporten fik "kildelister 2/10", fordi to filer var omskrevet; rettet til de målte 0/10. Tal skal gemmes i målingen selv.
- Lære: Når to målere er uenige (67 % mod 16 %), opdel før der konkluderes — det var overlap, ikke en fejl i opskriften.


### 12/10-2026 kl. 11:10 - techfeedwatch: fase B bygget (søgning først + design) — kun på lokal gren
- **Gren og commit:** `soegning-foerst`, commit `be96eac6` (874 filer: 22 kode, 426 nye listekort, 426 nye delekort). Kun lokalt — ikke skubbet, intet live. `main` er urørt.
- **Søgningen** (`src/lib/soegning.mjs`): Gemini med Google-søgning (grounding) undersøger søgespørgsmålet FØR videoen hentes: 4-6 delspørgsmål + fakta med navngiven udgiver. Et faktum beholdes kun, hvis Googles egne henvisninger peger på en side bag det; sidens rigtige adresse slås op (Googles links er omdirigeringer). Spærret som kilde: Scribd, SlideShare, fora, sociale medier, YouTube. Gemmes pr. spørgsmål i `.cache/soegning` (3 dage, versioneret), så robottens 4 kandidater deler én søgning. For tynd søgning = ingen artikel (stopper før transskript og faktaark koster noget). Prøvet: "what does a data breach mean" 6 søgninger, 6 delspørgsmål, 12/12 fakta med kilde (NIST, EU, IBM, Verizon, FTC); "is quantum computing a threat to bitcoin" 11/11.
- **Opskriften** (`add-video.mjs`): bygget fra delspørgsmålene; hvert tal skal nævne sin kilde i sætningen; videoen får præcis ét afsnit med kanalens navn i overskriften, højst ca. 25 % (krav om videodetaljer 5 -> 2); videoens opdigtede eksempler kun i videoafsnittet og som "skaberens eksempel"; kildeliste "## Sources" bygges af koden (`src/lib/kildetjek.mjs`). Nye stop: video-andel over 30 %, mere end 1 tal uden navngiven kilde, under 2 websider nævnt, ikke præcis 1 videoafsnit, ubesvarede delspørgsmål eller reklame (`src/lib/redaktoertjek.mjs`, ét rettelsesforsøg). Linjerne `SOEG-FORBRUG:` og `KILDETJEK:` i loggen er til fase C. Robotten springer nu kørslen over, hvis der intet søgespørgsmål er (`auto-youtube.mjs`).
- **Første prøveartikel** (`--erstat when-notified-what-does-a-data-breach-mean`, kun lokalt, IKKE committet): video-andel 19 % (fase A: 73 %), 0 tal uden kilde (før 5 af 6), 12 websider, alle 6 delspørgsmål besvaret, konkrethedsscore 76. Redaktørtjekket fangede 2 reklamesætninger, rettelsen fjernede dem. Svagt: kildelistens titler ("verizon.com") og en Scribd-kilde (læst fra en cache fra før spærringen) — begge rettet i koden bagefter, ses først i fase C. Titlen "Exactly What Does a Data Breach Mean for Security?" er klodset (titelrotationen, ikke fase B).
- **Transskripter på engelsk** (`src/lib/transskript.mjs`): beder YouTube om "en" (eller "en-US"/"en-GB"); en gemt kopi på et andet sprog bruges ikke. Prøvet på de 3 videoer, der gav arabisk: alle 3 gav engelsk.
- **Varighed** (fundet undervejs, ældre fejl): transskripter hentet på pc'en giver længder i millisekunder, så 8:20 blev til 26:07. `add-video.mjs` bruger nu YouTubes egne data. Hvor mange gamle artikler der har forkert varighed, er ikke målt.
- **Design:** artikelsiden viser titel, resumé og hele artiklen først; afspiller + videoliste står i afsnittet "The video behind this article" efter artiklen (biograf-tilstand og hjørnevindue virker uændret). Boksen øverst siger "Based on N web sources and a video by X" på nye artikler (gamle beholder "Researched with a video …"). "Spend X min here to decide …" fjernet. **Sitets eget kortbillede** (`og-card.mjs`, `lav-kortbilleder.mjs`): listekort 960x540 webp (emne + farvede bjælker, ingen titel, ingen afspil-trekant; 6 KB i snit) brugt 25 steder; delekort 1200x630 med titel. Videoens miniature beholdt 8 steder (videositemap, VideoObject-schema, miniature-værktøj, biograf-videoliste, Shorts, /popular).
- **Kontrol:** build 629 sider 0 fejl · audit-content 0/0 · audit-site 0 fejl · 997 interne links OK · test-skriveregler 54 OK · test-kildetjek 22 OK. Skærmbilleder (11 stk, mobil + computer) i `Claude outputs/fase-B-skaermbilleder`.
- Lære: Læs HOVEDPROMPT.md før statusfilen bygges — v91 blev bygget med Word i stedet for `_lav-version.mjs` + `_statusbyg/byg.mjs`.
- Lære: Slå klokken op før en statusbesked — første besked sagde 10:52, klokken var ca. 10:35.
- Lære: En cache for et modelsvar skal have et versionsnummer i nøglen, ellers overlever svar fra før en regelændring (Scribd).
- Lære: Googles henvisninger (groundingSupports) indeholder punkttegn og overskrifter — rens begge sider ens, ellers matcher intet (0 af 12).
- Lære: Efter redigering af en prompt-skabelon: læs den igennem — en dansk forklaring havnede inde i teksten til Gemini.
- Lære: Se et kortdesign i sammenhæng på siden, ikke kun billedet — titel i billedet + titel under kortet gav samme tekst to gange.
- Lære (samme fejl to gange -> værktøjet rettet): skærmbilledværktøjet viste gamle billeder fra cache og service worker; `shot.mjs` slår nu begge fra.


### 12/10-2026 kl. 10:13 - techfeedwatch: fase A målt (de 10 nyeste artikler)
- **Metode:** `_maal-fase-a.mjs` + `_maal-fase-a-rapport.mjs` (kun læsning, ikke i git). Gemini læser hver artikel mod videoens transskript 3 gange; hver sætning får flertallets dom (VIDEO / ALMEN / ANDEN). Enighed mellem de 3 domme 84-96 % af sætningerne. "De 10 nyeste" = senest tilføjet i git (5/10-9/10), ikke `publishedAt` (det er videoens dato). Hele sæt (alle 43 overskrifter, alle 140 tal): `Claude outputs/fase-A-maaling-2026-10-12.md`.
- **Video-andel:** 69 % af ordene (median 75 %, spænd 30-92 %). Kun 2 af 10 under 50 % (Whisper 30 %, kvantechips 38 %). Eksempel: "What does a data breach mean" bygger på videoens fiktive figurer (Northgate, Denise, Ray) fremstillet som fakta.
- **Overskrifter:** titlen svarer på spørgsmålet 10/10, første afsnit 9/10 ("best VR goggles" handler om ét produkt). Men kun **20 af 43 H2 (47 %)** svarer på det, søgeren vil vide; resten følger videoens opbygning eller skabelonen ("How It Works", "Who It's For").
- **Tal:** **95 af 123 tal-påstande (77 %) uden navngiven kilde**; 92 af dem står i videoen, men artiklen siger det ikke. 17 tal sorteret fra som navne/etiketter (Quest 3, Majorana 1, MP4, klokkeslæt). Kildeliste 0/10. De 16 eksterne links (7 af 10 artikler) er forsidelinks til firmaer (Google, Adobe, Meta …) - ingen dokumenterer en påstand.
- **Fund, ikke rettet:** 88 af 426 lokale transskripter i `.cache/transskripter` er ikke engelske (75 arabiske, 5 bengali, 2 hindi, 2 hollandsk m.fl.). Årsag: `src/lib/transskript.mjs` (ca. linje 121) kalder `YoutubeTranscript.fetchTranscript(videoId)` uden sprog, så YouTube kan levere et oversat spor. Artiklerne blev skrevet på GitHub, før de lokale kopier blev hentet (8.-10/10), så de er ikke skrevet ud fra arabisk. Men **afskrift-målingerne på pc'en 8/10 og 10/10 ("0 over 15 %") var blinde for de 88**. Rettes i fase B.
- Pris: målingen brugte 30 Gemini-kald; prisen er ikke målt.
- Lære: Tjek kildetekstens sprog, før en sammenligning mod den stoles på - et transskript på et andet sprog giver altid "0 % afskrift".
- Lære: Hurtige kontroller skal tåle Windows-linjeskift (CRLF) - min første link-optælling så ingen brødtekst og meldte 0 links.
- Lære: En støjregel skal ses på hele sættet - "bogstav foran tallet = navn" tog også opløsningen 2412x2288.
- Lære: `git log --format=@@` fejler (git læser det som et navngivet format); brug en pladsholder som `%h`.
- Lære: Nævn aldrig en pris, før den er målt (jeg skrev "ca. 1-3 kr." undervejs uden grundlag).

### 12/10-2026 kl. 10:10 - techfeedwatch: ugentlig Search Console-aflæsning - indekseringen FALDT første gang
- **Målt i Jacobs Chrome** (Googles data pr. 09.10.2026, effektivitet opdateret for 3,5 timer siden): indekseret **54**, ikke indekseret **832**, sitemap **566** adresser. Effektivitet 28 dage: **16 klik, 43 eksponeringer, 37,2 % klikrate, position 10,7**.
- **Siden 5/10:** indekseret 82 -> 54 (**-28**), ikke indekseret 769 -> 832 (+63), adresser 557 -> 566 (+9). Trækker man væksten fra, er den reelle bevægelse i "ikke indekseret" ca. **+54**. Klik 17 -> 16, eksponeringer 50 -> 43, position 8,8 -> 10,7. Efter fire aflæsninger med 82/769 bit for bit er dette **første gang tallene flytter sig - og de flytter sig den gale vej**.
- **Årsager der har flyttet sig:** "Registreret - endnu ikke indekseret" +35 (523), "Crawlet - endnu ikke indekseret" +24 (42), "Side med omdirigering" +4 (135), "Ikke fundet (404)" +1 (63), "Dublet uden kanonisk side valgt af brugeren" -1 (65). Uændret: "Blokeret af robots.txt" 3, "Dublet, Google valgte en anden kanonisk side" 1. De 28 sider er altså ikke forsvundet - de er flyttet over i de to "endnu ikke indekseret"-bunker.
- **Søgekonsollen viser nu 7 årsager, ikke 8:** "Serverfejl (5xx)" er forsvundet helt fra listen (stod på 0). Skrevet som 0 i serien for at bevare samme form. Brugerfladens labels er også ændret ("Crawlet endnu ikke indekseret" uden tankestreg, "Ikke fundet (fejl 404)"); de gamle nøgler er bevaret i serien, så `serie.mjs` kan sammenligne.
- **Kontroller:** `node serie.mjs` -> 5 punkter, alle tre kontroller passerer (årsagerne summer til 832, klikraten passer til 16/43, datoerne står i rækkefølge). Commit `06454d46`, verificeret landet på origin/main.
- **Noget Jacob bør vide, som han ikke spurgte om:** emne-målingen 10/10 talte **68** indekserede sider, altså midt mellem 82 (5/10) og 54 (nu). Faldet var sandsynligvis i gang før i dag og er ikke sket på én nat. Jeg har **ikke** målt hvorfor - serien siger kun hvad der skete. Robotten har været på pause siden 10/10, så nye artikler er ikke forklaringen.

### 10/10-2026 kl. 15:30 - techfeedwatch: beslutning om Google-søgning
- **Jacob har besluttet:** robotten MÅ bruge Google-søgning gennem Gemini (grounding) i den nye opskrift (plan fase B, punkt 1 og 5). Ekstra pris pr. artikel måles i prøven (fase C), før noget går live. Ingen åbne beslutninger tilbage før start mandag.


### 10/10-2026 kl. 15:16 - techfeedwatch: robotten SAT PÅ PAUSE + ny plan "søgning først, video som supplement"
- **Robotten stoppet** (Jacobs beslutning): GitHub Actions -> "YouTube Auto Update" og "Tomgangsalarm" slået fra med "Disable workflow" (ingen kode ændret, intet slettet). Slås til igen med "Enable workflow" på hver af dem. Prune Deleted Videos, IndexNow m.fl. kører videre.
- **Gemini-alarmen virkede i en rigtig fejl:** kørsel #655-#658 (9/10-10/10) blev RØDE efter ca. 1 min, da kreditterne var brugt op. Jacob har fyldt op.
- **Search Console pr. emne** (`_maal-emner.mjs`, data læst i Jacobs Chrome 10/10): 11 emner (ikke 9). I Googles indeks: AI & Tech 11 af 170, Fintech 5/32, Quantum 2/36, AR & VR 2/36, AI Video 2/30, SEO 2/23, Crypto 2/22, Coding 1/16, Business & Money 1/15, Hardware & Chips 0/25, Cybersecurity 0/21. Visninger 3 mdr (fulgt gennem 301): AI & Tech 813, SEO 217, Coding 104, øvrige under 31. Intet emne skiller sig ud. Af de 68 indekserede sider er kun 28 nuværende artikler; 25 er gamle adresser. Ca. halvdelen af alle visninger lå på de 205 Shorts, der blev fjernet 31/7 (største: "Organic SEO Isn't Dead", ca. 850 visninger, næsten ingen klik).
- **Rich Results-testen** anmoder ikke om indeksering; "Undersøgelse af webadresse" -> "Anmod om indeksering" i Search Console gør (få pr. dag). Google har ingen API til at anmode om indeksering af artikler.
- **Fund i robottens opskrift** (`add-video.mjs`, prompten ca. linje 589-639): teksten siger "emnet er artiklen, videoen er ét input", men regel 11 (alle tal fra videoen) og regel 14 (mindst 5 detaljer fra videoen, ellers "failed article") gør videoen til eneste reelle kilde -> artiklerne bliver resuméer. Eksempel: "Does Search Engine Optimization Help Your Business?" handler mest om fotografer (videoen er fra PhotoBiz) og har en produktros ("Hot Ones Buyer's Guide") + en henvisning til en "10-point checklist", der ikke findes. Ikke rettet endnu.
- **AFTALT PLAN (start mandag, intet kodet endnu):**
  - A) Mål 10 nyeste artikler: video-andel, overskrifter der svarer på søgespørgsmålet, tal uden navngiven kilde.
  - B) Ny opskrift: (1) undersøg søgningen først (Gemini med Google-søgning/grounding: delspørgsmål, hvad de bedste sider dækker, 3-6 kilder med link); (2) opbygning fra delspørgsmålene; (3) hvert tal skal findes i kildelisten eller videoen - tjekkes; (4) videoen i eget afsnit "hvad [kanal] viser", højst ca. 1/4 af artiklen, krav om 5 videodetaljer -> 2; (5) kildeliste nederst; (6) nichevideo kun som eksempel; (7) nye stop: video-andel over ca. 25 %, ubesvarede delspørgsmål, reklame/produktros.
  - B2) Design: videoen væk fra toppen (titel + kort svar + artikel først, videoen i sit afsnit længere nede); kort/billeder får sitets eget billede i stedet for videoens miniature. Skærmbilleder mobil+desktop før live. Ulempe: mindre chance for videominiature i Google.
  - C) 5 prøveartikler på prøvegrenen (mindst 2 med samme spørgsmål som eksisterende artikler), mål + Jacob læser 2. Pris for Google-søgning måles.
  - D) Live efter Jacobs ok; robotten slås til igen. Gamle artikler er en separat beslutning bagefter (de 28 indekserede først).
  - Åben beslutning til Jacob: må robotten bruge Google-søgning gennem Gemini (lidt ekstra pris, links til andre sites i kildelisten)?
- Lære: Giv aldrig et råd, der ændrer Jacobs koncept, som om det var et målt fund (jeg foreslog 2-3 emner uden måling) - mål først, og sig tydeligt, hvis jeg ændrer mening.
- Lære: En prompt kan sige det rigtige mål, mens dens regler tvinger det modsatte frem. Tjek altid, om reglerne modsiger målet - ikke kun hvad målet siger.


### 10/10-2026 kl. 12:45 - techfeedwatch: afskrift i hele arkivet + punkt 5-7
- **Afskrift i hele arkivet** (`bf138d47`): transskripter hentet til de sidste 286 artikler (`_hent-transskripter.mjs`, alle 286 fra YouTube på pc'en, 0 Gemini-kald, 0 kr). Målt på alle 425: 15 over 15 % (værst 39 %). 241 sætninger omskrevet i de 15 (samme værn). Efter: 0 over 15 %, median 0 %. Samme commit: Greptile-sponsorreklame ("free for 14 days") fjernet (FAQ + 1 sætning).
- **5 Links** (`91147b53`): årsagen var boksen "relaterede artikler" i `[slug].astro` - den tog de første 8 med fælles tag i filnavnsorden, så 336 af 425 artikler aldrig stod i nogen boks (enkelte på ~300 sider). Nu 6 med flest fælles tags + 2 andre med fælles tag, valgt med fast hash (`_sim-relaterede.mjs`). Målt i dist (`_maal-links-dist.mjs`): artikler med højst 2 links fra andre artikelsider 51 -> 3, median 6 -> 13. Tekstlinks-værktøjet (`link-forslag.mjs --foraeldrelose`) havde kun 3 forslag tilbage, 2 dårlige ankre - ikke brugt. Samme commit: 301 `/tag/ai-workflow/` -> `/tag/automation/` (404 i Search Console). Set live: samme 23 links på en artikelside live som lokalt.
- **6 Lister** (`79b80535`): 328 artikler havde hverken liste eller tabel. `_ret-lister.mjs` (tørkørsel, værn: afsnit præcis én gang, intet tal ændret, højst 3 nye ord, mindst 85 % af ordene bevaret, 3-7 punkter, links bevaret) + `_efterret-lister.mjs` (57 indledninger fik "such as/including/like" tilbage) + `_anvend-laeser.mjs` (nu med funktions-erstatning, så "$" i tekst ikke tolkes). 307 artikler fik én liste; uden liste/tabel nu 21 af 426. Skærmbillede desktop+mobil: ingen vandret rulning. Kilder: kanalen vises allerede som link øverst på hver artikel - ikke rettet i teksten.
- **7 Search Console** (kun læst i Jacobs Chrome): 68 sider indekseret; 512 "Registreret - endnu ikke indekseret", 132 omdirigeringer, 65 dubletter (gamle `/video/<id>`-adresser, omdirigerer nu korrekt), 63 404 (stikprøve: gamle id'er nu 301; ét tag rettet), 31 crawlet ikke indekseret. 3 mdr: 48 klik, 2.450 visninger, 42 klik til forsiden; mange visninger på gamle id-adresser. 28-dages-tallet (42 visninger) passer ikke med 3-mdr-grafen - ikke konkluderet på et fald. Sitemap læst 3/10 OK.
- Kontrol: test-skriveregler 54 OK, audit-content 0/0, interne links OK (901), audit-site 0 fejl.
- Lære: en Gemini-tørkørsel med 6 ad gangen tog ~2 artikler/min; 12 ad gangen + `--fortsaet` (genoptag fra planfilen) halverede tiden. Store kørsler skal kunne genoptages fra start.


### 8/10-2026 kl. 21:22 — techfeedwatch: punkt 1-4 (Gemini-alarm, afskrift, modsigelser/tidskoder, overskrifter)
- **1 Gemini-alarm** (`bb669cf3`): `model.mjs` registrerer blokerende fejl (402/401/403, ugyldig nøgle, billing, dagsloft); `auto-youtube.mjs` skriver `_gemini-stop.txt`; nyt sidste trin i `daily-update.yml` (`if: always()`) gør kørslen RØD efter at alt andet er gemt → GitHub sender mail. Testet lokalt: 402 og ugyldig nøgle fanges, 503 og JSON-fejl ikke. Ikke set i en rigtig rød kørsel endnu (kræver en ægte fejl).
- **2 Afskrift i arkivet** (`42ccc524`): målt på de 139 artikler med gemt transskript (`.cache/transskripter`): median 2 %, 14 over 15 % (værst 41 % `zero-trust-the-essential-security-shift…`). 173 afskrevne sætninger omskrevet i de 14 (samme værn + ny sætning må ikke selv være afskrift). Efter: 0 over 15 %, median 1 %. De øvrige 286 artikler har intet transskript lokalt og er ikke målt.
- **3 Modsigelser og tidskoder** (`42ccc524`): 11 af 12 modsigelser rettet i hånden (artiklens egne tal eller kendte fakta: FIX 35=c/35=d, Einstein "does not play dice", Bitcoins alder, Quest-priser m.fl.); cybersikkerheds-lønnen er ikke rettet (sætningen er i orden). De sidste 11 tidskoder fjernet; kun "2:00 a.m." står (rigtigt klokkeslæt).
- **4 Overskrifter** (`fc229334`): 13 skabelon-H2'er stod i 20+ artikler hver (177 artikler). 379 overskrifter skrevet om til emnespecifikke (kun overskriftslinjen; ingen links peger på dem). Efter: 0 artikler med skabelon-overskrift.
- Kontrol: talesprog/uklare kilder/klistret 0, audit-content 0/0, interne links OK, audit-site 0 fejl. Set live: build `fc229334`, Einstein-rettelsen og en afskrift-omskrivning står på sitet.
- Lære: Desktop Commander-kald over 60 s tabes ("did not respond") — lange ventetider deles i kald under 60 s.


### 8/10-2026 kl. 13:22 — techfeedwatch: merværdi — læsertjek, afskrifttjek, overskrifter, dubletværn, 118 gamle artikler rettet
- **Gemini 402 (kreditter brugt op)** kl. ca. 09:30 stoppede robot og prøver; Jacob fyldte på kl. 10:14. Robotten fejlede stille i mellemtiden ("spørgsmåls-tjek fejlede — bruger listen").
- **Robotten (live, `3b62167e`, flettet fra grenen `laesertjek`):** (1) afskrifttjek — sætninger med 8+ ord i træk fra transskriptet sendes til omskrivning, >15 % efter rettelse stopper artiklen (`ordretFraKilde` i skriveregler.mjs, 5 nye selvtest, 53 forventet); (2) læsertjek `src/lib/laesertjek.mjs` — Gemini læser som en læser uden videoen (NAME/FRAGMENT/REFERENCE/CONTRADICTION), kun de sætninger omskrives, en rettelse med nye fejl kasseres, 3+ fund tilbage stopper artiklen; returnerer null (= "kunne ikke køre") ved fejl; (3) profilerne har ikke længere faste H2'er ("The Bottom Line" m.fl. stod i 176 af 424 artikler); (4) dubletværn: ord i 5 %+ af artiklerne tæller ikke i ligheden, grænse 0,20.
- **Prøve #10** (gren `udkast-10`): afskrift 4 sætninger (7 %) → 0 efter rettelse, læsertjek 0 fund, emnespecifikke overskrifter, 930 ord, 2 lister. Men det var en 3. Sora-artikel → dubletværnet rettet; testet med Gemini: Sora-spørgsmålet afvist 3/3, to andre spørgsmål godkendt. Udkast-10 udgives ikke.
- **Læsertjek på hele arkivet (425):** 284 fejlfri (67 %), 141 med 183 fund (NAME 98, FRAGMENT 57, REFERENCE 16, CONTRADICTION 12); desuden 35 videotidskoder i 7 artikler ("as discussed at 00:28").
- **`3754dc48`:** 163 sætninger rettet i 118 artikler (kun de sætninger, frontmatter urørt). Værn: intet nyt tal, intet forbudt ord, ingen navne/kildeangivelser fjernet, tidskode væk; 33 omskrivninger afvist af værnene; modsigelser rettes ikke automatisk (kan vende betydningen). Tilbage: 12 tidskoder i 6 artikler (1 er "2:00 a.m.") og 12 modsigelser. audit-content/interne links/audit-site 0 fejl.
- Lære: mit første læsertjek viste "0 fund", når Gemini fejlede — et tjek, der fejler, skal sige det, ikke ligne et rent resultat.
- Lære: Gemini 3.x tænker inden for maxOutputTokens; 3000/4000 skar svaret over. Brug 8192 til JSON-svar.
- Lære: tørkørsel og skrivning skal bruge SAMME rettelser (gem dem og anvend filen) — et nyt modelkald giver nye tekster.
- Lære: første tørkørsel fjernede kildeangivelser ("As Quantum City points out") og vendte en betydning; værn tilføjet før noget blev skrevet.


### 8/10-2026 kl. 08:54 — techfeedwatch: sidetjekket virker igen, 2 mobilfejl rettet
- **Årsag til at `audit-pages.mjs` ikke kørte:** Jacobs pc har `NODE_ENV=production` (npm `omit=dev`), så udviklerpakken `puppeteer` blev aldrig installeret. Rettet med `npm install --include=dev` (package.json/lock uændret). Værktøjet kører nu (78 sidevisninger, mobil + desktop, mod det levende site).
- **Fundet og rettet 1:** `5f9deb00` — emnebjælken på forsiden var 420 px bred på en 390 px mobilskærm (negativ margen beregnet til en forælder med 15 px luft, men forælderen har 0). Set live: 390 px.
- **Fundet og rettet 2:** `4c1e7b53` — på Trends (mobil) var talkolonnen fast 84 px, så ændringen blev klippet af skærmkanten: "+6" stod som "+", "+11" som "+1". Kolonnen tilpasser sig nu indholdet. Set live: 0 elementer uden for skærmen.
- Fuld kørsel efter 1. rettelse: 1 af 78 sidevisninger med problemer (Trends, nu rettet). Før/efter-billeder sendt til Jacob.
- Nattens robotartikel (`when-notified-what-does-a-data-breach-mean`) overholder reglerne: 0 talesprog, 0 uklare kilder, 0 klistret, første afsnit under grænsen.
- Lære: et værktøj, der ikke kan køre, er en blind plet — "fejlen er i værktøjet" er ikke et svar; værktøjet rettes og køres, og her fandt det straks 2 rigtige fejl.
- Lære: PowerShell `*>` skriver logfiler i UTF-16; læs dem med `utf16le` i node, ellers ser ✅/❌ forkerte ud.



### Ældre dagbog og Bilag A → `STATUS-ARKIV.md`
- Dagbogen fra 7/10-2026 og tilbage samt Bilag A (afsnit 0, som det stod 6/10) er flyttet ordret til `STATUS-ARKIV.md` i samme mappe (14/10, for at statusfilen kan læses hurtigt i hver ny session). Søg dér, når en ældre beslutning eller "Lære:"-linje skal findes.
- Regel: dagbogsindgange ældre end 7 dage flyttes til arkivet ved næste opdatering. Arkivet får nyeste flytning øverst.
