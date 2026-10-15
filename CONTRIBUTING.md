# Contributing

This repository is a Claude Code plugin. The plugin root is the repository root.

## Layout

See [`codebase-map.md`](codebase-map.md). In short: `skills/` are the user-facing commands, `pipeline/agents/` are the specs the Director loads and injects into subagents, `scripts/` are the deterministic gates and validators, and `hooks/hooks.json` wires three of them into Claude Code.

## Two roots

Scripts resolve two locations through `scripts/lib/workspace.js`:

- **Plugin root** (`pipeline/agents`, `scripts`, `schemas`, default `config.json`): where the code ships. Never write here at runtime; an installed plugin is a versioned copy that is replaced on update.
- **Workspace** (`topics/`, `index.md`, `archived-topics.md`): where research is written. Resolved from `BRAINSTORMING_WORKSPACE`, then `CLAUDE_PROJECT_DIR`, then the current directory.

Skill bodies may use `${CLAUDE_PLUGIN_ROOT}`, which Claude Code substitutes when the skill loads. Files the model opens with the Read tool (everything under `pipeline/agents/`) are not substituted, so they use the `{PLUGIN_ROOT}` placeholder, and each skill states the real path.

## Test locally

```bash
npm test                       # unit and integration tests (node:test, no dependencies)
npm run validate               # syntax, topics, schemas, agent lint, settings and hook checks
npm run security:secrets       # gitleaks (if installed) plus built-in patterns
claude plugin validate --strict .
claude --plugin-dir .          # run Claude Code with this checkout loaded as the plugin
```

## Topic contract

Each completed topic folder contains `overview.md`, `notes.md`, and `verdict.md` with frontmatter (`title`, `tags`, `created`, `status`; `verdict.md` adds `score` and `verdict`). `_pipeline/` holds run state and is git-ignored.

## Done looks like

A change is ready when:

- `npm test`, `npm run validate`, and `claude plugin validate --strict .` all pass.
- `npm run security:secrets` passes.
- Any new script that reads or writes research data takes its location from `scripts/lib/workspace.js`, and a test proves it from a directory other than the plugin root.
