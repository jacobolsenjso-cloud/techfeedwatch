---
title: "Is Quantum Computing Possible in Practical Systems"
youtubeId: "Baf2gnP9JUc"
channelTitle: "Addie LaMarr"
channelId: "UCIhmSXHw5WB6cMqkVGiZMbg"
publishedAt: "2026-09-27T18:09:30Z"
date: "2026-10-16"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Quantum computing is physically real and functioning in research laboratories, but building stable, fault-tolerant machines remains an unresolved engineering challenge. Current devices are noisy, small-scale prototypes limited by environmental interference and physical control constraints. While corporate roadmaps project useful systems within a decade, theoretical barriers such as correlated noise could still prevent practical utility."
metaDescription: "Is quantum computing possible? Discover whether scalable quantum processors can overcome physical noise to outperform classical supercomputers."
targetQuestion: "is quantum computing possible"
duration: "11:28"
viewCount: 8234
viewsUpdated: "2026-10-31"
thumbMax: true
isShort: false
faqs:
  - question: "What is quantum computing in simple terms?"
    answer: "It is an approach to calculation that uses subatomic properties like superposition and entanglement to evaluate complex states. Current hardware remains experimental, noisy, and cannot replace standard computers, according to NIST in March 2025."
  - question: "What is quantum computing used for?"
    answer: "Current research targets complex simulations in chemistry, physics, and materials science that exceed classical memory limits. However, no operational device has solved an economically practical problem faster than a classical supercomputer."
  - question: "What is quantum computing and how does it work?"
    answer: "It processes information using quantum bits that can hold multiple states simultaneously rather than standard binary bits. According to IBM in May 2025, useful execution requires coordinating hundreds of logical qubits across hundreds of millions of gate operations."
  - question: "What is quantum computing and why is it important?"
    answer: "It could calculate molecular behaviors and factor large integers that classical supercomputers cannot solve in reasonable timeframes. According to McKinsey & Company, systems capable of economically significant workloads are expected around 2035 or later."
---

Quantum computing is physically possible, and experimental systems already operate in research environments worldwide. However, whether quantum computing is possible at a fault-tolerant, practically useful scale remains an unproven question that scientists are still actively debating.

Current prototypes manipulate quantum mechanics at atomic scales, but these devices remain rudimentary, noisy, and incapable of replacing standard classical computers. While the underlying mathematics is proven, translating theoretical quantum algorithms into reliable, large-scale machines presents enormous physical and engineering hurdles.

According to the National Institute of Standards and Technology (NIST) in March 2025, quantum processors manipulate quantum mechanics at atomic scales, but existing devices remain rudimentary and noisy. They do not replace classical systems. The underlying mathematics works, yet translating theoretical algorithms into physical, large-scale machines exposes massive engineering hurdles.

## What sets quantum computers apart from classical hardware?

Quantum computers process information using quantum bits, or qubits, which exploit physical principles like superposition and entanglement to represent complex data states. Classical computers rely on semiconductor transistors that process binary digits as definite zeros or ones.

A classical bit represents a single discrete electrical state at any given moment. A qubit exists in a linear combination of states until measured, allowing a quantum processor to manipulate an exponential space of computational possibilities simultaneously.

Interconnected qubits interact through entanglement, a state where the condition of one qubit instantly correlates with another, creating mathematical correlations that classical silicon chips cannot efficiently mirror.

These features make quantum architectures radically distinct from conventional binary machines:
- Classical bits register strictly as 0 or 1, whereas qubits evaluate continuous probabilistic amplitudes across both states.
- Entangled states let a quantum register explore complex mathematical spaces without storing each state individually in classical memory.
- Computational outputs rely on quantum interference, amplifying correct computational paths while canceling erroneous calculations before readout.

Because of this structure, [these architectural differences](/video/how-is-quantum-computing-different-from-classical-computing) dictate that quantum systems are not faster general-purpose engines. They function as specialized physical accelerators intended for narrow mathematical classes, such as chemical system simulations and prime factorization.

## Decoherence and correlated noise threaten physical scaling

Decoherence occurs when environmental thermal, magnetic, or electrical disturbances corrupt fragile quantum states, causing computational errors before an algorithm can complete. This instability represents the primary physical barrier to scaling quantum systems.

Qubits require isolation from ambient electromagnetic radiation and mechanical vibrations, often needing cooling systems running fractions of a degree above absolute zero. When an uncontrolled external particle interacts with a qubit, phase alignment collapses. The calculation reverts to random noise.

According to Hebrew University mathematician Gil Kalai in Quanta Magazine, large-scale fault-tolerant quantum computing may be physically impossible because correlated environmental noise will scale faster than error-mitigation codes can suppress it. When noise affects multiple physical qubits simultaneously, standard localized error-suppression models fail.

Physical scaling faces several hard limits:
- Thermal fluctuations and electromagnetic cross-talk between tightly packed control lines degrade gate operations.
- According to PRX Quantum research by Yale-NUS scientists, resource constraints such as physical volume, energy delivery, and control bandwidth create scale-dependent noise that caps achievable accuracy.
- Microscopic material impurities in superconducting substrates introduce unpredictable frequency shifts during multi-qubit gate operations.

If correlated noise models reflect physical reality, scaling up physical components will continually outpace isolation technology. Under those conditions, a machine capable of sustaining millions of operations cannot function.

## How does quantum error correction keep qubits stable?

Quantum error correction (QEC) stabilizes physical systems by spreading the information of a single logical qubit across multiple entangled physical qubits. This redundancy allows the system to detect and correct single-qubit errors without measuring the encoded information directly.

Measuring a qubit directly destroys its superposition and collapses the ongoing calculation. QEC evades this limitation by using ancilla qubits to measure parity checks rather than individual data states. By reading these diagnostic circuits, control hardware identifies whether a bit-flip or phase-flip occurred, applying corrective operations without reading the underlying payload.

This architecture requires high physical overhead. According to IBM in its May 2025 technical overview of fault tolerance, practical quantum computation requires executing hundreds of millions of logical operations across hundreds of logical qubits, not merely stacking raw physical components. 

To overcome the footprint problem, engineers are transitioning from basic surface codes to more dense encoding schemes.

According to IBM's Quantum Roadmap published in June 2025, the company is building the Starling system in Poughkeepsie, New York, with a target of running 100 million gates on 200 logical qubits by 2029 using quantum low-density parity-check (qLDPC) codes. These qLDPC codes drastically reduce the ratio of physical qubits required to sustain each stable logical qubit.

## No quantum processor currently outperforms classical supercomputers in practice

No quantum computer has delivered a useful, verified computational result that exceeds the performance of modern classical high-performance computing clusters. Experimental demonstrations of quantum advantage have relied on synthetic, highly artificial benchmarks designed specifically to favor quantum architectures.

These synthetic tests typically measure the time required to sample output distributions from random quantum circuits. While physical quantum hardware can generate these random numbers faster than classical simulation algorithms, the calculation yields no industrial or scientific value. Classical supercomputing centers quickly answered these claims by refining tensor network algorithms, shrinking the initial performance margins.

Timelines for real-world utility extend well into the coming decade. According to McKinsey & Company, an estimated 5,000 quantum computers will be operational by 2030, but systems capable of solving economically significant and complex computational tasks are not expected until 2035 or later. 

Until machines can reliably maintain logical qubits through deep circuit depths, enterprise tasks will remain on high-performance classical clusters. Research teams are still evaluating whether [quantum computing chips](/video/which-hardware-defines-quantum-computing-chips-today) based on superconducting loops, trapped ions, or neutral atoms will overcome these scaling barriers first.

## Addie LaMarr compares quantum computing to the ENIAC moment

In a technical analysis of early-stage computing hardware, cybersecurity practitioner Addie LaMarr compares the present state of quantum systems to the construction of ENIAC in 1943. During that era, the US [Army](https://ftp.arl.army.mil/~mike/comphist/96summary/) relied on about 200 human computers to calculate firing tables manually, spending 20 to 40 hours calculating a single trajectory with roughly 1,800 trajectories needed per table. 

LaMarr points out that when the University of Pennsylvania completed ENIAC, the room-sized machine finished a 20-hour manual trajectory calculation in 30 seconds. While the device was designed strictly for artillery ballistics, its early operation included secret calculations for Los Alamos, laying structural groundwork for digital architectures nobody in the room originally planned. 

LaMarr cites Dr. Tanner Crowder, the Department of Energy's quantum lead, who stated at the Quantum USA 2026 conference that quantum computing is currently living through its own "ENIAC moment," still requiring discovered applications and orders of magnitude more performance. 

Industrial chemistry represents one of the primary targets for this class of scientific instrument. Data from the International Energy Agency indicates that manufacturing artificial ammonia demands roughly 2% of worldwide power, with agriculture consuming approximately 70% of that volume for fertilizer.

Natural bacteria perform this nitrogen fixation at ambient temperatures using an enzyme called nitrogenase, but classical supercomputers cannot simulate the quantum states of the active molecules to replicate the process.

National governments fund companies like IBM, Google, [IonQ](https://ionq.com/), and Quantinuum partly to simulate these reaction mechanisms, but also to address cybersecurity concerns. In 1994, mathematician Peter Shor proved that a sufficiently large quantum computer running his algorithm would break public-key asymmetric encryption, a finding that has withstood 30 years of theoretical scrutiny. 

LaMarr observes that communications infrastructure is already deploying countermeasures ahead of any functional machine. LaMarr notes figures from [Cloudflare](https://blog.cloudflare.com/post-quantum-roadmap/) showing that post-quantum cryptographic defenses protect more than 65% of regular web visitors, as web clients including Chrome, Edge, and Firefox activated this protection by default.

Whether hardware engineers successfully build a fault-tolerant system or succumb to physical noise barriers, the broader computational sector is already restructuring systems around the possibility.

## Sources

- [Quantum Computing Explained | NIST](https://www.nist.gov/quantum-information-science/quantum-computing-explained) — nist.gov
- [Gil Kalai: Why Quantum Computers Won’t Work | Quanta Magazine](https://www.quantamagazine.org/videos/gil-kalai-why-quantum-computers-wont-work/) — quantamagazine.org
- [What is fault-tolerant quantum computing? | IBM Quantum Computing Blog](https://www.ibm.com/quantum/blog/what-is-ftqc) — ibm.com
- [IBM lays out clear path to fault-tolerant quantum computing | IBM Quantum Computing Blog](https://www.ibm.com/quantum/blog/large-scale-ftqc) — ibm.com
- [IBM Offers Roadmap Toward Large-Scale, Fault-Tolerant Quantum Computer at New IBM Quantum Data Center | National Security Initiatives](https://nationalsecurity.arizona.edu/news/ibm-offers-roadmap-toward-large-scale-fault-tolerant-quantum-computer-new-ibm-quantum-data) — arizona.edu
- [Quantum computing: What leaders need to know now | MIT Sloan](https://mitsloan.mit.edu/ideas-made-to-matter/quantum-computing-what-leaders-need-to-know-now) — mit.edu
- [What Can a Quantum Computer Do That a Laptop Can't?](https://www.youtube.com/watch?v=Baf2gnP9JUc) — Addie LaMarr on YouTube
