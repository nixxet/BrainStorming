---
title: obra/superpowers — Verdict
tags: [verdict, recommendation]
created: 2026-04-09
revision: 2
---

# obra/superpowers — Verdict

## Recommendation

**CONDITIONAL ADOPT — Claude Code + complex production feature development — ONLY under all three pre-requisites below.**

**Pre-requisites (must all be true before adopting):**

1. **Token exhaustion watchlist** — Issue #953 (complete context burnout in 5 minutes on a routine task, unresolved 13+ days as of April 9, 2026) has no maintainer response. Before adopting, verify your session type doesn't hit this pattern: run superpowers on a representative task and confirm context remains >50% after 30 minutes. If sessions exhaust early, hold adoption until Issue #953 is resolved or confirmed as an isolated edge case.

2. **Skill vetting discipline** — Commit to vetting every skill before import. No unreviewed third-party skills from community forks or GitHub. Obra/superpowers-skills has no package signing or curation process; 36% of ecosystem skills have documented flaws (OWASP, Snyk ToxicSkills). Auto-invoke amplifies unreviewed payloads. Your team must maintain a curated allowlist.

3. **Claude Code exclusively** — Framework is first-class on Claude Code only. If your team uses Copilot CLI (broken bootstrap, Issue #792), Droid (non-functional triggering, Issue #324), or Codex/OpenCode (severe token bloat, Issue #750), superpowers is not ready for your stack.

**Rationale:**

Superpowers delivers genuine workflow discipline for Claude Code users. Two-stage code review is a real differentiator vs. vanilla LLM agents [HIGH — verified by both Landscape and Deep-Dive briefs]. Systematic methodology (brainstorming → planning → git isolation → TDD → review) reduces integration bugs on production features.

However, three critical claims do not survive adversarial verification:

1. **Token efficiency is dramatically worse than marketed** — 22K tokens preloaded at startup (11% of 200K context) contradicts progressive disclosure guidance [Issue #190, #750, #832, #953 — HIGH confidence]. Issue #953 documents complete token exhaustion in 5 minutes on a routine task with zero maintainer response for 13+ days, suggesting the limitation is accepted or deprioritized.

2. **TDD "enforcement" is behavioral persuasion, not hard constraints** — framework encourages TDD via instruction design but subagents rationalize away the discipline when unsupervised (Issue #237 with test evidence — MEDIUM confidence). Marketing claim "enforce TDD" overstates reality.

3. **Multi-platform support is Claude Code-centric** — Copilot CLI bootstrap injection is broken (Issue #792), Droid has triggering failures (Issue #324), Codex/OpenCode have token bloat (Issue #750). Claim "works on 6 platforms fully supported" is misleading [LOW confidence for full support; MEDIUM-HIGH for Claude Code being first-class].

**For Claude Code + complex production features:** Adopt if the three pre-requisites above are met. The methodology discipline and two-stage review justify the token tax for disciplined teams.

**For quick fixes, exploratory/research work (spikes, algorithm comparisons, prototyping):** Skip. TDD-first model doesn't fit exploratory tasks; 22K-token ceremony adds overhead without payoff.

**For solo developers:** Skip. Subagent dispatch provides no parallelism for solo work; 22K-token startup overhead adds cost without the team coordination benefit that justifies it.

**For cross-platform deployment or teams on Copilot CLI / Codex:** Skip. Framework is broken or severely degraded on these platforms.

**For enterprises with compliance requirements:** Wait. No documented skill registry curation, no package signing, no security advisory process. Regulated industries (healthcare, finance) cannot adopt without external security scanning that superpowers does not provide.

---

## Risks & Caveats

- **Token exhaustion (BLOCKER — verify before adopting)** — Issue #953 (March 27, 2026) documents complete context burnout in 5 minutes on a routine Google Calendar task. Zero maintainer response for 13+ days. v5.0.7 released March 31 without addressing this. Pattern of related issues (#190, #750, #832) spanning 2+ years suggests the 22K-token preload problem is accepted, not being aggressively fixed. If session exhaustion breaks a mid-TDD cycle, the team must manually restart and re-explain context — wasting 30-60 minutes. [Issue #953](https://github.com/obra/superpowers/issues/953), [Issue #832](https://github.com/obra/superpowers/issues/832)

- **Skill injection (no protection — security pre-requisite required)** — Superpowers forces agents to invoke skills before all other logic; framework has no package signing, skill sandboxing, or curation process for obra/superpowers-skills. Ecosystem-level: 36% of agentic skills contain flaws (OWASP), Snyk ToxicSkills found 230+ malicious payloads in ClawHub's registry, SkillJect research (arxiv.org/html/2601.17548v1) shows 91% of malicious skills use prompt injection that's invisible to end users. A plausible-named community skill (e.g., "performance-analyzer") can inject instructions executed before the agent's intended task. Do not import unreviewed skills. [Security-review findings: 2 HIGH]


- **Platform degradation** — Full support only on Claude Code. Copilot CLI bootstrap injection broken (Issue #792), Droid skill-triggering broken (Issue #324), Codex/OpenCode token-bloated (Issue #750). Do not assume cross-platform portability. [LOW confidence for "fully supported" claim]

- **Headline metrics are unverified** — 94% PR rejection rate and 85-95% test coverage are self-reported or single-source claims. No independent benchmark or methodology specified. [blog.fsck.com](https://blog.fsck.com/2026/03/31/slop-prs/) — LOW confidence

- **Maintenance responsiveness declining** — Issue #953 (token exhaustion, March 27) has zero maintainer response for 17+ days as of April 13. v5.0.7 remains latest; no release since March 31. Critical token-exhaustion bug unflagged, unlabelled, ignored. [Issue #953](https://github.com/obra/superpowers/issues/953) — HIGH confidence *updated April 13, 2026*

- **Real production adoption unverified** — 140K GitHub stars correlate with visibility, not usage. 1,528 stars in 24 hours suggests viral trend, not sustained adoption. No case studies of teams shipping at scale with superpowers. [HIGH confidence for visibility; UNVERIFIED for adoption]

- **Organizational adoption requires change management** — Teams with existing workflows need 4-6 weeks of structured pilot before org-wide rollout. TDD overhead (30% time cost estimate) triggers team resistance if imposed without a controlled ROI measurement phase. Partial adoption (some teams use superpowers, some don't) fragments code review discipline and produces inconsistent quality — potentially worse than no adoption.

---

## Next Steps

1. **Before adopting:** Run the token exhaustion test: enable superpowers on a representative session (2K-line refactor, or equivalent complexity), monitor context window usage after 15 and 30 minutes. If context exceeds 70% in <30 minutes, hold adoption until Issue #953 is resolved.

2. **If adopting:** Budget 10-20 minutes overhead per project; maintain a curated skill allowlist (no unreviewed community forks); set up token monitoring (log context usage after each session); avoid delegating critical work to unsupervised subagents; stay below ~150K token "refill point" to maintain context flexibility.

3. **If evaluating before committing:** Run an independent A/B benchmark on your typical task type. Measure total tokens (input + output + refactor cycles) with and without superpowers over 5+ tasks. Track time-to-done and bug escape rate. This data is critical; publicly available benchmarks do not exist.

4. **For team adoption:** Pilot with one team for 4-6 weeks. Measure bug escape rate, rework cycles, and token consumption before scaling. Half-adoption (some teams, not others) creates inconsistent discipline and mixed reviews — worse than full-on or full-off.

5. **If using subagents:** Document that TDD enforcement does NOT propagate to subagent context (Issue #237). Implement manual verification or avoid delegation for critical feature development.

6. **For enterprise adoption:** Wait for (1) skill registry curation / security process documentation, (2) workaround for subagent TDD bypass, or (3) independent case study proving ROI on token cost. None are documented as of April 9, 2026.


---

## Runner-Up / Alternatives

**Aider** — Lightweight alternative for quick, collaborative development. Fewer features than superpowers (no brainstorming skill, weaker planning), but zero token overhead. Suitable for: quick fixes, exploratory work, teams without TDD discipline requirement. Trade-off: less systematic methodology.


---

## Confidence & Evidence Summary

This verdict rests on:
- **HIGH-confidence findings:** Token preload problem (4 issues, 2-year span), two-stage review value, platform degradation, no independent benchmarks
- **MEDIUM-confidence findings:** TDD behavioral persuasion (Issue #237 with test evidence), subagent bypass (platform limitation, documented), maintenance responsiveness concern (13-day unanswered token bug)
- **LOW-confidence findings:** Headline metrics (94% rejection, 85-95% coverage) — self-reported, no independent validation

**Bottom line:** obra/superpowers is well-engineered (solid Jesse Vincent backing, genuine architectural value) but overstates enforcement, token efficiency, and platform maturity in marketing. Recommend for Claude Code + complex disciplined production work under explicit pre-requisites; skip for quick fixes, exploratory tasks, solo developers, or cross-platform deployment.

