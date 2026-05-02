---
title: Topic Verification Audit
created: 2026-05-02
status: in_progress
scope:
  - topics/markitdown
  - topics/markitdown-v1
  - topics/open-design
---

# Topic Verification Audit — 2026-05-02

## Pass 1 Completed

Checked all active topic folders:

- `topics/markitdown`
- `topics/markitdown-v1`
- `topics/open-design`

Mechanical checks completed:

- All JSON artifacts under active topic pipelines parse successfully.
- External links were extracted and tested with HTTP HEAD/GET.
- Live GitHub API metadata was checked for:
  - `microsoft/markitdown`
  - `OpenCoworkAI/open-codesign`
  - `nexu-io/open-design`
- MarkItDown `pyproject.toml` was checked at both `v0.1.5` and `main`.
- Open Design and Open CoDesign READMEs were checked for current counts and architecture claims.

## Corrections Applied

### MarkItDown

- Updated live adoption count from older 87k/91k star figures to ~119,300 stars and ~7,900 forks as of 2026-05-02.
- Replaced broken Mammoth source URL `github.com/felicette/mammoth.py` with `github.com/mwilliamson/python-mammoth`.
- Corrected dependency-security framing:
  - `microsoft/markitdown` `v0.1.5` currently declares `pdfminer.six>=20251230`.
  - `v0.1.5` currently declares `mammoth~=1.11.0`.
  - Older "v0.1.5 is unpatched" wording was stale and has been replaced with dependency-resolution verification guidance.
- Fixed `markitdown-v1` verdict footer from `topics/markitdown/_pipeline/` to `topics/markitdown-v1/_pipeline/`.

### Open Design

- Updated Open Design skill count language to 31 built-in skills based on the current README.
- Softened exact design-system count claims because the README simultaneously advertises a 72-count badge and a 129-count table entry after including imported design skills.
- Updated Open CoDesign adoption language to ~4,000 GitHub stars as of 2026-05-02.
- Updated Open Design adoption note to ~12.2k GitHub stars as of 2026-05-02.

## Additional Claims Checked

- Claude Design release/date/core feature claim: verified against Anthropic's 2026-04-17 announcement. The announcement says Claude Design is an Anthropic Labs product for designs, prototypes, slides, one-pagers, and similar visual work; it is powered by Claude Opus 4.7 and available in research preview for Pro, Max, Team, and Enterprise subscribers.
- DESIGN.md provenance/status: checked against a current DESIGN.md specification page pointing to Google Labs / Google Stitch. Status appears alpha and moving; treat adoption-count claims as separate and still unverified.

## Links With Issues

- `https://github.com/felicette/mammoth.py` returned 404 and was corrected.
- `https://itbusinessnet.com/2026/02/how-it-leaders-can-build-a-future-proof-document-pipeline-for-ai-systems/` timed out during follow-up link checks; earlier GET returned 200. Treat as unstable and re-check.

## Remaining Verification Queue

These should be checked in the next pass:

1. Re-verify Open Design claims that depend on fast-moving market context:
   - DESIGN.md adoption count.
   - Figma market share and stock reaction claims.
   - ShadCN/UI block/icon counts.
2. Re-verify MarkItDown quality metrics against primary benchmark pages:
   - OpenDataLoader scores.
   - Docling score/table accuracy claims.
   - DEV.to mixed-format success-rate claim.
   - Yage.ai survey numbers.
3. Decide whether `markitdown-v1` should remain as a historical snapshot or be marked superseded by `markitdown`.
4. Run a full content consistency diff between final files and `_pipeline/verified-synthesis.md` for each topic.
5. Re-run external link checks with GET fallback and record status codes in a machine-readable artifact.

## Suggested Next Command Batch

```powershell
rg -n "Claude Design|DESIGN.md|Figma|ShadCN|OpenDataLoader|Docling|Yage|DEV.to" BrainStorming\topics
```

Then verify the highest-risk claims against primary or official sources first.
