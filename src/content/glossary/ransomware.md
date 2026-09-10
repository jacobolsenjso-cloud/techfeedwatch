---
term: "Ransomware"
slug: "ransomware"
aliases: ["ransomware attack", "ransomware gang", "double extortion", "crypto-locker"]
category: "Cybersecurity"
definition: "Ransomware is malware that encrypts a victim's files or locks their systems and then demands payment, usually in cryptocurrency, for the key to get them back."
---

The mechanics are simple and the business is not. The malware gets in, most often through a phishing email, a stolen password or an unpatched server that faces the internet. It spreads across the network quietly, sometimes for weeks, finding backups and the most valuable systems. Then, often on a Friday night, it encrypts everything at once and leaves a note with a price and a countdown.

Modern groups run it as a business. Some write the software and rent it to affiliates who do the break-ins, splitting the ransom. Many now steal a copy of the data before encrypting it, so that a victim with good backups can still be threatened with publication. That is "double extortion", and it is why restoring from backup no longer ends the incident.

## Why it matters

Ransomware is the cyberattack most likely to stop a real organisation from operating: a hospital that cannot see patient records, a shipping company that cannot load a ship, a town hall that cannot issue permits. The cost is rarely the ransom itself. It is the days or weeks of downtime, the rebuild, the legal exposure over the stolen data, and the insurance premium afterwards.

Paying is a poor bet. Payment funds the next attack, the key does not always work, and the same group has already proven it can get in. Governments increasingly discourage or restrict paying. Yet victims pay anyway, because for a company with no working backups the alternative is closing.

## In practice

The defences are unglamorous and known. Backups that are kept offline or immutable, so the attacker cannot encrypt those too, and that are actually tested by restoring from them. Multi-factor authentication on every remote login. Patching internet-facing systems within days, not quarters. Limiting what an ordinary user account can reach, so one clicked link does not become the whole network. None of this is expensive next to a week of downtime, which is why the articles on this site keep returning to it.
