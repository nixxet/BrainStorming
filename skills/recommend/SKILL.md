---
name: recommend
title: Problem-First Recommendation Skill
created: 2026-04-03
purpose: Run the recommendation workflow for a stated problem, rank candidate solutions, and publish a primary recommendation with runner-up guidance.
description: Problem-first recommendation -- researches solutions for a stated problem, ranks candidates, recommends with rationale
argument-hint: "[problem statement or need]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Agent, TodoWrite, WebSearch, WebFetch
---

Read the Director agent definition from `${CLAUDE_PLUGIN_ROOT}/pipeline/agents/director.md`. The plugin is installed at `${CLAUDE_PLUGIN_ROOT}`. Wherever the Director spec (or any agent spec it loads) says `{PLUGIN_ROOT}`, use that path. Research output goes under the current working directory. Then execute the **recommendation pipeline** for the following:

**Problem:** $ARGUMENTS

**Workflow:** recommend

Follow the Director's pipeline with recommendation adjustments: Researcher maps solution landscape, Investigator deep-dives top candidates, Analyzer ranks against requirements, Writer produces recommendation with rationale + runner-up + implementation plan.

Output lands in `topics/{topic-slug}/` with `overview.md` (problem framing + solution landscape), `notes.md` (ranked candidates with evidence), and `verdict.md` (primary recommendation + runner-up + implementation plan). The `index.md` will be updated on completion.
