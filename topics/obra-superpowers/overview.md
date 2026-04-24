---
title: obra/superpowers
tags: [research, evaluate, agentic-frameworks]
created: 2026-04-09
status: complete
---

# obra/superpowers

## What It Is

A composable agentic skills framework that imposes systematic engineering methodology on AI coding agents. Superpowers decouples skills into a community-editable repository and coordinates agent workflows through structured phases: brainstorming, planning, git isolation, test-driven development, systematic debugging, and two-stage code review. Designed for Claude Code; supported with degradation on Cursor, Copilot CLI, Droid, Codex, OpenCode, and Gemini CLI.

## Key Concepts

- **Skills:** Reusable agent-executable workflows (brainstorming, planning, debugging, code review, etc.) stored in a separate repository and auto-loaded into session context
- **Iron Laws:** Behavioral principles enforced through instruction design — framework guides agents toward systematic practices (TDD, two-stage review) but does not hard-code constraints
- **Subagent-Driven Development:** Parallel or hierarchical dispatch of specialized agents within a single session, each with isolated context
- **Two-Stage Code Review:** First stage verifies implementation matches specification; second stage evaluates naming, error handling, and efficiency
- **Git Worktree Integration:** Creates isolated branch baseline after design, runs setup, verifies clean test state before implementation
- **TDD Enforcement:** Framework deletes code written before tests pass; works on main session, degraded on unsupervised subagents due to platform constraints
- **Session Context Bootstrap:** Preloads all 14 skills at startup (~22K tokens) instead of lazy-loading on first invocation
- **Skill Registry (superpowers-skills):** Community-maintained repository of skills with auto-version management; inheritance of ecosystem-level prompt injection risk (36% vulnerability rate)

## Context

**Who uses it:** Claude Code users building multi-step agentic systems and complex feature development. Freelancers and small teams prefer it for code quality consistency; enterprises evaluate it cautiously due to token cost and subagent TDD bypass risk.

**When:** Complex production features with high rework cost and design-first workflows. Not suitable for quick fixes, exploratory work, solo developers, or cross-platform deployment (first-class Claude Code only).

**Why:** Systematic methodology (brainstorming → planning → TDD → review) reduces integration bugs and encourages discipline. Two-stage review is a genuine differentiator vs. vanilla LLM agents.

## Key Numbers / Stats

- **140.3K GitHub stars, #47 global ranking** [GitHub](https://github.com/obra/superpowers) — **HIGH** confidence
- **v5.0.7 released March 31, 2026** [GitHub Releases](https://github.com/obra/superpowers/releases) — **HIGH** confidence
- **22K tokens preloaded at startup** [Issue #190](https://github.com/obra/superpowers/issues/190), [Issue #750](https://github.com/obra/superpowers/issues/750), [Issue #832](https://github.com/obra/superpowers/issues/832), [Issue #953](https://github.com/obra/superpowers/issues/953) — **HIGH** confidence
- **58.8% shell code (verified stat)** [GitHub](https://github.com/obra/superpowers) — **HIGH** confidence
- **126+ open issues, 421 commits on main** [GitHub](https://github.com/obra/superpowers) — **HIGH** confidence
- **Jesse Vincent backing (Perl founder, Request Tracker creator, Keyboardio co-founder)** [Wikipedia](https://en.wikipedia.org/wiki/Jesse_Vincent) — **HIGH** confidence
- **94% PR rejection rate (creator reported)** [blog.fsck.com](https://blog.fsck.com/2026/03/31/slop-prs/) — **LOW** confidence (self-reported, no independent validation)
- **85-95% test coverage vs. 30-50% baseline** — **LOW** confidence (single unverifiable source, methodology unspecified)

## Honest Positioning vs. Marketing

| Claim | Reality | |-------|---------| | "Works on 6 platforms fully supported" | Claude Code first-class; Cursor partial; Copilot CLI/Droid/Codex/OpenCode degraded/broken | | "Progressive token disclosure" | All 14 skills preloaded at startup (11% of 200K context burned upfront) | | "Enforce TDD discipline" | Behavioral persuasion that works on main session, bypassed by unsupervised subagents | | "94% rejection rate" | Self-reported metric; no independent benchmark or baseline comparison |

## Links

- [obra/superpowers GitHub](https://github.com/obra/superpowers)
- [obra/superpowers-skills registry](https://github.com/obra/superpowers-skills)
- [Jesse Vincent — Background & Track Record](https://en.wikipedia.org/wiki/Jesse_Vincent)
- [Issue #953 — Token exhaustion (unanswered 13+ days)](https://github.com/obra/superpowers/issues/953)
- [Issue #237 — Subagent TDD bypass (platform limitation)](https://github.com/obra/superpowers/issues/237)

---

**Confidence signal:** HIGH for architecture, Claude Code support, and token preload problem. MEDIUM for enforcement claims and maintenance responsiveness. LOW for multi-platform claims and headline metrics (94% rejection, 85-95% coverage). See detailed notes and verdict.
