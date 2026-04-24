---
name: compare
title: Side-by-Side Comparison Skill
created: 2026-04-03
purpose: Run the comparison workflow for competing options, normalize evaluation criteria, and publish a ranked verdict with decision boundaries.
description: Comparison analysis — evaluates options side-by-side with normalized criteria and evidence-backed verdict
argument-hint: "[option A] vs [option B] [for purpose/context]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Task, TodoWrite, WebSearch, WebFetch
---

Read the Director agent definition from `.claude/agents/director.md`. Then execute the **comparison pipeline** for the following:

**Comparison:** $ARGUMENTS

**Workflow:** compare

Follow the Director's pipeline with comparison adjustments: assign each researcher a different option, have Analyzer normalize criteria, produce comparison matrix + ranked recommendation.

Output lands in `topics/{topic-slug}/` with `overview.md` (comparison matrix), `notes.md` (per-option analysis), and `verdict.md` (ranked recommendation + "Choose A when... Choose B when..."). The `index.md` will be updated on completion.
