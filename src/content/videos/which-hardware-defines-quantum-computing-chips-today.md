---
title: "Which Hardware Defines Quantum Computing Chips Today?"
youtubeId: "XAYh7HRjzs0"
channelTitle: "Sabine Hossenfelder"
channelId: "UC1yNl2E66ZzKApQdRuTQ4tw"
publishedAt: "2026-06-09T15:00:25Z"
date: "2026-10-05"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Quantum computing chips replace binary silicon transistors with physical qubits capable of holding states in superposition and entanglement. While tech giants rely on superconducting circuits, alternative architectures pursue topological protection to cut down computational noise. Evaluating these processors requires separating peer-reviewed physics from optimistic corporate roadmaps."
metaDescription: "What are quantum computing chips? Explore how quantum processors operate, compare physical qubit architectures, and evaluate industry progress."
targetQuestion: "what are quantum computing chips"
duration: "6:31"
viewCount: 279734
viewsUpdated: "2026-10-07"
thumbMax: true
isShort: false
faqs:
  - question: "What are quantum computing chips and how do they function?"
    answer: "Quantum computing chips are physical processors that process information using quantum bits (qubits) rather than classical semiconductor transistors. They leverage quantum mechanical principles like superposition and entanglement to execute complex calculations across vast mathematical spaces simultaneously."
  - question: "How do topological quantum chips differ from superconducting processors?"
    answer: "Superconducting processors rely on microscopic electrical circuits cooled near absolute zero, making them highly vulnerable to environmental noise. Topological chips attempt to protect qubits using conservation laws and braided topological invariants to resist interference natively."
  - question: "Why do physicists contest Microsoft's recent quantum computing claims?"
    answer: "Microsoft announced the Majorana 2 chip and claimed a 1,000-fold reliability improvement, but independent physicists noted the accompanying research showed material phase transitions rather than functioning topological qubits. Critics emphasize that demonstrating exotic physics in lead nanowires does not equal operational quantum hardware."
---

Quantum computing chips are physical microprocessors that manipulate quantum bits (qubits) to perform calculations impossible for classical binary microchips. Instead of etching billions of microscopic on-or-off silicon gates onto an integrated circuit, these processors create, stabilize, and control fragile quantum states directly on physical substrates.

## What Are Quantum Computing Chips in Physical Reality?

Strip away the marketing gloss, and a quantum computing chip is an engineered environment designed to protect quantum coherence while allowing precise mathematical gate operations. Classical computer chips compute using bits that exist strictly as electrical voltage values representing a zero or a one.

Quantum processors exploit quantum mechanics. Their physical units operate in linear combinations of states called superposition, while interacting through entanglement to evaluate complex problem spaces simultaneously. To understand the foundational mechanics behind these architectures, consider [how is quantum computing different from classical computing?](/video/how-is-quantum-computing-different-from-classical-computing) at the gate level.

The physical construction of these processors depends entirely on the underlying qubit architecture. Building a machine that maintains coherence against ambient thermal vibrations, stray magnetic fields, and microscopic chip defects presents enormous engineering hurdles. Currently, the dominant tech players take wildly divergent paths to solve this hardware bottleneck. 

[Google](https://www.google.com/), Amazon, and IBM construct their processors using superconducting circuits. These chips pattern tiny loops of superconducting metals, such as aluminum or niobium, onto silicon wafers. When cooled inside multi-stage dilution refrigerators to fractions of a degree above absolute zero, electrical resistance drops to zero.

Paired electrons, known as Cooper pairs, tunnel across thin insulating barriers called Josephson junctions. This junction acts as a non-linear inductor, creating discrete, controllable quantum energy levels.

Superconducting chips let engineers manipulate states using calibrated microwave pulses routed through coaxial cables. They operate fast. They scale with existing lithography processes.

Yet they suffer from a crippling flaw: environmental noise quickly destroys the quantum state. A passing thermal fluctuation, material defect, or stray photon can flip a bit or randomize its quantum phase.

To build a machine that executes error-corrected algorithms, engineers must link hundreds or thousands of physical qubits together simply to create one error-corrected logical qubit. This overhead forms the core debate around [Reasons Why Quantum Computing Will Help AI or Fail](/video/reasons-why-quantum-computing-will-help-ai-or-fail) when scaling enterprise workloads.

## Why Is the Race for Topological Quantum Chips So Fierce?

Because physical noise plagues superconducting architectures, alternative designs seek hardware-level noise suppression. [Microsoft](https://www.microsoft.com/en-us) took a radically different gamble: topological quantum computing. While competitors fabricate superconducting loops, Microsoft has been working on this for more than a decade to build a topological processor from the ground up.

The premise behind a topological chip is structural defense. For topological quantum computing, one tries to create qubits whose states are protected by conservation laws. The conserved quantities are certain topological invariants, knots, and boundary conditions.

Instead of storing quantum information in an isolated physical spot vulnerable to local thermal noise, a topological qubit braids quasi-particles across space. Local noise cannot easily unwind a global topological braid.

Achieving this hardware requires creating Majorana zero modes—non-Abelian anyons that appear as zero-energy excitations at the ends of specialized hybrid semiconductor-superconductor wires. In theory, manipulating these localized states allows hardware-level fault tolerance without massive active error-correction overhead. 

The execution, however, remains contentious. Microsoft initially announced Majorana 1, framing it as a hardware foundation designed to deploy commercial machines in years rather than decades.

When researchers examined the published data, the paper lacked proof of a working qubit. A subsequent preprint claimed the team created a qubit with four Majorana modes, but independent experimentalists remained skeptical of the data interpretation.

Recently, the company announced Majorana 2, heralding it as another major leap toward useful commercial quantum hardware. In the announcement, corporate spokespeople stated the chip features a mean qubit lifetime of 20 seconds and a 1,000-fold improvement in reliability.

They also declared they expect to build a scalable quantum computer by 2029, whereas just last year they put that milestone at 2033. Cutting years off a deep-physics timeline indicates massive internal confidence.

The experimental progress, however, tells a more nuanced story. The technical upgrade involved switching material from aluminum to lead.

Lead features a larger superconducting gap than aluminum, which provides stronger energetic protection to the superconducting state and substantially extends quantum coherence times. But demonstrating a wider superconducting gap on a semiconductor wire does not yield a functional qubit.

Independent researchers immediately questioned the gap between the corporate announcement and the underlying data. As [Sabine Hossenfelder](https://sabinehossenfelder.com/newsletter/) points out, the paper rates a two out of 10 on the bullshit meter, but the press release is an eight out of 10.

Condensed matter physicist Henry Legg told Science News: "Nothing in this preprint resolves the fundamental issues." Quantum researcher Marin Ibričić wrote in a LinkedIn post that smells like it was written by ChatGPT that it's "strong marketing, contested evidence."

Physicist Sergey Frolov observed in Scientific American: "This new preprint is not based on a research track record that can be considered a solid foundation." Frolov added that within the specialized physics community, the claims cause researchers to chuckle or raise their eyebrows.

The core tension is unambiguous: "The problem is that Microsoft needs both: qubits from topological states, and this very thing, which they need, is the thing that they have not demonstrated."

Demonstrating parity states or topological phase transitions in lead-based nanowires proves difficult material physics, but it does not produce a gate-addressable qubit. Moving the internal progress bar to 99% does not prevent it from staying there for the next 20 years.

## Which Metrics Actually Separate Working Chips From Hype?

Understanding what quantum computing chips can deliver means ignoring press releases and inspecting hardware metrics. Evaluating any processor requires tracking three distinct operational dimensions:

1. **Physical Coherence Time vs. Gate Time:** A chip's utility depends on the ratio of how long a qubit remains coherent to how long a logical gate operation takes to execute. If a qubit dephases before microwave or laser pulses complete a two-qubit gate, computation fails. Coherence times measured in fractions of a second matter only if gate fidelity reaches the fault-tolerant threshold.

2. **Crosstalk and Interconnect Density:** Placing physical qubits on a die is relatively straightforward; routing hundreds of independent high-frequency control lines without bleeding electromagnetic cross-talk into neighboring elements is an engineering nightmare. Examining packaging methods reveals [what quantum computing companies are building now](/video/how-quantum-computing-companies-are-commercializing-advanced-tech) to bridge dilution stages with high-density cryogenic wiring.

3. **Logical Error Rates and Thresholds:** No quantum processor can execute deep commercial algorithms without quantum error correction. Raw physical qubit counts mean little without examining the two-qubit randomized benchmarking error rate. Processors need error rates well below fault-tolerant thresholds to execute surface codes efficiently.

## How to Evaluate Quantum Chip Claims

If you are an engineer, technical executive, or researcher evaluating quantum chip claims, adopt a rigorous technical filter:

- **Demand full qubit gate demonstrations:** Never accept material discoveries or topological phase measurements as evidence of computing capability. If a research team cannot demonstrate single-qubit rotations, two-qubit entangling gates, and state readout on the exact physical platform being marketed, they do not possess a functional quantum chip.

- **Check preprint data against corporate press releases:** Compare the corporate summary against the technical preprint. Corporate marketing teams often assign numbers like a "1,000-fold improvement" to isolated physical parameters, such as a material's superconducting gap or isolated state lifetime, rather than algorithm performance.

- **Benchmark quantum algorithms on active hardware:** Evaluate cloud-accessible processors from providers deploying working superconducting or trapped-ion hardware. Run standard algorithmic circuits directly to measure circuit depth, state preparation and measurement (SPAM) errors, and gate fidelity under real operational conditions.

- **Discount aggressive multi-year roadmaps:** Physics-bound timelines routinely encounter unexpected material barriers. Treat long-range milestones, such as promises of commercially viable systems by 2029, as aspirational targets until peer-reviewed preprints confirm active fault-tolerant operations. Track real laboratory benchmarks, not corporate roadmaps.
