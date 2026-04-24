---
title: Prompt Master
tags: [research, evaluate, claude-skill, prompt-engineering]
created: 2026-04-06
status: complete
---

# Prompt Master

## What It Is

Prompt Master is a Claude skill (Markdown instruction file) created by nidhinjs that routes prompt-writing tasks to 30+ AI tools with tool-specific optimization profiles. It consolidates established prompt engineering best practices (RCCF, CO-STAR, failure patterns) and provides 35 documented failure pattern diagnostics and a 6-point pre-flight verification checklist. Claimed to produce first-attempt-success prompts ("zero re-prompts") but this is unverified.

**Launched:** 2026-03-11 (26 days old)  
**License:** MIT  
**Repository:** [https://github.com/nidhinjs/prompt-master](https://github.com/nidhinjs/prompt-master)

## Key Concepts

- **Claude Skill:** A folder of Markdown instructions stored in `~/.claude/skills/` or via claude.ai Projects. Invoked probabilistically based on skill description pattern-matching (not guaranteed).
- **Tool Routing:** Identifies target AI tool (Claude, GPT-5.x, o3, Midjourney, etc.) and applies tool-specific prompt structure (e.g., Claude needs XML tags; o3 needs short, no-CoT instructions).
- **35 Failure Patterns:** Documented anti-patterns including vague verbs, missing constraints, scope creep, hallucination invitations (Tree of Thought, prompt chaining for single-pass). These overlap with established frameworks (RCCF, CO-STAR).
- **6-Point Verification:** Pre-flight checklist covering target tool ID, constraint placement, signal words, hallucination removal, token audit, and first-attempt success assessment. Rules-based linting, not semantic validation.
- **"Zero Re-Prompts" Claim:** Headline promise that every prompt works on first try. **Unverified — no published benchmarks or A/B tests support this.**

## Context

- **Use When:** You're drafting a prompt for an unfamiliar AI tool (e.g., first time using Midjourney or o3) and want tool-specific guidance and a pre-submission checklist.
- **Who Uses It:** Developers, PMs, and content creators within Claude.ai chat or Claude Code IDE (interactive sessions only; no API/backend integration).
- **When It Fails:** For production workflows, API-based Claude usage, CI/CD integration, or batch prompt processing. Skill format has zero programmatic access.

## Key Numbers / Stats

| Metric | Value | Confidence | Source | |--------|-------|----------|--------| | **GitHub Stars** | 4.8k | HIGH | [GitHub](https://github.com/nidhinjs/prompt-master) | | **Forks** | 458 | HIGH | [GitHub](https://github.com/nidhinjs/prompt-master) | | **Days Old** | 26 (since 2026-03-11) | HIGH | [GitHub](https://github.com/nidhinjs/prompt-master) | | **Tool Profiles** | ~20 documented; 30+ with universal fallback | MEDIUM | [SKILL.md](https://github.com/nidhinjs/prompt-master/blob/main/SKILL.md) | | **Failure Patterns Documented** | 35 | HIGH | [patterns.md](https://github.com/nidhinjs/prompt-master/blob/main/references/patterns.md) | | **Open Issues** | 1 | HIGH | [GitHub](https://github.com/nidhinjs/prompt-master) | | **Releases/Versions** | 0 formal tags | HIGH | [GitHub](https://github.com/nidhinjs/prompt-master) | | **"Zero Re-Prompts" Benchmarks** | 0 published | HIGH | Gap identification | | **Competing Tools with Benchmarks** | Anthropic Workbench (30% accuracy claim) | MEDIUM | [Anthropic Docs](https://nickgarnett.substack.com/p/the-anthropic-console-a-practical) |

## Links

- [GitHub Repository](https://github.com/nidhinjs/prompt-master)
- [SKILL.md - Core Documentation](https://github.com/nidhinjs/prompt-master/blob/main/SKILL.md)
- [Failure Patterns Reference](https://github.com/nidhinjs/prompt-master/blob/main/references/patterns.md)
- [Prompt Templates Reference](https://github.com/nidhinjs/prompt-master/blob/main/references/templates.md)
- [Anthropic Workbench (Competing Tool)](https://platform.claude.com/)
- [LangSmith (Framework Alternative)](https://docs.langchain.com/langsmith/prompt-engineering-concepts)
