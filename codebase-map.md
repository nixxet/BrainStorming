# BrainStorming — Codebase Map (Published Mirror)

This repo is a **published-topics mirror**. Pipeline code lives in `BrainStorming-Priv` only.

```text
BrainStorming/
  topics/
    {topic-slug}/
      overview.md
      notes.md
      verdict.md
  index.md               Active topic registry
  archived-topics.md     Retired topics
  dist/public/           Last export snapshot (index.json + topics)
  docs/                  Quality standard and reference docs (no pipeline ops)
```

**Canonical source:** `C:/ClaudeProjects/BrainStorming-Priv` — run `npm run export:public` there, then copy `dist/public/` here.