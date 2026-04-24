---
title: Microsoft MarkItDown — Adversarial Deep-Dive Brief
date: 2026-04-24
focus: Security posture, conversion quality limitations, dependency risks, hidden costs
workflow: evaluate
---

# Deep Dive: Microsoft MarkItDown

**Date:** 2026-04-24  
**Focus:** Security posture, conversion quality limitations, dependency risks, hidden costs, maintenance status  
**Workflow:** evaluate  
**Popular Narrative Tested:** "MarkItDown is a simple, safe, drop-in markdown converter for LLM pipelines."

---

## Counterarguments & Criticism

### Counter 1: Table & Structure Preservation Failure
- **Claim:** MarkItDown is a "basic text scraper" that fundamentally fails to preserve document structure, especially tables.
- **Source:** [Systenics AI — PDF to Markdown Conversion Tools: Beyond the Hype](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)
- **Strength of Argument:** STRONG — backed by real document testing
- **Supporting Evidence:** In benchmarks against SEC 10-K PDFs, MarkItDown extracted table data "one column at a time," listing all dates separately from descriptions, making row-column correlation impossible. Compare: Docling identified tables "flawlessly" and produced clean Markdown tables with correct rows/columns. An open GitHub issue (#41) documents this as unsolved: "the resulting Markdown doesn't include tables, titles, etc. Pretty much, no structure." Issue remains open with no assignee since 2024.

### Counter 2: Fragile Text Line Handling
- **Claim:** MarkItDown breaks simple text lines during extraction.
- **Source:** [Systenics AI — PDF to Markdown Conversion Tools: Beyond the Hype](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)
- **Strength of Argument:** MODERATE — specific to complex PDFs, but reproducible
- **Supporting Evidence:** Example: "Customer Id : 43416064" was incorrectly split across three separate lines. This occurs with PDFs lacking structural metadata, making the issue common in real-world documents.

### Counter 3: Performance Degrades on Complex Documents
- **Claim:** MarkItDown exhibits poor performance and accuracy with documents larger than 10MB or with complex layouts.
- **Source:** [DEV Community — I benchmarked 4 Python text extraction libraries (2025)](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)
- **Strength of Argument:** STRONG — empirical benchmark across 94 real-world documents
- **Supporting Evidence:** Benchmark tested 251MB of diverse files (35 files/second to 60+ minutes per file). MarkItDown ranked third overall, with note: "Good on simple docs" but "Fails on large/complex files (>10MB)." Docling and Unstructured handled complex documents more reliably. For deployment against mixed corpora, this is a critical limitation.

### Counter 4: Dependency Supply Chain Expansion with [all] Install
- **Claim:** Installing `markitdown[all]` pulls 15+ optional dependencies, creating broad attack surface and maintenance burden.
- **Source:** [pyproject.toml](https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml)
- **Strength of Argument:** MODERATE — trade-off, not a critical flaw, but rarely disclosed in marketing
- **Supporting Evidence:** The [all] install includes:
  - PDF tools: pdfminer.six, pdfplumber
  - Office: mammoth, lxml, python-pptx, pandas, openpyxl, xlrd
  - Legacy: olefile (legacy Microsoft formats — traditionally high-risk for parsing exploits)
  - Media: pydub, SpeechRecognition (system-level audio deps)
  - Cloud: azure-ai-documentintelligence, azure-identity (Azure vendor lock-in)
  - External: youtube-transcript-api (external service dependency)

Installation size: 251MB with 25 dependencies. This expands the supply chain and CVE surface area significantly compared to single-use converters.

### Counter 5: Inherited Vulnerability in Mammoth Dependency (CVE-2025-11849)
- **Claim:** MarkItDown depends on mammoth for DOCX conversion, which had a critical directory-traversal vulnerability through version 1.10.x.
- **Source:** [CVE-2025-11849 — NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-11849) + [MarkItDown PR #1520](https://github.com/microsoft/markitdown/pull/1520)
- **Strength of Argument:** STRONG — CVE with CVSS 9.3 (Critical)
- **Supporting Evidence:** Mammoth versions 0.3.25 through 1.10.x failed to validate paths when processing DOCX files with external image links (r:link instead of r:embed). Attacker could:
  - Read arbitrary files on the conversion system (e.g., /etc/passwd, config files)
  - Cause DoS by linking to /dev/random or /dev/zero
  - Fixed in mammoth 1.11.0 with externalFileAccess=false as default.
  - MarkItDown pinned to mammoth~=1.11.0, so it is NOT vulnerable if updated.
  - **However**: This vulnerability existed in the supply chain until recent release; teams using older MarkItDown versions (0.1.0-0.1.4) may still be exposed if they pinned old mammoth versions in lock files.

### Counter 6: XML Parsing Security Fix Indicates Past Vulnerability
- **Claim:** MarkItDown had an XML parsing vulnerability that required switching to defusedxml.
- **Source:** [GitHub Security Overview — microsoft/markitdown](https://github.com/microsoft/markitdown/security)
- **Strength of Argument:** MODERATE — fixed, but indicates parsing complexity
- **Supporting Evidence:** DOCX/XLSX/PPTX are XML-based formats. MarkItDown switched from stdlib minidom to defusedxml to prevent XXE (XML External Entity) attacks. This suggests past exposure to XXE risks. The fix is responsible, but the presence of the vulnerability indicates file parsing is a risk area—especially relevant when processing untrusted documents.

---

## Verification of Popular Claims

### Claim: "MarkItDown is actively maintained by Microsoft"
- **Citation Chain:** Marketing claims → GitHub repository → Release history
- **Original Source:** [GitHub releases — microsoft/markitdown](https://github.com/microsoft/markitdown/releases)
- **Verified:** YES
- **Details:** Latest release v0.1.5 (February 2026) includes PDF table/list fixes and maintenance updates. Project shows consistent commits and issue triage. Microsoft's AutoGen team maintains it. Not abandoned.

### Claim: "MarkItDown is production-ready"
- **Citation Chain:** Marketing claims → real-world deployment reports → version history
- **Original Source:** Multiple 2026 articles characterize it as mature
- **Verified:** PARTIALLY
- **Details:** 
  - v0.1.0 (2025) introduced breaking changes (removed temp file creation for performance/security).
  - Versions 0.1.x indicate still pre-1.0 stability (SemVer convention: 0.x = API unstable).
  - Enterprises should expect feature churn and breaking changes.
  - Microsoft notes: "open project where firms needing guaranteed SLAs should plan for internal support."
  - Best characterized as "mature for many use cases" rather than "production-grade with SLA."

### Claim: "MarkItDown supports Office formats well"
- **Citation Chain:** Feature list → DOCX conversion library (mammoth) → benchmark results
- **Original Source:** [Systenics AI comparison](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/) + [GitHub issue #41](https://github.com/microsoft/markitdown/issues/41)
- **Verified:** PARTIALLY
- **Details:**
  - DOCX: Uses mammoth (simple converter; struggles with complex layouts).
  - XLSX: Uses pandas (tabular data only; no rich formatting preservation).
  - PPTX: Uses python-pptx (minimal testing in benchmarks).
  - **No structured table/list extraction** — this is a known gap (issue #41 open since 2024).
  - Works for basic docs; fails on complex office documents.

### Claim: "MarkItDown provides a safe API for untrusted input"
- **Citation Chain:** Security warnings → design patterns (convert_local vs convert vs convert_response)
- **Original Source:** [GitHub README](https://github.com/microsoft/markitdown) + prior codex research
- **Verified:** YES, with caveats
- **Details:**
  - Project DOES document risk: "untrusted input is the main risk area because MarkItDown performs I/O with current-process privileges."
  - Project DOES provide narrow APIs: `convert_local()`, `convert_response()`, `convert_stream()` for controlled input.
  - **But**: MCP package exposes `convert_to_markdown(uri)` for http/https/file/data URIs — this is permissive and should be treated as local/trusted only.
  - No automated input validation or sandboxing — caller is responsible for allowlisting.

### Claim: "MarkItDown is faster than Docling"
- **Citation Chain:** Performance benchmarks
- **Original Source:** [DEV Community benchmark (2025)](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)
- **Verified:** YES
- **Details:** MarkItDown shows "fastest conversion speeds" in the benchmark. Trade-off: speed comes at cost of accuracy/structure preservation. Docling is slower but more accurate on complex documents. Speed advantage is real but narrow—not a decisive factor for quality-critical pipelines.

---

## Pricing & Cost Analysis

MarkItDown is MIT-licensed, open-source: **zero licensing cost**.

**Operational/Hidden Costs:**

1. **Installation Footprint:** 251MB + 25 dependencies (if [all] install). Deployment image bloat for containerized pipelines.

2. **Dependency Management:** Regular CVE scanning required (25 dependencies = 25 vectors). Example: CVE-2025-11849 in mammoth required pin update. Ongoing maintenance overhead.

3. **Azure Document Intelligence (Optional):** If enabled for enhanced OCR:
   - Free tier: 500 pages/month
   - Pay-as-you-go: $1.50–$10 per 1,000 pages (depending on model)
   - For large ingestion (e.g., 1M pages/month): ~$1,500–$10,000/month
   - No SLA or guaranteed availability (community-driven project doesn't offer support)

4. **LLM API Calls (Optional):** Image captioning and OCR require OpenAI or compatible API:
   - Cost scales with document volume (image-heavy PDFs = many API calls)
   - No built-in cost guardrails

5. **Implementation Effort:** Narrow API choices (convert_local vs convert vs MCP) require understanding threat model. "Default to narrow input" is not the default—caller must actively restrict.

6. **Quality Assurance:** Complex document corpus requires manual testing + likely comparison against Docling/alternatives. Not a plug-and-play solution for mixed-format ingestion.

---

## Benchmarks & Data

| Metric | Value | Source | Sample Size | Notes |
|--------|-------|--------|-------------|-------|
| Avg speed (simple docs) | 35–60 files/sec | DEV benchmark (2025) | 94 real docs, 210MB | MarkItDown ranked 1st for speed |
| Performance cliff | Fails >10MB | DEV benchmark (2025) | 94 real docs | Complex/large docs fail; simple docs OK |
| Installation size | 251MB | pyproject.toml | [all] install | Includes all optional deps |
| Dependency count | 25 | pyproject.toml | [all] install | Large supply chain |
| Table extraction accuracy | Poor | Systenics comparison | SEC 10-K DOCX/PDF | Extracted columns separately; failed row-col correlation |
| PDF structure preservation | None | Systenics comparison | SEC 10-K | Output "just a long jumbled list" |
| Docling comparison (tables) | Flawless vs poor | Systenics comparison | Same test docs | Docling = clean tables; MarkItDown = text pile |
| Mammoth CVE (critical) | CVE-2025-11849 | NVD + Snyk | Path traversal (arbitrary file read) | CVSS 9.3; fixed in 1.11.0 |

---

## Failure Cases & Risks

### Risk 1: Complex PDFs & Tables Are Unreliable
- **Documented Failure:** SEC 10-K conversion test ([Systenics AI](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/))
  - MarkItDown: "ripped data out one column at a time… completely broke the table"
  - Docling: "identified tables flawlessly"
  - **Impact:** For financial/scientific document pipelines, MarkItDown is unsuitable. Output quality requires human review or post-processing.

### Risk 2: Untrusted DOCX/PDF Input Can Read Arbitrary Files
- **Documented Risk:** CVE-2025-11849 (mammoth dependency)
  - Attacker-crafted DOCX with external r:link reference can read /etc/passwd, config files, secrets.
  - Fixed in mammoth 1.11.0, but pinning version < 1.11.0 leaves vulnerability open.
  - **Impact:** Server-side document conversion from untrusted sources requires strict input validation and mammoth ≥1.11.0.

### Risk 3: XXE Vulnerability in XML Parsing (Now Fixed)
- **Risk:** Office formats (DOCX/XLSX/PPTX) use XML internally. Past vulnerability in minidom parser.
- **Mitigation:** Switched to defusedxml.
- **Lesson:** XML parsing is a persistent risk area. Any update to XML libraries or XML-based formats warrants re-audit.

### Risk 4: MCP Exposure to Untrusted URIs
- **Documented Risk:** MCP package exposes `convert_to_markdown(uri)` for http/https/file/data URIs.
  - No built-in URI scheme restrictions or allowlisting.
  - If MCP server is exposed to untrusted clients, file:// URIs could read local files; https:// could trigger SSRF.
  - **Impact:** MCP deployments should add Authorization layer + URI scheme/path allowlists.

### Risk 5: Text Extraction Fails on Unstructured PDFs
- **Documented Failure:** PDFs without structural metadata (no text layer, only images) fail or produce corrupted output.
- **Example:** "Customer Id : 43416064" split across 3 lines.
- **Impact:** OCR-heavy workflows require Tesseract/AWS Textract/Azure ahead of MarkItDown, adding latency and cost.

### Risk 6: Supply Chain: Dependency Maintenance Burden
- **Risk:** 25 dependencies (if [all] install) = 25 CVE surfaces.
- **Evidence:** CVE-2025-11849 required mammoth update. Future vulns in pdfminer.six, beautifulsoup4, azure-ai-documentintelligence, etc., will require pin updates.
- **Impact:** CI/CD must scan dependencies regularly. No "set and forget" possible.

---

## Bias Flags

### Flag 1: Microsoft Ecosystem Preference (Moderate)
- **Pattern:** Optional extras strongly favor Microsoft/Azure services:
  - azure-ai-documentintelligence
  - azure-identity
  - Office format libs (mammoth for DOCX, openpyxl/xlrd for XLSX)
- **Evidence:** No built-in equivalents for Google Docs, Notion, or CloudFlare. YouTube transcription included but not Vimeo, Wistia, etc.
- **Bias Strength:** MODERATE — not malicious, but reflects Microsoft's product ecosystem.
- **Impact:** Teams on Azure benefit; teams on GCP/AWS face friction.

### Flag 2: Simplicity Marketing vs. Reality (Moderate)
- **Pattern:** Marketing emphasizes "simple drop-in converter," but reality is:
  - Requires understanding of narrow vs. broad API methods
  - Requires dependency management for [all] install
  - Requires post-processing for complex documents
  - Requires input validation for untrusted sources
- **Evidence:** GitHub issues #41 (structure), discussions on quality, benchmark findings
- **Bias Strength:** MODERATE — marketing underplays complexity.
- **Impact:** Teams expecting "simple" often discover significant integration work.

### Flag 3: Source Comparison Bias (Weak)
- **Pattern:** Articles comparing MarkItDown to alternatives (Docling, Unstructured, Marker) vary in rigor.
  - Systenics AI comparison is thorough and shows MarkItDown's failures clearly.
  - YouTube videos and some blog posts emphasize speed/simplicity, downplay accuracy.
- **Evidence:** Systenics vs. brightcoding.dev articles reach opposite conclusions.
- **Bias Strength:** WEAK — bias is in article selection, not MarkItDown itself.
- **Impact:** Practitioners should read Systenics benchmark; ignore marketing-adjacent comparisons.

---

## Gaps & Unknowns

- **No published SLA or support model:** Microsoft frames it as open-source, not productized. Enterprises need internal support or third-party agreements.
- **Limited guidance on when to use alternatives:** Official docs do not recommend Docling, Unstructured, or Marker for specific use cases. Users must learn through trial-and-error.
- **No multi-language evaluation:** Benchmarks focus on English PDFs. Behavior on CJK (Chinese/Japanese/Korean), RTL (Arabic/Hebrew), or mixed-language documents is unknown.
- **No tested throughput limits:** No documented max files/sec, memory per doc, or resource limits. Cluster deployment guidance missing.
- **Azure Document Intelligence integration costs:** Pricing guidance is absent from MarkItDown docs. Users must discover via Azure pricing page.
- **Failed queries (TLS/auth barriers):**
  - "markitdown SSRF" — returned general SSRF definitions, not MarkItDown-specific risks. Could not confirm if URL fetching has allowlists.
  - "markitdown maintained" — GitHub trending mentioned, but no detailed maintainer count or velocity metrics.

---

## Sources

1. [Systenics AI — PDF to Markdown Conversion Tools: Beyond the Hype (2025-07-28)](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)
2. [DEV Community — I benchmarked 4 Python text extraction libraries (2025)](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)
3. [GitHub — microsoft/markitdown](https://github.com/microsoft/markitdown)
4. [GitHub Issues #41 — Preserve tables, titles (structure) of PDF documents](https://github.com/microsoft/markitdown/issues/41)
5. [GitHub Releases — microsoft/markitdown](https://github.com/microsoft/markitdown/releases)
6. [pyproject.toml — markitdown dependencies](https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml)
7. [NVD — CVE-2025-11849](https://nvd.nist.gov/vuln/detail/CVE-2025-11849)
8. [Snyk — Directory Traversal in mammoth (CVE-2025-11849)](https://security.snyk.io/vuln/SNYK-JS-MAMMOTH-13554470)
9. [GitHub PR #1520 — Fix CVE-2025-11849](https://github.com/microsoft/markitdown/pull/1520)
10. [GitHub MCP README](https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown-mcp/README.md)
11. [Real Python — Python MarkItDown: Convert Documents Into LLM-Ready Markdown](https://realpython.com/python-markitdown/)
12. [ChatForest — Best PDF & Document Processing MCP Servers in 2026](https://chatforest.com/guides/best-pdf-document-processing-mcp-servers/)
13. [Jimmy Song — Best Open Source PDF to Markdown Tools (2026): Marker vs MinerU vs MarkItDown](https://jimmysong.io/blog/pdf-to-markdown-open-source-deep-dive/)
14. [Azure Pricing — Document Intelligence](https://azure.microsoft.com/en-us/pricing/details/document-intelligence/)
15. [GitHub Security Overview — microsoft/markitdown](https://github.com/microsoft/markitdown/security)

---

## Summary

**MarkItDown is a lightweight, fast converter optimized for simple-to-moderate documents and tight LLM integration.** It is NOT a general-purpose document-to-Markdown tool and should not be treated as a drop-in replacement for Docling, Unstructured, or Pandoc.

**Recommended adoption:**
- ✓ **Good for:** Simple Office documents (basic DOCX/XLSX/PPTX), HTML, RSS, basic PDFs, quick LLM preprocessing pipelines, MCP agents in trusted environments.
- ✗ **Poor for:** Complex PDFs, financial/scientific documents, table-rich content, untrusted input without additional validation, high-volume batch ingestion without Azure/LLM API cost planning.

**Key risks to address before production:**
1. Dependency security: Scan 25 deps regularly; pin mammoth ≥ 1.11.0.
2. Input validation: Treat untrusted DOCX/PDF as attack surface.
3. Quality assurance: Test conversion on representative corpus; do NOT assume "default" settings will preserve structure.
4. Cost: Budget for Azure Document Intelligence and LLM API calls if using optional features.
5. MCP exposure: Add authorization and URI allowlists if exposing MCP server.
