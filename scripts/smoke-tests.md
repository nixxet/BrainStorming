---
title: Pipeline Regression Smoke Tests
created: 2026-04-14
purpose: Exercise the BrainStorming research pipeline across sparse-results, contradiction, security, comparison, and date-sensitive paths after agent or orchestration changes.
---

# BrainStorming Pipeline Smoke Tests

Five synthetic test scenarios that validate pipeline behavior end-to-end. Run these after any significant change to agent definitions, Director logic, or pipeline structure.

## How to Run

Each test is a `/research` or `/compare` command with a synthetic topic designed to trigger a specific pipeline path. Run each test and verify the expected behavior occurs.

```
# From BrainStorming project root:
# Run each test as a normal pipeline invocation, then verify outcomes
```

---

## Test 1: Sparse Results (Gap-Fill Protocol)

**Command:** `/research "Quantum-Resistant TLS Certificate Pinning for IoT Microcontrollers"`

**Why this topic:** Extremely narrow intersection of quantum cryptography + TLS pinning + IoT. WebSearch will return sparse results for the combined query, triggering the gap-fill protocol.

**Expected behavior:**
- [ ] Phase 1 Researcher reports multiple gaps in `## Gaps & Unknowns`
- [ ] Phase 1 Investigator reports sparse counterargument sources
- [ ] Phase 1b Director evaluates gaps and triggers gap-fill agent
- [ ] Gap-fill agent receives failed queries from Phase 1
- [ ] Gap-fill agent produces `gap-fill.md` with FILLED/PARTIALLY FILLED/UNFILLED statuses
- [ ] Phase 2 Analyzer handles LOW/UNVERIFIED findings gracefully
- [ ] Final verdict explicitly notes evidence limitations

**Pass criteria:** Gap-fill agent was spawned, gap-fill.md exists, and final output acknowledges sparse evidence rather than manufacturing confidence.

---

## Test 2: Security Review Activation (FLAG Path)

**Command:** `/evaluate "HashiCorp Vault vs AWS Secrets Manager for SOC2-regulated infrastructure"`

**Why this topic:** Explicitly involves credentials, compliance (SOC2), and infrastructure — triggers all security review conditions.

**Expected behavior:**
- [ ] Phase 0 Director sets `security_review_required: true`
- [ ] Phase 5 Security Reviewer is spawned (not skipped)
- [ ] Security Reviewer queries CVE databases for Vault and AWS Secrets Manager
- [ ] If Security Reviewer issues FLAG: Writer is re-spawned with security revisions
- [ ] If Security Reviewer issues FLAG: Critic re-runs on revised drafts
- [ ] `security-review.md` exists in `_pipeline/`
- [ ] Final `verdict.md` includes security considerations

**Pass criteria:** Security review phase executes, `security-review.md` exists, and security findings surface in the final output.

---

## Test 3: Quality Gate REWRITE Path

**Command:** `/research "Benefits of AI in Modern Business"`

**Why this topic:** Intentionally vague and fluff-prone. The Writer is likely to produce a generic draft that scores below 6.0 on the Critic's anti-fluff rubric, triggering REWRITE.

**Expected behavior:**
- [ ] Phase 3 Writer produces drafts
- [ ] Phase 4 Critic scores below 6.0 (REWRITE verdict)
- [ ] Director returns to Phase 2 — Analyzer re-run with Critic's structural concerns
- [ ] Phase 3 Writer re-spawned with new synthesis
- [ ] Phase 4 Critic re-evaluates (score should improve)
- [ ] `state.json` shows the rewrite loop in phase history

**Pass criteria:** At least one REWRITE cycle occurs. If the Writer scores above 6.0 on first pass (pipeline improvements may prevent this), the test is inconclusive — not a failure.

**Note:** This test may not trigger REWRITE if the structured protocols now prevent low-quality first drafts. If so, record the first-pass score as a baseline metric.

---

## Test 4: Compare Workflow (Parallel Spawn + Comparison Matrix)

**Command:** `/compare "Bun vs Deno for CLI tool development"`

**Why this topic:** Two well-documented options with clear differences. Tests the `/compare` variant: Researcher assigned to Option A, Investigator to Option B, parallel spawn, comparison matrix generation.

**Expected behavior:**
- [ ] Phase 1 spawns Researcher AND Investigator in parallel (single message, two Task calls)
- [ ] Researcher focuses on Bun, Investigator focuses on Deno (or vice versa)
- [ ] Phase 2 Analyzer produces comparison-specific synthesis with normalized criteria
- [ ] Phase 3 Writer produces comparison matrix in `draft-notes.md`
- [ ] Phase 7 Publisher uses comparison format
- [ ] Phase 8 delivery uses `/compare` template (Winner, Key differentiators, Decision matrix)

**Pass criteria:** Both agents run in parallel, comparison matrix appears in notes.md, and delivery template matches the `/compare` format.

---

## Test 5: Pipeline Interruption and Resumption

**Command:** `/research "WebAssembly Component Model adoption in production"`

**Setup:** After Phase 2 completes (verified-synthesis.md written), manually interrupt the pipeline (Ctrl+C or close the session).

**Resumption:** Re-run the same command. The Director should detect existing state and resume.

**Expected behavior:**
- [ ] First run: Phases 0-2 complete, `state.json` updated, then interrupted
- [ ] Second run: Director reads `state.json`, finds Phase 2 completed
- [ ] Director checks Phase 3 output files — if missing, resumes from Phase 3
- [ ] Director does NOT re-run Phases 0-2
- [ ] Director reads `user_request` from `state.json` (does not ask user to repeat)
- [ ] Pipeline completes from Phase 3 onward
- [ ] Final `state.json` shows all phases completed with correct timestamps

**Pass criteria:** Pipeline resumes from the correct checkpoint without re-running completed phases or re-asking for the topic.

---

## Metrics to Record

After each test run, record:

| Metric | Value | |--------|-------| | Test # | |
| Date | |
| Total pipeline duration | |
| Phases executed | |
| Revision cycles (if any) | |
| Critic first-pass score | |
| Gap-fill triggered? | |
| Security review triggered? | |
| Any agent failures? | |
| State.json final status | |

## When to Run

- After any change to agent definitions (`.claude/agents/*.md`)
- After changes to Director pipeline logic
- After changes to hook scripts or utility libraries
- Before declaring a pipeline improvement "complete"
- Quarterly as a regression check
