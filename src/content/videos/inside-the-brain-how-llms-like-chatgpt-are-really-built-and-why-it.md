---
title: "How Filtered Data Becomes Numerical Tokens for ChatGPT LLMs"
seoTitled: true
youtubeId: "7xTGNNLPyMI"
channelTitle: "Andrej Karpathy"
channelId: "UCXUPKJO5MZQN11PqgIvyuvQ"
publishedAt: "2025-02-05T18:23:47Z"
date: "2026-07-24"
tags:
  - "AI & Tech"
summary: "The foundational processes behind large language models (LLMs) like ChatGPT involve meticulous data preparation and tokenization. Before any neural network training begins, vast quantities of raw internet data undergo extensive filtering for quality, diversity, and safety. This curated data then transforms into numerical tokens through algorithms like Byte Pair Encoding, becoming the discrete units LLMs learn to predict, thus shaping their linguistic abilities and potential biases."
metaDescription: "The foundational processes behind large language models (LLMs) like ChatGPT involve meticulous data preparation and tokenization."
duration: "3:31:24"
viewCount: 9391376
viewsUpdated: "2026-09-10"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What kind of data is used to train ChatGPT?"
    answer: "ChatGPT and other large language models are trained on vast amounts of text data, primarily sourced from the internet. This includes billions of web pages from sources like Common Crawl. The data undergoes extensive filtering to ensure quality, diversity, and safety."
  - question: "Why do large language models use 'tokens' instead of words?"
    answer: "Neural networks require text to be represented as a sequence of numerical symbols from a finite set. Tokens are these symbols, created by algorithms like Byte Pair Encoding. They allow the model to process text more efficiently by balancing sequence length and vocabulary size, representing common words or parts of words as single units."
  - question: "How is internet data cleaned before it's used to train an LLM?"
    answer: "Internet data goes through several filtering stages. This includes removing undesirable URLs (like spam or adult sites), extracting only the text content from web pages, filtering by language, and removing personally identifiable information (PII) to protect privacy. This ensures the training data is high-quality and safe."
  - question: "How does an LLM learn to generate text?"
    answer: "During training, an LLM learns by predicting the next token in a sequence. It takes a window of tokens as context and tries to guess what comes next. By comparing its predictions to the actual next token in the training data, the model mathematically adjusts its internal parameters to improve its accuracy over trillions of examples."
rewrittenAt: "2026-08-18"
---

ChatGPT is a type of large language model, or LLM. These are sophisticated computer programs designed to understand, generate, and interact with human language. They achieve this by learning complex statistical patterns from immense quantities of text data.

## The Foundation: Gathering and Cleaning Internet Data

Building an LLM like ChatGPT begins with collecting a massive amount of text. The primary source for this raw material is the internet. Organizations like Common Crawl have been systematically indexing web pages since 2007. By 2024, Common Crawl had indexed 2.7 billion web pages, providing a vast starting point.

The goal is to gather a huge quantity of high-quality and diverse documents. This diversity ensures the model learns a broad range of knowledge. However, raw internet data is messy and requires extensive filtering. Several stages are involved in this cleaning process.

First, URL filtering removes undesirable sources. This includes blocklists for malware, spam, marketing, racist, and adult websites. Next, text extraction isolates the actual content from the raw HTML of web pages. This step removes computer code, navigation menus, and other non-text elements.

Language filtering is another important step. For instance, some datasets, like FineWeb, keep only web pages where over 65% of the content is in English. Such decisions affect the model's ability to perform in different languages. A model trained primarily on English data will naturally be better at English than other languages. Finally, personally identifiable information (PII) is removed. This involves detecting and filtering out details like addresses or Social Security numbers from the dataset.

After all this rigorous processing, a vast but curated dataset remains. For example, the FineWeb dataset, which is representative of production-grade applications, occupies about 44 terabytes of disk space. This filtered text forms a continuous, one-dimensional sequence of raw internet text, ready for the next stage of preparation.

## From Raw Text to Discrete Tokens

Neural networks, which power LLMs, cannot directly process raw text. They require input in the form of a one-dimensional sequence of symbols from a finite set. The process of converting text into these numerical symbols is called tokenization.

Initially, computers represent text as sequences of bits, zeros and ones. This results in extremely long sequences with only two possible symbols. To make this more manageable, bits are grouped into bytes. Each byte consists of eight bits, allowing for 256 possible combinations or symbols. This reduces the sequence length by eight times while increasing the number of distinct symbols. Think of these bytes not as numbers but as unique IDs representing specific characters or character combinations.

## How Byte Pair Encoding Creates a Vocabulary

State-of-the-art language models go beyond simple byte representation to further optimize the sequence length and vocabulary size. They use an algorithm called Byte Pair Encoding (BPE). BPE works by identifying frequently occurring consecutive bytes or symbols. For example, if the sequence "116" followed by "32" appears often, BPE will group this pair into a new, single symbol. This new symbol is assigned a unique ID, perhaps starting from 256.

This process is iterated many times. Each time a new symbol is "minted" from a common pair, the overall sequence length decreases, and the vocabulary size increases. This trade-off is essential because sequence length is a precious computational resource during training. For instance, GPT-4 uses a vocabulary of 100,277 possible symbols. These symbols, or tokens, represent chunks of text, which can be individual characters, common words, or parts of words. The way text like "Hello world" is broken down into specific tokens shows that even spaces and capitalization affect the tokenization.

The final result of this tokenization process is an enormous sequence of these unique token IDs. The FineWeb dataset, for example, translates into a sequence of about 15 trillion tokens. Each token is just a numerical identifier for a specific text chunk, without inherent meaning beyond its ID.

## Training the Model: Predicting the Next Token

With the vast dataset transformed into a sequence of tokens, the neural network training can begin. This is where the model learns to understand and generate language. The core task during training is to predict the next token in a sequence.

The process involves feeding the neural network "windows" of tokens from the dataset. These windows act as context for the prediction. The length of these context windows can vary, often up to a maximum size like 8,000 tokens. Processing longer sequences becomes very computationally expensive.

For each window of tokens, the neural network's job is to output a prediction for what token should come next. Since the vocabulary for models like GPT-4 contains 100,277 possible tokens, the network outputs 100,277 numbers. Each number represents the probability that a specific token will be the next one in the sequence.

Initially, the neural network's predictions are random. However, because these windows are sampled from the actual dataset, the correct next token is known. This known answer serves as a "label." The model then uses a mathematical process to adjust its internal parameters. It aims to increase the probability of the correct next token and decrease the probabilities of all other incorrect tokens. Through trillions of these predictions and adjustments, the neural network gradually learns the intricate statistical relationships and patterns within human language.

## Trade-offs and Challenges in LLM Development

The extensive process of data preparation and tokenization involves many design decisions, each with practical trade-offs. The aggressive filtering of internet data, while necessary for quality and safety, inherently shapes the model's worldview. For example, filtering out certain types of websites or focusing heavily on English content means the model will be less knowledgeable or proficient in those excluded areas. This can lead to models that perform poorly in other languages or reflect a limited cultural perspective. The biases present in the original internet data, even after filtering, can also be absorbed and amplified by the model. This is a significant challenge, as models trained on biased data may perpetuate harmful stereotypes or generate unfair responses.

Tokenization also presents trade-offs. The choice of vocabulary size, for instance, affects how efficiently the model processes text. A larger vocabulary, like GPT-4's 100,277 symbols, allows for shorter token sequences, which is computationally beneficial. However, it also means the model has more distinct units to learn. The way text is segmented into tokens can also influence how the model "understands" words. For example, if a common phrase is always tokenized as a single unit, the model might treat it differently than if it were broken into individual words. Balancing these factors is a continuous effort in the development of advanced large language models.
