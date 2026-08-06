---
term: "Multimodal"
slug: "multimodal"
aliases: ["multi-modal", "multimodal model"]
category: "AI"
definition: "A multimodal model handles more than one kind of input or output — text, images, audio, video — inside a single system rather than by bolting separate tools together."
---

Early language models read text and wrote text. If you wanted one to describe a photograph, you ran the photograph through a separate image-recognition model, turned its output into a sentence, and handed that sentence to the language model. Three systems, and everything the first one failed to notice was lost before the last one saw it.

A multimodal model takes the image itself. Pixels and words are converted into the same internal representation, so the model can reason across them: read the chart in the screenshot, notice the tone of voice in the recording, follow what happens between two frames of video.

## Why one model beats three

The gain is not convenience, it is the detail that survives. A description of an image is a summary, and summarising throws away whatever the summariser did not think was important. When the model sees the original, nothing has been decided on its behalf.

That matters most for the questions people actually ask. "Why does this error screenshot not match my code?" needs the layout of the screen, not a caption of it. "Is this invoice wrong?" needs the numbers in their positions on the page.

## What to check before believing the label

Multimodal is a marketing word as much as a technical one, and products stretch it. Three questions separate the real thing from the assembled version.

**Which directions does it handle?** Many models read images but cannot produce them, and describing that as multimodal is generous.

**Is it one model or a pipeline?** If the audio is transcribed to text first, tone, hesitation and background sound are gone before the model gets involved.

**What is it actually good at?** Reading printed text from a photograph is now routine. Reading a hand-drawn diagram, counting objects reliably, or judging spatial relationships remain weak — often much weaker than the fluency of the answer suggests.

That last gap is the one that catches people out. The model describes your photograph in confident prose and gets the number of items in it wrong.
