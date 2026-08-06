---
term: "AI Agent"
slug: "ai-agent"
aliases: ["AI agents", "agentic", "agentic AI", "autonomous agent"]
category: "AI"
definition: "An AI agent is a system that uses a language model to pursue a goal across multiple steps, deciding for itself which tools to call and when it is done."
---

The difference between a chatbot and an agent is who decides what happens next. A chatbot answers what you asked and stops. An agent is given an objective — "find the cheapest flight and book it", "fix this failing test" — and then chooses its own sequence of actions: search, read a result, call a tool, check whether the goal is met, try again. The model is the same underneath. The loop around it is what makes it an agent.

That loop needs three things. It needs tools it can call, which might be a web search, a database, a code editor, or another program's API. It needs memory of what it has already tried, so step four knows what step two returned. And it needs a way to judge whether it is finished, which in practice is the hardest of the three.

## Why the distinction matters

An agent's usefulness and its risk come from the same property: it acts without being asked each time. A chatbot that misunderstands you wastes a message. An agent that misunderstands you can spend twenty minutes and a hundred tool calls going the wrong way, and every step after the mistake is built on it.

This is why serious agent systems put limits around the loop rather than inside the model — a cap on steps, a budget, an approval before anything irreversible. The model does not reliably know when it is wrong, so the guardrails have to sit outside it.

"Agentic" is the adjective you will see attached to almost anything in 2026. Used precisely it means the system makes its own decisions about sequence and tool use. Used loosely it means a product has a for-loop in it.

## In practice

A coding agent given a bug report will read the error, search the codebase, form a hypothesis, edit a file, run the test suite, read the failure, and try again — often five or six cycles before it either fixes the problem or gets stuck. Nobody typed those steps. That autonomy is the whole point, and it is also why the sensible ones ask before pushing to production.
