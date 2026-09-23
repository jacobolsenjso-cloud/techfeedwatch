---
title: "Are Qubits Made of Nanowires in Quantum Computing?"
youtubeId: "oU_eQ4bEf1k"
channelTitle: "Dr Ben Miles"
channelId: "UCUeZBocfxALSUdOgNJB5ySA"
publishedAt: "2026-06-14T15:00:05Z"
date: "2026-09-23"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Physical qubits rely on specialized material architectures ranging from superconducting circuits to engineered semiconductor nanowires. Microsoft's recent breakthrough with topological qubits demonstrates how combining a 35 nm semiconductor nanowire with superconducting lead shields quantum states against destructive environmental noise. Understanding what qubits are made of clarifies the hardware barriers standing between experimental lab systems and practical commercial deployment."
metaDescription: "Discover what qubits are made of in quantum computing hardware, from superconducting nanowires and lead layers to topological Majorana zero modes."
targetQuestion: "what are qubits made of in quantum computing"
duration: "18:17"
viewCount: 370260
viewsUpdated: "2026-09-23"
thumbMax: true
isShort: false
faqs:
  - question: "What physical materials make up a quantum computing qubit?"
    answer: "Physical qubits are made from engineered microscopic systems such as superconducting circuits, trapped ions, or semiconductor nanowires coated in superconductors like lead or aluminum. These materials maintain quantum coherence by operating near absolute zero to isolate delicate quantum states from environmental disturbance."
  - question: "How does a topological qubit protect quantum data from decoherence?"
    answer: "A topological qubit splits quantum information across the ends of microscopic nanowires as Majorana zero modes rather than storing it at a single point. This spatial separation ensures that local thermal or electromagnetic noise cannot corrupt the state unless both ends are disturbed simultaneously."
  - question: "Why did hardware engineers replace aluminum with lead in topological qubits?"
    answer: "Lead has a superconducting energy gap of around 1,300 microelectronvolts, more than four times larger than aluminum's 300 microelectronvolts. This higher barrier prevents stray thermal infrared photons from breaking electron pairs apart and causing parity flips."
---

Engineers build physical qubits out of delicate subatomic and solid-state materials designed to isolate quantum states from environmental noise. Determining what qubits are made of reveals why quantum hardware requires extreme cryogenic refrigeration, atomic-scale material deposition, and specialized topologies to function.

## What Are Qubits Made of in Quantum Computing Hardware?

Unlike classical computer transistors etched from bulk silicon, physical qubits take multiple physical forms across the industry. Some systems trap charged ions in vacuum chambers using electric fields. Others use superconducting circuits made of niobium or aluminum loops patterned onto silicon substrates, creating artificial atoms that behave according to quantum mechanics. The exact physical composition dictates how long a qubit survives before environmental heat, vibration, or radiation destroys its superposition state. To understand the fundamental mechanics behind these units, see how a [Qubit in Quantum Computing Explained for Modern Scale](/video/qubit-in-quantum-computing-explained-for-modern-scale) operates across different hardware modalities.

In the pursuit of topological protection, the physical recipe becomes far more exotic. Microsoft builds its topological qubits around a superconducting semiconductor nanowire measuring just 35 nm wide. On top of this narrow semiconductor base, fabrication tools lay down an ultra-thin layer of superconducting material, roughly 30 atoms thick. When engineers cool this hybrid structure down to 50 millikelvin—just 0.05° above absolute zero—the materials interact through a specialized boundary state. Because the two materials are perfectly joined together, the paired, frictionless behavior of the superconductor on top leaks across the boundary into the semiconductor below, a phenomenon called the proximity effect.

`
       [ Superconducting Layer (Lead: ~30 atoms thick) ]
=================================================================  <-- Proximity Effect Interface
       [ Semiconductor Nanowire Base (35 nm wide)       ]
`

At this cryogenic threshold, applying an external magnetic field parallel to the wire forces the material stack into a topological phase. In this phase, something unusual happens. Each individual electron is essentially split in half, and each half exists at either end of the wire. This phase is called a Majorana zero mode. By linking two of these wires together into an H-shape called a tetron, the qubit is encoded into whether the system overall holds an even or odd number of electrons in total, a property called parity. This distributes the stored information across all four endpoints. Corrupting the data requires an environmental disruption to strike both ends of the wire at the exact same moment.

This topological architecture acts much like a Möbius band. If you take a strip of tape, add a half-twist, and join the ends together, that structural twist persists no matter how you stretch or compress the loop. You cannot remove the twist with a localized poke; you must physically cut the strip open. Distributing quantum data across the entire physical structure provides inherent hardware protection against random noise.

## Can Topological Nanowires Eliminate Environmental Decoherence?

The central enemy of quantum processing is decoherence, the rapid degradation of quantum states caused by thermal fluctuations and electromagnetic interference. To combat this, dilution refrigerators house the processor inside a vacuum chamber that removes around 99.99999% of the air molecules that might otherwise bump into and interrupt a quantum computation. Yet even deep inside these suspended metallic chambers, conventional qubits struggle to preserve coherence for more than 12 milliseconds. Examining [How Is Quantum Computing Different From Classical Computing?](/video/how-is-quantum-computing-different-from-classical-computing) highlights why protecting these fragile states remains the core bottleneck in computing today.

The concept of using non-local topological matter to defeat decoherence dates back to research papers published in 1997. In 2004, mathematician Michael Freedman sent a letter directly to Bill Gates making the case that this may be the best way to build a quantum computer. It took 21 years of experimental physics to translate that mathematical concept into the Majorana 1, Microsoft's initial topological test device developed inside Microsoft's lab in Copenhagen.

The Majorana 1 proved that engineered topological phases could produce localized zero modes, but the hardware faced immediate operational constraints. With 1 to 10 milliseconds between errors and each qubit operation taking around 1 microsecond, you're looking at roughly 10,000 operations before the qubit loses its state. Practical quantum algorithms require millions of sequential operations per logical qubit, rendering a 10,000-operation window insufficient for fault-tolerant execution.

Two distinct hardware mechanisms drove these early failures:
*   **Quasiparticle Poisoning:** In a superconductor, electrons bind into Cooper pairs, but if something in the environment, for example, a stray photon, carries enough energy to rip one of those pairs apart, you get a free electron wandering through your system. If it either joins the wire or leaves the wire, it can flip the parity of the qubit from zero to one or vice versa.
*   **Majorana Hybridization:** The two Majorana zero modes at opposite ends of the wire aren't perfectly isolated. There is a tiny quantum mechanical coupling between the two of them. And this small energy splitting causes the qubit to wobble slightly away from zero energy.

The root cause came down to the physical properties of the superconducting skin. The Majorana 1 used aluminum, where the superconducting gap is around 300 microelectronvolts. Stray infrared photons radiated by the refrigerator walls carry enough energy to exceed that, routinely shattering Cooper pairs.

On the 2nd of June, Microsoft announced that they had increased the qubit lifetime from 12 milliseconds to over 20 seconds by swapping out the aluminum layer for lead, which has a superconducting gap of around 1,300 microelectronvolts. As Dr Ben Miles points out, this material change dramatically improved stability. 

Achieving that transition required extraordinary chemical control. Lead is notorious for contaminating semiconductor fabrication chambers and clumping unpredictably. Engineers spent years calibrating molecular-beam systems to deposit lead crystals layer by atomic layer onto the 35 nm nanowire without disturbing the interface. With each operation taking 1 microsecond, the Majorana 2 can perform 20 million operations before any error has a realistic chance of occurring. To quote Microsoft, "the probability of any unintended parity flip during a typical qubit operation becomes effectively negligible." What this actually means is that for the first time qubit lifetime isn't the problem standing between us and a useful quantum computer.

`
Superconductor Material Comparison:
-------------------------------------------------------------------------
Material     Superconducting Gap             Coherence Limit    Operations
Aluminum     around 300 microelectronvolts   12 milliseconds    10,000
Lead         around 1,300 microelectronvolts over 20 seconds    20 million operations
-------------------------------------------------------------------------
`

## Will Material Upgrades Push Quantum Scale Toward 2029?

Hardware coherence gains historically adhere to Schoelkopf's law, which says that qubit coherence time doubles about once every year. A massive leap within twelve months bypassed years of projected incremental gains on paper. This progress led Microsoft's quantum leadership, including Chetan Nayak, to target 2029 for commercial-scale systems.

Simultaneously, algorithm optimizations are lowering physical hardware requirements. For instance, if you want to break RSA 2048 using Shor's algorithm, people previously estimated you probably need around 10 million qubits to manage error correction overhead. Compiler routines and algorithmic efficiencies continue to reduce that requirement. The acceleration of these mathematical optimizations is detailed further in [Quantum Computing Threats Accelerate Encryption Breakdown](/video/quantum-computing-threats-to-current-encryption-explained).

| Metric / Dimension | Majorana 1 Architecture | Majorana 2 Architecture |
| :--- | :--- | :--- |
| **Superconductor Layer** | Aluminum (around 300 microelectronvolts gap) | Lead (around 1,300 microelectronvolts gap) |
| **Nanowire Width** | 35 nm | 35 nm |
| **Coherence Lifetime** | 1 to 10 milliseconds | over 20 seconds |
| **Gate Execution Speed** | 1 microsecond | 1 microsecond |
| **Pre-Error Operations** | 10,000 operations | 20 million operations |
| **Operating Temperature** | 50 millikelvin (0.05° above absolute zero) | 50 millikelvin (0.05° above absolute zero) |

Despite these operational gains, the wider physics community maintains healthy skepticism. Skeptics note that holding a passive quantum state for over 20 seconds does not equal active quantum computation. Microsoft has not yet demonstrated public gate operations, active superposition control, or complex multi-qubit algorithm execution on the Majorana 2. Scaling from an isolated tetron to thousands of interconnected topological nodes introduces immense thermal and micro-wiring hurdles.

## What To Actually Do

Evaluating the materials and architectures powering modern quantum devices allows tech executives and engineers to cut through public relations noise:

1.  **Track physical qubit modalities by noise immunity, not raw count.** Do not compare systems by physical qubit volume alone. A machine running topologically protected qubits with lifetimes over 20 seconds provides vastly more computational utility than an array of noisy superconducting transmon qubits that collapse rapidly.
2.  **Audit cryptographic vulnerability against post-quantum standards.** Because physical architectures are scaling alongside more efficient algorithmic code, legacy public-key systems will expire faster than older roadmap estimates suggested. Begin migrating critical infrastructure to lattice-based post-quantum cryptography algorithms today.
3.  **Validate vendor hardware roadmaps against atomic fabrication realities.** Examine the physical materials vendors use. Silicon spin qubits, trapped ions, and topological nanowires face vastly different manufacturing limitations. When an enterprise promises a sudden leap in operational fidelity, look for published physical gap measurements, substrate compatibility data, and reproducible gate control demonstrations before reallocating technical resources.
