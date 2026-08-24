---
title: "The Ultimate Guide to Coding with AI"
slug: "ultimate-guide-to-ai-coding"
description: "What 36 videos from Fireship, Modern Software Engineering and Y Combinator actually say about AI writing code — where it helps, where it costs, and what it does to learning the job."
tags: ["Coding"]
category: "Coding"
date: "2026-07-23"
updated: "2026-08-12"
faqs:
  - question: "Does AI actually make developers faster?"
    answer: "For code you already know how to write, usually yes. For code you do not understand, it produces something that looks finished, which is a different thing from being faster. The archive is clear that the gains are real and narrower than the marketing."
  - question: "Should a beginner learn to code now?"
    answer: "The archive leans yes, with a change in emphasis. Typing code was never the hard part; deciding what to build and recognising when something is wrong is, and that is now the whole job rather than half of it."
  - question: "What is vibe coding?"
    answer: "Accepting AI-generated code without fully understanding it because it appears to work. It ships quickly and creates debt that lands on whoever maintains it — often the same person a few months later."
  - question: "Is AI-generated code secure?"
    answer: "Not by default. It reproduces patterns from its training data, including insecure ones, and it will do so with complete confidence. Generated code needs the same review as code from a stranger."
  - question: "Will AI replace programmers?"
    answer: "The archive's clearest pattern is that the work shifts rather than disappears — from writing code to specifying, reviewing and orchestrating it. That is a real change in what the job feels like day to day."
---

Something unusual shows up when you count what developers are actually talking
about. Tech Feed Watch has covered 36 videos on coding, from Fireship, Modern
Software Engineering, Y Combinator, NetworkChuck and others.

**16 of them are about careers, skills and learning.** More than any specific
technology. Eleven are about AI writing code.

That ratio is the story. The dominant question in software right now is not
which framework to use. It is what the job becomes when the typing is handled
for you — and whether the path into it still works.

## Where AI genuinely helps

The archive is not sceptical about the tools. It is specific about when they
work.

**Code you could have written yourself, faster.** Boilerplate, a familiar
pattern in an unfamiliar language, the fiddly bits of a form. You know what
correct looks like, so you catch the wrong version immediately. This is where
nearly all the reported gain comes from.

**Understanding code someone else wrote.** Asking what a function does, or why
a build fails, is often faster than reading it cold. The answer is a starting
point rather than a verdict, but it is a good starting point.

**The first draft of something tedious.** Tests, a migration script, converting
data from one shape to another. Work that is well-defined and boring is exactly
what these tools are good at.

**Getting unstuck.** Not the answer — a direction. Several sources describe this
as the underrated one, because being stuck costs far more time than typing does.

## Where it costs

**Code you do not understand.** This is the whole risk in one sentence. Generated
code that appears to work is not the same as code that works, and the difference
surfaces later, usually under pressure. The archive has a name for accepting it
anyway: vibe coding.

**Security.** These models reproduce patterns from what they were trained on,
including the insecure ones, and they do it with total confidence. Generated
code deserves the same review you would give code from a stranger — because
that is what it is.

**Confident wrongness.** A model does not know when it is guessing. It will
invent a function that does not exist, an option that was never in the library,
an approach that has been deprecated for years, and describe all of it in the
same tone as the parts that are right.

**Debt that arrives quietly.** Faster shipping with less understanding is a
trade, not a win. It comes due when something breaks and nobody in the room can
explain the code — including whoever accepted it.

## Working with it sensibly

Six habits come up repeatedly across the sources.

**Read everything before you accept it.** If you cannot say what a block does,
you are not reviewing it, you are hoping.

**Give it the context it needs.** Most poor output is a poor question. The
[context window](/glossary/context-window) is finite, so what you leave out
matters as much as what you put in.

**Ask for the approach before the code.** A wrong plan produces a hundred lines
of wrong code, and the plan is faster to check.

**Keep the tests yours.** Tests generated from the same misunderstanding as the
code will confirm the misunderstanding.

**Use it hardest where you are strongest.** That is the opposite of the
instinct, and it is what the archive supports: you catch the mistakes fastest in
your own territory.

**Commit in small pieces.** When something breaks, you want to know which
suggestion caused it.

## The career question

Sixteen of the 36 videos are about careers, skills and learning — more than any
technical subject. Worth saying plainly that the people answering have interests
in the answer, on both sides.

The pattern the archive actually supports is narrower than either headline.

**The typing was never the hard part.** Deciding what to build, breaking it into
pieces, noticing that something is subtly wrong — that was always the job.
Generating syntax is the part that got cheap.

**Which makes review the core skill.** If a model produces code faster than you
can read it, the reading becomes the bottleneck. The developers described as
getting the most out of these tools are the ones who read fastest and trust
least.

**The path in got stranger, not closed.** The traditional route was to write a
lot of simple code until the patterns became instinct. If that code is now
generated, the practice has to come from somewhere else: reading, breaking
things on purpose, and building without help until it hurts. Several sources
worry about this openly, and none of them claim to have solved it.

**Specifying is becoming its own skill.** Describing what you want precisely
enough that a machine produces it is close to programming, just in a different
language. That is not a smaller job — it is the same judgement with different
typing.

## A note for people learning right now

If you are starting out, the archive points at one uncomfortable piece of
advice: **turn the assistant off sometimes.**

Not out of principle. Because the skill you need is recognising when something
is wrong, and you cannot build that by watching correct-looking code appear. You
build it by getting it wrong yourself and finding out why.

Use the tools for work you understand. Do the learning without them. It is
slower, and that is the point — the slowness is where the understanding comes
from.

## Small things that save time

Not everything needs a model. A few of these come up constantly in development
work, and they run entirely in your browser:

Reading a machine-generated response that arrived as one unbroken line — the
[JSON formatter](/tools/json-formatter). Encoding or decoding a token, a config
value or a small file — the [Base64 and URL encoder](/tools/encoder-decoder).
Changing one recurring string across a block of text —
[find and replace](/tools/find-and-replace). Splitting a file too large to send
— [split a file](/tools/split-file), and the pieces rejoin with `cat` or
`copy /b` without any tool at all.

## The short version

The loudest question in software is not technical. Sixteen of 36 videos are
about careers and skills, eleven about AI writing code.

The tools genuinely help with work you already understand, and genuinely cost
you when they are used on work you do not. Review became the core skill, because
generation stopped being the bottleneck. And if you are learning, the fastest
route still runs through doing it the slow way often enough to recognise wrong
when you see it.

Every article behind this guide links to its original video, with the creator
credited. The [Coding tag](/tag/coding) has all 36.

---

*This guide draws on 36 videos covered on Tech Feed Watch, from channels
including Fireship, Modern Software Engineering, Y Combinator and NetworkChuck.
The counts quoted come from the archive itself, not from an industry survey.
Written and maintained by Jacob S. Olsen. If something here is wrong, the
[corrections policy](/corrections) explains how to tell me.*

*The numbers in this guide are a snapshot of the archive as of July 2026; the archive itself keeps growing.*
