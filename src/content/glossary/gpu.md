---
term: "GPU"
slug: "gpu"
aliases: ["GPUs", "graphics processing unit", "accelerator"]
category: "Hardware"
definition: "A GPU is a processor built to run thousands of simple calculations at once, which is why it became the hardware artificial intelligence runs on."
---

A CPU is designed to do one thing after another, very fast, and to handle whatever that thing turns out to be. A GPU is designed to do the same simple operation on thousands of numbers simultaneously. It is worse at almost everything a CPU is good at, and vastly better at the narrow case.

That narrow case happens to be exactly what neural networks are made of. Training a model is, underneath the terminology, an enormous number of multiplications and additions arranged in grids — the same operation repeated across millions of values with no dependency between them. That is the one shape of problem a GPU was built for, and it had been built for it years earlier, for drawing 3D graphics.

## Why this became a strategic issue

The coincidence turned a components market into a geopolitical one. When the hardware that trains frontier models comes from essentially one company, and the chips are manufactured in one region, the supply chain becomes a lever — which is why export controls on chips have become foreign policy rather than trade policy.

It also shapes the economics of AI companies more than software costs do. Training a large model is a capital expense measured in tens of thousands of GPU-months. Running it afterwards — inference — is a smaller cost per request but never stops, and at scale that is the number that decides whether a product makes money.

## Terms you will meet nearby

**VRAM** is the memory attached to the GPU. It is usually the binding limit for running a model locally: a model that does not fit in VRAM either runs very slowly or does not run at all.

**TPU** is Google's own chip, built for the same job. **NPU** is the small accelerator now appearing in laptops and phones for running modest models on the device.

The practical upshot for anyone running AI locally is simple: the amount of memory on the card matters more than the speed of the card, and that is the opposite of what the marketing emphasises.
