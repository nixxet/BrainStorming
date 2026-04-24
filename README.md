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
| `npm run regenerate-index` | Rebuild topic indexes from published verdict files |
| `npm run validate-pipeline-state` | Validate topic pipeline metadata when present |
| `npm run bench-report` | Generate a quality benchmark report |
| `npm run verify-citations -- --topic {slug}` | Check URL reachability for one topic |
| `npm run verify-citations:all` | Check URL reachability across topics |
| `npm run check-staleness:report` | Flag stale topics by decay class |
| `npm run topic-init` | Scaffold a new topic folder |
| `npm run topic-validate:all` | Validate published topic structure |

## Publishing Notes

Before making a fork or mirror public:

1. Run a secret scanner such as `trufflehog filesystem . --only-verified`.
2. Search for organization names, personal names, local paths, and private project names.
3. Publish from a fresh git repository, not from a private repo history.

## License

MIT. See [LICENSE](LICENSE).
