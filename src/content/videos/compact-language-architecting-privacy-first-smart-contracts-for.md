---
title: "Can Compact Language Build Private Smart Contracts Midnight ZK?"
titleShortened: true
seoTitled: true
youtubeId: "QWEtUJ2ymB0"
channelTitle: "Midnight"
channelId: "UCy3oZ64F3FOtjZ5sZGQNgkA"
publishedAt: "2024-08-20T17:00:06Z"
date: "2026-07-13"
tags:
  - "Coding"
  - "Crypto"
summary: "Compact is a domain-specific programming language for the Midnight Network, designed to facilitate the creation of privacy-preserving smart contracts. Built on a restricted subset of Typescript, it allows developers to build decentralized applications leveraging zero-knowledge proofs (ZKPs) without direct interaction with complex ZKP circuits. This approach aims to enhance developer experience while enabling verifiable computation over private data, a critical feature for various Web3 applications demanding confidentiality."
metaDescription: "Compact is a domain-specific programming language for the Midnight Network, designed to facilitate the creation of privacy-preserving smart contracts."
duration: "23:01"
viewCount: 1183
viewsUpdated: "2026-09-16"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What is Compact language?"
    answer: "Compact is a domain-specific programming language for the Midnight Network, designed to create privacy-preserving smart contracts. It is based on a restricted subset of TypeScript, allowing developers to build decentralized applications that leverage zero-knowledge proofs without needing to understand the complex ZKP circuits directly."
  - question: "Why does Midnight use its own language instead of an existing one?"
    answer: "Midnight requires a language that can support both on-chain execution and the generation of zero-knowledge proofs over private data. These specific requirements impose restrictions on language features, making a tailored domain-specific language like Compact necessary to ensure compatibility and abstract away ZKP complexity for developers."
  - question: "How does Compact handle private data in smart contracts?"
    answer: "Compact contracts execute in three stages: locally on the user's device (with access to private data), on a proof server (to generate a zero-knowledge proof that verifies computation without revealing private data), and finally on the Midnight chain (to verify the public aspects and the ZKP). This multi-stage process ensures data privacy while maintaining verifiability."
  - question: "What is the developer experience like for someone coming from TypeScript?"
    answer: "Compact is designed to be readable and familiar to TypeScript developers, aiming for a non-jarring experience when switching between the two. While the syntax is similar, developers still need to learn the specific concepts of smart contract development and zero-knowledge proofs, which Compact abstracts but does not eliminate."
rewrittenAt: "2026-08-17"
---

Compact is a specialized programming language designed for the Midnight Network, specifically tailored for creating smart contracts that prioritize data privacy. Built upon a carefully chosen subset of TypeScript, it aims to make the development of decentralized applications (dApps) more accessible, particularly for those leveraging zero-knowledge proofs (ZKPs) without needing to engage directly with their intricate underlying circuits. This approach allows developers to build verifiable computations over private data, a fundamental requirement for many Web3 applications demanding confidentiality.

## The Need for a Domain-Specific Language

While many established programming languages exist, Midnight's unique requirements for privacy-preserving smart contracts necessitated the creation of Compact, a domain-specific language (DSL). Unlike general-purpose languages, Compact is narrowly focused on the specific task of writing contracts that can both execute on-chain and generate zero-knowledge proofs off-chain. This dual requirement imposes significant constraints on what language features can be supported.

The design philosophy behind Compact was not to strip features from TypeScript, but rather to selectively add capabilities that align with the needs of ZKP-compatible smart contracts. The goal was to ensure that the language remains familiar and readable to developers accustomed to TypeScript, minimizing the learning curve and making the transition between writing standard TypeScript code and Compact contracts less jarring. This focus on developer experience is paramount, acknowledging that language adoption is often driven by usability as much as by technical merit.

## The Unique Execution Model for ZK Contracts

Developing dApps on Midnight introduces a distinct execution paradigm compared to traditional blockchains like Cardano or Ethereum. In those environments, developers typically deal with two types of code: on-chain code (the contract) and off-chain code (client-side logic). All data manipulated by on-chain contracts is public and visible. Midnight, however, introduces a critical third dimension: the distinction between public and private data.

This distinction necessitates a unique three-stage execution model for Compact contracts:

1. **Local Execution:** The contract code first runs locally on the dApp user's device. At this stage, it has full access to the user's private data. During this local run, the system begins to construct "partial proof data," which includes inputs, outputs, and any private data involved. It also generates the bytecode for the on-chain virtual machine.
2. **Proof Generation:** The partial proof data is then sent to a proof server. This server's role is to construct a zero-knowledge proof. This proof verifies that the contract executed correctly with certain inputs and produced specific outputs, and that there *existed* private data consistent with this execution, without ever revealing the actual private data itself. This process involves translating the contract logic into a highly complex Zero Knowledge Intermediate representation (ZKI), which is not intended for human developers to write or interact with directly.
3. **On-chain Verification:** Finally, the contract is executed on the Midnight chain. Here, the network's nodes run a specialized on-chain virtual machine called Impact, which processes the bytecode generated during the local execution. At this stage, there is no access to private data; the chain merely verifies the public aspects of the transaction and the validity of the ZKP.

Each of these three execution stages uses a different program representation: JavaScript for local execution, ZKI for proof generation, and Impact VM bytecode for on-chain execution. This complex orchestration is entirely abstracted away by the Compact compiler, allowing developers to focus on the contract's logic rather than the underlying ZKP mechanics.

## Building Privacy Contracts: A Practical Look

To illustrate how Compact functions, consider a simple bulletin board dApp. In this scenario, users can post messages, and only the original poster can remove their message, while everyone can view it. A core component of such a contract might be a "post circuit," which is a provable segment of the contract logic.

Within this `post` circuit, the contract might first assert that the bulletin board's public state is empty. If true, it proceeds to a computation involving private data, such as a `local secret key`. This secret key acts as a "witness" to the transaction. The contract then writes public information, like the user's public key and the message, to the public ledger, and updates the board's state.

During the local execution phase, developers can inspect the process using standard debugging tools. For instance, a debugger would show the `context` containing the private state, such as a secret key represented as an array of 32 bytes. It would also reveal the "partial proof data," which includes the message as an input and, critically, the secret key added to the "private transcript outputs" after the line of code that accesses it. This private transcript data is what will be sent to the proof server.

The ZKI, the intermediate representation used by the proof server, is a complex JSON object that no developer is expected to write manually. It is automatically generated by the Compact compiler. Similarly, the Impact VM code, which runs on-chain, is also generated automatically. For a simple circuit, this might involve around 14 instructions for the stack-based Impact VM, including operations like `dupe` (duplicate), `index` (access an element on the stack), and `pop` (remove from stack). This underlying complexity is deliberately hidden from the developer, allowing them to focus on the higher-level contract logic.

## Developer Experience and Future Directions

While Compact is designed to be familiar to TypeScript developers, it's important to recognize that writing smart contracts, especially those involving private data and ZKPs, introduces new concepts. Developers still need to understand the unique aspects of the smart contract world, and comprehensive documentation is essential to bridge this knowledge gap. The primary benefit of Compact is its ability to abstract away the formidable complexity of zero-knowledge proofs, enabling a broader range of developers to build privacy-preserving dApps.

Midnight and Compact are still evolving, with ongoing efforts to refine the language and tooling. One immediate focus is to further align Compact's syntax with standard TypeScript conventions. For example, Compact currently uses square brackets for generic type parameters, whereas TypeScript uses angle brackets. Future updates will introduce breaking changes to adopt angle brackets, aiming to reduce cognitive load for developers switching between contexts. Similarly, Compact's concept of `null`, which differs from TypeScript's `null`, will be renamed to `default` to avoid confusion. These adjustments are part of a continuous effort to enhance the developer experience and make Compact as intuitive as possible. Developers are encouraged to provide feedback through channels like the Discord Dev corner to help shape the language's future.
