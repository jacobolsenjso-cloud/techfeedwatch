---
title: "The Ultimate Guide to Automation"
slug: "ultimate-guide-to-automation"
description: "What 50 videos on automation actually show — that it stopped being about connecting apps and became about agents that decide, and that most of the coverage is about where that breaks."
tags: ["Automation"]
category: "Automation"
date: "2026-07-23"
updated: "2026-08-12"
faqs:
  - question: "What is automation, in one sentence?"
    answer: "Getting a machine to do a task you would otherwise do by hand — historically by following fixed rules you wrote, and increasingly by letting a model work out the steps itself."
  - question: "What changed recently?"
    answer: "The decision moved. Older automation followed rules you specified; an AI agent works out its own sequence. That makes it far more capable and far harder to predict, which is why most of the serious coverage is about limits rather than possibilities."
  - question: "What should I automate first?"
    answer: "Something you already do often, that already annoys you, and that you can describe in writing. If you cannot write down the steps, a machine cannot follow them either — and that is true whether the machine is a script or a model."
  - question: "Will automation replace jobs?"
    answer: "The pattern across the archive is that written-down procedures go first, because a procedure is exactly what a machine can follow. Judgement calls that nobody wrote down are much harder to hand over."
  - question: "What is the most common mistake?"
    answer: "Automating something before measuring it. Without a before, there is no way to tell whether it helped, and you end up arguing about a feeling instead of a number."
---

Automation used to mean connecting one app to another. When this thing happens,
do that thing. You wrote the rules, and the machine followed them exactly —
including when they were wrong.

That is no longer what most of the conversation is about.

Tech Feed Watch has covered 50 videos on automation, from Futurepedia, Y
Combinator, WorldofAI and a range of practitioners. **36 of the 50 are about AI
agents.** Only six are about the workflow tools — Zapier, Make, n8n — that
defined the field for a decade.

And **31 of the 50 discuss failure, limits or risk.** Nearly two thirds. That
ratio is the guide in one line: the field moved from tools that follow
instructions to systems that make decisions, and most of the serious coverage is
about what that costs.

## The two kinds of automation

Almost every disagreement in this field comes from mixing these up, so it is
worth separating them clearly.

**Rule-based automation.** You describe the steps. When an order comes in, copy
these fields into that spreadsheet and send this email. It does exactly what you
said, every time, for years. When the situation changes and your rules do not,
it keeps doing the wrong thing at full speed — but it does it predictably, and
you can read the rules to find out why.

**Agent-based automation.** You describe the goal. The system works out the
steps: search, read a result, call a tool, check whether it is done, try again.
An [AI agent](/glossary/ai-agent) handles situations you never anticipated,
which is the whole appeal. It also means you cannot read the rules afterwards,
because there were none.

The trade is not subtle. Rules are limited and predictable. Agents are flexible
and are not. Most of the mess in the archive comes from people choosing the
second when the first would have done the job.

A useful test: if you can write the steps down, write them down. Reach for an
agent when the number of possible situations is genuinely too large to
enumerate — not when writing them down would just be tedious.

## What people actually automate

Across the 50 videos, four areas come up repeatedly.

**Customer support** — 19 videos. The routine questions, the ones answered
forty times a week in nearly the same words. This is the most common starting
point, and the one with the clearest before-and-after.

**Business operations** — 22 videos. Invoices, quotes, data moved between
systems that were never designed to talk to each other. Unglamorous, and where
most of the hours actually go.

**Marketing and sales** — 12 videos. Follow-ups, lists, campaign tagging. Worth
noting that the failures here are more visible than elsewhere, because the
output goes straight to a customer.

**Development work** — writing scripts, wiring up an [API](/glossary/api),
handling data. The one area where the person automating usually understands
exactly what is happening.

## The 31 videos about it going wrong

More than half the archive. Four patterns come up again and again, and they are
not the ones people expect.

**Automating something nobody measured.** The most common story by a wide
margin. A process gets automated, and afterwards nobody can say whether it
helped, because nobody wrote down how long it took before. You end up defending
a feeling.

**Silent failure.** A rule-based flow breaks loudly — something errors, and you
find out. An agent that misunderstands does not error. It does something
plausible and wrong, confidently, and keeps going. The failures in the archive
are rarely dramatic: a field filled with the wrong value, a summary of a
document that said something else, an email that was slightly untrue.

**The 90 percent trap.** A flow that handles nine cases out of ten sounds
excellent until you meet the tenth. If nobody planned for the exception, it
either sits unnoticed or lands on a person who now has to reconstruct what the
machine was thinking. Handling the last ten percent is usually harder than the
first ninety.

**Counting the licence and not the setup.** The subscription is the cheap part.
The expensive part is the weeks of building it, the testing, and the work that
stopped while people learned. A tool that pays for itself in three months
usually has not counted any of that.

## Keeping an agent on a leash

Since 36 of the 50 videos are about agents, this deserves its own section.

An agent decides what to do next. That is the feature. It is also why the
sensible ones are wrapped in limits that sit *outside* the model, not inside it
— because a system that is confidently wrong cannot be the thing that checks
whether it is wrong. The industry term is [guardrails](/glossary/guardrails),
and in practice it means four things.

**A cap on steps.** Without one, a confused agent will loop, and each loop costs
money and time.

**A budget.** Both in money and in how long it may run before someone looks.

**Approval before anything irreversible.** Sending, publishing, paying,
deleting. Reading is cheap to get wrong; sending is not.

**A log you can read afterwards.** When it does something odd, you need to see
what it tried. This is the one people skip, and the one they miss most.

## About jobs

Twenty of the videos touch what this does to work, and they do not agree. Worth
saying plainly: several of the people making confident predictions are selling
something that depends on which prediction comes true.

The pattern the archive supports best is narrower than either headline. **Work
that was already written down as a procedure goes first** — because a procedure
is exactly what a machine can follow. The parts that resist are the judgement
calls nobody wrote down, because they depend on context, on knowing which rule
to break, and on noticing that this case is unusual.

That is neither reassuring nor alarming. It is a useful way to look at your own
week: which parts could you hand to someone new with a written instruction and
expect a decent result? Those are the parts under pressure first.

## Starting from nothing

If you have automated nothing and want to start sensibly, the archive points at
the same sequence every time.

**Pick something you already do badly or slowly.** Not the most impressive
thing. The most annoying one.

**Time it first.** How long does it take now, how many times a week? Two numbers
on a piece of paper. Without them you will never know whether it worked, and
every later discussion becomes an argument about impressions.

**Write the steps down.** If you cannot describe it in writing, no tool will
manage it either. This step alone often reveals that the process is not what
anyone thought it was.

**Automate the boring middle, not the ends.** Keep a person deciding what goes
in and checking what comes out, at least at first.

**Run both for a while.** The old way and the new way in parallel, long enough
to see the exceptions. They always show up, and they show up late.

**Then compare against your two numbers.** Not against how it feels.

## Small tools that save real time

Not everything needs an agent. A fair share of what people automate is one
tedious step that a browser can handle in a second.

Cleaning up a list of addresses or entries with duplicates in it: the
[duplicate line remover](/tools/remove-duplicate-lines). Changing one recurring
phrase across a long block of text: [find and replace](/tools/find-and-replace).
Reading a machine-generated file that arrived as one unbroken line: the
[JSON formatter](/tools/json-formatter). Tagging campaign links so your analytics
can actually tell them apart: the [UTM builder](/tools/utm-builder).

All of them run inside your browser — nothing you paste is uploaded anywhere.
None of them are impressive. Together they remove more manual minutes from a
normal week than most agent projects do in their first month.

## The short version

Automation stopped being about connecting apps and became about systems that
decide — 36 of 50 videos are about agents, six are about workflow tools. That
makes it far more capable and much harder to predict, which is why 31 of the 50
are about limits rather than possibilities.

If you can write the steps down, write them down and use rules. Save agents for
the cases where you genuinely cannot. Measure before you change anything, keep a
person on the irreversible actions, and expect the last ten percent to take
longer than the first ninety.

Every article behind this guide links to its original video, with the creator
credited. The [Automation tag](/tag/automation) has all 50.

---

*This guide draws on 50 videos covered on Tech Feed Watch, from channels
including Futurepedia, Y Combinator and WorldofAI. The counts quoted — 36 on
agents, 31 on failure and limits, 6 on workflow tools — come from the archive
itself, not from an industry report. Written and maintained by Jacob S. Olsen.
If something here is wrong, the [corrections policy](/corrections) explains how
to tell me.*

*The numbers in this guide are a snapshot of the archive as of July 2026; the archive itself keeps growing.*
