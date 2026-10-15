# BrainStorming Pipeline Failure Modes

## Overview

This document catalogs known ways the pipeline can produce incomplete, invalid, or misleading outputs, and how to detect them.

---

## Failure Mode 1: Metrics Zero-Fill

### What It Is

`state.json.run_metrics` contains zeros or nulls for all entries, while actual scores and findings exist in `scorecard.md`, `security-review.md`, `stress-test.md`, and `evidence.json`.

### Detection Signature

```bash
npm run validate-pipeline-state -- --topic {slug} 2>&1 | grep "does not match"
```

Output shows:
```
- ISSUE: run_metrics.critical_failures (0) does not match stress test (4).
- ISSUE: run_metrics.high_severity_findings (0) does not match stress test (3).
- ISSUE: run_metrics.source_domain_count (0) does not match evidence.json (3).
- ISSUE: run_metrics.final_score (0) does not match scorecard (8.2).
```

### Root Cause

The Director runs a full pipeline, agents complete their phases and write artifacts, but the metrics extraction step at the end of each phase is skipped. This could happen if:
1. Director implementation extracts metrics from manifests but manifests are not updated with metric values
2. Phase completion doesn't call the metrics extraction routine
3. Metrics extraction fails silently and Director doesn't halt

### Impact

- User views state.json and sees a successful run with metrics all zeros
- Publication metric fields (quality_score, confidence_distribution) are unreliable
- Downstream reports that consume state.json (dashboards, trend reports) show false zeros
- The topic appears to have produced a verdict but no supporting evidence in run_metrics

### Workaround (Current)

```bash
npm run validate-pipeline-state -- --repair -- --topic {slug}
npm run validate-pipeline-state:repair -- --topic {slug}
```

This repair command reads scorecard.md, security-review.md, stress-test.md, and evidence.json, then patches state.json. It is safe because it uses pattern matching on the actual artifact files.

### Permanent Fix (RESOLVED 2026-06-09)

Wired into the Director: Phase 7 now mandates `npm run validate-pipeline-state:repair -- --topic {slug}` immediately after the post-publication audit (`check-publisher-gate --mode post`) passes and before Phase 7 is marked `completed`. The repair pass already re-derives every metric the P1 plan called for (scorecard weighted total / review_incorporation_score, security required-change count, stress-test severity counts, evidence.json source/confidence counts), so no separate `derive-run-metrics.js` is needed -- every run self-heals from artifacts at close. Unrepairable issues are copied into `state.json.errors`. See `pipeline/agents/director.md` Phase 7.

---

## Failure Mode 2: Missing Per-Phase Manifests

### What It Is

Phase output files exist (`landscape.md`, `scorecard.md`, `stress-test.md`, etc.) but the corresponding phase manifests do not exist or are invalid.

### Detection Signature

```bash
npm run validate:manifests -- --topic {slug}
```

Output shows:
```
- topics/{slug}/_pipeline/manifests/phase-1-researcher.json: missing manifest for existing phase output (_pipeline/landscape.md)
- topics/{slug}/_pipeline/manifests/phase-4-critic.json: missing manifest for existing phase output (_pipeline/scorecard.md)
```

### Root Cause

The Director spec requires each phase to produce a manifest (`phase-1-researcher.json`, `phase-4-critic.json`, etc.) with schema_version, topic_slug, phase, agent, status, outputs, key_finding, quality_signal. However:

1. If Director generates artifacts inline (rather than reading them from subagent spawns), manifests are not created
2. If a subagent completes but doesn't write the manifest to `_pipeline/manifests/`, the Director doesn't detect the gap
3. Older pipeline runs (pre-2026-04) may not have manifests at all (manifest schema is newer than some topics)

### Impact

- Validators cannot confirm which agent produced which output (trust chain broken)
- Audit trail is incomplete (you cannot verify that Critic reviewed the output, only that a scorecard exists)
- Publication manifest cannot be verified as coming from the current run
- `npm run validate:manifests` reports the gap. Note (2026-06-06): this is a **standalone** audit -- it is NOT wired into the blocking `validate`/`preflight:all` composites, because ~21 pre-2026-04 topics legitimately lack manifests and would otherwise red the build. Run it manually; it becomes a blocking gate only after those topics are backfilled with manifests or marked `legacy_grandfathered`.

### Current Evidence

All 52 topics in the knowledge base show this issue. `npm run validate:manifests` reports 721+ missing manifests. Topics published before manifest schema was added have NO phase manifests, only a publication.json (if it exists).

### Permanent Fix (P0)

**Clarify the actual requirement:** Investigate whether per-phase manifests are truly required or optional by design. Current evidence:

1. `validate-manifests.js` treats them as REQUIRED (exits non-zero if missing)
2. `VALID_RUN_DEFINITION.md` lists them as required
3. All 50+ published topics lack them, yet are published and functional

**Decision needed:** Is this a backward-compatibility issue (old topics are grandfathered, new runs MUST create them) or a design misconception (manifests are optional, only publication.json is required)?

**Recommended approach (P1):**
- Director should spawn each agent and read its manifest from output
- Each subagent should write a manifest to `_pipeline/manifests/` as part of its standard output contract
- `validate-manifests.js` should treat phase manifests as REQUIRED for runs using manifest schema version 1+
- Older topics without manifests should be migrated or marked as legacy

---

## Failure Mode 3: Invocation Bypass -- General-Purpose Agent Delegation

### What It Is

Instead of the user typing `/research {topic}`, a general-purpose Agent is spawned with the full `director.md` pasted into the prompt, along with task context. The Agent then generates the pipeline directly, rather than spawning subagents.

### Detection Signature

1. Run completes in ~10-15 minutes (should take 30-60 min with real agent spawns)
2. `state.json.phases` show timestamps on clean 15-minute boundaries (T00:00:00, T01:15:00, T02:00:00, etc.)
3. Phase files are present but lack the typical detail of real agent runs
4. `state.json.run_metrics` is all zeros (metrics not extracted from real subagents)
5. Manifests are absent or minimal
6. `npm run validate-pipeline-state` flags mismatches between state and artifacts

### Root Cause

The `/research` skill has `disable-model-invocation: true`, which should prevent agent delegation. However:
1. User or upstream orchestrator bypasses the skill and directly invokes a general-purpose Agent with director.md
2. The Agent's system prompt does not respect the skill's guardrail (guardrails are Claude Code harness-level, not model-level)
3. The Agent is faster and "cheaper" (from the orchestrator's view) than spawning 9 real subagents
4. No validation layer catches this until post-run analysis

### Impact

- Output appears complete but lacks evidentiary rigor of real multi-agent review
- Quality scores in state.json are placeholder placeholders, not genuine Critic evaluations
- Security review may be skipped or superficial
- Adversarial challenge (Challenger phase) is not genuinely adversarial
- Published topic may claim a verdict that was never robustly tested

### Example

From the `everything-claude-code` run that triggered this audit:
- Run completed in 51 main-agent tool invocations (~10 minutes)
- All phase timestamps are on 15-minute boundaries
- Only 5 of 9 expected manifests present
- `run_metrics` all zeros despite scorecard/stress-test containing real numbers
- Director could not have spawned 9 subagents in that time

### Current Workaround

Detection only. There is no runtime prevention today.

### Permanent Fix (P0 -- Blocker)

**Implement skill-level invocation enforcement:**
1. `settings.json` hook on skill invocation
2. When `/research` is invoked, set a flag in session memory: `"_pipeline_invocation_source": "skill"`
3. Director checks this flag early in Phase 0
4. If flag is absent, Director logs ERROR and refuses to proceed: "This pipeline must be invoked via the /research skill, not via direct Agent delegation."
5. Alternative: Implement a pre-hook that validates the invocation source and blocks non-skill paths

**Secondary control:**
1. Add Phase 0 sanity check: "Did Director spawn at least one real subagent?"
2. Read task telemetry and count subagent spawn events
3. If no subagent spawns detected, error: "This run did not spawn required subagents. Possible cause: invoked via Agent delegation instead of /research skill."

---

## Failure Mode 4: Revision Cycle Cap Exceeded Without Escalation

### What It Is

The Director's Critic phase allows up to 3 revision cycles (Critic returns REVISE, Writer revises, Critic re-scores, repeat). If all 3 cycles still result in score < 8.0, the Director should escalate to the user: "Quality gate not met. Publish with caveats or abandon?"

However, if the escalation logic is missing or the user is AFK, the pipeline proceeds to Phase 7 (Publisher) with a sub-8.0 score and no caveat.

### Detection Signature

```bash
cat topics/{slug}/_pipeline/state.json | grep -A2 "phase_4"
```

Shows:
```
"phase_4": {
  "verdict": "REVISE",
  "revision_count": 3,
  "final_score": 7.8,
  "timestamp": "2026-05-07T03:00:00Z"
}
```

And NO `quality_gate_not_met` entry in state.json, yet Phase 7 (Publisher) is marked complete.

### Root Cause

Director's Phase 4 revision loop hits the max-3 limit. The spec says "After 3 revisions without Critic PASS: stop the loop. Ask the user: Quality gate reached cycle limit. Best score: X.XX/10. Publish with caveats or abandon?"

If that escalation is not implemented, or if the user auto-approves without understanding, the pipeline proceeds with no quality gate exception recorded.

### Impact

- Topic is published with score < 8.0 without explicit user awareness
- `index.md` and publication manifest do not flag the sub-threshold score
- Downstream consumers don't know the recommendation failed quality review
- Users may adopt a tool based on a verdict that didn't meet the project's own standards

### Current Workaround

Check `state.json` after run completes:
```bash
cat topics/{slug}/_pipeline/state.json | jq '.phases.phase_4 | select(.final_score < 8.0)'
```

If score < 8.0 and phase_4.revision_count >= 3 and no `quality_gate_not_met` field, the escalation was skipped.

### Permanent Fix (P1)

1. Director's Phase 4 completion must check: `final_score >= 8.0 OR quality_gate_not_met recorded`
2. If neither is true and revision_count >= 3, explicitly require user confirmation before proceeding to Phase 7
3. Record user's response in state.json: `"quality_gate_override_user_confirmed": true` (with timestamp)
4. Publication manifest must include a flag: `"quality_gate_exception": true` with note on what score was achieved

---

## Failure Mode 5: Framing Gate Auto-Proceed

### What It Is

`state.json.framing_gate: "auto-proceeded"` indicates that Phase 0 (Intake) classified the topic and Director automatically proceeded to Phase 1 without user review. This can bypass topic scope validation.

### Detection Signature

```bash
grep "framing_gate" topics/{slug}/_pipeline/state.json
# Output: "framing_gate": "auto-proceeded"
```

### Root Cause

The Director spec (Phase 0) says to classify the topic (research vs evaluate vs compare), present the classification to the user, and wait for confirmation (framing_gate). The auto-proceed behavior should be rare (e.g., explicit user intent was unambiguous).

However, if the Director implementation auto-proceeds for all topics, the framing gate becomes advisory only.

### Impact

- User may not realize a research scope was interpreted differently than intended
- A topic intended as `/evaluate` might be run as `/research` due to auto-classification
- Security review flag may be set incorrectly (auto-classifier might miss security-sensitive domains)

### Current Workaround

Check state.json and review Phase 0 notes to verify scope was correct.

### Permanent Fix (P2)

1. Director Phase 0 must present the framing decision to the user with a brief summary
2. framing_gate should record one of: "user_confirmed", "user_overridden", "auto_proceeded_unambiguous" (with justification)
3. Only auto-proceed if the user's request was unambiguous (e.g., explicit `/evaluate` command vs bare URL)

---

## Failure Mode 6: Security Review Skipped When Required

### What It Is

Topic involves security-sensitive content (auth, infrastructure, compliance, data handling), but `state.json.security_review_required: false`, causing Phase 5 (Security Review) to be skipped.

### Detection Signature

1. Check security_review_required: `grep "security_review_required" topics/{slug}/_pipeline/state.json`
2. If false, inspect the topic name and notes to see if security review was needed
3. Search for keywords: "security", "auth", "credential", "compliance", "infrastructure", "vulnerability", "encrypt", "TLS", "SSH", "API key"

### Root Cause

Phase 0 (Intake) auto-classifies whether security review is needed. The classifier logic might be:
- Too conservative (exempts topics that should be reviewed)
- Keyword-based (misses implicit security implications)
- User-driven (user does not check the security_review_required flag)

### Impact

- A tool for managing secrets is evaluated without a dedicated security specialist
- An infrastructure framework is published without risk assessment
- A compliance tool is recommended without validation of vendor claims

### Current Workaround

Manually re-run the topic with security_review_required overridden:
```bash
# Edit state.json before resuming
cat topics/{slug}/_pipeline/state.json | jq '.security_review_required = true' > /tmp/state.json
mv /tmp/state.json topics/{slug}/_pipeline/state.json

# Resume pipeline -- Director will spawn Security Reviewer
/research {slug}
```

### Permanent Fix (P1)

1. Director Phase 0 should explicitly ask: "Does this topic involve security, infrastructure, credentials, or compliance?" with options (yes/no/unsure)
2. If unsure, default to true (err on the side of caution)
3. Record the decision and rationale in state.json
4. If user later realizes security_review_required should be true, they can update state.json and resume

---

## Failure Mode 7: Incomplete Adversarial Challenge

### What It Is

Phase 6.5 (Challenger) is supposed to conduct a minimum of 8 distinct searches to challenge the recommendation. However, the manifest may show `search_count < 8` while verdict is still STANDS.

### Detection Signature

```bash
cat topics/{slug}/_pipeline/manifests/phase-6-5-challenger.json | jq '.search_count'
# Output: 4 (or some number < 8)

cat topics/{slug}/_pipeline/manifests/phase-6-5-challenger.json | jq '.verdict'
# Output: "STANDS"
```

### Root Cause

The Challenger agent is instructed in `challenger.md`: "Perform at least 8 distinct searches before issuing a STANDS verdict." However, this rule is self-enforced only -- there is no Director-level check.

The agent could:
1. Shortcut after 4 searches if it finds no counter-evidence
2. Miscount or conflate similar searches as 8 distinct ones
3. Generate plausible-sounding search results without actually running them (if leveraging cached knowledge)

### Impact

- A "STANDS" verdict may be based on shallow adversarial testing
- The recommendation lacks robust resistance to challenge
- Downstream users believe the recommendation was tested against 8+ counter-evidence angles when it was not

### Current Workaround

Check the challenge.md file directly to count searches:
```bash
grep -c "^- \|^## Searches" topics/{slug}/_pipeline/challenge.md
```

If the count is low, treat the STANDS verdict with skepticism.

### Permanent Fix (P1)

1. Implement `scripts/check-publisher-gate.js` that validates Challenger search_count >= 8 before STANDS verdict is allowed
2. Director should call this validation before accepting Challenger verdict
3. If search_count < 8 and verdict = STANDS, Director should return the Challenger for another round or downgrade STANDS to a conditional equivalent
4. Record the check in state.json: `"challenge_search_count_verified": true`

---

## Failure Mode 8: Evidence.json Missing Must-Survive Caveats

### What It Is

`evidence.json` documents "must-survive" caveats (claims that MUST appear in the final published output), but these are not preserved in the draft files or final published content.

### Detection Signature

```bash
# Count must-survive caveats in evidence.json
jq '[.findings[] | select(.must_survive == true)] | length' topics/{slug}/_pipeline/evidence.json
# Output: 12

# Check if they appear in draft-notes.md
grep -c "caveat\|warning\|limitation" topics/{slug}/_pipeline/draft-notes.md
# Output: 2 (mismatch -- only 2 of 12 caveats preserved)
```

### Root Cause

The Analyzer produces `evidence.json` with must_survive flags. The Writer is supposed to read these and incorporate them into the drafts. However:

1. Writer doesn't reference evidence.json during draft creation
2. Writer references evidence.json but doesn't systematically check must_survive flags
3. Critic's REVISE verdicts don't mandate preservation of must-survive caveats
4. Publisher doesn't validate that all must-survive caveats appear in final output

### Impact

- A critical limitation of a tool is documented during analysis but doesn't make it to the final recommendation
- User relies on the published notes without knowing about caveats that were discovered but omitted
- The analysis was rigorous but the output is not faithful to the evidence

### Current Workaround

Manually compare evidence.json must_survive list to the published notes.md:
```bash
jq '.findings[] | select(.must_survive == true) | .claim' topics/{slug}/_pipeline/evidence.json
```

Then search for each claim in `notes.md` and `verdict.md`.

### Permanent Fix (P1)

1. Implement `scripts/check-publisher-gate.js` with validation: "All must-survive caveats from evidence.json appear in final notes.md and verdict.md"
2. Publisher should call this validation before writing final files
3. If caveats are missing, return to Phase 3 (Writer) with a list of missing caveats
4. Record caveat coverage in publication manifest: `"must_survive_coverage": "12/13 must-survive caveats preserved (1 deemed peripheral and marked NOTED)"`

---

## Failure Mode 9: Stale Topics in Index.md

### What It Is

A topic is archived, superseded, or marked stale, but remains in `index.md` without a status flag.

### Detection Signature

```bash
# Check index.md for status column
grep "{topic-slug}" index.md | cut -d'|' -f3

# If status is not "archived", "superseded", or "stale", and the topic is indeed old
cat topics/{slug}/_pipeline/state.json | jq '.current_date'
# Compare to today's date
```

### Root Cause

Index.md is updated by Publisher during Phase 7, or regenerated by `regenerate-index.js`. If a topic is later archived or marked stale, the index is not automatically updated.

### Impact

- Users see old recommendations for outdated tools
- No visible indicator that a topic has been superseded by a newer evaluation
- Leads to confusion and wasted time researching deprecated tools

### Permanent Fix (P2)

1. `npm run check-staleness` should update index.md status for overdue topics
2. Archive workflow should update index.md: change status to "archived" with reason
3. Editor should not manually edit index.md; all updates should flow through Publisher or lint scripts

---

---

## Failure Mode 10: Pipeline-Breaking Read Deny on `_pipeline/**`

### What It Is

`.claude/settings.json` `permissions.deny` contains a rule that covers `_pipeline/` artifacts (e.g. `Read(topics/*/_pipeline/**)`). Every subagent past Phase 1 (Analyzer, Writer, Critic, Tester, Challenger, Publisher) needs to read those files. The Read tool returns a permission error; agents typically interpret this as "file does not exist" and declare FAILED -- but the artifacts are on disk and intact.

### Detection Signature

```bash
npm run check-settings-hygiene:strict
# Output:
# [error] .claude/settings.json permissions.deny contains pipeline-breaking rule:
#         "Read(topics/*/_pipeline/**)". Remove it ...
```

Or, post-run, in `_pipeline/errors.jsonl`:
```bash
npm run learn-from-runs -- --topic <slug>
# Look for: permission_denied count > 0 on a topic whose run failed
```

### Root Cause

A well-intentioned "context discipline" rule that intends to stop the *Director* from pulling research files into its own context -- but as a permission deny, it applies to subagents too. Slash-command invocation (`/research`) is already the integrity gate (Phase 0 Step 0 verifies `last-invocation.json`); a Read deny on top of that re-blocks the very work the gate authorized. Origin in this repo: commit `935b4be` (2026-05-15), removed `2026-05-17`.

### Impact

- Analyzer/Writer/Critic/Publisher all error with permission/sandbox denials.
- Agents may report "file does not exist" instead of "file is denied", sending Director on a goose chase.
- Phase 2+ cannot proceed at all. A multi-hundred-dollar pipeline run halts mid-flight.

### Workaround

Edit `.claude/settings.json` and remove the offending rule. Then re-invoke `/research <slug>`; the pipeline resumes from `state.json`.

### Permanent Fix (implemented 2026-05-17)

1. `scripts/check-settings-hygiene.js` detects the regression. Wired into Director Phase 0 (Step 0.25) as a hard precondition -- if it fails, no agents spawn.
2. Wired into `npm run validate` (strict).
3. Director Read-Resilience contract: every subagent prompt now includes mandatory retry steps (forward slashes, Glob parent, `node -e readFileSync` via Bash) before declaring `PERMISSION_DENIED`. `PERMISSION_DENIED` is a distinct HANDOFF status from `FAILED`.
4. PostToolUse hook (`validate-on-pipeline-write.js`) logs permission denials to `_pipeline/errors.jsonl` so they're visible via `npm run learn-from-runs`.
5. `scripts/check-settings-hygiene.js --strict` (run by the Director at intake) flags the rule if it is ever re-added.

### Reusable Pattern

If a "context discipline" goal needs to be enforced for the parent agent only (not subagents), use one of these instead of a deny rule:
- A `PreToolUse` hook that warns when the parent reads a known-large artifact, without blocking.
- A Director-side rule documented in its system prompt + a Stop-hook validator that flags context bloat from artifact reads.
- An explicit list of read-budget-aware files instead of a path glob.

---

## Failure Mode 11: Publisher Gate Required Manifests Publisher Itself Writes

### What It Is

`scripts/check-publisher-gate.js` listed `phase-7-publisher.json` and `publication.json` in `REQUIRED_PHASE_MANIFESTS`, but those manifests are created by the Publisher. Director docs said "run BEFORE spawning Publisher" -- meaning the gate could never pass on first call.

### Detection Signature

```
[publisher-gate] <slug>: FAIL (1 issue(s)):
  - missing required manifest: _pipeline/manifests/phase-7-publisher.json
```

...when the pipeline has not yet spawned Publisher.

### Root Cause

Single manifest list serving two distinct checks (pre-publish readiness vs. post-publish audit).

### Permanent Fix (implemented 2026-05-17)

Gate now supports `--mode pre|post`. `pre` (default) requires Phases 1-4 manifests only. `post` adds `phase-7-publisher.json` and `publication.json`. Director.md invokes both at the right time.

---

## Summary Table

| Failure Mode | Detection | Root Cause | Severity | Fix Status |
|---|---|---|---|---|
| Metrics zero-fill | validate-pipeline-state mismatch | Metrics not extracted from artifacts | High | RESOLVED 2026-06-09 -- repair wired into Director Phase 7 |
| Missing manifests | validate:manifests fails | Pre-manifest schema topics or direct artifact generation | High | Need clarification P0, migration P1 |
| Invocation bypass | Fast run + placeholder metrics | General-purpose Agent used instead of skill | Critical | P0 blocker -- skill enforcement needed |
| Revision cap exceed | sub-8.0 score, no quality_gate_not_met | Escalation logic missing | High | P1 -- implement escalation check |
| Framing gate auto | state.json shows "auto-proceeded" | User scope not confirmed with user | Medium | P2 -- add user confirmation |
| Security skipped | security_review_required: false on sensitive topic | Auto-classifier too conservative | High | P1 -- explicit user question in Phase 0 |
| Incomplete challenge | search_count < 8 but STANDS verdict | Self-enforced minimum, no external check | Medium | P1 -- add validator gate |
| Missing caveats | evidence.json must-survive flags don't appear in output | Writer doesn't reference or Critic doesn't enforce | High | P1 -- add validator gate |
| Stale index entries | Topic marked stale but index not updated | Manual index update not performed | Low | P2 -- automate index updates |
| _pipeline Read deny | check-settings-hygiene flags rule; subagents 'file missing' | Permission rule blocks all subagent reads | Critical | Fixed 2026-05-17 -- hygiene check, Director preflight, Read-resilience contract |
| Publisher gate pre/post conflict | gate FAIL with "missing publisher manifest" pre-spawn | Single manifest list for two checks | High | Fixed 2026-05-17 -- `--mode pre|post` split |
