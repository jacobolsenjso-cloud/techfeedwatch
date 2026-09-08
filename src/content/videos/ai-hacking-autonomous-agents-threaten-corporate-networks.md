---
title: "Autonomous AI Agents Launch Multi-Step Hacking on Corporate Networks"
youtubeId: "4NX2LQxJl3w"
channelTitle: "Athena AI"
channelId: "UCyp9C2eBN1SiMiRcM2XPjBQ"
publishedAt: "2026-05-18T12:00:06Z"
date: "2026-07-30"
tags:
  - "AI & Tech"
  - "Cybersecurity"
summary: "Advanced AI models now demonstrate significant capability in performing autonomous, multi-step cyberattacks against corporate networks. This evolution, driven by increasing computational power, lowers the barrier to entry for sophisticated breaches without requiring extensive human technical expertise. Businesses face an escalating threat profile, necessitating a re-evaluation of current cybersecurity defenses to counter these emerging AI-powered agents. The shift marks a critical development in the ongoing digital security arms race."
metaDescription: "Advanced AI models now demonstrate significant capability in performing autonomous, multi-step cyberattacks against corporate networks."
duration: "7:02"
viewCount: 36
viewsUpdated: "2026-08-06"
thumbMax: true
isShort: false
faqs:
  - question: "What is AI reward hacking?"
    answer: "AI reward hacking generally refers to an artificial intelligence system finding unintended ways to maximize its reward function, often by exploiting loopholes in its design rather than achieving the desired goal. This can lead to unexpected and undesirable behaviors as the AI optimizes for a flawed metric."
  - question: "How do autonomous AI agents perform cyberattacks?"
    answer: "Autonomous AI agents perform cyberattacks by using a 'reason and act' loop, starting with minimal information about a target network. They autonomously explore, identify vulnerabilities, execute exploits, and move laterally through the network to achieve objectives like data exfiltration, all without continuous human intervention."
  - question: "What are the main limitations of current AI hacking agents?"
    answer: "Current AI hacking agents still face limitations, particularly when confronted with tasks requiring specialized knowledge in areas like complex cryptography, custom malware development, or specific exploit chains that break their sequential reasoning. They also struggle with real-time, interactive attacks like NTLM relay."
  - question: "How much does it cost to deploy an AI agent for a multi-step cyberattack?"
    answer: "Deploying an AI agent for a multi-step cyberattack can be remarkably inexpensive. For example, a run involving 100 million tokens, capable of deep network penetration, cost approximately $80 in API fees and operated for 10 hours of wall clock time."
rewrittenAt: "2026-08-16"
---

While the term "AI reward hacking" generally refers to an artificial intelligence system finding unintended ways to maximize its reward function, often by exploiting loopholes in its design rather than achieving the desired goal, this article focuses on a distinct and immediate threat: the demonstrated ability of advanced AI models to autonomously execute multi-step cyberattacks against corporate networks. These agents are not necessarily "reward hacking" in the traditional sense, but rather exhibiting sophisticated reasoning and action capabilities that allow them to achieve complex objectives in a simulated adversarial environment. The rise of these autonomous agents marks a significant evolution in cybersecurity, enabling sophisticated breaches without requiring extensive human technical expertise.

## The Dawn of Autonomous Cyber Agents

The capabilities of AI models in offensive cybersecurity have advanced rapidly, moving beyond isolated puzzles to complex, multi-step operations. These autonomous agents operate using a "reason and act" loop, starting with minimal information and progressively exploring a network, identifying vulnerabilities, and executing exploits. Unlike previous generations of AI tools that might assist human operators, these new models can independently navigate intricate network topologies. Researchers have evaluated recent models on virtualized corporate networks, simulating real-world enterprise environments complete with production software and common misconfigurations. This approach isolates the AI's inherent capabilities, demonstrating that successful pivots, exploits, and credential discoveries are direct results of the machine's autonomous reasoning, not human engineering.

## Measuring True Offensive Capability

Traditional methods for assessing AI hacking skills, such as capture-the-flag (CTF) challenges, typically involve isolated, single-step puzzles. While frontier models quickly saturate these benchmarks, such sterile environments create a false sense of security because they fail to test an agent's ability to maintain context over long-horizon operations. To accurately measure actual offensive capability, researchers have shifted to evaluating models on bespoke multi-step simulated enterprise networks.

One such simulation, named "The Last Ones," presents a virtualized corporate network attack chain comprising 32 steps across 9 milestones. Starting blind, an agent must breach a VPN, move laterally through subnets, and ultimately reach a target local subnet to exfiltrate a sensitive database. Completing this entire sequence would demand approximately 14 hours of continuous effort from an expert human penetration tester. A secondary environment, "Cooling Tower," is a 7-step industrial control system range designed to simulate physical disruption at a power plant. These evaluations highlight two key axes of capability growth: generational leaps in model architectures and the scaling of raw inference time compute. For instance, in August 2024, a model like GPT-4o stalled at an average of just 1.7 steps, failing to breach the first internal subnet with a 10-million token budget. However, 18 months later, Opus 4.6 achieved an average completion rate of 9.8 steps, autonomously breaching VPNs, moving laterally via techniques like ASREP roasting, extracting saved browser credentials, and setting up command infrastructure.

## The Power of Scale and Context Compaction

A significant factor in an agent's penetration depth is the ability to manage and utilize a large context window. Long-horizon tasks pose a mechanical challenge for AI models because executing dozens of terminal commands and reading massive log files quickly exhausts their context window space. Researchers address this by employing context compaction: when the window reaches 80% capacity, the model summarizes its task-relevant history, discoveries, network topology, and credentials, injecting this summary into a fresh context window to continue its operations.

This technique, combined with increasing token budgets, dramatically enhances an agent's reach. Scaling the token budget to 100 million can yield a 59% deeper penetration rate into a network. In its peak run, an agent successfully navigated 22 of 32 steps in "The Last Ones" simulation, showing no sign of plateauing. Achieving this level of access from a standing start would require roughly 6 hours of continuous focused work from an expert human penetration tester. The cost of such an extensive autonomous operation is remarkably low; an entire 100 million token run cost approximately $80 in API fees. For this amount, the agent spent 10 hours of wall clock time relentlessly probing the network without needing sleep, breaks, or shift changes. This demonstrates that deeper network penetration is becoming a direct function of purchasing a larger token budget, requiring zero technical sophistication from the threat actor.

## Current Limitations and Unpredictable Successes

Despite their impressive capabilities, autonomous AI agents still encounter "capability walls" within complex network environments. Even with 100 million tokens, models have not yet successfully exfiltrated the final database in "The Last Ones" simulation. Bottlenecks emerge when tasks require real-time NTLM relay attacks, which break the sequential reason-and-act loop, or when agents lack specialized knowledge to compromise intricate CICD supply chains. Agents still fail when forced to execute long sequences involving specialized cryptography or custom malware development. Zero-click, fully autonomous enterprise network takeovers are not yet a reality.

However, the evaluation of the "Cooling Tower" industrial control system range revealed an anomaly in how these models solve problems when they hit a wall. Instead of following intended web exploitation paths, agents analyzed raw network traffic to autonomously deduce proprietary protocols running on programmable logic controllers. In some instances, they utilized an unintended fuzzing technique, brute-forcing session identifiers to bypass authentication entirely, even without fully understanding the mechanism they had just exploited. This "alien approach" to problem-solving creates highly unpredictable success factors that human defenders may not anticipate, highlighting a unique and evolving aspect of the threat.

## The Evolving Threat and Future Outlook

The immediate operational threat from AI in cybersecurity is human-AI teaming. A mid-tier human operator can deploy an $80 token budget to autonomously map a network, move laterally, and escalate privileges. The human only needs to intervene manually to resolve high-complexity bottlenecks that stump the machine. This significantly lowers the barrier to entry for sophisticated breaches, as the first 60% of an enterprise intrusion is rapidly collapsing into an automated process.

This shift breaks the long-held assumption that large-scale network intrusions require a massive team of human attackers. Adversarial reconnaissance and initial access can now scale at the exact speed of inference compute. Businesses must re-evaluate their current cybersecurity defenses to counter these emerging AI-powered agents, adapting their security posture to a future where autonomous AI plays an increasingly central role in offensive cyber operations.
