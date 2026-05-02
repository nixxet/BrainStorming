---
title: MarkItDown
tags: [research, document-conversion, llm-preprocessing]
created: 2026-04-26
status: complete
---

# MarkItDown

## What It Is

MarkItDown is a lightweight, MIT-licensed document-to-Markdown converter maintained by Microsoft that prioritizes LLM consumption over document fidelity. It extracts text and structure from 15+ file formats (PDF, DOCX, PPTX, XLSX, HTML, images, audio, and more) and outputs native Markdown—a format language models natively understand. The tool achieves genuine speed advantages (180+ files per second on simple documents) and 90% token savings compared to HTML equivalents.

**Security note:** A live dependency check on 2026-05-02 found MarkItDown v0.1.5 declares `pdfminer.six>=20251230` and `mammoth~=1.11.0`, so the earlier "unpatched v0.1.5" caveat is stale. Before production deployment, verify the installed environment actually resolves to `pdfminer.six>=20251230` and `mammoth>=1.11.0`, and keep vulnerability scanning enabled for transitive dependencies.

## Source Domain

- **Native context:** Language model preprocessing pipelines and AutoGen multi-agent orchestration (Microsoft Research)
- **Why that context matters:** MarkItDown's design explicitly sacrifices document structure preservation for speed and LLM comprehension. It is not a general-purpose document converter.

## Generalizable Value

- **Reusable pattern:** Text extraction optimized for downstream AI consumption. The speed-accuracy trade-off (100x faster, but ~25% success on complex PDFs) generalizes to any wrapper-based conversion tool balancing throughput against fidelity.
- **Cross-vertical relevance:** Any organization ingesting documents into language models faces the same trade-off. The architectural constraints (wrapper library limitations, encoding fragility, table destruction) are not domain-specific but structural.

## Key Concepts

- **Text extraction vs document conversion:** MarkItDown is a text extractor optimized for LLM input, not a general converter (like Docling or Marker) that preserves layout and structure for human consumption.
- **LLM-optimized Markdown:** Native Markdown format requires 3 tokens per heading vs 23 in HTML, and language models understand Markdown structure natively.
- **Wrapper library architecture:** MarkItDown wraps existing libraries (pdfminer for PDF, python-docx for DOCX, python-pptx for PPTX). Quality ceiling is determined by underlying library limitations.
- **Speed-accuracy trade-off:** Achieves 100x performance over Docling by extracting text-only without layout preservation; complex PDFs see ~25% success rate vs Docling's 97.9% accuracy.
- **Column-wise table enumeration:** Tables are extracted as sequential columns rather than rows—[all dates], [all amounts], [all descriptions]—destroying row-context relationships. Applies to PDF, DOCX, PPTX, XLSX.
- **Transitive dependency risk:** 25 dependencies expose the tool to security vulnerabilities that the vendor alone cannot patch. Current package metadata declares patched floors for the pdfminer.six and mammoth issues checked on 2026-05-02, but resolved environments still require verification.

## Context

- Integrates with AutoGen and Azure Document Intelligence for fallback on complex documents
- Available as MCP server (Claude Desktop, agent automation)
- Growing plugin ecosystem (OCR, Korean HWP support, web scraping)
- Strong adoption: ~119,300 GitHub stars and 74+ contributors by 2026-05-02

## Key Numbers / Stats

- **GitHub adoption:** ~119,300 stars and ~7,900 forks by live GitHub API check on 2026-05-02 [GitHub](https://github.com/microsoft/markitdown) — HIGH confidence
- **Performance throughput:** 180+ files/second on simple PDFs; Docling ~0.5 files/second [Deep-Dive benchmark](internal) — MEDIUM confidence (speed/accuracy not directly comparable)
- **Token efficiency:** 90% reduction in token count vs HTML equivalents [Multiple independent sources] — HIGH confidence
- **Accuracy on complex PDFs:** ~25% success rate (defined as lossless heading levels, table structure, and text boundaries) [Deep-Dive Counter 5 benchmark](internal) — MEDIUM confidence
- **Table extraction failure rate:** 100% on column-wise enumeration; applies to all formats (PDF, DOCX, PPTX, XLSX) [Multiple benchmarks and GitHub issues] — HIGH confidence
- **Dependency count:** 25 transitive dependencies requiring security patching [Dependency tree analysis] — HIGH confidence

## Links

- [MarkItDown GitHub](https://github.com/microsoft/markitdown)
- [MarkItDown on MCP Registry](https://modelcontextprotocol.io/)
- [AutoGen Integration](https://microsoft.github.io/autogen/)
