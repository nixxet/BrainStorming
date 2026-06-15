# BrainStorming — Published Topics Mirror

This repo is a **read-only mirror** of published research topics from the canonical working tree (`BrainStorming-Priv` at `C:/ClaudeProjects/BrainStorming-Priv`).

It contains **no research pipeline** — no `.claude/agents/`, no skills, and no `scripts/`. All pipeline work (agents, validation, ingestion, export) happens in BrainStorming-Priv only.

## What lives here

| Path | Purpose |
|------|---------|
| `topics/{slug}/overview.md` | What the thing is, major concepts, context |
| `topics/{slug}/notes.md` | Evidence-backed findings with confidence ratings |
| `topics/{slug}/verdict.md` | Recommendation, risks, alternatives |
| `index.md` | Active topic registry |
| `archived-topics.md` | Retired or superseded topics |
| `dist/public/` | Last machine-readable export snapshot (`index.json` + topic files) |

## How content arrives

1. Research runs in **BrainStorming-Priv** via `/research`, `/compare`, `/evaluate`, `/recommend`, or `/cross-analyze`.
2. Publisher writes sanitized topic files when a run completes.
3. Maintainer runs `npm run export:public` in Priv and copies `dist/public/` here.

**Do not** add pipeline agents, skills, or scripts to this repo. If you need to change pipeline behavior, edit BrainStorming-Priv and re-export.

## Topic contract (published files)

Each topic folder includes:

- `overview.md` — frontmatter: `title`, `tags`, `created`, `status`
- `notes.md` — findings with confidence ratings and citations
- `verdict.md` — frontmatter: `title`, `tags`, `created`, `status`, `score`, `verdict`

Pipeline artifacts (`_pipeline/`, manifests, media digests) stay in the Priv working tree and are git-ignored there.

---

*BrainStorming | Published-topics mirror | Active | 2026-06-15*