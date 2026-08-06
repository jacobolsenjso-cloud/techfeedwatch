---
term: "Training Data"
slug: "training-data"
aliases: ["training dataset", "pre-training data"]
category: "AI"
definition: "Training data is the collection of text, images, or other examples a model learns from — and the single biggest determinant of what it can and cannot do."
---

A model does not contain rules that someone wrote. It contains patterns extracted from examples. Everything it can do traces back to what was in those examples, and everything it cannot do usually traces back to what was not.

For a large language model, the training data is typically hundreds of billions of words: web pages, books, code repositories, forum threads, documentation. The model is shown a passage with the next word hidden, guesses, and is corrected — several trillion times. Nobody labels the data by hand at that scale. The text itself is both the question and the answer.

## Why it decides so much

Three consequences follow, and they explain most of what people find surprising about these systems.

**A model knows nothing after its cutoff.** Training ends on a date. Ask about something that happened afterwards and the model either says so or invents an answer, because it has no way to tell the difference between "I was not taught this" and "this does not exist".

**Bias in the data becomes bias in the output.** If a profession appears overwhelmingly with one gender in the source text, the model reproduces that association. This is not a flaw in the algorithm — the algorithm did exactly what it was asked and learned the pattern that was there.

**Rare things are answered worse.** A topic covered by ten thousand web pages is handled fluently. One covered by three is handled fluently too — that is the problem. The confidence of the writing does not drop with the thinness of the evidence behind it.

## What it is not

Training data is not a database the model looks things up in. After training, the original text is gone; what remains is a very large set of numbers that encode statistical relationships. The model cannot cite where it learned something, and asking it to usually produces a plausible-looking source that does not exist.

Feeding a model documents at the time you ask a question is a different technique — that is retrieval, not training, and the distinction matters when someone claims a system has been "trained on your company data" when it is really searching it.
