# BrainStorming — Research & Knowledge Base

BrainStorming is a standalone research hub for evaluating tools, frameworks, techniques, and ideas.

Default stance: **vertical-agnostic**. Research topics in their native domain, then explicitly extract reusable value for current and future projects.

## Structure

```text
BrainStorming/
  index.md               ← Topic registry — one row per topic, auto-updated by Publisher
  archived-topics.md
  topics/
    {topic-slug}/
      overview.md
      notes.md
      verdict.md
      _pipeline/         ← Pipeline artifacts (audit trail, not primary content)
    _meta/               ← Bench reports, citation checks, stale reports
    _cross/              ← Cross-topic pattern analysis (/cross-analyze)
    _tmp/                ← Temporary scratch — never committed
  .claude/
    agents/              ← 12 pipeline agents
    skills/              ← 5 pipeline skills
  scripts/
```

## Running the Pipeline

| Skill | Use When |
|-------|----------|
| `/research [topic]` | Full pipeline — landscape, options, key findings |
| `/quick [topic]` | Fast research — no adversarial challenge, security review, or stress test |
| `/compare [A] vs [B]` | Side-by-side evaluation |
| `/evaluate [item]` | Deep single-item evaluation |
| `/recommend [problem]` | Problem-first — research solutions, rank candidates |
| `/cross-analyze [theme]` | Cross-topic synthesis — reads existing topics only |

## Dispatch Rules

When the user message matches one of these patterns, read `.claude/agents/director.md` and run the matching workflow.

| User Pattern | Workflow | Director Receives |
| --- | --- | --- |
| `new topic: <url or name>` | research | Topic: the URL or name |
| `research <topic>` | research | Topic: the topic text |
| `quick <topic>` | quick | Topic: quick mode (no Investigator, no Phase 5/6/6.5) |
| `compare <A> vs <B>` | compare | Comparison: the full text |
| `evaluate <item>` | evaluate | Evaluate: the item text |
| `recommend <problem>` | recommend | Problem: the problem text |
| Bare GitHub/GitLab URL | evaluate | Evaluate: the URL |
| `cross-analyze <theme>` | cross-analyze | Theme: the theme or keyword |
| `verify citations [slug\|all]` | verify citations | URL verification |
| `refresh-stale` | staleness check plus re-research | Staleness check + re-research |
| `diagnose <topic-slug>` | run diagnose-run.js for a topic and report | Diagnostic: the slug |

**refresh-stale:** Run `npm run check-staleness:report` → present Overdue Topics → user confirms slugs → dispatch as `/research {slug}` with `re_evaluation: true` in state.json.

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

Published output should pass an 8-dimension quality gate (minimum **8.0/10**):

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

- **No unsourced present-day claims.** Every finding: HIGH / MEDIUM / LOW / UNVERIFIED confidence.
- **Anti-fluff:** State what IS. Recommend or don't. Hedge only when evidence conflicts. No superlatives without data.
- **Search-First for Present-Day Facts:** When making any claim about current state — pricing, version numbers, API behavior, feature availability, benchmarks, support status, active maintenance — use WebSearch or WebFetch to verify before writing. Training data is stale by definition for a research tool.
- **Neutrality:** Separate topic-native analysis / reusable patterns / project fit. Evaluate by capability, architectural, operational, risk, and implementation overlap.
- State what is known, what is uncertain, and what would change the recommendation.
- Keep project-specific applicability generic unless the user provides a public project context.
- Do not include secrets, credentials, internal paths, organization names, or internal project names in published topic files.

## Topic Contract

Each completed topic MUST contain:

- `overview.md` — frontmatter: `title`, `tags`, `created`, `status`
- `notes.md` — evidence-backed findings with confidence ratings
- `verdict.md` — frontmatter: `title`, `tags`, `created`, `status`, `score`, `verdict`
- `_pipeline/state.json` — pipeline run record
- `_pipeline/evidence.json` — source provenance

Local or work-in-progress pipeline artifacts must be sanitized before any distribution. Use `npm run export:public` to produce a distribution-safe tree under `dist/public/`.

## Post-Pipeline Security

After every pipeline run, before `git add`:

```bash
npm run security:secrets
npm run verify-citations -- --topic {topic-slug}
```

For deeper coverage:

```bash
trufflehog filesystem topics/{topic-slug}/_pipeline/ --only-verified
```

## Maintenance

- Use `scripts/regenerate-index.js` only to repair or rebuild indexes.
- Use `scripts/verify-citations.js` to check URL reachability.
- Use `scripts/check-staleness.js` to flag topics that need refresh.
- Use `scripts/diagnose-run.js --topic {slug}` to diagnose a stalled or failed pipeline run.
- Use `scripts/lint-agents.js` to validate all agent spec files for structural integrity.
- Use `scripts/prune-citation-cache.js` to remove stale citation cache entries.
- Use `scripts/check-hygiene.js` to enforce the citation floor and topic-folder contract.
- Before distribution, run `npm run security:secrets` and text searches for sensitive identifiers.
- To add source label aliases for a topic, edit `scripts/config/source-aliases.json`.

## Canonical Contract

### Agents (12)
`director` | `researcher` | `investigator` | `analyzer` | `challenger` | `writer` | `critic` | `gap-fill` | `tester` | `security-reviewer` | `publisher` | `cross-analyzer`

### Skills (5)
`research` | `compare` | `evaluate` | `recommend` | `cross-analyze`

---

*BrainStorming | Research pipeline + knowledge base for tools, frameworks, and ideas | Active | 2026-05-12*
