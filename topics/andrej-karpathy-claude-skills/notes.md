---
title: Andrej Karpathy's Claude Skills — Research Notes
tags: [research, findings, claude-code]
created: 2026-04-10
---

# Andrej Karpathy's Claude Skills — Research Notes

## Key Findings

### Attribution & Provenance

- **[HIGH]** Four principles (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) derive from Andrej Karpathy's scattered observations on X/Twitter and blog comments (2024–2025), not a formal publication. The forrestchang/andrej-karpathy-skills repository distilled these observations into structured CLAUDE.md format — [GitHub: forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)


- **[MEDIUM]** Karpathy did not formally codify or publish these principles as a methodology. They are community-derived best-guesses from informal statements. Repository is not officially endorsed by Karpathy — [Verified Synthesis: Finding 1](verified-synthesis.md)

### Effectiveness & Empirical Validation

- **[UNVERIFIED]** No peer-reviewed study, controlled trial, or large-scale benchmark validates that following Karpathy principles improves code quality, reduces defect rates, or prevents the mistakes they claim to address. Effectiveness is treated as self-evident but empirically unproven — [Deep-Dive: Claim 2](verified-synthesis.md)

- **[HIGH]** The repository provides anecdotal benefits (clearer prompts, fewer diffs) but does not quantify impact. Community claims are based on user reports and self-reported productivity, not comparative testing — [Verified Synthesis: Finding 3](verified-synthesis.md)

- **[MEDIUM]** CLAUDE.md instructions are demonstrably ignored by Claude over conversation length. Multiple documented failure cases show Claude consistently reading CLAUDE.md, acknowledging understanding, then violating instructions within the same session. Instructions degrade in attention priority as conversation grows; by turn 5–10, initial CLAUDE.md has been "diluted" in context window — [Dev.to: "Your CLAUDE.md Instructions Are Being Ignored"](https://dev.to/albert_nahas_cdc8469a6ae8/your-claudemd-instructions-are-being-ignored-heres-why-and-how-to-fix-it-23p6), [GitHub Claude Code Issue #15443](https://github.com/anthropics/claude-code/issues/15443)


### Karpathy's Position & Evolution

- **[HIGH]** Karpathy directly stated in April 2026: "I'm not very happy with the code quality and I think agents bloat abstractions, have poor code aesthetics, are very prone to copy pasting code blocks and it's a mess, but at this point I stopped fighting it too hard and just moved on. **The agents do not listen to my instructions.**" This is a primary source statement from the principles' originator directly contradicting the effectiveness claim — [Andrej Karpathy on X](https://x.com/karpathy/status/2035173492447224237)

- **[MEDIUM]** Karpathy's thinking has evolved beyond the "Think Before Coding" framework. 2024 focused on coding principles; 2025 introduced "vibe coding" (forget the code exists, trust the LLM); 2026 emphasis is "agentic engineering" (orchestrating agents with human oversight). This arc shows the four-principles framework is philosophical scaffolding from an earlier era, not his current recommended practice — [New Stack: "Vibe Coding is Passé"](https://thenewstack.io/vibe-coding-is-passe/), [Verified Synthesis: Finding 7](verified-synthesis.md)

### Ecosystem & Adoption

- **[HIGH]** Repository achieved significant adoption: 11.1k–11.4k GitHub stars, distributed via three channels: standalone CLAUDE.md file (copy-paste), Claude Code plugin (marketplace), and reusable skill package (SKILL.md format) — [GitHub: forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)

- **[HIGH]** Broader CLAUDE.md ecosystem is active and maturing. Multiple competing repositories (shanraisshan/claude-code-best-practice with 7k+ stars, FlorianBruniaux/claude-code-ultimate-guide, MuhammadUsmanGM/claude-code-best-practices), plus HumanLayer and Builder.io guidance. Community consensus emphasizes concision (< 300 lines, ideally < 60), strategic instruction budgets (150–200 instructions), and living documentation that evolves with projects — [HumanLayer: "Writing a Good CLAUDE.md"](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

- **[MEDIUM]** General Claude Code adoption shows measurable metrics: 4% of all public GitHub commits (2026), case studies documenting 40% productivity increases, task compression (4 person-months to 2 months), 70% adoption in Fortune 100 companies. However, these metrics reflect general Claude Code adoption, not specific effectiveness of Karpathy principles — [Claude AI 2026 statistics](https://www.the-ai-corner.com/p/claude-ai-2026-guide-stats-workflows)

- **[HIGH]** Alternative implementations demonstrate ecosystem scale: Everything Claude Code (100k+ stars) is a specialist agent cluster built on similar principles; Nano Claude Code is a minimal Python reimplementation. Community variations across browser-based (Claudeck) and academic workflow contexts indicate widespread adoption and experimentation beyond the original CLAUDE.md format — [GitHub: affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)

### Official Alignment

- **[HIGH]** Anthropic's official Claude Code best practices documentation emphasizes verification, exploration-planning-implementation separation, context management, and specific prompting. These patterns directly align with Karpathy's principles, particularly Goal-Driven Execution (verification) and Think Before Coding (planning) — [Claude Code Best Practices (Official)](https://code.claude.com/docs/en/best-practices), [Claude Blog: Using CLAUDE.md Files](https://claude.com/blog/using-claude-md-files)

- **[MEDIUM]** This alignment is surface-level. Anthropic emphasizes these practices as general best practices, not specifically as validation of Karpathy's framework. Alignment does not imply either official guidance or Karpathy's principles are empirically effective — [Verified Synthesis: Finding 12](verified-synthesis.md)

## Counterarguments & Risks

### Principles Address Real Pitfalls

LLMs are demonstrably prone to over-abstraction, copy-paste duplication, verbose code, and scope creep. The four principles directly target these behaviors. However, addressing a problem doesn't prove the solution works — [HIGH confidence in problem existence; UNVERIFIED for solution effectiveness]

### Karpathy Halo Effect Creates False Confidence

Repository benefits from reputation without formal endorsement. Users may assume principles are proven when they're community-interpreted best-guesses — [HIGH confidence]

### Survivorship Bias

Successful users report results; failed experiments are silent. No mechanism to measure how many teams tried and abandoned the framework — [MEDIUM confidence]

### CLAUDE.md Is Not a Reliable Control Mechanism

Instructions fade over conversation length and are demonstrably ignored. Framework is useful for team philosophy but cannot be relied upon as a guarantee of LLM behavior — [MEDIUM confidence with documented failure cases]

### Effectiveness Claim Directly Contradicted by Originator

Karpathy's 2026 statement ("agents do not listen to my instructions") is the strongest possible evidence against the framework's core premise. If the principles don't work for Karpathy, why assume they work for others? — [HIGH confidence in contradiction]

### Framework Reflects Obsolete Thinking

Karpathy's current focus is agentic engineering, not structured human coding guidance. Adopting this framework may be stepping backward in thinking rather than forward — [MEDIUM confidence; based on public statements]

## Gaps & Unknowns

- **No quantified effectiveness for Karpathy principles specifically:** No A/B testing, no measurement of defect rate reduction, no comparison of code quality metrics between teams using principles vs. controls. Verdict cannot claim improvement without this data — **Critical gap**

- **CLAUDE.md failure rate unknown:** No quantitative data on how often instructions are followed vs. ignored, degradation rate over conversation length, or comparison across Claude model versions. Reliability is unquantified — **Critical gap**

- **Adoption metrics for this repository specifically:** Star count is a proxy, but no public data on downloads via Claude Plugin Hub, percentage of Claude Code projects using this specific CLAUDE.md, fork count, or community contributions. Actual usage is unknown — **Significant gap**

- **Comparative effectiveness across frameworks:** No head-to-head comparison of Karpathy principles vs. Anthropic standard best practices vs. other LLM coding guidelines. Cannot recommend Karpathy over alternatives without this data — **Significant gap**

- **Long-term maintenance patterns:** No data on whether code written under goal-driven execution scales to multi-month projects, team-size effects, or code complexity thresholds. Unproven for large teams or long-duration projects — **Significant gap**

## Confidence Summary

| Rating | Count | Examples | |--------|-------|----------| | **HIGH** | 7 | Four principles exist; derive from Karpathy observations; significant adoption (11.1k stars); ecosystem active (7k+ competing repos); alignment with Anthropic official guidance; no peer-reviewed validation exists; Karpathy contradicts effectiveness claim | | **MEDIUM** | 4 | Partial attribution to Karpathy (community-maintained, not formally endorsed); CLAUDE.md failure cases (documented); RCT evidence (experienced developers slow down); Karpathy's evolved thinking (2026 agentic engineering shift) | | **LOW** | 2 | Effectiveness of specific principles; comparative advantage over alternatives | | **UNVERIFIED** | 1 | Core effectiveness claim (directly contradicted by Karpathy 2026 + zero evidence) |
