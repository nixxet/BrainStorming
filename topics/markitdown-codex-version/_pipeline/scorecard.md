---
title: Microsoft MarkItDown — Quality Scorecard
tags: [quality, scorecard, pipeline]
created: 2026-04-24
---

# Microsoft MarkItDown — Quality Scorecard

## Weighted Rubric

| Dimension | Weight | Score | Notes |
| --- | ---: | ---: | --- |
| Evidence Quality | 20% | 8.5 | Uses primary sources: GitHub, README, PyPI, pyproject, MCP README, releases, security page. |
| Actionability | 20% | 8.5 | Gives adoption conditions, implementation controls, and alternatives. |
| Accuracy | 15% | 8.5 | Current release, license, runtime, and security claims are sourced. |
| Completeness | 15% | 8.0 | Covers purpose, formats, install shape, MCP, risks, and alternatives. |
| Objectivity | 10% | 8.0 | Balances popularity and Microsoft maintenance against Beta status and security caveats. |
| Clarity | 10% | 8.5 | Recommendation is direct and scoped. |
| Risk Awareness | 5% | 8.0 | Highlights I/O privileges, MCP exposure, and dependency scope. |
| Conciseness | 5% | 8.0 | Topic is compact but still decision-useful. |

<weighted_total>8.3</weighted_total>
<verdict>PASS</verdict>

## Required Revisions

None. First-pass PASS is justified because the topic is a focused single-tool evaluation using mostly primary sources and carries the main caveats into all draft files.

## Residual Risk

The output should not be treated as a procurement-grade benchmark because no hands-on corpus test was performed.
