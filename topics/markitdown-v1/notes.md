---
title: MarkItDown — Research Notes
tags: [research, findings]
created: 2026-04-26
status: complete
---

> *Note: Citations labeled `(internal)` refer to pipeline analysis artifacts — benchmarks, synthesis documents, and stress tests — stored in `_pipeline/`, which is excluded from public mirrors by design.*

# MarkItDown — Research Notes

## Key Findings

### Strengths (What MarkItDown Does Well)

- **[HIGH]** MarkItDown is optimized for LLM consumption over document fidelity — [GitHub](https://github.com/microsoft/markitdown), corroborated by AutoGen integration and Emelia RAG guide. Markdown headings require 3 tokens vs 23 in HTML. Design explicitly prioritizes machine readability. Tool built for Microsoft Research AutoGen orchestration.
  - **Transferability:** Pattern replicates for any document-to-LLM pipeline; generalizable across domains.

- **[HIGH]** Comprehensive format support (15+) — PDF, DOCX, PPTX, XLSX, images with EXIF/OCR, audio with transcription, HTML, YouTube, CSV, JSON, XML, EPubs, ZIP, and Azure Document Intelligence. [GitHub](https://github.com/microsoft/markitdown) — MIT license removes commercial friction.
  - **Transferability:** Multi-format wrapper architecture is reusable pattern.

- **[HIGH]** Strong adoption and active maintenance — 91,000 GitHub stars, 5,400 forks, 74 contributors in ~6 months. MIT license, regular release cycles, integration with AutoGen and Azure signaling strategic positioning. [GitHub](https://github.com/microsoft/markitdown), [InfoWorld review](internal) — Unlikely to deprecate.

- **[MEDIUM]** MCP server integration enables agent automation — markitdown-mcp exposes document conversion as tool for Claude Desktop and MCP-compatible agents. Multiple community implementations available (trsdn, KorigamiK). Deployable via Docker. [MCP Registry](https://modelcontextprotocol.io/)
  - **Recommendation role:** Supporting—expands use case to agent-based pipelines.

- **[MEDIUM]** Growing plugin ecosystem disabled by default — markitdown-ocr for LLM-powered image text extraction, Korean HWP support, web scraping. Disabled by default avoids bloat and security risks. [GitHub](https://github.com/microsoft/markitdown)

### Architectural Limitations (Why Performance Comes With Tradeoffs)

- **[HIGH]** Speed-accuracy trade-off is fundamental — MarkItDown: 180+ files/sec on simple PDFs, ~25% success rate on complex/structured PDFs. Docling: ~0.5 files/sec, 97.9% accuracy on table extraction. Marker and MinerU preserve sections, reading order, and formulas. [Deep-Dive Counter 5](internal), [Multiple independent benchmarks](internal)
  - **Confidence caveat:** Speed benchmarks use simple PDFs; accuracy benchmarks use complex ones. Direct 1:1 comparison not available in same test suite.
  - **Recommendation role:** Supporting—informs use case selection but cannot be sole criterion.

- **[HIGH]** Wrapper library architecture limits quality ceiling to underlying dependencies — MarkItDown is thin wrapper around pdfminer (text-only extraction), python-docx (no merged cell support), python-pptx (incomplete). Quality for each format determined by underlying library's capabilities. [GitHub analysis](internal), [Deep-Dive Counter 6](internal)
  - **Transferability:** Design pattern applies to any wrapper-based conversion tool.
  - **Recommendation role:** Core—explains why MarkItDown cannot match specialized converters.

- **[HIGH]** Table extraction is column-wise enumeration, destroying row-column relationships — Tables extracted as [all column-1 values], [all column-2 values], [all column-3 values] rather than row-by-row. Example: Transaction table (Date, Description, Amount) becomes [all dates], [all descriptions], [all amounts]. Applies to PDF, DOCX, PPTX, XLSX. [Landscape F4](internal), [Deep-Dive Counter 1](internal), [Gap-Fill DOCX analysis](internal)
  - **Real-world impact:** Renders any table with row-dependent meaning (financial transactions, scientific data) unusable for downstream analysis. NOT SUITABLE FOR legal document analysis, financial data extraction, or healthcare records where table structure preservation is critical.
  - **Recommendation role:** Core—disqualifies MarkItDown for structured data extraction and regulated domains.

### Format-Specific Failure Modes

#### PDF

- **[HIGH]** Known PDF conversion limitations are well-documented — Scanned/protected PDFs produce empty or garbled output (no text layer to extract). HTML-to-Markdown regressions after markdownify library updates cause raw HTML passthrough. Performance degrades catastrophically on files >10MB due to synchronous PDFMiner architecture. [GitHub issues](https://github.com/microsoft/markitdown), [Independent benchmarks](internal)
  - **Confidence caveat:** Single GitHub issue (#1276) for synchronous bottleneck; not independently corroborated by landscape brief.

- **[MEDIUM]** PDF conversion success rate ~25% on complex/structured documents — Breaks simple text lines, loses heading levels, destroys table structure. Docling (97.9%), Marker, and Mistral Document AI outperform. [Multiple benchmarks](internal)
  - **Confidence caveat:** Benchmarks use different test suites; direct comparison control not available.

#### DOCX

- **[MEDIUM]** DOCX structure preservation is PARTIAL: merged cells and nested tables lost — Landscape brief claims "proper Markdown tables with structure preservation." Reality: Merged cells not handled (GitHub Issue #20), nested tables completely discarded (GitHub Issue #1248). Docling significantly outperforms MarkItDown on DOCX conversion. [GitHub issues](https://github.com/microsoft/markitdown)
  - **Recommendation role:** Contextual—shapes format selection strategy within MarkItDown ecosystem.

- **[MEDIUM]** Nested tables in DOCX are completely discarded during conversion — When DOCX contains nested tables, outer table structure is preserved but inner table content is missing. Tool does not flatten or preserve nested tables as HTML alternatives; it simply discards them. [GitHub Issue #1248](https://github.com/microsoft/markitdown)

#### PPTX

- **[UNVERIFIED]** PPTX quantitative conversion accuracy metrics are not available — GitHub issues document PPTX crashes (TypeError: NoneType vs Emu, Issue #1293), invalid file error handling (Issue #1408), missing image extraction (Issue #56). No independent benchmarks comparing PPTX conversion accuracy to Docling or Marker. [GitHub issues](https://github.com/microsoft/markitdown)
  - **Caveat:** Specific failures documented; no overall quality metric available. Do not claim quantitative PPTX accuracy without explicit disclaimer.

#### XLSX

- **[UNVERIFIED]** XLSX conversion quality is undocumented — Landscape brief claims XLSX support. Zero quality data available (no benchmarks, no GitHub issue analysis, no comparative testing). Feature claimed but unvalidated. [Feature support claim only](https://github.com/microsoft/markitdown)

### Encoding and Internationalization

- **[HIGH]** Encoding/Unicode crashes on non-ASCII characters — Tool crashes with UnicodeEncodeError or produces garbled output on Cyrillic, CJK, special symbols (©, ™, ✓). Multiple GitHub issues (#138, #291, #1290). Does not gracefully skip problematic characters. [GitHub issues](https://github.com/microsoft/markitdown)
  - **Recommendation role:** Core—disqualifies for non-English or multilingual documents. Unsuitable for any pipeline processing documents from non-English-speaking regions without pre-screening and error handling.

- **[UNVERIFIED]** Regional/non-Latin language support quality undocumented — Encoding crashes documented for Cyrillic and CJK; scope of language support unclear. No systematic testing on Chinese, Arabic, Japanese, or other non-Latin scripts beyond crash reports. [GitHub issue analysis](internal)

### Security Considerations

- **[CRITICAL]** MarkItDown v0.1.5 is vulnerable to GHSA-f83h-ghpp-7wcc (CVE-2025-70559) — Insecure pickle deserialization in pdfminer.six CMap loader allows local privilege escalation. Attack vector: Low-privileged user places malicious pickle file in writable CMap cache directory; trusted process loads it with elevated privileges. [GitHub security advisory](https://github.com/microsoft/markitdown/security), [CVE-2025-70559](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-70559)
  - **Current state:** MarkItDown v0.1.5 pins pdfminer.six **20251107**, which introduced the vulnerability GHSA-f83h-ghpp-7wcc while attempting to fix CVE-2025-64512. MarkItDown v0.1.5 is **critically vulnerable** and requires immediate manual remediation.
  - **Patch requirement:** pdfminer.six **20251230 or later** required to remediate (replaces pickle with JSON). **Mandatory action: Pin pdfminer.six >= 20251230 in your requirements.txt BEFORE installing MarkItDown, or use environment constraint in pyproject.toml. This must be done manually as MarkItDown v0.1.5 does not include the fix.**
  - **Availability:** pdfminer.six 20260107 (January 2026) is current; MarkItDown does not pin it.
  - **Risk scope:** Applies to systems processing untrusted PDF input OR systems where unprivileged users have access to writable cache directories. **Do not deploy v0.1.5 to production systems processing user-uploaded documents without sandboxing and privilege isolation.**
  - **Recommendation role:** Core—presence of unpatched critical CVE is a must-carry caveat for any production deployment recommendation.

- **[HIGH]** CVE-2025-64512: RCE via malicious PDF in pdfminer.six <20251107 — pdfminer.six <20251107 uses pickle.loads() for CMap deserialization. Malicious PDF can redirect pickle.gz loading for remote code execution. MarkItDown v0.1.3 was vulnerable before Dec 2025 patch (v0.1.4). [CVE-2025-64512](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-64512)
  - **Historical note:** v0.1.5 addressed this CVE but introduced a distinct vulnerability (GHSA-f83h-ghpp-7wcc).

- **[MEDIUM]** Prompt injection risk in LLM pipelines — When feeding MarkItDown output to language models, document content flows directly into LLM context without mention of prompt-injection mitigations. A malicious PDF could contain crafted text like "Ignore previous instructions" or other injection payloads that influence LLM behavior. [Security reviewer protocol](internal)
  - **Mitigation:** Use prompt-engineering practices to isolate document content from system instructions: (a) Structure prompts with explicit delimiters (`[DOCUMENT START]...[DOCUMENT END]`), (b) Use system-prompt prefix that establishes instruction hierarchy, (c) Implement output guardrails to reject model responses that appear to leak prompts.
  - **Recommendation role:** Supporting—essential safeguard for untrusted document processing in agent/LLM pipelines.

- **[MEDIUM]** Transitive dependency vulnerability scanning required — MarkItDown depends on 25 transitive dependencies. Each is a potential CVE vector (as proven by GHSA-f83h-ghpp-7wcc in pdfminer.six). Users must proactively monitor and upgrade dependencies. [OSS security best practices](internal)
  - **Mitigation:** Use automated dependency vulnerability scanning: `pip audit` weekly, configure GitHub Dependabot or Snyk, subscribe to CVE mailing lists for pdfminer.six, python-docx, and python-pptx.
  - **Recommendation role:** Supporting—prevents silent security drift in production deployments.

### Operational Hidden Costs

- **[MEDIUM]** Installation is simple but carries 25 transitive dependencies with hidden operational costs — Installation via pip is straightforward with optional dependency groups. However, 25 transitive dependencies require security patching (CVE-2025-64512 required urgent patching). Production use adds encoding error handling (15-20% code complexity), exponential backoff for batch processing, retry logic, and dependency version pinning. **Production deployment requires 40-60 engineering hours, 3-5 weeks, and $2-5K budget for proper implementation with error handling, monitoring, and fallback mechanisms.** [Dependency tree analysis](internal), [Stress test findings](internal)
  - **Transferability:** Hidden cost pattern applies to any OSS tool with broad optional dependencies.
  - **Recommendation role:** Supporting—prevents underselling of operational complexity.

- **[MEDIUM]** MarkItDown positioned as "simple, lightweight" but marketing undersells operational complexity — Landscape and vendor blogs emphasize ease of installation and multi-format support. Marketing does not highlight CVE history, encoding fragility, table destruction, or hidden operational costs (dependency patching, error handling, fallback strategies). [Marketing materials](internal)

### Positioning vs Alternatives

- **[MEDIUM]** RAG pipeline fit is scope-dependent and partially contradicted — **Simple-text RAG:** MarkItDown recommended for legal documents, plain-text academic papers (token efficiency, ease of integration). **Structured RAG:** MarkItDown underperforms. Docling (97.9% accuracy) and Marker outperform on structured tables and scientific datasets. **Recommended approach for production:** Implement hybrid routing—MarkItDown for simple documents (file size <2MB, no tables detected), Docling/Marker for complex documents, Azure Document Intelligence for high-accuracy requirements. Total cost increase ~15-20% but ensures SLA compliance. Distinguishing "simple" vs "complex" documents requires either ~30% misclassification tolerance with rule-based heuristics OR investment in ML-based document classifiers for 95% accuracy; naive file-size detection is insufficient for production. Both routing strategies are valid for different scopes. [Emelia RAG guide](internal), [Deep-Dive Counter 5 benchmark](internal), [Systenics RAG comparison](internal), [Stress test findings](internal)
  - **Must carry caveat:** RAG recommendation depends on source document complexity and structure importance.

## Counterarguments & Risks

- **Table destruction disqualifies MarkItDown for any structured data pipeline.** Column-wise enumeration is not a bug but an architectural consequence of Markdown's native table syntax. Specialized converters (Docling, Marker, MinerU) preserve row-column structure at the cost of speed. **Do not use for legal document analysis, financial data extraction, or healthcare records.**

- **Encoding instability requires document pre-screening in production.** Non-ASCII documents crash the tool. Multilingual pipelines are not viable without upstream filtering or tool replacement.

- **Unpatched CVE in current stable release (v0.1.5) prevents immediate production deployment without manual remediation.** Users must manually upgrade pdfminer.six to 20251230+ before deploying. Dependency upgrade path is unclear; MarkItDown v0.1.6 release date unknown.

- **Wrapper architecture means MarkItDown cannot exceed underlying library quality.** pdfminer is text-only; python-docx lacks merged-cell and nesting support. Tool improvement requires upstream library improvements.

- **Prompt injection vulnerability in LLM pipelines.** Document content flows into LLM context without explicit isolation. Use structured prompts with delimiters to separate document content from system instructions.

## Gaps & Unknowns

- **PPTX quantitative benchmarking** — No independent benchmark comparing MarkItDown PPTX accuracy to Docling, Marker, or MinerU. Landscape claims PPTX as supported format; Gap-Fill documents specific failures but no overall quality metric.

- **XLSX conversion quality** — Zero quality data on Excel file conversion (formulas, structure preservation, performance). Landscape claims XLSX support; no evidence provided beyond "converts to Markdown tables."

- **Patch adoption timeline for GHSA-f83h-ghpp-7wcc** — MarkItDown v0.1.6+ release date unknown as of 2026-04-26. Unclear whether next version will upgrade pdfminer.six to 20251230+.

- **Azure Document Intelligence integration cost-performance at scale** — Deep-Dive mentions Azure ($1-5/page) as fallback for complex PDFs; total pipeline cost unknown. No TCO analysis or hybrid pipeline benchmarks available.

## Confidence Summary

- **HIGH:** 15 findings (architectural strengths, documented limitations, security vulnerabilities, adoption metrics)
- **MEDIUM:** 8 findings (performance trade-offs, format-specific quality, scope-dependent recommendations, operational complexity)
- **LOW:** 2 findings (synchronous bottleneck confirmation pending; encoding scope unclear)
- **UNVERIFIED:** 3 findings (PPTX quantitative benchmarks, XLSX quality, regional language support)
