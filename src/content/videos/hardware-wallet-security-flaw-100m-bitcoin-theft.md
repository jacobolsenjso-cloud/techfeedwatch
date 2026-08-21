---
title: "Coldcard Flaw: $100M Bitcoin Theft From Hardware Wallet Firmware"
youtubeId: "xSonLY4u0u4"
channelTitle: "Coin Bureau"
channelId: "UCqK_GSMbpiV8spgD3ZGloSw"
publishedAt: "2026-08-06T14:00:06Z"
date: "2026-08-10"
tags:
  - "AI Video"
  - "AI & Tech"
summary: "A significant exploit in Coldcard hardware wallet firmware led to a reported $100 million in Bitcoin theft, compromising supposedly secure offline funds. This incident highlights the persistent risks even in self-custody solutions often considered the gold standard for crypto asset protection. The vulnerability, reportedly five years old, underscores the complex challenges of securing digital assets against sophisticated supply chain and software integrity attacks."
metaDescription: "A five-year-old firmware vulnerability in a prominent hardware wallet led to $100M Bitcoin theft. Understand hardware wallet security risks."
duration: "16:53"
viewCount: 26955
viewsUpdated: "2026-08-19"
thumbMax: true
isShort: false
faqs:
  - question: "What was the Coldcard hardware wallet security flaw?"
    answer: "The flaw was a 5-year-old firmware bug that caused Coldcard devices to use a weak, predictable software random number generator instead of a secure hardware one when creating seed phrases. This made the seed phrases vulnerable to brute-force attacks, allowing attackers to guess them and steal funds."
  - question: "How did the Coldcard bug lead to Bitcoin theft without users approving transactions?"
    answer: "The bug made the seed phrases predictable. Attackers could generate a list of possible weak seed phrases offline, derive the associated Bitcoin addresses, and then check which of these addresses held funds. Once a match was found, they could sweep the Bitcoin without needing to interact with the user's physical device or gain their approval."
  - question: "What steps should Coldcard users take if they suspect their wallet might be compromised?"
    answer: "Users should first check if their seed was created on firmware versions 4.0.0 through 5.0.3. They should assume the seed is compromised unless they used strong additional security like 50+ dice rolls, a strong BIP39 passphrase, or a multisig setup. The crucial steps are to generate a completely new wallet on patched firmware, move all funds to this new, secure wallet, and treat the old seed as permanently compromised."
  - question: "Does this incident mean hardware wallets and self-custody are no longer safe?"
    answer: "This incident highlights the importance of robust security practices, but it does not mean self-custody is inherently unsafe. Instead, it emphasizes the need for 'verifiable self-custody.' Users who implemented additional safeguards like physical dice rolls, strong passphrases, or multisig were unaffected. The incident shows that optional security measures are now essential for protecting digital assets."
rewrittenAt: "2026-08-18"
---

A significant exploit in Coldcard hardware wallet firmware led to a reported $100 million in Bitcoin theft, compromising supposedly secure offline funds. This incident highlights the persistent risks even in self-custody solutions often considered the gold standard for crypto asset protection. The vulnerability, reportedly five years old, underscores the complex challenges of securing digital assets against sophisticated supply chain and software integrity attacks.

## The Coldcard Exploit Unfolds

On July 30, 2026, a major security incident began to unfold, affecting thousands of Coldcard hardware wallet users. Attackers initiated automated scripts that drained substantial amounts of Bitcoin from these devices. In an initial 25-minute window, approximately 500 single-signature wallets lost 594 Bitcoin, valued at about $38 million. The sweep expanded quickly. Within 41 minutes, 1,196 addresses were hit, resulting in the theft of $70 million worth of Bitcoin. By August 2, the reported losses reached $89 million across 4,585 addresses. The total confirmed losses by August 3 involved 1,816 Bitcoin from somewhere between 5,200 and 7,300 addresses.

What made this incident particularly alarming was its nature. Victims had followed recommended security practices. Their devices were often stored offline in safes or hidden locations. No one was phished, nor did users plug their wallets into compromised computers. Crucially, no user manually approved a malicious transaction. For example, Canadian entrepreneur Jonathan Goodman lost 18.25 Bitcoin, roughly 1.6 million Canadian dollars, from wallets in a safety deposit box. His device remained untouched in a vault during the 7-minute drain. The attack did not physically touch the hardware. Instead, it targeted the software responsible for generating the seed phrase itself. Many of the stolen coins had sat untouched for over 3 years, belonging to users who believed their funds were fully secure.

## The Root Cause: Flawed Randomness

The vulnerability stemmed from a 5-year-old bug introduced on March 1, 2021. This occurred when Coin Kite, the maker of Coldcard, migrated its firmware to a new cryptography library called Libangu. Within this library, a critical line of code asked the wrong question about a specific setting. The setting, named Micropy HW enable RNG, was deliberately set to zero, or "off," by Coin Kite. They intended to use their own separate hardware randomness wrapper. However, the library only checked if the setting existed, not if it was actually enabled.

This misinterpretation led the firmware to conclude that hardware randomness was being handled. It then stopped calling the chip's dedicated hardware random number generator. Instead, the system fell back to a less secure software substitute: the Yasmarang generator within MicroPython. This software generator created "random" numbers using predictable inputs. It relied on the chip's serial number and the exact timing of its startup. After the initial startup, it never collected any fresh randomness. Every subsequent output was merely a calculation from that predictable starting point. An attacker could reconstruct these values, narrow them down, or even enumerate them one by one.

The bug went unnoticed for five years because the hardware random number generator still functioned elsewhere in the firmware. Internal reviews confirmed its presence and configuration. No one realized that the specific code path for generating seed phrases bypassed it. This meant devices shipped for five years with a security downgrade that appeared to be working perfectly. The bug drastically reduced the effective security of seed phrases. For Coldcard MK2 and MK3 devices, security dropped from 128 bits to roughly 40 bits. The newer MK4, MK5, and Q models retained around 72 bits due to additional randomness from their secure chips. A 40-bit security level means about a trillion possibilities. An ordinary laptop can grind through these possibilities offline in a matter of hours. This explains why the drains were automated and so fast. Attackers could generate every candidate seed in the shrunken pool, derive addresses, check for funds, and then sweep them.

## Beyond Seed Phrases: Wider Impact

The implications of this randomness flaw extended beyond just the primary seed phrases for Bitcoin wallets. The same broken randomness path was also used for other critical security elements. This included paper wallet private keys, seed XR split masks, device cloning keys, and USB encryption keys. It also affected key teleport temporary keys, web 2FA secrets, and secure notes passwords. This means the potential "blast radius" of the vulnerability was much wider than just a user's main Bitcoin holdings. Any secret generated using the compromised randomness could be at risk.

## Who Was Safe and Why: Lessons in Self-Custody

Despite the widespread impact, three specific groups of Coldcard users remained untouched by the exploit. Their survival offers important lessons in self-custody practices.

First, users who "rolled their own dice" during setup were safe. Coldcard devices allow users to roll physical dice and feed the results into the seed generation process. Coin Kite's recommendation is at least 50 fair, independent rolls. This injected real-world randomness that the firmware bug could not compromise.

Second, anyone using a strong BIP39 passphrase was protected. This is an extra secret word or phrase typed in addition to the 12 or 24 seed words. It creates a completely separate wallet. Even if an attacker guessed the weak seed, they would gain nothing without this passphrase.

Third, users in a genuine multisig setup were secure. Multisig requires multiple different keys from multiple different devices to move funds. Data as of August 3 showed that not a single multisig wallet had been hit across all four waves of attacks. Not one Taproot address was affected either, suggesting the attacker's script was narrowly scoped.

Every one of these protections was an optional extra step, often skipped in the default setup. The people who took these steps did not do so because they knew about a firmware bug. They acted out of a general, healthy sense of paranoia regarding security. The survivors of this incident were saved by their proactive security habits. The safety margin came from these extra safeguards users added themselves, while the default setup offered no defense.

## Protecting Your Funds: Immediate Steps and Broader Implications

Coin Kite's response to the incident was swift and direct. CEO Ralpho Novak (NVK) publicly apologized and advised users to move funds immediately if they generated a seed using a Coldcard wallet. The company took full accountability, halted shipments, destroyed vulnerable warehouse inventory, and released emergency patches.

However, updating firmware alone does not fix an already generated compromised seed. The patch prevents the device from creating new bad keys, but it cannot "un-weaken" an old one. The vulnerability follows the recovery phrase itself, not the physical device. Moving a compromised seed to a different wallet also offers no protection.

For Coldcard users, the practical steps to secure funds are:
1.  Check if your seed was created on firmware version 4.0.0 through 5.0.3. The creation date is what matters.
2.  Unless you used 50 or more dice rolls, a strong unique passphrase, or a multisig setup, assume that seed is compromised.
3.  Understand that updating firmware is necessary but not sufficient.
4.  Generate a completely new wallet on patched firmware.
5.  Move your funds to the new seed now.
6.  Treat the old seed as permanently public. Never reuse or fund it again.
7.  Verify the new receiving address on the device screen before sending any meaningful amount.
A critical warning: do not type your recovery phrase into any "vulnerability checker" website. Phishing tools imitating legitimate checkers are already active.

This incident is not an isolated problem. Randomness is a recurring failure point across the crypto industry. A bad random number often produces no visible symptoms, allowing flaws to persist for years. Previous incidents include the 2023 Milk Sad bug, where Libbitcoin explorer created wallet seeds with only 32 bits of randomness, leading to millions in losses. The 2022 Profanity vanity address tool made a similar mistake, contributing to the $160 million Wintermute hack. In 2022 and 2023, Trust Wallet's browser extension created keys derivable from public addresses. Just weeks before the Coldcard exploit, the Ill Bloom bug affected several mobile and browser wallets, leading to over $5 million in confirmed losses.

This event has prompted some users to move funds back to exchanges, with daily exchange deposits under 10 BTC spiking to 7,300 BTC on July 31. However, the real lesson is not to abandon self-custody. Instead, it emphasizes verifiable self-custody over trusted self-custody. Optional safeguards like dice rolls, passphrases, and multisig are no longer paranoid overkill. They have become the baseline for security. This open-source ecosystem quickly identified a 5-year-old flaw, published it, patched affected models, and saw other hardware wallet providers publish proofs of their randomness pipelines. This level of transparency and rapid response is rare in traditional custody. The people who upgrade their security setup this week will likely hold Bitcoin in a way that is harder to break than anything that existed before this bug was found.
