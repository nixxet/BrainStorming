---
title: Andrej Karpathy's Claude Skills — Verdict
tags: [verdict, recommendation, claude-code]
created: 2026-04-10
---

# Andrej Karpathy's Claude Skills — Verdict

## Recommendation

**Conditional recommendation: Use as a thinking framework and team philosophy, NOT as a guaranteed control mechanism.**

Adopt the four principles (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) if your team values structure and explicit coding guidance. These principles align with Anthropic's official best practices [HIGH confidence] and address real LLM pitfalls [HIGH confidence]. However, do not rely on them as a proof of improved code quality, as they lack peer-reviewed validation [HIGH confidence in absence of evidence] and are directly contradicted by Karpathy himself [HIGH confidence, primary source: "agents do not listen to my instructions"].

The framework is most valuable as a **shared mental model**—helping teams think intentionally about code quality, not as a **behavioral guarantee**. CLAUDE.md instructions degrade over conversation length and are demonstrably ignored [MEDIUM confidence].

---

## Risk Assessment Summary

| Risk | Severity | Tester Finding | Mitigation | |------|----------|----------------|------------| | Originator abandoned framework | Critical | Test-6: Team buy-in erodes when Karpathy contradiction discovered | Frame as community practice aligned with Anthropic guidance, not Karpathy methodology | | CLAUDE.md instructions degrade | High | Test-3: On 6+ month projects, instructions ignored by turn 12+ | /checkpoint every 5–8 turns; extract to SKILL.md; pair with code review | | Anthropic guidance may supersede | High | Test-11: Official docs cover 2/4 principles; dual sets create context overhead | Use Anthropic as primary; add only Simplicity First + Surgical Changes from Karpathy | | Zero effectiveness validation | High | Test-10: No peer-reviewed study; code quality claims unproven | Treat as thinking tool; pair with testing, linters, code review | | Experienced developers slow down | Medium | Test-5: 19% slowdown for expert developers on familiar code | Reserve AI for new integrations/unfamiliar patterns; not expert-domain work | | Attribution halo effect | Medium | Test-9: Halo causes misalignment adoption (wrong domain) | Check project-fit table first; skip BrainStorming, tmp |

---

## Risks & Caveats

### Critical Risk: Originator Has Abandoned the Framework

Andrej Karpathy stated in April 2026: **"The agents do not listen to my instructions."** This is the originator himself acknowledging that the core premise—that structured instructions reliably guide LLM behavior—doesn't work in practice. His 2026 thinking has shifted to "agentic engineering" (agents with broad autonomy, humans supervising) rather than "think before coding" (humans deliberate, agents execute precisely). Adopting this framework may be stepping backward in thinking.

[Source: Andrej Karpathy on X — HIGH confidence, primary source](https://x.com/karpathy/status/2035173492447224237)

### High Risk: CLAUDE.md Instructions Degrade Over Time

Instructions at the beginning of context lose importance as conversation grows. By turn 5–10, the initial CLAUDE.md has been "diluted" in the context window. Claude acknowledges the instructions, then violates them. This is not user error—it's a mechanism-level limitation of context-weighted attention.


**Mitigation:** Use `/checkpoint` after every 5–8 turns to save context and reset conversation. Extract principles to SKILL.md (persistent across checkpoint boundaries). Pair with mandatory code review gates; do NOT rely on CLAUDE.md alone for projects > 6 months.

[Sources: Dev.to article, GitHub Claude Code Issue #15443 — MEDIUM confidence, documented failure cases]

### High Risk: Multi-Agent Instruction Compliance Failure


### High Risk: Zero Effectiveness Validation

No peer-reviewed study, controlled trial, or large-scale benchmark validates that following Karpathy principles improves code quality, reduces defect rates, or prevents mistakes. The repository provides anecdotal benefits but does not quantify impact. You must treat effectiveness claims as unproven.

[Source: Deep-Dive corroboration, absence of evidence — HIGH confidence in absence]

### High Risk: Anthropic Guidance May Supersede Karpathy

Anthropic's official Claude Code best practices documentation is canonical, maintained, and covers 2 of 4 Karpathy principles directly (Think Before Coding = planning separation; Goal-Driven Execution = verification). Simplicity First and Surgical Changes are NOT explicitly in Anthropic docs. Using both sets creates dual instruction overhead in long conversations. For most teams, Anthropic guidance alone may be sufficient.

**Mitigation:** Use Anthropic official guidance as primary source. Add Karpathy's Simplicity First + Surgical Changes only as supplements (those 2 principles add unique value not in Anthropic docs). For solo developers with 8 projects: start with Anthropic docs, add Karpathy's 2 unique principles selectively.

[Source: Comparison of Anthropic Best Practices vs. Karpathy — HIGH confidence, Test-11]

### Medium Risk: Attribution Halo Effect


[Source: Verified Synthesis, Finding 2 — HIGH confidence]

### Medium Risk: Experienced Developers May Slow Down

An RCT found that experienced open-source developers were 19% slower when using AI coding tools, despite predicting they would be 24% faster. Participants believed they had been faster even after measured outcomes showed slowdown. If your team includes experienced developers with established workflows, structured instructions may disrupt rather than improve velocity.

[Source: Deep-Dive, METR RCT — MEDIUM confidence, RCT evidence]

---

## Next Steps

1. **If adopting:** Start with a minimal CLAUDE.md (under 60 lines, per community consensus). Focus on the principle most relevant to your domain (e.g., Surgical Changes for high-maintenance codebases, Goal-Driven Execution for feature-heavy projects). Measure actual code review feedback, defect rates, or merge conflict frequency before and after. Do not assume effectiveness without data.

2. **If extending:** Run A/B tests on your specific use cases. Compare code quality metrics (maintainability, test coverage, review time) for commits with and without explicit CLAUDE.md guidance. Document which principles work for your team and which don't.

3. **If recommending to others:** Frame as "best practices for coding discipline" not as "proven method to improve code quality." Caveat that effectiveness is unproven and that CLAUDE.md instructions fade over conversation length. Suggest supplementing with code review, automated testing, and continuous verification.

4. **For long-running projects:** Do not rely solely on CLAUDE.md to enforce quality. Use structural patterns (architectural guardrails, type systems, automated testing, code review gates) that don't degrade over time. CLAUDE.md is a thinking tool, not a safety mechanism.

---

## Runner-Up / Alternatives

If you want structured coding guidance without relying on a single community source:


- **shanraisshan/claude-code-best-practice** [HIGH adoption, 7k+ stars]: A competing framework with similar scope. No clearer than Karpathy principles; equally unvalidated. Use either, or blend both.

- **Agentic engineering principles** [MEDIUM confidence]: If Karpathy's thinking represents the industry direction, consider frameworks emphasizing agent orchestration and human oversight rather than human deliberation. Less prescriptive but more aligned with 2026 practice.

- **Your team's own coding standards** [Highest confidence]: Document what *your team* observes works (code review patterns, common mistakes, what reduces merge conflicts). This is context-specific and doesn't rely on external validation.

---

## Summary Table

| Aspect | Status | Confidence | |--------|--------|-----------| | **Principles address real pitfalls?** | Yes | HIGH | | **Principles improve code quality?** | Unproven | UNVERIFIED | | **Principles are formalized by Karpathy?** | Partially (community-maintained) | MEDIUM | | **Ecosystem is active?** | Yes (7k+ competing repos) | HIGH | | **Alignment with Anthropic guidance?** | Yes | HIGH | | **CLAUDE.md instructions are reliable?** | No (fade over time) | MEDIUM | | **Originator endorses this framework?** | No ("agents do not listen to my instructions") | HIGH | | **Recommended for all projects?** | No (conditional, project-dependent) | — | | **Recommended as sole quality mechanism?** | No (supplement with verification) | — |

---

## Research Quality

| Dimension | Score | Weight | |-----------|-------|--------| | Evidence Quality | 8/10 | 20% | | Actionability | 9/10 | 20% | | Accuracy | 8/10 | 15% | | Completeness | 8/10 | 15% | | Objectivity | 9/10 | 10% | | Clarity | 8/10 | 10% | | Risk Awareness | 9/10 | 5% | | Conciseness | 8/10 | 5% | | **Weighted Total** | **8.35/10** | — |

**Pipeline:** Researcher → Investigator → Analyzer → Writer → Critic → Tester → Publisher
**Tester Verdict:** CONDITIONAL (3 HIGH, 0 CRITICAL, 12 tests)
**Published:** 2026-04-10
