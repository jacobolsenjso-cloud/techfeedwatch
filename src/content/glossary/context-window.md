---
term: "Context Window"
slug: "context-window"
aliases: ["context length", "context limit"]
category: "AI"
definition: "The context window is how much text a model can hold in view at once — the conversation, the documents, the instructions and its own reply, all counted together."
---

A model has no memory between requests. Everything it appears to remember was sent to it again, as text, in the current request. The context window is the ceiling on how much can be sent.

It is measured in tokens rather than words — roughly three-quarters of a word each in English, less for code and for languages that do not use the Latin alphabet. A 200,000-token window is somewhere around 150,000 words, which sounds enormous until you attach a codebase to it.

## What happens at the edge

Something has to go, and which thing depends on the product rather than the model. Most chat interfaces silently drop the oldest messages. This is why a long conversation can start contradicting an instruction you gave at the beginning: the instruction is no longer in the window, so from the model's point of view it was never given.

Filling the window also has two costs people underestimate. Every token is paid for on every request, so a large document attached to a long conversation is charged again each time you send a message. And latency rises with length, because the attention mechanism has more to compare.

## Big windows are not the same as good recall

Models score worse on information buried in the middle of a long context than on the same information near the start or end. The effect is well documented and it means a million-token window does not guarantee the model will use what is in the middle of it.

The practical consequence: give the model what is relevant rather than everything available. Retrieval — searching first, then sending the few passages that matter — usually beats attaching the whole document, and costs a fraction as much.

This is also the difference between a system that has been given your data and one that was trained on it. The window is temporary; training is permanent.
