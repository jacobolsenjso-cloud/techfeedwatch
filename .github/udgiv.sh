#!/usr/bin/env bash
# Udgiver kørslens commit på main (7/11-2026, kø-fejlen - samme opskrift som techmediaarch 4/11).
# Kaldes EFTER "git commit" i robotten, omskrivningen, AI-billederne og kurserne (de deler køen "site-skriver").
#  - 3 forsøg: 4/11 kl. 10:17 afviste GitHub et push med "Internal Server Error", og arbejdet gik tabt.
#  - Ændrede main en datafil (src/data) under kørslen, flettes begge udgaver (.github/flet-data.mjs).
#  - Konflikt i alt andet (artikler, kode): intet skubbes, kørslen bliver RØD.
set -u
for i in 1 2 3; do
  if git pull --rebase -q origin main; then
    if git push -q origin HEAD:main; then echo "Udgivet (forsøg $i)."; exit 0; fi
    echo "::warning::push fejlede (forsøg $i af 3) - prøver igen om 15 sek."
    sleep 15; continue
  fi
  konflikt=$(git diff --name-only --diff-filter=U)
  if [ -z "$konflikt" ]; then
    git rebase --abort 2>/dev/null || true
    echo "::warning::git pull fejlede uden konflikt (forsøg $i af 3) - prøver igen om 15 sek."
    sleep 15; continue
  fi
  if echo "$konflikt" | grep -qv '^src/data/'; then
    echo "::error::Konflikt uden for src/data - intet udgives: $konflikt"
    git rebase --abort; exit 1
  fi
  echo "::warning::main ændrede datafiler under kørslen - begge udgaver flettes: $konflikt"
  for f in $konflikt; do
    node .github/flet-data.mjs "$f" || { echo "::error::Kunne ikke flette $f - intet udgives"; git rebase --abort; exit 1; }
  done
  echo "$konflikt" | xargs git add --
  if GIT_EDITOR=true git rebase --continue > /dev/null && git push -q origin HEAD:main; then
    echo "Udgivet efter fletning (forsøg $i)."; exit 0
  fi
  git rebase --abort 2>/dev/null || true
  sleep 15
done
echo "::error::Udgivelsen lykkedes ikke efter 3 forsøg"
exit 1
