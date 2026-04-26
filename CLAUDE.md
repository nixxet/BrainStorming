# BrainStorming — Research & Knowledge Base

BrainStorming is a standalone research hub for evaluating tools, frameworks, techniques, and ideas.

Default stance:

- Search first for present-day facts.
- Separate evidence from interpretation.
- Prefer specific recommendations over vague summaries.
- Keep topic writeups useful outside any one organization or project.

## Structure

```text
BrainStorming/
  index.md
  archived-topics.md
  topics/
    {topic-slug}/
      overview.md
      notes.md
      verdict.md
  .claude/
    agents/
    skills/
  scripts/
```

## Dispatch Rules

When the user message matches one of these patterns, read `.claude/agents/director.md` and run the matching workflow.

| User Pattern | Workflow |
| --- | --- |
| `new topic: <url or name>` | research |
| `research <topic>` | research |
| `quick <topic>` | quick |
| `compare <A> vs <B>` | compare |
| `evaluate <item>` | evaluate |
| `recommend <problem>` | recommend |
| Bare GitHub/GitLab URL | evaluate |
| `cross-analyze <theme>` | cross-analyze |
| `verify citations [slug\|all]` | verify citations |
| `refresh-stale` | staleness check plus re-research |
| `diagnose <topic-slug>` | run diagnose-run.js for a topic and report |

## Cross-Analyze Workflow

`/cross-analyze` runs the `cross-analyzer` agent (`.claude/agents/cross-analyzer.md`) to synthesize patterns across all topics in a theme area.

**When to use:** After 3+ related topics have been published (e.g., document-conversion tools, LLM SDKs, auth libraries). Cross-analysis surfaces shared risks, recurring trade-offs, and complementary patterns that individual topic verdicts cannot capture.

**How it relates to individual topics:** Cross-analysis findings are written to `topics/_cross/{theme}/cross-analysis.md`. They do not modify individual topic verdicts but may surface invalidation candidates (e.g., "all three tools share dependency X, which has a known CVE"). If cross-analysis reveals a material issue, re-run the relevant topic via the standard pipeline.

**Output:** A `cross-analysis.md` report with: shared patterns, diverging factors, cross-topic risks, and recommended topic re-evaluation candidates. This file is not included in `dist/public/` unless explicitly exported.

## Resuming an Interrupted Pipeline

If a pipeline run is interrupted, re-invoke the same skill for the same topic. The Director reads `_pipeline/state.json` and skips already-completed phases automatically.

If the state file is corrupt or inconsistent: `npm run validate-pipeline-state:repair -- --topic {slug}`.

For diagnostic output: `npm run diagnose-run -- --topic {slug}`.

## Quality Standard

Published output should pass an 8-dimension quality gate:

| Dimension | Weight |
| --- | ---: |
| Evidence Quality | 20% |
| Actionability | 20% |
| Accuracy | 15% |
| Completeness | 15% |
| Objectivity | 10% |
| Clarity | 10% |
| Risk Awareness | 5% |
| Conciseness | 5% |

Rules:

- No unsourced present-day claims.
- Use `HIGH`, `MEDIUM`, `LOW`, or `UNVERIFIED` confidence labels.
- State what is known, what is uncertain, and what would change the recommendation.
- Keep project-specific applicability generic unless the user provides a public project context.
- Do not include secrets, credentials, private paths, private organization names, or internal project names in published topic files.

## Topic Contract

Each completed topic should contain:

- `overview.md` — overview, concepts, stats, links
- `notes.md` — evidence-backed findings and caveats
- `verdict.md` — recommendation, risks, alternatives, next steps

Optional private or local pipeline artifacts should stay out of public mirrors unless deliberately sanitized.

## Maintenance

- Use `scripts/regenerate-index.js` only to repair or rebuild indexes.
- Use `scripts/verify-citations.js` to check URL reachability.
- Use `scripts/check-staleness.js` to flag topics that need refresh.
- Use `scripts/diagnose-run.js --topic {slug}` to diagnose a stalled or failed pipeline run.
- Use `scripts/lint-agents.js` to validate all agent spec files for structural integrity.
- Use `scripts/prune-citation-cache.js` to remove stale citation cache entries.
- Before public release, run secret scanning and text searches for private identifiers.
- To add source label aliases for a topic, edit `scripts/config/source-aliases.json`.

---

*BrainStorming | Research hub for tools, frameworks, and OSS evaluation | Active | 2026-04-25*
