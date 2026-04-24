---
title: Andrej Karpathy's Claude Skills (Four Principles)
tags: [research, brainstorming, claude-code]
created: 2026-04-10
status: complete
---

# Andrej Karpathy's Claude Skills (Four Principles)

## What It Is

A community-distilled framework of four structured coding principles derived from observations by AI researcher Andrej Karpathy. The principles (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) are packaged as CLAUDE.md instructions, a Claude Code plugin, and a reusable skill, adopted by 11.1k–11.4k GitHub users. The framework aligns with Anthropic's official coding best practices but lacks independent effectiveness validation.

## Key Concepts

- **Think Before Coding:** Plan system architecture and approach before writing—avoid jumping into implementation. Reduces re-planning overhead and improves code coherence.
- **Simplicity First:** Favor readable, explicit code over clever abstractions. Target: understandable by domain experts, not just programmers. Reduces maintenance burden and bug surface area.
- **Surgical Changes:** Make targeted, minimal edits to existing code rather than broad refactors. Preserves intent, reduces regression risk, eases code review.
- **Goal-Driven Execution:** Verify every change against the original goal. Stop when goal is met—avoid scope creep, feature addition, or "while we're here" refactoring.

## Context

- **Who uses it:** Individual developers, small teams, and organizations standardizing Claude Code workflows who want explicit guidance on code quality.
- **When:** Early-stage projects, codebases with review overhead, teams uncertain about AI-assisted coding practices.
- **Why:** LLMs are prone to specific pitfalls (over-abstraction, copy-paste duplicates, verbose code, scope creep). These principles directly address those behaviors.

## Key Numbers & Stats

- **Repository stars:** 11.1k–11.4k [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — **HIGH confidence**
- **Claude Code adoption:** 4% of public GitHub commits (2026), with case studies showing 40% productivity increases — **MEDIUM confidence** (general Claude Code adoption; not specific to Karpathy principles)
- **Competing frameworks:** shanraisshan/claude-code-best-practice (7k+ stars), FlorianBruniaux/claude-code-ultimate-guide, MuhammadUsmanGM/claude-code-best-practices — active ecosystem — **HIGH confidence**
- **Effectiveness validation:** Zero peer-reviewed studies; no controlled A/B testing — **HIGH confidence in absence of evidence**
- **Originator's current position:** Karpathy stated (April 2026) "agents do not listen to my instructions" — **HIGH confidence** (primary source)

## Links

- **Official repository:** [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- **Claude Code plugin:** [Claude Plugin Hub — Andrej Karpathy Skills](https://www.claudepluginhub.com/plugins/forrestchang-andrej-karpathy-skills)
- **Anthropic official guidance:** [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- **Community ecosystem:** [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) (7k+ stars)
- **Karpathy's context:** [New Stack: "Vibe Coding is Passé"](https://thenewstack.io/vibe-coding-is-passe/) — 2026 shift toward "agentic engineering"
