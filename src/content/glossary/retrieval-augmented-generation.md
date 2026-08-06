---
term: "Retrieval-Augmented Generation"
slug: "retrieval-augmented-generation"
aliases: ["RAG"]
category: "AI"
definition: "Retrieval-Augmented Generation is an artificial intelligence technique that enhances large language models by retrieving relevant information from an external knowledge base before generating a response."
---

Retrieval-Augmented Generation (RAG) improves large language models (LLMs) by first searching an external knowledge base, such as documents or a company's internal library, for information relevant to a user's query. It then provides this retrieved, specific, and up-to-date information as context to the LLM. The LLM uses this context to formulate its answer, rather than relying solely on its pre-trained data. This process grounds the LLM's output in verifiable facts, significantly reducing hallucinations.

RAG matters because it enhances LLM reliability and utility, particularly in professional environments. It allows LLMs to access and incorporate the latest or specialized data not part of their initial training, making responses more current and specific to particular domains. This capability makes LLMs effective for applications requiring high precision and up-to-date knowledge, ensuring outputs align with real-world data and building user trust through identifiable sources.

An e-commerce customer support chatbot uses RAG as a real-world example. When a customer asks about a specific product's warranty, the RAG system queries the company's product database and warranty documentation. It fetches the exact policy for that item and provides this policy to the LLM. The chatbot then generates an accurate answer reflecting the company's current warranty terms, ensuring the customer receives correct information directly from official records.
