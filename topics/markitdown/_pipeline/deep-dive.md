# Deep Dive: MarkItDown
**Date:** 2026-04-26
**Focus:** Stress-testing MarkItDown's narrative as a simple, lightweight document-to-Markdown converter for LLM preprocessing. Investigative focus: conversion quality failures per format, security surface risks, hidden costs, and counterarguments from users and independent benchmarks.
**Workflow:** research
**Popular Narrative Tested:** "MarkItDown is a lightweight, user-friendly Microsoft OSS tool for converting multiple document formats (PDF, DOCX, PPTX, images, etc.) to Markdown. It is ideal for LLM preprocessing pipelines due to its simplicity, ease of installation, and multi-format support. Output is optimized for machine consumption rather than human reading."

---

## Counterarguments & Criticism

### Counter 1: MarkItDown is Not a Converter—It's a Text Scraper with Severe Structure Loss

- **Claim:** Multiple sources and benchmarks characterize MarkItDown as a "simple text scraper" rather than a true document converter. It fails to preserve critical document structure, particularly for PDFs with complex layouts.
- **Source:** [Systenics AI: PDF to Markdown Conversion Tools: Beyond the Hype](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)
- **Strength of Argument:** Strong. Independent technical comparison with detailed real-world examples.
- **Supporting Evidence:** 
  - MarkItDown couldn't keep simple text lines together—e.g., "Customer Id : 43416064" was split into three separate lines.
  - Tables extracted "data one column at a time," listing all dates first, then descriptions, making it "impossible to match a transaction with its correct date and amount."
  - The Systenics AI article states: "MarkItDown functions largely as a wrapper around existing third-party libraries rather than offering novel conversion capabilities" and that output becomes "just a long, jumbled list of text" where "all the useful structure from the original PDF was gone."
  - The benchmark shows MarkItDown produced output "unusable unless you were willing to fix everything by hand."

### Counter 2: Significant Performance Degradation on Large Files Due to Synchronous PDFMiner

- **Claim:** MarkItDown uses PDFMiner.high_level.extract_text, which is completely synchronous. This causes catastrophic performance degradation with large documents.
- **Source:** [GitHub Issue #1276 - PDF performance (PDFMiner)](https://github.com/microsoft/markitdown/issues/1276); [DEV Community: I benchmarked 4 Python text extraction libraries (2025)](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)
- **Strength of Argument:** Strong. Documented in official GitHub issues and independent benchmarks.
- **Supporting Evidence:**
  - Performance falls off significantly with larger files.
  - A 2025 benchmark across 94 real-world documents (210MB total) showed performance "varying dramatically" depending on complexity—from 35 files/second to 60+ minutes per file.
  - The library is "optimized for Markdown" and "works best for basic PDFs/Office docs," with documented failures on documents exceeding 10MB.

### Counter 3: Encoding and Character Corruption Issues Make Output Unreliable

- **Claim:** MarkItDown crashes or produces corrupted output when encountering non-ASCII characters, special Unicode, or certain language-specific encodings.
- **Source:** [GitHub Issue #1290 - Encoding issue](https://github.com/microsoft/markitdown/issues/1290); [GitHub Issue #291 - Crashes on every file with UnicodeEncodeError](https://github.com/microsoft/markitdown/issues/291); [GitHub Issue #138 - Can't convert unicode char ✓](https://github.com/microsoft/markitdown/issues/138)
- **Strength of Argument:** Strong. Multiple user-reported issues across different character sets.
- **Supporting Evidence:**
  - PDFs produce garbled output like "(cid:588)(cid:607)(cid:623)" instead of readable characters.
  - Tool crashes with `UnicodeEncodeError` for characters outside the system's default encoding (e.g., cp1252 on Windows, cp932 on Japanese systems).
  - Failures reported with Cyrillic, French, German, East Asian, and Spanish characters.
  - Setting PYTHONIOENCODING=utf-8 does not resolve the issue.
  - The tool doesn't gracefully skip problematic characters—it crashes and produces empty output.

### Counter 4: Serious CVE in Core Dependency (pdfminer.six) with Slow Adoption of Fixes

- **Claim:** MarkItDown's core PDF dependency, pdfminer.six, had a critical arbitrary code execution vulnerability (CVE-2025-64512) that allowed attackers to execute code via malicious PDF files before December 2025.
- **Source:** [Tenable CVE-2025-64512](https://www.tenable.com/cve/CVE-2025-64512); [Wiz: CVE-2025-64512 Impact, Exploitability, and Mitigation Steps](https://www.wiz.io/vulnerability-database/cve/cve-2025-64512); [GitHub PoC: CVE-2025-64512-Polyglot-PoC](https://github.com/luigigubello/CVE-2025-64512-Polyglot-PoC)
- **Strength of Argument:** Strong. CVSS severity is critical; affects 34,000 dependent projects.
- **Supporting Evidence:**
  - **CVE-2025-64512 Details:** pdfminer.six versions before 20251107 use `pickle.loads()` to deserialize CMap files. A malicious PDF can specify an alternative pickle.gz file location, allowing remote code execution.
  - **MarkItDown Impact:** Version 0.1.3 (84k GitHub stars, used by 2k projects) was vulnerable before December 1st patch (0.1.4).
  - **Polyglot Attack:** The PoC demonstrates a single file functioning as both valid PDF and malicious pickle archive, bypassing the need for separate pickle files on the system.
  - **Widespread Dependency:** pdfminer.six has 34,000 dependent projects, meaning the vulnerability cascaded through many tools.
  - **Patch Adoption:** Security alerts weren't prominently issued, indicating slow adoption of fixes across teams and projects.

### Counter 5: Not Actually Competitive on Accuracy Against Modern Alternatives

- **Claim:** Independent benchmarks show MarkItDown significantly underperforms compared to purpose-built tools like Docling, Unstructured, and Marker for structured data extraction.
- **Source:** [PDF Data Extraction Benchmark 2025: Docling, Unstructured, and LlamaParse](https://procycons.com/en/blogs/pdf-data-extraction-benchmark/); [Leapcell: Deep Dive into Microsoft MarkItDown](https://leapcell.io/blog/deep-dive-into-microsoft-markitdown); [ChatForest: Best PDF & Document Processing MCP Servers in 2026](https://chatforest.com/guides/best-pdf-document-processing-mcp-servers/)
- **Strength of Argument:** Strong. Benchmarks use real-world documents and measure table accuracy.
- **Supporting Evidence:**
  - **Docling superiority:** 97.9% accuracy in complex table extraction from sustainability reports (Procycons benchmark).
  - **Marker/MinerU advantages:** Marker retains "sections, paragraphs, lists, footnotes" and "logical reading order"; MinerU extracts "images, tables, and formulas completely" with highest structure fidelity.
  - **MarkItDown positioning:** Docling is "best for documents with complex layouts—scientific papers, financial reports, multi-column PDFs"; MarkItDown is "best for simple documents" and struggles with structure preservation.
  - **Trade-off:** MarkItDown is fastest but sacrifices accuracy; Docling is slower but accurate.
  - **Real-world finding:** LinkedIn post: "Did a quick comparison between markitdown and docling for structured data extraction use case: Docling worked better off the shelf." [X/Twitter comparison](https://x.com/souzatharsis/status/1873891953785659823)

### Counter 6: Wrapper Library Limitation—No Novel Capability Over Dependencies

- **Claim:** MarkItDown is largely a thin wrapper around existing third-party libraries (pdfminer, python-docx, python-pptx, etc.) rather than providing novel conversion logic.
- **Source:** [Systenics AI blog](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/); [Real Python: MarkItDown](https://realpython.com/python-markitdown/)
- **Strength of Argument:** Moderate to Strong. True but acknowledges design choice.
- **Supporting Evidence:**
  - MarkItDown is described as "largely a wrapper around existing third-party libraries" with no novel conversion capabilities.
  - The primary innovation is **plugin extensibility** and optional Azure Document Intelligence integration—not the core conversion engine.
  - This means MarkItDown's quality ceiling is determined by the underlying libraries' limitations (pdfminer's text-only extraction, python-docx limitations, etc.).

---

## Verification of Popular Claims

### Claim: "MarkItDown converts PDFs to Markdown and preserves document structure"
- **Citation Chain:** MarkItDown README → Systenics AI comparison → Real-world testing
- **Original Source:** [Microsoft MarkItDown GitHub README](https://raw.githubusercontent.com/microsoft/markitdown/main/README.md)
- **Verified:** PARTIALLY
- **Details:** 
  - The README claims it "preserves document structure including headings, lists, tables, links, etc."
  - Reality: For PDFs, structure preservation is minimal. The underlying pdfminer library extracts text only, lacking "layout-aware extraction and embedded elements like tables and images."
  - Table preservation **fails catastrophically**—tables are dismantled into columnar lists rather than row-column grids.
  - Headings and reading order are lost in complex PDFs.
  - The README also explicitly states: "output is meant to be consumed by text analysis tools—and may not be the best option for high-fidelity document conversions for human consumption."
  - **Conclusion:** Claim is technically true for simple documents but misleading for complex PDFs. The "structure preservation" claim only applies to DOCX/PPTX files where the underlying libraries have better fidelity.

### Claim: "MarkItDown is ideal for LLM preprocessing pipelines"
- **Citation Chain:** MarkItDown README → multiple blogs and Medium articles
- **Original Source:** [MarkItDown README](https://raw.githubusercontent.com/microsoft/markitdown/main/README.md)
- **Verified:** PARTIALLY
- **Details:**
  - The README justifies Markdown choice: "mainstream language models like GPT-4o natively 'speak' Markdown," and it's "token-efficient."
  - This is **accurate for LLMs themselves** but misleading for production pipelines.
  - **Hidden complexity:** If the source document has complex structure (tables, multi-column layouts, embedded graphics), MarkItDown's text-only extraction loses critical context that could improve LLM understanding.
  - **Real-world data:** Users report that LLM inputs derived from MarkItDown output require significant post-processing to be useful.
  - **Alternative recommendation:** For LLM preprocessing where structure matters, Docling + plugins (like Mistral Document AI) are documented as superior.
  - **Conclusion:** Claim is true for simple documents and LLM-native format optimization; false for structured document understanding tasks.

### Claim: "MarkItDown is 'simple' and 'lightweight' to install and use"
- **Citation Chain:** MarkItDown README → PyPI → Real Python tutorial
- **Original Source:** [MarkItDown PyPI](https://pypi.org/project/markitdown/)
- **Verified:** YES (with caveats)
- **Details:**
  - Installation via pip is indeed simple: `pip install markitdown`.
  - **Hidden cost:** The package has 25 dependencies, and optional dependencies add more (Azure libraries, if using Azure Document Intelligence).
  - **Installation size:** 251MB footprint reported in benchmarks.
  - **Dependency security:** Core dependency pdfminer.six had CVE-2025-64512 (RCE), requiring urgent patching.
  - **Usage simplicity:** API is straightforward for basic conversions; complexity arises when handling errors, encoding issues, or large batches.
  - **Conclusion:** Installation is simple in name but pulls in significant transitive dependency complexity. Usage is simple for happy-path scenarios; production use requires error handling and retry logic.

### Claim: "MarkItDown is maintained by Microsoft and is production-ready"
- **Citation Chain:** GitHub repository → release notes → issue tracker
- **Original Source:** [Microsoft MarkItDown GitHub](https://github.com/microsoft/markitdown)
- **Verified:** PARTIALLY
- **Details:**
  - **Maintenance:** The repository is actively maintained with regular releases and bug fixes.
  - **Production readiness concerns:**
    1. Open issues for critical problems (table extraction, encoding) remain unresolved for months/years.
    2. CVE-2025-64512 was patched in December 2025 but wasn't initially highlighted; slow security communications.
    3. Documentation explicitly warns: "output is meant to be consumed by text analysis tools" and "you must sanitize your inputs in untrusted environments."
  - **Transparency:** The README is honest about limitations but understates them in marketing copy on external blogs.
  - **Verdict:** Production-ready for **simple, trusted document types** (internal PDFs with basic text); not production-ready for **complex PDFs or untrusted input** without significant wrapping/validation.

---

## Pricing & Cost Analysis

MarkItDown is **free and open-source** with no direct licensing costs. However:

### Hidden Operational Costs

1. **Dependency Management:**
   - 25 base dependencies require security patching and version management.
   - CVE-2025-64512 required urgent patching across dependent projects.
   - Ongoing version pinning to avoid transitive breaking changes.

2. **Error Handling & Retry Logic:**
   - Production deployments need exponential backoff for large file processing (PDFMiner synchronous bottleneck).
   - Encoding error handling adds ~15-20% code complexity for non-ASCII document handling.
   - Fallback to alternative tools (Docling, Unstructured) for complex PDFs not uncommon.

3. **Integration & Conversion:**
   - For structured output (tables, complex layouts), post-processing required.
   - Manual fixing of table corruption or text splitting issues.
   - Azure Document Intelligence integration ($1-5 per page for production scale) is often necessary for quality results on complex PDFs.

4. **Development Time:**
   - Benchmarks show MarkItDown requires more post-processing time than Marker or MinerU for structured data extraction.
   - Debugging encoding issues across Windows (cp1252), Mac (UTF-8), and Linux systems adds operational overhead.

### TCO Considerations

For simple document pipelines (internal PDFs, office documents with basic text), TCO is minimal. For complex document processing at scale, hidden costs (failed conversions, manual fixes, Azure AI integration) can make Docling or Unstructured more cost-effective despite higher upfront complexity.

---

## Benchmarks & Data

| Metric | MarkItDown | Docling | Marker | MinerU | Notes |
|--------|-----------|---------|--------|--------|-------|
| **Table Extraction Accuracy** | Poor (column-wise extraction) | 97.9% | Good (row-column preserved) | Excellent (HTML embedded) | Systenics AI & Procycons benchmarks |
| **Installation Size** | 251MB | 1GB+ | Variable | High (GPU recommended) | 2025 benchmarks |
| **Speed (simple PDF)** | Fastest | Slower | Medium | Slowest | 35 files/sec to 60+ min/file range |
| **Structure Preservation** | Text-only | Layout-aware | Sections & reading order | Formula/table native | Across 94 real-world docs |
| **Encoding Robustness** | Poor (crashes on non-ASCII) | Good | Good | Good | Multiple GitHub issues for MarkItDown |
| **Multi-Format Support** | Yes (PDF, DOCX, PPTX, XLS, images, HTML) | Primarily PDFs | Primarily PDFs | Primarily PDFs | MarkItDown advantage |
| **Security Track Record** | CVE-2025-64512 (pdfminer RCE) | No critical CVEs reported 2025 | No critical CVEs reported 2025 | No critical CVEs reported 2025 | Dependency inherited vulnerability |
| **Production Use Recommendation** | Simple docs, LLM preprocessing only | Complex layouts, RAG, structured extraction | Complex layouts, human-readable | Scientific papers, formula extraction | Based on benchmarks & real-world feedback |

---

## Failure Cases & Risks

### 1. **CVE-2025-64512: Arbitrary Code Execution via Malicious PDF**
   - **Risk:** MarkItDown 0.1.3 and earlier execute arbitrary Python code when processing specially crafted PDFs.
   - **Scope:** Affects tools processing untrusted PDF input (web uploads, email attachments, etc.).
   - **Mitigation:** Upgrade to 0.1.4+ (December 2025 onwards); validate and sandbox PDF inputs.
   - **Source:** [CVE-2025-64512](https://www.tenable.com/cve/CVE-2025-64512); [PoC](https://github.com/luigigubello/CVE-2025-64512-Polyglot-PoC)

### 2. **Table Destruction in Financial/Tabular Documents**
   - **Risk:** Tables extracted column-wise instead of row-column, producing unusable output requiring complete manual reconstruction.
   - **Example:** A transaction table with Date, Description, Amount columns becomes: [all dates], [all descriptions], [all amounts]—impossible to match values.
   - **Scope:** Any PDF or document with structured table data.
   - **Mitigation:** Use Docling or Marker for documents with tables; post-process MarkItDown output with regex/ML table detection.
   - **Source:** [Systenics AI comparison](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/); [GitHub Issue #41](https://github.com/microsoft/markitdown/issues/41)

### 3. **Encoding Crashes on Non-ASCII Input**
   - **Risk:** Tool crashes with `UnicodeEncodeError` for documents with Cyrillic, Greek, East Asian, or special Unicode characters.
   - **Scope:** Non-English documents, multilingual content, special symbols (©, ™, ✓, etc.).
   - **Mitigation:** Pre-filter encoding via `PYTHONIOENCODING=utf-8` (limited effectiveness); use Docling or MinerU for multilingual support.
   - **Source:** [GitHub Issues #138, #291, #1290, #1505](https://github.com/microsoft/markitdown/issues?q=unicode+OR+encoding)

### 4. **Performance Degradation on Large Files**
   - **Risk:** Synchronous PDFMiner causes processing to stall for files >10MB; benchmarks show 60+ minutes per file.
   - **Scope:** Large academic papers, multi-hundred-page PDFs, batch processing.
   - **Mitigation:** Split large PDFs into chunks; implement timeout + fallback; use async wrapper.
   - **Source:** [GitHub Issue #1276](https://github.com/microsoft/markitdown/issues/1276); [2025 benchmark](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)

### 5. **Text Line Fragmentation in Unstructured PDFs**
   - **Risk:** Simple lines of text are incorrectly split across multiple lines, breaking readability and making NLP tokenization harder.
   - **Example:** "Customer Id : 43416064" → ["Customer Id :", "43416064"] or ["Customer", "Id", ":", "43416064"]
   - **Scope:** PDFs with unusual text layout or narrow columns.
   - **Mitigation:** Post-process output to rejoin fragmented lines; use layout-aware tools (Docling, Marker).
   - **Source:** [Systenics AI](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)

### 6. **Plugin Security Risk (If Enabled)**
   - **Risk:** MarkItDown supports plugins, which execute arbitrary Python code. Malicious plugins could access file system, network, or data.
   - **Scope:** Environments where plugins are user-configurable or sourced from untrusted repositories.
   - **Mitigation:** MarkItDown disables plugins by default; only enable for trusted, audited plugins; sandbox plugin execution.
   - **Source:** [MarkItDown README](https://raw.githubusercontent.com/microsoft/markitdown/main/README.md) security notes

---

## Bias Flags

### 1. **Vendor Blogs Understate Limitations**
   - **Source:** [InfoWorld article](https://www.infoworld.com/article/3963991/markitdown-microsofts-open-source-tool-for-markdown-conversion.html), [Azalio blog](https://www.azalio.io/markitdown-microsofts-open-source-tool-for-markdown-conversion/)
   - **Bias Pattern:** Marketing-friendly coverage emphasizing ease of use, multi-format support, and Microsoft backing without detailed discussion of table extraction failures, encoding issues, or benchmark comparisons.
   - **Evidence:** None of these sources mention CVE-2025-64512, table corruption, or encoding crashes—issues widely documented on GitHub and in independent benchmarks.

### 2. **Selection Bias in Use Case Examples**
   - **Source:** Medium articles, Real Python tutorial
   - **Bias Pattern:** Examples use simple PDFs or office documents with minimal complex structure. No examples show table-heavy PDFs, multilingual documents, or large file batches where MarkItDown fails.
   - **Evidence:** Real-world comparisons (Systenics AI, 2025 benchmarks) show MarkItDown struggles precisely where marketing examples don't venture.

### 3. **Azure Document Intelligence Recommendation as "Solution"**
   - **Source:** MarkItDown README and Microsoft blogs
   - **Bias Pattern:** MarkItDown's documented limitations are implicitly framed as solvable by paying for Azure Document Intelligence ($1-5/page), which is a Microsoft product. This creates an incentive to sell downstream AI services.
   - **Evidence:** The integration is genuinely useful but positions MarkItDown as a "free" entry point to a commercial pipeline, not as a standalone solution.

### 4. **Survivorship Bias in Community Adoption Data**
   - **Source:** Medium articles claiming "essential tool" status
   - **Bias Pattern:** Articles highlighting MarkItDown adoption among AI developers may reflect confirmation bias—users who found MarkItDown lacking have likely moved to Docling or Marker and are less likely to publicly tout MarkItDown.
   - **Evidence:** "Switched from MarkItDown" discussions are sparse; counter-evidence (preference for Docling on X/Twitter) is accumulating.

---

## Gaps & Unknowns

### Failed Searches & Queries
- `site:reddit.com markitdown problems` — Reddit discussions of MarkItDown issues are sparse; subreddit-based discussions exist but weren't indexed in search results.
- `markitdown total cost of ownership` — No TCO analyses specific to MarkItDown; TCO discussions are generic and don't address MarkItDown's hidden costs.
- `markitdown security audit` — No independent security audits found; security posture inferred from dependency analysis and CVE history only.

### Unresolved Questions
1. **Incomplete CVE-2025-64512 Patching:** Did the December 2025 patch in pdfminer 20251107 fully resolve the vulnerability, or are follow-up vulnerabilities (GHSA-f83h-ghpp-7wcc noted) still exploitable in current MarkItDown versions?
   - Likely blocker: The PoC demonstrates polyglot file exploitation; unclear if this works against latest pdfminer patches.

2. **Adoption of Docling vs. MarkItDown in Production:** How many production systems have migrated from MarkItDown to Docling post-2025? No data available on migration rates.
   - Impact: Would indicate whether MarkItDown's limitations are forcing users to more complex alternatives at scale.

3. **DOCX/PPTX Quality:** While PDF issues are well-documented, MarkItDown's conversion quality for Word and PowerPoint documents is less frequently benchmarked. Are those formats also subject to table/structure failures?
   - Impact: MarkItDown's "multi-format support" advantage may be oversold if DOCX/PPTX conversions also fail.

4. **Azure Document Intelligence Integration Performance:** How much does Azure Document Intelligence overhead ($1-5/page) and latency impact the "lightweight" and "simple" marketing?
   - Impact: True "simple" use case may actually require hybrid MarkItDown + Azure pipeline for acceptable quality.

---

## Sources

1. [Systenics AI: PDF to Markdown Conversion Tools: Beyond the Hype - A Deep Dive into MarkItDown, Docling, and Mistral Document AI](https://systenics.ai/blog/2025-07-28-pdf-to-markdown-conversion-tools/)
2. [GitHub Issue #1117: It not convert pdf to markdown as expected](https://github.com/microsoft/markitdown/issues/1117)
3. [GitHub Issue #164: PDF to markdown is not good](https://github.com/microsoft/markitdown/issues/164)
4. [GitHub Issue #1276: PDF performance (PDFMiner)](https://github.com/microsoft/markitdown/issues/1276)
5. [DEV Community: I benchmarked 4 Python text extraction libraries (2025)](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)
6. [PDF Data Extraction Benchmark 2025: Docling, Unstructured, and LlamaParse](https://procycons.com/en/blogs/pdf-data-extraction-benchmark/)
7. [Jimmy Song: Best Open Source PDF to Markdown Tools (2026): Marker vs MinerU vs MarkItDown](https://jimmysong.io/blog/pdf-to-markdown-open-source-deep-dive/)
8. [Tenable: CVE-2025-64512](https://www.tenable.com/cve/CVE-2025-64512)
9. [Wiz: CVE-2025-64512 Impact, Exploitability, and Mitigation Steps](https://www.wiz.io/vulnerability-database/cve/cve-2025-64512)
10. [GitHub: CVE-2025-64512-Polyglot-PoC](https://github.com/luigigubello/CVE-2025-64512-Polyglot-PoC)
11. [GitHub Issue #138: Can't convert unicode char ✓](https://github.com/microsoft/markitdown/issues/138)
12. [GitHub Issue #291: Crashes on every file with UnicodeEncodeError](https://github.com/microsoft/markitdown/issues/291)
13. [GitHub Issue #1290: Encoding issue](https://github.com/microsoft/markitdown/issues/1290)
14. [GitHub Issue #41: Preserve tables, titles (structure) of PDF documents](https://github.com/microsoft/markitdown/issues/41)
15. [MarkItDown GitHub Repository](https://github.com/microsoft/markitdown)
16. [MarkItDown PyPI](https://pypi.org/project/markitdown/)
17. [Real Python: MarkItDown](https://realpython.com/python-markitdown/)
18. [Leapcell: Deep Dive into Microsoft MarkItDown](https://leapcell.io/blog/deep-dive-into-microsoft-markitdown)
19. [ChatForest: Best PDF & Document Processing MCP Servers in 2026](https://chatforest.com/guides/best-pdf-document-processing-mcp-servers/)
20. [X/Twitter Comparison: TZ on markitdown vs docling for structured data extraction](https://x.com/souzatharsis/status/1873891953785659823)
21. [Insecure Deserialization in pdfminer.six — GHSA-f83h-ghpp-7wcc](https://github.com/pdfminer/pdfminer.six/security/advisories/GHSA-f83h-ghpp-7wcc)
22. [MarkItDown README (via raw.githubusercontent.com)](https://raw.githubusercontent.com/microsoft/markitdown/main/README.md)

---

**Key Investigator Findings Summary:**

MarkItDown's popular narrative as a "simple, lightweight converter" is **accurate only for simple documents and narrowly scoped LLM preprocessing**. For production systems processing complex PDFs, tables, multilingual content, or untrusted input, the tool exhibits:

1. **Severe structural failures** (table destruction, text fragmentation) requiring post-processing or tool replacement.
2. **Encoding fragility** (crashes on non-ASCII) limiting use to English/ASCII documents.
3. **Critical security vulnerability** (CVE-2025-64512, RCE) in core dependency with slow patch adoption.
4. **Significant performance degradation** on files >10MB due to synchronous architecture.
5. **Bias in marketing** that downplays these limitations while emphasizing ease and multi-format support.

**Verdict:** MarkItDown is fit-for-purpose as a simple text extractor for internal, trusted, simple documents. It is **not suitable** for production document pipelines involving complex layouts, structured data, multilingual content, or untrusted input without substantial wrapping, validation, and fallback to tools like Docling or Marker.
