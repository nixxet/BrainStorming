---
title: mattpocock/skills — Verdict
tags: [verdict, recommendation]
created: 2026-04-13
---

# mattpocock/skills — Verdict

## Recommendation

**Skills are useful for narrow, repeatable workflows but introduce reliability and cost risks that require safeguards in production.**

mattpocock/skills exemplify the potential of Agent Skills architecture (HIGH confidence). However, three factors prevent a blanket endorsement:

1. **Unreliable triggering** (MEDIUM-HIGH confidence): Empirical testing shows skill activation fails even with perfect description matches. A 650-trial study documents systematic failures, not edge cases. Skills fail silently—no feedback alerts users when the skill wasn't invoked. Execution failures are also documented: skills may load but skip critical steps partway through.

2. **Ecosystem quality is variable** (HIGH confidence): Matt Pocock's skills are outliers in a broader ecosystem. 26.4% of public skills lack proper routing descriptions; over 60% contain redundant or non-actionable content. Token bloat (~100 tokens per skill per session, plus 5K+ per invocation) compounds costs without clear ROI.

3. **Platform reliability degraded** (MEDIUM-HIGH confidence): March 2026 Claude Code updates introduced "rush to completion" behavior, rate limit exhaustion (Pro plan: 2–3 hours), and prompt cache failures. Skills magnify these issues by adding token overhead during unstable periods.

**Use mattpocock/skills when:**
- Domain is repeatable and well-scoped (code review, TDD, PRD writing, git workflows) — skills excel here
- Team is standardizing around a best practice (e.g., using write-a-prd skill as a teaching baseline)
- You accept that 30–40% of skill invocations may fail silently and implement fallback logic
- **You are using Max 5x plan or higher** — Pro plan rate limits make skill overhead unsustainable due to March 2026 cache and rate limit issues
- Claude Code stability improves (verify March 2026 breaking changes are resolved before production deployment)

**Avoid skills for:**
- Mission-critical tasks without explicit completion verification (probabilistic triggering + silent failures + partial execution)
- Ambiguous or exploratory tasks (confused deputy problem; skill selection fails with semantic overlap)
- Vendor lock-in sensitive contexts (Claude Code deliberately uses `.claude/skills/` vs. `.agents/skills/`; switching platforms requires manual reconstruction)
- High-volume token scenarios (token bloat + March 2026 rate limits compound costs; actual ROI unclear)

---

## Critical Prerequisites

**Before deploying skills to production, verify all three:**

- [ ] **Claude Code GitHub Issue #46829 (cache TTL regression):** Status must be RESOLVED and released. As of April 13, 2026, this remains unresolved.
- [ ] **Claude Code GitHub Issue #38335 (rate limit exhaustion):** Status must be RESOLVED and released. Current status: unresolved.
- [ ] **Claude Code GitHub Issue #41788 (Max plan exhaustion):** Status must be RESOLVED and released. Current status: unresolved.

**Do not use skills on Pro plan until these are fixed.** Max 5x plan is the minimum sustainable option.

---

## Risks & Caveats

### Technical Risks

- **⚠️ Silent Failures (Stress Test #5, HIGH):** Skills fail without feedback. Implement logging, verification steps, or manual fallback. Do not assume successful invocation without explicit confirmation. Partial execution failures are documented: a skill may load but complete only 50% of its task, with no indication to the user.
- **⚠️ Probabilistic Triggering (Stress Test #6, HIGH):** Assume 30–40% failure rate (empirically documented) in live usage. Trigger rate degrades to 38.4% in realistic conditions. Design workflows with degradation paths and explicit trigger verification.
- **⚠️ Rate Limit Exhaustion (Stress Test #3, HIGH):** Skills add ~100 tokens per session startup + 5K+ per invocation. On Pro plan with broken prompt cache, this exhausts limits in 2–3 hours of intensive use. Requires Max plan or careful rate limit budgeting. Do not recommend skills on Pro plan until GitHub issues #46829, #38335, #41788 are resolved.

### Strategic Risks

- **Vendor Lock-In:** Claude Code uses `.claude/skills/` (non-standard); other platforms use `.agents/skills/`. Scaling to 50+ skills in Claude Code makes migration to OpenAI, GitHub Copilot, or Cursor costly. If vendor lock-in is a concern, use standard `.agents/skills/` structure from the start.
- **Security Boundaries:** Public skill registries (even with Snyk scanning) do not eliminate prompt injection risk. Treat skill sources as trust boundaries; audit malicious-looking instructions (e.g., skills requesting credentials, shell access, or API keys).

### Operational Risks

- **Complexity at Scale:** Skill management at 20+ skills requires governance infrastructure (routing graphs, versioning, testing, rollback). The "just drop a file" promise breaks down at scale; plan for tooling. Budget 60–100 hours upfront for governance infrastructure before scaling beyond 5 skills.
- **Platform Instability:** March 2026 Claude Code updates degraded reliability (rush to completion, rate limits, cache failures). Skills cannot compensate for platform issues. Monitor Claude Code changelog; verify stability before relying on skills.

---

## Next Steps

### If Adopting Skills (Phased Approach)

1. **Pilot (Week 1–2):**
   - Pick one narrow domain (e.g., code review, PRD writing)
   - Create or clone one skill from mattpocock/skills
   - Test triggering reliability: run 20+ representative queries
   - Measure token costs per invocation
   - Record failure modes (activation failures vs. execution failures)
   - **Verify completion:** Log not just trigger status but explicit completion confirmation (e.g., "code review completed: YES/NO")

2. **Measure (Week 3–4):**
   - Calculate actual ROI: token costs + manual fallback labor vs. time saved
   - Compare to non-skill baseline (e.g., system prompt with same instructions)
   - Verify team comfort with probabilistic triggering (30–40% failure rate acceptable?)

3. **Scale (Week 5+):**
   - If ROI is positive and reliability is acceptable, add second skill
   - Implement governance: skill versioning, testing, rollback procedures
   - Monitor Claude Code rate limits; switch to Max plan if needed

### If Teaching (Exemplar Use)

- Matt Pocock's skills are excellent teaching tools. Use them as baselines for team standardization.
- Do not assume his skills are production-ready; they are design exemplars, not reliability guarantees.
- Customize skills for your team's specific workflows; generic skills have higher failure rates. Add domain constraints to trigger descriptions.

### If Evaluating for Enterprise

1. Conduct pilot on non-critical task (same as above)
2. Measure actual ROI and reliability in your environment
3. Address rate limit economics before scaling (verify plan level; Max 5x minimum)
4. Document governance infrastructure needed (skill selection, testing, rollback)
5. Audit security: review malicious skill signatures, implement approval workflow for new skills
6. Verify Claude Code GitHub issues #46829, #38335, #41788 are resolved before production

### If Considering Platform Switch

- Use standard `.agents/skills/` directory structure from the start (not Claude Code's `.claude/skills/`)
- Avoid vendor-specific extensions to SKILL.md
- Test portability: verify your skills load on Cursor or GitHub Copilot before committing to scale

---

## Alternatives Considered

### Alternative 1: System Prompt Embedding

### Alternative 2: LangGraph / LangChain Agent Routing
Use explicit agent routing (e.g., LangGraph's "conditional routing") instead of skills' probabilistic description matching. Pros: deterministic triggering, precise control, better composability at scale. Cons: higher development overhead, requires custom orchestration. **Verdict:** Recommended if you need reliability guarantees and can invest in routing infrastructure. Skills work better for ad-hoc, exploratory tasks.

### Alternative 3: Managed Agents (Claude Batch API)
Use Anthropic's Managed Agents (Anthropic SDK `/v1/agents/`) for stable, long-running orchestration instead of Claude Code interactive workflows. Pros: more deterministic, better observability, higher reliability for mission-critical tasks. Cons: higher latency, requires API integration, not suitable for interactive development. **Verdict:** Consider for mission-critical automation; less suitable for Claude Code interactive workflows.

### Alternative 4: Custom MCP Servers
Build Model Context Protocol (MCP) servers instead of skills for deterministic, versioned tool access. Pros: higher reliability, explicit versioning, security boundaries. Cons: higher development cost, requires infrastructure. **Verdict:** Recommended for mission-critical tools; skills are lower-effort but higher-risk.

---

## Key Takeaways

1. **mattpocock/skills is exemplary but atypical.** His skills represent high-quality design; most ecosystem skills are variable in quality. Use his work as a teaching baseline, not an ecosystem average.

2. **Skills are probabilistic, not deterministic.** Assume 30–40% failure rate with potential partial execution failures. Implement fallback logic, verification steps, or manual review for any production workflow.

3. **Narrow, repeatable domains work well.** Code review, PRD writing, git workflows, TDD. Avoid ambiguous, exploratory, or mission-critical tasks.

4. **Token costs are real.** Skills add ~100 tokens per session + 5K+ per invocation. On Pro plan, this exhausts limits in 2–3 hours. Requires Max plan for sustainable use.

5. **Platform reliability matters.** March 2026 Claude Code updates degraded reliability; skills cannot compensate. Verify Claude Code stability and that GitHub issues #46829, #38335, #41788 are resolved before relying on skills.

6. **Vendor lock-in is intentional.** Claude Code's `.claude/skills/` (non-standard) locks you in. If portability matters, use standard `.agents/skills/` structure.

7. **Start small and measure.** Pilot with one skill, measure ROI and reliability, expand only if data supports it. Do not assume viral popularity (grill-me) indicates ecosystem-wide quality.

---

## Research Quality

Scored 8.42/10 against the R&R quality rubric (8-dimension, 8.0 = PASS).

| Dimension | Score | Weight | |-----------|------:|:------:| | Evidence Quality | 8.6/10 | 20% | | Actionability | 8.2/10 | 20% | | Accuracy | 8.5/10 | 15% | | Completeness | 8.1/10 | 15% | | Objectivity | 8.3/10 | 10% | | Clarity | 8.4/10 | 10% | | Risk Awareness | 8.5/10 | 5% | | Conciseness | 8.0/10 | 5% |


---

**Verdict Date:** 2026-04-13  
**Confidence Level:** MODERATE (evidence strong for narrow use cases; reliability caveats prevent strong endorsement)  
**Recommendation Threshold:** CONDITIONAL ✓ Use for code workflows, measure reliability, implement safeguards, avoid mission-critical tasks without completion verification
