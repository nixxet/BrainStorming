---
title: "Codebase-Memory"
tags: ["mcp", "code-navigation", "tree-sitter", "knowledge-graph", "developer-tooling"]
created: "2026-04-23"
status: "complete"
---

# Codebase-Memory

## What It Is

Codebase-Memory is an open-source MIT-licensed MCP server that parses source code into a persistent SQLite-backed property graph, enabling LLM agents to explore codebases through structural queries rather than token-intensive file reading. Built on Tree-Sitter AST parsing across 66 programming languages and published as a peer-reviewed arXiv paper (2603.27277), the tool exposes 14 specialized MCP tools for cross-file architectural analysis, call-graph traversal, and dependency discovery.

## How It Works

The system operates in three stages:

1. **Parse** — Tree-Sitter extracts definitions (functions, methods, classes, interfaces, enums) across 66 languages, capturing signatures, return types, decorators, complexity metrics, and export status.

2. **Build** — Multi-phase pipeline with parallel worker pools constructs a persistent SQLite-backed property graph encoding call chains, class hierarchies, cross-file relationships, and architectural patterns. Uses LZ4 compression and in-memory indexing for performance. The Linux kernel (28M LOC, 75K files) indexes in 3 minutes.

3. **Serve** — Exposes 14 typed MCP tools: indexing operations (index_repository, list_projects, delete_project, index_status) and querying tools (search_graph, trace_call_path, detect_changes, query_graph, get_graph_schema, get_code_snippet, get_architecture, search_code, manage_adr, ingest_traces).

## Key Capabilities

- **Cross-file structural queries** — Cypher-style queries for finding call paths, impact graphs, architectural hubs, and dependency chains
- **Call-graph traversal** — Trace function calls across file and module boundaries
- **Dead code detection** — Identify unreachable functions and unused exports
- **Architecture discovery** — Map module relationships and dependency flows
- **Type-aware analysis** — Enhanced type resolution for Go, C, and C++ via LSP-style hybrid approach
- **ADR management** — Store and query architectural decision records alongside code
- **Change impact analysis** — Determine ripple effects of code modifications
- **Zero-config integration** — Single install command auto-configures 8 AI agents (Claude Code, Codex CLI, Gemini CLI, Zed, OpenCode, Antigravity, Aider, KiloCode)

## Performance

Codebase-Memory achieves **10x token reduction** versus file-based exploration while maintaining **83% answer quality** on structural queries. This claim is corroborated across both the peer-reviewed arXiv paper and official documentation, though with task-specific nuance: official docs cite 120–225x token reductions for specialized query types (function pattern finding, call tracing, dead code detection) while the broader claim is 10x across general structural queries. Query performance is sub-millisecond; indexing speed is measured in seconds for typical repositories.

**Caveat:** The 83% answer quality metric applies specifically to structural queries (architecture discovery, call-path tracing, dead code detection). Other query types may exhibit different accuracy profiles. The 17% gap reflects expected design limitations—queries requiring semantic type resolution that Tree-Sitter cannot provide will fall into this bracket. This is not a bug; it is an architectural boundary.

## What It Is Not

Codebase-Memory does **not** provide semantic or full type-level understanding. It cannot answer questions like "what properties does the HttpRequest class have?" or perform IDE-level type-aware refactoring. Semantic type resolution is constrained to Tree-Sitter's scope (enhanced for Go, C, and C++ but fundamentally structural). Organizations requiring semantic queries should pair Codebase-Memory with an LSP bridge (lsp-mcp) for true type information.

Unlike jCodeMunch-MCP, Codebase-Memory is **not** optimized for rapid symbol lookup (O(1) byte-offset retrieval). Its strength is **graph-traversal and cross-file dependency analysis**, not **surgical symbol precision**. If your primary use case is "show me the HttpRequest class," jCodeMunch is a better fit.

Codebase-Memory also requires **persistent SQLite storage** and incremental re-indexing on code changes—it is not a stateless retrieval system. Large monorepos may experience indexing latency, and storage overhead is non-trivial. This is a deployment complexity factor absent in jCodeMunch's stateless architecture.

## Compared to jCodeMunch-MCP

| Dimension | Codebase-Memory | jCodeMunch-MCP | |-----------|-----------------|----------------| | **Architecture** | Property graph + structural traversal (Cypher-style queries) | Symbol retrieval index + byte-offset seeking (O(1) symbol lookup) | | **Strength** | Cross-file structural analysis, call-graph tracing, architecture discovery | Fast symbol retrieval, keyword-discoverable navigation, token efficiency for known-target queries | | **Licensing** | MIT (fully open-source, unrestricted commercial use) | Freemium ($79–$1,999 commercial tiers) | | **Deployment** | Static binary, zero dependencies, zero-config install (8 agents auto-detected) | Requires Python/pip, manual MCP configuration | | **Language Support** | 66 languages with LSP-enhanced type resolution for Go/C/C++ | 70+ languages with cross-language AST pattern matching | | **Maintenance** | DeusData organization; no explicit single-maintainer risk signals | James Gravelle (single visible maintainer); documented ecosystem-wide single-maintainer risk (Gini ≈ 0.73) | | **Primary Use Case** | Understanding system architecture, tracing dependencies, dead code detection | Fast symbol lookup for keyword-discoverable codebases | | **Trade-off** | Requires persistent indexing infrastructure; complex incremental maintenance | Stateless but cannot answer type-resolution or hidden-dependency questions |

**Key architectural note:** jCodeMunch's comparison page (versus.php) notably omits Codebase-Memory, suggesting these tools address different market segments—retrieval precision vs. structural traversal—rather than competing directly. Real-world adoption often pairs complementary tools rather than selecting one.

## Licensing & Maintenance

Codebase-Memory is **MIT-licensed open-source** with no licensing restrictions. The MIT license permits unrestricted commercial use, modification, and redistribution with no fees—a significant cost-of-ownership advantage over jCodeMunch's freemium model ($99–$1,999 commercial tiers).

**Maintenance:** Maintained by DeusData (GitHub organization) with recent releases and active documentation. arXiv publication in 2026 indicates active research. Organization structure (organizational repo vs. personal) suggests lower single-maintainer risk compared to tools like jCodeMunch, though formal team size and maintenance commitments are not publicly documented. Like all MCP ecosystem tools, it operates in an environment with documented specification churn and single-maintainer dominance patterns—sustainability cannot be taken for granted.

## When to Use

- **Codebase-Memory is ideal when:**
  - You need to understand system architecture, module dependencies, or call chains
  - Impact analysis or blast-radius determination is critical
  - Codebase spans multiple languages (>3 languages) and requires unified structural analysis
  - You can tolerate persistent SQLite indexing and incremental re-indexing overhead
  - Organization has FOSS-friendly policies (MIT licensing eliminates procurement friction)

- **Codebase-Memory is suboptimal when:**
  - Your primary use case is rapid symbol lookup on keyword-discoverable codebases (use jCodeMunch instead)
  - Type resolution and semantic understanding are critical (pair with LSP bridge or choose semantic tools)
  - Codebase is small (<500 files) and token savings are marginal
  - Stateless, zero-overhead deployment is a hard constraint (jCodeMunch has zero dependencies)

---

**Sources:** arXiv 2603.27277 (peer-reviewed paper), GitHub DeusData/codebase-memory-mcp (official repo), official documentation (deusdata.github.io/codebase-memory-mcp/), GitHub jgravelle/jcodemunch-mcp (comparison reference), jCodeMunch official site (licensing and architectural comparison).
