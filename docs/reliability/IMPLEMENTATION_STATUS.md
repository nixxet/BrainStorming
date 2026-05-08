# Pipeline Reliability — Implementation Status

This document describes the integrity hooks, validators, and gates wired into the BrainStorming research pipeline. It is the authoritative reference for what is enforced today.

Last updated: 2026-05-08.

## What is enforced today

### Invocation guardrail

A `UserPromptSubmit` hook (`scripts/hooks/record-skill-invocation.js`) detects when the user has typed `/research`, `/evaluate`, `/quick`, `/compare`, or `/recommend` and writes a single-use token at `.claude/state/last-invocation.json`. Director Phase 0 reads, verifies (workflow match, written within 30 minutes), and deletes the token before proceeding. If the token is missing, expired, or mismatched, Director halts with a clear error message.

Effect: a pipeline run cannot be launched via Agent-tool delegation, scripted invocation, or another model spawning Director with a pasted prompt — none of those produce a `UserPromptSubmit` event, so no token is written. The Director refuses to start.

This is not unbypassable (a determined model could write the token file itself), but accidental bypass requires deliberate, recognizable effort.

### Pipeline-state drift detection

A `PostToolUse` hook (`scripts/hooks/validate-on-pipeline-write.js`) runs `validate-pipeline-state.js` against the affected topic whenever a Write/Edit/MultiEdit/NotebookEdit touches a path under `topics/<slug>/_pipeline/`. Issues are surfaced via stderr to the next turn. The hook never blocks tool execution.

Existing `npm run validate-pipeline-state:repair -- --topic <slug>` auto-fixes safe drift (numeric metric fields where state disagrees with on-disk artifacts). The hook output suggests this command in its message.

### Pre-publication gate

`scripts/check-publisher-gate.js` (npm: `npm run check-publisher-gate -- --topic <slug>`) is invoked from Director Phase 7 before Publisher spawn. Strict mode for non-legacy topics checks:

- All required draft files present
- All non-optional phase manifests present, valid, and reference real artifacts
- Phase 4 Critic `weighted_total >= 8.0` OR `state.quality_gate_exception` is set
- Phase 6.5 Challenger `STANDS` verdict requires `search_count >= 8`
- `state.run_metrics` is not all zero (catches the metric-drift class of failure)

Legacy topics (`state.legacy_grandfathered === true`) auto-pass and emit a "skipped: legacy" note.

### Legacy grandfathering

Topics that existed before this reliability layer was wired carry `legacy_grandfathered: true` in their `state.json` (set by the one-shot `scripts/mark-legacy-topics.js`). Topics without state.json receive stub state.json files marking them legacy.

`validate-manifests.js` short-circuits with `passed: true, legacy: true` when the flag is set. `check-publisher-gate.js` does the same.

New topics created via `/research` etc. inherit `legacy_grandfathered: false` from the Director Phase 0 state.json schema and are subject to strict validation.

## What is NOT yet enforced

- **Stop-hook validation sweep.** No automatic full-repo validation on session end. Manual: `npm run validate`.
- **Pre-commit gate.** No git hook to block commits when `topics/<slug>/_pipeline/state.json` has unrepaired drift. Manual: run `npm run validate-pipeline-state` before `git add`.
- **Subagent manifest emission contract.** The Director spec says each phase agent must write its own manifest. No mechanical enforcement that the agent actually did so — the publisher gate catches missing manifests at the end, but does not catch them at the phase-transition boundary.
- **Phase-transition validators.** `validate-pipeline-state` is only invoked when something writes inside `_pipeline/`. Phase transitions that happen entirely in-memory (Director updating state.json without writing artifacts) won't trigger the hook.

## Files in this implementation

| Path | Role |
|---|---|
| `.claude/settings.json` | Wires UserPromptSubmit + PostToolUse hooks |
| `.claude/agents/director.md` | Phase 0 Step 0 invocation guardrail; Phase 7 publisher-gate invocation; `legacy_grandfathered` field in state.json schema |
| `scripts/hooks/record-skill-invocation.js` | UserPromptSubmit hook — writes single-use invocation token |
| `scripts/hooks/validate-on-pipeline-write.js` | PostToolUse hook — surfaces state drift on `_pipeline/` writes |
| `scripts/check-publisher-gate.js` | Pre-publish gate; strict for non-legacy, auto-pass legacy |
| `scripts/mark-legacy-topics.js` | One-shot migration — flags existing topics legacy; idempotent |
| `scripts/validate-manifests.js` | Short-circuits on `legacy_grandfathered === true` |
| `package.json` | Scripts: `check-publisher-gate`, `mark-legacy-topics`, `mark-legacy-topics:dry` |

## Verification

End-to-end sanity checks (Git Bash with `node` on PATH):

```bash
# Manifest validation across all topics — should pass
npm run validate:manifests

# Publisher gate against a legacy topic — should auto-pass
npm run check-publisher-gate -- --topic <any-legacy-slug>

# PostToolUse hook surfaces drift when invoked with a pipeline path
echo '{"tool_input":{"file_path":"'$(pwd)'/topics/<slug>/_pipeline/state.json"}}' \
  | node scripts/hooks/validate-on-pipeline-write.js

# UserPromptSubmit hook writes token for a slash command, then cleans up
echo '{"prompt":"/evaluate https://example.com/foo/bar"}' \
  | node scripts/hooks/record-skill-invocation.js
cat .claude/state/last-invocation.json
rm .claude/state/last-invocation.json

# Mark-legacy-topics is idempotent
npm run mark-legacy-topics
```

## Open decisions deferred

1. **Backfill legacy topics?** Currently they are exempted from strict validation permanently. If a maintainer wants to re-run a legacy topic with strict validation, flip its `legacy_grandfathered` to `false` and re-run the pipeline.
2. **Subagent manifest emission contract.** The publisher gate catches the symptom (missing manifests at end-of-run); the root fix is making each subagent's prompt require manifest emission and having Director verify between phases. Not yet implemented.
3. **Stop-hook full validation.** Could be added to `.claude/settings.json` if false-positive rate stays low; defer until usage data shows whether it's needed.
