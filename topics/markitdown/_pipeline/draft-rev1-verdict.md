<!-- REVISION CHANGELOG — Rev 1 — 2026-04-24
Critic Score: 7.6 | Verdict: REVISE

ACCEPTED:
- [P1] Fixed CVSS score from 9.3 to 4.0 in Risks & Caveats section (line 116)
- [P4] Expanded Quick Selection Decision Tree with fallback tool selection guidance (lines 179-185)

PARTIAL:
- None

REJECTED:
- None
-->

---
title: MarkItDown — Verdict
tags: [verdict, recommendation]
created: 2026-04-24
---

# MarkItDown — Verdict

## Recommendation

**CONDITIONAL ADOPT**

**Use MarkItDown IF:**
- Throughput requirement: >100 files/hour (batch processing essential) — **[HIGH]** [ChatForest, Procycons]
- Document corpus: Mixed-format, simple-to-moderate complexity (no table-heavy, no scanned PDFs) — **[HIGH]** [Systenics, ChatForest]
- Accuracy SLA: ≤47% baseline acceptable WITH fallback validation (e.g., Docling, Azure DI, manual review) — **[HIGH]** [ChatForest]
- Input trust: Documents are from trusted sources (not adversarial) — **[HIGH]** [CVE-2025-11849 analysis]
- Version: MarkItDown ≥0.1.4 (mammoth ≥1.11.0 for CVE-2025-11849 patch) — **[HIGH]** [NVD]
- Deployment: Python library (`convert_local()`) OR MCP with upstream URI validation — **[MEDIUM]** [BlueRock]

**Do NOT use MarkItDown (select Docling or Unstructured instead) IF:**
- Table extraction critical: Corpus is table-heavy (financial reports, scientific papers, legal documents) — **[HIGH]** [Systenics, GitHub issue #41]
- Accuracy SLA >70%: Fallback validation not operational feasible — **[HIGH]** [ChatForest]
- Untrusted input: Documents are adversarial or from untrusted sources without upstream validation layer — **[HIGH]** [CVE-2025-11849, XXE history]
- PDF-dominant: Corpus >50% scanned PDFs or complex layouts — **[HIGH]** [ChatForest, DEV Community]
- SLA critical: Enterprise requires Microsoft support guarantee (MarkItDown has none; 0.x stability risk) — **[MEDIUM]** [SemVer interpretation]
- Multilingual required: Corpus includes CJK, RTL, or code-heavy documents (untested) — **[MEDIUM]** [gaps analysis]

## Evaluation Scorecard

| Criterion | Rating | Evidence |
|-----------|--------|----------|
| **Speed/Throughput** | EXCELLENT | 35–60 files/sec; 100x faster than Docling. [ChatForest, Procycons] — HIGH |
| **Overall Accuracy** | POOR | 47.3% success rate; requires fallback. [ChatForest] — HIGH |
| **Table Extraction** | FAIL | 0% (architectural). [Systenics, GitHub #41] — HIGH |
| **PDF Handling** | POOR | 25% success; fails on unstructured layouts. [ChatForest, DEV Community] — HIGH |
| **Image/OCR** | POOR | 15% baseline; requires optional vision-model API. [ChatForest] — HIGH |
| **Format Breadth** | EXCELLENT | 29+ formats; single library coverage. [GitHub] — HIGH |
| **Security Posture** | FAIR | CVE-2025-11849 patched (v0.1.4+); dependency supply chain risk (25 CVE surfaces). [NVD, pyproject.toml] — HIGH |
| **API Stability** | MEDIUM | 0.x versioning; expect churn. Microsoft provides no SLA. [SemVer, GitHub] — MEDIUM |
| **Active Maintenance** | GOOD | 117K stars, 352 issues, 286 PRs, 3 releases in 12 months. [GitHub] — HIGH |
| **Operational Overhead** | MEDIUM | Fallback chain required; 251MB [all] install; 25 dependencies for full coverage. [pyproject.toml] — HIGH |

## What It Is Not

- **NOT a general-purpose document converter** like Pandoc. MarkItDown does not preserve publication-grade layout, formatting, or table structure.
- **NOT a standalone solution for structure-critical documents.** 47% baseline accuracy is insufficient without fallback validation.
- **NOT suitable for production SLA pipelines.** 0.x versioning + no Microsoft support guarantee disqualifies for enterprise SLA requirements.
- **NOT table extraction tool.** GitHub issue #41 (open since 2024) documents architectural failure; tables are not fixable without rewrite.
- **NOT a security-hardened tool for untrusted input.** CVE-2025-11849 (mammoth) and XXE history indicate file parsing risk area. Requires validated input + version pinning.

## What Is Reusable

- **Speed-accuracy trade-off framework:** MarkItDown's 47% baseline + 100x speed advantage is reusable for cost-benefit analysis in any high-volume document pipeline. Decision hinges on accuracy SLA, not MarkItDown-specific.
- **Fallback chain pattern:** Sequential fallback (fast converter → accurate converter → text extraction) is reusable for any mixed-accuracy document system. Multiple integration tutorials confirm pattern stability.
- **Batch streaming architecture:** Lightweight, stateless conversion suitable for containerized/Kubernetes deployment is reusable for similar batch workloads.
- **Vision-model OCR integration:** Optional GPT-4o/Claude/Azure DI integration pattern (v0.1.5+) is reusable for image-to-text workflows requiring flexible LLM selection.

## Future Project Relevance

**Useful if a future project needs:**
- High-throughput mixed-format document ingestion for LLM/RAG pipelines (e.g., knowledge base ingestion, prompt preprocessing)
- Simple-to-moderate document processing where 47% baseline + fallback validation is acceptable trade-off
- Quick-start tool for document processing (minimal configuration, no ML training required)
- Format diversity without format-specific branching logic

**Less useful when:**
- Accuracy >70% required (fallback overhead not operational feasible)
- Documents are table-heavy or scanned PDFs
- Enterprise SLA required (0.x stability risk)
- Untrusted input without upstream validation
- Multilingual documents (untested on CJK, RTL, code-heavy)

## Recommendation Invalidation Conditions

The recommendation to **CONDITIONAL ADOPT MarkItDown** would be **INVALIDATED** if ANY of the following occur:

1. **Accuracy Requirements Increase:** If SLA increases from ~47% to >80% baseline, recommend Docling or Unstructured instead. Fallback validation overhead may no longer be acceptable. — [ChatForest, Procycons]

2. **Table Extraction Becomes Critical:** If corpus becomes table-heavy without fallback processing, recommend Docling (97.9% table accuracy) or MinerU (tables as HTML). — [Systenics, Procycons]

3. **Untrusted Input, No Validation Possible:** If source documents are adversarial and input validation cannot be implemented upstream, recommend Unstructured (managed platform) or Docling (self-hosted + manual review). — [CVE-2025-11849 analysis]

4. **CVE-2025-11849 Mammoth Pinning Breaks:** If a future MarkItDown release unpins mammoth or downgrades version <1.11.0, re-assess directory-traversal risk for DOCX processing. — [NVD, GitHub PR #1520]

5. **XXE or XML Parsing New Vulnerabilities:** If defusedxml is downgraded or XML parsing is bypassed in a future MarkItDown version, re-audit XML parsing security. — [GitHub releases]

6. **MCP Exposure to Untrusted Clients Without Validation:** If MarkItDown MCP must serve multi-tenant agents or untrusted clients and URI validation upstream is not feasible, recommend narrow APIs (`convert_local` only) or isolated deployment. — [BlueRock, GitHub MCP README]

7. **Cost-Benefit Changes:** If Azure Document Intelligence pricing increases significantly or LLM API costs spike (vision-model OCR), fallback chain economics may favor Docling (one-time accuracy cost) over MarkItDown + fallback overhead. — [Optional cost analysis]

8. **Performance Requirements Exceed 10MB:** If corpus documents regularly exceed 10MB with complex layouts, empirical testing required; may need Docling as primary (MarkItDown as fallback). — [DEV Community benchmark]

9. **Multilingual Support Required:** If corpus includes CJK, RTL, or code-heavy documents, current benchmarks don't apply. Validate with representative multilingual corpus; may require Docling/Unstructured. — [gaps analysis]

10. **SLA/Support Guarantee Required:** If enterprise SLA critical, MarkItDown's 0.x stability and lack of Microsoft support guarantee become blockers. Recommend Unstructured (managed) or Docling (internal support budget). — [SemVer, GitHub]

## Vertical-Specific Constraints

### Source-Domain-Bound (LLM/RAG Preprocessing)

- **Error-handling chains:** Fallback pattern (MarkItDown → Docling → text extraction) is reusable for LLM preprocessing but not for non-LLM workflows (e.g., business intelligence, publication production).
- **MCP security pattern (URI validation):** URI validation upstream of MCP is reusable for ANY MCP tool exposing URI input; specific instantiation is MarkItDown-specific.
- **CVE-2025-11849 (mammoth):** Specific to DOCX processing with mammoth dependency; reusable for dependency security scanning policy but not architectural lessons.

### Depends on Document Corpus

- **Size threshold (~10MB):** Approximate; actual threshold depends on hardware, document structure, MarkItDown version. Requires empirical testing per deployment. Not transferable without validation.
- **OCR capability (GPT-4o, Claude, Azure DI):** Stated in v0.1.5 release; compatibility and cost require testing against target models. Not assumed.
- **Fallback strategies:** Pattern is sound; specific fallback tools (Azure DI, Docling, Tesseract) require configuration per environment. Not plug-and-play.

## Risks & Caveats

### Security Caveats

- **[HIGH]** CVE-2025-11849 (mammoth dependency): Directory traversal, CVSS 4.0. Affects mammoth v0.3.25–1.10.x; allows arbitrary file read on untrusted DOCX input. MarkItDown v0.1.4+ pins mammoth ≥1.11.0 (patched). Teams using MarkItDown 0.1.0–0.1.3 with locked old mammoth pins remain exposed. **Mitigation:** Verify version ≥0.1.4; scan lock files. — [NVD, GitHub PR #1520]

- **[HIGH]** 47% accuracy baseline requires fallback validation. Nearly 50% of documents may require fallback processing (Docling, Azure Document Intelligence, manual review). Do NOT treat 47% as acceptable without fallback chain. **Mitigation:** Implement conversion validation and fallback logic; budget for optional costs (Azure DI, LLM API). — [ChatForest]

- **[HIGH]** Table extraction failure is architectural. GitHub issue #41 (open since 2024) documents that MarkItDown "doesn't include tables, no structure." Extracts columns separately, destroying row-column correlation. Not a bug; by design. **Mitigation:** For table-rich documents, use Docling or post-processing. — [Systenics, GitHub #41]

- **[MEDIUM]** MCP SSRF risk: MarkItDown MCP server (markitdown-mcp) exposes `convert_to_markdown(uri)` without built-in URI validation. MCP deployments to untrusted clients require URI scheme/path allowlists implemented UPSTREAM. Python library itself (`convert_local`, `convert_response`) is safe. **Mitigation:** Add URI allowlists upstream; restrict schemes to http/https only; add Authorization layer. — [BlueRock, GitHub MCP README]

- **[MEDIUM]** Version 0.1.x indicates API instability. SemVer convention: 0.x versions expect feature churn, breaking changes. Microsoft provides no SLA or support guarantee; enterprises should plan internal support. **Mitigation:** Plan for version management and internal support; avoid SLA-critical workflows. — [SemVer.org, GitHub]

### Operational Caveats

- **[MEDIUM]** Dependency supply chain: markitdown[all] = 251MB, 25 dependencies. Regular scanning required (Dependabot, pip-audit, Snyk). Recent CVE-2025-11849 in mammoth is example. **Mitigation:** Use minimal install if possible (markitdown, ~6 deps); scan dependencies regularly. — [pyproject.toml]

- **[MEDIUM]** Document complexity threshold ~10MB: Performance degrades sharply >10MB or complex layouts. Exact threshold varies; requires empirical validation. **Mitigation:** Empirically test with representative documents; implement size/complexity checks. — [DEV Community]

- **[LOW — UNVERIFIED]** RAG accuracy improvement claim: Frank's World blog claims heading-aware chunking boosts RAG accuracy 40–60%. No methodology; no corroboration. **Mitigation:** Do NOT cite claim without validation against actual corpus. — [Frank's World blog]

## Next Steps

1. **Version Verification:** Confirm MarkItDown ≥0.1.4 with mammoth ≥1.11.0 before deployment. Scan lock files for old mammoth pins.

2. **Corpus Validation:** Test MarkItDown on representative 50–100 documents from target corpus. Measure actual conversion success rate; if >30% failures, budget for fallback tool.

3. **Fallback Chain Implementation:** Implement error-handling logic: (1) Try MarkItDown. (2) On failure, try Docling or Azure Document Intelligence. (3) Final fallback to text extraction or manual review. Budget for optional costs (Azure DI, LLM API).

4. **Dependency Scanning:** Set up Dependabot or Snyk scanning for markitdown dependencies. Establish policy for CVE response (e.g., auto-upgrade patch versions, manual review for minor/major).

5. **MCP Deployment (if applicable):** If using MarkItDown MCP, implement upstream URI validation before exposing to untrusted clients. Whitelist http/https schemes only; block file://. Add Authorization layer.

6. **Size/Complexity Thresholds:** Empirically establish document size and layout complexity thresholds for fallback trigger (e.g., "if doc >10MB or >100 tables, use Docling first").

7. **Monitoring & Alerts:** Track conversion success rate per document type. Alert if success rate drops below 47% (may indicate corpus shift or MarkItDown regression).

8. **Vision-Model Integration (Optional):** If image OCR needed, test MarkItDown-OCR with target vision models (GPT-4o, Claude, Azure DI) before deployment. Evaluate cost-benefit vs. standalone OCR service.

## Runner-Up / Alternatives

### When to Use Each Alternative

| Tool | Best For | Trade-Off | Cost/Complexity |
|------|----------|-----------|-----------------|
| **MarkItDown** | High-volume, mixed-format, speed-critical, simple docs | 47% accuracy baseline | Low complexity; minimal cost |
| **Docling** | Complex PDFs, tables, scientific/financial documents, accuracy critical | 6.28s/page; 1,032MB; 88 deps | High complexity; moderate cost |
| **Unstructured** | Enterprise SLA, mission-critical, budget available | Slower than MarkItDown; higher cost | High complexity; high cost (SaaS/managed) |
| **Marker** | Mixed-media documents, image handling, balance speed/structure | Slower than MarkItDown | Medium complexity; low cost |
| **MinerU** | Academic/scientific documents, GPU available, tables as HTML | GPU required; high resource usage | High complexity; medium cost |

### Quick Selection Decision Tree

```
Does corpus include tables?
├─ YES, tables critical → Use Docling (97.9% accuracy) or MinerU
└─ NO, text/headings only → Continue...

Is accuracy SLA >70%?
├─ YES → Use Docling, Unstructured, or Marker
└─ NO (≤47% acceptable) → Continue...

Is throughput >100 files/hour required?
├─ YES → Use MarkItDown + fallback chain
└─ NO → Use Docling or Unstructured (accuracy-first)

Can we implement fallback validation (Docling/Azure DI)?
├─ YES → Use MarkItDown + fallback chain
│       └─ Which fallback tool?
│           ├─ If >10MB or complex layouts → Docling (accuracy priority)
│           ├─ If budget allows SaaS → Azure Document Intelligence (managed risk)
│           └─ If manual review feasible → text extraction (cost-effective fallback)
└─ NO → Use Docling, Unstructured, or Marker as primary
```

---

**Recommendation Date:** 2026-04-24  
**Verdict Status:** CONDITIONAL ADOPT  
**Review Frequency:** Annually or upon new MarkItDown major version release  
**Next Security Audit:** When MarkItDown reaches v1.0.0 or upon critical CVE in dependency chain
