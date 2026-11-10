#!/usr/bin/env bash
# Fælles commit for robottens workflows (9/11-2026, Jacob: "rigtig sat op").
# Brug: bash .github/commit.sh "<besked>" [stier ...]   (uden stier: alt i repoet)
# Slutter med 0, hvis der blev committet, og 1, hvis der intet var at committe.
#
# Hvorfor: hvert push til main får Cloudflare Pages til at bygge hele sitet. Målt 9/11: 977 commits på
# main på 29 dage (33,7 byg i døgnet; gratisplanen giver 500 byg om måneden for HELE kontoen, og kun
# ét byg ad gangen, så techmediaarch og gentleaiguide står i kø bagved). 472 af robottens 609 commits
# ændrede KUN robot-log.jsonl - en fil, sitet slet ikke læser.
# Rører et commit kun filer på listen nedenfor, får beskeden præfikset [CF-Pages-Skip] (skal stå
# FØRST i beskeden), så Cloudflare springer bygget over. Alt andet bygges som før.
# Listen må KUN indeholde filer, sitet ikke læser (tjekket 9/11 med git grep i src/pages, src/components,
# src/layouts, src/lib og astro.config.mjs). public/robot-status.json er IKKE med: den ligger på sitet
# og læses af tomgangsalarmen.
set -u
# 10/11-2026: src/data/dataforseo.json (søgetallenes hukommelse) læses kun af robotten, ikke af sitet.
UDEN_BYG='^(src/data/robot-log\.jsonl|src/data/tried-questions\.json|src/data/used-questions\.json|src/data/dataforseo\.json|indexnow-sendt\.json)$'
BESKED="$1"; shift
if [ "$#" -gt 0 ]; then git add -- "$@"; else git add .; fi
if git diff --cached --quiet; then exit 1; fi
if ! git diff --cached --name-only | grep -Evq "$UDEN_BYG"; then
  BESKED="[CF-Pages-Skip] $BESKED (only robot data, the site is unchanged)"
fi
# Kode 2 = en reel fejl; workflowet skal blive RØDT, ikke tro at der intet var at gemme.
git commit -q -m "$BESKED" || { echo "commit.sh: git commit fejlede"; exit 2; }
git log -1 --format='Commit: %h %s'
