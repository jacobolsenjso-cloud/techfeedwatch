# techfeedwatch.com — teknisk overlevering

Sidst opdateret: 18. august 2026

Dette dokument er skrevet så en ny assistent kan overtage arbejdet uden at
gentage fejl der allerede er begået. Læs afsnittet **Faldgruber** før du rører
noget — de fleste af dem kostede timer at finde.

---

## 1. Hvad sitet er

Statisk site der omsætter YouTube-videoer om AI, tech, fintech og krypto til
skriftlige artikler. Hver artikel krediterer kildekanalen og linker til den
originale video.

**Ejer:** Jacob S. Olsen, Danmark. Kommunikerer på dansk. Kodekommentarer på
dansk, commit-beskeder på engelsk, sitets indhold på engelsk.

**Repo:** `C:\Users\jacob\techfeedwatch` — tilgås med Desktop Commander.

### Omfang lige nu

| | |
|---|---|
| Artikler | 391 |
| Guides | 9 (alle gennemskrevne, 1.900-4.500 ord) |
| Glossar | 50 opslag |
| Værktøjer | 40 |
| Sider i alt | 580 |
| Emnemærker | 13 |

---

## 2. Stak

- **Astro 6.4.6**, statisk build til `dist/`
- **Cloudflare Pages** hoster. Push til `main` udløser deploy.
- **GitHub Actions** kører robotten
- **Gemini** (`gemini-2.5-flash`) skriver artiklerne
- Indhold som markdown i `src/content/videos/`, `guides/`, `glossary/`

### Nøglefiler

```
auto-youtube.mjs              robotten: vælger emne, finder video
add-video.mjs                 skriver artiklen
rewrite-articles.mjs          skriver EKSISTERENDE artikler om (aktiv opgave)
src/lib/tools.ts              de 40 værktøjer
src/lib/tags.ts               emnemærker og farver
src/lib/readability.mjs       Flesch-score og klassetrin
src/lib/suggest.mjs           Google autocomplete
src/layouts/MainLayout.astro  fælles ramme, mørk tilstand, måling
src/pages/video/[slug].astro  artikelsiden
astro.config.mjs              glossar-autolinker
public/_redirects             1.351 regler
public/sw.js                  service worker
```

---

## 3. Den aktuelle opgave: AdSense

**Sitet er afvist fire gange.** Sidste afslag: "indhold med ringe værdi".

Artiklerne var ikke kopieret — de var **referater**. Læseren fik at vide hvad en
video sagde, ikke hvad emnet handler om.

### Løsningen der køres nu

Artiklerne skrives om, så de handler om **emnet** med videoen som research.
Krediteringen bliver. Robotten er bygget om på samme måde, men er **stoppet**
indtil arbejdet er færdigt (`daily-update.yml`, tidsplan udkommenteret).

**Status: 198 af 391 omskrevet.** Køres i bunker på 25.

### Sådan køres en bunke

```powershell
# Byg en liste over de næste 25 der mangler
$gjort=@{}; Get-ChildItem src\content\videos\*.md | ForEach-Object {
  if (([System.IO.File]::ReadAllText($_.FullName)) -match '(?m)^rewrittenAt:') { $gjort[$_.Name]=$true } }
Get-Content _kan-omskrives.txt | Where-Object { $_.Trim() } |
  Where-Object { -not $gjort.ContainsKey([System.IO.Path]::GetFileName($_.Trim())) } |
  Select-Object -First 25 | Set-Content _b25.txt -Encoding UTF8

# Kør i baggrunden — den overlever at forbindelsen falder
Start-Process -FilePath node -ArgumentList 'rewrite-articles.mjs','--list=_b25.txt' `
  -RedirectStandardOutput '_b25.out' -RedirectStandardError '_b25.err' -NoNewWindow
```

Derefter: `npm run build`, `node audit-content.mjs`, `node audit-schema.mjs`,
commit, push.

### Kontrollerne i rewrite-articles.mjs

Det vigtigste i hele opsætningen. **Rør dem ikke uden at forstå hvorfor de er
der** — hver enkelt findes fordi noget slap ud.

| Kontrol | Hvorfor |
|---|---|
| Ingen omtale af "the video", "the speaker" | Ellers bliver det et referat igen |
| Tal skal findes i transskript eller gammel artikel | Første kørsel tilføjede **20 opdigtede tal**: 86%, $2,9 billioner, $700 mio. |
| Forbudte ord | Blev ignoreret i 10 af 14 da det kun stod i prompten |
| Under 21 ord pr. sætning | Læsbarhed: klassetrin 17,6 → 13 |
| Latinsk fyld byttes | *utilize → use*, *demonstrates → shows* |
| Mindst 700 ord | En halv omskrivning er værre end ingen |
| Spor efter mislykket reparation | Se faldgrube 6 |

**Reparation frem for kassering.** Fejler en kontrol, sendes udkastet tilbage
med fejlen udpeget og besked om kun at rette dét. Det tog resultatet fra 5 af 14
til 13 af 14. At skrive forfra kaster terningen igen på hele teksten.

**Tre forsøg, fire minutters frist pr. artikel.** Fejlene er tilfældige, ikke
egenskaber ved artiklen.

**Temperatur 0,4.** Standarden er indstillet på at være opfindsom, og
opfindsomhed er præcis det der producerer tal der lyder rigtige.

---

## 4. Værktøjer og scripts

### Gennemgange — kør disse efter enhver ændring

```
audit-content.mjs      tomme artikler, manglende resumé, spor fra modellen
                       KØRER I ROBOTTENS WORKFLOW og standser den ved fejl
audit-schema.mjs       JSON-LD på alle sider, inkl. datoformat
audit-a11y.mjs         kontrast, tryk-mål, alt-tekst — mobil+desktop, lys+mørk
audit-readability.mjs  Flesch-score og klassetrin
audit-links.mjs        døde interne links
audit-pages.mjs        JS-fejl, døde ressourcer, vandret overløb (puppeteer)
```

### Robotten

```
auto-youtube.mjs       vælger tyndeste emnemærke → autocomplete-spørgsmål
                       → YouTube-søgning.  --dry-run viser hele kæden
add-video.mjs          skriver artiklen.  --tag, --question
```

### Vedligehold

```
rewrite-articles.mjs   --list=<fil>, --limit=N, --dry-run
score-articles.mjs     hvilke kan skrives om (transskript findes?)
update-view-counts.mjs visningstal + historik (kører hver 3. dag)
snapshot-trends.mjs    månedlig navneoptælling
sort-redirects.mjs     SKAL køres efter ændring i _redirects
stamp-sw.mjs           versionerer service worker (del af npm run build)
retag-articles.mjs     flytter artikler til nyt mærke, --dry-run først
shot.mjs               skærmbilleder, --height=N
```

### Arbejdsgang

```
læs filer → ret → npm run build (0 fejl) → gennemgange →
git pull --rebase → commit → push
```

`git pull --rebase` er **ikke valgfri** — robotten pusher, når den kører.

---

## 5. Faldgruber

Læs disse. De kostede timer hver især.

**1. Målescriptet er mistænkt før koden.**
Fjorten gange på to uger var gennemgangen forkert, ikke sitet. Et tal der siger
100% eller 0 er næsten altid et ødelagt filter. Eksempler: et mønster der
matchede ordet "API" hvor som helst gav 50 af 50; `class="watch-card` gav 36
træffere for 12 kort, fordi `watch-card-thumb` starter ens.

**2. Sitet ruller i `main.content-area`, ikke i dokumentet.**
`window.scrollTo` gør ingenting. Fuldsides-skærmbilleder viser intet under
folden. Brug `shot.mjs --height=N`.

**3. Node holder output tilbage i en buffer.**
Under en lang kørsel stod outputfilen 14 minutter bagud og sagde 16 af 50, mens
der lå 35 på disken. **Tæl filer, ikke linjer i outputtet.**

**4. En kørsel der ser død ud, er det måske ikke.**
Tre forsøg × (transskript + generering + reparation) kan lovligt tage 15
minutter på én artikel. Derfor fristen på fire minutter.

**5. YouTube spærrer efter mange transskript-kald.**
Omkring 400 på en dag udløste afvisning af alle. Den løftede sig af sig selv
efter et par timer. Bunker på 25 med tid imellem er ikke høflighed — det er dét
der holder kilden tilgængelig.

**6. En kontrol kan skabe nonsens.**
Instruktionen sagde "erstat tallet med en formulering", og modellen gjorde det
mekanisk: *"daily budgets of $50, $30, $20, $25, $100, or even a significant
sum"*. Grammatisk korrekt, ingen forbudte ord, intet opdigtet tal — og
meningsløst. **Alle automatiske kontroller bestod.** Det krævede et menneske at
læse siden. Derfor skal en stikprøve altid læses af Jacob.

**7. `_redirects`: statiske regler før dynamiske.**
En splat-regel midt i filen dræbte 205 regler. `sort-redirects.mjs` ordner det.
Og: Cloudflare matcher kilden **præcist** — `/video/abc` og `/video/abc/` er to
adresser. 47% af sitets visninger ramte 404 på grund af én skråstreg.

**8. Tjek indgående links før sletning.**
En tidligere oprydning forvandlede 589 interne links til 404'er.

**9. Service worker-cachen versioneres pr. build.**
Hed før altid `tfw-v2`, så gammel HTML kunne pege på slettede CSS-filer, og
siden kom op uden styling. `stamp-sw.mjs` løser det.

**10. Mørk tilstand sættes i `<head>` og lige efter `<body>`.**
Sættes den nederst, tegnes hele siden lys først. Det gav et hvidt glimt ved
hvert sideskift.

**11. Farveregel.** `var(--teal-text)` til tekst (skifter pr. tilstand), fast
`#0e7490` til baggrunde der bærer hvid tekst. Emnefarver må **aldrig** bære hvid
tekst eller stå som tekst — krypto er gul og gav 2,15:1.

**12. PowerShell og æøå.** `Set-Content -Encoding UTF8` skriver en BOM, som
Node ikke kan læse i `package.json`. Brug `[System.IO.File]::WriteAllText` med
`UTF8Encoding($false)`. Lange kommandoer med citationstegn brækker — skriv
commit-beskeder til en fil, eller brug `-m` flere gange.

---

## 6. Hvad der mangler

### Skal gøres

1. **193 artikler skal skrives om.** Bunker på 25. Heraf 5 uden transskript.
2. **De 5 uden transskript** kan ikke omskrives — hver skal have en 301 til en
   beslægtet artikel. Alle har indgående links, så de kan ikke bare slettes.
3. **De 169 der blev omskrevet før læsbarheds-kontrollen** ligger på klassetrin
   ~17 og bør køres igennem igen. Blandes ind i bunkerne.
4. **Jacob læser en stikprøve** af hver bunke. Se faldgrube 6.
5. **Genindsend AdSense** når arkivet er færdigt.
6. **Robotten tændes igen** — fjern `#` foran `schedule` i `daily-update.yml`.

### Ligger og modner

- **Scroll- og klikmåling** kørt siden 11. august. Kan nu svare på om bunden af
  artiklerne overhovedet ses. Begivenheder: `scroll_depth`, `content_click`.
- **Visningshistorik** har to punkter. YouTube ændrer optællingen **24. august**
  — skellet er bygget, se `update-view-counts.mjs`. Feltet bliver tavst i nogle
  uger efter.
- **Trend-serien** får sit andet punkt i september.

### Overvejet, ikke besluttet

- **Forholdet afledt/originalt indhold** er 391 mod ~99. Bedre artikler ændrer
  kvaliteten, ikke forholdet. Måling viste at **ingen** artikler er tynde i sig
  selv (kun 5 mangler transskript), så sletning er ikke det oplagte svar.
- **Kanalsider** udskudt: 196 af 236 kanaler har kun én artikel.
- **Rigtige lydfiler** til oplæsning i stedet for browserens stemme. Mål først
  om nogen trykker: `listen_article` i Analytics.

---

## 7. Jacobs egne opgaver

- Genindsend AdSense når omskrivningen er færdig
- Validér rettelser i Search Console — særligt de 85 adresser der ramte 404
- Ryd 4 døde sitemap-indsendelser
- Gen-scrape delecache hos Facebook og LinkedIn
- Test PWA offline på en rigtig telefon i flytilstand (aldrig bevist)
- Klik `compound-calculator` og `keyword-idea-generator` én gang hver — de kan
  ikke testes automatisk

---

## 8. Sådan arbejdes der på dette projekt

Ikke regler for regler skyld — det er dét der har fanget flest fejl.

**Mål før du bygger.** Flere gange har målingen omgjort planen fuldstændigt.
Vi ville skille kanalsider ud, indtil tælling viste at 196 af 236 kanaler havde
én artikel. Vi ville slette tyndt indhold, indtil målingen viste at kun 5 af 391
manglede transskript. Vi troede der var dubletter — der var 31 par før
emnefordelingen kom ind, og 0 efter.

**Tallene bestemmer, ikke fornemmelsen.** Guiderne blev bygget på optællinger:
regulering optræder i 58 af 67 fintech-artikler, institutionelle penge i 38 af
50 krypto-artikler mod Bitcoins 26, og kun 6 af 111 Business & Money-artikler
handler om sidegesjæft. Ingen af de tal var gættet på forhånd, og alle tre
ændrede guiden.

**Sig hvad der ikke virker — også når fejlen er i måleværktøjet.** Det er sket
fjorten gange. Hver gang står grunden i commit-beskeden, så den ikke rejses
igen.

**Aldrig en påstand sitet ikke kan bakke op.** Vi har fjernet opdigtede
like-tal, en byline der påstod redigering der aldrig skete, og senest "Analysis
by Jacob S. Olsen" øverst på en side hvis egen forfatterboks sagde at ingen
læste artiklen. Det er samme fejl hver gang: en påstand der lyder rigtig og ikke
er sand.

**Commit-beskeder forklarer hvorfor, ikke hvad.** Diffen viser hvad. Beskeden
skal forklare hvilket problem der blev løst, hvad der blev målt, og hvad der
gik galt undervejs — inklusive egne fejl. De er projektets hukommelse.

**Kommentarer i koden forklarer faldgruben.** Hver kontrol i
`rewrite-articles.mjs` har en kommentar der siger hvad der slap ud uden den.

---

## 9. Vigtigst af alt

Sitet udgiver maskinskrevne artikler om andres videoer. **Det eneste der gør
det forsvarligt er ærligheden:** kilden krediteres, metoden står på
`/about`, og der påstås intet der ikke er sandt.

Hver gang en genvej har været fristende — opdigtede likes, en falsk byline, et
tal der lød rigtigt — har den kostet mere at rette end at undlade.

Hvis du er i tvivl om noget må siges: mål det. Kan det ikke måles, så sig det
ikke.
