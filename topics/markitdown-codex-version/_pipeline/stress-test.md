---
title: Microsoft MarkItDown — Stress Test
tags: [testing, adoption, pipeline]
created: 2026-04-24
---

# Microsoft MarkItDown — Stress Test

## Test Summary

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 2 |
| Medium | 4 |
| Low | 6 |

## Verdict

CONDITIONAL. The recommendation holds if the adoption path includes corpus validation and input containment.

## Scenarios

1. Trusted local DOCX batch conversion: PASS.
2. Trusted local PDF ingestion for search indexing: CONDITIONAL; validate tables and lists.
3. User-supplied URL conversion in a hosted service: HIGH risk; add URL allowlists and egress controls.
4. User-supplied local file path conversion: HIGH risk; restrict paths and isolate process.
5. Broad `[all]` install in production: MEDIUM risk; prefer narrow extras.
6. MCP exposed beyond localhost: MEDIUM risk; require authentication and network controls.
7. Layout-critical legal archive conversion: MEDIUM risk; use a fidelity-oriented tool or manual QA.
8. OCR-heavy scanned PDFs: MEDIUM risk; compare with OCR/document AI pipeline.
9. Agent desktop workflow with trusted files: PASS.
10. CI job converting documentation assets: PASS with dependency pinning.
11. Third-party plugin use: LOW to MEDIUM risk depending on plugin provenance.
12. Long-term standardization without release monitoring: LOW risk; schedule review after minor releases.

## Required Report Changes

None. The final verdict should explicitly remain conditional.
