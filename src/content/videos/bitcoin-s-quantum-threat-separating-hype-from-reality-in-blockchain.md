---
title: "How Does Quantum Computing Threaten Bitcoin's Security"
targetQuestion: "how does quantum computing threaten bitcoin's security"
titleShortened: true
seoTitled: true
youtubeId: "kLV2Cqsahbw"
channelTitle: "Coin Bureau"
channelId: "UCqK_GSMbpiV8spgD3ZGloSw"
publishedAt: "2026-03-24T14:01:07Z"
date: "2026-07-25"
tags:
  - "Quantum Computing"
  - "Crypto"
summary: "The long-term security of Bitcoin faces a theoretical challenge from quantum computing, which could potentially undermine its foundational cryptography. While 'Q-Day'—a sudden, catastrophic breach—is deemed unlikely by recent analyses, the gradual advancement of quantum technology necessitates proactive defense strategies. Ongoing research and development in post-quantum cryptography (PQC) aim to secure not just Bitcoin, but all digital encryption, well before quantum computers reach critical capabilities. The core issue lies in Bitcoin's elliptic curve cryptography being vulnerable, contrasting with its more quantum-resistant hashing functions."
metaDescription: "The long-term security of Bitcoin faces a theoretical challenge from quantum computing, which could potentially undermine its foundational cryptography."
duration: "25:42"
viewCount: 17338
viewsUpdated: "2026-09-07"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "Is Bitcoin currently vulnerable to quantum attacks?"
    answer: "No, Bitcoin is not currently vulnerable to quantum attacks. While its elliptic curve cryptography is theoretically susceptible to future quantum computers, current quantum technology is not advanced enough to break modern encryption."
  - question: "What parts of Bitcoin are most at risk from quantum computers?"
    answer: "The elliptic curve cryptography used for securing Bitcoin ownership and spending (wallet addresses) is the most vulnerable part. Bitcoin's hashing functions, used for mining and transaction ordering, are considered more resistant."
  - question: "How much Bitcoin is currently at risk from future quantum attacks?"
    answer: "Approximately 35% of Bitcoin's total supply is considered at risk, including around 1.7 million BTC considered lost and another 5.2 million BTC held in older, quantum-vulnerable wallet addresses. Users can move their BTC to newer, quantum-resistant addresses to mitigate this risk."
  - question: "What is being done to protect Bitcoin from quantum computers?"
    answer: "Researchers are actively developing post-quantum cryptography (PQC) solutions, which are already being integrated into other digital infrastructure. The Bitcoin community is also exploring PQC implementations, though integrating them into Bitcoin's core protocol presents unique challenges due to its design and consensus requirements."
rewrittenAt: "2026-08-17"
---

Bitcoin's long-term security faces a theoretical challenge from quantum computing, which could potentially undermine its foundational cryptography. While its hashing functions, used for securing mining and transaction ordering, are considered relatively quantum resistant, the elliptic curve cryptography that protects Bitcoin ownership and spending is vulnerable to future quantum attacks. This means that while Bitcoin is not currently at immediate risk, proactive measures are necessary to ensure its security against advanced quantum computers.

## Understanding the Quantum Threat to Digital Encryption

Quantum computers operate on principles fundamentally different from classical computers. Instead of traditional bits that represent information as either a one or a zero, quantum computers use qubits, which can exist as a one, a zero, or both simultaneously. This capability grants quantum computers exponential computational power, enabling them to solve complex algorithms and break encryption methods that are currently considered secure. The threat extends far beyond Bitcoin, endangering all forms of digital encryption, including those protecting emails, cloud infrastructure, digital banking, and the internet itself.

For Bitcoin specifically, the network relies on two primary cryptographic methods. Hash functions are used for securing the blockchain's integrity, linking blocks, and ordering transactions. These are generally seen as more resilient to quantum attacks. However, elliptic curve cryptography (ECC) is used to generate digital signatures, which verify ownership and authorize the spending of Bitcoin (BTC) from wallets. It is this ECC component that is susceptible to quantum algorithms, posing a significant risk to the security of individual Bitcoin holdings.

## The Gradual Advancement of Quantum Capabilities

The idea of a sudden "Q-Day," where quantum computers instantly break Bitcoin's encryption, is largely considered unlikely by experts. Instead, quantum technology is expected to advance gradually, much like other major technological developments. This gradual progression provides a window for the Bitcoin community and the broader digital world to prepare and implement defenses.

Researchers have outlined potential stages of quantum development, each with different implications for Bitcoin:
*   **Stage Zero:** Current quantum computers, known as noisy intermediate-scale quantum (NISQ) machines, are not yet commercially viable or capable of outperforming classical computers for everyday tasks. Hundreds of these exist in research labs, with the best achieving almost 100 logical qubits and a logical depth of around 65. They are primarily used for studying quantum computing itself.
*   **Stage One:** Quantum computers become commercially viable, marked by milestones such as reliably running 100 logical qubits, producing useful results beyond quantum studies, and companies turning a profit from the technology.
*   **Stage Two:** Cryptographically relevant quantum computers (CRQCs) emerge, capable of breaking outdated cryptography. These simpler CRQCs would likely first target legacy systems, potentially using "harvest now, decrypt later" strategies.
*   **Stage Three:** CRQCs become powerful enough to slowly break Bitcoin's cryptography. At this stage, only one vulnerable address could be targeted at a time. Bitcoin addresses created before 2011, using the older P2PK format, are particularly vulnerable. Approximately 1.7 million BTC considered lost and another 5.2 million BTC in vulnerable addresses are at risk, representing about 35% of Bitcoin's total supply. Even if breaking a single key took an hour, cracking all 22,000 wallets holding the roughly 1.1 million BTC mined by Satoshi Nakamoto (each around 50 BTC) would take over 3 years.
*   **Stage Four:** CRQCs can break Bitcoin's cryptography rapidly, potentially in minutes or less. At this point, all quantum-vulnerable BTC could be stolen within weeks or days. Even pending transactions could be at risk if elliptic curve cryptography can be broken in under 10 minutes, the average block production time.

While the exact timeline for these stages is uncertain, some predictions suggest CRQCs could crack Bitcoin by 2030, with a general consensus among institutions pointing to the mid-2030s. The cost of such attacks is also a factor; in 2023, breaking a single Bitcoin key was estimated to cost around $100,000 in electricity alone, though these costs are expected to fall as technology advances.

## The Race to Post-Quantum Cryptography (PQC)

Fortunately, the development of post-quantum cryptography (PQC) is already well underway and, in many respects, years ahead of current quantum computer capabilities. Researchers began working on PQC after Shor's algorithm demonstrated the theoretical vulnerability of current encryption to quantum attacks. In 2024, two strong signature schemes were rigorously tested and standardized, providing confidence in the active preparation for a post-quantum future.

PQC is rapidly being integrated into core internet infrastructure. Modern protocols like OpenSSH and OpenSSL now include PQC by default, and major web platforms have adopted these measures, meaning a large share of global internet traffic is already protected against future quantum threats. For the crypto ecosystem, entities like Coinbase, the Ethereum Foundation, and Strategy have launched initiatives and advisory boards focused on quantum security.

## Challenges of Integrating PQC into Bitcoin

Upgrading the Bitcoin network to use PQC at the consensus level presents unique challenges compared to traditional internet applications. Bitcoin's blockchain storage and script computing are costly and limited, meaning any PQC solution must be highly resource-efficient. Implementations need to integrate seamlessly with existing tools like HD wallets and hardware devices.

Furthermore, making changes to Bitcoin's core protocol, even through soft forks, can create friction among developers, miners, and investors due to the community's sensitivity to updates. As a result, no PQC implementation or Bitcoin Improvement Proposal (BIP) has yet gained full consensus, largely due to trade-offs in speed, complexity, key and signature size, and statefulness. Hash-based signatures have been highlighted as a promising approach since Bitcoin already relies on hash functions, but this is still a subject of ongoing debate.

Rushing PQC deployment carries risks, as Bitcoin is not easily updated like other software. Introducing bugs or weakening functionality could lead to costly fixes, setbacks, and even chain splits. Another controversial aspect is what to do about the significant amount of BTC that might remain in quantum-vulnerable addresses even after a PQC upgrade. Proposals range from permanently freezing or burning this BTC after a grace period for users to move their assets, to simply doing nothing and accepting the risks as part of Bitcoin's ethos of self-sovereignty. This debate highlights the complex balance between security and the network's core principles.

## Future Scenarios and Preparedness

Experts envision several plausible scenarios for the quantum threat to Bitcoin:

*   **Pessimistic Scenario:** Quantum computing advances rapidly, potentially accelerated by AI. In this case, the Bitcoin ecosystem might be underprepared, leading to a scramble for quick fixes. While this could disrupt financial services and introduce bugs, Bitcoin would likely continue functioning, and market forces would support the most effective quantum-safe soft fork.
*   **Optimistic Scenario:** Quantum technology encounters unexpected roadblocks, leading to a "quantum winter" where investment slows. This would give Bitcoin developers decades to implement a carefully considered PQC solution.
*   **Middle-Ground Scenario:** Quantum computing progresses steadily, allowing for a timely and well-planned PQC transition. This scenario would see a gradual adoption of new quantum-safe address types, with most Bitcoin holders migrating their funds.

Regardless of the exact timeline, proactive measures are already underway. The existence of PQC solutions years ahead of critical quantum capabilities, coupled with ongoing research and development, suggests that the Bitcoin community is actively preparing for this long-term challenge. The key lies in achieving consensus on the most effective and least disruptive PQC implementation well before quantum computers reach the capabilities to pose a widespread threat.
