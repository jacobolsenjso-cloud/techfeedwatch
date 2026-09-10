---
term: "MCP"
slug: "mcp"
aliases: ["Model Context Protocol", "MCP server", "MCP servers", "MCP client"]
category: "AI"
definition: "MCP, the Model Context Protocol, is an open standard that lets an AI model connect to outside tools and data — files, databases, browsers, other apps — through one common plug instead of a custom integration for each."
---

Before MCP, giving an AI assistant access to your calendar, your codebase or your company's database meant someone writing bespoke glue code for that one combination of model and tool. Every new tool needed a new integration, and every new model needed them all again. MCP replaces that with a protocol: a tool publishes what it can do in a standard format, and any model that speaks the protocol can discover those abilities and call them.

The pieces are an MCP server, which wraps a tool or data source and describes its capabilities, and an MCP client, usually built into the AI application, which connects to servers and lets the model use them. A server might expose "search my files", "run this query" or "open this web page". The model decides when to call what, based on the descriptions, and the client carries the request and the result back and forth.

## Why it matters

The value of an AI assistant is capped by what it can reach. A model that can only see the text in the chat box can advise; a model that can read your data and act on your systems can do the work. MCP is what made that practical at scale, and it is the reason the same assistant can be plugged into a developer's editor one day and a sales team's CRM the next without either vendor building for the other.

It is also where much of the risk now lives. A server that can read files can read the wrong files. A model that can act can be tricked into acting by text it reads along the way, which is the prompt injection problem in a new suit. The protocol handles connection, not judgement, so the questions about what a given server is allowed to touch, and whether a human approves before anything irreversible, sit with whoever configures it.

## In practice

MCP is often compared with "skills" or plugins. The rough distinction: MCP gives a model access to a capability, while a skill tells the model how and when to use capabilities well. The articles on this site that weigh the two are really asking which problem you have — reach, or judgement.
