---
title: OpenClaude — Research Notes (Updated 2026-04-06)
tags: [research, findings, multi-provider, architecture]
created: 2026-04-03
updated: 2026-04-06
status: complete
---

# OpenClaude — Research Notes (Updated 2026-04-06)

## Key Findings

### Core Architecture

- **[HIGH]** OpenClaude is a 786-line fork of the March 2026 Claude Code source leak that replaces Anthropic's proprietary API backend with an OpenAI-compatible provider shim. Implementation spans `src/services/api/openaiShim.ts`, `src/utils/model/`, and auth utilities. Adds zero new npm dependencies. — [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude)

- **[HIGH]** OpenClaude has achieved 17.6k GitHub stars as of April 6, 2026 — up 82% from 9.6k on April 3. Shows strong adoption acceleration and active maintenance with 348 commits, 49 open issues, 27 pull requests, and documented feature additions (gRPC server support, agent routing, VS Code extension). — [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude)

### Maintenance Status


### Multi-Provider Support



### Feature Parity & Compatibility



### Local Model Support

- **[HIGH]** OpenClaude can run on local models via Ollama or LM Studio without API costs. However, local models (Llama 2 13B, Mistral 7B, DeepSeek Local) struggle with multi-step agent workflows—they fail at 10+ tool calls. Use case: simple file I/O and R&D. Not recommended for production agents. — [notes, verified findings]

- **[HIGH]** Local inference eliminates API costs but requires GPU hardware ($1,500–4,000 capital cost). Trade-off: zero API cost vs limited capability and high upfront investment. — [notes, verified findings]

### Performance & Latency



### Security & API Key Storage






### Input/Output Stability


### MCP Integration

- **[MEDIUM]** OpenClaude integrates the Model Context Protocol (MCP), enabling composable tool ecosystems. MCP is an official Anthropic specification with TypeScript SDK. However, comprehensive registry of MCP servers compatible with OpenClaude (vs native Claude Code) is not documented. Community-maintained servers may not work reliably with non-Anthropic providers. **MCP compatibility is inferred from OpenAI-compatible architecture, not explicitly tested.** — [notes, verified findings]

### Ecosystem Position

- **[HIGH]** OpenClaude is one of three dominant multi-provider CLI alternatives as of April 2026:
  - **OpenCode** (SST team, 112k stars) — Maximum flexibility (75+ providers), client/server TUI
  - **Cline** (VS Code–native, 112k stars, AGPL-3.0) — Extensibility-first, MCP-first
  - **OpenClaude** (Gitlawb, 17.6k stars, growing rapidly) — Minimal-change fork, Bun-native, actively maintained
  - **OpenClaw** (separate fork, 250k stars by Feb 2026, separate governance) — Feature-rich but different evolution path



## Counterarguments & Risks

### Abstraction Leakage Breaks Third-Party Compatibility
- OpenClaude copies Anthropic-specific API fields and sends them to providers that don't recognize them. OpenRouter Docs warn: "Claude Code with OpenRouter is only guaranteed to work with Anthropic first-party provider." Compatibility not guaranteed across 200+ advertised providers. Issues #267, #248 unresolved.

### Windows/macOS I/O: Unresolved in npm as of April 6
- GitHub Issues #228 (Windows) and #220 (macOS) documented reproducible terminal input hangs. PR #266 fix merged to main but NOT in npm release. **Blocker for team deployment on Windows/macOS.** Operational impact: 4-6 week delay (npm release) OR 2-3 week workaround (build from source) plus ongoing CI/CD maintenance (~2-4 hours/quarter).

### Performance Overhead Unquantified for OpenClaude
- Claimed 45% latency overhead is sourced from "DataCamp: OpenCode vs Claude Code," not OpenClaude-specific benchmarks. OpenCode is the SST team project (75+ providers, TUI, client/server)—a different implementation from OpenClaude. Latency numbers may not apply to OpenClaude specifically. **OpenClaude-specific benchmarks not found.**

### API Key Plaintext Storage Creates Compliance Risk

### Cargo-Culting Risk: No Provider Selection Guidance
- 200+ providers available; only ~10 functional for agents. OpenClaude documentation does not guide users on which provider for which task. Users end up testing multiple models without clear decision framework.

### Prompt Injection & Permission System Bypass (Inherited from Source)
- Adversa AI disclosed permission system bypass in Claude Code source (March 2026). Attack: malicious CLAUDE.md file → 50+ subcommand pipeline → permission deny rules defeated. **All forks, including OpenClaude, inherit this unresolved vulnerability.** Severity: CRITICAL for IT support triage (untrusted input).

### Bun CVE-2026-24910 — Code Execution Risk
- Bun < 1.3.5 default trusted dependencies bypass enables arbitrary code execution. All OpenClaude deployments MUST enforce Bun >= 1.3.5 as prerequisite security gate.

### MCP CVE-2025-6514 — RCE via mcp-remote
- mcp-remote < 0.1.16 allows OS command injection when connecting to untrusted MCP servers. 437k+ instances affected. OpenClaude dependency chain must be audited for mcp-remote version.

## Gaps & Unknowns

1. **Windows/macOS I/O Resolution Timeline**: PR #266 merged to main, not in npm. When will npm release occur? No ETA in public channels. **Impact:** Team deployment remains blocked on Windows/macOS.

2. **Abstraction Leakage Fix Status**: Issues #267, #248 unresolved. Are these being actively worked? Any draft PRs? ETA for patch release? **Impact:** Multi-provider value proposition remains broken; teams de facto locked into Anthropic-compatible providers.

3. **OpenClaude's mcp-remote Dependency**: Does OpenClaude depend on mcp-remote? If yes, what version? CVE-2025-6514 remediation status unknown. **Impact:** Security gate unverified.

4. **OpenClaude-Specific Performance Benchmarks**: No proprietary benchmarks found. 45% overhead applies to OpenCode, not OpenClaude. **Impact:** Latency overhead unknown; cost-optimization claims unverified.


6. **MCP Server Compatibility Testing**: Which community-maintained MCP servers work reliably with non-Anthropic providers? **Impact:** MCP ecosystem claim is unverified; may fail on 30-50% of non-Anthropic providers.

7. **Build-from-Source CI/CD Burden**: If teams must build from source for PR #266 fix, what are ongoing maintenance costs? 2-4 hours/quarter? Higher? **Impact:** Total cost of ownership underestimated.

8. **Governance Fallback Plan**: If Gitlawb becomes unavailable, what's the switch-over plan? No documented governance transfer procedure. **Impact:** Production teams cannot commit without fallback governance.

## Confidence Summary

| Confidence | Count | Examples | |-----------|-------|----------| | **HIGH** | 10 | Core architecture (786-line fork, OpenAI shim); Active maintenance (April 5-6 activity); Feature definitions (tools, MCP, vision); Bun startup; Adoption growth (9.6k→17.6k); Ecosystem diversity; Capability variance benchmarks; I/O stability blockers (unresolved); CVE requirements (Bun 1.3.5, mcp-remote 0.1.16); Permission bypass (inherited, unresolved) | | **LOW** | 1 | Security audit history (none found) | | **UNVERIFIED** | 4 | Complete Anthropic-specific field enumeration; mcp-remote dependency status; Prompt injection hardening; CI/CD pipeline integration patterns |

---

*notes | openclaude | Updated 2026-04-06 | Complete | 2026-04-06*
