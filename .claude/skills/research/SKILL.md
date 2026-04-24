---
name: research
title: Topic Research Skill
created: 2026-04-03
purpose: Launch the full BrainStorming research workflow for a topic or question and publish a complete topic dossier into the knowledge base.
description: Full research pipeline — surveys a topic, validates findings, produces evidence-backed topic files in BrainStorming
argument-hint: "[topic or question to research]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Task, TodoWrite, WebSearch, WebFetch
---

Read the Director agent definition from `.claude/agents/director.md`. Then execute the **full research pipeline** for the following topic:

**Topic:** $ARGUMENTS

**Workflow:** research

Follow the Director's pipeline phases in order: Intake → Parallel Research → Analysis → Writing → Critic Gate → Security Review (if applicable) → Testing → Publishing → Delivery.

Default interpretation rules:

- Research the topic truthfully in its native domain.
- Extract reusable patterns, transferable risks, and capability-level value using a vertical-agnostic lens.
- Evaluate relevance to current and future projects without assuming the topic's source audience is your intended audience.
- Treat safety, security, privacy, abuse potential, access control, and misuse surfaces as operational concerns, not morality defaults.

Output lands in `topics/{topic-slug}/` with `overview.md`, `notes.md`, and `verdict.md`. The `index.md` will be updated on completion.
