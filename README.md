# BrainStorming

A Claude Code plugin for evidence-backed technical research. Ask about a tool, framework, library, or approach and get either a fast cited answer or a full audited dossier with an explicit recommendation.

- **Fast by default.** `/brainstorming:research <question>` runs one live-web pass, answers in chat, and checks that every cited link resolves before it finishes.
- **Audited on request.** Add `--deep` (or use `compare`, `evaluate`, `recommend`) to run a multi-agent pipeline: parallel research, evidence synthesis, drafting, a quality gate, stress testing, and an adversarial challenge before anything is written.
- **No dead links, no invented sources.** Citations are checked, unsupported claims are flagged, and confidence levels are stated for every finding.

## Install

Requires Claude Code and Node.js 22 or later.

```
/plugin install brainstorming --marketplace nixxet/BrainStorming
```

On older Claude Code versions, add the marketplace first:

```
/plugin marketplace add nixxet/BrainStorming
/plugin install brainstorming@brainstorming
```

## Commands

| Command | What it does |
|---|---|
| `/brainstorming:research <topic>` | Fast cited answer in chat (about 1-2 minutes). Add `--deep` for the full audited pipeline. |
| `/brainstorming:compare <A> vs <B>` | Side-by-side evaluation with normalized criteria and a "choose A when / choose B when" verdict. |
| `/brainstorming:evaluate <item>` | Deep evaluation of one product, tool, or approach: claims versus evidence, strengths, weaknesses, verdict. |
| `/brainstorming:recommend <problem>` | Problem-first: researches candidate solutions, ranks them, and recommends one with a runner-up. |
| `/brainstorming:cross-analyze <theme>` | Reads your existing topics (no new web research) and reports recurring patterns and risks. |

The full pipeline uses several Opus and Sonnet subagents, so a deep run costs noticeably more than a fast one. The default per-run budget cap is in [`config.json`](config.json); it is a tracking signal, not a hard stop.

## Where output goes

Research is written to the directory you run Claude Code in (your workspace), not into the plugin:

```text
your-workspace/
  topics/{topic-slug}/
    overview.md     what it is, key concepts, sources
    notes.md        findings with confidence ratings and citations
    verdict.md      recommendation, risks, alternatives, next steps
    _pipeline/      run state and audit artifacts (add to .gitignore)
  index.md          active topics with one-line verdicts
  archived-topics.md
```

To point the scripts at a different workspace, set `BRAINSTORMING_WORKSPACE`. To override settings such as the budget cap, put a `config.json` in your workspace.

## Optional: semantic claim check

The deep pipeline always checks that each cited page is related to the claim it supports. If `GEMINI_API_KEY` is set in your environment, it also asks a Gemini model whether ambiguous sources actually support or contradict the claim. Without a key, those cases are reported as inconclusive and never fail the run.

## Examples

[`archived-topics.md`](archived-topics.md) lists three example outputs from earlier versions of the pipeline (`topics/markitdown/`, `topics/markitdown-v1/`, `topics/open-design/`). They show the file structure and writing style; they predate some of the current citation checks.

## How it works

See [`diagram.md`](diagram.md) for the phase-by-phase architecture, [`docs/quality-standard.md`](docs/quality-standard.md) for the quality bar, and [`docs/reliability/FAILURE_MODES.md`](docs/reliability/FAILURE_MODES.md) for the failure modes the gates exist to catch.

## Development

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
