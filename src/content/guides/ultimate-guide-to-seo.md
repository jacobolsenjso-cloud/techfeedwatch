---
title: "The Ultimate Guide to SEO in the AI Era"
slug: "ultimate-guide-to-seo"
description: "What 34 videos from 25 different SEO channels actually agree on, where they disagree, and what to do about AI answers sitting above the results."
tags: ["SEO"]
category: "SEO"
date: "2026-07-23"
updated: "2026-08-06"
faqs:
  - question: "Is SEO dead now that AI answers questions directly?"
    answer: "No, but the payoff moved. Ranking still decides which sources an AI answer is built from, so the work shifts toward being the clearest and most trustworthy source rather than chasing keyword placement. What changed is measurement: a page can influence thousands of answers and see very few clicks."
  - question: "What is GEO, and is it a real discipline?"
    answer: "Generative Engine Optimization means structuring content so AI systems can quote it accurately. It is a real shift, but most of what is sold as GEO expertise is guesswork, because nobody outside the model providers can verify which technique caused a citation."
  - question: "Should I use AI to write SEO content?"
    answer: "For drafting and structure, yes. For publishing unreviewed, that is the most common way sites get themselves demoted. Google's guidance targets content produced primarily to rank rather than to help, and volume without review is exactly that pattern."
  - question: "How long until SEO work shows results?"
    answer: "Technical fixes can move within weeks. Content and authority gains usually take three to six months, because search engines need time to re-crawl and to trust new signals. Anyone promising faster on a new site is selling something."
  - question: "Do keywords still matter?"
    answer: "As a map of what people search, yes. As text to repeat, no. Ranking systems match meaning now, so a page can rank for phrasings it never contains and fail on the exact phrase it repeats."
---

Search changed shape in about eighteen months. AI-generated answers now sit above the results, assembled from sources the reader may never click. Every SEO channel has an opinion about what that means, and most of them are selling something.

This guide is built differently. Tech Feed Watch has covered 34 videos about search from 25 different channels — agency owners, developers, Google's own Search Central, and independent consultants. What follows is what they converge on, where they genuinely disagree, and what is worth doing about it.

The short version: the fundamentals did not change, the measurement did, and the largest risk right now is not being left behind by AI search. It is publishing so much unreviewed AI content that you get demoted for it.

## What 34 videos actually agree on

Reading across the whole set, the surprise is not the disagreement. It is how much the advice converges — including from sources with opposite commercial interests.

**The loudest topic is AI search, by a wide margin.** Generative Engine Optimization or Answer Engine Optimization appears in the title of six of the 34. AI Overviews in three more. Roughly a quarter of everything published about search in this period is about the same shift.

**And the most common conclusion is that it rewards ordinary SEO done properly.** One video is titled, more or less directly, that you should ignore the AI hacks and use standard SEO. Google's own channel says the same thing in more diplomatic language. Several agency channels — who would profit from selling a new discipline — arrive there too.

**The second cluster is technical, and it is aimed at developers.** Core Web Vitals, HTML and XML fundamentals, site speed, the relationship between engineering and search. This is the part that is unglamorous and keeps working.

**The genuine disagreement is about automation.** Several videos advocate AI-generated content at scale as a competitive advantage. Several others, sometimes in the same week, warn that it is how sites destroy themselves. Both positions are argued by people with real experience. This guide takes a side, and says so below.

## Part one: what did not change

### Search still rewards being the best answer

Google ranks on relevance, quality and trust. What shifted is how trust gets measured. The signals grouped under E-E-A-T — experience, expertise, authoritativeness, trustworthiness — carry more weight, particularly on subjects that affect money or health.

In practice this means two things that are easy to say and hard to do. Pick subjects you can genuinely cover better than the alternatives, which usually means fewer subjects than you would like. And make it obvious who is behind the work: a named author with a real background, reachable, with a history on the topic.

The sites that struggle most are the ones with no visible owner. That is not a penalty; it is the absence of a signal that other sites have.

### Match the intent, not the phrase

Two people searching the same words can want opposite things. "Running shoes" is either *help me choose* or *sell me a pair*, and a page built for one will not satisfy the other however often it repeats the phrase.

Search engines settle this by watching what people click and stay on. So intent is not something you decide about your page — it was decided by everyone who searched before you.

The check takes one minute and prevents the most common wasted effort in SEO. Search the term. Look at what already ranks. If the first page is entirely comparison articles, a product page will not rank there, no matter how well optimised, because the engine has already concluded what the query means.

Write for the question rather than the phrase, then confirm the answer arrives near the top of the page. Intent includes expectations about speed: someone searching a definition wants it in the first sentence, and making them scroll past an introduction is a failure to match intent even when the content is correct.

### On-page work that still moves rankings

Give every page one job. A page trying to rank for four unrelated things ranks for none.

Write a title that states the answer rather than the topic. "How to fix Core Web Vitals on a WordPress site" beats "Core Web Vitals: A Guide". Keep it under about 60 characters or the end gets cut in results — our [SERP snippet preview](/tools/serp-preview) shows where the cut lands before you publish.

Put the direct answer near the top, then support it with depth. Use headings a reader could scan and still understand. Link related pages to each other so both readers and crawlers can see how your content connects — internal linking is the most underused lever most sites have, and it costs nothing but attention.

None of this is new. All of it still works.

Two checks before you publish. Run the text through the [readability checker](/tools/readability-checker) — not to hit a target score, but because a page that scores badly is usually one where the sentences got away from the writer, and that is worth knowing before a reader finds out. And run the [keyword density tool](/tools/keyword-density) once, for the opposite reason to the one it was invented for: not to reach a percentage, but to confirm you have not repeated a phrase so often that it reads as written for a machine.

## Part two: the technical foundation

This is the section the developer-facing videos in our archive keep returning to, and it is where most sites have the largest gap between what they think is true and what is actually deployed.

### Speed and Core Web Vitals

A page that loads slowly loses before content matters. Core Web Vitals measure three things: how quickly the main content appears, how quickly the page responds to a tap, and how much the layout jumps around while loading.

The third one is the most often ignored and the most infuriating to users — the button that moves as an advert loads above it. Reserving space for images and embeds fixes most of it, and it is usually an afternoon of work rather than a project.

Images are the single most common cause of a slow page, and almost always the easiest to fix: most sites are serving photographs several times larger than the space they appear in. The [image compressor](/tools/image-compressor) will show you how much a file actually needs to weigh.

While you are in the templates, check colour contrast with the [contrast checker](/tools/contrast-checker). Poor contrast is an accessibility failure first, and a measurable engagement problem second — people leave pages they find hard to read, and that behaviour feeds back into rankings.

Test on a mid-range phone on mobile data, not on your laptop on office wifi. That is the experience most of your visitors actually have.

### Structured data

Schema markup tells a search engine what a page *is* — an article, a FAQ, a product, a video — rather than leaving it to infer. It is also what helps AI systems quote you correctly, which makes it more valuable now than it was two years ago, not less.

Three practical notes from doing this on this site:

**Nested objects count as separate items.** A typed object inside another one is validated on its own. An incomplete one there will be reported as an invalid item even though the outer object is perfect — and you will not see it by looking at the top level.

**Never invent a rating.** An `aggregateRating` on a page with no reviews is a fabricated signal, and Google treats fabricated structured data far more harshly than missing structured data.

**Test more than one page type.** Google's Rich Results Test checks one URL at a time, so a fault present on every article page looks identical to a fault on one.

Generate it with the [schema markup generator](/tools/schema-generator), and use the [video schema generator](/tools/video-schema) if you publish video, since that has its own required fields. If a block is rejected and you cannot see why, run it through the [JSON formatter](/tools/json-formatter) first — a trailing comma or an unescaped quote breaks the whole block, and the error messages are not helpful about which.

### The unglamorous rest

Clean, readable URLs — the [slug generator](/tools/slug-generator) handles the accents and punctuation that break them. Correct meta tags, which the [meta tag generator](/tools/meta-tag-generator) will produce in full. Open Graph tags so shared links do not look broken, via the [Open Graph generator](/tools/open-graph-generator). A sane [robots.txt](/tools/robots-txt-generator). And if you publish in several languages, [hreflang tags](/tools/hreflang-generator), which are easy to get subtly and expensively wrong.

Every one of those tools runs in your browser. Nothing you paste is uploaded.

## Part three: the shift to AI answers

Here is the honest framing, which is rarer than it should be.

When someone asks an AI assistant a question, the answer is assembled from sources and often shown without a click. Traditional SEO competes for a position in a list. [Generative engine optimization](/glossary/generative-engine-optimization) competes to be one of the sources the answer is built from.

That matters because the click may never happen. A page can influence thousands of answers and see almost none of that traffic — which breaks the measurement most SEO work is built around, and explains why traffic can fall while visibility rises.

### What appears to help

These are reasonable inferences, not established rules. The systems are opaque, the field is young, and much of what is sold as GEO expertise is guesswork with an invoice attached.

**Answer the question early and plainly.** A system extracting a claim takes a clear sentence over a paragraph that circles the point.

**Make claims attributable.** Specific, checkable statements are easier to quote than general assertions, and quoting is the whole mechanism.

**Structure the page.** Clear headings, question-shaped subheads, a definition near the top. These give a retrieval system obvious units to pull.

**Be current.** Systems favour recent sources for anything time-sensitive, and more topics are time-sensitive than people assume.

### What has not changed

The underlying requirement is what it always was: say something true, specific, and not available in the same form on a hundred other pages. A model summarising ten interchangeable pages cites whichever it happened to retrieve. A page with a number, a method or a first-hand observation gives it a reason to choose yours.

Which is why the conclusion most of our 34 videos reach is the unexciting one. GEO is not a separate discipline you bolt on. It is what good SEO looks like when the reader is a model.

Be sceptical of anyone selling a specific GEO technique. Nobody outside the model providers can currently verify that any technique caused a citation, and a claim that cannot be tested is not a finding.

## Part four: the automation question

This is where the archive genuinely splits, so it deserves a straight answer rather than a summary of both sides.

The case for automation is real. AI drafts faster than any writer, covers more ground, and lets a small team compete on volume with a large one. Several agency channels demonstrate exactly this, with results.

The case against is also real, and it is more specific than "AI content is bad". Google's guidance does not target how content was produced. It targets content produced primarily to rank rather than to help. Volume without review is that pattern almost by definition — and the failure is not gradual. Sites lose most of their traffic in a single update, and recovery takes months when it happens at all.

### Where the line actually sits

Three questions decide it, and they are worth answering honestly before publishing anything at scale.

**Does a person read it before it goes live?** Not approve it — read it. This is the single largest difference between the sites that survive and the ones that do not.

**Does the page contain anything that was not already on the internet?** A restatement of ten existing pages adds nothing a reader or a model could not get elsewhere. An original number, a test you ran, an observation from your own work is what makes the page worth retrieving.

**Would you put your name on it?** Sites hide authorship precisely when the answer is no, and that absence is itself a signal.

### The disclosure question

If AI is substantially involved in producing your content, say so somewhere a reader can find it. Google does not require this. It costs a little trust with some readers and earns more with others.

The practical argument is simpler than the ethical one: a site that describes its own process accurately can be corrected when it is wrong. A site that implies an editorial process it does not have has to keep implying it, and the gap tends to show up eventually in the writing.

## Part five: measuring what actually matters

Rankings and organic traffic remain the baseline, but three other things now carry more information.

**Which pages earn links and mentions.** Authority spreads from those, and they are the pages worth building more of.

**Whether you appear in AI answers.** Ask the assistants questions you should be the answer to and see what they cite. It is crude, it is manual, and it is currently the only reliable check available.

**Engagement after arrival.** If visitors land and leave immediately, the page did not deliver what the title promised, and rankings follow that behaviour down.

For campaign traffic, tag your links properly with the [UTM builder](/tools/utm-builder) — inconsistent tagging is the most common reason analytics cannot answer which channel actually worked.

## The mistakes that cost the most

**Publishing at volume without review.** Covered above, and it is first for a reason. It is the fastest way to lose a site.

**Writing for the keyword instead of the question.** Ranking systems match meaning. A page can rank for phrasings it never contains and fail on the exact phrase it repeats twelve times.

**Treating the title as a promise you do not keep.** A page called an ultimate guide that takes four minutes to read teaches every visitor to distrust your titles. Deliver on it or rename it.

**Leaving your own assets unlinked.** Most sites have something genuinely useful — a tool, a dataset, a calculator — buried in a menu and mentioned nowhere in the content where it would help. That is free relevance being thrown away.

**Chasing an update instead of fixing the cause.** Every core update produces a wave of tactical advice. The sites that recover are usually the ones that improved the thing the update was measuring, not the ones that found a workaround.

**No named human anywhere.** For anything touching money or health, this alone can hold a site back regardless of content quality.

## Where to go next

If you have one afternoon: check what actually ranks for your five most important queries, and confirm your pages match that intent. It is the cheapest correction available and it invalidates a surprising amount of existing work.

If you have one week: fix Core Web Vitals on your templates, add correct structured data, and link your best pages to each other properly.

If you are planning for the next six months: pick a narrower subject than feels comfortable, cover it more thoroughly than anyone else, and put a name on it.

---

*This guide draws on 34 videos about search covered on Tech Feed Watch, from 25 channels including Google Search Central, Fireship, and a range of independent agencies and consultants. Every article links to its original video — the [SEO tag](/tag/seo) has the full set. Written and maintained by Jacob S. Olsen. If something here is wrong, the [corrections policy](/corrections) explains how to tell me.*

*The numbers in this guide are a snapshot of the archive as of July 2026; the archive itself keeps growing.*
