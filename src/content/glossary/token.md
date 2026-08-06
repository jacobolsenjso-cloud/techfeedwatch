---
term: "Token"
slug: "token"
aliases: ["tokens"]
category: "AI"
definition: "In artificial intelligence, particularly large language models, a token is a fundamental unit of text or data that a model processes."
---

AI models, especially those designed for natural language processing, break down input text into tokens. These tokens can represent individual words, parts of words (subwords), punctuation marks, or even single characters, depending on the specific tokenization method employed. This conversion into discrete numerical tokens allows models to understand and manipulate human language effectively, as they operate on numerical data rather than raw text.

Tokens are essential because they form the atomic units from which models learn patterns, relationships, and context within vast datasets. The model learns to predict the next most probable token in a sequence, enabling it to generate coherent and contextually relevant text. The number of tokens a model can process at once defines its "context window," impacting its ability to understand longer passages or conversations. Processing tokens also directly influences computational resources, memory usage, and the overall speed of inference, as each token carries a computational cost. Models often have a maximum token limit for both input and output.

For example, when a user inputs the sentence "The quick brown fox jumps." into an AI chatbot, the model first tokenizes it. This might result in tokens like ["The", " quick", " brown", " fox", " jumps", "."]. Each of these individual units is then converted into a numerical representation (an embedding) that the model can process through its neural network layers to comprehend the query and formulate an appropriate response.
