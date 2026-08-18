---
title: "Ethereum Wallets: Accounts, Gas, & DeFi Interaction"
titleShortened: true
seoTitled: true
youtubeId: "qLZ1IoezucE"
channelTitle: "99Bitcoins"
channelId: "UCQQ_fGcMDxlKre3SEqEWrLA"
publishedAt: "2018-08-02T08:55:10Z"
date: "2026-07-20"
tags:
  - "Crypto"
  - "Fintech"
summary: "Ethereum operates on a distinct account and transaction model, differing significantly from simple value transfer systems like Bitcoin. Understanding Externally Owned Accounts (EOAs), Contract Accounts, and the nuanced role of Gas is fundamental for effective interaction with the network. Wallets serve as critical interfaces, managing private keys and facilitating not just Ether transfers but also complex smart contract executions. The inherent complexity of Ethereum's design underpins its capabilities as a decentralized computing platform."
duration: "13:02"
viewCount: 344374
viewsUpdated: "2026-08-16"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What is the difference between an EOA and a Contract Account?"
    answer: "An Externally Owned Account (EOA) is controlled by a private key held by a user and can initiate transactions. A Contract Account has code associated with it, is controlled by predefined triggers within that code, and does not have a private key."
  - question: "How is an Ethereum transaction fee calculated?"
    answer: "An Ethereum transaction fee is calculated by multiplying the amount of Gas used by the Gas Price. Gas measures the computational work required for the transaction, and the Gas Price is the cost per unit of Gas, which fluctuates with network congestion."
  - question: "What happens if an Ethereum transaction runs out of Gas?"
    answer: "If an Ethereum transaction runs out of Gas mid-operation, it will halt, and no Ether will be returned to the sender. The funds spent on Gas up to that point are not refunded, as the computational work was still attempted."
  - question: "What are the main types of Ethereum wallets?"
    answer: "Ethereum wallets include full clients (full nodes) that store the entire blockchain, light clients that rely on full nodes for data, and hardware wallets for secure offline storage. Full clients can deploy smart contracts, while hardware wallets mainly handle Ether and ERC-20 tokens."
rewrittenAt: "2026-08-18"
---

An Ethereum wallet is software or hardware that lets users interact with the Ethereum network. It securely holds your private key, a secret password giving you control over your digital assets. The wallet also provides a public Ethereum address, which allows others to send you Ether, Ethereum's native currency. Unlike simple systems for sending money, Ethereum wallets also help execute complex smart contracts.

### Understanding Ethereum Accounts

Ethereum uses two main types of accounts to manage its decentralized operations. Knowing these accounts helps explain how wallets function.

The first type is an Externally Owned Account (EOA). An EOA has an Ethereum address and is controlled by a private key. A person can create many EOAs. These accounts can send and receive Ether. They can also create new smart contracts and trigger existing ones.

The second type is a Contract Account. These accounts have code stored with them. Every smart contract launched on the Ethereum network gets its own unique Ethereum address. Unlike EOAs, a Contract Account does not have a private key. Instead, the code itself defines how the contract operates through predefined triggers. Once launched, contracts cannot be changed. This means the author must write the conditions very carefully. Contract Accounts can receive Ether. When triggered, they can also send Ether or even create other Contract Accounts.

### Transactions: The Language of Ethereum

Accounts on the Ethereum network communicate through messages. These messages are "wrapped" inside transactions. Users pay for these transactions with Ether. While Bitcoin transactions primarily transfer value, Ethereum transactions serve several purposes:

First, transactions move Ether between accounts. This is the most basic use. Second, transactions create new smart contracts. This happens when a transaction includes the contract's code. Third, transactions trigger existing contracts. For example, sending Ether to a contract address for an initial coin offering (ICO) activates that contract to send tokens back to you. Ethereum wallets are the tools that help users create and send these varied transactions.

### Navigating Ethereum Wallets: Types and Features

Ethereum wallets come in different forms, sometimes called clients or nodes. Some wallets only allow sending and receiving Ether. Other, more advanced wallets, known as "Smart contract wallets," also let users deploy or trigger contracts.

One type is a full client, or full node. A full node is a computer that stores the entire history of the Ethereum blockchain. Running a full node lets you verify all transactions on the network without trusting anyone else. However, it uses a lot of memory and computer power. Full nodes are vital to Ethereum because they execute contract code in a decentralized way. Geth, short for Go Ethereum, is the most popular full client, with 9713 nodes running it. Parity is another popular full client, with 4069 nodes. Mist provides an easy interface for non-technical users to interact with Geth. All full nodes are smart contract wallets.

If you do not want to run a full node, you can use a light client, or light node. Light nodes rely on third-party full nodes for information instead of holding a full copy of the blockchain. They need less space and can run on devices like mobile phones. Light nodes are easier to install and operate. Many everyday users choose light nodes for their wallets, especially if they do not plan to write smart contracts.

For high security, hardware wallets are an option. These physical devices store your private keys offline. They are considered the most secure way to keep your Ether. Hardware wallets cost money. By design, they are not smart contract wallets; they can only send and receive Ether and ERC-20 tokens.

### Gas: Fueling the Ethereum Network

Ethereum transactions and smart contract executions require computational effort. This effort is measured and paid for using a system called Gas. Ether, Ethereum's currency, can be divided into 1 quintillion units, which is a 1 followed by 18 zeroes. The smallest unit is called Wei. Transaction fees are usually calculated in Giga Wei, where 1 billion Wei equals one Giga Wei.

Gas is a unit of account that measures how much work is needed to run a line of code. It is not something you can own. Think of Gas like hours of labor. If a contract runs out of Gas, it stops executing. This system encourages smart contract programmers to write efficient code, as Gas costs money. Miners receive the Gas fees for providing the computing power to update the Ethereum ledger.

Why use Gas instead of just pricing everything in Ether? The price of Ether changes constantly. If contract execution were priced directly in Ether, the cost would fluctuate. Gas provides a stable measure of computational work. Running the same contract should always require the same amount of Gas, just as painting the same house takes the same amount of hours every time.

Each action in a contract has a predefined Gas cost. For example, sending Ether from one address to another requires 21,000 gas units. The actual price of one Gas unit, known as the Gas Price, changes based on how busy the network is. A "standard" Gas Price is around 20 Giga Wei. If the network is crowded, you can bid a higher Gas Price to make miners prioritize your transaction. This is like offering a higher wage per hour to get work done faster.

When you send an Ethereum transaction, you also set a Gas Limit. This is the maximum amount of Gas you are willing to spend. The Gas Limit protects you from losing all your funds if your code has an error or runs inefficiently. You pay the full amount for your Gas Limit upfront. If your contract uses less Gas than the limit, you get a refund for the unused Gas. However, if an operation runs out of Gas mid-way, it halts, and you do not get any Ether back for the Gas already spent.

Several issues can arise with Gas. If you do not include enough Gas units for your code, miners will not pick up your transaction. If you choose enough Gas units but set a very low Gas Price, your transaction may take a long time to process. Miners prioritize transactions that offer higher Gas Prices. In Ethereum, the total fee is the Gas used multiplied by the Gas Price you paid. A higher Gas Price means miners will compete more to run your code, and your transaction will be included in the blockchain faster.
