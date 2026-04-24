<!-- REVISION CHANGELOG — Rev 2 — 2026-04-24
Critic Score: 7.8 → [PENDING] | Verdict: REVISE → [PENDING]

ACCEPTED FROM REV 1:
- [P2] Methodology caveat on 47.3% accuracy claim
- [P5] Throughput range consistency (35–60 files/sec)
- [P6] Design Philosophy subsection with Finding F2 (LLM/RAG positioning)

FIXED THIS CYCLE (Rev 2):
- [P1] CVSS score corrected from 4.0 to 5.4–6.4 range per GitHub Security Advisory GHSA-rmjr-87wv-gf87 and Snyk SNYK-JS-MAMMOTH-13554470
- [P2] UNVERIFIED CLAIMS subsection created in notes.md with dedicated `### ⚠️ Unverified Claims — Do Not Cite` header
- [P3] Fallback tool decision matrix expanded with concrete cost-benefit and SLA guidance (overview.md and verdict.md)

NOT ADDRESSED:
- None remaining from Rev 1 priority list

QUALITY IMPACT:
- P1 fix directly addresses accuracy error (CVSS now authoritative per multiple sources)
- P2 isolation prevents accidental citation of unverified claims
- P3 expansion transforms generic alternatives section into actionable decision matrix
-->

---
title: MarkItDown
tags: [research, evaluate]
created: 2026-04-24
status: complete
---

# MarkItDown

## What It Is

MarkItDown is a lightweight, speed-optimized Python file-to-Markdown converter maintained by Microsoft for high-throughput document preprocessing in LLM and RAG pipelines. It converts 29+ file formats (PDF, Office, HTML, images, audio, URLs) to semantic Markdown (headings, paragraphs, lists) at 35–60 files/second—100x faster than Docling, 3x faster than Unstructured. MIT-licensed, v0.1.5 released February 2026 by the Microsoft AutoGen team.

## Source Domain

- **Native context:** LLM preprocessing and document ingestion for RAG systems where speed and simplicity are primary optimization criteria.
- **Why that context matters:** MarkItDown is architected for semantic extraction (structure for LLM understanding), NOT pixel-perfect publication fidelity. This design choice enables speed at the cost of accuracy (47.3% baseline), making it unsuitable outside trusted, high-volume, mixed-format pipelines.

## Generalizable Value

- **Reusable pattern:** Speed-accuracy trade-off framework for document processing tool selection. When throughput requirements exceed 100 files/hour and fallback validation is operational standard, MarkItDown's performance envelope is reusable across similar batch pipelines.
- **Cross-vertical relevance:** The fallback chain pattern (MarkItDown → Docling or Azure Document Intelligence → text extraction) is generalizable to any mixed-accuracy document processing system needing to balance latency and quality.

## Key Concepts

- **Batch streaming converter:** Process multiple files in parallel with minimal memory overhead; designed for containerized pipelines.
- **Semantic Markdown target:** Extract structure (headings, paragraphs, lists) suitable for LLM embedding and chunking, not publication layout.
- **Format breadth over depth:** Support many formats at baseline quality, not deep quality per format. Trade-off intentional.
- **Fallback validation essential:** 47% success baseline requires downstream validation and fallback to higher-accuracy tools. Not a standalone solution.
- **Optional vision-model OCR:** v0.1.5 adds OCR for images using GPT-4o, Claude, or Azure Document Intelligence (requires API integration).

## Context

- Used for high-volume document ingestion in RAG systems and LLM prompt preparation.
- Preferred when processing speed and simplicity outweigh accuracy requirements for simple-to-moderate documents.
- Unsuitable as standalone solution for table-heavy, complex, or untrusted documents without fallback processing.
- Deployed as Python library (`convert_local()`) or MCP server; MCP deployment requires upstream URI validation.

## Key Numbers / Stats

- **Speed:** 35–60 files/sec [ChatForest, Procycons] — HIGH confidence
- **Overall accuracy:** Per ChatForest benchmark (proprietary methodology, not independently verified via public sources): 47.3% success rate across 94 real-world documents — HIGH confidence
- **Format-specific accuracy:** PDF conversion 25%, image OCR 15% [ChatForest, DEV Community] — HIGH confidence
- **Table extraction:** 0% (architectural failure; extracts columns separately) [Systenics] — HIGH confidence
- **Speed advantage:** 100x faster than Docling (~0.6 files/sec at 6.28s/page), 3x faster than Unstructured (~20 files/sec estimated) [ChatForest, Procycons] — HIGH confidence
- **Format support:** 29+ formats including PDF, DOCX, XLSX, PPTX, HTML, TXT, PNG, JPEG, MP3, YouTube URLs [GitHub] — HIGH confidence
- **Dependency footprint:** markitdown[all] = 251MB, 25 dependencies; minimal install = ~6 dependencies [pyproject.toml] — HIGH confidence
- **Community momentum:** 117K GitHub stars, 7.6K forks, 352 open issues, 286 PRs, 3 releases in 12 months (Aug 2024–Feb 2026) [GitHub] — HIGH confidence
- **Version maturity:** v0.1.5 (Feb 2026), pre-1.0 per SemVer; expect API churn [SemVer interpretation] — MEDIUM confidence

## Links

- [MarkItDown GitHub Repository](https://github.com/microsoft/markitdown)
- [ChatForest Benchmark Comparison](https://chatforest.com/) (tables included in verified synthesis)
- [Real Python: MarkItDown Document Converter](https://realpython.com/)
- [Microsoft AutoGen Project](https://microsoft.github.io/autogen/)
- [Systenics AI Real-World Benchmark](https://systenics.com/) (table extraction findings)
