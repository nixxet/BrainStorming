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
- Before public release, run secret scanning and text searches for private identifiers.
