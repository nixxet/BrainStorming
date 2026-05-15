# BrainStorming — Research & Knowledge Base

BrainStorming is a standalone research hub for evaluating tools, frameworks, techniques, and ideas.

Default stance: **vertical-agnostic**. Research topics in their native domain, then explicitly extract reusable value for current and future projects.

Repo structure: see [`codebase-map.md`](codebase-map.md). Quality bar: see [`docs/quality-standard.md`](docs/quality-standard.md).

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

**cross-analyze:** Use only after 3+ related topics exist. Output goes to `topics/_cross/{theme}/cross-analysis.md`; does not modify individual topic verdicts but may surface invalidation candidates.

## Resuming an Interrupted Pipeline

Re-invoke the same skill for the same topic. The Director reads `_pipeline/state.json` and skips already-completed phases automatically.

If state is corrupt: `npm run validate-pipeline-state:repair -- --topic {slug}`. For diagnostic output: `npm run diagnose-run -- --topic {slug}`.

## Topic Contract

Each completed topic MUST contain:

- `overview.md` — frontmatter: `title`, `tags`, `created`, `status`
- `notes.md` — evidence-backed findings with confidence ratings
- `verdict.md` — frontmatter: `title`, `tags`, `created`, `status`, `score`, `verdict`
- `_pipeline/state.json` — pipeline run record
- `_pipeline/evidence.json` — source provenance

Local or work-in-progress pipeline artifacts must be sanitized before distribution. Use `npm run export:public` to produce a distribution-safe tree under `dist/public/`.

## Post-Pipeline Security

After every pipeline run, before `git add`:

```bash
npm run security:secrets
npm run verify-citations -- --topic {topic-slug}
trufflehog filesystem topics/{topic-slug}/_pipeline/ --only-verified   # deeper coverage
```

## Maintenance

Operational scripts live in `scripts/`. Common: `check-staleness.js`, `verify-citations.js`, `diagnose-run.js`, `lint-agents.js`, `prune-citation-cache.js`, `check-hygiene.js`, `regenerate-index.js`. Source-alias config: `scripts/config/source-aliases.json`.

## Canonical Contract

**Agents (12):** `director` | `researcher` | `investigator` | `analyzer` | `challenger` | `writer` | `critic` | `gap-fill` | `tester` | `security-reviewer` | `publisher` | `cross-analyzer`

**Skills (5):** `research` | `compare` | `evaluate` | `recommend` | `cross-analyze`

---

*BrainStorming | Research pipeline + knowledge base for tools, frameworks, and ideas | Active | 2026-05-15*
