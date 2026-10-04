---
title: "Do We Know What Quantum Computers Are Used For?"
youtubeId: "DF4Jynv4Soc"
channelTitle: "New Scientist"
channelId: "UCt5OA3LingpZBeEyPYmputQ"
publishedAt: "2026-05-27T16:59:50Z"
date: "2026-09-30"
tags:
  - "Quantum Computing"
  - "Cybersecurity"
summary: "Quantum computers process complex information by modeling quantum mechanics directly rather than relying on binary switches. Today, researchers deploy them to simulate molecular structures for batteries and drug discovery, while advancing toward breaking classical cryptographic protocols. As physical hardware scales from laboratory arrays to commercial prototypes, understanding their specific utility separates engineering reality from industry speculation."
metaDescription: "Wondering what quantum computing is used for? Explore real-world applications in molecular simulation, material science, and modern cryptography threats."
targetQuestion: "what are quantum computing used for"
duration: "26:25"
viewCount: 101290
viewsUpdated: "2026-10-04"
thumbMax: true
isShort: false
faqs:
  - question: "What are quantum computers used for right now?"
    answer: "Today, researchers use quantum computers primarily to simulate molecular interactions for clean energy materials, screen drug candidates for toxicity, and test foundational quantum physics models. They also serve as testbeds for developing quantum-resistant encryption algorithms before fault-tolerant hardware arrives."
  - question: "Can quantum computers break current internet encryption?"
    answer: "A sufficiently large quantum computer running Shor's algorithm can factor large prime products, threatening protocols like RSA-2048 and elliptic-curve cryptography used in cryptocurrencies. Hardware still requires significant error correction before reaching the scale needed for such attacks."
  - question: "Why can't classical computers perform the same tasks?"
    answer: "Classical processors face exponential performance penalties when attempting to simulate atomic-level quantum interactions with exact precision. Quantum processors map these interactions directly onto qubits, eliminating the need for mathematical approximations."
---

Quantum computers are designed to solve computational problems that scale exponentially beyond the reach of classical supercomputers. Instead of executing everyday office software or streaming media, these machines simulate subatomic physics, model complex molecular bonds for clean energy and pharmaceuticals, and calculate mathematical factorizations that underpin global cybersecurity. They perform these specialized workloads by using quantum mechanical states to evaluate vast mathematical solution spaces simultaneously.

The tech industry spent years treating quantum utility as a distant theoretical checkpoint. That complacency is disappearing. Hardware engineers and algorithmic researchers have slashed the resource requirements for practical quantum advantage at an unexpected rate. Understanding what is quantum computing used for today requires looking past generic promises of speed and examining the exact workloads where classical physics fails.

## Key Takeaways
* Quantum processors excel at native physical simulations, letting researchers calculate atomic behavior in batteries, catalysts, and pharmaceuticals without compromising approximations.
* Algorithmic improvements have dramatically lowered hardware requirements; cracking RSA-2048 encryption dropped from an estimated 20 million qubits in 2019 to just 100,000 qubits by February 2026.
* Practical deployment hinges on error correction, where systems combine multiple physical qubits into stabilized logical units to prevent thermal noise from destroying calculations.
* The transition window to post-quantum cryptography is narrowing rapidly, with tech leaders urging migration by 2029 and government mandates targeting 2035.

## Technical Breakdown: What Quantum Computing Is Used For
Standard computers process information through transistors that switch electrical currents on or off, encoding data as binary ones and zeros. Quantum machines operate on physical quantum bits, or qubits, which exploit wave-like states. Instead of resting strictly at zero or one, a qubit can occupy any linear combination across a continuous vector space, functioning much like a compass needle pointing in any diagonal direction. This mathematical property allows quantum algorithms to evaluate vast combinations of variables without checking every option sequentially. To explore these baseline mechanics further, see [how does superposition work in quantum computing](/video/quantum-leap-separating-hype-from-reality-in-the-next-computing).

In 1981, physicist Richard Feynman laid the groundwork for this paradigm when evaluating the limits of conventional simulation. He observed: "Let the computer itself be built of quantum mechanical elements which obey quantum mechanical laws." Classical computers pay an exponential computational penalty whenever they calculate the quantum correlations of multi-atom systems. A quantum machine avoids this penalty entirely because its physical architecture mirrors the subatomic interactions it attempts to calculate.

Building hardware that maintains these states requires extreme environments. At laboratory facilities like [Quantum Motion](https://quantummotion.com/) in London, engineers house quantum chips inside multi-stage dilution refrigerators. These golden chandelier structures cool the processor core down to a few tens of millikelvin. Quantum states exist at minute energy scales. Without extreme refrigeration, ambient thermal noise disrupts the delicate state vector, destroying computational data before the algorithm completes.

Error suppression remains the defining technical challenge. Early quantum prototypes accumulated noise so quickly that calculations decayed into gibberish. Engineers counter this with quantum error correction, combining physical qubits into single, fault-tolerant logical units. Researchers at the International Quantum Academy in China demonstrated that pairing two superconducting qubits with a microscopic resonator creates a larger qubit that not only generates fewer errors but also automatically flags when a fault occurs. Similarly, Google Quantum AI demonstrated with its Willow processor that scaling the physical qubit count within specific architectures suppresses net error rates rather than amplifying them.

## Why This Matters: From Molecular Discovery to Q-Day
The primary commercial value of quantum computing lies in chemistry and materials science. Developing advanced solid-state batteries, efficient solar cells, and synthetic catalysts requires testing how electrons transfer between molecules. Classical supercomputers rely on mathematical approximations that often miss critical chemical behaviors. Quantum algorithms allow scientists to screen hundreds of candidate materials virtually, bypassing years of trial-and-error laboratory synthesis. 

Startups are already accelerating this pipeline. In 2024, the quantum algorithm firm [Phasecraft](https://www.phasecraft.io/), co-founded by Ashley Montanaro, published a modeling technique that makes quantum simulations of materials run a million times faster. Similar algorithmic methods are applied to pharmaceutical pipelines, where processors model how candidate compounds bind to biological receptor targets and predict cellular toxicity before clinical trials begin. Particle physicists have even utilized quantum processors to observe virtual particles emerging from empty space, testing theoretical physics concepts that conventional computing cannot resolve.

Yet the capability that drives government investment is cryptographic disruption. Modern financial transactions, authenticated communications, and public-key infrastructure depend on asymmetrical mathematical problems. The RSA algorithm, for example, relies on prime factorization. Multiplying the prime numbers 101 and 103 produces 10,403 in milliseconds, but reversing that calculation from scratch on massive keys requires extraordinary classical processing time. In 1994, mathematician Peter Shor formulated an algorithm that allows a fault-tolerant quantum computer to find large prime factors in polynomial time.

This mathematical capability creates the threat known as "Q-Day"—the moment quantum hardware achieves the scale needed to dismantle standard public-key cryptography. As [New Scientist](https://shop.newscientist.com/) points out, Q-Day represents the point where encrypted bank transactions, corporate data, and state communications become vulnerable to decryption in real time. Intelligence agencies already engage in "harvest now, decrypt later" strategies, intercepting encrypted network traffic today to unpack it once quantum processors mature.

Hardware thresholds for this attack vector are collapsing. In 2019, security analysts calculated that cracking an RSA-2048 key required a machine with 20 million physical qubits. By February 2026, algorithmic optimization slashed that projection to 100,000 qubits. A month later, another research group proposed an architecture requiring just 10,000 qubits. Google Quantum AI demonstrated that a machine with 500,000 qubits could compromise the elliptic-curve algorithms protecting cryptocurrency networks in as little as 9 minutes, creating a window where malicious actors could alter a transaction between broadcast and block validation.

Understanding the difference between these specialized machines and standard infrastructure is essential; an analysis of [how is quantum computing different from classical computing](/video/how-is-quantum-computing-different-from-classical-computing) highlights why they complement rather than replace enterprise mainframes.

## What Others Missed: The Gap Between Lab Arrays and Utility
Market commentary frequently confuses raw qubit volume with practical computational capacity. A processor boasting thousands of physical qubits may accomplish less than a stabilized 50-qubit system if the error rates remain uncorrected. Today, the largest experimental qubit array contains 6,100 qubits, yet it has not run production-grade computational workloads. High qubit counts generate impressive headlines, but without error-mitigation thresholds, raw gate numbers provide little industrial value.

Rigorous proofs of advantage are emerging. At the University of Texas at Austin, researchers operated a 12-qubit system to complete a calculation requiring nearly 30 times more classical computational capacity, proving mathematically that an equivalent classical system would demand 330 bits. While this demonstrated mathematically verified quantum advantage, running abstract mathematical proofs differs from achieving everyday commercial utility.

The hardware ecosystem is also splintering across competing physical implementations. Startups like Dutch manufacturer Quantware plan to deliver a 10,000-qubit processor architecture within 2 1/2 years using integrated silicon chips. Competing firms like QuEra target 10,000 qubits within one year using neutral atom arrays trapped by lasers. Each architecture presents distinct trade-offs between physical gate speed, thermal refrigeration costs, physical footprint, and logical error suppression. For an examination of alternative physical substrates, read whether [are qubits made of nanowires in quantum computing](/video/are-qubits-made-of-nanowires-in-quantum-computing).

Meanwhile, the timeline for defending critical infrastructure has shortened dramatically. Global investment in the quantum computing sector is projected to expand from $1.07 billion in 2024 to approximately $2.2 billion by 2027. This influx of capital has accelerated post-quantum migration mandates. Google has urged organizations to implement post-quantum cryptographic standards by 2029. Across federal networks, the National Institute of Standards and Technology (NIST) has published quantum-resistant algorithms, with US federal agencies operating under a strict deadline to migrate systems by 2035.

## The Verdict
Quantum computing is not a speculative physics experiment or a universal replacement for everyday microprocessors. It is a specialized, disruptive compute platform built for native physical simulation and complex mathematical factorization. While hardware engineers still battle thermal noise and fault limits, the dramatic compression of qubit requirements proves that functional quantum utility is approaching much faster than early projections indicated. Organizations managing long-lifecycle data or energy research must treat quantum readiness as an active operational requirement rather than a long-term theoretical prospect.
