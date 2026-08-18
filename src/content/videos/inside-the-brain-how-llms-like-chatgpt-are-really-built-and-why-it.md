---
title: "How ChatGPT & LLMs Are Built: Data Prep & Tokenization"
seoTitled: true
youtubeId: "7xTGNNLPyMI"
channelTitle: "Andrej Karpathy"
channelId: "UCXUPKJO5MZQN11PqgIvyuvQ"
publishedAt: "2025-02-05T18:23:47Z"
date: "2026-07-24"
tags:
  - "AI & Tech"
summary: "The foundational processes behind large language models (LLMs) like ChatGPT involve meticulous data preparation and tokenization. Before any neural network training begins, vast quantities of raw internet data undergo extensive filtering for quality, diversity, and safety. This curated data then transforms into numerical tokens through algorithms like Byte Pair Encoding, becoming the discrete units LLMs learn to predict, thus shaping their linguistic abilities and potential biases."
duration: "3:31:24"
viewCount: 8572182
viewsUpdated: "2026-08-18"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What is the purpose of pre-training data in LLMs?"
    answer: "Pre-training data provides the vast knowledge base an LLM learns from. It allows the model to develop a statistical understanding of language, facts, and reasoning by observing patterns in billions of text examples."
  - question: "How is raw internet data prepared for LLM training?"
    answer: "Preparation involves multiple filtering stages, including removing undesirable URLs, extracting pure text from HTML, classifying and selecting specific languages, and identifying and scrubbing personally identifiable information (PII)."
  - question: "What is tokenization and why is it essential for LLMs?"
    answer: "Tokenization converts human-readable text into a sequence of numerical 'tokens,' which are the fundamental units LLMs process. This compression makes processing efficient and allows the model to handle diverse linguistic patterns with a finite vocabulary."
  - question: "What is the core mechanism by which LLMs learn from tokens during training?"
    answer: "LLMs learn by predicting the next token in a sequence based on the preceding tokens. Through iterative adjustments, the neural network refines its ability to assign probabilities to potential next tokens, aligning its predictions with statistical patterns observed in the training data."
---

The apparent "magic" of large language models (LLMs) like ChatGPT stems from an intricate engineering pipeline, beginning long before a user types a prompt. Understanding their capabilities and limitations requires a look at how these models are built, specifically the crucial stages of data preparation and tokenization that precede any neural network training. These foundational steps directly influence an LLM's eventual performance, knowledge, and inherent biases.

At its core, an LLM's intelligence derives from exposure to an enormous volume of text. Sources like Common Crawl continually index billions of web pages, forming the raw material for these models. This raw data, often measured in tens of terabytes, is far from clean. It undergoes aggressive filtering to ensure quality and diversity. This multi-stage process includes removing spam, malware, and undesirable content, extracting meaningful text from complex HTML, and performing language classification. For example, a model intended primarily for English may filter out pages not meeting a high English language threshold. A further vital step involves the detection and removal of personally identifiable information (PII) to protect privacy, though this remains an imperfect science. The quality of this curated dataset, such as Hugging Face's FineWeb, directly impacts the breadth and accuracy of the model's eventual knowledge. This meticulous curation highlights the significant human and computational effort involved in preparing data that trains AI systems, a process often unseen by end-users [AR vs. VR Differences: Future of Immersive Tech Explained](/video/ar-vs-vr-unpacking-the-fundamental-differences-and-divergent-futures).

Once refined, this massive text corpus needs translation into a format a neural network can process. This is where tokenization comes in. LLMs operate on discrete numerical symbols, not raw characters. Algorithms like Byte Pair Encoding (BPE) are employed to achieve this, identifying frequently occurring character sequences (like "ing" or common words) and merging them into single, unique tokens. This creates a vocabulary of tens of thousands of tokens, for instance, GPT-4 uses over 100,000 distinct tokens. This process allows models to represent vast amounts of text with shorter sequences of symbols, making computation more efficient. The choice of tokenizer and its vocabulary shape how the model perceives and generates language, influencing everything from semantic understanding to multilingual capabilities. Different tokenizations of the same text can lead to varying model performance and even subtle biases, making it a critical aspect of model design [Generative AI Explained: Evolution, Mechanics, & Impact](/video/beyond-the-chatbot-deconstructing-generative-ai-s-mechanics-and). These fundamental concepts underpin how systems like Google's Gemini, now integrated into services like Google Drive, interpret and interact with user data [Your Google Drive Just Went Pro: Gemini Unlocks AI Superpowers for Your Files](/video/your-google-drive-just-went-pro-gemini-unlocks-ai-superpowers-for).

## The Bottom Line

The sophistication of modern LLMs originates from a deep statistical understanding of language, built from a carefully prepared and tokenized version of the internet. Far from simple pattern matching, the ability of these models to predict the next token in a sequence, refined across trillions of examples, allows them to grasp context, generate coherent text, and even exhibit emergent reasoning. This underlying mechanics underscores the importance of data governance, transparency in data sourcing, and continuous research into bias mitigation. As AI continues to reshape industries like finance [Xavier Gomez Unpacks the Future of Finance: AI, Fintech, and Reshaping Wealth Management](/video/xavier-gomez-unpacks-the-future-of-finance-ai-fintech-and-reshaping), understanding these core building blocks moves beyond academic interest to practical necessity.
