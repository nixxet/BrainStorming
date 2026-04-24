# Security Review: MarkItDown
**Date:** 2026-04-24
**Report Reviewed:** topics/markitdown/_pipeline/draft-rev2-verdict.md, draft-rev2-overview.md, draft-rev2-notes.md
**Reviewer:** Claude Haiku 4.5 Security Agent

## Security Context
- **Data Sensitivity:** Internal (document processing for LLM ingestion; no direct user data exposure unless documents contain PII)
- **Threat Model (STRIDE):**
  - **S (Spoofing):** MCP server URI spoofing (SSRF enables attacker to inject arbitrary URIs)
  - **T (Tampering):** Malicious document payload via CVE-2025-11849, CVE-2025-64512 pickle deserialization
  - **R (Repudiation):** N/A
  - **I (Information Disclosure):** Directory traversal (CVE-2025-11849), file read via SSRF, metadata exfiltration (AWS IMDSv1)
  - **D (Denial of Service):** /dev/random linking (CVE-2025-11849), resource exhaustion via large/complex PDFs
  - **E (Elevation of Privilege):** Code execution via pickle deserialization (pdfminer.six CVE-2025-64512)
- **Applicable Compliance:** None identified (no regulated data frameworks; general security best practices apply)

## Findings

### Finding 1: CVE-2025-64512 — Critical RCE in pdfminer.six Dependency (CRITICAL, NOT COVERED IN DRAFTS)
- **Severity:** CRITICAL
- **Category:** Supply chain, Data exposure, Access control
- **STRIDE Category:** E (Elevation of Privilege), T (Tampering)
- **Recommendation Affected:** All recommendations in draft-rev2-verdict.md. This affects any MarkItDown deployment processing untrusted PDFs.
- **Issue:** MarkItDown depends on pdfminer.six for PDF parsing. CVE-2025-64512 (published 2025) is an arbitrary code execution vulnerability in pdfminer.six <20251107. The CMap loading mechanism uses `pickle.loads()` without validation. A malicious PDF can specify a custom directory and filename (ending in `.pickle.gz`) that contains a pickled Python object with embedded code. When the PDF is processed, the pickle file is deserialized and the code executes automatically. **The drafts completely omit this CRITICAL vulnerability.** This is not a theoretical risk—it's a known publicly disclosed CVE affecting a direct dependency in the PDF parsing chain.
- **Evidence:** 
  - GitHub Advisory GHSA-wf5f-4jwr-ppcp: "Arbitrary Code Execution in pdfminer.six via Crafted PDF Input"
  - NVD CVE-2025-64512 (CVSS 9.8 — CRITICAL)
  - pdfplumber 0.11.7 (also MarkItDown-adjacent) patched in 0.11.8 due to cascade exposure
  - Fedora/Ubuntu security advisories published 2025
  - Public PoC available (luigigubello polyglot-PoC)
- **Remediation:** 
  1. **Immediate:** Add explicit section to draft-rev2-notes.md under "Security Analysis" → "Vulnerabilities & Fixes" → insert new subsection before XXE vulnerability:
     ```
     - **[CRITICAL — PATCHED]** CVE-2025-64512 (pdfminer.six PDF RCE): Arbitrary Code Execution via Pickle Deserialization
       - **Details:** MarkItDown depends on pdfminer.six (via PDF parsing chain) for PDF extraction. pdfminer.six versions <20251107 use pickle.loads() without validation when loading CMap cache. A malicious PDF can embed a crafted .pickle.gz file that executes arbitrary Python code when the PDF is processed.
       - **Impact:** Remote code execution on any system processing untrusted PDFs with MarkItDown. Complete system compromise.
       - **Fix:** pdfminer.six patched in version 20251107 (patch released Nov 2025). MarkItDown must pin pdfminer.six ≥20251107 or implement upstream pickle validation.
       - **Current Status:** VERIFY that MarkItDown's pyproject.toml pins pdfminer.six ≥20251107. If not, MarkItDown users are exposed to RCE on any untrusted PDF.
       - **Mitigation:** (1) Verify MarkItDown pins pdfminer.six ≥20251107. (2) Run `pip list | grep pdfminer` to confirm version. (3) Implement document provenance validation (trusted source only for PDFs).
       — [GitHub Advisory GHSA-wf5f-4jwr-ppcp](https://github.com/advisories/GHSA-wf5f-4jwr-ppcp), [NVD CVE-2025-64512](https://nvd.nist.gov/vuln/detail/CVE-2025-64512), [Ubuntu Security](https://ubuntu.com/security/CVE-2025-64512)
     ```
  2. **Report Change:** Add to draft-rev2-verdict.md Risks & Caveats section (after CVE-2025-11849):
     ```
     - **[CRITICAL]** CVE-2025-64512 (pdfminer.six RCE): Arbitrary code execution via malicious PDF. MarkItDown must pin pdfminer.six ≥20251107. Any untrusted PDF processed with older versions is a code-execution vector. **Mitigation:** Verify version pinning; process only trusted PDFs. — [GHSA-wf5f-4jwr-ppcp](https://github.com/advisories/GHSA-wf5f-4jwr-ppcp), [CVE-2025-64512](https://nvd.nist.gov/vuln/detail/CVE-2025-64512)
     ```
  3. **Invalidation Check:** Add to draft-rev2-verdict.md "Recommendation Invalidation Conditions" (after condition 5):
     ```
     11. **Critical CVE in pdfminer.six Pickle Handling:** If MarkItDown does not pin pdfminer.six ≥20251107 (CVE-2025-64512 patch), or if a regression/downgrade occurs, the recommendation to CONDITIONAL ADOPT is INVALIDATED. RCE on untrusted PDFs disqualifies deployment. Recommend text-extraction fallback only (skip PDF processing via MarkItDown) until pinning is verified.
     ```

### Finding 2: CVE-2025-11849 (Mammoth) — Handled Correctly but Verification Gap
- **Severity:** HIGH
- **Category:** Supply chain, Data exposure
- **STRIDE Category:** T (Tampering), I (Information Disclosure)
- **Recommendation Affected:** All recommendations in draft-rev2-verdict.md and draft-rev2-notes.md
- **Issue:** The drafts correctly identify CVE-2025-11849 (Directory Traversal in mammoth, CVSS 5.4–6.4). The fix (mammoth ≥1.11.0) is correctly stated as pinned in MarkItDown v0.1.4+. However, the drafts do NOT emphasize that **the fix disabled external file access entirely** (changed behavior, not just a patch). This is a breaking change that could affect legitimate DOCX processing workflows. Additionally, the drafts note "Teams using 0.1.0–0.1.3 with locked old mammoth versions remain exposed" but do NOT provide concrete lock-file scanning commands or CI/CD integration guidance.
- **Evidence:** 
  - GitHub Security Advisory GHSA-rmjr-87wv-gf87 (verified in Web search)
  - Snyk SNYK-JS-MAMMOTH-13554470
  - NVD CVE-2025-11849 (CVSS base 5.4–6.4 per CVSS v3.1)
  - GitHub PR #1520 (MarkItDown pinning)
- **Remediation:** 
  1. **Enhancement to draft-rev2-notes.md** (under CVE-2025-11849 subsection, after current text):
     ```
     - **Behavior Change:** The fix in mammoth ≥1.11.0 DISABLES external file access entirely (r:link attributes in DOCX are ignored). This is a breaking change if your workflow relies on external image embedding. Verify this is acceptable for your document corpus before upgrading.
     ```
  2. **Add to draft-rev2-verdict.md Next Steps (after step 1):**
     ```
     1b. **Lock-File Audit:** Run `pip freeze | grep mammoth` (or check poetry.lock, requirements.lock). If version <1.11.0 appears, update immediately. Add to CI/CD: `pip-audit --skip-editable` to scan transitive dependencies.
     ```

### Finding 3: MCP SSRF Risk — Severity and Mitigation Correctly Stated
- **Severity:** MEDIUM (correctly calibrated)
- **Category:** Access control, Data exposure
- **STRIDE Category:** T (Tampering), I (Information Disclosure)
- **Recommendation Affected:** draft-rev2-notes.md, draft-rev2-verdict.md (sections on MCP deployment)
- **Issue:** The drafts correctly identify the MCP SSRF risk and cite BlueRock research. The mitigation (upstream URI allowlists, Authorization layer, prefer `convert_local()`) is appropriate. However, the drafts do NOT explicitly state that this vulnerability affects **36.7% of all MCP servers in the wild** (per BlueRock), meaning SSRF is endemic in MCP ecosystem design, not MarkItDown-specific. This context is important for risk assessment. Additionally, the drafts say "implement URI scheme/path allowlists UPSTREAM" but do NOT provide code examples or reference implementations.
- **Evidence:** 
  - BlueRock "MCP fURI" research: https://www.bluerock.io/post/mcp-furi-microsoft-markitdown-vulnerabilities
  - Confirmed 36.7% MCP server SSRF exposure rate
  - AWS IMDSv1 metadata exfiltration scenario validated
- **Remediation:** 
  1. **Clarification to draft-rev2-notes.md** (MCP Deployment Risk section):
     ```
     - **(3) Ecosystem Context:** BlueRock analysis of 7,000+ MCP servers found 36.7% have potential SSRF vulnerabilities. MarkItDown MCP SSRF is NOT unique; it reflects broader MCP ecosystem design gaps. However, this makes URI validation MANDATORY for MarkItDown MCP.
     ```
  2. **Add reference to draft-rev2-verdict.md Next Steps:**
     ```
     5a. **MCP URI Allowlist Example:** If using MCP, implement upstream URI validation:
         ```python
         ALLOWED_SCHEMES = {'http', 'https'}  # Explicitly block file://, ftp://, gopher://
         ALLOWED_HOSTS = ['internal.company.com', 'cdn.trusted.com']  # Whitelist only
         
         def validate_uri(uri):
             parsed = urllib.parse.urlparse(uri)
             if parsed.scheme not in ALLOWED_SCHEMES:
                 raise ValueError(f"Scheme {parsed.scheme} not allowed")
             if parsed.netloc not in ALLOWED_HOSTS:
                 raise ValueError(f"Host {parsed.netloc} not in allowlist")
             return uri
         ```
     ```

### Finding 4: XXE Vulnerability — Correctly Patched and Noted
- **Severity:** MEDIUM (historical, patched)
- **Category:** Data exposure
- **STRIDE Category:** I (Information Disclosure), T (Tampering)
- **Recommendation Affected:** Historical context; no active recommendations affected
- **Issue:** The drafts correctly note the XXE vulnerability (fixed in v0.1.2 via defusedxml). No action needed; this finding is correctly documented and mitigated.
- **Evidence:** GitHub releases confirm v0.1.2 (May 2024) migration to defusedxml
- **Remediation:** No changes needed; correctly documented.

### Finding 5: Plugin Security Model — Correctly Flagged as Medium Risk
- **Severity:** MEDIUM (correctly calibrated)
- **Category:** Access control
- **STRIDE Category:** E (Elevation of Privilege)
- **Recommendation Affected:** draft-rev2-notes.md (Plugin Security subsection)
- **Issue:** The drafts note that plugins execute arbitrary Python code and are disabled by default. The mitigation (source-code review, sandboxing) is appropriate. However, the drafts do NOT explicitly warn against enabling plugins in **multi-tenant environments** or when **untrusted users can register plugins**. This is important because the plugin security model relies entirely on human review, not cryptographic validation.
- **Evidence:** GitHub plugin documentation; no formal security model published by Microsoft
- **Remediation:** 
  1. **Enhance draft-rev2-notes.md** (Plugin Security subsection):
     ```
     - **Multi-Tenant Risk:** Enabling plugins in multi-tenant or shared environments (where untrusted users can register custom plugins) is NOT RECOMMENDED without additional controls: (1) source-code review by security team, (2) plugin sandboxing via containerization, (3) capability restriction (no network, no file system). Default-disabled is correct for production.
     ```

### Finding 6: Dependency Supply Chain — Comprehensive Coverage, But Missing pdfminer.six Clarity
- **Severity:** HIGH
- **Category:** Supply chain
- **STRIDE Category:** T (Tampering), E (Elevation of Privilege)
- **Recommendation Affected:** All recommendations; draft-rev2-notes.md (Dependency Supply Chain subsection)
- **Issue:** The drafts list 25 dependencies and recommend `pip-audit` and Snyk scanning. This is good practice. However, the drafts list "Core PDF: pdfminer.six, pdfplumber, pypdf" but do NOT highlight that **pdfminer.six has a CRITICAL RCE CVE (CVE-2025-64512)** active at time of review. The drafts should explicitly call out pdfminer.six as a high-risk dependency requiring version pinning.
- **Evidence:** CVE-2025-64512 and pdfplumber cascade exposure (verified in Web search)
- **Remediation:** Update draft-rev2-notes.md Dependency Supply Chain section to add pdfminer.six explicitly:
  ```
  - **High-Risk Dependency:** pdfminer.six (PDF parsing): CVE-2025-64512 (RCE via pickle) requires pinning ≥20251107. Verify lock file; consider text-extraction fallback if pdfminer.six version cannot be guaranteed.
  ```

### Finding 7: Unverified Claims on SSRF Allowlists/Rate Limits — Correctly Isolated
- **Severity:** INFORMATIONAL
- **Category:** Documentation, risk assessment
- **STRIDE Category:** N/A
- **Recommendation Affected:** draft-rev2-notes.md (Gaps & Unknowns, Critical Gaps section)
- **Issue:** The drafts note that URL fetching allowlists and rate limits are unverified. This is correctly isolated in the "UNVERIFIED CLAIMS" section and flagged as a critical gap. No remediation needed; correctly scoped.
- **Evidence:** Director's research note (documented in draft)
- **Remediation:** No changes needed; correctly marked as unverified and requiring source-code audit.

### Finding 8: 47% Accuracy Baseline — Correctly Emphasized as Requiring Fallback
- **Severity:** INFORMATIONAL
- **Category:** Design trade-off, operational risk
- **STRIDE Category:** N/A
- **Recommendation Affected:** All recommendations; draft-rev2-verdict.md, draft-rev2-notes.md
- **Issue:** The drafts repeatedly and correctly emphasize that 47% accuracy baseline requires fallback validation. This is NOT a security finding per se, but an operational caveat. The mitigation (fallback to Docling, Azure DI, manual review) is sound and reusable across pipelines. No security concerns identified.
- **Evidence:** ChatForest benchmark (proprietary, but cited consistently)
- **Remediation:** No changes needed; correctly scoped.

## Vendor/Tool Security Check

| Tool/Vendor | Version Checked | Recent CVEs (2025-2026) | Known Incidents | Last Security Update | Notes |
|---|---|---|---|---|---|
| **MarkItDown** | v0.1.5 (Feb 2026) | CVE-2025-11849 (mammoth, PATCHED v0.1.4+) | None directly | Feb 2026 release | Pre-1.0; expect API churn. Depends on vulnerable transitive deps. |
| **mammoth** | ≥1.11.0 (pinned by MarkItDown v0.1.4+) | CVE-2025-11849 (directory traversal, PATCHED) | None recent | Jan 2025 patch | External file access disabled in ≥1.11.0; breaking change but necessary. |
| **pdfminer.six** | Pinning UNVERIFIED in MarkItDown pyproject.toml | **CVE-2025-64512 (RCE via pickle, CRITICAL)** | Multiple public PoCs | Nov 2025 patch (20251107) | **CRITICAL FINDING:** Drafts do not verify MarkItDown pins ≥20251107. |
| **pdfplumber** | Indirect via pdfminer.six | CVE-2025-64512 cascade (patched 0.11.8) | Fedora/Ubuntu advisories | Dec 2025 patch | Transitive cascade risk. |
| **python-pptx** | Part of [all] install | No CVEs found 2025-2026 | None recent | Active maintenance | Low risk. |
| **openpyxl** | Part of [all] install | No CVEs found 2025-2026 | None recent | Active maintenance | Low risk. |
| **lxml** | Part of [all] install | No CVEs found 2025-2026 | None recent | Active maintenance | XML parsing; XXE mitigated upstream in MarkItDown. |
| **azure-ai-documentintelligence** | Optional dependency | No CVEs found 2025-2026 | None recent | Active (Microsoft-backed) | Low risk; SaaS platform. |

## Benchmark Metrics
- **Required changes issued:** 2 (CRITICAL: pdfminer.six CVE-2025-64512 coverage; HIGH: Mammoth behavior-change clarification)
- **Must-survive changes:** 2 (CRITICAL findings must be addressed)
- **Critical findings:** 1 (CVE-2025-64512 RCE omission)
- **High findings:** 2 (CVE-2025-11849 incomplete context; Dependency supply chain pdfminer.six emphasis)
- **Medium findings:** 3 (MCP SSRF ecosystem context; Plugin multi-tenant risk; pdfminer.six high-risk designation)
- **Informational findings:** 2 (Unverified claims correctly isolated; Accuracy baseline correctly emphasized)

## Compliance Notes
No compliance frameworks identified for this topic. MarkItDown is evaluated as an infrastructure tool for LLM/RAG preprocessing, not a regulated data processing system. General security best practices apply (version pinning, dependency scanning, input validation, least-privilege deployment).

## Verdict: FLAG

**Recommendation:** The verdict is **FLAG** — the MarkItDown recommendation in draft-rev2-verdict.md cannot be published as-is. Two critical/high-severity security findings require immediate remediation:

1. **CRITICAL:** CVE-2025-64512 (pdfminer.six RCE) is not mentioned in the drafts. This is a known public CVE affecting a direct MarkItDown dependency at time of review. RCE on untrusted PDFs is a severe risk that must be documented.
2. **HIGH:** Dependency supply chain section does not emphasize pdfminer.six as a high-risk dependency requiring explicit version pinning verification.

The "CONDITIONAL ADOPT" verdict is sound given the pre-flagged concerns (CVE-2025-11849, XXE, MCP SSRF) are correctly documented. However, the NEW CVE-2025-64512 finding fundamentally changes the risk profile for **PDF processing specifically**. The drafts must add explicit guidance that PDFs from untrusted sources should NOT be processed via MarkItDown until pdfminer.six version pinning is verified.

## Required Report Changes

| Priority | File | Section | Required Change | Must Survive | Acceptance Criteria |
|---|---|---|---|---|---|
| 1 | draft-rev2-notes.md | Security Analysis → Vulnerabilities & Fixes | **INSERT NEW SUBSECTION after line 73 (before XXE):** CVE-2025-64512 (pdfminer.six RCE) with full details, impact, fix, mitigation (see Finding 1 remediation text above) | **Yes** | New subsection appears with accurate CVSS 9.8, patch version 20251107, note about untrusted PDFs |
| 2 | draft-rev2-verdict.md | Risks & Caveats → Security Caveats | **INSERT after line 138 (after CVE-2025-11849):** HIGH-level CVE-2025-64512 summary pointing to draft-rev2-notes.md for details | **Yes** | Reference to pdfminer.six RCE appears with mitigation (version pinning, trusted PDF sources only) |
| 3 | draft-rev2-verdict.md | Recommendation Invalidation Conditions | **INSERT NEW CONDITION after condition 5 (after line 107):** Condition 11 for pdfminer.six pickle regression (see Finding 1 remediation) | **Yes** | New condition 11 appears, references CVE-2025-64512 patch requirement |
| 4 | draft-rev2-notes.md | Dependency Supply Chain Risk | **ENHANCE line 85–90** to explicitly call out pdfminer.six with "High-Risk Dependency" note including CVE-2025-64512 reference | **Yes** | pdfminer.six explicitly flagged as high-risk; version pinning ≥20251107 mentioned |
| 5 | draft-rev2-notes.md | CVE-2025-11849 subsection | **ENHANCE after line 72** to add Behavior Change note about external file access disabling | **No** | Behavior change documented; helps operators understand breaking change |
| 6 | draft-rev2-verdict.md | Next Steps | **ENHANCE step 1** to add "1b. Lock-File Audit" with pip freeze and CI/CD scanning guidance | **No** | Concrete scanning commands provided for operators |
| 7 | draft-rev2-notes.md | MCP Deployment Risk section | **ENHANCE after line 104** to add ecosystem context (36.7% MCP SSRF prevalence) | **No** | Context added; helps understand SSRF is endemic, not MarkItDown-unique |
| 8 | draft-rev2-verdict.md | Next Steps → "5. MCP Deployment (if applicable)" | **ENHANCE with Python code example** for URI allowlist validation | **No** | Code example provided; helps operators implement mitigation |
| 9 | draft-rev2-notes.md | Plugin Security subsection | **ENHANCE after line 97** to add multi-tenant risk warning | **No** | Multi-tenant scenario documented; helps operators understand plugin risk scope |

## Summary for Director

**Status: FLAG** — Two critical/high-severity findings require remediation before publication.

**Critical Finding:** CVE-2025-64512 (pdfminer.six arbitrary code execution via malicious PDF pickle files) is completely missing from the drafts. This is a known public CVE (NVD, GitHub Advisory, Ubuntu/Fedora security notices) affecting a direct MarkItDown dependency. RCE on untrusted PDFs is a severe risk that fundamentally changes the PDF processing threat model.

**Why This Matters:** The drafts recommend CONDITIONAL ADOPT with mitigation for CVE-2025-11849 (mammoth) and MCP SSRF. These are appropriately documented. However, a CRITICAL RCE vulnerability in the PDF parsing stack (pdfminer.six < 20251107) is not mentioned at all. This is a gap that must be closed before the recommendation is published.

**Action Required:** 
1. Add detailed CVE-2025-64512 section to draft-rev2-notes.md Security Analysis
2. Update draft-rev2-verdict.md to reference pdfminer.six RCE in Risks & Caveats and Invalidation Conditions
3. Enhance Dependency Supply Chain section to flag pdfminer.six as high-risk
4. Add 3 secondary enhancements (behavior change clarification, SSRF ecosystem context, plugin multi-tenant warning, URI allowlist code example) for completeness

All changes are text-only; they do NOT alter the "CONDITIONAL ADOPT" verdict, but they complete the security audit by closing a critical CVE coverage gap.

---

**Report Date:** 2026-04-24
**Reviewer:** Claude Haiku 4.5 Security Agent
**Review Type:** Full Security Audit of Approved Drafts (Revision 2)
**Status:** FLAG — Pending remediation of CRITICAL CVE-2025-64512 coverage

Sources:
- [GitHub Advisory GHSA-wf5f-4jwr-ppcp: pdfminer.six RCE](https://github.com/advisories/GHSA-wf5f-4jwr-ppcp)
- [NVD CVE-2025-64512](https://nvd.nist.gov/vuln/detail/CVE-2025-64512)
- [Ubuntu Security: CVE-2025-64512](https://ubuntu.com/security/CVE-2025-64512)
- [Snyk: mammoth CVE-2025-11849](https://security.snyk.io/vuln/SNYK-JS-MAMMOTH-13554470)
- [GitHub Advisory GHSA-rmjr-87wv-gf87: mammoth](https://github.com/advisories/GHSA-rmjr-87wv-gf87)
- [BlueRock: MCP fURI MarkItDown SSRF](https://www.bluerock.io/post/mcp-furi-microsoft-markitdown-vulnerabilities)
- [Dark Reading: MCP Servers RCE Risk](https://www.darkreading.com/application-security/microsoft-anthropic-mcp-servers-risk-takeovers)
