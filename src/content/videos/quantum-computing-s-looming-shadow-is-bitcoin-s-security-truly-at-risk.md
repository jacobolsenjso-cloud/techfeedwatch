---
title: "Shor's Algorithm: Quantum Threat to Bitcoin's Cryptography"
seoTitled: true
youtubeId: "Ph5ihHhx_rQ"
channelTitle: "Coin Bureau"
channelId: "UCqK_GSMbpiV8spgD3ZGloSw"
publishedAt: "2025-12-21T12:45:11Z"
date: "2026-07-25"
tags:
  - "Quantum Computing"
  - "Crypto"
summary: "The emergence of quantum computing capabilities introduces theoretical threats to the cryptographic foundations underpinning major blockchain networks like Bitcoin. While not an immediate danger, the potential for advanced algorithms like Shor's to compromise public-key cryptography demands serious consideration and proactive development from the crypto community. Understanding the distinction between encryption and digital signatures is crucial for assessing the true extent of this long-term challenge."
duration: "20:41"
viewCount: 40754
viewsUpdated: "2026-08-19"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "Is Bitcoin immediately vulnerable to quantum computer attacks?"
    answer: "No, Bitcoin is not immediately vulnerable. Experts suggest that a cryptographically relevant quantum computer, capable of breaking current cryptography, is a decade or more away. Current quantum machines lack the necessary reliability and scale to pose an immediate threat."
  - question: "What is the main risk quantum computing poses to Bitcoin?"
    answer: "The main risk to Bitcoin comes from the potential for quantum computers to forge digital signatures. This could allow attackers to spend coins from addresses where the public key is already visible or to intercept transactions in the mempool to steal funds before they are confirmed."
  - question: "Will quantum computers be able to decrypt past Bitcoin transactions?"
    answer: "No, quantum computers will not be able to decrypt past Bitcoin transactions. The Bitcoin ledger is already public, meaning all transaction details are openly readable. The threat is not about revealing hidden information, but about forging new signatures or deriving private keys from public keys in the future."
  - question: "What are blockchains doing to prepare for quantum computing?"
    answer: "Blockchains are advised to start planning for post-quantum signatures, but not to rush implementation due to the complexities and potential risks of new schemes. This includes preparing migration paths for new signature types, ensuring wallet and exchange support, and considering how users will move funds to quantum-safe addresses."
rewrittenAt: "2026-08-18"
---

Quantum computing presents a theoretical future threat to the security of Bitcoin and other blockchain networks. This risk primarily targets the cryptographic digital signatures that prove ownership and authorize transactions, rather than the underlying encryption of data or the mining process itself. While a powerful quantum computer capable of breaking current cryptography is not an immediate concern, understanding this distinction is key to assessing the challenge.

## The Quantum Threat and Its Timeline

The concept of a cryptographically relevant quantum computer, or CRQC, describes a machine powerful enough to threaten existing cryptographic keys. Such a computer would need to be fault-tolerant and error-corrected, running complex algorithms at a scale far beyond what is currently available. Many headlines about quantum computing advancements refer to physical qubits, which are raw and prone to errors. Breaking crypto requires logical qubits, which are reliable and built from many physical qubits with error correction.

Current public roadmaps for quantum computing focus on making system performance reliable, not on cracking cryptographic keys. For example, IBM's roadmap discusses hundreds of reliable qubits, which is impressive engineering. However, it is still far from the thousands of accurate, stable qubits needed for practical cryptanalysis. Experts suggest that fears of Bitcoin's core cryptography being practically breakable in the next five years are not supported by current public knowledge. Even a 10-year window is considered an aggressive estimate. A more realistic timeline for a major threat is a decade or more.

## Encryption Versus Digital Signatures

It is important to distinguish between encryption and digital signatures when considering quantum threats. Encryption is about keeping information secret. If data is encrypted today and stored, a powerful quantum computer in the future could potentially decrypt it. This is known as a "harvest now, decrypt later" (HNDL) attack. Such attacks are a concern for sensitive data that needs to remain confidential for decades, like government communications, medical records, or corporate secrets. Governments and major internet companies are already addressing this by deploying hybrid encryption methods that combine current and post-quantum techniques.

Digital signatures, however, function differently. They prove authenticity and ownership, such as verifying who is authorized to move funds on a blockchain. There is no secret message hidden within a signature that a future quantum computer could reveal. The risk to digital signatures is forward-looking: if a CRQC exists, it could allow attackers to forge new signatures or derive private keys from public keys from that point onward. Signatures created before such a machine existed would not suddenly become compromised retroactively. Therefore, HNDL attacks are primarily an encryption problem, not a signature problem.

## Quantum Computing and Blockchain Ledgers

Most blockchain ledgers are not exposed to HNDL attacks. The information on these chains is already public and readable by anyone. A quantum computer would not "decrypt" Bitcoin in the sense of revealing hidden secrets on the chain. Instead, it would change what attackers might be able to do in the future, primarily by forging signatures.

An exception to this is privacy-focused blockchain technology that relies on encryption to keep transaction details hidden. If encrypted transaction data is stored on-chain, it could be harvested now and potentially decrypted later by a CRQC. Protocols that promise perpetual privacy for transactions need to be especially aware of quantum computing developments. For most other blockchains, the message is reassuring: quantum computing is not guaranteed to unravel blockchain ledgers or doom the industry. Crypto assets can have a future even in a quantum computing world.

## Bitcoin's Specific Challenges

Despite the general optimism, Bitcoin faces particular challenges in a quantum-enabled future, mainly due to its governance structure and how its transactions work.

One major issue is governance speed. Any major upgrade to the Bitcoin network, such as a shift to quantum-safe addresses, requires broad consensus among wallets, exchanges, miners, and node runners. This process is not automatic; users would need to move their coins to new addresses themselves. This slow coordination could create vulnerabilities.

Certain types of Bitcoin outputs are more exposed because their public key is visible on the chain from day one. This includes some very early transaction types, anyone who reuses Bitcoin addresses, and some newer formats. This visibility could allow a CRQC to derive the private key.

Another concern is the "race scenario" during transactions. When a Bitcoin transaction is broadcast, it often reveals the public key and then waits in the mempool before a miner confirms it. In a world with a powerful quantum computer, an attacker could potentially derive the private key very quickly and broadcast a conflicting transaction, aiming to steal funds. Such attacks might initially target large holders.

The issue of abandoned coins also poses a problem. Many Bitcoin holdings have not moved in years due to lost keys or forgotten wallets. If Bitcoin transitions to a new quantum-safe format, decisions would need to be made about these dormant coins. Options like freezing them, allowing them to be swept by quantum-capable entities, or destroying them all carry major trade-offs.

It is important to note that the primary quantum threat to Bitcoin targets its digital signatures, not its proof-of-work mining system. Mining relies on hashing, where quantum computers offer only a limited theoretical advantage. Even if large miners gained a quantum edge, it would likely shift who wins blocks rather than collapse Bitcoin's security model.

## The Difficulties of Post-Quantum Signatures

Transitioning to post-quantum signatures is not a simple upgrade. These new signing methods come with practical challenges and trade-offs. Rushing this migration with overconfidence could lead to new vulnerabilities or break existing systems. Digital signatures are basic to crypto, used in every transaction, validator message, and multisig approval. Changing them affects fees, node costs, and the rules of the entire system.

One major trade-off is size. Most post-quantum signatures and keys are larger than current ones. Bigger signatures mean bigger transactions, which can lead to higher fees, increased bandwidth and storage requirements, slower syncing for nodes, and potentially more pressure on smaller network participants. This could push networks towards more centralized infrastructure.

Another challenge is risk. Post-quantum schemes are newer, and their real-world failure modes are still being discovered. Some previously promising designs have already been broken. A hasty choice of the wrong scheme could lead to disaster for a blockchain.

And, many existing crypto systems bundle multiple signatures into one to save space, such as Ethereum's validator system. Many quantum-resistant signature options do not combine as neatly. Developers might need to use larger messages for the same level of safety or redesign how multisig wallets and validator voting work. Developers must be careful in how they develop and setup quantum-resistant solutions, despite the time pressure.

## Recommendations for a Quantum-Resistant Future

To prepare for a post-quantum world, several recommendations emerge, emphasizing a serious but measured approach. The goal is not to rush into solutions before 2030, but to plan carefully to avoid creating worse problems.

First, hybrid encryption should be deployed immediately wherever long-term confidentiality is important and costs are manageable. This involves using both current and post-quantum encryption methods together, providing protection even if one method proves weaker than expected. This directly addresses HNDL risks, where attackers might store encrypted data now for future decryption. Major internet infrastructure providers are already moving in this direction.

Second, hybrid hash-based signatures are recommended for situations where their larger size is acceptable, particularly for software and firmware updates. This ensures that the update pipeline remains trustworthy in the future. A secure update mechanism is essential for distributing urgent post-quantum fixes if they become necessary.

Third, blockchains should begin planning for post-quantum signatures now, but avoid rushing their setup. The migration path needs to be prepared early, including how new signature types will be added, how wallets and exchanges will support them, and how users will smoothly move funds over time. This is especially urgent for chains like Bitcoin, where coordination is slow and dormant funds need protection.

Fourth, privacy-focused blockchains should treat this issue with greater urgency. If a chain's core promise is transaction privacy, then encrypted data stored on-chain is exactly what attackers could harvest now and decrypt later. These protocols should consider hybrid designs or basic changes to avoid placing decryptable secrets on-chain.

Fifth, prioritizing setup security over quantum mitigation in the near term is important. Bugs and setup errors pose a more immediate threat than quantum computers. Post-quantum schemes can be complex to setup safely. Developers should focus on thorough audits, formal verification, and layered security to prevent single mistakes from leading to total loss.

Sixth, sustained investment in quantum computing development and talent is vital. This is a matter of national security, as the first major adversary to gain CRQC capability could threaten all systems relying on current public-key cryptography. Investment in research centers and training is imperative.

Finally, it is important to maintain a level-headed perspective when new quantum computing milestones are announced. Many headlines are designed to attract attention and often overstate the immediate threat. A balanced understanding of the actual risks and timelines is essential.
