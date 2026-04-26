# BrainStorming — Expert Review Report

**Prepared:** 2026-04-26  
**Scope:** Full codebase review — agents, scripts, schemas, tests, CI, documentation  
**Reviewer role:** Senior software developer and product strategist  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Understanding](#2-project-understanding)
3. [Technology Stack Assessment](#3-technology-stack-assessment)
4. [Architecture Review](#4-architecture-review)
5. [Code Quality Review](#5-code-quality-review)
6. [Frontend / UX Review](#6-frontend--ux-review)
7. [Backend / API / Data Review](#7-backend--api--data-review)
8. [Security Review](#8-security-review)
9. [Performance and Scalability Review](#9-performance-and-scalability-review)
10. [Testing and QA Review](#10-testing-and-qa-review)
11. [Developer Experience Review](#11-developer-experience-review)
12. [Product Strategy and Feature Opportunities](#12-product-strategy-and-feature-opportunities)
13. [Prioritized Issues and Recommendations](#13-prioritized-issues-and-recommendations)
14. [4-Phase Next-Level Development Roadmap](#14-4-phase-next-level-development-roadmap)
15. [Suggested Technical Improvements](#15-suggested-technical-improvements)
16. [Suggested Product Improvements](#16-suggested-product-improvements)
17. [Final Assessment](#17-final-assessment)

---

## 1. Executive Summary

BrainStorming is a mature, carefully engineered AI research pipeline that converts research topics into structured, auditable knowledge artifacts. It operates entirely within Claude Code as an orchestrated multi-agent system, with a 12-agent Director-coordinated pipeline spanning nine phases (0–8 plus 6.5), sophisticated quality gates, and rigorous public/private separation.

The project is well above average for a single-developer AI system. Its standout qualities are the depth of agent specification, the zero-external-dependency architecture, the multi-layer adversarial quality stack (Critic → Security Reviewer → Tester → Challenger → Publisher), and the evidence contract system that makes confidence levels auditable rather than implicit.

The primary areas requiring attention are not fundamental — the foundation is sound. They fall into two categories: several schema and configuration gaps that reduce production readiness, and a set of automation opportunities where manual human steps could be partially or fully eliminated without sacrificing quality.

**Overall rating: 8.3 / 10** — Production-ready for its intended use case, with clear and achievable paths to significant improvement.

---

## 2. Project Understanding

### What It Is

BrainStorming is a personal knowledge-building system implemented as a Claude Code project. Its purpose is to evaluate AI tools, platforms, and practices through a structured multi-agent research pipeline and produce publication-quality reports (overview, notes, verdict) with traceable evidence and explicit confidence levels.

The system is not a web application, a SaaS product, or a library. It is a CLI-driven, operator-mediated pipeline that runs inside the Claude Code environment. Framing it as a traditional software product would misrepresent its nature. The correct analogy is a **specialized research workbench with automated quality control**.

### What It Produces

For each topic, the pipeline produces three public-facing documents:

- `overview.md` — landscape summary with confidence-labeled findings
- `notes.md` — implementation detail, code examples, caveats
- `verdict.md` — final recommendation with scorecard, decision tree, and invalidation conditions

It also produces private pipeline artifacts:

- `_pipeline/state.json` — current phase status and run metrics
- `_pipeline/evidence.json` — structured findings with confidence, source counts, decay classes
- `_pipeline/scorecard.md` — rubric scores per dimension

### Design Philosophy

Three principles permeate every part of the system:

1. **Evidence before assertion** — no confidence label appears in public output without a corresponding finding in evidence.json
2. **Adversarial quality** — every output passes through at least one dedicated critic before publication
3. **Public hygiene** — the public deliverable set (`dist/public/`) must be provably free of private information

These principles are not just stated — they are operationalized in agent specs, validation scripts, schema constraints, and CI checks. The consistency between intent and implementation is one of the project's genuine strengths.

---

## 3. Technology Stack Assessment

### Runtime and Language

| Component | Choice | Assessment |
|-----------|--------|------------|
| Runtime | Node.js ≥ 22 | Correct — `node:test`, `node:fs`, `node:path` built-ins require 22+. Explicit `engines` field in package.json. |
| Language | JavaScript (CommonJS) | Appropriate for a single-developer scripting layer. No build step needed. |
| Dependencies | None (zero `dependencies` / `devDependencies`) | Exceptional. All scripts use Node built-ins only. Eliminates supply chain risk, version drift, audit noise. |
| Test runner | `node --test` (built-in) | Good choice. No Jest/Vitest configuration overhead. Output is standard TAP-compatible. |
| Schema validation | `ajv` via... | **Wait — there are no schema dependencies.** `validate-schemas.js` must be implementing validation inline or using a different mechanism. This is worth examining. |

### Agent Platform

| Component | Choice | Assessment |
|-----------|--------|------------|
| Orchestration | Claude Code agent system (`.claude/agents/`) | Native to the platform. Correct choice — no third-party framework adds value here. |
| Model routing | Opus (Director, Writer, Cross-Analyzer), Sonnet (all others) | Principled. Opus where synthesis and judgment matter; Sonnet where throughput and turn limits matter. |
| Turn budgets | Per-agent `maxTurns` (12–50) | Appropriate. Director at 50 reflects its orchestration complexity. |
| Permission mode | `default` on all agents | Acceptable given the controlled environment. Could be tightened on read-only agents (Analyzer, Critic). |

### Tooling

| Tool | Purpose | Assessment |
|------|---------|------------|
| gitleaks / trufflehog | Secret scanning | Belt-and-suspenders with regex fallback. Well structured. |
| GitHub Actions | CI validation | Minimal but correct. Two jobs: validate + secrets scan. |
| Mermaid | Architecture diagrams | Appropriate for a Markdown-native project. |
| JSON Schema (draft-07) | Pipeline state and evidence contracts | Good. Schemas are present and tested via `validate-schemas.js`. Placeholder `$id` URIs are the one gap. |

### What Is Conspicuously Absent

- **No package manager lock file in production scope** — `package-lock.json` is explicitly ignored in secret-scan.js, which is correct since there are no dependencies to lock, but worth noting for future dependency additions.
- **No TypeScript** — acceptable at current scale. If scripts grow significantly, JSDoc with `@ts-check` would provide type safety without build overhead.
- **No linter or formatter** — `eslint` or `biome` is absent. Code style is consistent across files, suggesting discipline, but static analysis would catch issues the test suite misses.

---

## 4. Architecture Review

### System Topology

```
User (Claude Code session)
    │
    └── Skill entry point (/research, /evaluate, /compare, /recommend)
            │
            └── Director (Opus, maxTurns 50)
                    │
                    ├── Phase 0: Framing Gate (Director reads state, confirms with user)
                    ├── Phase 1: Researcher + Investigator (parallel)
                    ├── Phase 2: Analyzer
                    ├── Phase 3: Writer
                    ├── Phase 4: Critic (loop: max 3 cycles → PASS/REVISE/REWRITE)
                    ├── Phase 5: Security Reviewer + Tester (parallel)
                    ├── Phase 6: Challenger
                    ├── Phase 6.5: Gap-Fill Agent (Sonnet, maxTurns 8 — targeted gap research)
                    ├── Phase 7: Publisher
                    └── Phase 8: Index Update + Staleness Baseline
```

### Strengths

**State-machine design.** The `_pipeline/state.json` file with explicit phase states (pending/in_progress/completed/skipped/failed) enables resumption after interruption. This is the most important architectural decision in the system — without it, a failure at Phase 6 would mean restarting from scratch.

**Evidence contracts.** The `evidence.json` artifact is a structured knowledge layer that bridges the research phases and the writing phases. It prevents the Writer from inventing confidence labels or dropping findings. The `must_survive` field is particularly valuable — it creates a binding constraint the Publisher must verify.

**Parallel dispatch.** Phase 1 (Researcher + Investigator) and Phases 5–6 (Security Reviewer + Tester) are dispatched in parallel. This is architecturally correct and reduces elapsed time on the most expensive phases.

**Director as pure orchestrator.** The Director reads agent specs and state files but never reads full research artifacts directly. This keeps its context window focused and prevents the orchestrator from short-circuiting quality gates by forming early opinions on content.

**Pipeline modes.** Quick/Standard/Deep modes allow complexity-appropriate skip logic without duplicating pipeline definitions.

### Gaps and Issues

**Gap 1: Cross-analyzer integration is underdocumented**

The `cross-analyzer.md` agent and the `/cross-analyze` skill exist, but the dispatch rules in CLAUDE.md do not describe when this workflow is triggered or how its outputs integrate with the main pipeline. The cross-analyzer reads from `topics/_cross/`, which is not indexed in `index.md` — this is intentional (per agent spec), but it creates a secondary knowledge layer with no visibility path to operators.

**Gap 2: No per-phase budget tracking**

`config.json` stores a single `max_run_budget_usd: 15` ceiling. The Director is instructed to enforce an 80% checkpoint, but there is no mechanism to track cumulative spend across phases in the state file. If the Director is interrupted and resumed, there is no auditable record of spend committed in completed phases.

**Gap 3: State file carries no run history**

`state.json` reflects the current run only. There is no append-log of past runs. If a topic is re-evaluated, the prior run's scores and phase outcomes are overwritten. This prevents trend analysis on topic quality over time.

**Gap 4: Schema `$id` placeholders**

Both schemas use `"$id": "https://example.local/..."` URIs. These are non-resolvable. For local validation this is harmless, but it is a production readiness gap if schemas are ever published or referenced externally.

### Architecture Rating: 8.7 / 10

The core design is excellent. The gaps above are real but none are fundamental to the architecture — they are implementation gaps in an otherwise well-reasoned design.

---

## 5. Code Quality Review

### Scripts Layer (`scripts/`)

The 15+ scripts reviewed show consistent quality patterns:

**Strong patterns observed:**

- All scripts use `"use strict"` — no implicit globals
- `path.resolve()` is used consistently rather than string concatenation
- Error output goes to `stderr`; structured data goes to `stdout` — correct separation
- `--json` output mode is available on scripts that produce structured data
- `--dry-run` / `--repair` / `--write` pattern in `validate-pipeline-state.js` is well designed — preview before commit
- `spawnSync` in tests rather than `exec` — no shell injection surface
- `resolveInside()` in `safe-paths.js` prevents path traversal — used correctly

**Issues identified:**

**Issue 1: `secret-scan.js` external scanner fallback logic has a silent failure mode**

```javascript
if (result.status !== 0 &&
    (combinedOutput.includes("not recognized") || ...)) {
  continue;
}
if (result.status === 0) { return true; }
if (result.status !== null) { process.stdout.write(...); process.exit(result.status); }
```

If an external scanner returns a non-zero exit code for a reason *other than* "command not found" (e.g., a gitleaks configuration error), the logic falls through to `process.exit(result.status)` — but only after writing output to stdout/stderr. This means a scanner misconfiguration produces the same observable behavior as a real secret finding. The fallback to the internal regex scanner will not run. The correct behavior would be to distinguish scanner errors from scanner findings more explicitly.

**Issue 2: `claim-support-check.js` hardcoded brand name aliases**

```javascript
if (normalized.includes("systenics")) aliases.add("systenics");
if (normalized.includes("procycons")) aliases.add("procycons");
if (normalized.includes("chatforest")) aliases.add("chatforest");
if (normalized.includes("bluerock")) aliases.add("bluerock");
```

The `aliasesForLabel()` function contains hardcoded aliases for specific organizations (`systenics`, `procycons`, `chatforest`, `bluerock`). These appear to be aliases added to support specific topic research. As new topics are researched, this list will require manual updates. There is no mechanism to extend this list from topic configuration. This is a maintenance burden that will grow with topic count.

**Issue 3: `export-public.js` skips non-existent source files silently**

`copyFileIfExists()` returns `false` if a source file doesn't exist, and the call site uses the return value for logging but does not treat a missing `verdict.md` or `overview.md` as an error. For a topic that has failed mid-pipeline, a partial export (e.g., overview.md but no verdict.md) would be produced without warning. This should be a validation error, not a silent skip.

**Issue 4: `package.json` has `"private": true` but the repo is public**

The `"private": true` flag prevents accidental `npm publish` — which is correct for a pipeline tool. However, the README treats this as a publicly releasable knowledge base (`dist/public/` is described as the release artifact). The flag is not wrong, but the documentation should explain that `"private"` refers to npm registry publication, not to the visibility of the repository itself. New contributors may be confused.

### Agent Specification Quality

The agent `.md` files are the most sophisticated part of the system. They are effectively micro-frameworks — not just prompts, but specifications with:

- Explicit decision trees (Analyzer's contradiction resolution, Critic's verdict selection)
- Anchor examples at multiple quality levels (Critic's rubric scores)
- Anti-gaming rules (Challenger's 8-search minimum, Critic's first-pass PASS gate)
- Pre-save checklists (Researcher's 12-item checklist)
- Error handling protocols (Director's 3-error-type taxonomy)

**Outstanding design: Critic's first-pass PASS gate.** The rule that caps a first-pass result at REVISE (never PASS) under five specific conditions prevents early pipeline termination on marginal work. This is a subtle but high-value design choice that most AI pipeline designers miss.

**Outstanding design: Challenger's materiality filter.** Before declaring a finding WEAKENED (which would downgrade the published verdict), the Challenger must apply a materiality filter. This prevents minor technical quibbles from triggering verdict downgrades on well-supported recommendations.

**Code quality rating: 8.0 / 10**

---

## 6. Frontend / UX Review

BrainStorming has no traditional frontend. The operator interface is entirely through Claude Code sessions, slash commands, and npm scripts. This section reviews the *operator experience* — what it is like to use the system from the operator's perspective.

### Operator Experience: Strengths

**Skill entry points are clean.** The five skills (`/research`, `/evaluate`, `/compare`, `/recommend`, `/cross-analyze`) provide a named command surface. Operators do not need to know the internal pipeline structure — they call a skill and the Director handles routing.

**Framing Gate is the right UX pattern.** Phase 0 pauses before expensive research to confirm framing, scope, and related topics. This is exactly the right place to surface misunderstandings — before Phase 1 burns tokens and time. The gate also surfaces the budget cap, which sets operator expectations correctly.

**`npm run` commands are well named.** The 30+ npm scripts use consistent naming patterns (`check:`, `verify:`, `generate:`, `validate:`, `export:`). Running `npm run` without arguments produces a full list, making the command surface discoverable.

**`--json` output mode on scripts.** Operators can pipe script output to `jq` or consume it programmatically. This is a strong UX decision for a CLI-native tool.

### Operator Experience: Gaps

**Gap 1: No resumption UX for interrupted pipelines**

The state machine supports resumption (skips completed phases), but there is no documented command or skill invocation for "resume an interrupted pipeline." Operators who experience a mid-pipeline failure must know to re-run the same skill with the same topic — the system will pick up where it left off, but this behavior is not surfaced in the README or CLAUDE.md dispatch rules.

**Gap 2: Budget spend is not visible during a run**

The Director is instructed to enforce an 80% budget checkpoint, but token costs are captured in `run_metrics` only at run completion. During a long run, operators have no visibility into current spend relative to the cap.

**Gap 3: The dashboard is static and one-shot**

`generate-dashboard.js` writes a static HTML file. There is no live update, no filtering, no sorting in the browser. The dashboard is useful for a snapshot view but provides no interactivity. For a knowledge base growing toward 10+ topics, sorting by verdict, filtering by domain, or drilling into scorecard details would be high-value.

**Gap 4: No operator-facing error recovery guidance**

When a pipeline phase fails, the Director logs the error to `state.json`. But there is no documented procedure for operators to inspect errors, decide on recovery action, and re-run cleanly. The `validate-pipeline-state.js --repair` script addresses state corruption, but pipeline failures (agent errors, budget exhaustion) have no documented recovery path.

### Dashboard / Static Output Quality

The static dashboard (`dist/dashboard/index.html`) and the leadership index (`topics/index.md`) are functional but minimal. The dashboard passes the "BrainStorming Dashboard" and topic name tests in the test suite, which verifies basic generation — but the actual HTML quality is not reviewed in the test suite.

**Frontend/UX rating: 6.5 / 10** — Not a weakness of the system (it was never designed as a web app), but there are meaningful operator experience improvements available.

---

## 7. Backend / API / Data Review

BrainStorming has no traditional backend or API. Its "data layer" is the filesystem: JSON state files, Markdown artifacts, and schema-validated contracts. This section reviews that data layer.

### Data Architecture

```
topics/
├── {slug}/
│   ├── overview.md          # Public — landscape summary
│   ├── notes.md             # Public — implementation detail
│   ├── verdict.md           # Public — recommendation + scorecard
│   └── _pipeline/
│       ├── state.json       # Private — phase state machine
│       ├── evidence.json    # Private — structured findings
│       └── scorecard.md     # Private — rubric scores
├── _meta/
│   └── citation-cache.json  # Private — URL check results with TTL
└── index.md                 # Public — leadership table
```

### Strengths

**Schema validation covers the critical artifacts.** `pipeline-state.schema.json` and `evidence.schema.json` are both present and tested in CI. This is the most important data integrity mechanism in the system.

**Citation cache design is excellent.** The cache entry structure includes `checked_on`, `status`, `http_code`, `error_class`, `final_url` (after redirects), and `method_used`. This is more than a simple pass/fail cache — it is an auditable record of link health at a point in time. The TTL parameter allows operators to choose freshness/cost tradeoffs.

**Private network blocking is correct.** The citation verifier blocks `127.0.0.1`, `localhost`, and RFC-1918 ranges. This prevents SSRF-style attacks in the citation checking flow.

**`readPipelineState()` abstraction.** The `lib/pipeline-state.js` helper provides a single read path for state files, used in both the validator and the test suite. This prevents divergent parsing logic.

### Gaps

**Gap 1: Evidence schema fields are mostly optional**

The `evidence.schema.json` requires only `topic_slug` and `findings[]`. Individual finding fields — `confidence`, `must_survive`, `source_count` — are all optional. An agent that writes a minimal `evidence.json` with empty finding objects will pass schema validation. The schema should enforce at minimum `confidence` and `id` on each finding. The current design relies on agent compliance rather than schema enforcement.

**Gap 2: No state file versioning**

`state.json` has no schema version field. If the state schema evolves — adding a new phase, changing the `run_metrics` structure — there is no migration path and no way to detect that an existing state file is from an older schema version. Adding a `schema_version: "1"` field now costs nothing and prevents future pain.

**Gap 3: Citation cache has no size limit**

`citation-cache.json` grows indefinitely. For a small topic count, this is harmless. With 50+ topics researched over time, the cache file could become large enough to slow reads. A maximum age purge (remove entries older than `max_ttl * 2`) would keep it bounded.

**Gap 4: Evidence.json lacks a `generated_by_phase` field**

Findings in `evidence.json` can originate from Phase 1 (Researcher), Phase 1 parallel (Investigator), or Phase 2 (Analyzer synthesis). There is no field tracking which phase or agent produced a finding. This makes it harder to audit evidence provenance and prevents per-agent confidence calibration analysis.

**Data/API rating: 7.5 / 10**

---

## 8. Security Review

### Threat Model

BrainStorming operates in a constrained environment — single operator, no network endpoints exposed, no user authentication, no database. The relevant threats are:

1. **Prompt injection** — external content (web pages, GitHub READMEs) embedded in research artifacts could attempt to hijack agent behavior
2. **Secret leakage** — internal names, credentials, or paths ending up in `dist/public/`
3. **Supply chain** — malicious packages in `node_modules` (mitigated by zero-dependency design)
4. **Path traversal** — scripts that accept topic slugs could be manipulated to read/write outside `topics/`
5. **SSRF** — citation verifier fetching internal URLs (mitigated by private network blocking)

### Prompt Injection Defense

Every agent spec includes an "Untrusted Source Handling" section with the instruction to treat external content as data not instructions. This is documented but not technically enforced — it relies entirely on model compliance with the instruction. This is the current state of the art for LLM prompt injection defense, and the system does what is possible here.

**Recommendation:** For the Researcher and Investigator agents, consider adding a structural separator pattern between "system instructions" and "externally sourced content" in the agent prompts. Techniques such as XML tag delimiters (`<external_content>...</external_content>`) reduce (but do not eliminate) the risk of injection via context blurring.

### Secret Leakage

The defense-in-depth approach is strong:

- `assertNoPrivateArtifacts()` in `export-public.js` blocks `_pipeline`, `_meta`, `.env`, cert files
- `secret-scan.js` checks the repo for credential patterns before any publish step
- CLAUDE.md explicitly prohibits referencing internal names (`brainstorming-priv`, `Keystone`, `SupportAI`, `ToolDev`) in published files
- CI runs gitleaks on push to main and all PRs

**One gap:** The `assertNoPrivateArtifacts()` function checks *directory names* (`_pipeline`, `_meta`) but not *file content*. A topic file that accidentally includes an internal path or organization name in its prose would pass the artifact check. The claim-support checker does not catch this pattern either. The secret scanner would catch API key patterns but not prose-level information leakage.

### Path Traversal

`safe-paths.js` implements `resolveInside()` and `isValidTopicSlug()`. The slug validator correctly rejects `..` components and enforces lowercase alphanumeric + hyphen. This is used in `pipeline-preflight.js` and tested in the test suite. Good.

**One gap:** Not all scripts that accept topic names use `resolveInside()`. `claim-support-check.js` constructs paths via `path.join(TOPICS_DIR, slug)` without slug validation. An operator-provided slug of `../../../etc/passwd` would not be caught. This is low-risk in a single-operator tool but is still incorrect.

### Dependency Security

Zero dependencies means zero supply chain attack surface. This is the most robust possible position. `npm audit` in CI will always pass because there is nothing to audit. This is a genuine strength that should be preserved as the project grows.

### CVE Scanning of Research Subjects

The Security Reviewer agent performs CVE spot-checks on the tools being evaluated (NVD API, GitHub Advisories, OSV.dev). This is not just pipeline security — it is part of the research quality process. The integration between security research and the BLOCK verdict is well designed: a security reviewer finding that materially changes the recommendation can halt publication.

### Security Rating: 7.8 / 10

The system is secure for its threat model. The primary gaps are the silent failure mode in external secret scanner fallback logic, missing slug validation in a subset of scripts, and the inherent limitations of prose-level injection defense.

---

## 9. Performance and Scalability Review

### Current Scale

The system is designed for a single operator running one pipeline at a time. At current scale (2 active topics), no performance concerns exist.

### Token Cost Analysis

| Phase | Agent | Model | Approx. cost driver |
|-------|-------|-------|---------------------|
| 1 | Researcher | Sonnet | 15 turns × web search + synthesis |
| 1 | Investigator | Sonnet | 18 turns × adversarial search |
| 2 | Analyzer | Sonnet | Cross-reference, evidence.json write |
| 3 | Writer | Opus | Three output files, full context |
| 4 | Critic (×3) | Sonnet | Rubric scoring, revision loop |
| 5 | Security Reviewer | Sonnet | CVE queries, STRIDE analysis |
| 5 | Tester | Sonnet | 12+ scenario generation |
| 6 | Challenger | Sonnet | 8+ searches, materiality filter |
| 6.5 | Gap-Fill | Sonnet | 8 turns max — targeted gap queries only |
| 7 | Publisher | Sonnet | 8-step protocol, 40-item checklist |
| 8 | Director | Opus | Index update, state finalization |

The Director operates on Opus for the full 50-turn budget window. Most of those turns are coordination (reading state files, spawning agents, checking results), which should be lightweight context operations. However, Opus costs ~5× Sonnet per token. If the Director is accumulating large context (full agent specs × 11 + state files + phase outputs), context management becomes a real cost driver at scale.

**Recommendation:** Audit Director context load per turn. Agent specs should be read once at pipeline start and summarized into a compact dispatch table for subsequent turns rather than re-read on every phase transition.

### Staleness and Re-evaluation

The staleness detection system (`check-staleness.js`) is well designed — per-finding decay classes with approaching-threshold warnings. However, staleness detection does not automatically trigger re-evaluation. An operator must manually run the staleness check and then invoke the appropriate skill. As the topic count grows, this manual loop will become burdensome.

### Parallel Dispatch Opportunity

Currently parallel dispatch occurs in two places: Phase 1 (Researcher + Investigator) and Phases 5–6 (Security Reviewer + Tester). There is no parallel dispatch in the Critic revision loop or the Publisher phase. These are sequential by design, which is correct for the Critic (revisions are dependent on prior outputs) but could potentially be parallelized for independent Publisher sub-tasks.

### Scalability Ceiling

At 10–20 topics, the current architecture scales without modification. At 50+ topics:

- `topics/index.md` becomes unwieldy as a single flat table
- `citation-cache.json` grows to meaningful size
- Dashboard generation (iterating all topics) slows proportionally
- `claim-support-check.js --all` has O(n) runtime over topics × findings

None of these are blocking concerns at current scale, but they are the right areas to instrument.

**Performance/Scalability rating: 7.5 / 10**

---

## 10. Testing and QA Review

### Test Suite Overview

The test suite (`test/scripts.test.js`) contains 16 integration tests using Node's built-in test runner. All tests use `spawnSync` to run scripts as child processes, testing actual script behavior rather than imported module behavior.

### What Is Well Tested

| Test area | Coverage quality |
|-----------|-----------------|
| Frontmatter parsing (CRLF) | Good — covers a real edge case |
| Markdown table parsing | Good — functional coverage |
| Safe path rejection | Good — covers the security-critical case |
| Staleness JSON output | Good — asserts specific slug presence |
| Pipeline state validation | Excellent — tests preview → write two-step |
| Malformed state fixture | Good — asserts error message content |
| Pipeline preflight | Good — tests shared process runner integration |
| Schema validation | Good — catches regression on schema changes |
| Public export | Good — asserts both presence and absence of paths |
| Citation blocking | Good — asserts private network block |
| Citation cache read/write | Excellent — tests write, TTL, bypass, expiry |
| Citation status classification | Excellent — parameterized, covers all classes |
| Leadership index generation | Good — asserts structure and content |
| Dashboard generation | Good — asserts HTML title and topic name |
| Claim support JSON | Good — asserts output structure |
| Trend report | Minimal — only asserts stdout message |

### Testing Gaps

**Gap 1: Agent specification quality is not tested**

The most critical artifacts in the system are the 12 agent `.md` files. Their correctness is entirely manual — there is no automated check that:
- Required sections are present (e.g., every agent has an "Untrusted Source Handling" section)
- Phase references in director.md correspond to existing agent files
- Agent `maxTurns` values are within documented ranges

A lint-level check on agent specs would catch structural regressions (missing sections, stale phase references) before they reach a live pipeline run.

**Gap 2: Evidence schema coverage is incomplete**

The schema validation test runs `validate-schemas.js` and checks for a passing exit code. It does not validate that example evidence files (used in fixture topics) actually conform to the schema. Adding fixture-based schema conformance tests would harden the contract.

**Gap 3: Claim support false-positive rate is not validated**

The `claim-support-check.js` test asserts `summary.needs_review === 0` for the live topics. This means the test will fail if new content introduces unsupported claims — which is the correct behavior. However, it does not validate the checker's accuracy on known-good and known-bad fixtures. The algorithm has several heuristic layers (`aliasesForLabel()`, `mentionedRegistrySupport()`) that could produce false positives; these are not tested independently.

**Gap 4: Secret scanner fallback is not tested**

`secret-scan.js` has both external scanner and regex fallback paths. The test suite does not test either path. A test using a fixture file with a known pattern (e.g., a fake AWS key format) would validate the regex fallback without testing external tool availability.

**Gap 5: `export-public.js` does not test partial export behavior**

The export test asserts that a known file is present and that `_pipeline` is absent. It does not test what happens when a topic has `overview.md` but no `verdict.md` — the silent skip issue identified in Section 5.

### Fixture Quality

The fixtures in `test/fixtures/topics/` serve the integration tests well. `valid-topic` and `malformed-state` cover the happy path and a critical error case. `broken-citation-topic` supports the full citation test matrix. The fixture set is appropriate for the test volume.

**Testing/QA rating: 7.0 / 10** — Strong integration coverage where tests exist, meaningful gaps in agent spec validation and edge case coverage.

---

## 11. Developer Experience Review

### Onboarding

The `README.md` is comprehensive and well structured. It covers the pipeline architecture, quality standard, npm commands, quickstart, and publishing notes. A developer new to the project can understand the system's purpose and basic operation from the README alone.

The `diagram.md` with Mermaid diagrams is an excellent supplement — the sequence diagram showing the happy path is particularly useful for understanding the Director's orchestration pattern.

**Gap:** The README does not explain how to add a new agent to the pipeline. The process (create `.claude/agents/{name}.md`, add to Director registry, add phase entry in Director spec) is spread across three files with no single onboarding document connecting them.

### CLAUDE.md Quality

The `CLAUDE.md` dispatch rules clearly describe which user message patterns trigger which skills. The 8-dimension quality standard is stated with enough detail to use as a review checklist. The maintenance scripts section is well organized.

**One issue:** The dispatch rules reference `/cross-analyze` as a skill but do not describe when to use it relative to the main pipeline. The cross-analyzer's relationship to individual topic verdicts is unclear from CLAUDE.md alone — operators must read the cross-analyzer agent spec to understand its role.

### Debugging Experience

When a pipeline phase fails:
- The Director logs error type and context to `state.json`
- `validate-pipeline-state.js --repair` can correct state file corruption
- `pipeline-preflight.js` runs pre-flight checks before a pipeline starts

**Gap:** There is no diagnostic script that explains *what happened* in a failed run. An operator confronting a failure sees `state.json` with a `failed` phase status but has no guided path to root cause. A `diagnose-run.js` script (or a `--diagnose` flag on validate-pipeline-state) that translates error codes to human-readable explanations would significantly improve the debugging experience.

### Code Navigation

All scripts import from `scripts/lib/` helpers. The library modules are:
- `topic-utils.js` — frontmatter parsing, topic slug listing
- `markdown-table.js` — table row parsing
- `pipeline-state.js` — state file read
- `safe-paths.js` — path validation
- `citation-status.js` — HTTP status classification

This is clean modular organization. Each module has a single responsibility. The naming is consistent and descriptive.

**Developer experience rating: 7.5 / 10**

---

## 12. Product Strategy and Feature Opportunities

### Current Position

BrainStorming is a mature single-operator research system. Its differentiation comes from the quality gate depth — few AI research pipelines include adversarial phases (Challenger), domain transfer testing (Tester), and evidence contract verification (Critic). This positions it as a high-trust knowledge base rather than a fast-turn opinion generator.

### Near-Term Opportunities (0–3 months)

**Opportunity 1: Topic versioning and comparison**

The system evaluates tools at a point in time but has no mechanism to compare a tool's current verdict to its prior verdict after re-evaluation. Adding a version history to `verdict.md` (or a separate `verdict-history.json`) would allow operators to see how a recommendation has evolved — "we moved from CONDITIONAL to ADOPT over 6 months as the security posture improved."

**Opportunity 2: Verdict invalidation monitoring**

`verdict.md` documents 11 invalidation conditions per topic (specific version numbers, license changes, CVEs). Currently, monitoring these conditions is entirely manual. An automated check against GitHub releases, npm registry, NVD advisories could flag when a known invalidation condition has potentially occurred. This would be a high-value automation.

**Opportunity 3: Topic dependency graph**

When a verdict for Tool A depends on the compatibility of Tool B (e.g., an AI SDK that requires a specific model API), changes to Tool B's verdict should surface as a potential invalidation of Tool A. A dependency declaration in `verdict.md` frontmatter (`depends_on: [markitdown, ...]`) plus a staleness propagation rule would build this.

**Opportunity 4: Structured verdict export**

Currently `dist/public/` exports Markdown files. Adding a `dist/public/index.json` with machine-readable verdict summaries (topic, verdict, score, confidence, date, key recommendation) would enable downstream consumers — dashboards, automated reports, integrations — without parsing Markdown.

### Medium-Term Opportunities (3–9 months)

**Opportunity 5: Multi-operator support**

The system is currently single-operator. Adding basic access control (operator-specific working branches, approval gates before publishing to main) would enable team use without the full complexity of a web application.

**Opportunity 6: Comparative pipeline mode**

The `/compare` skill exists but its pipeline definition is not visible in the reviewed files. Formalizing a comparison pipeline that runs two topics through a shared Phase 2 (Analyzer with cross-reference matrix) and produces a structured `compare.md` output would be high value.

**Opportunity 7: Interactive dashboard**

Replace the static HTML dashboard with a simple single-page application (no framework needed — vanilla JS) that supports topic filtering by domain, verdict, score range, and freshness. This would not require a backend — the existing structured JSON export from Opportunity 4 is the data source.

### Strategic Observation

The system's public/private separation and `dist/public/` export model suggest the operator intends for the knowledge base to be publishable. If published to GitHub Pages or similar, the interactive dashboard and machine-readable JSON export become significantly more valuable as they enable external consumers to use the research outputs.

---

## 13. Prioritized Issues and Recommendations

| # | Issue | Severity | Effort | Section |
|---|-------|----------|--------|---------|
| 1 | Evidence schema allows empty findings — no enforcement of `confidence` field | High | Low | §7 |
| 2 | `claim-support-check.js` hardcoded org name aliases — will break for new topics | High | Medium | §5 |
| 3 | `export-public.js` silently skips missing public files — partial exports undetected | High | Low | §5 |
| 4 | `secret-scan.js` silent failure mode when external scanner errors | High | Low | §5 |
| 5 | `claim-support-check.js` does not validate slug before path construction | Medium | Low | §8 |
| 6 | No state file schema version — migration path is undefined | Medium | Low | §7 |
| 7 | No resumption UX documentation for interrupted pipelines | Medium | Low | §6 |
| 8 | Dashboard is static — no filtering or sorting | Medium | Medium | §6 |
| 9 | Agent spec structural lint not automated — structural regressions go undetected | Medium | Medium | §10 |
| 10 | No per-phase budget tracking in state file | Medium | Medium | §4 |
| 11 | Director context load from agent specs is unaudited — potential Opus cost driver | Medium | Medium | §9 |
| 12 | Cross-analyzer integration not documented in CLAUDE.md dispatch rules | Medium | Low | §4 |
| 13 | Staleness detection not connected to automated re-evaluation trigger | Low | High | §9 |
| 14 | Citation cache has no size/age purge — grows unbounded | Low | Low | §7 |
| 15 | No `generated_by_phase` field in evidence.json findings | Low | Low | §7 |
| 16 | Schema `$id` URIs use `https://example.local/` placeholders | Low | Low | §4 |
| 17 | Trend report test is minimal — only checks exit code and stdout message | Low | Low | §10 |
| 18 | Secret scanner fallback regex paths not covered by tests | Low | Medium | §10 |
| 19 | No onboarding doc for adding a new agent to the pipeline | Low | Low | §11 |

---

## 14. 4-Phase Next-Level Development Roadmap

### Phase A — Close Critical Gaps (Weeks 1–2)

**Goal:** Eliminate blockers and high-severity gaps. No new features — repair and harden.

**Tasks:**

1. **Tighten evidence.schema.json.** Add `confidence` (enum: HIGH/MEDIUM/LOW/UNVERIFIED) as required on each finding. Confirm `id` is required. Optionally add a `source_count` minimum of 1 for HIGH confidence findings. Update `validate-schemas.js` fixture accordingly.

2. **Fix `export-public.js` partial export detection.** Add a check: if a topic directory is identified as public (has at least one of the three public files), warn if any of the three are missing. For a topic with `completed` pipeline state, treat missing `verdict.md` as an error.

3. **Fix `secret-scan.js` external scanner error handling.** Distinguish between "scanner not found" (ENOENT or "command not found" output) and "scanner found a real issue" versus "scanner errored for another reason." Only fall through to the regex fallback on the not-found case; treat other non-zero exits as either findings or scanner errors to be investigated.

4. **Slug validation in `claim-support-check.js`.** Add `isValidTopicSlug()` check on the `--topic` argument before constructing the path.

### Phase B — Automate Quality Gates (Weeks 3–6)

**Goal:** Reduce manual steps in the pipeline maintenance workflow.

**Tasks:**

1. **Agent spec structural lint script (`lint-agents.js`).** For each file in `.claude/agents/`, check: required sections present (Untrusted Source Handling, Pre-save checklist or equivalent, verdict format), model and maxTurns frontmatter present, all agent names referenced in `director.md` have a corresponding file in `.claude/agents/`. Run this in CI.

2. **Per-phase budget tracking in `state.json`.** Add a `phases[n].token_cost_usd` field populated by the Director after each phase completes. Sum to `run_metrics.total_cost_usd`. This enables post-run cost attribution and will surface if any phase is disproportionately expensive.

3. **State file schema versioning.** Add `"schema_version": "1"` to `state.json`. Update `validate-pipeline-state.js` to warn on version mismatch rather than silently reading potentially incompatible fields.

4. **Verdict invalidation condition monitor (`check-invalidation.js`).** Parse the invalidation conditions section from each `verdict.md` (structured as a list of conditions). Check: version numbers against npm/PyPI registry, CVE IDs against NVD API, repository archive status against GitHub API. Report flagged conditions. This script is a CI candidate — run on schedule, not on every push.

5. **Configurable source aliases in `claim-support-check.js`.** Replace hardcoded `aliasesForLabel()` brand entries with a configuration file (`scripts/config/source-aliases.json`). Provide a clear format for adding new aliases per topic. The existing hardcoded entries become the initial config.

### Phase C — Enrich the Knowledge Base Interface (Weeks 7–12)

**Goal:** Make the knowledge base more useful to consumers beyond the operator.

**Tasks:**

1. **Structured JSON export (`dist/public/index.json`).** Extend `export-public.js` to emit a machine-readable summary of all published topics: slug, title, verdict, score, confidence, date, key recommendation (first sentence of verdict.md), invalidation count. This enables downstream integrations.

2. **Interactive dashboard.** Replace the static HTML with a single-page vanilla JS application. Data source: the `index.json` from task 1. Features: sort by score/date/verdict, filter by domain and verdict type, click to view topic detail. No external framework — keep the zero-dependency philosophy.

3. **Topic dependency graph.** Add `depends_on: []` to `verdict.md` frontmatter. Extend `check-staleness.js` to propagate staleness: if Topic B's verdict is stale or has been re-evaluated, surface Topic A (which depends on B) as potentially affected.

4. **Resumption UX documentation.** Add a "Resuming an Interrupted Pipeline" section to `README.md` and `CLAUDE.md`. Describe: how to check pipeline state, how to re-invoke the skill to resume, how to interpret partial completion states, when to use `--repair`.

5. **`diagnose-run.js` script.** Reads `state.json` for a given topic slug, identifies failed or stalled phases, translates error codes to human-readable descriptions, suggests next actions (re-run with `--re-evaluate`, run `validate-pipeline-state --repair`, check budget cap).

### Phase D — Scale and Continuous Improvement (Months 4–6)

**Goal:** Prepare for growing topic count and multi-operator use.

**Tasks:**

1. **Staleness-triggered re-evaluation workflow.** Extend the scheduled CI job (or add a new one) to run `check-staleness.js --json`, identify topics approaching threshold, and emit a GitHub issue or Slack notification (if configured) prompting re-evaluation.

2. **Director context optimization.** Profile Director token usage per turn. Implement a compact agent dispatch table (generated from agent spec frontmatter only) that the Director uses for phase routing, reserving full spec reads for the first turn of each phase spawn.

3. **Citation cache maintenance.** Add a `prune-citation-cache.js` script that removes entries older than `max_ttl_days × 2`. Add to `package.json` scripts and CI maintenance job.

4. **Cross-analyzer documentation pass.** Document the cross-analyzer workflow in CLAUDE.md dispatch rules, including when to run it (after 3+ topics in related domains), expected output format, and how cross-analysis findings feed back into individual topic re-evaluation.

---

## 15. Suggested Technical Improvements

### 1. Add `@ts-check` to all scripts

```javascript
// @ts-check
/** @type {(slug: string) => boolean} */
function isValidTopicSlug(slug) { ... }
```

No build step required. Enables IDE type checking and catches argument type mismatches at edit time. VSCode will surface errors inline.

### 2. Consolidate agent spec section validation into a shared contract

Create `scripts/lib/agent-spec.js` with a `validateAgentSpec(filePath)` function that reads an agent `.md` file and checks for required sections. This can be called from both `lint-agents.js` (new) and any CI integration.

### 3. Replace `path.join(dir, slug)` patterns with `resolveInside()`

Three scripts construct topic paths without using `resolveInside()`. A one-time refactor pass (approximately 15 minutes) would eliminate the path traversal gap identified in §8 across all scripts.

### 4. Add `schema_version` to `evidence.json` schema

```json
{
  "required": ["topic_slug", "schema_version", "findings"],
  "properties": {
    "schema_version": { "type": "string", "const": "1" }
  }
}
```

### 5. Parameterize `ignoredDirs` in `secret-scan.js`

Currently hardcoded as a `Set`. Extracting to a config section at the top of the file (or reading from `config.json`) would allow project-specific exclusions without code changes.

### 6. Add `generated_by_phase` field to evidence.json findings

```json
{
  "id": "finding-001",
  "generated_by_phase": "phase_1_researcher",
  "confidence": "HIGH",
  ...
}
```

This enables post-run analysis of which agents produce findings that survive to publication.

### 7. Normalize Markdown output line endings

The `parseFrontmatter` test explicitly handles CRLF by replacing before parsing. If the pipeline's Node scripts always normalize to LF on read (`content.replace(/\r\n/g, '\n')`), the test becomes an assertion of normalize-then-parse rather than parse-CRLF-directly. Centralizing this in `topic-utils.js` is cleaner.

---

## 16. Suggested Product Improvements

### 1. Publish the knowledge base to GitHub Pages

The `dist/public/` export model and the `assertNoPrivateArtifacts()` guard exist precisely to enable publication. Deploy `dist/public/` to GitHub Pages as part of the release workflow. The existing export script is the build step; the deployment step is a single `actions/deploy-pages` addition to the CI workflow.

### 2. Add a "topic request" intake template

Create a GitHub issue template (`.github/ISSUE_TEMPLATE/topic-request.md`) with fields: proposed topic, context/motivation, relevant domains, urgency. This formalizes the intake process and creates a backlog visible to external contributors if the repository is public.

### 3. Introduce a "Quick Verdict" pipeline mode

The current Quick mode skips specific phases but still produces a full three-file output. Add an explicit `--quick-verdict` mode that produces only `verdict.md` with a compressed scorecard (4 dimensions instead of 8) and a single-page notes summary. Use case: fast tactical decisions where full research depth is not required.

### 4. Verdict badge system

Generate SVG badges (like shields.io format) for each published topic: verdict (ADOPT/CONDITIONAL/AVOID), score (e.g., 8.25/10), freshness (FRESH/AGING/STALE). Include in the README table. This makes the knowledge base scannable at a glance for external consumers.

### 5. Structured recommendation extraction

Add a `recommendations.json` export (alongside `index.json`) that lists the top 3 actionable recommendations from each `verdict.md`. This enables building a cross-topic "action backlog" — what should we do across all evaluated tools?

### 6. "Decision pending" status

Currently topics are either in-pipeline or published. Add a `decision-pending` status for topics where the pipeline has completed but the operator has not committed to the verdict (perhaps awaiting external information). This status would appear in the index and dashboard without publishing the full verdict.

### 7. Email or notification digest

A weekly digest of: topics approaching staleness threshold, new topics published, invalidation conditions flagged. This could be a simple script that formats a text summary and triggers via a scheduled CI job or a simple webhook. No server infrastructure required.

---

## 17. Final Assessment

### Strengths Summary

BrainStorming is not a prototype — it is a production-grade research pipeline with a coherent architecture, principled design decisions, and a quality standard that rivals dedicated editorial workflows. Its most notable strengths:

1. **Agent specification depth.** The 12 agent definitions are micro-frameworks, not prompts. Each one encodes domain knowledge (adversarial research methodology, rubric design, citation verification) that took real effort to operationalize correctly.

2. **Zero-dependency philosophy.** Eliminating all npm dependencies removes a significant operational and security surface. This is a deliberate, correct choice that the project should actively preserve.

3. **Adversarial quality gates.** The Critic → Security Reviewer → Tester → Challenger → Publisher chain is more rigorous than most AI-generated content pipelines. The materiality filter in the Challenger and the first-pass PASS gate in the Critic are particularly sophisticated design choices.

4. **Evidence contracts.** `evidence.json` as a structured intermediate artifact creates auditability. Confidence labels in published output are traceable to specific findings with source counts and decay classes.

5. **Public hygiene enforcement.** The combination of `assertNoPrivateArtifacts()`, secret scanning, CI checks, and explicit CLAUDE.md prohibitions creates a multi-layer defense against private information leakage.

### Improvement Summary

The path to the next level of maturity involves:

- Tightening schema enforcement on the evidence contract
- Building the agent spec structural lint tool to catch regressions automatically
- Connecting the staleness and invalidation monitoring to automated triggers
- Enriching the public-facing output with structured JSON and an interactive dashboard

None of these are fundamental architectural changes. The foundation is sound.

### Quality Gate Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 8.7 | Director pattern, state machine, evidence contracts are excellent |
| Code quality | 8.0 | Consistent, well-structured; a few specific script issues |
| Security | 7.8 | Strong defense-in-depth; minor gaps in slug validation and scanner error handling |
| Testing | 7.0 | Strong integration coverage; gaps in agent spec and edge case testing |
| Developer experience | 7.5 | Good documentation; missing onboarding for pipeline extension |
| Performance | 7.5 | Appropriate for current scale; cost attribution and Director context need attention |
| Product strategy | 8.0 | Clear publication model; strong near-term opportunities identified |
| Frontend/UX | 6.5 | Correct for a CLI tool; operator experience has meaningful improvement opportunities |

**Weighted Overall: 8.0 / 10**

### Verdict

BrainStorming is a well-engineered, production-capable research pipeline with a coherent philosophy and strong execution. It demonstrates an unusually high quality bar for a personal tool — the multi-agent adversarial quality stack, evidence contracts, and public hygiene enforcement are not features typically found outside enterprise knowledge management systems.

The immediate priorities are the schema and script hardening items in Phase A of the roadmap: The strategic opportunities in Phase C (structured export, interactive dashboard, invalidation monitoring) would meaningfully expand the knowledge base's value to external consumers.

This is a system worth investing in further.

---

*Review completed 2026-04-26. Based on full codebase review: all agent definitions, all scripts, both schemas, test suite, CI workflow, and published topic outputs.*
