# BrainStorming Codebase Map

Terse structural overview. Pipeline behavior lives in `CLAUDE.md` and `.claude/agents/`.

```
topics/                 Research topics — one folder per slug
  {slug}/               overview.md, notes.md, verdict.md, _pipeline/
  _meta/                Bench reports, citation checks, staleness reports
  _cross/               Cross-topic synthesis (/cross-analyze)
  _tmp/                 Scratch — never committed (deny-listed)
.claude/
  agents/               12 pipeline agents (director, researcher, etc.)
  skills/               5 pipeline skills (research, compare, etc.)
scripts/                Pipeline tooling (32 files) — staleness, citation verify, hygiene
schemas/                JSON schemas for state.json, evidence.json
test/                   Pipeline tests
docs/                   Design notes, architecture references
dist/public/            Sanitized public export (deny-listed)
index.md                Topic registry — auto-updated by Publisher
archived-topics.md      Retired topics
```

---

*Codebase map | Terse structural reference | 2026-05-15*
