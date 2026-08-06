---
term: "Proof of Work"
slug: "proof-of-work"
aliases: ["PoW", "mining"]
category: "Crypto"
definition: "Proof of work secures a blockchain by requiring participants to spend real computing effort to add a block, making it expensive to rewrite history."
---

The problem it solves is old: how do strangers agree on an order of events with no authority to ask? If anyone can claim a transaction happened, agreement is impossible.

Proof of work makes claiming expensive. To add a block, a miner must find a number that, combined with the block's contents, produces a hash below a target. There is no shortcut — you guess, billions of times a second, until one works. The winner is broadcast, everyone else verifies it instantly, and the chain moves on.

The asymmetry is the whole design: finding the answer costs enormous energy, checking it costs nothing.

## What it actually buys

Rewriting a past transaction means redoing the work for that block and every block after it, while the honest network keeps extending the real chain. Beyond a few confirmations that becomes economically absurd. Security here is not a clever cryptographic trick — it is the cost of electricity, which is why the energy use is not waste from the system's own point of view. It is the product.

Whether that is a reasonable price is the actual argument, and it is a values question rather than a technical one.

## Against proof of stake

The alternative replaces energy with capital: validators lock up coins and lose them for misbehaving. It uses a tiny fraction of the electricity, which is why Ethereum moved to it in 2022.

The trade is contested. Proof of stake ties security to holdings, so influence accrues to those who already hold most — and the assets securing the system are the same assets it issues. Proof of work's security comes from outside, from energy and hardware that exist whatever the token is worth. Bitcoin's refusal to switch is a deliberate position on that trade-off, not inertia.

**Mining** is the name for participating. **Hash rate** is the total computing effort on the network, and is the usual proxy for how hard it would be to attack.
