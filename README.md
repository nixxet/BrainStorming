# BrainStorming

BrainStorming is a Claude Code research pipeline and markdown knowledge base for evaluating tools, frameworks, libraries, and technical ideas before adopting them.

It is designed to produce evidence-backed topic folders:

- `overview.md` — what the thing is, major concepts, sources, and key context
- `notes.md` — findings, confidence ratings, caveats, and unresolved questions
- `verdict.md` — recommendation, risks, alternatives, and next steps

This public edition is sanitized for sharing. It keeps reusable pipeline structure and topic writeups, but omits private scratch files, local certificates, internal project-fit notes, and pipeline audit artifacts.

## Repository Structure

```text
BrainStorming/
  .claude/
    agents/              Research pipeline agent definitions
    skills/              Entry-point skills for research workflows
  scripts/               Utility scripts for indexes, validation, citations, and staleness
  topics/
    {topic-slug}/
      overview.md
      notes.md
      verdict.md
  archived-topics.md     Retired or superseded topic registry
  diagram.md             Pipeline diagrams
  index.md               Active topic registry
```

## Workflows

| Workflow | Use When |
| --- | --- |
| `/research [topic]` | Explore a topic broadly |
| `/quick [topic]` | Run a faster lightweight pass |
| `/compare [A] vs [B]` | Compare options side by side |
| `/evaluate [item]` | Evaluate one tool, repo, or claim deeply |
| `/recommend [problem]` | Start with a problem and rank possible solutions |
| `/cross-analyze [theme]` | Synthesize patterns across existing topic files |

## Requirements

- Node.js 22 or newer. The repository includes `.nvmrc` and `package.json` engine metadata.
- npm for running local validation, export, and reporting scripts.

## Pipeline

The full workflow is a Director-orchestrated multi-agent pipeline:

1. Intake and topic classification
2. Parallel broad research and adversarial investigation
3. Gap fill for weak or single-source claims
4. Evidence synthesis and confidence scoring
5. Drafting of overview, notes, and verdict
6. Critic scoring against an 8-dimension rubric
7. Conditional security review
8. Stress testing and adversarial challenge
9. Publication and index update

## Quality Standard

Published outputs are intended to be gated at `8.0/10` or higher.

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

Every major finding should carry a confidence rating: `HIGH`, `MEDIUM`, `LOW`, or `UNVERIFIED`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run preflight:all` | Run local syntax, topic, state, staleness, and test gates |
| `npm run release:check` | Run local preflight, secret scan, and public export |
| `npm run regenerate-index` | Rebuild topic indexes from published verdict files |
| `npm run index:leadership` | Generate the leadership-facing `topics/index.md` |
| `npm run dashboard` | Generate a local static dashboard under `dist/dashboard/` |
| `npm run validate-pipeline-state` | Validate topic pipeline metadata when present |
| `npm run validate:schemas` | Validate pipeline state and evidence files against repository schemas |
| `npm run validate-pipeline-state:repair` | Apply safe derived repairs to topic pipeline metadata |
| `npm run bench-report` | Generate a quality benchmark report |
| `npm run trend-report` | Generate an operations trend report from benchmark and citation data |
| `npm run claims:check` | Heuristically flag claim-like lines that need direct source review |
| `npm run claims:check:strict` | Fail when published claims lack direct, registry, nearby, or internal-analysis support |
| `npm run verify-citations -- --topic {slug}` | Check URL reachability for one topic |
| `npm run verify-citations:all` | Check URL reachability across topics |
| `npm run verify-citations:all -- --concurrency 5 --cache --cache-ttl-days 7` | Check citations with bounded concurrency and TTL URL cache |
| `npm run check-staleness:report` | Flag stale topics by decay class |
| `npm run topic-init` | Scaffold a new topic folder |
| `npm run topic-validate:all` | Validate published topic structure |
| `npm run export:public` | Create a sanitized public export under `dist/public/` (also emits `dist/public/index.json`) |
| `npm run lint:agents` | Lint all agent spec files for required frontmatter and sections |
| `npm run diagnose-run -- --topic {slug}` | Diagnose a stalled or failed pipeline run, with recovery suggestions |
| `npm run diagnose-run:all` | Diagnose pipeline status for all topics |
| `npm run prune-citation-cache` | Remove citation cache entries older than 180 days |
| `npm run prune-citation-cache:dry` | Preview citation cache pruning without writing |

## Resuming an Interrupted Pipeline

If a pipeline run is interrupted (agent error, budget exhaustion, session disconnect), the Director writes the current phase to `_pipeline/state.json`. Resuming is safe and automatic:

1. **Check pipeline status:** `npm run diagnose-run -- --topic {slug}` — shows which phases completed, which failed, and what to do next.
2. **Re-invoke the pipeline skill** for the same topic using the same workflow (e.g., `/evaluate {topic}`). The Director reads the existing state and skips already-completed phases.
3. **If state.json is corrupt** (parse error or impossible state): `npm run validate-pipeline-state:repair -- --topic {slug}` will apply safe derived repairs.
4. **If the run is fully stuck** (all phases pending despite artifacts existing): run `npm run validate-pipeline-state:repair` to sync state from on-disk artifacts, then re-invoke.

For detailed recovery guidance, see [docs/recovery.md](docs/recovery.md).

## Quickstart

1. Start a topic through Claude Code, for example: `/evaluate "Tool X for use case Y"`.
2. Validate local health, including strict claim-support checks: `npm run preflight:all`.
3. Optionally verify network citations: `npm run preflight:network`.
4. Generate a benchmark report when needed: `npm run bench-report`.
5. Generate leadership views when needed: `npm run index:leadership && npm run dashboard && npm run trend-report`.
6. Create a public-safe export: `npm run export:public`.

## Public Export Model

BrainStorming treats `_pipeline/` artifacts as private internal audit data by default. Public releases should be generated through `npm run export:public`, which copies public deliverables and excludes private pipeline state, drafts, evidence internals, citation JSON, `_meta/`, temporary files, and common secret/certificate file types.

Public topic deliverables are:

- `topics/{topic-slug}/overview.md`
- `topics/{topic-slug}/notes.md`
- `topics/{topic-slug}/verdict.md`

Private/internal artifacts include:

- `topics/{topic-slug}/_pipeline/`
- `topics/_meta/`
- raw user requests
- draft files
- scorecards, stress tests, and raw evidence files

## Publishing Notes

Before making a fork or mirror public:

1. Run a secret scanner such as `trufflehog filesystem . --only-verified`.
2. Search for organization names, personal names, local paths, and private project names.
3. Run `npm run export:public`.
4. Publish from the generated `dist/public/` folder or from a fresh repository, not from private repo history.

## License

MIT. See [LICENSE](LICENSE).
