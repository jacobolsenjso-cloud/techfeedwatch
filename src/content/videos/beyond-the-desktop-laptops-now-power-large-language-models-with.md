---
title: "Optimize Local LLM Performance on Laptops with Shared CPU GPU Memory"
seoTitled: true
youtubeId: "AcTmeGpzhBk"
channelTitle: "Alex Ziskind"
channelId: "UCajiMK_CY9icRhLepS8_3ug"
publishedAt: "2025-05-27T15:39:09Z"
date: "2026-07-21"
tags:
  - "Hardware & Chips"
  - "Productivity"
summary: "Running large language models (LLMs) locally on consumer hardware presents significant performance challenges, primarily due to variations in memory architecture and allocation strategies. Achieving optimal speed and the ability to run larger, more capable models hinges on understanding how system memory is shared and utilized by the integrated CPU and GPU. While cutting-edge APUs offer substantial unified memory pools, their underlying implementation differs from truly integrated designs, leading to nuanced performance outcomes that demand informed user configuration."
duration: "20:12"
viewCount: 527160
viewsUpdated: "2026-08-22"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "Why do larger LLMs perform better than smaller ones?"
    answer: "Larger LLMs typically have more parameters, allowing them to store more knowledge and maintain longer, more complex reasoning chains. This generally results in fewer errors, better understanding of nuanced prompts, and improved performance on difficult tasks like advanced calculations or detailed analysis."
  - question: "What is the difference between unified and shared memory in the context of LLMs?"
    answer: "Truly unified memory, like in Apple Silicon, means the CPU and GPU dynamically share a single memory pool, minimizing data movement. Shared memory in APUs means the CPU and GPU can access the same physical memory, but often require pre-allocation of specific amounts to the GPU, sometimes necessitating reboots for changes."
  - question: "Why is manual GPU memory allocation often better than 'auto' settings for local LLMs?"
    answer: "'Auto' settings often prioritize general system stability or other tasks, leading to suboptimal allocation for LLM inference. Manually assigning a larger portion of memory to the GPU allows the LLM to run more of its computations directly on the GPU, which is much faster for these tasks, significantly improving tokens-per-second generation rates."
  - question: "How does memory bandwidth affect LLM performance?"
    answer: "Memory bandwidth determines how quickly data can be moved between memory and the CPU or GPU. Higher bandwidth allows the processors to access and process the LLM's data more rapidly, directly translating into faster token generation speeds and overall better performance for computationally intensive LLM tasks."
rewrittenAt: "2026-08-17"
---

Running sophisticated large language models (LLMs) directly on a laptop offers significant advantages in privacy, cost, and customization, but it demands a deep understanding of how a system's memory resources are managed. The ability to execute larger, more capable models at a usable speed hinges on the interplay between the central processing unit (CPU) and the graphics processing unit (GPU), particularly concerning how they access and share available memory.

## The Memory Challenge for Local LLMs

The primary motivation for running LLMs locally is to leverage larger, more intelligent models. These models, such as Llama 3 with 70 billion parameters, often deliver superior performance compared to their smaller counterparts. They store more extensive knowledge and can maintain longer, more complex reasoning chains, leading to fewer "hallucinations" and better results on intricate tasks like advanced mathematics or legal analysis. However, this enhanced capability comes with a substantial memory footprint.

The size of an LLM on disk, for instance, a model that is 73 GB, only provides an approximate starting point for its memory requirements. When loaded and running, the model's actual memory consumption can differ significantly. For a system to handle these large models effectively, it needs a considerable amount of available memory. While smaller models can run on systems with 8 gigs or 16 GB of memory, models with tens of billions of parameters often demand 128 GB or more to operate efficiently, if at all.

To mitigate the memory demands of larger models, a technique called quantization is often employed. This involves reducing the precision of the model's weights, effectively shrinking its size. For example, a model quantized to 8-bit (Q8) will be larger and retain more fidelity than one quantized to 4-bit (Q4), which is roughly half the size. While quantization allows larger models to fit into more constrained memory environments, it can sometimes come at the cost of a slight reduction in output quality.

## Understanding Unified vs. Shared Memory Architectures

The way memory is architected on a laptop significantly impacts LLM performance. Two prominent approaches are "unified memory" and "shared memory," though these terms are sometimes used interchangeably, leading to confusion.

Apple Silicon, found in devices like the MacBook Pro with an M4 Max chip, exemplifies a truly unified memory architecture. In this design, the CPU and GPU share a single, large pool of memory, and they can dynamically access any portion of it as needed. This minimizes data movement between the CPU and GPU, as both processors operate on the same data in the same memory space. For instance, an M4 Max system with 128 GB of total memory might make approximately 96 GB available to the GPU by default for LLM tasks, and in some cases, can dynamically utilize up to 120 GB for a large model without explicit user intervention. This dynamic allocation is akin to "two chefs sharing one big countertop," where both can grab ingredients and tools whenever required without prior arrangement.

In contrast, accelerated processing units (APUs) from manufacturers like AMD, such as the Ryzen AI Max Plus 395, offer what is often described as "shared memory." While the CPU and GPU are integrated on a single chip and can access the same physical memory, the allocation of that memory often needs to be predetermined. On systems featuring these APUs, users might need to manually assign a specific amount of system memory to the integrated GPU through system utilities, with options ranging from half a gig to 96 GB. Crucially, changing this allocation typically requires a system reboot. This pre-allocation model is more like "two chefs with separate tables," where they agree beforehand who gets the flour, who gets the bowls, and no swapping occurs mid-recipe.

This architectural difference has practical implications. On an AMD APU, even with a large total memory pool (e.g., 128 GB), if 96 GB is allocated to the GPU, attempting to load a 70 billion parameter model (which might be 74 GB on disk) can still result in a "failed to load" error due to insufficient system resources. This suggests that, unlike truly unified memory, the APU might first copy the model into general system memory before then copying it again into the dedicated GPU-allocated portion, effectively requiring double the memory for the loading process.

## Optimizing Memory Allocation for Performance

For users running LLMs on systems with shared memory architectures, manual memory allocation is often key to achieving optimal performance. While an "auto" memory setting might seem convenient, it frequently leads to suboptimal results. Performance charts often show that the "auto" setting consistently yields worse performance than manually selecting a memory option.

Instead, users should experiment with specific memory allocations for the GPU. For example, settings like 8 GB, 16 GB, 32 GB, or 96 GB can significantly improve tokens per second generation rates compared to the "auto" setting. However, not all manual settings are universally beneficial; in some cases, a 1 GB or 64 GB allocation might perform poorly for certain models. The ideal setting can vary depending on the specific LLM being run and the overall system configuration.

Tools like LM Studio provide users with fine-grained control over how much of an LLM is "offloaded" to the GPU. Offloading all or most of the model to the GPU is generally recommended for the best speed. Running an LLM entirely on the CPU, or even splitting the load evenly between CPU and GPU, typically results in slower performance. The goal is to maximize the utilization of the GPU's parallel processing capabilities, which are far better suited for the intensive computations involved in LLM inference.

## Beyond Memory Size: The Role of Bandwidth and Prompt Length

While the sheer amount of memory is critical for fitting large models, the speed at which that memory can be accessed – known as memory bandwidth – plays an equally vital role in LLM performance, specifically in how quickly tokens are generated. Higher memory bandwidth allows the CPU and GPU to process data more rapidly, leading to a higher tokens-per-second rate.

For instance, a system with an M4 MacBook Air might offer around 100 GB per second of memory bandwidth, while an AMD APU could achieve approximately 235 GB per second. High-end Apple Silicon, like the M4 Max, can deliver even greater bandwidth, with measured rates of 316 GB per second for triad operations and 355 GB per second for copy operations, though advertised figures for such chips can exceed 500 GB per second. These differences in bandwidth directly translate into varying LLM generation speeds.

Another factor influencing generation speed is the length of the input prompt. Shorter prompts generally yield faster responses. For example, a simple prompt like "hi" might result in 51 tokens per second, whereas asking the model to "write a 1,000-word story" could drop the speed to 42 tokens per second. Even copying a long piece of text as a prompt can drastically slow down the generation rate, potentially reducing it to 41 tokens per second. This is because longer prompts require more initial processing before the model can begin generating output.

It's also worth noting that even for smaller models that can run on systems with less memory, performance differences persist. A Gemma 12 billion model, for example, might generate 24 tokens per second on a 128 GB machine, but achieve 25.5 tokens per second on a 32 GB machine when the latter is optimally configured with 24 GB allocated to the GPU. This highlights that careful configuration can sometimes extract surprising performance from less powerful hardware for models that fit within its constraints.

## Practical Considerations for Local LLM Users

Successfully running large LLMs locally requires a balance of hardware capability and informed user configuration. Systems with substantial memory, such as 128 GB, are essential for running the largest available models. However, simply having the memory is not enough; its architecture and how it's allocated are equally important.

Users of APU-based systems must be prepared to manually configure GPU memory allocation and understand that changes often necessitate a system reboot. The "auto" setting, while convenient, is frequently a performance bottleneck. Experimentation with different manual settings is often required to find the sweet spot for specific models and workloads. Tools like LM Studio can offer "guardrails" to prevent users from attempting to load models that would destabilize the system, but these can also be disabled for advanced users willing to take risks.

The choice between a system with truly unified memory and one with a shared memory APU involves trade-offs. While truly unified memory often offers a more dynamic and user-friendly experience for LLM loading, APU-based systems can still deliver strong performance with careful manual tuning. Ultimately, understanding these architectural nuances and actively managing memory resources are critical steps toward maximizing the potential of local LLM deployment on consumer laptops.
