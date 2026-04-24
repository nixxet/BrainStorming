---
name: cross-analyze
description: Synthesize patterns across all researched topics. Use when finding common risks, recurring patterns, or cross-cutting themes in the BrainStorming knowledge base.
---

# /cross-analyze Skill

Dispatch to the cross-analyzer agent when the user runs `/cross-analyze [theme or keyword]`.

This skill does NOT run the research pipeline. No web research is conducted. It reads existing topic files and synthesizes patterns.

## Dispatch

Read `.claude/agents/cross-analyzer.md` and execute with:
- **Theme:** [the theme or keyword from the user's request]
- **Scope:** All topics in `topics/` (active + archived, excluding `_cross/` and `_meta/`)
