---
term: "Guardrails"
slug: "guardrails"
aliases: ["guardrail", "safety filter"]
category: "AI"
definition: "Guardrails are the checks placed around an AI system to constrain what it can output or do — sitting outside the model, because the model cannot reliably police itself."
---

A language model has no separate faculty that reviews its own output before releasing it. It produces the next word, then the next. Whatever restraint it shows comes from training, and training shapes tendencies rather than guarantees. Guardrails are the layer added around that.

They come in three rough kinds.

**Input filters** inspect the request before it reaches the model, blocking prompts that match known attack patterns or forbidden categories.

**Output filters** inspect the answer before the user sees it, and can block or rewrite it. This is the layer that catches a model that has been talked into something.

**Action limits** apply to systems that do things rather than only say things: an agent may search freely but not send email, spend money, or delete a file without approval. For anything with consequences, this is the layer that matters.

## Why they sit outside the model

Because the failure being guarded against is the model being wrong while sounding right. A check that runs inside the same system that made the mistake inherits the mistake. A separate check does not.

This also explains why guardrails are so often bypassed in exactly the same way: the attacker gives the model a frame — a story, a hypothetical, a translation task — in which the forbidden output is not obviously forbidden. The input filter sees a story. The model answers the story.

## The honest limitation

Guardrails reduce failure rates. They do not produce guarantees, and a vendor claiming otherwise is describing a wish. Their value is that the remaining failures tend to be caught before doing damage, which is a different and more achievable goal than never failing.

Tight guardrails also refuse legitimate requests. Every deployment ends up choosing where on that trade-off to sit, and being explicit about the choice beats pretending it does not exist.
