---
date: 2026-03-24
layout: post
layer: signal
---

## I run 10 MCP servers. I also type `git push` in a terminal.

Last month Eric Holmes published a viral post called "MCP is dead, long live the CLI." It got a lot of traction. People nodded along. Perplexity's CTO jumped in, claiming 72% context waste from MCP. Google shipped a CLI for Google Workspace and then *removed* the MCP server from it because 200-400 tools were bloating context windows into oblivion.

And here I am, running Claude Code with Slack, Atlassian, Storyblok, Toggl, and Playwright all connected via MCP — alongside `gh`, `gws`, and plain old `git` in the terminal. Both. At the same time. Every day.

So who's right? Is MCP dead? Is CLI the future? Neither. The question is wrong.

## The context window is the bottleneck, not the protocol

Here's the thing nobody talks about when they wave around scary numbers. The Scalekit benchmarks showed MCP has 4-32x token overhead compared to CLI. That sounds damning until you actually think about *why*.

CLI tools like `git` and `gh` are already in the LLM's training data. The model knows what `git status` does. It doesn't need a JSON schema describing every parameter. That's not CLI being "better" — that's a lucky accident of what was in the training corpus.

MCP tools? The model has never seen your company's Storyblok CMS schema. It *needs* those tool descriptions. The overhead isn't waste — it's necessary information.

Google learned this the hard way. Their Workspace MCP server had 200-400 tools. That's not an MCP problem. That's a "you tried to stuff an entire API surface into a context window" problem. They could have done the same thing with a 400-subcommand CLI and the model would still choke.

Anthropic actually solved this in January with Tool Search — lazy loading that cuts token overhead by ~85%. Cloudflare built "Code Mode" that compressed 2,500 endpoints from 244K tokens down to ~1,000. But here's the kicker: they built it *on top of* MCP. The protocol isn't the bottleneck. Bad tool design is.

## The "MCP is insecure" argument (and why CLI is worse)

43% of MCP servers have command injection vulnerabilities. 53% have insecure credential handling. Those are real numbers and they're bad.

But let me ask you something. What's the security model of a CLI tool that an AI agent calls via `bash`? There isn't one. It's full shell access. Trail of Bits demonstrated prompt injection leading to remote code execution through CLI tools. At least MCP has a *concept* of authentication and scoped permissions. CLI is just... vibes and trust.

"But I trust my terminal!" Sure. *You* do. Now imagine deploying this to a team of 50 engineers. Or exposing it to customers. CLI security is "works on my machine" energy applied to auth.

## The three layers that are actually emerging

After a few months of watching this play out — and using both approaches daily — I think the real pattern is three layers, not two:

**Layer 1: CLI/Bash.** For local dev tools that are already in training data. `git`, `gh`, `npm`, `gws`. Single-user, local machine, the model already knows the interface. This is where CLI wins and it wins hard.

**Layer 2: Skills/behavioral guidance.** This is the underrated middle layer. Claude Code has AGENTS.md files and skills that load context on demand. Not a tool call — more like "here's how to think about this domain." It's the connective tissue between raw CLI commands and structured APIs.

**Layer 3: MCP.** Multi-tenant auth, remote tool access, enterprise governance. When I need to read Slack channels, create Jira tickets, or manage Toggl time entries from inside my AI workflow — MCP is the only game in town. No CLI covers that surface area with proper auth.

The mistake is thinking you have to pick one. You don't.

## The numbers tell a different story than the vibes

Here's what I find funny about the "MCP is dead" narrative. The MCP servers repo has 81,919 GitHub stars. Monthly SDK downloads crossed 97 million. There are 17,000+ registered servers. The protocol was donated to the Linux Foundation in December 2025 with OpenAI, Google, Microsoft, AWS, Cloudflare, and Block as founding members of the governance body.

That 72% context waste number that Perplexity's CTO cited? It came from Apideck. A company that *sells an alternative to MCP*. I'm not saying it's wrong — there's real overhead — but maybe don't base your architectural decisions on your competitor's marketing benchmarks.

Slack took 15 months to ship their official MCP server. That's not fast. But they shipped it. And now I use it every day to search messages, read channels, and post updates without leaving my coding flow.

## What I actually think

I've been running this hybrid setup for months now. Here's my honest take:

MCP is not dead. It's going through the normal "trough of disillusionment" that every protocol hits when the initial hype meets reality. The token overhead is real but solvable (and being solved — Tool Search, Code Mode, better tool design). The security issues are real but strictly better than the CLI alternative for anything beyond local dev.

CLI is not the future for AI agents. It's the *present* for a specific category of tools that happen to already be in training data. That's a shrinking advantage as models get better at using structured APIs.

The future is boring: you'll use both. CLI for git and local tools. MCP for everything that needs auth, remote access, or multi-step workflows. Skills and behavioral context as the glue layer.

The people writing "MCP is dead" posts are optimizing for clicks. The people building on MCP are optimizing for a world where AI agents need to talk to more than just your local filesystem.

I know which bet I'm making.
