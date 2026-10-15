# Codebase Map

| Path | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Plugin manifest |
| `.claude-plugin/marketplace.json` | Lets this repo act as its own plugin marketplace |
| `skills/{research,compare,evaluate,recommend,cross-analyze}/SKILL.md` | User-facing commands (`/brainstorming:<name>`) |
| `pipeline/agents/*.md` | Director and the 11 specialist agent specs it injects into subagents |
| `hooks/hooks.json` | Invocation token, pipeline-write validation, post-publish learning |
| `scripts/` | Gates and validators (link check, claim support, publisher gate, state repair, secret scan) |
| `scripts/lib/workspace.js` | Plugin-root and workspace resolution |
| `scripts/hooks/` | Hook entry points |
| `schemas/` | JSON schemas for pipeline state, evidence, and manifests |
| `config.json` | Default settings (per-run budget cap) |
| `test/` | `node:test` suite and fixtures |
| `docs/` | Quality standard, operating model, recovery playbook, failure modes |
| `diagram.md` | Pipeline architecture |
| `topics/` | Example outputs (see `archived-topics.md`) |
