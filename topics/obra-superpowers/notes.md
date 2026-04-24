---
title: obra/superpowers — Research Notes
tags: [research, findings]
created: 2026-04-09
---

# obra/superpowers — Research Notes

## Key Findings

### Architecture & Design

- **[HIGH]** Modular skills architecture with decoupled repository — all 14 skills are stored in a separate community-editable repository (obra/superpowers-skills), not hardcoded into the plugin. This enables community contributions, independent skill versioning, and lightweight core. [GitHub](https://github.com/obra/superpowers-skills)

- **[HIGH]** Two-stage code review enforces specification compliance then quality — first stage checks if implementation matches requirements; second stage evaluates naming, error handling, and efficiency. Documented in plugin and confirmed in both Landscape and Deep-Dive briefs. [GitHub SKILL.md](https://github.com/obra/superpowers/blob/main/agents/code-reviewer.md)

- **[HIGH]** Git worktree isolation for clean baseline — framework creates isolated workspace on new branch after design, runs setup, verifies clean test state before implementation. Standard workflow enhancement with clear benefit. [GitHub SKILL.md](https://github.com/obra/superpowers)

- **[HIGH]** Systematic debugging via structured 4-phase process — root cause investigation → pattern analysis → hypothesis testing → implementation with tests. Documented workflow; no contradictions found. [GitHub SKILL.md](https://github.com/obra/superpowers)

### Token Efficiency & Context Management (CRITICAL FINDINGS)

- **[HIGH]** 22K tokens preloaded at startup, violating progressive disclosure principle — framework loads all 14 skills into session context immediately upon startup instead of lazy-loading on first invocation. This consumes 11% of a 200K context window upfront, contradicting marketed "work autonomously for hours" claim.
  - **Evidence bucket:** [Issue #190](https://github.com/obra/superpowers/issues/190) (dated, high engagement: "All Skills Preloaded at Startup Consuming 22k+ Tokens"), [Issue #750](https://github.com/obra/superpowers/issues/750) ("Superpowers consume a lot of tokens in Opencode with Codex"), [Issue #832](https://github.com/obra/superpowers/issues/832) (community identified 69% line reduction possible without behavioral loss), [Issue #953](https://github.com/obra/superpowers/issues/953) (March 27, 2026: "Claude with this skill ate 100% of tokens in 5 minutes" on routine Google Calendar task — zero maintainer response as of April 9, 13+ days overdue)

- **[HIGH]** Token exhaustion on routine tasks with confirmed maintainer silence — Issue #953 documents complete token burnout in 5 minutes on a straightforward calendar task. Opened March 27; zero maintainer response for 17+ days as of April 13, 2026. No response, no label, no acknowledgement. Pattern of related issues (#190, #750, #832) spanning 2+ years confirms this is accepted, not being fixed. [Issue #953](https://github.com/obra/superpowers/issues/953) — *refreshed April 13, 2026*

- **[MEDIUM]** Platform-specific token variance unquantified — Copilot CLI and Codex report higher token consumption than Claude Code, but no quantitative comparison exists. Cannot optimize platform choice without this data. [Issue #750](https://github.com/obra/superpowers/issues/750), [Issue #792](https://github.com/obra/superpowers/issues/792)

### Methodology Enforcement (OVERSTATED IN MARKETING)

- **[HIGH]** TDD discipline is behavioral persuasion on main session, **permanently absent on subagents** — Issue #237 closed by maintainer obra with explicit statement: *"Closing — this is a Claude Code platform limitation. Subagents don't receive SessionStart hook context by design. There's not much superpowers can do about this on the plugin side."* This is not a tracked bug or a planned fix — it is a confirmed permanent architectural gap. Subagents will never receive TDD enforcement via superpowers unless Claude Code changes its platform behavior. Marketing claim "enforce TDD" is permanently overstated for any multi-agent workflow. [Issue #237 — closed April 2026](https://github.com/obra/superpowers/issues/237) — *confidence upgraded to HIGH; refreshed April 13, 2026*


- **[MEDIUM]** TDD enforcement is conditional on main session — works effectively when instruction context is visible, fails on unsupervised subagents (now confirmed permanent per Issue #237). Marketing claim "enforce TDD" should be understood as: encourage TDD on main session only; subagents receive no enforcement by design. [Issue #237](https://github.com/obra/superpowers/issues/237)

- **[MEDIUM]** Rationalization tables provide counter-arguments, not prevention — framework lists reasons agents commonly skip TDD (time pressure, trivial task assumption) alongside counter-arguments. This is defensive instruction design. Motivated agents can still rationalize (as Issue #237 demonstrates); framework functions as "best practice coach," not "compliance system." [GitHub SKILL.md](https://github.com/obra/superpowers), [Issue #237](https://github.com/obra/superpowers/issues/237)

- **[MEDIUM]** Skill loading failures under real use — multiple unresolved issues report intermittent failures when skills don't trigger or load correctly: [Issue #653](https://github.com/obra/superpowers/issues/653), [Issue #1002](https://github.com/obra/superpowers/issues/1002), [Issue #775](https://github.com/obra/superpowers/issues/775), [Issue #792](https://github.com/obra/superpowers/issues/792). Suggests bootstrapping reliability issue. Failures are silent — agent continues with partial load, no error reported.

### Multi-Platform Support (DEGRADED)

- **[LOW]** "Works on 6 platforms fully supported" is misleading marketing — reality is stratified support:
  - **Claude Code:** Full support, automatic skill triggering ✓
  - **Cursor:** Partial (manual plugin install, requires manual configuration)
  - **Copilot CLI:** Broken bootstrap injection — v5.0.7 claims sessionStart hook support, but Issue #792 shows no mechanism to inject "always check skills first" context into the command execution
  - **Droid:** Skills visible but don't trigger (Issue #324)
  - **Codex/OpenCode:** Excessive token consumption (Issue #750)
  - **Gemini CLI:** No detailed evidence; unverified
  - Confidence is LOW for "fully supported across 6 platforms"; MEDIUM-HIGH for "Claude Code is best-supported." [Issue #792](https://github.com/obra/superpowers/issues/792), [Issue #324](https://github.com/obra/superpowers/issues/324), [Issue #750](https://github.com/obra/superpowers/issues/750)

### Code Quality Metrics (UNVERIFIED HEADLINES)

- **[LOW]** 94% PR rejection rate claimed by creator — blog post "Agentic slop PRs" by Jesse Vincent reports that two-stage review rejects 94% of low-quality submissions. PyShine article appears to cite the same source. No independent third-party validation, no baseline comparison (e.g., "X% without superpowers"), no methodology specified. Plausible claim (systematic review does filter bad PRs), but quantitative evidence is unverified. [blog.fsck.com](https://blog.fsck.com/2026/03/31/slop-prs/)

- **[LOW]** 85-95% test coverage vs. 30-50% baseline — single source (YUV.AI blog) with no methodology specified (lines? branch? cases?), no independent measurement, baseline (30-50%) unsourced. Unsupported claim; requires independent benchmark with defined methodology to be actionable.

### Commercial & Community

- **[HIGH]** Commercial backing via Prime Radiant; Jesse Vincent track record — README confirms Prime Radiant backing. Jesse Vincent (Perl project lead 1995-2010, Request Tracker creator, Keyboardio co-founder) has 20+ years shipping production software. GitHub shows 31 contributors and consistent history across Request Tracker, K-9 Mail, superpowers. Lower risk than VC startup; higher risk than multi-maintainer open-source (single-person visibility). [Wikipedia](https://en.wikipedia.org/wiki/Jesse_Vincent), [GitHub](https://github.com/obra/superpowers)

- **[HIGH]** 140.3K GitHub stars, #47 global ranking — verified via Star-history.com. Caveat: stars correlate with visibility, not production usage. 1,528 stars gained in 24 hours (when trending #2 globally) suggests viral awareness, not organic adoption. [Star-history](https://star-history.com/)

- **[HIGH]** Active development but declining maintainer responsiveness on critical issues — v5.0.7 remains latest as of April 13 (no release since March 31); 421 commits on main; issues being filed daily. Critical signals: Issue #953 (token exhaustion) has zero maintainer response at 17+ days; Issue #237 (subagent TDD bypass) closed as permanent platform limitation rather than tracked for workaround. Project is actively used but critical-path bugs are not being prioritized. [GitHub](https://github.com/obra/superpowers) — *refreshed April 13, 2026*

### Architectural Vulnerabilities

- **[MEDIUM]** Prompt injection risk amplified by skills-first design — ecosystem has 36% vulnerability rate (OWASP Agentic Skills Top 10); 13.4% critical-level. Snyk ToxicSkills found ClawHub suffered poisoning with 5 of top 7 skills malware (1,467 malicious payloads total). Superpowers forces agents to "invoke-skills-first," amplifying this inherited risk. Framework has no package signing, skill sandboxing, or documented curation process for obra/superpowers-skills. SkillJect research (arxiv.org/html/2601.17548v1) shows 91% of malicious skills use prompt injection invisible to end users. [OWASP](https://owasp.org), [Snyk ToxicSkills](https://snyk.io)

---

## Counterarguments & Risks

- **Token cost may pay off in rework prevention** — 22K-token startup tax is offset if systematic TDD + design eliminates 30-40% of bugs. Plausible but unverified; requires controlled A/B benchmark to confirm. Evidence: None found in synthesis.

- **Skill injection risk is ecosystem-wide, not superpowers-specific** — any skills framework inherits vulnerability to malicious payloads. Superpowers amplifies it by forcing "skills-first" priority, but this is a design choice, not a unique weakness. Mitigation: package signing, version pinning, sandboxing (not documented in superpowers).

- **Subagent TDD bypass is confirmed permanent, not a tracked bug** — Issue #237 closed by maintainer as Claude Code platform limitation: "There's not much superpowers can do about this on the plugin side." SessionStart hooks don't propagate to subagents by design. No workaround planned. Marketing claim "enforce TDD" is permanently overstated for any multi-agent workflow. *Updated April 13, 2026.*

- **Token exhaustion may be usage-pattern-specific** — Issue #953 documents exhaustion on a Google Calendar task; other users report normal performance. Could indicate suboptimal task complexity or context management in that example, not universal failure. Counterpoint: Issue #190, #750, #832 show consistent pattern over 2+ years.

---

## Gaps & Unknowns

### Critical Gaps

- **No independent performance benchmarks (superpowers + Claude vs. vanilla Claude)** — core value prop hinges on "systematic development reduces bugs and rework." If token cost is worth it, payoff should be measurable (input tokens, output tokens, rework cycles, time-to-done). Not found in any published source.

- **Real production adoption data absent** — 140K stars but no case studies of teams shipping with superpowers; Hacker News comments are anecdotal; DEV Community posts from freelancers, not enterprises. Stars ≠ users; 1,528/24-hour spike suggests trend, not sustained adoption.

- **Skill registry curation & security process undefined** — unclear if obra curates superpowers-skills or if all community skills inherit full 36% vulnerability rate. No documented signing, version pinning, or sandboxing.

### Significant Gaps

- **Token efficiency net-of-rework prevention (trade-off analysis missing)** — 22K-token startup cost is clear; "rework prevention value" is plausible but unquantified. Cannot optimize for ROI without this data.

- **Platform-specific token overhead variance** — Copilot CLI and Codex report higher consumption; no quantitative comparison vs. Claude Code. Cannot optimize platform choice.

- **Subagent discipline propagation workaround** — Issue #237 closed without documented mitigation. For enterprises delegating to subagents, this is a limitation, not a feature.

---

## Confidence Summary

- **HIGH:** 15 findings (modular architecture, two-stage review, git worktree, systematic debugging, 22K-token preload problem, token exhaustion + 17-day maintainer silence, v5.0.7 still latest as of April 13, Jesse Vincent backing, 140K stars, active development with declining critical-issue responsiveness, platform degradation, no independent benchmarks, adoption unverified, subagent TDD bypass confirmed permanent, subagent failure modes multiplying)
- **MEDIUM:** 7 findings (TDD behavioral persuasion on main session, skill auto-trigger conflicts, skill loading failures, prompt injection, 94% rejection rate single-source, platform token variance, enforcement framing)
- **LOW:** 3 findings (multi-platform "full support" claim, Copilot CLI bootstrap injection, 85-95% test coverage)
- **UNVERIFIED:** 3 gaps (total token efficiency net-of-rework, real production adoption, skill registry curation)

*Last refreshed: April 13, 2026 — Issue #953 status, Issue #237 closure, release cadence verified via gh CLI.*
