---
term: "Benchmark"
slug: "benchmark"
aliases: ["benchmarks", "eval", "evals"]
category: "AI"
definition: "A benchmark is a fixed set of test questions used to compare AI models — useful for tracking progress, and routinely over-read as a measure of usefulness."
---

Every model launch comes with a table of scores. The scores are real measurements. What they measure is narrower than the announcement implies.

A benchmark is a frozen set of problems with known answers. Because it is frozen, results are comparable across models and over time, which is exactly what makes it valuable and exactly what makes it decay.

## The three ways scores mislead

**Contamination.** Benchmarks are published, so they end up in the training data of the next model. A high score can mean the model solved the problem or that it saw the answer. Telling those apart from the outside is close to impossible, and the effect is largest on the oldest, most-cited benchmarks.

**Optimisation.** Once a number decides funding and headlines, it stops being a neutral measurement. Effort flows toward what is measured, and a model can climb a leaderboard without becoming more useful for anything anyone does.

**Distance from real work.** Benchmarks test isolated problems with clean inputs and one correct answer. Actual tasks are ambiguous, arrive with messy context, and have several acceptable answers. A model can be excellent at the first and unreliable at the second.

## Reading a comparison honestly

Small gaps are noise. Two points between models means nothing without knowing the run-to-run variation, which is rarely published.

Prefer newer benchmarks and ones where the test set is held back, because contamination has had less time to work. Prefer results on the kind of task you care about over a general average, since an average across twenty benchmarks hides which twenty.

And treat your own evaluation as the one that counts. A handful of real examples from your own work, run through two models, tells you more about which to use than any leaderboard — that is what the industry means by **evals**, as distinct from benchmarks.
