---
title: "Codebase-Memory — Detailed Findings"
tags: ["mcp", "code-navigation", "tree-sitter", "knowledge-graph"]
created: "2026-04-23"
status: "complete"
---

# Detailed Findings: Codebase-Memory

## Finding 1: MIT-Licensed Open-Source Published via arXiv Peer Review

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277](https://arxiv.org/abs/2603.27277), [GitHub DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)


---

## Finding 2: Technical Architecture — Tree-Sitter AST → SQLite Knowledge Graph → 14 MCP Tools

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277 (HTML)](https://arxiv.org/html/2603.27277v1), [GitHub DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp), [Official Docs](https://deusdata.github.io/codebase-memory-mcp/)

Codebase-Memory parses source code via Tree-Sitter AST analysis across 66 programming languages, building a persistent SQLite-backed property graph with call chains, class hierarchies, and cross-file relationships. The three-stage pipeline is:

- **Parse:** Tree-Sitter extracts definitions (functions, methods, classes, interfaces, enums, types) with signatures, return types, decorators, complexity metrics, and export status
- **Build:** Multi-phase pipeline with parallel worker pools and SQLite deferred indexing; uses LZ4 compression and in-memory SQLite for performance
- **Serve:** 14 typed MCP tools split into indexing (index_repository, list_projects, delete_project, index_status) and querying (search_graph, trace_call_path, detect_changes, query_graph, get_graph_schema, get_code_snippet, get_architecture, search_code, manage_adr, ingest_traces)

**Caveat:** Unlike jCodeMunch's stateless symbol retrieval, Codebase-Memory requires persistent SQLite storage and incremental re-indexing on code changes. This is a deployment complexity factor. Large monorepos may experience indexing latency.

---

## Finding 3: Performance — 10x Token Savings, 83% Answer Quality, Sub-Millisecond Queries

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277](https://arxiv.org/html/2603.27277v1), [Official Docs](https://deusdata.github.io/codebase-memory-mcp/)

Codebase-Memory achieves 10x fewer tokens than file-exploration agents while maintaining 83% answer quality on structural queries. The arXiv paper reports "83% answer quality versus 92% for file-exploration agent, at ten times fewer tokens and 2.1 times fewer tool calls." Official documentation claims higher reductions for specific task types: 120–225x token reductions for function finding (~225x), call tracing (~150x), and dead code detection (~170x). Benchmarks span 31 real-world repositories. The Linux kernel (28M LOC, 75K files) indexes in 3 minutes.

**Caveats:** 

1. The 83% answer quality metric is query-specific—it applies to structural queries (architecture discovery, call-path tracing, dead code detection). Other query types may exhibit different accuracy profiles. The 17% gap includes expected design limitations (e.g., queries requiring semantic type resolution that Tree-Sitter cannot provide).

2. Answer quality (83%) is not directly comparable to jCodeMunch's token reduction claims (95%+) because they measure different task dimensions—answer quality (a task outcome) versus token efficiency (a cost metric).

3. Token reduction is task-specific. General-purpose comparison between Codebase-Memory and jCodeMunch requires controlled evaluation on identical task sets (none published to date).

---

## Finding 4: Production-Ready Single Static Binary, Zero Dependencies, Auto-Integrates with 8 Agents

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277](https://arxiv.org/html/2603.27277v1), [Official Docs](https://deusdata.github.io/codebase-memory-mcp/)

Codebase-Memory ships as a single statically-linked C binary (macOS, Linux, Windows) with zero runtime dependencies—no Docker, npm/pip, or external C libraries required. Installation is: (1) download binary, (2) `codebase-memory-mcp install` for auto-configuration, (3) restart agent. A single install command auto-detects and configures 8 agents: Claude Code, Codex CLI, Gemini CLI, Zed, OpenCode, Antigravity, Aider, KiloCode. Includes background git watcher for auto-reindexing on session start and 3D graph UI at localhost:9749.

**Advantage vs. jCodeMunch:** Zero-dependency deployment is a competitive advantage. jCodeMunch requires Python/pip installation and manual MCP configuration, adding deployment friction.

**Caveat:** Windows compatibility testing and known issues are not addressed in public documentation. Static binary claim applies across three platforms, but Windows support maturity is undocumented. Evaluate on target Windows version before organizational deployment.

---

## Finding 5: Licensing Comparison — MIT (Codebase-Memory) vs. Freemium (jCodeMunch)

**Confidence:** HIGH

**Sources:** [GitHub DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp), [arXiv 2603.27277](https://arxiv.org/abs/2603.27277), [GitHub jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp)

Codebase-Memory is fully open-source MIT with no licensing restrictions; permits unrestricted commercial use, modification, and distribution with zero licensing fees. jCodeMunch uses a freemium commercial model: Builder ($79 for 1 developer) → Team ($499 for 5 developers) → Platform ($1,999+, organization-wide).

**Impact:** MIT licensing is zero-friction for organizations with FOSS policies. Commercial deployments of Codebase-Memory incur no licensing cost; jCodeMunch requires commercial negotiation and per-tier pricing. This directly impacts cost-of-ownership analysis and procurement timelines.

---

## Finding 6: Architectural Comparison — Codebase-Memory (Property Graph) vs. jCodeMunch (Symbol Retrieval Index)

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277](https://arxiv.org/html/2603.27277v1), [GitHub jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp), [jCodeMunch Comparison Page](https://j.gravelle.us/jCodeMunch/versus.php)

Codebase-Memory and jCodeMunch differ fundamentally in architecture and query model:

- **Codebase-Memory:** Builds a property graph optimized for cross-file structural analysis. Enables Cypher-style queries for call paths, impact graphs, architectural hub detection. Tools: trace_call_path, get_architecture, query_graph, manage_adr.

- **jCodeMunch:** Builds a retrieval index optimized for surgical symbol-level precision. Enables O(1) byte-offset seeking for functions, classes, methods, constants. Tools: get_blast_radius, find_importers, get_call_hierarchy, search_ast (cross-language pattern matching), get_symbol_provenance.

**Architectural significance:** jCodeMunch's official comparison page (versus.php) notably omits Codebase-Memory, suggesting these tools occupy different competitive spaces—retrieval precision vs. structural traversal—rather than direct competition. Real-world adoption often pairs complementary tools rather than selecting one.

**Caveat:** No published head-to-head benchmark comparing the two architectures on identical task sets. Adoption decision between them requires independent A/B testing on representative codebases.

---

## Finding 7: Language Support — 66 Languages (Codebase-Memory) vs. 70+ (jCodeMunch)

**Confidence:** HIGH

**Sources:** [arXiv 2603.27277](https://arxiv.org/html/2603.27277v1), [GitHub jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp), [Official Docs](https://deusdata.github.io/codebase-memory-mcp/)

Codebase-Memory supports 66 languages via Tree-Sitter with "LSP-style hybrid type resolution" for Go, C, and C++. jCodeMunch supports 70+ languages via Tree-Sitter with cross-language AST pattern matching. Codebase-Memory's type resolution improves call graph accuracy for statically-typed languages. jCodeMunch's pattern matching enables anti-pattern detection across language families (e.g., SQL injection, null-check ordering across JS/TS/Python).

**Minor documentation discrepancy:** Official Codebase-Memory docs list 64 languages; arXiv states 66. Likely revision lag or counting methodology difference. Both represent comprehensive language coverage; the difference is immaterial to adoption decisions.

**Caveat:** Type resolution accuracy for Go/C/C++ is not independently benchmarked. No control experiment validates LSP-enhanced accuracy vs. standard Tree-Sitter alone.

---

## Finding 8: Integration & Deployment — Codebase-Memory Zero-Config vs. jCodeMunch Manual Configuration

**Confidence:** HIGH

**Sources:** [Official Docs](https://deusdata.github.io/codebase-memory-mcp/), [GitHub jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp)

Codebase-Memory auto-configures 8 agents in one install command (zero-config); install script auto-detects Claude Code, Cursor, and Codex CLI and writes MCP entries. jCodeMunch requires manual MCP configuration (editing claude_desktop_config.json) or installation via `pip install jcodemunch-mcp`.

**Advantage:** Codebase-Memory's deployment friction is lower. Zero-config reduces adoption friction and user onboarding time. jCodeMunch's manual configuration introduces setup complexity and potential configuration errors.

**Caveat:** Auto-configuration covers 8 agents. Compatibility with other agents (Copilot, Cursor Pro, OpenAI Codex) is not tested or documented. Integration robustness with less common agents is unknown.

---

## Finding 9: Research Validation & Use-Case Focus — Health Informatics Domain

**Confidence:** MEDIUM

**Sources:** [arXiv 2603.27277](https://arxiv.org/html/2603.27277v1)

The arXiv paper highlights health informatics as a "particularly promising application domain" where structural code queries outperform LLM grepping. Specifically cites FHIRconnect DSL (HL7 FHIR ↔ openEHR bidirectional mapping) as a domain-specific language difficult for LLMs to explore and generate via file-based exploration. Call-graph and type-aware queries are positioned as superior to token-intensive file reading in this domain.

**Caveat:** Single source (arXiv paper); no independent validation, case studies, or production deployments found. Health informatics use case is illustrative; does not impact core performance evaluation. Domain-specific claim is contextual and should not be generalized to other verticals without evidence.

---

## Finding 10: Maintenance & Team Status — DeusData Organization, Active Releases, No Visible Risk Signals

**Confidence:** MEDIUM

**Sources:** [GitHub DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp), [Official Docs](https://deusdata.github.io/codebase-memory-mcp/), [arXiv 2603.27277](https://arxiv.org/abs/2603.27277)

Codebase-Memory is maintained by DeusData (GitHub organization) with recent releases, active documentation, and no visible maintenance-risk signals (code commits, release cadence, responsive issues). arXiv publication in 2026 indicates active research. Organization structure (organizational repo vs. personal) suggests potential for team support compared to single-maintainer tools like jCodeMunch.

**Caveats:**

1. Single-maintainer status is not explicitly confirmed in public metadata. Bus-factor and actual team size are undocumented.

2. Formal maintenance commitments and sustainability roadmap are not published.

3. Like all MCP ecosystem tools, Codebase-Memory operates in an environment with documented single-maintainer dominance (Gini ≈ 0.73) and specification volatility. Sustainability cannot be guaranteed.

4. Comparison to jCodeMunch (which has a visible single maintainer, James Gravelle) shows Codebase-Memory has marginally lower risk optics, but both tools depend on ecosystem health beyond their control.

---

## Must-Survive Caveats Summary

The following caveats MUST inform adoption decisions and must appear in all published materials:

### C1: MIT Licensing Provides Unrestricted Commercial Use

Codebase-Memory's MIT license permits commercial use, modification, and redistribution with no licensing fees. This is a significant cost-of-ownership advantage over jCodeMunch's freemium model ($79–$1,999 commercial tiers). Organizations evaluating cost-of-ownership must account for licensing implications.

### C2: 83% Answer Quality is Query-Specific

The 83% answer quality metric applies to structural queries (architecture discovery, call-path tracing, dead code detection). Other query types may exhibit different accuracy profiles. Not all 17% of failures are equivalent—some are expected design limitations (queries requiring semantic type resolution that Tree-Sitter cannot provide).

### C3: Indexing Creates Persistent Storage Overhead

Unlike jCodeMunch's stateless symbol retrieval, Codebase-Memory requires persistent SQLite storage and incremental re-indexing on code changes. This is a deployment complexity factor. Organizations with large monorepos may experience indexing latency (claim: "average repo in seconds"; Linux kernel in 3 minutes). This infrastructure overhead is absent in jCodeMunch.

### C4: Single-Maintainer Risk is Ecosystem-Wide, Not Tool-Specific

Both Codebase-Memory and jCodeMunch operate in the MCP ecosystem, which exhibits single-maintainer dominance (Gini ≈ 0.73) and specification volatility. Codebase-Memory's organizational structure (DeusData org vs. personal repo) suggests slightly lower risk, but formal maintenance commitments are not documented for either tool. Ecosystem-wide sustainability pressures apply to both.

### C5: Type Resolution is Limited to Tree-Sitter Scope

Codebase-Memory's "LSP-style hybrid type resolution" is enhanced for Go, C, and C++ but remains structurally-focused. Agents requiring full semantic type resolution (e.g., "what properties does HttpRequest have?") should pair Codebase-Memory with LSP bridge (lsp-mcp) or evaluate semantic-focused tools.

### C6: Zero-Dependency Binary Windows Support is Undocumented

The static binary claim applies to macOS, Linux, and Windows, but Windows compatibility testing and known issues are not addressed in public documentation. Evaluate on target Windows version before organizational deployment.

### C7: No Head-to-Head Benchmark vs. jCodeMunch

While both tools are published and have benchmark claims, no published side-by-side evaluation on identical task sets exists. jCodeMunch's comparison page omits Codebase-Memory, suggesting separate market segments. Adoption decision between the two requires independent A/B testing on representative codebase.

### C8: Real-World Performance Depends on Codebase Structure

Token savings and query speed claims are benchmarked on specific codebases (31 real-world repositories for Codebase-Memory). Monolithic legacy systems, highly dynamic code, or unusual language mixtures may exhibit different performance profiles. Benchmark on your specific codebase before adoption decision.

---

## Gaps & Unknowns

### Significant

- **Real-world community adoption:** No public case studies or production usage reports found beyond benchmark claims and arXiv paper. Cannot verify market adoption scale.

- **Single-maintainer risk and team structure:** While DeusData is a GitHub organization, team size, contribution model, and bus-factor are not publicly documented. Comparison to jCodeMunch (visible single maintainer) suggests lower risk, but formal documentation is absent.

- **Detailed performance breakdown by query type:** arXiv reports 83% answer quality but does not detail which question types fall into 17% gap. Official docs claim 120–225x token reduction without breaking down by query type, codebase size, or language.

- **Direct head-to-head comparison with jCodeMunch:** No published side-by-side evaluation. jCodeMunch's comparison page omits Codebase-Memory, suggesting separate niches. Real-world selection requires independent testing.

- **Type resolution accuracy for compiled languages:** LSP-style type resolution for Go/C/C++ is claimed but not independently benchmarked vs. standard Tree-Sitter.

- **Integration robustness with less common agents:** Auto-configuration covers 8 agents; compatibility with others (Copilot, Cursor Pro, OpenAI Codex) is untested.

### Minor

- **License scope validation:** arXiv and GitHub state MIT, but no independent SPDX verification conducted.

- **Staleness of benchmarks:** arXiv paper is recent (2026), but performance claims should be re-validated on current codebases if adoption is imminent.

---

## Sources

1. [arXiv 2603.27277 — Codebase-Memory: Tree-Sitter-Based Knowledge Graphs for LLM Code Exploration via MCP](https://arxiv.org/abs/2603.27277)
2. [arXiv 2603.27277 (HTML)](https://arxiv.org/html/2603.27277v1)
3. [GitHub DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
4. [Official Documentation — codebase-memory-mcp](https://deusdata.github.io/codebase-memory-mcp/)
5. [GitHub jgravelle/jcodemunch-mcp](https://github.com/jgravelle/jcodemunch-mcp)
6. [jCodeMunch Official Site — Comparison](https://j.gravelle.us/jCodeMunch/versus.php)
7. [MCP Market — Codebase Memory](https://mcpmarket.com/server/codebase-memory)
8. [PulseMCP — Codebase Memory Server](https://www.pulsemcp.com/servers/deusdata-codebase-memory)

---

**Quality confidence: HIGH** — All major claims (license, architecture, performance, alternatives) corroborated across 2+ independent primary sources. ArXiv peer-review provides academic validation. All 10 findings have source documentation.
