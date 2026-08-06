---
term: "Layer 2"
slug: "layer-2"
aliases: ["L2", "layer two", "rollup"]
category: "Crypto"
definition: "A layer 2 is a separate network that processes transactions off a main blockchain and periodically writes a compressed record back to it, to gain speed and lower fees."
---

A blockchain like Ethereum is deliberately slow. Every participant verifies every transaction, which is what makes it hard to corrupt and also what caps its throughput. You cannot raise the ceiling much without weakening the property that made it worth using.

Layer 2 sidesteps the trade rather than resolving it. Transactions happen on a faster network with fewer verifiers, and the main chain — layer 1 — receives only a summary. Thousands of transfers become one entry. The cost of that entry is split across all of them, which is where the cheap fees come from.

## What you are trusting

This is the part worth understanding before moving money onto one, because the security model is not the same as layer 1's.

**Optimistic rollups** assume the summary is honest and allow a challenge period during which anyone can prove it wrong. That is why withdrawing back to layer 1 can take days: the window has to stay open.

**Zero-knowledge rollups** submit a mathematical proof that the summary is correct, so there is nothing to challenge and withdrawals are fast. The proofs are harder to build, which is why these arrived later.

Both inherit their security from layer 1 in theory. In practice most also depend on a **sequencer** — usually one operator deciding transaction order — and on upgradeable contracts controlled by a small group. Neither is decentralised in the way the underlying chain is.

## The practical consequences

Funds on a layer 2 are not on layer 1. Moving between them means bridging, and bridges have been the single most exploited component in the whole ecosystem.

Different layer 2s do not talk to each other. Assets on one are not available on another without crossing back through layer 1 or through another bridge, and that fragmentation is now one of the harder unsolved problems.
