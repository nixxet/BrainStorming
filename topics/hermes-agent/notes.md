---
title: Hermes Agent — Research Notes
topic_slug: hermes-agent
date: 2026-04-17
---

# Research Notes: Hermes Agent

## Confidence-Rated Findings

### F1 — Self-Improving Closed Learning Loop
**Confidence:** HIGH (mechanism) / UNVERIFIED (40% speedup performance claim)
- Skill creation triggered after 5+ tool calls in a session; skills auto-injected into future sessions via progressive disclosure
- Mechanism is code-verifiable in the Hermes repo and corroborated by practitioner write-ups
- **The 40% task-completion speedup is UNVERIFIED** — single source (TokenMix.ai), no methodology, no sample size, no baseline
- Self-evaluation bias is structural: the same system generates and scores behavior; cross-domain generalization unproven; learning off by default
**Source(s):** [Hermes Docs](https://hermes-agent.nousresearch.com/docs/) (T1); TokenMix.ai benchmark post (T3, contested)

### F2 — Three-Layer Memory Architecture
**Confidence:** HIGH (architecture) / contested reliability
- `MEMORY.md` (2,200 char / ~800 tokens) + `USER.md` (1,375 char / ~500 tokens) + SQLite FTS5 session history
- 8 optional external provider plugins (Honcho, Mem0, Zep, Letta, Supermemory, and others)
- **Reliability caveat:** documented SQLite state.db corruption caused permanent loss of 18/128 sessions in one production case (Issue #5563)
- MEMORY.md character limit forces severe compression at scale
**Source(s):** [Hermes Memory Docs](https://hermes-agent.nousresearch.com/docs/memory) (T1); [GitHub Issue #5563](https://github.com/NousResearch/hermes-agent/issues/5563) (T1)

### F3 — ChatML + `<tool_call>` Function-Calling Standard
**Confidence:** HIGH
- Hermes ChatML format with `<tool_call>` XML special-token wrapping JSON `{name, arguments}` payloads
- Widely adopted by third-party inference servers; no contradictions across sources
**Source(s):** [Hermes GitHub](https://github.com/NousResearch/hermes-agent) (T1); [HuggingFace model card](https://huggingface.co/NousResearch/Hermes-4-70B) (T1)

### F4 — Hermes 4 Hybrid Reasoning Model Family
**Confidence:** MEDIUM (existence HIGH; benchmark quality LOW)
- 14B / 70B / 405B models with `<think>` tags; trained on 5.1M samples on 192 NVIDIA B200 GPUs
- **Benchmark credibility challenged:** AI2 independent eval found Hermes 3 8B "substantially behind Llama 3.1 Instruct"; Hermes 4 70B has no published independent benchmark
- Nous Research self-reported scores show systematic disagreement with independent evaluations
**Source(s):** [arXiv 2508.18255](https://arxiv.org/abs/2508.18255) (T2); [HuggingFace](https://huggingface.co/NousResearch/Hermes-4-70B) (T1); AI2 Hermes 3 evaluation

### F5 — 47-Tool Registry + MCP + delegate_task
**Confidence:** HIGH (with lock-in caveat)
- 47 built-in tools, configurable toolsets, MCP server integration with filtering and safety gating
- `delegate_task` subagent spawning for task decomposition
- **v0.10.0 (April 16, 2026)** moved Tool Gateway (Firecrawl, FAL/FLUX 2, TTS, Browser Use) behind Nous Portal paid subscription — partial vendor lock-in
- Tool definitions contribute 8,759 tokens to the 73% baseline overhead
**Source(s):** [Hermes Tools Docs](https://hermes-agent.nousresearch.com/docs/tools) (T1); Investigator v0.10.0 verification

### F6 — Six Execution Backends
**Confidence:** HIGH (with security caveat)
- Local, Docker, SSH, Singularity, Modal, Daytona (including serverless with hibernation)
- **Critical finding:** container mode (Docker/Singularity/Modal) skips approval checks entirely in default configuration, relying on user-configured container hardening that is not enforced
**Source(s):** [Hermes Backends Docs](https://hermes-agent.nousresearch.com/docs/backends) (T1); [GitHub Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) (T1)

### F7 — ACP Editor Protocol
**Confidence:** HIGH
- JSON-RPC 2.0 over stdio for VS Code, Zed, JetBrains, Neovim
- Workspace-bound task IDs; no contradictions across sources
**Source(s):** [Hermes ACP Docs](https://hermes-agent.nousresearch.com/docs/acp) (T1); GitHub issues for editor integrations (T3)

### F8 — Atropos RL Training Integration
**Confidence:** MEDIUM
- GRPO with LoRA adapters; WandB logging; trajectory collection to fine-tune Hermes models
- Single T1 source; no independent practitioner corroboration of real-world outcomes
- Model benchmark credibility issues (F4) apply by extension to any claimed improvements
**Source(s):** [Hermes Atropos Docs](https://hermes-agent.nousresearch.com/docs/atropos) (T1)

### F9 — AgentSkills.io Compatibility
**Confidence:** HIGH
- SKILL.md open standard with 30+ agent adopters (Claude Code, GitHub Copilot, Cursor, Gemini CLI)
- Exact native format mechanism (native SKILL.md vs. conversion to Hermes format) not fully confirmed in primary Hermes docs
**Source(s):** [AgentSkills.io](https://agentskills.io/home) (T1); [VentureBeat coverage](https://venturebeat.com/ai/agentskills-standard) (T2)

### F10 — GitHub Adoption Trajectory
**Confidence:** HIGH
- 97,100 stars as of April 16, 2026 (Investigator-verified)
- ~69,900 stars within two months of February 2026 launch (earlier Researcher measurement)
- OpenClaw direct successor with `hermes claw migrate` migration command
**Source(s):** [GitHub repo](https://github.com/NousResearch/hermes-agent) (directly verifiable); Investigator April 16 measurement

### F11 — NousResearch Funding and Web3 Shadow
**Confidence:** MEDIUM
- $65M Series A led by Paradigm VC (press releases; possibly outdated)
- Web3 shadow risk: unofficial NOUS tokens on-chain reported by single T3 source
- Not corroborated by Nous Research official communications
**Source(s):** NousResearch press release (T3); PANews (T3)

### F12 — Personal Agent Runtime Category
**Confidence:** HIGH
- Absent from major 2026 enterprise/developer framework comparisons (LangGraph, CrewAI, AutoGen, Smolagents, OpenAI Agents SDK)
- MorphLLM 8-framework comparison explicitly excludes Hermes
- Category difference is architectural, not an oversight or gap future versions will fill
**Source(s):** [The New Stack coverage](https://thenewstack.io/) (T2); [MorphLLM framework comparison](https://morphllm.com/compare) (T2)

### F13 — LiteLLM Supply Chain Attack (March 24–28, 2026)
**Confidence:** HIGH (incident) / UNVERIFIED (exfiltration volume)
- Versions 1.82.7 and 1.82.8 silently harvested API keys, AWS/GCP/Azure credentials, SSH keys, database passwords for 4 days
- Resolved in Hermes Agent v0.5.0 by removing LiteLLM entirely (not by pinning)
- **The 300GB / 500K identity exfiltration volume claim is UNVERIFIED** — sourced from TeamPCP via getClaw.sh (a competing product)
**Source(s):** [getClaw.sh incident post](https://getclaw.sh/blog/hermes-agent-supply-chain-hack-litellm-what-founders-need-to-know) (T3, competing-product bias)

### F14 — 4 Critical + 9 High Security Findings (Issue #7826)
**Confidence:** HIGH
- Filed April 11, 2026 against v0.8.0 default configuration
- **No maintainer response or fix timeline** as of April 17, 2026
- Findings: unrestricted shell execution, full filesystem read (SSH keys, .env), container approval bypass, unsandboxed persistent skill execution
**Source(s):** [GitHub Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) (T1)

### F15 — 73% Baseline Token Overhead
**Confidence:** HIGH
- 13,935 fixed tokens per request: 8,759 tool definitions + 5,176 system prompt
- 84–89% waste in heavy production sessions (measured from 6 real request dumps and 2 production conversations)
- Only ~18% reducible via platform toolset filtering — overhead is structural
- Gateway usage (Telegram, Discord, Slack) multiplies to 15–20K input tokens per request
**Source(s):** [GitHub Issue #4379](https://github.com/NousResearch/hermes-agent/issues/4379) (T1); [GitHub Issue #5563](https://github.com/NousResearch/hermes-agent/issues/5563) (T1)

### F16 — EvoMap Architectural Copying Dispute
**Confidence:** MEDIUM
- Hermes self-evolution module created 36 days after Evolver's public release
- Documented 12-term substitution and 10-step loop structural isomorphism
- **EvoMap changed its license from MIT to GPLv3** in direct response
- Nous Research has not published a substantive technical rebuttal
- "AI coding tool regenerated similar code" hypothesis plausible but unconfirmed
**Source(s):** YiCai Global (T2); 36kr (T2); Phemex (T3); KuCoin (T3) — four corroborating sources on technical facts

### F17 — v0.10.0 Nous Portal Vendor Lock-In
**Confidence:** HIGH
- Tool Gateway (Firecrawl web search, FAL/FLUX 2 image gen, OpenAI TTS, Browser Use) now requires active Nous Portal paid subscription
- Released April 16, 2026
- Pricing undisclosed; impact on existing automations on subscription lapse undocumented
- Model provider layer remains model-agnostic; bundled tooling does not
**Source(s):** Investigator v0.10.0 changelog verification; deep-dive.md

### F18 — Cron Prompt Injection Bypass
**Confidence:** HIGH
- Skill content loaded at cron execution time is never scanned by the injection scanner
- Scanner only checks user-supplied prompt fields
- Cron jobs run in non-interactive mode (auto-approve all commands)
- Complete documented attack chain: malicious skill → cron trigger → arbitrary command execution without user approval
**Source(s):** [GitHub Issue #3968](https://github.com/NousResearch/hermes-agent/issues/3968) (T1) — open, unassigned, no maintainer response

---

## Counterarguments & Challenges

### C1 — Self-Evaluation Bias Invalidates Performance Metrics
- The same Hermes system that generates agent behavior also scores its own performance in the 40% speedup benchmark
- When a system evaluates itself, performance metrics systematically overstate quality
- No external evaluator, no A/B test protocol, no controlled baseline
- The 40% claim collapsed under scrutiny precisely because of this structural flaw
**Source:** deep-dive.md; TokenMix.ai benchmark post (the only source of the claim)

### C2 — Security Posture Is Materially Weaker Than Marketed
- Landscape brief cited tool approval gating and container hardening as positives
- Investigator documented: container-mode approval bypass, cron injection bypass, YOLO mode via env var persisting across sessions, no SECURITY.md, no private reporting channel
- "Zero agent-specific CVEs" claim is technically accurate but misleading — Issue #7826 documents equivalent severity findings without formal CVE tracking
**Source:** [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826); [Issue #9179](https://github.com/NousResearch/hermes-agent/issues/9179)

### C3 — Benchmark Credibility Gap
- AI2 independent evaluation found Hermes 3 8B "substantially behind Llama 3.1 Instruct"
- Hermes 4 70B has no published independent benchmark
- Nous Research self-reported scores show systematic disagreement with independent evaluations
- Extends credibility concern to Atropos RL claimed improvements
**Source:** AI2 Hermes 3 evaluation; absence of Hermes 4 independent benchmarks

### C4 — Maintainer Capacity Cannot Match Growth Rate
- 1,900+ open issues and 3,400+ open PRs at v0.10.0, released ~7 weeks after v0.1.0
- Critical security issue #7826 has received no response 6 days after filing
- Issue #9179 (SECURITY.md request) closed with no visible response
- Adoption trajectory exceeds remediation capacity
**Source:** GitHub Issues/PRs (directly verifiable); deep-dive.md failure cases

### C5 — Token Economics Break Premium Model Use
- 73% baseline overhead is structural, not configurational
- Gateway deployments inflate to 15–20K input tokens per request
- One documented production user: $405 for a single project using Claude Sonnet 4.6
- Only ~18% savings possible via toolset filtering
**Source:** [Issue #4379](https://github.com/NousResearch/hermes-agent/issues/4379); [Issue #5563](https://github.com/NousResearch/hermes-agent/issues/5563); deep-dive.md cost analysis

### C6 — EvoMap Dispute Creates Legal Exposure
- 36-day timeline between Evolver's public release and Hermes's self-evolution module is adverse
- 12-term substitution and 10-step loop isomorphism are specific, technical claims
- EvoMap's license change from MIT to GPLv3 is a costly, concrete response signal
- Downstream users of Hermes's self-evolution module may face GPLv3 copyleft obligations if dispute resolves against Nous Research
**Source:** YiCai Global; 36kr; Phemex; KuCoin (4 corroborating sources)

---

## Security Findings

| ID | Severity | Description | Status | Source | |----|----------|-------------|--------|--------| | S1 | CRITICAL | LiteLLM supply chain attack (v1.82.7 and 1.82.8) silently harvested API keys, AWS/GCP/Azure credentials, SSH keys, and database passwords from Hermes Agent deployments for 4 days (March 24–28, 2026). | resolved | [getclaw.sh](https://getclaw.sh/blog/hermes-agent-supply-chain-hack-litellm-what-founders-need-to-know) | | S2 | CRITICAL | Unrestricted shell command execution in local backend — no containment or approval required by default. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | S3 | CRITICAL | Full filesystem read access with no restrictions on sensitive files (SSH keys, .env files, credential stores) in default configuration. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | S4 | CRITICAL | Container-mode approval bypass: Docker, Singularity, and Modal backends skip security checks entirely in default configuration, relying on user-configured container hardening that is not enforced. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | S5 | CRITICAL | Persistent skill execution without sandboxing: skills autonomously created by the agent execute in future sessions without containment, including skills potentially introduced via prompt injection. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | S6 | CRITICAL | Cron prompt injection via skill content: injection scanner only checks user-supplied prompt fields, not skill content loaded at execution time. Cron jobs run in non-interactive mode (auto-approve all commands), completing the attack chain from malicious skill to arbitrary command execution. | open | [Issue #3968](https://github.com/NousResearch/hermes-agent/issues/3968) | | S7 | HIGH | YOLO mode (`--yolo` flag or `HERMES_YOLO_MODE=1` environment variable) disables all security checks globally and is documented as a supported feature — environment variable form persists across sessions. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | S8 | HIGH | No SECURITY.md and no private vulnerability reporting channel. Issue #9179 requesting a private disclosure mechanism was closed with no visible maintainer response. | open | [Issue #9179](https://github.com/NousResearch/hermes-agent/issues/9179) | | S9 | HIGH | 9 additional High-severity findings documented in security audit of v0.8.0 default configuration; details beyond the 4 Critical findings not individually enumerated in public issue. | open | [Issue #7826](https://github.com/NousResearch/hermes-agent/issues/7826) | | M1 | CRITICAL (untracked) | Memory file injection: MEMORY.md and USER.md are written by the agent from session content (including fetched web pages, MCP tool results, and external provider responses) and loaded into every future session's system prompt without re-scanning. Attacker-controlled content in any agent input can be persisted to memory and injected into future sessions. | untracked — not in Issue #7826 | Architecturally derivable from F1 + F2 | | M3 | HIGH (untracked) | `delegate_task` privilege escalation chain: subagents spawned by `delegate_task` inherit parent execution context and permissions. Combined with cron non-interactive mode (S6), attack chain is: malicious skill → cron trigger → `delegate_task` spawn → unmonitored subagent execution with parent-level permissions. | untracked — not in Issue #7826 | Architecturally derivable from F5 + S6 | | M4 | HIGH (untracked) | Memory provider exfiltration: the 8 external memory providers (Honcho, Mem0, Zep, Letta, Supermemory, and others) receive agent memory content — including credentials, API keys, and sensitive conversation context — over network connections. A compromised or malicious provider passively exfiltrates this content to third-party infrastructure. | untracked — not in Issue #7826 | Architecturally derivable from F2 |

---

## Key Contradictions Resolved

### Star Count (69,900 vs 97,100)
- Researcher captured an earlier measurement (~early-to-mid April); Investigator verified 97,100 on April 16, 2026
- Both accurate at different times — adoption trajectory is consistent; resolved to 97,100 as of April 16, 2026

### Self-Improvement Mechanism vs Performance Claim
- Researcher presented mechanism and 40% speedup as a unified HIGH-confidence finding
- Investigator bifurcated: mechanism HIGH (code-verified); 40% speedup UNVERIFIED (single source, no methodology, self-evaluation bias)
- **This is the most important resolution in the synthesis** — the Researcher's framing was overconfident on the metric half

### Security Model Framing
- Researcher cited approval gating, skill scanning, container hardening as positives (happy-path accurate)
- Investigator documented container-mode approval bypass, cron skill scanning gap, YOLO env-var persistence, absence of SECURITY.md (bypass paths)
- Both accurate — security features exist but contain architectural bypass paths in default config; posture is materially weaker than landscape brief implied

### OpenClaw CVE Comparison
- Researcher: "Hermes has zero agent-specific CVEs" (favorable vs OpenClaw's 9 CVEs in 4 days)
- Investigator: 4 Critical + 9 High findings in Issue #7826, plus LiteLLM supply-chain incident
- Resolution: absence of formal CVE assignment does not mean absence of critical vulnerabilities; the comparison is not a meaningful safety signal

### Model-Agnostic / No Vendor Lock-In
- Researcher: described as model-agnostic, 200+ providers, no vendor lock-in
- Investigator: v0.10.0 (April 16, 2026) moved Tool Gateway behind Nous Portal paid subscription
- Resolution: model provider layer remains genuinely agnostic; bundled tooling introduced Nous Portal billing dependency; "no vendor lock-in" claim was accurate before April 16, 2026 and is partially false after

---

## Gaps & Unknowns

- **Issue #7826 maintainer response and fix timeline unknown** — blocks any production adoption decision
- **Nous Portal subscription pricing and lapse behavior undisclosed** — cannot model TCO or build migration plans
- **State.db corruption root cause unresolved (Issue #5563)** — cannot assess reliability envelope
- **EvoMap dispute resolution pending** — GPLv3 license change creates potential legal exposure if dispute is resolved against Nous Research
- **No independent benchmark for Hermes 4 on agentic tasks** — vendor self-reports cannot substitute for third-party evaluation, especially given Hermes 3 AI2 discrepancy

---

## Bias Notes

- **getClaw.sh** — competing product; source of LiteLLM incident details and unverified 300GB / 500K identity volume claim; incident facts are corroborated elsewhere but volume figures should be treated as adversarial marketing
- **TokenMix.ai** — sole source of the 40% speedup claim; no methodology, no sample size, no baseline published; treat as UNVERIFIED until independently reproduced
- **Nous Research self-reported benchmarks** — systematic disagreement with AI2 independent evaluation of Hermes 3 8B; extend skepticism to Hermes 4 and Atropos RL claimed outcomes
- **PANews web3 token risk** — single T3 source; not corroborated by Nous Research official communications
