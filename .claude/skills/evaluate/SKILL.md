---
name: evaluate
title: Single-Item Evaluation Skill
created: 2026-04-03
purpose: Run the evaluation workflow for one product, tool, or approach and publish an evidence-backed verdict against its real-world strengths, weaknesses, and claims.
description: Deep evaluation of a single product, tool, or approach — vendor claims vs reality, strengths, weaknesses, verdict
argument-hint: "[product, tool, or approach to evaluate]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Task, TodoWrite, WebSearch, WebFetch
---

Read the Director agent definition from `.claude/agents/director.md`. Then execute the **evaluation pipeline** for the following:

**Evaluate:** $ARGUMENTS

**Workflow:** evaluate

Follow the Director's pipeline with evaluation adjustments: Researcher covers landscape + alternatives, Investigator deep-dives the specific item, Analyzer checks for vendor bias, Writer produces evaluation scorecard format.

Output lands in `topics/{topic-slug}/` with `overview.md`, `notes.md` (evaluation scorecard + strengths/weaknesses), and `verdict.md` (pass/fail/conditional verdict). The `index.md` will be updated on completion.
