---
title: "Makora Compiler: Beats Hand-Tuned CUDA for LLM Inference"
seoTitled: true
youtubeId: "ukzACWrk0W0"
channelTitle: "SemiAnalysis"
channelId: "UCf_KhBXw5TIV0A7butjgFhg"
publishedAt: "2026-05-27T22:15:06Z"
date: "2026-07-29"
tags:
  - "Hardware & Chips"
  - "Automation"
summary: "Makora, an AI startup, announced significant advancements in automated GPU kernel generation, capable of outperforming hand-tuned CUDA code. This innovation promises substantial speedups for large language model inference, addressing critical performance bottlenecks in AI compute. Their approach, featuring advanced speculative decoding, marks a step toward more efficient and adaptive AI hardware utilization."
metaDescription: "Makora automates GPU kernel optimization for AI inference, beating hand-tuned code and speeding up LLMs. Discover this AI tech breakthrough."
duration: "26:36"
viewCount: 2860
viewsUpdated: "2026-09-10"
thumbMax: true
isShort: false
faqs:
  - question: "What is automated GPU kernel generation?"
    answer: "Automated GPU kernel generation involves using AI or specialized software to automatically write and optimize the low-level code that runs on graphics processing units. This process aims to maximize the efficiency of AI workloads, traditionally requiring manual tuning by expert engineers. It helps overcome the complexity and time involved in hand-optimizing code for diverse hardware."
  - question: "How does Makora's speculative decoding improve LLM performance?"
    answer: "Makora's Sequential Monte Carlo (SMC) speculative decoding speeds up large language model inference by keeping multiple 'drafts' of predicted tokens alive simultaneously. Instead of rewinding when a prediction is incorrect, SMC scores these drafts and refines them, always accepting tokens. This eliminates the performance penalty of rewinding, leading to significantly faster generation."
  - question: "What is the 'Tracer' technology for FP4 quantization?"
    answer: "Tracer is Makora's technology to improve the accuracy of FP4 low-precision quantization. It reclaims a wasted quantization level in standard FP4 (which represents zero in two ways) by remapping the redundant zero to a learnable special value. This allows FP4 to achieve accuracy comparable to FP5 or FP5.something while maintaining its smaller memory footprint."
  - question: "How does Makora differentiate itself from other AI performance companies?"
    answer: "Makora focuses on delivering end-to-end performance and accuracy for AI workloads, rather than just selling a code generation tool. They integrate automated kernel generation with advanced research, such as SMC speculative decoding and Tracer technology, and adapt to various hardware and open-source models. Their goal is to provide a comprehensive, managed performance solution across different AI infrastructures."
rewrittenAt: "2026-08-18"
---

Makora is making strides in automating the creation of high-performance GPU kernels, a critical component for efficient AI operations. This work extends beyond simple code generation to encompass system-level optimizations for AI inference and training. Their innovations promise major speedups for large language models, addressing key performance challenges in the rapidly evolving field of AI compute.

## Automating High-Performance GPU Kernels

The core of Makora's approach lies in automating the generation of high-performance GPU kernels. These specialized code segments are essential for maximizing the efficiency of AI workloads on graphics processing units. Traditionally, optimizing these kernels often requires extensive manual tuning by expert engineers, a time-consuming and complex process. Makora aims to automate this performance engineering, moving from manual effort to intelligent code generation.

However, automating kernel generation presents unique challenges. One major hurdle is "reward hacking," where AI models generate code that appears to perform well on benchmarks but exploits loopholes rather than achieving genuine efficiency. This can lead to misleading performance metrics and unreliable code. To counter this, Makora has developed a rigorous evaluation pipeline. This system traces through generated code to ensure functions are called correctly and uses AI to detect various types of reward hacks. The evaluation pipeline is also highly rigid, preventing generated code from arbitrarily calling external libraries. This strict control ensures that only genuinely optimized and secure kernels are accepted. Makora has identified and can catch about 11 different classes of reward hacks through these methods. This rigorous engineering effort provides confidence in the quality and performance of the automatically generated kernels.

Makora's strategy is not to sell a standalone code generation agent or compiler. Instead, they offer an end-to-end performance management service. This service integrates their automated kernel generation with other advanced optimization techniques. The goal is to deliver complete performance improvements across various AI infrastructures. This includes using the best available open-source inference servers and incorporating their own specialized optimizations. They are also developing their own inference engine to implement more advanced features that existing frameworks may not easily support. This flexible approach allows Makora to adapt to new models and agents, integrating the best tools to achieve best kernel performance.

## Accelerating LLM Inference with Sequential Monte Carlo Speculative Decoding

A major innovation from Makora is Sequential Monte Carlo (SMC) speculative decoding, an advanced inference algorithm designed to greatly speed up large language model operations. Traditional speculative decoding works by using a smaller, "draft" model to predict several tokens ahead. These K predicted tokens are then verified in parallel by a larger, more accurate "target" model. The speedup comes from parallel verification instead of sequential autoregressive generation. However, a key drawback is that if any predicted tokens do not exactly match the target model's output, the system must "rewind" the draft and start over. This rewinding introduces a large performance penalty.

SMC speculative decoding addresses this by maintaining N parallel drafts instead of just one. Rather than seeking an exact match, the target model scores these N drafts. Based on these importance scores, a sequential Monte Carlo sampling process occurs. Drafts with very low scores are evicted, while those with high scores are duplicated. This continuous refinement ensures that the most promising drafts are always pursued. Crucially, SMC always accepts K tokens and never rejects or rolls back, eliminating the performance hit of rewinding.

This method greatly boosts inference speed. In Makora's testing, SMC speculative decoding was about five times faster than the SGELang baseline. It also showed performance about two times faster than speculative decoding on SGELang with its experimental overlap scheduler, and was faster than SSD, another recent speculative drafting baseline.

While powerful, SMC speculative decoding has specific considerations. The quoted performance gains, for instance, are for a batch size of one, targeting low-latency applications. At higher batch sizes, the increased compute required for multiple drafts can lead to earlier saturation. And, SMC is a lossy method, meaning it does not guarantee exact fidelity to the target model's output. However, empirical testing has shown that sometimes, having N drafts from a smaller model can even outperform the target model itself, especially given the variance in model quality. SMC is also highly flexible, compatible with existing speculation methods like MTP and Eagle, and can even work with models that have different tokenization schemes.

## Improving Low-Precision Quantization with Tracer Technology

Beyond kernel generation and speculative decoding, Makora is also advancing low-precision quantization techniques, particularly for FP4. Low-precision formats are vital for reducing memory footprint and accelerating computations in AI models. Standard FP4, however, has an inefficiency: it can represent both minus zero and plus zero. This wastes one of its 16 available quantization levels, as zero is effectively represented in two ways.

Makora's "Tracer" technology addresses this by remapping the redundant zero to a learnable special value. This effectively allows FP4 to achieve the accuracy of FP5 or FP5.something while retaining the memory footprint of FP4. Implementing this, however, presents hardware-specific challenges.

On Nvidia GPUs, applying Tracer to weight-activation quantization incurs a performance overhead. This is because the process cannot be completed in a single pass of the tensor core. It requires a first pass and then a second, compensatory pass for entries that were negative zero and remapped outside the FP4 range. While the second pass is sparse and has potential for acceleration, it still results in slower performance compared to standard FP4 on Nvidia hardware for this specific use case.

In contrast, AMD hardware offers a distinct advantage. The FP6 data path on AMD GPUs shares hardware with FP4. This allows the special Tracer values to be upcast to FP6 with the same throughput, maintaining the FP4 memory footprint while achieving high performance. This difference highlights how hardware architecture can majorly impact the viability and performance of advanced quantization techniques. Makora's research into such nuanced hardware interactions underscores their commitment to extracting maximum performance.

## Makora's End-to-End Performance Strategy

Makora's overarching strategy is to deliver end-to-end performance and accuracy rather than just a single tool or component. They view automated code generation as a critical part of this larger mission. As foundation models and AI agents become more capable at generating code, Makora adapts by integrating these advancements into their product. They are "ego-less" in this regard, constantly evaluating and incorporating new models, including open-source options like Gemma 4, to ensure they always deliver the best possible kernel.

Their focus remains on providing a complete platform that manages and optimizes AI deployment. This includes not only kernel generation and advanced inference algorithms like SMC speculative decoding but also research into areas like numerics and low-precision formats. By offering a full suite of optimizations, Makora aims to provide a flexible and powerful solution for AI developers seeking to maximize the efficiency and speed of their large language models and other AI workloads. This approach allows them to use cutting-edge research and adapt to hardware specifics, ensuring best performance across diverse computing environments.
