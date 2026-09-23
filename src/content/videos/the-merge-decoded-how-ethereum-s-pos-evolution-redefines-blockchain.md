---
title: "How the Ethereum Merge Improves Security and Energy"
seoTitled: true
youtubeId: "8-czXYEpqvE"
channelTitle: "Proof Of Tech"
channelId: "UC6CwNfFy2lMLCLbgZDxPjig"
publishedAt: "2026-07-15T22:44:07Z"
date: "2026-07-15"
tags:
  - "Crypto"
summary: "Ethereum fundamentally altered its operational backbone in September 2022, shifting from a power-intensive Proof of Work (PoW) consensus mechanism to an energy-efficient Proof of Stake (PoS) system through an event known as The Merge. This complex transition replaced miners with validators who stake ETH to secure the network, significantly reducing its environmental footprint and changing its economic model. While enhancing sustainability and security, The Merge did not directly improve transaction speed or lower gas fees, deferring these challenges to subsequent scaling solutions like Layer 2 networks."
metaDescription: "Ethereum's September 2022 Merge replaced PoW miners with PoS validators, enhancing security and sustainability, but not speed or fees."
duration: "3:58"
viewCount: 1
viewsUpdated: "2026-08-06"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What was the primary purpose of The Merge?"
    answer: "The Merge fundamentally changed Ethereum's consensus mechanism from Proof of Work (PoW) to Proof of Stake (PoS). Its main goals were to significantly reduce the network's energy consumption and enhance its security model."
  - question: "How does Proof of Stake secure the Ethereum network?"
    answer: "In Proof of Stake, validators replace miners. They secure the network by staking 32 ETH as collateral, which can be lost if they act maliciously. Validators take turns proposing and confirming blocks, earning rewards for honest participation and facing penalties for rule violations."
  - question: "Did The Merge make Ethereum transactions faster or cheaper?"
    answer: "No, The Merge did not directly make Ethereum transactions faster or cheaper. Gas fees still depend on the demand for block space. These improvements are expected to come from subsequent scaling solutions, particularly Layer 2 networks, which process transactions off-chain."
  - question: "What are some potential concerns or trade-offs with Proof of Stake?"
    answer: "One concern is the potential for centralization, as large exchanges or staking providers could control a significant amount of staked ETH. Users participating in pooled staking also rely on additional third-party services."
rewrittenAt: "2026-08-19"
---

Ethereum underwent a foundational change in September 2022, transitioning its consensus mechanism from Proof of Work (PoW) to [Proof of Stake](/video/ethereum-s-evolving-architecture-powering-web3-s-future-beyond-2026/) (PoS) in an event known as The Merge. This shift aimed to significantly reduce the network's energy consumption and enhance its security model by replacing energy-intensive mining with a system of staked collateral. The transition altered how new blocks are added to the blockchain and how the network maintains agreement on its state.

## The Shift from Proof of Work to Proof of Stake

When Ethereum launched in 2015, it used a Proof of Work system, similar to Bitcoin. Under PoW, network security relied on miners. These miners used specialized computing hardware, often powerful graphics cards, to solve complex computational puzzles. They competed to be the first to find a solution. The winning miner proposed the next block of transactions and received ETH as a reward. Other nodes then verified this block. While effective at securing the network, this process demanded a significant amount of electricity. The continuous computational effort needed to mine new blocks led to high energy consumption, a growing concern for the network's environmental impact. Proof of Stake had been part of Ethereum's long-term vision for many years, offering a different approach to network security and consensus.

## The Merge: A Complex Transition

Changing the core consensus mechanism of a live network, one that already held valuable assets and applications, presented a significant technical challenge. Ethereum prepared for this by launching the Beacon Chain in December 2020. This chain ran the Proof of Stake mechanism in parallel with the existing Proof of Work network. It allowed developers to test validators and staking without affecting the main network, where ordinary transactions continued.

The actual Merge occurred in September 2022. At this point, Ethereum's execution layer, which manages accounts, [smart contracts](/video/unlocking-ethereum-s-power-your-first-smart-contract-with-solidity/), and transactions, connected with the Beacon Chain's Proof of Stake consensus mechanism. Mining operations ceased entirely. The network's transaction history and existing applications continued without interruption. Users did not need to swap their ETH for a new currency. The fundamental change was in how new blocks were created and verified.

## How Proof of Stake Secures the Network

Proof of Stake replaces miners with validators. To become a validator directly, an individual must deposit 32 ETH into a smart contract. This staked ETH acts as collateral, providing a financial incentive for validators to act honestly. For those with less than 32 ETH, smaller holders can participate by using staking pools or third-party staking services. However, these options can introduce additional risks related to custody and the smart contracts involved.

Validators take turns proposing new blocks of transactions. They also confirm blocks proposed by other validators, a process Ethereum calls "certifications." The protocol assigns these tasks randomly. Validators who perform their duties correctly earn rewards in ETH. If a validator goes offline, they might face minor penalties. More severe misconduct, such as attempting to sign conflicting versions of the blockchain, can lead to "slashing." Slashing destroys a portion of the validator's staked ETH and removes them from the network. This penalty is designed to deter malicious behavior and only applies to validators who actively try to break the rules.

## Enhanced Security and Sustainability

The Merge significantly altered the cost and feasibility of attacking the Ethereum network. In a Proof of Work system, a 51% attack requires an attacker to control more than half of the network's total mining power and electricity. This would mean acquiring vast amounts of mining hardware and consuming immense energy. In a Proof of Stake system, a 51% attack requires an attacker to control more than 51% of the total ETH staked by validators. While both types of attacks are difficult, the PoS model makes an attack more financially transparent and potentially easier to defend against. If an attacker's staked ETH is used to compromise the network, that stake can be slashed, making the attack incredibly costly and self-defeating.

Beyond security, the most immediate and widely recognized benefit of The Merge was its impact on sustainability. By eliminating the need for continuous, energy-intensive computational work from miners, Ethereum's electricity consumption dropped dramatically. This change also ended the periodic issuance of new ETH to Proof of Work miners, altering the network's economic model.

## What The Merge Did Not Change (and Future Scaling)

While The Merge brought fundamental changes to Ethereum's security and energy profile, it did not automatically make transactions cheaper or significantly increase the number of transactions the network could process. Transaction fees, often called gas fees, still depend on the demand for block space. When network activity is high, demand for block space increases, leading to higher fees.

Faster and less expensive activity typically comes from subsequent scaling solutions. These include Layer 2 networks, which process transactions off the main Ethereum chain and then post the results back to it. These Layer 2 solutions are designed to handle a large share of transactions, reducing congestion and costs on the main network. The Merge laid the groundwork for these future improvements by establishing a more efficient and secure base layer.

## Trade-offs and Centralization Concerns

Proof of Stake also comes with its own set of trade-offs and potential concerns. One area that requires monitoring is the concentration of staked ETH. Large cryptocurrency exchanges and staking service providers can accumulate and control significant amounts of staked ETH. While Ethereum's design encourages many independent validators, a high concentration of staked ETH in a few entities could raise concerns about decentralization. Users who participate in pooled or liquid staking often rely on additional companies or smart contracts, which introduce new layers of trust and potential risk.

It is also important to understand that owning ETH does not grant direct voting power over every change to Ethereum's software. Instead, developers propose upgrades to the network. Node operators then decide which software versions to run. Validators participate in the consensus process according to the rules defined by that software. Staking secures the production of new blocks and the integrity of the chain. It does not transform Ethereum into a simple shareholder voting system. The network still relies on thousands of independent participants to verify its operations, now with validators risking their ETH instead of miners expending electricity and computing power.
