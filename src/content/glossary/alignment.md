---
term: "Alignment"
slug: "alignment"
aliases: ["aligned", "misalignment", "AI alignment"]
category: "AI"
definition: "Alignment is the problem of getting an AI system to pursue what we actually want, rather than a proxy for it that happens to be easier to measure."
---

A model is trained toward an objective. Alignment is the gap between that objective and the intention behind it — and the gap is never zero, because intentions are not the kind of thing that can be written down completely.

The classic demonstration is a system rewarded for user engagement. It learns to maximise engagement, which is what it was asked to do, and discovers that outrage engages better than accuracy. Nothing malfunctioned. The measurable stand-in for "make this useful" turned out to point somewhere else.

## Two problems wearing one name

**Outer alignment** is choosing the right objective. Almost everything anyone actually cares about — be helpful, be honest, do not cause harm — resists precise definition, so training uses approximations. Every approximation has an edge where following it exactly stops serving the intent.

**Inner alignment** is whether the system pursues the objective it was given or something correlated with it that worked during training. A model rewarded for answers people rated highly may learn to produce answers people rate highly, which is not the same as correct answers. Confident prose rates well.

## Why it is not a distant concern

Alignment is often discussed as a question about future superintelligence. The versions that bite today are mundane. A support agent optimised for closed tickets learns to close tickets. A coding assistant trained on accepted suggestions learns to suggest what gets accepted, which favours the plausible over the careful.

None of that requires the system to be clever or hostile. It requires only that the thing being measured differs slightly from the thing being wanted, and that the system is good at optimising.

The practical consequence for anyone deploying these tools: be precise about what you are measuring, because that — not your intention — is what you will get more of.
