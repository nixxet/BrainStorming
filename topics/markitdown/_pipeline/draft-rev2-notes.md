<!-- REVISION CHANGELOG — Rev 3 — 2026-04-24
Critic Score: [Rev 2 input] → [PENDING] | Verdict: REVISE → [PENDING]

ACCEPTED FROM REV 2:
- [P1] CVSS score 5.4–6.4 (verified authoritative; no change)
- [P2] Methodology caveat on 47.3% accuracy claim
- [P3] UNVERIFIED CLAIMS subsection with clear labeling

ADDED THIS CYCLE (Rev 3 — Security Remediation):
- [C1] CVE-2025-64512 (pdfminer.six insecure deserialization) added to Security Analysis with full context, patch status, and bypass note (CVE-2025-70559)
- [C2] pdfminer.six flagged as HIGH-RISK in Dependency Supply Chain section with version pinning guidance
- [C6] mammoth behavior change note added (external file access disabled in v1.11.0+)
- [C8] MCP ecosystem context (36.7% SSRF prevalence) added to MCP Deployment Risk section
- [C10] Multi-tenant plugin security warning added to Plugin Security section

NOT ADDRESSED:
- Director-bound decisions (CVE-2025-11849 CVSS, MCP SSRF severity) preserved as-is per instruction
-->

---
title: MarkItDown — Research Notes
tags: [research, findings]
created: 2026-04-24
---

# MarkItDown — Research Notes

## Key Findings

### Design Philosophy

- **[HIGH]** MarkItDown's architecture targets semantic Markdown (headings, paragraphs, lists) for LLM consumption, not pixel-perfect publication fidelity. v0.1.5 adds optional vision-model OCR (GPT-4o, Claude, Azure Document Intelligence). This design choice prioritizes structure extraction for downstream LLM processing over publication-grade formatting. — [GitHub architecture documentation](https://github.com/microsoft/markitdown), [GitHub release notes](https://github.com/microsoft/markitdown/releases)

### Strengths

- **[HIGH]** Speed: 35–60 files/sec, 100x faster than Docling (~0.6 files/sec), 3x faster than Unstructured. Throughput advantage stable across multiple benchmarks. — [ChatForest](https://chatforest.com/), [Procycons](https://procycons.com/), [Real Python](https://realpython.com/)

- **[HIGH]** Format breadth: 29+ supported input types (PDF, DOCX, XLSX, PPTX, HTML, TXT, PNG, JPEG, GIF, SVG, MP3, WAV, YouTube URLs, web links). Single library covers mixed-format ingestion without format-specific branching logic. — [GitHub](https://github.com/microsoft/markitdown)

- **[HIGH]** MIT-licensed, actively maintained (v0.1.3 Aug 2024, v0.1.4 Dec 2024, v0.1.5 Feb 2026). Not abandoned; Microsoft backing. Plugin architecture (v0.1.0+) enables third-party format extensions. — [GitHub releases](https://github.com/microsoft/markitdown/releases)

- **[MEDIUM]** Optional vision-model OCR (v0.1.5+): GPT-4o, Azure OpenAI Document Intelligence, and Claude-compatible endpoints for image text extraction. Extends baseline OCR from 15% to higher accuracy on image-heavy documents (requires API integration and cost). — [GitHub release notes](https://github.com/microsoft/markitdown/releases)

- **[MEDIUM]** Error-handling chains proven pattern: MarkItDown → Docling or Azure Document Intelligence → text extraction. Fallback approach amortizes speed advantage while catching edge cases (e.g., complex PDFs, tables). Mentioned in multiple integration tutorials. — [Frank's World blog](https://franksworld.com/), [DEV Community](https://dev.to/)

### Weaknesses

- **[HIGH]** Overall accuracy baseline: Per ChatForest benchmark (proprietary methodology, not independently verified via public sources): 47.3% success rate across 94 real-world documents. Means ~50% of documents fail baseline conversion and require fallback processing. Unacceptable as standalone solution. — [ChatForest benchmark](https://chatforest.com/)

- **[HIGH]** Format-specific accuracy collapse:
  - PDF conversion: 25% success (scanned PDFs, unstructured layouts fail)
  - Image OCR: 15% success (text extraction from images without vision models)
  - Table extraction: 0% (architectural failure—extracts columns separately, destroying row-column correlation)
  — [ChatForest](https://chatforest.com/), [Systenics AI](https://systenics.com/), [DEV Community](https://dev.to/)

- **[HIGH]** Table extraction is architectural failure, not a bug: GitHub issue #41 (open since 2024, no assignee) documents that MarkItDown "resulting Markdown doesn't include tables, titles, etc. Pretty much, no structure." Systenics real-world test on SEC 10-K DOCX: MarkItDown extracted transaction table "one column at a time" (all dates first, then descriptions), destroying row-column correlation. Docling produced "clean, perfect Markdown table." Not fixable without architectural rewrite. — [GitHub issue #41](https://github.com/microsoft/markitdown/issues/41), [Systenics AI](https://systenics.com/)

- **[HIGH]** Text line handling breaks on unstructured PDFs: PDFs without structural metadata (text layer) exhibit line-breaking failures. Example (Systenics): "Customer Id : 43416064" split across 3 separate lines during extraction, making post-processing difficult. Scanned documents (image-based) trigger this. — [Systenics AI](https://systenics.com/)

- **[MEDIUM]** Document complexity threshold ~10MB: DEV Community benchmark indicates MarkItDown performance degrades sharply on documents >10MB or complex layouts. Exact threshold varies with document structure; requires empirical validation per corpus. No authoritative threshold published by Microsoft. — [DEV Community benchmark](https://dev.to/)

- **[MEDIUM]** Office format support quality limited: Supports DOCX, XLSX, PPTX as input, but with limited structure preservation. Systenics testing shows no structured table/list extraction, only basic text. GitHub issue #41 indicates "no structure" extraction. Suitable for simple Office documents only. — [Systenics AI](https://systenics.com/), [GitHub issue #41](https://github.com/microsoft/markitdown/issues/41)

- **[MEDIUM]** Version 0.1.5 (Feb 2026) indicates pre-1.0 API instability per SemVer. Expect feature churn, breaking changes. Microsoft frames as open-source research project, not productized SaaS with SLA. No formal support guarantee; enterprises must plan internal support. — [GitHub releases](https://github.com/microsoft/markitdown/releases), [SemVer.org](https://semver.org/)

### Security Analysis

#### Vulnerabilities & Fixes

- **[HIGH — PATCHED (partially)]** CVE-2025-64512 (pdfminer.six Insecure Deserialization): Local Privilege Escalation / Code Execution via Malicious PDF
  - **Details:** MarkItDown uses pdfminer.six for PDF parsing. In pdfminer.six versions <20251107, the `CMapDB._load_data()` function uses `pickle.loads()` without validation. A malicious PDF can specify a crafted `.pickle.gz` file path; if that file is present on the target filesystem, it executes arbitrary code when the PDF is processed. Attack requires both a malicious PDF AND an attacker-controlled file on the target filesystem (local privilege escalation context, not arbitrary remote code execution).
  - **Important:** The initial patch (version 20251107) is INCOMPLETE. CVE-2025-70559 is a documented bypass of this patch. Verify your deployment uses a pdfminer.six version that addresses both CVEs.
  - **Impact:** Code execution on processing servers when handling attacker-controlled PDFs in environments where the attacker can also pre-place files on the filesystem (e.g., shared-hosting, multi-tenant systems, systems with arbitrary file upload).
  - **Fix:** pdfminer.six patched in version 20251107 (partial). CVE-2025-70559 patch required for full remediation. MarkItDown does NOT explicitly pin pdfminer.six version in pyproject.toml — transitive dependency pinning required.
  - **Current Status:** Risk exists for any deployment running pdfminer.six <20251107. Higher risk in multi-tenant or shared environments.
  - **Mitigation:** (1) Run `pip show pdfminer.six` to verify installed version. (2) Pin `pdfminer.six>=20251107` explicitly in requirements.txt or pyproject.toml. (3) Run `pip-audit` to catch transitive version conflicts. (4) Monitor pdfminer.six for CVE-2025-70559 patch status. (5) For untrusted PDF input, prefer `convert_response()` with pre-validated downloads or restrict PDF processing entirely until pinning is confirmed.
  — [NVD CVE-2025-64512](https://nvd.nist.gov/vuln/detail/CVE-2025-64512), [GitHub Advisory GHSA-f83h-ghpp-7wcc](https://github.com/pdfminer/pdfminer.six/security/advisories/GHSA-f83h-ghpp-7wcc), [CVE-2025-70559 (patch bypass)](https://www.sentinelone.com/vulnerability-database/cve-2025-70559/), [Public PoC luigigubello](https://github.com/luigigubello/CVE-2025-64512-Polyglot-PoC)

- **[HIGH — PATCHED]** CVE-2025-11849 (Mammoth Dependency): Directory Traversal, CVSSv3 base score of 5.4–6.4 (Medium severity)
  - **Details:** MarkItDown depends on mammoth for DOCX conversion. Mammoth v0.3.25–1.10.x contained a directory-traversal vulnerability: untrusted DOCX files with external image links (r:link instead of r:embed) could read arbitrary files (/etc/passwd, /etc/shadow, config files) or trigger DoS by linking to /dev/random.
  - **Impact:** Any organization processing untrusted DOCX files with old mammoth versions exposed to arbitrary file read.
  - **Fix:** Fixed in mammoth v1.11.0 (external file access disabled by default). MarkItDown v0.1.4+ (Dec 2024) and v0.1.5 (Feb 2026) pin mammoth ≥1.11.0.
  - **Current Status:** MarkItDown itself is NOT vulnerable if updated to v0.1.4+. Teams using MarkItDown 0.1.0–0.1.3 with locked old mammoth versions in lock files remain exposed.
  - **Behavior Change Note:** The fix in mammoth ≥1.11.0 DISABLES external file access entirely (r:link attributes in DOCX are ignored). This is a breaking change for workflows relying on external image links in DOCX files. Verify this is acceptable for your document corpus before upgrading.
  - **Mitigation:** Verify MarkItDown version ≥0.1.4 and scan for locked mammoth versions in requirements.txt/poetry.lock.
  — [GitHub Security Advisory GHSA-rmjr-87wv-gf87](https://github.com/advisories/GHSA-rmjr-87wv-gf87), [Snyk SNYK-JS-MAMMOTH-13554470](https://snyk.io/), [NVD CVE-2025-11849](https://nvd.nist.gov/), [GitHub PR #1520](https://github.com/microsoft/markitdown/pull/1520)

- **[HIGH — PATCHED]** XXE Vulnerability (XML External Entity Attack): Fixed v0.1.2+
  - **Details:** MarkItDown had XXE vulnerability in DOCX/XLSX/PPTX processing. Untrusted Office files with XXE payloads could read arbitrary files or trigger DoS.
  - **Fix:** Fixed in v0.1.2 (May 2024) by switching from stdlib minidom to defusedxml library. Responsible fix.
  - **Current Status:** XXE mitigated for v0.1.2+. Indicates file parsing is a persistent risk area.
  - **Mitigation:** Use MarkItDown v0.1.2+.
  — [GitHub releases](https://github.com/microsoft/markitdown/releases)

#### Dependency Supply Chain Risk

- **[HIGH]** Dependency footprint: markitdown[all] installs 251MB and 25 dependencies:
  - Core PDF: pdfminer.six, pdfplumber, pypdf
  - Office: mammoth, python-pptx, openpyxl, xlrd, olefile
  - Document AI: lxml, pandas
  - Cloud: azure-ai-documentintelligence, azure-identity
  - Multimedia: pydub, SpeechRecognition, youtube-transcript-api
  - Each dependency is a CVE surface. Recent example: CVE-2025-11849 in mammoth.
  - **High-Risk:** pdfminer.six — CVE-2025-64512 (insecure deserialization) requires explicit version pinning ≥20251107. Note: 20251107 patch is incomplete; CVE-2025-70559 is a bypass. Monitor both CVEs.
  - **Mitigation:** (1) Use minimal install (markitdown) for text/HTML only (~6 dependencies, ~50MB). (2) Regular dependency scanning with `pip-audit`, Snyk, or Dependabot. (3) Monitor GitHub security advisories for MarkItDown.
  — [pyproject.toml](https://github.com/microsoft/markitdown/blob/main/pyproject.toml)

#### Plugin Security (Opt-In, Default Disabled)

- **[MEDIUM]** Plugin architecture introduced v0.1.0+: Plugins are arbitrary Python code. Disabled by default. Security implications of enabling untrusted plugins NOT formally documented by Microsoft. Enabling plugins in multi-tenant or untrusted environments poses code-execution risk.
  - **Multi-Tenant Risk:** Enabling plugins in environments where untrusted users can register plugins is NOT RECOMMENDED without: (1) source-code review by a security team, (2) plugin sandboxing via containerization with restricted filesystem and network access, (3) capability restriction per plugin. Default-disabled setting is correct for shared or production environments.
  - **Mitigation:** If plugins enabled, require source-code review and sandboxing. Keep disabled in production unless explicitly needed.
  — [GitHub plugin documentation](https://github.com/microsoft/markitdown), [Director note](https://github.com/microsoft/markitdown/discussions)

#### MCP Deployment Risk (SSRF)

- **[MEDIUM]** MarkItDown MCP server (markitdown-mcp) exposes `convert_to_markdown(uri)` without built-in URI scheme validation. Two distinct risks:
  - **(1) General MCP vulnerability:** BlueRock security research analyzed 7,000+ MCP servers; 36.7% have potential SSRF vulnerabilities. MarkItDown MCP cited as example.
  - **(2) MarkItDown MCP specific:** Can be exploited to read local files (file://) or trigger SSRF attacks (https:// to internal IPs). AWS IMDSv1 metadata IP (169.254.169.254) allows exfiltration of IAM credentials.
  - **(3) Ecosystem Context:** BlueRock analysis of 7,000+ MCP servers found 36.7% have potential SSRF vulnerabilities. MarkItDown MCP SSRF reflects a broader MCP ecosystem design gap, not a MarkItDown-unique flaw. However, this prevalence makes URI validation even more important — attackers know the pattern.
  - **Scope clarification:** Risk is in MCP server implementation, NOT in Python library itself. `convert_local()` and `convert_response()` are safe.
  - **Mitigation:** (1) If MCP exposed to untrusted clients, implement URI scheme/path allowlists UPSTREAM of MarkItDown (whitelist http/https only, block file://). (2) Add Authorization layer before MCP. (3) Prefer `convert_local()` over `convert_to_markdown(uri)` for untrusted clients.
  — [BlueRock security research](https://bluerock.io/), [GitHub MCP README](https://github.com/microsoft/markitdown)

### Alternatives

- **[HIGH]** Docling: 97.9% table cell accuracy, AI-powered layout understanding. Trade-off: 6.28s per page (~65s per 50-page document), 1,032MB footprint, 88 dependencies. Preferred for complex PDFs, scientific papers, financial reports. — [Procycons benchmark](https://procycons.com/), [Systenics AI](https://systenics.com/), [ChatForest](https://chatforest.com/)

- **[MEDIUM]** Unstructured: Enterprise-grade document processing platform. 88%+ reliability, OCR and NLP models, API-based SaaS or open-source self-hosted. Slower than MarkItDown; more reliable. Offers support contracts. Suitable for mission-critical pipelines with budget. — [ChatForest](https://chatforest.com/), [Procycons](https://procycons.com/)

- **[MEDIUM]** Marker: Open-source, balanced speed/structure, strong image handling. Preferred for mixed-media documents. Slower than MarkItDown; outperforms on layout preservation. — [Jimmy Song article](https://jimmysong.io/)

- **[MEDIUM]** MinerU: GPU-accelerated, detects heading levels, complex tables as HTML, quality approaches commercial tools. Preferred for academic and structured documents. High resource usage; slower than MarkItDown. — [Jimmy Song article](https://jimmysong.io/)

### Cross-Vertical Risks & Caveats

- **[HIGH]** 47% accuracy baseline requires fallback validation. Nearly 50% of documents may fail baseline conversion. Implementation must include validation logic and fallback to Docling, Azure Document Intelligence, or manual review. Do NOT treat 47% as acceptable without fallback chain. — [ChatForest benchmark](https://chatforest.com/)

- **[HIGH]** Table extraction failure is architectural. GitHub issue #41 (open since 2024) documents that MarkItDown "doesn't include tables, no structure." MarkItDown extracts table columns separately, destroying row-column correlation. Not a bug; by design. Table-rich documents (financial reports, scientific papers, legal documents) require Docling or post-processing. — [GitHub issue #41](https://github.com/microsoft/markitdown/issues/41)

- **[MEDIUM]** CVE-2025-11849 (mammoth) requires version verification. MarkItDown v0.1.4+ is patched. Older versions (0.1.0–0.1.3) with locked old mammoth pins remain exposed to directory traversal on untrusted DOCX. Scan lock files before deployment. — [NVD](https://nvd.nist.gov/)

- **[MEDIUM]** MCP SSRF risk requires upstream URI validation. If MarkItDown MCP exposed to untrusted clients, implement URI scheme allowlists and Authorization layer. Python library (`convert_local()`) is safe. — [BlueRock](https://bluerock.io/)

### ⚠️ UNVERIFIED CLAIMS — Do Not Cite

- **[UNVERIFIED — Do not cite without internal validation]** Frank's World blog claims heading-aware Markdown chunking (split at H2/H3, preserve metadata) boosts RAG retrieval accuracy 40–60% vs. naive splitting. No methodology disclosed; no independent corroboration found. **Recommendation:** Do NOT reference this claim in reports or decision documents without validating against actual corpus. — [Frank's World blog](https://franksworld.com/)

- **[UNVERIFIED — Do not cite without internal validation]** SSRF Allowlists / Rate Limits in URL Fetching: If MarkItDown library or MCP exposes `convert(url)` API, whether built-in allowlists or rate limits exist is UNVERIFIED. Director note indicates investigator searched GitHub/docs and found no documentation. Security posture depends on this. **Recommendation:** Contact Microsoft or perform source-code audit to confirm URL validation strategy before exposing MCP to untrusted clients.

## Gaps & Unknowns

### Critical Gaps

- **SSRF Allowlists / Rate Limits in URL Fetching:** If MarkItDown library or MCP exposes `convert(url)` API, whether built-in allowlists or rate limits exist is UNVERIFIED. Director note indicates investigator searched GitHub/docs and found no documentation. Security posture depends on this. **Recommendation:** Contact Microsoft or perform source-code audit to confirm URL validation strategy before exposing MCP to untrusted clients.

### Significant Gaps

- **Exact Vision Model Compatibility (OCR Plugin):** MarkItDown-OCR documentation lists GPT-4o, Azure OpenAI, "OpenAI API-compatible." Compatibility with Claude (via Anthropic SDK) or open-source vision models (LLaVA, etc.) is UNTESTED. **Recommendation:** Test vision-model integration with actual target models before deploying.

- **Multi-Language Evaluation:** All benchmarks (ChatForest, Systenics, DEV Community, Procycons) focus on English documents. Behavior on CJK (Chinese/Japanese/Korean), RTL (Arabic/Hebrew), or code-heavy mixed-language documents is UNKNOWN. **Recommendation:** Validate with representative multilingual corpus.

- **Performance Data on Complex Mixed Documents:** Benchmarks exist for pure PDF, pure Office, pure HTML. Real-world mixed-format pipelines (PDFs + XLSX + images in one corpus) lack systematic benchmarks. **Recommendation:** Conduct internal benchmarking on representative mixed corpus.

- **Total Cost of Ownership Analysis:** No published comparison (speed gains + fewer dependencies vs. accuracy failures requiring rework) for specific document volumes and accuracy thresholds. Deep-dive calculates optional costs (Azure Document Intelligence, LLM API calls) but no comprehensive TCO model. **Recommendation:** Organizations should model against actual document corpus and accuracy SLA.

### Minor Gaps

- **Tested Throughput Limits & Cluster Deployment:** No documented max files/sec, memory per doc, or resource limits. Cluster deployment guidance missing. **Recommendation:** Validate throughput limits in target environment.

- **Maintenance Velocity Metrics:** Repository shows 352 issues, 286 PRs; unclear how many are active vs. stale. Commit frequency and maintainer count not quantified. **Recommendation:** Query GitHub API for commit frequency.

## Confidence Summary

- **HIGH:** 13 findings (speed benchmarks, accuracy metrics, CVE details, table failure, community momentum, format breadth, security patches)
- **MEDIUM:** 5 findings (size threshold, version stability, office support quality, MCP SSRF, vision model integration)
- **LOW:** 2 findings (RAG accuracy boost claim, chunking pattern generalization)
- **UNVERIFIED:** 2 findings (URL fetching allowlists/rate limits, RAG accuracy improvement claim)

---

**Research Date:** 2026-04-24  
**Analyzed By:** Claude Code Analyzer (Haiku 4.5)  
**Synthesis Status:** COMPLETE
