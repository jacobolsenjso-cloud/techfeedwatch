---
title: "What Is Gstack by Garry Tan: AI Engineering Team?"
youtubeId: "wkv2ifxPpF8"
channelTitle: "Y Combinator"
channelId: "UCcefcZRL2oaA_uBNeo5UOWg"
publishedAt: "2026-04-23T14:30:49Z"
date: "2026-07-27"
tags:
  - "AI & Tech"
  - "Business & Money"
summary: "G-Stack is an open-source framework developed by Y Combinator CEO Garry Tan that transforms AI code models into a comprehensive AI engineering team. It automates significant portions of the software development lifecycle, from ideation and planning to design, coding, and quality assurance. This system is designed to address the challenges of raw AI models by implementing structured roles, processes, and review stages, mirroring human team dynamics for more effective and reliable output."
metaDescription: "Explore G-Stack, Y Combinator CEO Garry Tan's open-source framework transforming AI code models into an entire engineering team for rapid development."
targetQuestion: "what is gstack garry tan"
duration: "1:19:40"
viewCount: 264591
viewsUpdated: "2026-09-25"
thumbMax: true
isShort: false
rewrittenAt: "2026-09-15"
faqs:
  - question: "What problem does G-Stack aim to solve in AI-assisted coding?"
    answer: "G-Stack addresses the issue of raw AI models 'wandering' or generating plausible-looking but silently broken code. It provides structure, roles, processes, and review mechanisms, akin to a human engineering team, to guide the AI."
  - question: "How does G-Stack’s 'Office Hours' skill function?"
    answer: "The 'Office Hours' skill in G-Stack is modeled on Y Combinator's startup mentorship process. It uses a distilled version of the six forcing questions YC partners use to help founders refine product ideas and business models before building."
  - question: "What is the 'thin harness fat skills' approach in G-Stack?"
    answer: "This approach means G-Stack provides a lean, foundational framework (the 'thin harness') that enables underlying AI models (like Claude Code) to leverage their inherent intelligence and capabilities ('fat skills') more effectively and precisely in a structured development workflow."
---

G-Stack is an open-source framework developed by Y Combinator CEO Garry Tan, designed to transform large language models (LLMs) into a structured AI engineering team. This system aims to significantly accelerate and streamline the software development process by automating various stages from conception to deployment.

This initiative emerges in what Tan describes as the "agent era" of software development, a period where AI agents can perform complex tasks with unprecedented autonomy. Garry Tan, an engineer who spent the first decade of his career building software full-time and was employee number 10 at Palantir after studying computer systems engineering at Stanford, built G-Stack 3 weeks ago. He asserts it has already garnered more GitHub stars than Ruby on Rails, signifying rapid adoption. Tan's motivation stems from his own experience coding more in the past 2 months than in all of 2013, the last time he focused intensely on engineering. He observed that while models like Claude Code are intelligent, they often "wander," generating code that looks correct but contains silent breaks without proper guidance.

## G-Stack and the Agent Era of Software Development

The core principle behind G-Stack is to replicate human team dynamics—roles, process, and review—to effectively manage AI agents. It functions as a "thin harness fat skills" approach, providing just enough structure to allow the LLM's capabilities to shine without unnecessary scaffolding. G-Stack integrates with tools like Conductor to make this accessible. For example, a user can initiate a project, such as building a tax app to fetch 1099s from Gmail, through G-Stack's skills.

One of G-Stack's most distinctive features is "Office Hours," a skill directly modeled after the intensive product thinking sessions conducted at Y Combinator. This AI-driven mentorship incorporates the distilled wisdom from thousands of hours spent by 16 YC partners, presenting a 10% strength version of their process. It starts by posing six forcing questions to challenge and refine a startup idea. In the tax app example, Office Hours guided the concept from a basic document aggregation service, potentially earning $2 to $5 a month or year, to a more solid CPA matchmaking and lead generation business model with the potential for 10x more revenue by charging a percentage of transactions. This demonstrates how G-Stack encourages deeper strategic thinking, rather than merely executing instructions, an approach essential as [Coding is Not Dead, but Rapidly Transforming by 2026](/video/coding-is-not-dead-but-rapidly-transforming-by-2026).

Beyond ideation, G-Stack supports a comprehensive development workflow. The "Design Shotgun" tool, for instance, leverages OpenAI Codex for Image Gen to rapidly generate three versions of UI designs in about 60 seconds, allowing users to select and refine visual interfaces. It also incorporates multi-step adversarial review, which automatically identifies and corrects issues. In one instance, a design document improved from a 6 out of 10 to 8 out of 10 by automatically catching and fixing 16 issues.

G-Stack's capabilities extend to tackling the often-tedious aspects of software quality assurance. Garry Tan notes that the QA process became a bottleneck as AI agents accelerated other stages. To address this, he built slash QA and slash browse tools by wrapping Playwright at the CLI level, providing a full headed and headless Chromium browser. These tools enable AI agents to perform browser automation tasks like logging in, handling to tax documents, downloading PDFs, taking screenshots, executing complex interactions, and running full regression tests. This significantly reduces manual QA effort, moving towards what Tan calls a "level seven" software factory, though not yet the ideal "level eight."

Garry Tan personally utilizes G-Stack to run 10 to 15 parallel Claude code sessions simultaneously, allowing him to manage tens of thousands of stars across multiple open-source projects and review hundreds of pull requests daily. This workflow enables him to ship 10, 15, 20, sometimes 50 PRs in any given day. The framework also provides a defense against supply chain attacks by facilitating thorough review of AI-generated code, a growing concern in AI-assisted development. This approach embodies the concept of [How Coding Harnesses Transform LLMs into Agentic Systems](/video/ai-coding-harnesses-impact-on-enterprise-ai-adoption), providing the structure needed for effective AI collaboration. The framework is publicly available at github.com/garytan/gstack.

### The Bottom Line

G-Stack represents a significant step towards industrializing AI-driven software development by structuring AI models into a functional engineering team. By embedding established development methodologies and Y Combinator's product thinking into an open-source framework, Garry Tan's G-Stack aims to lower the barrier to building complex software. It allows developers to go from a half-baked idea to a refined plan, designed, and tested product with unprecedented speed and efficiency, challenging traditional notions of development cycles and team sizes.
