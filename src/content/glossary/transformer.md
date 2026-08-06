---
term: "Transformer"
slug: "transformer"
aliases: ["transformer architecture", "attention mechanism"]
category: "AI"
definition: "The transformer is the neural network design behind essentially every modern language model — its key idea being that each word is interpreted in the light of every other word at once."
---

Earlier language models read a sentence in order, one word at a time, carrying a running summary forward. That summary was a bottleneck: by the end of a long paragraph, the beginning had faded, and nothing could be processed in parallel because each step waited for the last.

The transformer, introduced in 2017, dropped the sequence. Every word looks at every other word simultaneously and decides which ones matter for interpreting it. In "the trophy did not fit in the suitcase because it was too large", the model weighs "it" against both nouns and settles on the one the sentence supports. That weighing is **attention**, and it is the whole idea.

## Why this one change mattered so much

Two consequences, and the second is the one that reshaped the industry.

**Long-range context became possible.** Meaning that depends on something twenty sentences earlier survives, because there is no summary being squeezed along the way.

**Training became parallel.** Every position can be computed at once, which means training scales across thousands of GPUs. The previous designs could not use that hardware, and hardware turned out to be the constraint that mattered. Models grew by orders of magnitude in a few years, not because anyone found a better learning theory but because a design appeared that could absorb the compute.

## What it does not do

The transformer is a mechanism for weighing relationships between tokens. It contains no model of the world, no memory between conversations, and no notion of truth. Everything it appears to know came from the training data and lives in the weights.

The design has also proved general beyond text. Images, audio and protein structures are all now handled by transformers, which is why the same architecture name keeps appearing in fields that have nothing to do with language.
