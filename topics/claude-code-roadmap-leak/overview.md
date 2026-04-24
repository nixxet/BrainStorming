---
title: Claude Code Roadmap Leak
tags: [research, infrastructure, ai-agents]
created: 2026-04-06
status: complete
---

# Claude Code Roadmap Leak

## What It Is

A March 2026 source code leak exposed 512,000+ lines of Claude Code's TypeScript harness, including unreleased feature flags for KAIROS, AGENT_TRIGGERS, COORDINATOR_MODE, BG_SESSIONS, and KAIROS_GITHUB_WEBHOOKS. The leak reveals Anthropic's internal roadmap for autonomous agent capabilities, but Anthropic has not officially explained these flags or confirmed shipping timelines. Simultaneously, Anthropic shipped many similar capabilities in Q1 2026 (Scheduled Tasks, Background Agents, GitHub Code Review), making it unclear whether the leaked flags represent genuinely new architectures or internal naming for already-public features.

## Key Concepts

- **KAIROS:** Unreleased feature for always-on background agent; described in leak analysis as running continuously, checking "is there anything worth doing?" every few seconds, with persistent memory via daily markdown logs and nightly "autoDream" consolidation. Status: gated, unshipped, no official explanation from Anthropic.

- **AGENT_TRIGGERS:** Leaked flag suggesting cron/scheduled triggering for autonomous agent work. Possible overlap with shipped Scheduled Tasks feature.

- **COORDINATOR_MODE:** Leaked flag suggesting multi-agent orchestration. Maps to shipped Subagents capability.

- **BG_SESSIONS:** Leaked flag for background session persistence. Unclear if distinct from shipped Scheduled Tasks state persistence.

- **KAIROS_GITHUB_WEBHOOKS:** Leaked flag suggesting GitHub automation. Maps to shipped GitHub Code Review feature in research preview.

- **Source Code Leak:** Accidental release of 513,000 lines of unobfuscated TypeScript in 1,906 files (late March 2026), likely via npm packaging error. Exposed harness orchestration logic, MCP server integration, bash validation rules, and tiered memory structures.

- **Verification Challenge:** All claims about what KAIROS does come from secondary interpretation of code comments in blogs analyzing the leak. Anthropic has not provided official documentation.

## Context

- **Who's Watching:** AI engineers, Claude Code users, enterprise security/governance teams, Anthropic's competitors
- **Why It Matters:** KAIROS would represent a paradigm shift from reactive (user prompts, Claude responds) to proactive (Claude runs in background, makes autonomous decisions). Enterprise adoption of autonomous agents depends on understanding what's coming and when.
- **When It's Relevant:** Now (to understand current state); at KAIROS launch (to evaluate adoption risk); during vendor evaluation for autonomous coding tools
- **Current Status (as of 2026-04-06):** Leak is real and documented; leaked flags are confirmed in source code; official explanation is absent; infrastructure strain and governance gaps suggest KAIROS is not imminent

## Key Numbers / Stats

- **512,000+ lines of source code exposed** [SecurityWeek](https://www.securityweek.com/critical-vulnerability-in-claude-code-emerges-days-after-source-leak/) — HIGH confidence
- **150+ references to KAIROS in source code** [Claude Code Source Leak: Everything Found](https://claudefa.st/blog/guide/mechanics/claude-code-source-leak) — HIGH confidence (but does not confirm readiness)
- **5 major platform outages in March 2026** [StatusGator](https://statusgator.com/services/claude) — HIGH confidence
- **5-hour Claude Max quotas consumed in 1-2 hours** [Anthropic admits users hitting limits](https://www.devclass.com/ai-ml/2026/04/01/anthropic-admits-claude-code-users-hitting-usage-limits-way-faster-than-expected-5213575) — HIGH confidence
- **64% of billion-dollar enterprises reported >$1M losses from AI agent failures** [Salesforce](https://www.salesforceben.com/4-ways-salesforce-customers-risk-losing-millions-because-of-ai-agents/) — HIGH confidence (industry wide, not Claude-specific)
- **Critical vulnerability discovered within days of leak** [SecurityWeek](https://www.securityweek.com/critical-vulnerability-in-claude-code-emerges-days-after-source-leak/) — HIGH confidence
- **120+ features shipped by Anthropic in Q1 2026** [How Anthropic shipped 120 features](https://www.news.aakashg.com/p/anthropic-q1-features) — HIGH confidence

## Links

- [Claude Code Official Documentation](https://code.claude.com/docs/en/overview)
- [Anthropic Official Blog on Autonomous Work Patterns](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)
- [VentureBeat Leak Coverage](https://venturebeat.com/technology/claude-codes-source-code-appears-to-have-leaked-heres-what-we-know/)
- [The Register Leak Analysis](https://www.theregister.com/2026/04/01/claude_code_source_leak_privacy_nightmare/?td=rt-3a)
- [Claude Code Security Review](https://github.com/anthropics/claude-code-security-review)
