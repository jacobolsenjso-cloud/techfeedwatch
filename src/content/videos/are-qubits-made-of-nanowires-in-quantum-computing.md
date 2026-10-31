---
title: "What Are Qubits Made of in Quantum Computing?"
youtubeId: "oU_eQ4bEf1k"
channelTitle: "Dr Ben Miles"
channelId: "UCUeZBocfxALSUdOgNJB5ySA"
publishedAt: "2026-06-14T15:00:05Z"
date: "2026-09-23"
updated: "2026-10-24"
tags:
  - "Quantum Computing"
  - "Hardware & Chips"
summary: "Physical qubits in quantum computing are built from microscopic systems, including superconducting electronic circuits, trapped ions, neutral atoms, and individual photons. Each architecture uses different materials and isolation mechanisms, ranging from microfabricated silicon-based chips to laser-suspended atomic clouds. Controlling these systems requires specialized infrastructure, such as dilution refrigerators operating near absolute zero or ultra-high vacuum chambers."
metaDescription: "Learn what qubits are made of in quantum computing, from superconducting transmon circuits and trapped ions to photons and silicon spin devices."
targetQuestion: "what are qubits made of in quantum computing"
duration: "18:17"
viewCount: 393556
viewsUpdated: "2026-10-31"
thumbMax: true
isShort: false
rewrittenAt: "2026-10-24"
faqs:
  - question: "What are qubits physically made of?"
    answer: "According to IBM, qubits are physically constructed from isolated microscopic systems, including superconducting electronic circuits, trapped ions, neutral atoms, photons, and electrons confined in semiconductors."
  - question: "What is the difference between qubits and classical bits?"
    answer: "Classical bits represent single binary values of zero or one using electrical charge in silicon transistors. According to IBM, qubits use quantum properties like superposition to hold combinations of both states simultaneously across physical quantum media."
  - question: "How do qubits work in physical systems?"
    answer: "According to the American Physical Society, physical qubits use discrete quantum energy levels or particle properties that engineers manipulate using microwave pulses, radio frequencies, or focused lasers. These external control signals drive quantum logic gates before the system collapses into a classical output during measurement."
  - question: "How are qubits used to process data?"
    answer: "Hardware platforms link multiple physical qubits through quantum entanglement to evaluate complex computational spaces at speeds unattainable by conventional computers. According to Nature, experimental systems maintain these delicate states across thousands of individual atoms using optical tweezers to execute programmable quantum algorithms."
---

Qubits in quantum computing are made of engineered microscopic physical systems, including superconducting electronic circuits, trapped atomic ions, neutral atoms, individual photons, and semiconductor-confined electrons. Engineers build these components out of tangible materials such as aluminum, niobium, silicon, or isolated gases to harness quantum mechanical phenomena.

Unlike classical transistors that switch between zero and one using bulk electrical charge, these physical platforms store information across discrete quantum states.

According to IBM, physical qubits require extreme isolation to maintain their quantum properties. Any unwanted interaction with the surrounding environment causes decoherence, destroying the stored information. Because quantum mechanics operates across different microscopic scales, researchers build qubits using several competing physical designs.

## How do superconducting circuits create artificial qubits?

Superconducting circuits create artificial qubits by routing electric currents with zero electrical resistance through microfabricated metal loops interrupted by nanoscale insulating barriers called Josephson junctions. This design forms an artificial atom with discrete, non-linear energy levels that engineers manipulate using microwave pulses.

According to the American Physical Society, these circuits are microfabricated on silicon or sapphire substrates using inductors, capacitors, and Josephson junctions. The junction itself consists of two superconducting electrodes separated by a thin insulating layer roughly one nanometer thick. Pairings of electrons, known as Cooper pairs, tunnel across this barrier without generating electrical resistance or heat.

Maintaining this superconducting behavior requires an extreme operating environment. According to IBM, superconducting transmon processors must operate inside multi-stage dilution refrigerators at temperatures between 10 and 15 millikelvin. That temperature is roughly one hundred times colder than deep space, which stops ambient thermal energy from disrupting the circuit's delicate quantum state.

Engineers fabricate these circuits using traditional semiconductor lithography tools. This manufacturing approach allows quantum teams to leverage established cleanroom infrastructure, even as they contend with the complex wiring demands of scaling [modern quantum computing chips](/video/which-hardware-defines-quantum-computing-chips-today) inside cryogenic chambers.

## Trapped ions and neutral atoms isolate qubits in vacuums

Trapped-ion and neutral-atom systems create qubits by suspending individual natural atoms inside ultra-high vacuum chambers using electromagnetic fields or focused laser beams. By relying on identical atoms provided by nature, these systems avoid the manufacturing imperfections found in fabricated solid-state circuits.

According to the [National Institute of Standards and Technology](https://www.nist.gov/), trapped-ion systems use charged atomic ions, such as beryllium or magnesium, held in place by radio-frequency Paul traps.

Laser or microwave pulses manipulate the internal electronic energy levels of each suspended ion to perform logic operations. Because the ions carry an electric charge, their mutual electrostatic repulsion enables multi-qubit entanglement across the chain.

Neutral-atom computers instead use uncharged atoms held by tightly focused beams of light called optical tweezers. According to Nature, researchers at the California Institute of Technology assembled an array of 6,100 neutral-atom qubits made of single cesium atoms trapped in a vacuum grid. That Caltech experiment sustained quantum superposition states for roughly 12.6 seconds.

Optical tweezers allow neutral-atom processors to organize hundreds or thousands of atoms into reconfigurable two-dimensional or three-dimensional arrays. While trapped ions rely on radio-frequency electrodes, neutral atoms transition into highly excited Rydberg states to interact with neighboring atoms across the array.

## Photons and semiconductor spins encode quantum information using particles

Photonic and semiconductor spin architectures encode qubits directly into the intrinsic quantum properties of elementary particles, specifically photon polarization states and electron spins. These systems use nanoscale components to route, manipulate, and measure quantum data.

According to [Microsoft](https://quantum.microsoft.com/en-us/insights/blogs/majorana-2-scalable-quantum-processor), photonic qubits are built from individual particles of light that encode information across physical properties such as polarization, phase, or spatial mode. Photons travel through optical waveguides, beam splitters, and phase shifters on silicon photonic chips. Because photons do not interact strongly with ambient thermal vibrations, photonic circuits can route quantum signals at room temperature.

Semiconductor spin qubits trap individual electrons or atomic nuclei inside tiny silicon structures known as quantum dots. By applying external magnetic fields and microwave pulses, engineers control the spin orientation of the trapped electron to represent zero, one, or a superposition of both. This approach closely mirrors standard silicon transistor manufacturing, allowing developers to adapt standard semiconductor production lines.

Topological qubits represent a distinct, theoretical subclass of solid-state systems. According to Microsoft, topological qubits are experimental architectures constructed from quasiparticle excitations called Majorana zero modes in hybrid superconductor-semiconductor nanostructures. This approach distributes quantum information non-locally across physical wires to protect data against local environmental noise.

## Which qubit technology offers the best operational trade-offs?

No single qubit technology offers an absolute operational advantage, because physical platforms that provide rapid processing speeds suffer from higher error rates, while environmentally isolated atomic qubits feature slower gate operations.

- Superconducting circuits execute operations in nanoseconds, but require dilution refrigerators operating at 10 to 15 millikelvin according to IBM.
- Trapped ions provide natural atomic uniformity, yet physical shuttling mechanisms slow operation speeds according to the National Institute of Standards and Technology.
- Neutral atoms scale to dense grids like Caltech's 6,100-atom array according to Nature, but require arrays of optical lasers to hold individual atoms.
- Photonic qubits operate across room-temperature waveguides according to Microsoft, but lack simple mechanisms to generate deterministic interactions between individual photons.

While classical hardware evaluates calculations sequentially, understanding [how quantum computing differs from classical computing](/video/how-is-quantum-computing-different-from-classical-computing) means recognizing that quantum processors evaluate multiple possibilities simultaneously. Maintaining chips at cryogenic temperatures near absolute zero inside expensive refrigerators remains a major industrial barrier.

Solid-state qubits suffer from structural defects in the surrounding silicon substrate, while atomic systems risk atom loss if vacuum pressure fluctuates.

## Dr Ben Miles explores Microsoft's topological qubit in Copenhagen

Dr Ben Miles visits Microsoft's quantum laboratory in Copenhagen to examine how engineers fabricate topological qubits from hybrid superconducting nanowires rather than standard transmon circuits.

According to Dr Ben Miles, the team's dilution refrigerator removes around 99.999999% of air molecules and chills the processor to 50 millikelvin, which is just 0.05 degrees above absolute zero. Within this chamber, Microsoft mounts devices built from semiconductor nanowires measuring just 35 nanometers wide.

Engineers assemble these qubits using precise layers of physical materials:

- Nanowire base: A 35-nanometer-wide semiconductor wire controlled by electric field gates.
- Superconductor layer: A film laid down on top of the wire, engineered roughly 30 atoms thick.
- Tetron assembly: An H-shaped layout of linked wires that encodes a qubit into electron parity across four Majorana zero modes.

When cooled to 50 millikelvin, electrons in the superconductor bind into Cooper pairs and leak their frictionless behavior into the semiconductor wire through the proximity effect. Dr Ben Miles explains that Microsoft originally built its Majorana 1 qubit using aluminum, which provided a superconducting gap of around 300 microelectronvolts and yielded error-free coherence times of only 1 to 10 milliseconds.

To fix this vulnerability, Microsoft replaced the aluminum layer with lead, raising the superconducting gap to around 1,300 microelectronvolts. According to Dr Ben Miles, this material swap increased the energy required to break Cooper pairs by four times, boosting qubit lifetimes from 1 to 10 milliseconds to over 20 seconds.

Microsoft projects that this material change allows 20 million operations before an error occurs, leading the company to advance its roadmap target for a scalable quantum machine to 2029.

Try the numbers yourself in our [Quantum Speed-up Calculator](/tools/quantum-speedup-calculator).

## Sources
- [What is a qubit? | IBM](https://www.ibm.com/think/topics/qubit) — ibm.com
- [Physics.4.103](https://link.aps.org/doi/10.1103/Physics.4.103) — aps.org
- [What Is Quantum Computing? | IBM](https://www.ibm.com/think/topics/quantum-computing) — ibm.com
- [Quantum Computing with Trapped Ions | NIST](https://www.nist.gov/programs-projects/quantum-computing-trapped-ions) — nist.gov
- [Trapped-ion quantum computer - Wikipedia](https://en.wikipedia.org/wiki/Trapped-ion_quantum_computer) — wikipedia.org
- [Caltech Team Sets Record with 6,100-Qubit Array - Challenge Institute for Quantum Computation](https://ciqc.berkeley.edu/caltech-team-sets-record-with-6100-qubit-array/) — berkeley.edu
- [Microsoft Quantum | Types of qubits](https://quantum.microsoft.com/en-us/insights/education/concepts/types-of-qubits) — microsoft.com
- [Microsoft Announces 1000x Better Quantum Chip](https://www.youtube.com/watch?v=oU_eQ4bEf1k) — Dr Ben Miles on YouTube
