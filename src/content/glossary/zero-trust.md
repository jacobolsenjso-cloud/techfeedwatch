---
term: "Zero Trust"
slug: "zero-trust"
aliases: ["zero-trust", "zero trust architecture"]
category: "Cybersecurity"
definition: "Zero trust is a security model that verifies every request individually, regardless of whether it comes from inside or outside the network."
---

The model it replaced is sometimes called the castle and moat. You built a strong perimeter — a firewall, a VPN — and anything that got inside was treated as trustworthy. A laptop on the office network could reach the file server, the database and the printer, because it was on the office network.

That worked while there was an inside. It stopped working when the applications moved to the cloud, the staff moved to their kitchens, and the contractors moved to their own laptops. There is no perimeter left to defend.

Zero trust drops the assumption entirely. Every request is authenticated and authorised on its own terms: who is asking, from what device, in what state, for which specific resource. Being on the network grants nothing. The name is the summary — no request is trusted because of where it came from.

## Why it changes the damage, not the odds

Zero trust does not stop an attacker getting in. Phishing still works; credentials still leak. What it changes is what happens next.

In a perimeter model, one stolen password is the whole building, because the attacker inherits everything that account could reach. That sideways movement from a single foothold is how most large breaches actually get large. Under zero trust, the same stolen password gets the attacker exactly what that one account is permitted to do, and each further step has to be earned again.

Two ideas make it work. **Least privilege** means an account can reach only what its owner genuinely needs, which is almost always far less than what is convenient to grant. **Continuous verification** means access is re-checked rather than granted once at login — a session that started on a healthy device does not stay trusted after that device fails a health check.

## The honest catch

Zero trust is an architecture, not a product, however it is marketed. Getting there means knowing every application, every account and every data store you own, then deciding who should reach each one. Most organisations discover during that inventory that they did not have a complete list. That discovery is uncomfortable, and it is also the most valuable part of the exercise.
