---
title: "Qubit Coherence: How Quantum States Survive Noise"
youtubeId: "ZMgAUjjMUjo"
channelTitle: "Isaac Sterling"
channelId: "UCjdDi7hH06ou4YdXYwsxVfA"
publishedAt: "2026-08-05T14:38:24Z"
date: "2026-10-19"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Qubit coherence measures how long a quantum bit retains its phase relationships and superposition before environmental noise forces it into classical states. Relaxation and dephasing define the physical boundaries of this lifespan across solid-state circuits and trapped ions. Computing power depends on the operational ratio between coherence time and gate speed rather than coherence duration alone."
metaDescription: "Learn what qubit coherence is, how T1 and T2 relaxation times work, and why coherence time dictates the computational limits of quantum hardware."
targetQuestion: "what is qubit coherence"
duration: "6:39"
viewCount: 2
viewsUpdated: "2026-10-19"
thumbMax: true
isShort: false
faqs:
  - question: "What is qubit coherence time?"
    answer: "Qubit coherence time measures the duration a quantum bit sustains its quantum information before noise causes it to lose superposition or phase alignment. According to Aalto University, physical systems like transmon qubits can reach coherence figures such as a 1.06-millisecond Hahn-echo lifetime."
  - question: "What is quantum coherence and decoherence?"
    answer: "Quantum coherence describes the defined phase relationship between quantum waves that enables superposition, according to Argonne National Laboratory. Decoherence is the decay process where physical interactions with environmental noise destroy this phase relationship and collapse the state into classical data."
  - question: "How does a qubit work?"
    answer: "A qubit functions by maintaining a linear combination of states through quantum superposition, unlike a classical binary bit. Argonne National Laboratory notes that preserving this defined phase relationship allows the system to process information across multi-state probabilities."
---

Qubit coherence is the physical property that allows a quantum bit to maintain a defined phase relationship between its quantum wave states, sustaining superposition without collapsing into classical binary data. According to Argonne National Laboratory, this defined phase relationship enables physical qubits to exist in a linear combination of states.

Once external interference disrupts that delicate phase relationship, the quantum state degrades into classical noise through decoherence.

## What is the difference between T1 and T2?
The relaxation time $T_1$ measures how long a qubit retains its energy before decaying to ground state, while the dephasing time $T_2$ measures how long the qubit preserves its quantum phase information.

Longitudinal relaxation, denoted as $T_1$, tracks the physical dissipation of energy from the qubit into its surrounding environment. A qubit excited to the state $|1\rangle$ eventually drops back to the ground state $|0\rangle$, erasing the stored quantum data.

In Nature Communications on July 8, 2025, physicists at Aalto University measured a transmon qubit with a median $T_1$ relaxation time of 425 microseconds.

Transverse dephasing, denoted as $T_2$, tracks how quickly the relative phase between $|0\rangle$ and $|1\rangle$ randomizes without necessarily losing energy. Pure dephasing mechanisms combine with energy relaxation to establish a strict mathematical ceiling where $T_2$ cannot exceed twice the value of $T_1$.

According to Aalto University in their July 8, 2025 publication, dynamical decoupling pulses extended their transmon's maximum Hahn-echo coherence time to 1.06 milliseconds by filtering out low-frequency noise.

Engineers categorize the distinctions between these two decay parameters:
- Energy relaxation ($T_1$) dissipates quantum state amplitude into nearby thermal and dielectric reservoirs.
- Phase dephasing ($T_2$) destroys the superposition angle through magnetic fluctuations and frequency jitter.
- Echo coherence sequences cancel slow environmental drift to stretch phase lifetimes closer to the theoretical limit.

## Environmental noise and material defects destroy quantum states
Environmental noise and microscopic material defects degrade qubit coherence by leaking energy out of the circuit and introducing random phase jitter into the system.

Fluctuating magnetic fields, stray thermal photons, and background electromagnetic radiation disrupt computational states. Even secondary showers from cosmic rays generate bursts of non-equilibrium quasiparticles that tunnel across superconducting junctions and degrade the processor.

Thin-film metals naturally accumulate amorphous native oxides at metal-air and metal-substrate boundaries. These messy boundaries harbor microscopic two-level fluctuators that absorb energy at the exact microwave frequencies qubits use to compute.

According to a study published in Nature on November 5, 2025, Princeton University engineers led by Andrew Houck extended the coherence time of a superconducting transmon qubit past 1 millisecond by replacing aluminum-on-sapphire with tantalum-on-silicon. Tantalum resists surface oxidation and forms cleaner chemical interfaces, eliminating many of the parasitic two-level systems that cause energy dissipation.

## How do coherence times compare across qubit platforms?
Hardware platforms exhibit widely disparate coherence times, ranging from hundreds of microseconds in solid-state superconducting circuits to several seconds in isolated trapped-ion systems.

Superconducting transmon circuits function as macroscopic artificial atoms fabricated on silicon chips. These engineered circuits allow rapid microwave manipulation, but physical contact with the underlying chip substrate exposes them to dielectric loss. Despite these interface challenges, Andrew Houck's Princeton team extended transmon coherence past 1 millisecond on November 5, 2025, marking nearly 3 times their previous lab benchmark.

Trapped-ion architectures abandon solid-state chips in favor of atomic physics. Vacuum chambers hold charged atomic ions suspended in free space using oscillating electromagnetic fields. Lasers manipulate the internal hyperfine states of these isolated ions without touching solid surfaces.

According to the Proceedings of the National Academy of Sciences (PNAS), trapped-ion systems achieve longer raw coherence times and higher operational fidelities than superconducting systems. The vacuum isolation eliminates substrate defects, giving atomic ions natural coherence lifetimes that last seconds or minutes. 

Physical trade-offs dictate platform design:
- Superconducting systems provide millisecond coherence but benefit from established semiconductor lithography.
- Trapped-ion systems achieve multi-second coherence by utilizing identical, naturally occurring atomic ions.
- Solid-state spin qubits combine compact footprints with microsecond lifetimes that remain sensitive to lattice strain.

## Coherence time matters only relative to gate speed
A long coherence time provides computational value only when considered alongside gate execution speed, because the total number of operations performed before decoherence determines actual processing capacity.

According to the Proceedings of the National Academy of Sciences (PNAS), superconducting systems offer much faster clock speeds than trapped-ion designs, proving that coherence cannot be evaluated in isolation from gate speed, connectivity, and crosstalk. Superconducting logic gates execute in tens of nanoseconds, allowing circuits to complete thousands of sequential gates within a 425-microsecond window.

According to quantum computing company [IonQ](https://ionq.com/) in March 2025, traditional trapped-ion entangling gates operate at roughly 10 kHz, but employing ultrafast state-dependent kicks using nanosecond optical pulses can raise speeds to megahertz rates, reducing the time needed to leverage long ion coherence lifetimes. Faster entangling gates allow algorithms to run to completion long before the background vacuum environment induces errors.

Modern quantum algorithms also rely on real-time classical processing to manage error mitigation. According to IBM Research in a November 20, 2024 Nature study, dynamic quantum circuits operated across two connected 127-qubit processors by executing classical feedback and mid-circuit measurements within runtimes limited to a fraction of the hardware's coherence time.

Reviewing the [difference between qubit and classical bit](/video/difference-between-qubit-and-classical-bit-explained) mechanisms shows why completing active feedback cycles before phase coherence dissolves remains necessary for fault-tolerant architectures.

## Isaac Sterling explains Brookhaven's 1.68 ms tantalum qubit breakthrough
Isaac Sterling explains how researchers at [Brookhaven National Laboratory](https://www.bnl.gov/world/)'s C2QA center pushed transmon coherence to 1.68 milliseconds by redesigning the physical materials of the circuit.

Sterling points out that superconducting qubits usually maintain their delicate states for only fractions of a millisecond. In his analysis, Sterling notes that "defects, tiny, microscopic imperfections, are like leaks in a quantum system," which actively cause energy loss and collapse coherence.

To plug these leaks, Brookhaven researchers abandoned standard thin films in favor of a tantalum layer deposited onto a silicon base.

The effort united 3 researchers from distinct fields: Nathalie de Leon focusing on quantum materials, Robert Cava handling solid-state chemistry, and Andrew Houck designing the microwave circuits. Sterling notes that tantalum forms cleaner interfaces than aluminum or niobium, while silicon acts as a lower-loss alternative substrate to sapphire.

Sterling asserts that these hardware results show qubits "are only as fragile as the materials we use to build them."

Because the tantalum-on-silicon process integrates into existing manufacturing pipelines, Sterling suggests commercial builders like Google or IBM could adopt the material stack without replacing their established microwave control hardware. Clean material engineering resolves coherence limits by addressing physical loss directly at the substrate interface.

Try the numbers yourself in our [Quantum Speed-up Calculator](/tools/quantum-speedup-calculator).

## Sources
- [What is quantum coherence](https://www.anl.gov/article/what-is-quantum-coherence) — anl.gov
- [Princeton puts quantum computing fast track new qubit](https://www.princeton.edu/news/2025/11/05/princeton-puts-quantum-computing-fast-track-new-qubit) — princeton.edu
- [New quantum record: Transmon qubit coherence reaches millisecond threshold | Aalto University](https://www.aalto.fi/en/news/new-quantum-record-transmon-qubit-coherence-reaches-millisecond-threshold) — aalto.fi
- [Pnas.1618020114](https://www.pnas.org/doi/10.1073/pnas.1618020114) — pnas.org
- [Combining quantum processors with real-time classical communication for Nature - IBM Research](https://research.ibm.com/publications/combining-quantum-processors-with-real-time-classical-communication) — ibm.com
- [IonQ | Advancing Quantum Computing: Faster Mixed-Species Gates for Trapped-Ion Quantum Networking](https://www.ionq.com/blog/advancing-quantum-computing-faster-mixed-species-gates-for-trapped-ion) — ionq.com
- [Superconducting Qubit Revolution: Tantalum and Silicon Extend Coherence Times](https://www.youtube.com/watch?v=ZMgAUjjMUjo) — Isaac Sterling on YouTube
