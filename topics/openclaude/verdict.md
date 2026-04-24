---
title: OpenClaude — Verdict (Updated 2026-04-06)
tags: [verdict, recommendation, multi-provider, architecture]
created: 2026-04-03
updated: 2026-04-06
status: complete
---

# OpenClaude — Verdict (Updated 2026-04-06)

## Recommendation

**UNCHANGED: We do not recommend OpenClaude for production agentic workflows or team deployments.** OpenClaude is technically viable as a minimal fork of Claude Code with strong adoption momentum (17.6k stars, 82% growth in 3 days) and active maintenance (April 5-6 activity confirmed). However, **critical unresolved blockers have NOT improved since April 3 evaluation:**

1. **Windows/macOS I/O Hangs** — [BLOCKER, UNRESOLVED] PR #266 fix is in main source code but NOT in npm release as of April 6. Team deployments on Windows/macOS remain completely blocked. Workaround: build from source (2-3 weeks) or wait for npm (4-6 weeks).

2. **Abstraction Leakage** — [HIGH-RISK, UNRESOLVED] Issues #267, #248 break multi-provider compatibility on non-Anthropic models. No evidence of fixes merged. Teams remain de facto locked into Anthropic-compatible providers (OpenRouter, etc.), defeating multi-provider value proposition.


4. **Security CVE Requirements** — [CRITICAL, MANDATORY GATES]:
   - Bun CVE-2026-24910: Requires Bun >= 1.3.5 (arbitrary code execution risk)
   - MCP CVE-2025-6514: mcp-remote < 0.1.16 allows RCE (437k+ affected instances)
   - Deployment prerequisite: Both must be enforced or mitigated before any use

For **cost optimization**, preferred alternatives remain cheaper closed-source models (Claude Sonnet 4.6 via OpenRouter at 30% cost reduction with zero abstraction overhead; Gemini 3.1 Pro at 7x cheaper with 80.6% parity) that avoid abstraction complexity and unresolved issues. For **open-source transparency**, Cline (VS Code–native, 112k stars, AGPL-3.0) is better for interactive R&D workflows with lower I/O stability risk.


**Exception:** Simple file I/O or single-shot classification tasks on local models (R&D, privacy-sensitive workflows) may be acceptable *if* ALL SEVEN conditions are met:

1. Bun >= 1.3.5 patched and verified
2. mcp-remote >= 0.1.16 or remote MCP disabled
3. Built from source with PR #266 I/O fix verified (or wait for npm release)
4. Environment variables used for API keys (no plaintext config)
5. Abstraction leakage end-to-end tested on target provider (single-shot workflows, not multi-turn agents)
6. Prompt injection hardening implemented (semantic tokens, CLAUDE.md validation, sandboxing)
7. Governance fallback plan documented (internal fork, switch-over procedure, team awareness)

---

## Critical Blockers Summary

### [CRITICAL] Windows/macOS I/O Hangs — Unresolved as of April 6

- **Issue:** GitHub Issues #228 (Windows) and #220 (macOS) — reproducible terminal input freezes
- **Root cause:** React 19 async render defect
- **Fix status:** PR #266 merged to main branch, **NOT in npm release as of April 6**
- **Impact:** Team deployments on Windows 11 and macOS completely blocked
- **Workaround:** Build from source (2-3 weeks setup) or wait for npm (4-6 weeks estimated)
- **Ongoing burden:** 2-4 hours/quarter CI/CD maintenance if build-from-source is adopted
- **Recommendation:** Do not proceed with OpenClaude for team deployments until this is resolved in npm

### [CRITICAL] Permission System Bypass via Prompt Injection — Inherited, Unresolved

- **Vulnerability:** Adversa AI disclosed in Claude Code source (March 2026); affects all forks
- **Attack vector:** Malicious CLAUDE.md file → AI generates 50+ subcommand pipeline → permission rules defeated
- **Status:** Unresolved in OpenClaude source as of April 6
- **Mitigation:** Implement semantic token validation, CLAUDE.md sandboxing, input sanitization
- **Recommendation:** Do not use for untrusted input workflows without hardening

### [CRITICAL] Bun CVE-2026-24910 — Mandatory Security Gate

- **Vulnerability:** Bun < 1.3.5 default trusted dependencies bypass → arbitrary code execution
- **Fix:** Upgrade to Bun >= 1.3.5
- **Severity:** CRITICAL (full developer machine compromise)
- **Status:** Remediation available; must be enforced as deployment prerequisite
- **Recommendation:** Add version check to deployment script: `if Bun < 1.3.5: BLOCK_DEPLOYMENT()`

### [CRITICAL] MCP CVE-2025-6514 — Dependency Chain Audit Required

- **Vulnerability:** mcp-remote < 0.1.16 allows RCE when connecting to untrusted MCP servers
- **Scope:** 437k+ affected instances
- **Severity:** CRITICAL (OS command execution)
- **Status:** Patch available (mcp-remote >= 0.1.16); must audit OpenClaude dependency chain
- **Recommendation:** Verify mcp-remote version before deployment; consider disabling remote MCP if not needed

### [HIGH] Abstraction Leakage Breaks Multi-Provider Compatibility — Unresolved

- **Issue:** Anthropic-specific fields sent to non-Anthropic providers (Issues #267, #248)
- **Impact:** Multi-turn agent workflows fail silently on Gemini, DeepSeek, OpenAI
- **Status:** Unresolved in main as of April 6
- **Severity:** HIGH for agents (10-30% failure rate), LOW for single-shot classification
- **Recommendation:** Do not use for multi-provider agent workflows

---

## Cost of Ownership Analysis (Updated 2026-04-06)

| Option | API Cost | SWE-Bench | Abstraction Risk | Deployment Burden | CVE/I/O Risk | Security Audit | Total TCO (1M tokens) | |--------|----------|-----------|-----------------|------------------|---|---|---| | **Claude Opus Native** | $15 | 80.8% | 0% | 0 hours | None | Anthropic | $15 | | **Claude Sonnet via OpenRouter** | $10.50 | 79.6% | 0% | 0-2 hours | None | Anthropic | $10.50 | | **Gemini 3.1 Pro via Google Cloud** | $0.075 | 80.6% | 0% | 2-4 hours | Minimal | Google | $0.075 | | **Cline (VS Code)** | Variable (model-dependent) | Model-dependent | Model-dependent | 1-2 hours | CVE-2025-6514 (mcp-remote) | Community | Variable | | **OpenClaude + Local Model** | $0 | ~45% | 5-10% overhead | 40-60 hours (setup) + 20-40/year | Bun CVE, MCP CVE, I/O hangs, Prompt injection | None | $0 + $3k-6k labor/year | | **OpenClaude + Gemini 3.1 Pro** | $0.075 | ~80% (unverified) | 5-10% overhead + silent failures | 40-60 hours (build from source, CVE vetting) + 20-40/year | **Bun CVE, MCP CVE, I/O hangs (npm blocker), Prompt injection** | None | $0.075 + $5k-15k labor/year |


---

## Next Steps

### If pursuing OpenClaude (NOT RECOMMENDED, but if committed):

1. **Mandatory Pre-Deployment Checklist:**
   - [ ] Bun >= 1.3.5 patched. Verify no older Bun version in PATH. Add version check to startup script.
   - [ ] Assess mcp-remote dependency version. Enforce >= 0.1.16 or disable remote MCP.
   - [ ] Use environment variables for API keys. Implement centralized secret management (HashiCorp Vault, AWS Secrets Manager) — OpenClaude has no SecretRef.
   - [ ] Build from source (not npm) to get PR #266 I/O fix. Test terminal input on Windows/macOS. Document build procedure for team.
   - [ ] Run latency benchmarks on target use cases. Measure baseline; don't accept 45% overhead claim without verification.
   - [ ] Test all required MCP servers on target non-Anthropic provider in staging. Treat MCP as unverified until tested.
   - [ ] Implement prompt injection hardening: semantic token validation, CLAUDE.md sandboxing, input sanitization for untrusted sources.

2. **Capability Matrix Documentation:**
   - Document which providers support which task types (agents, vision, streaming, extended context).
   - Reference SWE-Bench benchmarks per model. Create decision tree for provider selection.
   - Avoid cargo-culting. Make provider choice explicit and data-driven.

3. **Security Hardening:**
   - Centralized API key management (HashiCorp Vault, AWS Secrets Manager, or similar).
   - Audit credential storage regularly. Monitor for plaintext exposure (GitHub, logs, etc.).
   - Network-level restrictions (VPC, firewall rules) for API key transmission.
   - Prompt injection detection: semantic token validation, command whitelisting, output sanitization.

4. **Scope Limitation:**
   - Restrict to simple file I/O and single-shot classification tasks on LOCAL models only (not remote APIs).
   - Do not use on production critical paths without extensive testing and security sign-off.
   - Monitor GitHub Issues for abstraction leakage fixes (#267, #248) and I/O stability fixes.

5. **Governance & Fallback Planning:**
   - Maintain internal fork as contingency if Gitlawb becomes inactive.
   - Document vendor-lock mitigation plan (switchover steps, timeline, team awareness).
   - Set quarterly review triggers: if no upstream commits in 6 months, activate fallback plan.
   - Establish governance transfer procedure with team (who owns the fork, how to maintain it).

### If pursuing cost optimization (RECOMMENDED):

1. **Short-term (immediate):** Use Claude Sonnet 4.6 via OpenRouter (30% cheaper than Opus, 79.6% SWE-Bench, zero abstraction overhead, 2-4 hours setup, zero I/O blockers, zero security CVEs, zero governance risk).

2. **Medium-term (weeks):** Evaluate Gemini 3.1 Pro via Google Cloud (7x cheaper than Opus, 80.6% SWE-Bench, similar latency, institutional backing, minimal setup overhead).

3. **Long-term (months):** Monitor DeepSeek models (emerging capability, competitive pricing). Track SWE-Bench benchmarks quarterly. Avoid OpenClaude complexity; accept closed-source trade-off for operational simplicity.

### If pursuing open-source transparency (RECOMMENDED FOR R&D, NOT PRODUCTION):

1. **Interactive R&D workflows (IDE-native):** Cline (VS Code–native, 112k stars, AGPL-3.0) — Better community, IDE-native debugging, MCP-first, lower I/O risk, fork-friendly licensing. No I/O hangs reported.

2. **CLI workflows (headless, team deployments):** Neither OpenClaude nor Cline are suitable without extensive hardening. Use native Claude Code for compliance-ready transparency, or accept closed-source alternatives (Claude Sonnet via OpenRouter, Gemini 3.1 Pro) for transparency + cost + operational simplicity trade-off.

3. **Maximum flexibility:** OpenCode (SST team, 75+ providers, client/server TUI) — More providers than OpenClaude, but separate maintenance effort, larger codebase, less tested community, similar governance risks.

---

## Alternatives

| Alternative | When to Use | Pros | Cons | Risk Profile | |-------------|------------|------|------|---| | **Claude Sonnet 4.6 via OpenRouter** | Cost optimization, immediate | 30% cheaper than Opus, 79.6% SWE-Bench, zero abstraction overhead, zero deployment friction, institutional backing | Still closed-source; API cost not zero | **LOW** — Production-ready, no security CVEs, no I/O blockers | | **Gemini 3.1 Pro via Google Cloud** | Cost optimization, long-term | 7x cheaper than Opus, 80.6% SWE-Bench, institutional backing, mature production APIs, zero I/O blockers | Slower latency; 1-2% accuracy loss; separate vendor | **LOW** — Proven production-ready, Google backing | | **Claude Code Native** | Safety-critical workflows, audit requirements, team deployments | Full Anthropic support, compliance-ready, zero abstraction overhead, institutional backing, audit logging, zero I/O blockers, zero CVEs | Highest API cost; limited provider choice; requires Teams plan subscription | **VERY LOW** — Production-grade governance, no surprises |

---

## Summary

OpenClaude shows strong adoption momentum (17.6k stars, 82% growth in 3 days) and active maintenance (April 5-6 activity). However, **critical unresolved blockers remain identical to April 3 assessment:**

1. Windows/macOS I/O hangs — Blocker for team deployment
2. Abstraction leakage — Breaks multi-provider value proposition
3. Permission bypass (inherited) — Unacceptable for untrusted input
4. Security CVEs (Bun, MCP) — Mandatory remediation gates

**Production teams should not use OpenClaude without:** (a) resolving I/O blocker (wait for npm or build from source), (b) patching both CVEs, (c) hardening prompt injection, (d) extensive testing of target providers, (e) documented governance fallback plan.

**Cost optimization teams should use:** Claude Sonnet via OpenRouter (immediate 30% savings, production-ready) or Gemini 3.1 Pro (long-term 7x savings).

**R&D / Transparency teams should use:** Cline for IDE-native workflows (better maintained, AGPL-friendly), not OpenClaude (too many unresolved production blockers).

---

*verdict | openclaude | Updated 2026-04-06 | Complete | 2026-04-06*
