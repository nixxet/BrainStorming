---
name: cross-analyze
title: Cross-Topic Synthesis Skill
created: 2026-04-03
purpose: Synthesize patterns across all researched topics and publish a cross-topic analysis that identifies common risks, recurring patterns, and cross-cutting themes in the BrainStorming knowledge base.
description: Cross-topic synthesis -- reads existing topics and identifies recurring patterns without conducting new web research
argument-hint: "[theme or keyword to analyze across topics]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Agent, TodoWrite, WebSearch, WebFetch
---

# /cross-analyze Skill

Dispatch to the cross-analyzer agent when the user runs `/brainstorming:cross-analyze [theme or keyword]`.

This skill does NOT run the research pipeline. No web research is conducted. It reads existing topic files and synthesizes patterns.

## Dispatch

Read `${CLAUDE_PLUGIN_ROOT}/pipeline/agents/cross-analyzer.md` and execute with:
- **Theme:** [the theme or keyword from the user's request]
- **Scope:** All topics in `topics/` (active + archived, excluding `_cross/` and `_meta/`)
