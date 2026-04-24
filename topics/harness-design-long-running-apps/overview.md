---
title: Harness Design for Long-Running Application Development
tags: [ai-engineering, multi-agent, harness, anthropic, claude]
created: 2026-03-30
updated: 2026-04-06
source: https://www.anthropic.com/engineering/harness-design-long-running-apps
published: 2026-03-24
status: complete
---

# Harness Design for Long-Running Application Development

## What Is It

A multi-agent architecture pattern for improving Claude's performance on complex, long-running tasks (frontend design, full-stack app development, system design). Separates generation from evaluation to overcome two core problems with single-agent approaches: **context degradation** and **self-evaluation bias**.

The core pattern: **Planner → Generator → Evaluator**. A planner expands brief prompts into comprehensive specs. A generator implements features. An evaluator independently tests output against sprint contracts using Playwright MCP for live browser interaction.

## Core Problems Addressed

**Context Degradation:**
- Models lose coherence as context windows fill
- Sonnet 4.5 exhibited "context anxiety," prematurely wrapping up near perceived context limits
- Full context resets (clearing and re-summarizing) outperformed compaction strategies
- Opus 4.6 (Feb 2026) mitigates this with 1M token window and automatic compaction

**Self-Evaluation Bias:**
- Agents confidently praise their own work even when quality is mediocre
- Single-agent approaches miss bugs they themselves introduced (self-confirmation bias)
- Separating evaluator from generator is more tractable than making single agents self-critical

## Architecture: Generator-Evaluator Loop

**GAN-Inspired Design:** Separate the agent doing the work from the agent judging it.

### Three-Agent Stack

| Agent | Role | Details | |-------|------|---------| | **Planner** | Spec expansion | Converts brief product descriptions into comprehensive specs with explicit scope, edge cases, and acceptance criteria (sprint contracts) | | **Generator** | Implementation | Builds features iteratively using Claude Code/Agent SDK with access to bash, file I/O, web search | | **Evaluator** | QA & Validation | Uses Playwright MCP to interact with live running applications, testing against sprint contracts and grading on design quality, originality, craft, functionality |

**Sprint Contracts:** Negotiated between generator and evaluator before implementation. Bridge high-level specs and testable success criteria.

### Frontend Design Variant (DAW Example)

- Four grading criteria: design quality, originality, craft, functionality
- Evaluator uses **Playwright MCP** to interact with live pages, not static screenshots
- Iterative improvement loop with live feedback
- Some generations produced unexpected creative pivots

## Key Findings (Updated April 2026)

### Cost-Performance Tradeoffs

| Task | Solo Agent | Full Harness | Outcome | |------|-----------|--------------|---------| | **Retro Game** | $9, 20 min | $200, 6 hrs | Solo: broken physics. Harness: fully playable, AI integration, polished UI | | **Digital Audio Workstation** | — | $124, 4 hrs | Opus 4.6 ran coherently for 2+ hours without sprint decomposition |

**Implication:** 20x cost multiplier is justified for high-stakes output. For routine tasks, solo agent is more cost-effective.

### Model Evolution Impact

**Opus 4.6 (February 2026) Improvements:**
- Context resets became unnecessary (orchestration overhead eliminated)
- Sprint decomposition became optional
- Evaluators valuable mainly at capability edges, not for routine tasks
- Achieves 76% on 8-needle retrieval at 1M context (vs. 18.5% for Sonnet 4.5)
- **Automatic compaction** enables effectively infinite conversations via server-side summarization

**Sonnet 4.6 (February 2026):**
- Competitive with Opus 4.6 on long-context tasks, surprising given cost difference
- 1M token context at standard pricing (no surcharge)

**Design Principle:** As models improve, harness complexity should **decrease** for routine tasks while **expanding** for frontier challenges. Harness designs must be continuously re-validated per model release.

### Evaluator Effectiveness

**Real Bugs Caught:**
- Rectangle fill malfunction (UI logic error)
- FastAPI route ordering (API correctness)
- Audio recording stubs without actual mic capture (incomplete implementation)

**Limitations Acknowledged:**
- QA agents exhibit shallow testing
- Deeper edge case exploration requires tuning
- Improvement is 10-20% bug detection vs. solo, not comprehensive coverage

### Playwright MCP for Evaluation

- **Live interaction:** Evaluator navigates running applications in real-time, not static screenshots
- **Deterministic:** Uses accessibility trees (role, label, state) instead of vision models
- **Active assessment:** Catches UX failures a generator would miss
- **Production-ready:** GitHub Copilot uses Playwright MCP natively

## Design Principles

1. **Assumption validation** — Every harness component encodes an assumption about model limitations. Stress-test these assumptions periodically as models improve.

2. **Graduated complexity** — Start minimal, add scaffolding only when needed. A solo agent may be sufficient; only escalate to harness if output quality gap justifies cost.

3. **Iterative harness refinement** — When new models drop, remove outdated components (e.g., context resets with Opus 4.6) and add capability-expanding ones (e.g., deeper evaluators for frontier tasks).

4. **Criteria as steering** — Phrasing like "museum quality" directly shaped output character. Evaluate harness design on measurable criteria, not vague aesthetics.

5. **Model-aware design** — Harnesses must be re-validated per new Claude release. A harness optimized for Opus 4.5 may not fit Opus 4.6.

## Limitations & Caveats (Updated April 2026)

- **QA agents are shallow testers** — Deeper edge case exploration needs tuning; expect 10-20% improvement vs. solo, not comprehensive coverage
- **Sequential reasoning tasks degrade 39-70%** — Harness overhead fragments reasoning process; unsuitable for pure logic/math tasks (Google Research)
- **Context compaction loses information** — While compaction preserves narrative, practitioners report context loss after compaction point on subsequent turns
- **Production reliability remains low** — 90% of autonomous agent projects crash within 30 minutes; harness design improves output quality, not deployment reliability
- **Unstructured multi-agent networks amplify errors 17.2x** — Without proper orchestration infrastructure, error amplification is severe (UC Berkeley MAST)
- **Tool hallucination persists** — Agents hallucinate function calls; tool selection fatigue causes exponential overhead with large API surfaces

## Emerging Alternatives (April 2026)

**AutoAgent Meta-Harness:** Automatically optimizes harness code (system prompt, tool definitions, routing logic) via meta-agent overnight. Sidesteps manual harness design. Very new; viability TBD.

**Fine-Tuning + RL:** Supplement base model with Supervised Fine-Tuning and Reinforcement Learning to improve long-task coherence without harness overhead. AWS documents production patterns.

**Meta-Harness (Stanford):** Research framework that searches over harness code to find optimal orchestration strategy per task. Rejects information compression as harmful.

## Key Takeaway

**Harness design is a task-dependent pattern, not a universal solution.** As models improve (Opus 4.6, Sonnet 4.6), harness complexity decreases for routine tasks while expanding for frontier challenges. The work is continuously identifying which scaffolding remains load-bearing. For high-stakes output (system design, code review), harness overhead is justified. For sequential reasoning or routine tasks, solo agents are more cost-effective.

---

*Last updated: 2026-04-06 | Status: Established Pattern — Task-Dependent*
