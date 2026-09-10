---
term: "Firewall"
slug: "firewall"
aliases: ["firewalls", "network firewall", "web application firewall", "WAF"]
category: "Cybersecurity"
definition: "A firewall is a filter that sits between a network or device and the outside world and decides, packet by packet, which traffic is allowed through and which is dropped."
---

Every connection to a computer arrives as a stream of small packets, each carrying a source, a destination, a port number and a payload. A firewall reads those labels and applies rules: allow web traffic on port 443, block everything aimed at the database port from outside the office, drop anything from an address on a blocklist. What it lets through, the rest of the system has to deal with. What it drops never gets that far.

The rules are the whole product. A firewall with an "allow everything" rule is a very expensive cable. A firewall configured to allow only what the business actually needs is one of the cheapest large reductions in attack surface available, which is why it is the first thing an auditor asks about and the first thing most people forget to revisit.

## Why it matters

Most attacks are not clever. They are automated scans looking for a port that answers when it should not. A firewall that closes those ports turns a network from "everything reachable unless protected" into "nothing reachable unless permitted", and that inversion is the point. It does not stop an attacker who already has a valid login, and it does not inspect what a user downloads over an allowed connection. Those jobs belong to other tools.

There are several kinds. A network firewall guards the boundary of an office or data centre. The firewall built into Windows or macOS guards one machine. A web application firewall, or WAF, sits in front of a website and looks inside the web requests themselves for patterns such as SQL injection. Cloud providers offer all three as settings rather than boxes, which makes them easier to turn on and just as easy to leave wide open.

## In practice

The classic failure is the rule added for a one-off task and never removed: a port opened for a contractor in 2023 that is still open today. The second classic failure is trusting the firewall so much that nothing behind it is patched. A firewall buys time and reduces exposure. It is a wall, not a guard.
