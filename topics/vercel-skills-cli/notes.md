---
title: Vercel Skills CLI — Research Notes & Findings
tags: [agent-skills, package-management, security, ecosystem, 2026]
created: 2026-04-06
status: Draft
---

# Vercel Skills CLI — Research Notes

## Key Takeaways

- **This is npm for agent skills, not a skill library itself** — CLI distribution mechanism, not content provider
- **Ecosystem is explosive but immature** — 83k+ skills indexed, but 36% contain flaws and 13.4% critical vulnerabilities
- **Security-first approach after ClawHub collapse** — Automated audits launched Feb 2026, but don't cover legacy skills
- **Implementation gaps block enterprise adoption** — Update mechanism broken, no private registry, no CI/CD reproducibility
- **Market is unsettled** — Three competing marketplaces (skills.sh, SkillsMP, ClawHub); leadership unclear

## Findings with Confidence Ratings

### 1. Agent Skills Standard is Solidifying (HIGH)
- Anthropic published agentskills.io as open standard December 18, 2025
- 26+ platforms adopted: Claude, GitHub Copilot, Cursor, VS Code, Microsoft, Figma, Atlassian
- Partner skills from Canva, Stripe, Notion, Zapier available at launch
- This creates a foundation for a cross-agent skill ecosystem (unlike agent-specific formats)

### 2. skills.sh is the CLI Market Leader (MEDIUM-HIGH)
- First and only cross-agent skill manager with full CLI (as of April 2026)
- 83,627 skills indexed, 8M+ installs tracked
- Launched January 20, 2026; built CLI + web directory simultaneously
- Vercel backing + integration with major agents (Claude Code, Cursor, Copilot, etc.) gives it distribution advantage
- However: SkillsMP indexes 71k skills (nearly as large) but lacks CLI
- **Caveat:** Market may consolidate; leadership not yet determined

### 3. Marketplace Security is a Prerequisite, Not Solved (MEDIUM)
- ClawHub malware incident (Jan-Feb 2026): 341+ malicious skills, 5 of top 7 downloads were malware
  - Led to ClawHub shutdown
  - Exposed the danger of user-driven skill distribution without audit
- Vercel's response: Automated audits via Snyk, Gen Digital, Socket (Feb 2026)
  - Each new submission scanned by three independent providers
  - Malicious skills hidden from search/leaderboards
  - Warnings shown before installation (skills@1.4.0+)
- **But**: Snyk ToxicSkills study (Feb 5, 2026) found 36% of 3,984 sampled skills have flaws; 13.4% critical
  - Study pre-dates full audit rollout; post-audit landscape unclear
  - Audits apply to new submissions; legacy skills may not be retroactively scanned
  - Risk: Installing random skill has ~13% critical-flaw chance

### 4. Update Mechanism is Critically Broken (HIGH)
- `npx skills update` fails silently on macOS and other platforms (Issue #371)
  - Root cause: Spawns nested npx process to reinstall; fails depending on npx resolution
  - No error messaging; silent failure
  - Unresolved as of April 2026
- **Impact:** Blocks security patching workflows; can't push skill updates to teams
- Related gaps:
  - Project-scoped installations don't update (Issue #337)
  - No lock file restore (`npx skills ci` equivalent) for CI/CD reproducibility (Issue #549)
  - No dynamic skill discovery for evolving repos (Issue #591)

### 5. Enterprise Features Are Missing (HIGH)
- **No private repository support** — Can't install from private GitHub repos (Issue #381)
  - Critical blocker for enterprises wanting internal skill libraries
  - No official docs, ETA, or workaround from Vercel
  - Users must fall back to manual cloning or npm private registries
- **No lock file restore** — Breaks reproducible builds
- **No version pinning** — Skills are Git-based, not versioned packages; can't pin to specific SemVer
- **Implication:** skills.sh works for open-source/public skill discovery, but not enterprise distribution

### 6. OpenClaw/ClawHub Ecosystem is Volatile (MEDIUM)
- OpenClaw hit 346K GitHub stars as of April 2026 (massive platform)
- ClawHub peaked at 3.2k curated skills with 1.5M+ downloads
- Had best UX (vector semantic search, versioning, CLI) of the three marketplaces
- **But:** Shut down due to malware campaign, leaving users orphaned
  - 341+ malicious skills found
  - "ClawHavoc" campaign designed to exfiltrate env vars and inject backdoor prompts
  - 800+ additional malicious skills flagged post-discovery
- **Lesson learned:** Curation alone is insufficient; automated scanning is necessary

### 7. SkillsMP Exists But Lacks Tooling (MEDIUM-LOW)
- 71k+ skills indexed (larger than skills.sh, nearly same size)
- No official CLI or auto-installer (ZIP download from web only)
- Low signal on quality or adoption (no install tracking)
- **Status unclear:** Who funds it? What's the governance model? No vendor backing evident
- **Implication:** Larger index but less friction reduction than skills.sh

### 8. Meta-Skill Pattern is Clever (MEDIUM)
- "find-skills" (784.9k installs) teaches agents how to discover and install other skills
- Self-bootstrapping: Agent learns to use the CLI to learn about capabilities
- This is a design pattern worth studying for other ecosystems

### 9. Market Scale is Real (HIGH)
- Agentic AI market: $11.79B projected for 2026
- Gartner: 40% of enterprises will embed task-specific agents by 2026 (vs <5% in 2025)
- 62% of organizations experimenting with agents; 23% scaling in production
- This explains why multiple competing marketplaces launched simultaneously

### 10. Agent Compatibility Claims Are Unverified (MEDIUM)
- Vercel claims support for "40+ agents"
- Mapping is hardcoded in CLI (knows where each agent looks for skills)
- **But**: No test matrix showing which agents reliably recognize which skill formats
- **Caveat:** Practical compatibility likely varies; more testing needed

## Counterarguments & Tensions

### "Skills.sh is the future of agent capability management"
- **Counter:** Update mechanism is broken, enterprise features missing, ecosystem still has 36% flawed skills
- **Nuance:** It's the leading tool, but not production-ready for all use cases

### "Automated security audits solve the skills.sh malware problem"
- **Counter:** Audits are necessary but not sufficient; they apply to new submissions, not legacy skills; Snyk study shows continued high flaw rate
- **Nuance:** Audits are better than ClawHub's manual curation, but still asymmetric risk profile

### "Agent Skills standard will unify the ecosystem"
- **Counter:** Standard is solid, but marketplace fragmentation continues (3 competitors); no clear winner yet
- **Nuance:** Standard is necessary but not sufficient; tooling and trust matter more

## Architecture & Implementation Details

### How Symlink Installation Works
- Skills are symlinked into agent-specific directories (e.g., `~/.claude/skills/`, `./.claude/skills/`)
- Symlinks enable instant updates without reinstall — update the source, all agents see it immediately
- Fallback to copy if symlinks not supported
- **Implication:** Elegant for personal/team use; less elegant for locked-down enterprise environments

### How Agent Directory Mapping Works
- CLI has hardcoded knowledge of where each agent expects to find skills
  - Claude Code: `.claude/skills/`
  - Cursor: `.cursor/skills/`
  - GitHub Copilot: `.copilot/skills/`
  - etc.
- On install, CLI looks up agent type, symlinks skill to correct directory
- **Implication:** Adding new agents requires CLI update; not extensible by users

### Audit Pipeline (Feb 2026+)
1. Skill submission → CLI submission endpoint
2. Scan triggered with Snyk, Gen Digital, Socket (3 independent providers)
3. Results aggregated, displayed on skills.sh
4. Malicious skills flagged, hidden from search/leaderboards
5. Direct navigation shows warning before install
- **Coverage:** New submissions only; legacy skills not retroactively scanned

## Ecosystem Gaps & Unknowns

### What We Don't Know
1. **SkillsMP funding/governance** — Who runs it? What's the business model?
2. **Snyk audit methodology** — How representative is the 3,984-skill sample? Why those specific skills?
3. **Post-audit landscape** — How many malicious skills were flagged and hidden by automated audits since Feb 2026?
4. **Agent compatibility matrix** — Which agents support which skill formats reliably? Test coverage unknown.
5. **Vercel's enterprise roadmap** — Is private registry support planned? When?
6. **Audit SLA** — How long from submission to audit completion?
7. **Skills.sh monetization** — How does Vercel plan to sustain this long-term? 
8. **Semver in skills** — Will skills move to versioned packages instead of Git-based distribution?

### What Needs Testing
- Does `npx skills add` actually work reliably across all 40+ claimed agents?
- How does the update mechanism fail, and when?
- Can you use private skills.sh behind a corporate proxy?

## Patterns Worth Stealing

### 1. Meta-Skill Pattern
Teaching an agent how to discover and install other skills. This is self-bootstrapping and lowers friction.

### 2. Agent-Agnostic Directory Mapping
The hardcoded mapping of agent → skill directory is useful reference architecture, even if not perfect.

### 3. Symlink-Based Installation
Instant propagation of updates without reinstall is elegant for multi-user/team scenarios.

### 4. Three-Provider Audit Model
Using independent security vendors (Snyk + 2 others) to triangulate on malicious skills is more robust than single-vendor audits.

## How This Evolves (Speculation)

**Near term (Q2-Q3 2026):**
- Bugfixes: `npx skills update` reliability, project-scope updates
- Feature gap: Private registry support (market demand will force this)
- Consolidation: SkillsMP may adopt CLI, or one marketplace acquires another

**Medium term (Q4 2026):**
- Version pinning and lock file semantics mature (borrowed from npm)
- Ecosystem stabilizes around winner (likely skills.sh, but not certain)
- Security audit coverage extends to legacy skills; flaw rate likely improves

**Long term (2027+):**
- Skills move to versioned packages instead of raw Git repos
- Private registries become standard for enterprise
- Skill dependencies become formalized (skills requiring other skills)

## Sources & References

### Ecosystem & Standards
- [agentskills.io](https://agentskills.io/home) — Official Agent Skills standard
- [The New Stack: Agent Skills: Anthropic's Next Bid to Define AI Standards](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/) — Standard history
- [Vercel: Introducing skills, the open agent skills ecosystem](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) — Launch announcement

### Marketplace & Tools
- [GitHub: vercel-labs/skills](https://github.com/vercel-labs/skills) — Repository, issues, activity
- [skills.sh](https://skills.sh) — Web directory and marketplace
- [Skills.sh Review (2026): Open Directory for AI Agent Skills](https://vibecoding.app/blog/skills-sh-review) — Independent review

### Security & Ecosystem Health
- [Snyk: Snyk Finds Prompt Injection in 36%, 1467 Malicious Payloads in ToxicSkills Study](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/) — Comprehensive security audit
- [Vercel Changelog: Automated security audits now available for skills.sh](https://vercel.com/changelog/automated-security-audits-now-available-for-skills-sh) — Audit launch
- [SpecWeave: Why Verified Skill Matters — Lessons from ClawHub's Collapse](https://spec-weave.com/docs/guides/why-verified-skill-matters/) — Post-mortem

### Market & Adoption
- [Gartner/IDC: AI Agent Adoption 2026: What the Data Shows](https://joget.com/ai-agent-adoption-in-2026-what-the-analysts-data-shows/) — Market size and forecasts
- [OpenClaw Statistics (April 2026)](https://openclawvps.io/blog/openclaw-statistics) — Ecosystem growth data
