---
term: "Penetration Testing"
slug: "penetration-testing"
aliases: ["pentesting", "pen testing", "pen test", "pentest", "penetration test", "ethical hacking", "red team"]
category: "Cybersecurity"
definition: "Penetration testing is a controlled, authorised attack on a system, carried out by security professionals to find the weaknesses a real attacker would exploit, before the real attacker does."
---

A vulnerability scanner lists what might be wrong. A penetration tester proves what is wrong by actually getting in. That difference is the whole value: a scan might flag a hundred issues of unknown importance, while a test shows that issue number forty-three lets a stranger read the customer database in twenty minutes. Management understands the second kind of finding.

A test starts with a written scope and permission, which is what separates it from a crime. The testers then work the way an attacker would: map what is exposed, look for a way in, use that foothold to reach something that matters, and document every step. The output is a report ranking what was found by how bad it is and how to fix it. A retest confirms the fixes held.

## Why it matters

Systems change constantly, and every change can open something. Regulators, insurers and enterprise customers increasingly require a recent test before they will do business, which is why "when was your last pentest" has become a standard question in sales and compliance. Beyond compliance, it is the only way to learn how your defences behave against a person, rather than against a checklist.

There are flavours. A web application test targets one site. A network test targets everything reachable. A red team exercise goes further: a longer, stealthier campaign that also tests whether anyone notices. Bug bounty programmes crowdsource the same work by paying outside researchers per finding. AI-assisted tools now automate the reconnaissance and some of the exploitation, which lowers the price and raises the volume, though the judgement about what actually matters still comes from people.

## In practice

The common mistake is treating the report as the finish line. A test that finds twelve critical issues and leads to no fixes was an expensive way to confirm a bad situation. The second mistake is scoping the test to only the parts you are confident about. The point is to be attacked where you are weak.
