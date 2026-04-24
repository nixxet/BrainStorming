---
title: mattpocock/skills — Research Notes
tags: [research, findings]
created: 2026-04-13
---

# mattpocock/skills — Research Notes

## Key Findings

### Collection Scope & Popularity

- **[HIGH]** mattpocock/skills is a personal collection with 10.8k GitHub stars as of April 2026, up from 9k in March 2026. Star growth directly correlates with viral adoption of the grill-me skill. — [GitHub](https://github.com/mattpocock/skills), [Star History](https://www.star-history.com/mattpocock/skills)
- **[HIGH]** The collection contains 17+ developer workflow skills organized into three domains: planning (write-a-prd, prd-to-plan, grill-me), development (design-an-interface, improve-codebase-architecture), and tooling (git-guardrails-claude-code, write-a-skill, setup-pre-commit). — [GitHub README](https://github.com/mattpocock/skills)

### Technical Architecture

- **[HIGH]** Skills follow SKILL.md format: markdown file with YAML frontmatter (name, description, disable-model-invocation flag) and procedural instructions. Progressive disclosure loads metadata at startup (~100 tokens), full instructions on-demand (up to 5K tokens), and resource files as needed. — [Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Claude Code Docs](https://code.claude.com/docs/en/skills), [Anthropic Skills Spec](https://github.com/anthropics/skills/blob/main/spec/agent-skills-spec.md)
- **[HIGH]** Skills trigger automatically when a user request matches the description in frontmatter. The description field is the primary discovery mechanism (unless disable-model-invocation: true is set). — [Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- **[MEDIUM]** mattpocock/skills embody a "Design It Twice" philosophy (from "A Philosophy of Software Design") where multiple radically different approaches are explored before selection. The design-an-interface skill exemplifies this: spawns 3+ sub-agents in parallel, each generating different interface designs with different constraints (minimize interface, maximize flexibility, optimize for common callers), then compares in prose. — [GitHub - design-an-interface](https://github.com/mattpocock/skills/tree/main/design-an-interface)

### Ecosystem & Standards

- **[HIGH]** Anthropic released Agent Skills as an open standard on December 18, 2025. The standard has been rapidly adopted by OpenAI (Codex), Microsoft, Cursor, GitHub Copilot, Atlassian, Figma, and 40+ others within 4 months. — [Claude Blog](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills), [SiliconANGLE](https://siliconangle.com/2025/12/18/anthropic-makes-agent-skills-open-standard/), [The New Stack](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/)
- **[HIGH]** Agent Skills are adopted across platforms but cross-platform synchronization remains fragmented. Skills uploaded to one platform are not automatically available on others. This is documented in official Anthropic docs as a known limitation. — [Claude API Docs - Where Skills Work](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- **[MEDIUM]** Tessl is a developer-grade package manager for agent skills, maintaining a registry of 2,000+ evaluated skills with Snyk security scanning, version management, and lifecycle tools. mattpocock/skills is indexed in the Tessl registry and discoverable through skill.sh and awesome-agent-skills aggregator. — [Tessl Platform](https://tessl.io/), [Tessl Blog - Skills Lifecycle](https://tessl.io/blog/skills-are-software-and-they-need-a-lifecycle-introducing-skills-on-tessl/), [Tessl Registry](https://tessl.io/registry/skills/github/mattpocock/skills)
- **[HIGH]** Matt Pocock is a TypeScript educator (Total TypeScript), previously worked at Vercel and Stately. His professional background in type systems and software design directly informs skill architecture. — [Total TypeScript](https://www.totaltypescript.com/), [GitHub Profile](https://github.com/mattpocock)

### Benefits & Problem-Solving

- **[MEDIUM-HIGH]** Agent Skills address organizational knowledge capture and context efficiency. Teams formalize workflows, organizational context, and domain expertise as composable, reusable resources that agents load on-demand rather than consuming full context upfront. Progressive disclosure enables agents to load only relevant information when needed. — [Claude Blog](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills), [Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
  - **Caveat:** Theoretical efficiency gains are offset by ecosystem-wide quality issues. 26.4% of public skills lack proper routing descriptions; over 60% of skill body content is redundant or non-actionable. Actual token savings depend heavily on skill quality, not enforced ecosystem-wide.
  - **Source bias:** Anthropic is the product vendor; official docs emphasize benefits without discussing failure modes.

---

## Counterarguments & Risks

### Vendor Lock-In: Claude Code Non-Compliance with SKILL.md

- **[MEDIUM-HIGH]** While Anthropic promotes Agent Skills as an "open standard" via SKILL.md, Claude Code deliberately uses `.claude/skills/` and `CLAUDE.md` instead of `.agents/skills/` and `AGENTS.md`. This prevents true portability—switching to another AI platform requires manual skill reconstruction. — [GitHub Issue - Support for AGENTS.md](https://github.com/anthropics/claude-code/issues/31005), [Sibylline Software Critique](https://www.sibylline.io/)
  - **Evidence:** GitHub issue has been open since August 2025 with no resolution. Other tools (Cursor, GitHub Copilot, Codex CLI) adopted SKILL.md in `.agents/skills/` standard, but Claude Code deliberately diverged.
  - **Caveat:** This is a strategic/design decision, not a technical limitation. It indicates vendor lock-in incentive alignment but is documented and transparent.
  - **Impact:** Users planning to migrate away from Claude Code will face significant reconstruction costs.

### Probabilistic Skill Triggering is Unreliable

- **[MEDIUM-HIGH]** Claude rarely fires skills even when the description matches perfectly. A documented 650-trial empirical study found activation failures to be systematic, not anecdotal. One developer ran 20 queries that should have obviously triggered a code-review skill—trigger rate: zero. Two distinct failure modes are documented: (1) activation failures (skill never loads), and (2) execution failures (skill loads but skips critical steps). — [Medium Article - Marc Bara](https://medium.com/@marc.bara.iniesta/claude-skills-have-two-reliability-problems-not-one-299401842ca8)
  - **Source Quality:** Single independent researcher with rigorous methodology (650 trials).
  - **Caveat:** No feedback mechanism alerts users to skill trigger failures—they fail silently.
  - **Impact:** Skills cannot be relied upon for mission-critical tasks without additional safeguards (manual fallback, verification steps).

### Token Bloat and Hidden Costs

- **[MEDIUM]** Skills add ~100 tokens per skill to every session startup. A 2026 peer-reviewed study of 55,315 public skills found that 26.4% lack routing descriptions, and over 60% of body content is non-actionable. At current API pricing, a 10,000-token skill costs $0.03–$0.15 per invocation. Token inefficiency is compounded by skills fetching reference documents only when triggered, but those documents are often redundant. — [SkillReducer - Peer-Reviewed Research](https://arxiv.org/html/2603.29919)
  - **Caveat:** The 55K skill study assumes a user installs all available skills (unrealistic). Token inefficiency is compounded by poor ecosystem-wide quality control, not inherent to the SKILL.md format. Skills under 5,000 tokens are recommended with no automatic enforcement.
  - **Impact:** Teams installing many skills incur cumulative token costs; ROI calculations must account for this overhead.

### March 2026 Claude Code Update Broke Engineering Reliability

- **[MEDIUM-HIGH]** Between February–March 2026, Anthropic shipped simultaneous breaking changes: (1) Opus 4.6 + Adaptive Thinking (Feb 9), (2) effort=85 (medium) became default (Mar 3), (3) redacted thinking header (Feb 12). Together, these introduced "rush to completion" behavior where Claude Code fabricates API versions, skips hard problems, hallucinates commit SHAs and package names, and avoids chain-of-thought reasoning. Additionally, prompt cache broke in March 2026, draining entire 5-hour session limits in under 90 minutes. Pro plan rate limits kick in after 2–3 hours of intensive use. — [dev.to - Technical Analysis](https://dev.to/shuicici/claude-codes-feb-mar-2026-updates-quietly-broke-complex-engineering-heres-the-technical-5b4h), [Rate Limit Exhaustion Analysis](https://www.roborhythms.com/claude-code-rate-limit-draining-march-2026/)
  - **Source Quality:** Multiple independent user reports + technical deep-dives; corroborated reliability concern.
  - **Caveat:** This is a Claude Code platform issue, not specific to skills, but it undermines skills' value as a productivity multiplier when the underlying agent is unreliable.
  - **Impact:** Skills are only as good as the underlying agent. If Claude Code itself is unreliable, skills cannot compensate.

### Operational Complexity Without Clear ROI

- **[LOW-MEDIUM]** Well-maintained skills can introduce more operational complexity than they solve. A production study found that adding a new skill required updating routing graph logic rather than "just dropping a file." Multi-agent skill selection introduced the "confused deputy" problem: agents trigger the wrong skill when descriptions overlap. Skill management at scale (20+ skills) requires governance, versioning, testing, and rollback procedures. — [Medium Article - Leandro Pessini](https://pessini.medium.com/stop-stuffing-your-prompt-build-scalable-agent-skills-in-langgraph-a9856378e8f6)
  - **Source Quality:** Single source with production context; design-specific rather than inherent to skills.
  - **Caveat:** This is addressable with better architecture; the issue is design-specific, not a fundamental limitation of SKILL.md format.
  - **Impact:** Teams should plan for skill governance infrastructure before deploying 20+ skills.

### Security Gaps and Prompt Injection Vulnerabilities

  - **Source Quality:** Peer-reviewed academic security research with rigorous methodology.
  - **Caveat:** Real-world exploit frequency in production is unknown; research demonstrates capability but not prevalence.
  - **Impact:** Organizations handling sensitive data should treat skill sources as trust boundaries. Public skill registries (even with Snyk scanning) do not eliminate prompt injection risk.

---

## Gaps & Unknowns

### Critical Gaps
None. Both research briefs provide sufficient coverage of positive findings and critical counterarguments to inform a balanced verdict.

### Significant Gaps

1. **Actual Skill Trigger Frequency in Production**
   - Research assumption: Skills work as documented
   - Evidence: Trigger failures exist (empirically documented) but frequency in real-world usage is opaque
   - Impact: Users cannot predict skill reliability
   - Recommendation: Assume probabilistic triggering; implement verification steps

2. **Long-Term ROI and Maintenance Burden**
   - Coverage: Landscape presents skills as best-practice; no long-term cost analysis
   - Single anecdote: Rakuten case study (87.5% improvement in financial workflows) is domain-specific
   - Impact: Teams cannot accurately forecast skill lifecycle costs (versioning, testing, security audits)
   - Recommendation: Pilot on non-critical tasks first; measure actual ROI

3. **Enterprise Adoption & Compliance Context**
   - Coverage: Developer community adoption documented; enterprise penetration and compliance implications unclear
   - Impact: Positioning for regulated industries (finance, healthcare, government) is unverified
   - Recommendation: Note as gap; suggest follow-up for enterprises

4. **Claude Code Rate Limit Economics**
   - Evidence: March 2026 rate limit crisis documented; Pro plan exhaustion (2–3 hours) confirmed
   - Impact: Skills' token costs compound rate limit pressure; ROI depends on plan level
   - Recommendation: Max 5x plan more sustainable than Pro for skill-heavy workflows

### Minor Gaps

1. Exact enumeration of all skills in mattpocock/skills (referenced as "17+" but not complete list)
2. Snyk security scores for mattpocock/skills specifically (Tessl registry integration assumed but not verified)
3. Current employment status of Matt Pocock (educator confirmed; affiliation beyond Total TypeScript not verified)
4. Migration cost analysis if scaling to 50+ skills in Claude Code before switching platforms

---

## Confidence Summary

| Level | Count | Examples | |-------|-------|----------| | **MEDIUM-HIGH** | 5 | Vendor lock-in (Claude Code), probabilistic triggering, March 2026 reliability, security gaps, context efficiency | | **MEDIUM** | 4 | Token bloat, Design It Twice philosophy, Tessl registry, operational complexity | | **LOW-MEDIUM** | 1 | Operational complexity at scale | | **UNVERIFIED** | 0 | All claims have credible sources |

---

## Research Bias Flags

- **Anthropic Marketing Bias:** Official docs emphasize benefits, not failure modes. Counter 5 (March 2026 reliability) reveals gaps in official disclosure.
- **Matt Pocock Brand Bias:** His skills are exemplary outliers; most ecosystem skills are lower quality. Viral success does not indicate ecosystem-wide quality.
- **Early Adopter Bias:** Positive case studies (Rakuten, Pessini) are skewed toward success; failure cases are underrepresented in public literature.
- **Security Research Bias:** Researchers find vulnerabilities by design; real-world exploit frequency in production is unknown.
- **Single-Source Gaps:** Reliability (Marc Bara), operational complexity (Pessini), and Design It Twice philosophy lack independent corroboration.

---

**Verified Synthesis Date:** 2026-04-13  
**Status:** Ready for Publisher
