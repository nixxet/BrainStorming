---
title: Memsearch
tags: [research, memory-systems, vector-db, agent-framework]
created: 2026-04-14
status: complete
---

# Memsearch

## What It Is

Memsearch is a markdown-first semantic memory system for AI agents, released March 12, 2026 by Zilliz (creators of Milvus). It stores agent memories as human-readable markdown files while using a vector database backend for semantic search. The system combines transparency (markdown enables version control and human inspection) with search capability (hybrid BM25 + vector search via Milvus).

## Key Concepts

- **Markdown-first storage:** Memories persist as `.md` files, enabling human reading, Git version control, and text-based diffs—not opaque database records.
- **Hybrid search:** Combines dense vectors (semantic meaning), BM25 sparse matching (exact keywords), and Reciprocal Rank Fusion (RRF) reranking to improve recall by 10–20% over either method alone.
- **Vector index as derived cache:** Milvus serves as a rebuildable search index derived from markdown files; files are the source of truth.
- **Multiple embedding providers:** Supports OpenAI, Google, Voyage, Ollama, Jina, Mistral, and local ONNX embeddings—avoiding vendor lock-in at the embedding layer.
- **Deduplication via SHA-256:** Hashes content chunks to avoid re-embedding unchanged memories on index reruns.
- **Three deployment tiers:** Milvus Lite (local .db file, default), Milvus Standalone (self-hosted), Zilliz Cloud (managed service).
- **Security note:** Plaintext markdown storage and unencrypted `.milvus.db` files require filesystem-level encryption for deployments handling sensitive data. See verdict for mitigation details.

## Context

Memsearch emerges from a fragmented agent-memory landscape (Mem0, Letta, Zep, LangChain Memory, Cognee, Microsoft Semantic Kernel). Recent research (2025–2026) identifies memory persistence as the limiting factor in agent performance, not raw LLM capability. Memsearch targets developers and teams building long-running agents requiring persistent, inspectable memory.

## Key Numbers / Stats

- **Release:** March 12, 2026 from OpenClaw (Zilliz's internal AI framework)
- **GitHub adoption:** 1.1K stars, 105 forks, MIT licensed (as of April 2026) — [GitHub](https://github.com/zilliztech/memsearch) — MEDIUM confidence (inflated by novelty)
- **Hybrid search recall gain:** 10–20% improvement over vector-only or BM25-only retrieval — [Academic benchmark](https://arxiv.org/html/2508.01405v2) — HIGH confidence
- **Scalability limit (in-memory HNSW):** 14–28M vectors per 256GB server before RAM exhaustion — [Academic analysis](https://arxiv.org/html/2509.25487v2) — HIGH confidence
- **Disk-based alternative (DiskANN):** 1 billion vectors at 95% recall with 5ms latency using NVMe storage — [Academic benchmark](https://arxiv.org/html/2509.25487v2) — HIGH confidence
- **Zilliz funding:** $113M raised; commercial incentive to promote Milvus Cloud — [Crunchbase](https://www.crunchbase.com/organization/zilliz) — MEDIUM confidence

## Links

- [Memsearch GitHub Repository](https://github.com/zilliztech/memsearch)
- [Zilliz Blog: Extracting OpenClaw's Memory System](https://milvus.io/blog/we-extracted-openclaws-memory-system-and-opensourced-it-memsearch.md)
- [Official Documentation](https://zilliztech.github.io/memsearch/)
- [Milvus Lite Limitations](https://milvus.io/docs/milvus_lite.md)
- [OpenClaw GitHub](https://github.com/OpenClaw-Org/openclaw) — Memsearch's source project
