---
title: Paperclip — AI Agent Orchestration for Autonomous Companies
tags: [research, evaluate, agents, orchestration]
created: 2026-04-06
status: complete
---

# Paperclip — AI Agent Orchestration for Autonomous Companies

## What It Is

Paperclip is an open-source orchestration layer that coordinates teams of AI agents (Claude Code, OpenClaw, Python scripts, HTTP webhooks) as if they were employees in a company. You define org charts, budgets, goals, and governance — agents execute autonomously. It launched March 4, 2026, and reached 48,000+ GitHub stars by April 5, 2026, positioning itself as the central platform for the "year of AI companies" (2026).

Unlike agent frameworks (CrewAI, LangGraph, AutoGen) that build individual agents, Paperclip sits above agents and provides the coordination layer: hierarchical goals, budget enforcement, approval gates, and audit trails.

## Key Concepts

- **BYOA (Bring Your Own Agent):** Paperclip supports any agent runtime—Claude Code, OpenClaw, Python, shell commands, HTTP webhooks. No vendor lock-in.
- **Per-Agent Monthly Budgets:** Hard budget limits with atomic enforcement. Agents pause at 100% budget; warnings at 80%. Only orchestration framework with cost governance built-in.
- **Org Charts & Goal Ancestry:** Define reporting lines and hierarchies; every task traces back to company mission. Prevents goal drift.
- **Heartbeat Scheduling:** Agents execute autonomously on cron-like schedules. Agent state persists across sessions (no restart from scratch).
- **Atomic Task Checkout:** Tasks can only be claimed by one agent at a time; designed to prevent double-work.
- **Configuration Versioning & Rollback:** Org structure and approval gates can be versioned with rollback capability.

## Context

**When to consider Paperclip:**
- Running 5+ coordinated agents with shared goals and budgets
- Need governance layer (approvals, audit trails, cost control)
- Agents are loosely coupled (not fine-grained microservices)
- Multi-month autonomous operation expected
- Team knows Node.js/PostgreSQL infrastructure

**When to skip Paperclip:**
- Running 1-2 agents (complexity overhead not justified)
- Agents are tightly coupled (need synchronous communication)
- No budget concerns (simple scripts suffice)
- Team has no PostgreSQL or Node.js ops expertise

## Key Numbers / Stats

- **GitHub Stars:** 48,000+ (as of April 5, 2026) [GitHub Releases](https://github.com/paperclipai/paperclip/releases) — HIGH confidence
- **Growth Trajectory:** Reached 30,000 stars in 3 weeks (March 4-27, 2026); 48,000 by April 5, 2026 — HIGH confidence
- **Forks:** 6,400+ [GitHub repo](https://github.com/paperclipai/paperclip) — HIGH confidence
- **Minimum Viable Scale:** 5+ agents for coordination benefits [Practitioner review](https://mrdelegate.ai/blog/paperclip-ai-review/) — MEDIUM confidence
- **Largest Documented Deployment:** 14 agents [DEV Community case study](https://dev.to/jangwook_kim_e31e7291ad98/how-we-built-a-company-powered-by-14-ai-agents-using-paperclip-4bg6) — MEDIUM confidence
- **Software Cost:** $0 (MIT licensed) [GitHub repo](https://github.com/paperclipai/paperclip) — HIGH confidence
- **Infrastructure Cost:** $50-80/mo (with managed PostgreSQL RDS) — MEDIUM confidence

## Tech Stack

| Layer | Technology | |-------|-----------| | Backend | Node.js 20+, PostgreSQL (local or external) | | Frontend | React | | Package Manager | pnpm 9.15+ | | Language | TypeScript | | License | MIT (open source) |

## Links

- [Official Site](https://paperclip.ing/) — Marketing & quick start
- [GitHub Repository](https://github.com/paperclipai/paperclip) — Source code, issues, releases
- [Official Documentation (Cost & Budgets)](https://www.mintlify.com/paperclipai/paperclip/guides/cost-budgets) — Budget enforcement details
- [How to Build Multi-Agent Company with Paperclip & Claude Code](https://www.mindstudio.ai/blog/how-to-build-multi-agent-company-paperclip-claude-code) — Integration guide
- [Zeabur Deploy Guide](https://zeabur.com/blogs/deploy-paperclip-ai-agent-orchestration) — Deployment walkthrough
