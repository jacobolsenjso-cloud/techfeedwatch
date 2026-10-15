---
title: "Which Architecture Powers Quantum Computing Chips?"
youtubeId: "XAYh7HRjzs0"
channelTitle: "Sabine Hossenfelder"
channelId: "UC1yNl2E66ZzKApQdRuTQ4tw"
publishedAt: "2026-06-09T15:00:25Z"
date: "2026-10-05"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Quantum computing chips, or quantum processing units, execute complex algorithms using physical qubits governed by quantum superposition and entanglement. These specialized processors evaluate expansive computational spaces simultaneously, operating through distinct hardware modalities such as superconducting circuits and topological quasiparticles. Because ambient thermal noise disrupts quantum coherence, the hardware requires extreme sub-zero dilution refrigerators and companion cryogenic controllers to function."
metaDescription: "Learn what quantum computing chips are, how physical qubits process complex states, and why these processors require specialized dilution refrigerators."
targetQuestion: "what are quantum computing chips"
duration: "6:31"
viewCount: 279965
viewsUpdated: "2026-10-15"
thumbMax: true
isShort: false
rewrittenAt: "2026-10-15"
faqs:
  - question: "What are quantum computing chips made of?"
    answer: "According to IBM, quantum chips consist of multilayer substrates etched with superconducting components that serve as physical qubits. These micro-architectures commonly rely on thin films of metals such as aluminum or niobium deposited on silicon or sapphire bases."
  - question: "Do quantum computers use chips?"
    answer: "Yes, quantum computers execute calculations on specialized physical hardware processors called Quantum Processing Units. According to IBM, these integrated chips house the physical qubits and control structures required to run non-binary quantum algorithms."
  - question: "Who is making quantum computing chips?"
    answer: "Major semiconductor and computing corporations manufacture quantum processors, including IBM, Google, and Intel. According to Google Quantum AI, the company fabricates its 105-qubit Willow chip, while IBM manufactures its 156-qubit Heron processor."
  - question: "How do quantum computing chips work?"
    answer: "According to McKinsey & Company, quantum chips leverage quantum superposition and entanglement to evaluate multiple solution states simultaneously. They process information across interconnected qubits rather than evaluating discrete sequential steps like classical binary logic."
---

Quantum computing chips, also known as Quantum Processing Units (QPUs), are physical integrated circuits that process information using quantum bits instead of classical binary transistors. According to IBM, a QPU is a multilayer chip etched with superconducting components that function as physical qubits to process quantum algorithms rather than deterministic binary logic.

These devices manipulate the laws of quantum physics to evaluate massive mathematical problem spaces that conventional processors cannot resolve in reasonable timeframes.

## How do quantum chips differ from classical computer chips?

Quantum chips differ from classical computer chips by processing information with qubits that exist in multiple simultaneous states instead of fixed binary bits.

Classical central processing units process data through microscopic semiconductor transistors. These silicon switches register electricity in one of two binary modes: high voltage or low voltage, which software reads as a zero or a one. Every basic logic gate in a classical chip evaluates these states through sequential, step-by-step electronic operations.

According to McKinsey & Company, while classical chips evaluate variables sequentially along discrete computational paths, quantum chips leverage quantum superposition and entanglement to evaluate multiple solution states simultaneously. Superposition allows a single qubit to represent a linear combination of both basic states. Entanglement links individual qubits together, meaning the computational capacity scales exponentially with the count of active qubits.

According to Google Quantum AI's December 9, 2024 specification sheet, its 105-qubit superconducting quantum chip named Willow executes a surface code cycle in 1.1 microseconds. According to Google Quantum AI, simulating the entangled states of its 105-qubit processor on classical supercomputers requires an intractable volume of memory. 

- Data representation: Classical chips evaluate standard binary bits, whereas quantum chips manipulate qubits in superposition.
- Computational workflow: Classical microprocessors run sequential logic, while quantum processors evaluate expansive mathematical states at once.
- Fault profile: Classical silicon transistors function with negligible bit-flip rates, whereas quantum chips require active error correction cycles to mitigate noise.

## Hardware architectures range from superconducting loops to topological qubits

Hardware architectures for quantum chips rely on distinct physical modalities, primarily superconducting circuits, silicon spin traps, neutral atoms, and experimental topological systems.

Superconducting designs currently dominate commercial installations. Engineers fabricate these chips by printing microscopic loops separated by thin insulating barriers known as Josephson junctions. These junctions function as non-linear inductors, isolating individual quantum energy levels that act as artificial atoms controlled by microwave pulses.

According to IBM's May 15, 2025 deployment report with the University of Tokyo, the 156-qubit IBM Heron processor features a tunable-coupler architecture that delivers a 3- to 4-fold reduction in two-qubit error rates compared to the previous Eagle processor. Tunable couplers allow system operators to dynamically activate or suppress interactions between neighboring qubits, reducing background noise and computational crosstalk during multi-gate routines.

According to Google Quantum AI's December 9, 2024 specification sheet, its 105-qubit superconducting quantum chip named Willow achieves an average single-qubit gate error rate of 0.035%. Achieving low physical error rates remains necessary to assemble reliable logical qubits across any fabrication format.

Other engineering teams pursue silicon spin architectures that capture isolated electrons inside modified semiconductor quantum dots. This strategy attempts to leverage mature commercial microchip fabrication facilities to manufacture billions of uniform quantum elements. Meanwhile, researchers are attempting to build topological quantum chips that braid theoretical quasiparticles to shield data from local environmental disturbances.

- Superconducting circuits: Planar microchips etched with Josephson junctions that manipulate electromagnetic energy states via microwave frequencies.
- Silicon spin chips: Nanoscale semiconductor devices that trap single electrons and encode information using magnetic spin orientations.
- Trapped ion devices: Vacuum chambers using optical laser grids to suspend and manipulate isolated atomic ions.
- Topological systems: Experimental semiconductor-superconductor interfaces designed to encode data in protected non-local spatial properties.

## Why do quantum computing chips need extreme cooling?

Quantum computing chips require near-absolute-zero operating environments because ambient thermal energy destroys the fragile quantum states that allow qubits to calculate.

Heat causes atomic vibrations within the chip substrate and generates stray electromagnetic radiation. When a qubit absorbs thermal energy from its surroundings, its phase collapses in a breakdown called decoherence. Once decoherence occurs, the chip loses its mathematical data and functions no better than a broken classical register.

According to the National Institute of Standards and Technology (NIST), superconducting quantum processors require commercial dilution refrigerators operating at base temperatures below 20 to 100 millikelvin to suppress thermal excitations and prevent qubits from losing coherence. These multi-stage cryostats achieve temperatures colder than the vacuum of deep space by circulating a closed mixture of helium isotopes.

Physical wiring and thermal loads between room-temperature electronics and dilution refrigerators represent a critical scaling bottleneck for multi-qubit processors. Every individual control line carries ambient heat downward, threatening to warm the mixing chamber.

Engineers are developing cryogenic integrated circuits to manage signal routing inside the refrigerator itself. According to [Intel](https://www.intel.com/content/www/us/en/homepage.html)'s June 2024 report at the IEEE Symposium on VLSI Technology & Circuits, the Pando Tree cryogenic control chip was engineered to operate directly at 10 to 20 millikelvin, demultiplexing control signals across up to 64 qubit terminals to reduce wiring congestion.

Moving the multiplexing circuitry directly adjacent to the quantum chip eliminates hundreds of analog cables.

## Quantum processors complement classical CPUs rather than replacing them

Quantum processors function as specialized mathematical accelerators that work alongside traditional microprocessors rather than replacing everyday consumer CPUs.

A quantum chip cannot run an operating system, drive an external display, or handle basic database lookups. According to NIST, superconducting quantum processors require commercial dilution refrigerators operating at base temperatures below 20 to 100 millikelvin. In real deployments, classical servers control the initialization, calibration, pulse timing, and final readout collection of the QPU.

Hybrid workflows route subroutines based on algorithmic suitability. Analyzing [how quantum and classical computing differ](/video/how-is-quantum-computing-different-from-classical-computing) explains why classical chips retain everyday application workloads while offloading targeted linear algebra and quantum simulations. This architecture mirrors the division of labor between standard central processors and dedicated graphics processing units.

Physical infrastructure constraints restrict quantum chips to centralized enterprise data centers. Dilution refrigerators require three-phase industrial electrical power, extensive vacuum pump assemblies, and continuous access to specialized gas supplies. Enterprise developers access QPUs through cloud environments, submitting complex optimization or chemical modeling tasks while standard computer servers handle the surrounding software stack.

## Sabine Hossenfelder breaks down Microsoft's Majorana 2 chip claims

Physicist [Sabine Hossenfelder](https://sabinehossenfelder.com/newsletter/) analyzed Microsoft's Majorana 2 announcement, assessing the validity of the company's claims regarding topological qubits and operational readiness.

[Microsoft](https://www.microsoft.com/en-us) positioned Majorana 2 as a topological quantum chip engineered with help from its agentic AI tools. According to Sabine Hossenfelder, Microsoft stated that the device sustained an average qubit lifespan of 20 seconds alongside a 1,000-fold gain in stability. Microsoft also announced its goal to construct a scalable quantum machine by 2029, accelerating its prior target of 2033.

Hossenfelder observed that while Google, Amazon, and IBM build chips using superconducting circuits, Microsoft has focused on topological computing for more than a decade. Topological computing relies on conserved quantities like topological invariants or boundary conditions to protect hardware from environmental decoherence.

However, Hossenfelder identified large discrepancies between Microsoft's marketing statements and its underlying experimental evidence. Microsoft's previous Majorana 1 announcement faced widespread criticism because the accompanying technical paper lacked verification data for even a single working qubit. According to Sabine Hossenfelder, Microsoft later claimed to create a qubit with four Majorana modes in an unverified preprint that drew sharp scientific skepticism.

Microsoft's recent technical paper details a hardware material shift from aluminum to lead, which extends quantum effects by widening the superconducting gap. Yet Hossenfelder emphasized that observing topological states does not equal operating an actual topological qubit, as Microsoft has not demonstrated both properties simultaneously.

Condensed matter physicist Henry Legg informed Science News that the preprint fails to resolve the primary scientific challenges. Physicist Sergey Frolov told Scientific American that "this new preprint is not based on a research track record that can be considered a solid foundation."

Frolov added that "when Microsoft is mentioned these days, physicists and quantum computing specialists just chuckle or raise their eyebrows."

Sabine Hossenfelder rated the research paper a two out of 10 on her scale of exaggeration, while scoring Microsoft's press release an eight out of 10. According to Sabine Hossenfelder, Microsoft's claims resemble a progress bar stuck at 99% that could remain unresolved for the next 20 years.

## Sources

- [What is a QPU (Quantum Processing Unit)? | IBM](https://www.ibm.com/think/topics/qpu) — ibm.com
- [Willow spec sheet (PDF)](https://quantumai.google/static/site-assets/downloads/willow-spec-sheet.pdf) — quantumai.google
- [The University of Tokyo to Equip IBM Quantum System One with Most Performant IBM Heron Processor](https://newsroom.ibm.com/2025-05-15-the-university-of-tokyo-to-equip-ibm-quantum-system-one-with-most-performant-ibm-heron-processor) — ibm.com
- [Image published patent application us 20230059433 a1](https://www.nist.gov/document/image-published-patent-application-us-20230059433-a1) — nist.gov
- [community.intel.com/t5/Blogs/Tech-Innovation/Data-Center/Intel-s-Millikelvin-Quantum-Research-Control-Chip-Provides/post/1608558](https://community.intel.com/t5/Blogs/Tech-Innovation/Data-Center/Intel-s-Millikelvin-Quantum-Research-Control-Chip-Provides/post/1608558) — intel.com
- [What is quantum computing](https://www.mckinsey.com/featured-insights/mckinsey-explainers/what-is-quantum-computing) — mckinsey.com
- [Microsoft Announces Breakthrough With Quantum Chip](https://www.youtube.com/watch?v=XAYh7HRjzs0) — Sabine Hossenfelder on YouTube
