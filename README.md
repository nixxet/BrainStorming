# BrainStorming

Published research topics on tools, frameworks, libraries, and technical ideas — exported from the canonical [BrainStorming-Priv](https://github.com/) working tree.

This mirror holds **evidence-backed topic writeups** only. The multi-agent research pipeline (agents, skills, validation scripts) lives in BrainStorming-Priv and is intentionally absent here.

## Topic structure

Each topic folder contains:

- `overview.md` — what the thing is, major concepts, sources, and key context
- `notes.md` — findings, confidence ratings, caveats, and unresolved questions
- `verdict.md` — recommendation, risks, alternatives, and next steps

## Repository layout

```text
BrainStorming/
  topics/
    {topic-slug}/
      overview.md
      notes.md
      verdict.md
  archived-topics.md     Retired or superseded topic registry
  index.md               Active topic registry
  dist/public/           Machine-readable export snapshot (index.json + topics)
```

## Updating this mirror

From BrainStorming-Priv:

```bash
npm run export:public
# Copy dist/public/ contents into this repo, then commit.
```

Do not add `.claude/agents/`, skills, or `scripts/` here — maintain pipeline code in Priv only.

## License

MIT — see [LICENSE](LICENSE).