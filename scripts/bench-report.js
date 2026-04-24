#!/usr/bin/env node
'use strict';
/**
 * bench-report.js — Pipeline Benchmarking Report
 * Aggregates per-topic state.json metrics into a benchmark report.
 * Output: topics/_meta/bench-report-YYYY-MM-DD.md
 *
 * Usage: node scripts/bench-report.js
 */

const fs = require('fs');
const path = require('path');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/bench-report.js

Aggregates per-topic state.json metrics into a benchmark report.
Output: topics/_meta/bench-report-YYYY-MM-DD.md

Options:
  --help, -h   Show this help

Exit codes: 0 = success  |  1 = error
`);
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'topics');
const META_DIR = path.join(TOPICS_DIR, '_meta');

// Ensure output directory exists
fs.mkdirSync(META_DIR, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

// ── Helpers ─────────────────────────────────────────────────────────────────

function avg(values) {
  const nums = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(v, decimals = 1) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return v.toFixed(decimals);
  return String(v);
}

function dash(v) {
  return (v === null || v === undefined) ? '—' : String(v);
}

// ── Discover topic slugs ─────────────────────────────────────────────────────

const slugs = fs.readdirSync(TOPICS_DIR)
  .filter(name => {
    if (name.startsWith('_')) return false; // exclude _meta, _cross
    const full = path.join(TOPICS_DIR, name);
    return fs.statSync(full).isDirectory();
  });

// ── Extract per-topic data ───────────────────────────────────────────────────

const rows = [];

for (const slug of slugs) {
  const stateFile = path.join(TOPICS_DIR, slug, '_pipeline', 'state.json');
  if (!fs.existsSync(stateFile)) continue;

  let s;
  try {
    s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    rows.push({ slug, classification: 'legacy', parseError: true });
    continue;
  }

  // ── Field extraction (all null-safe) ────────────────────────────────────
  const topicSlug = s.topic_slug ?? null;
  const workflow = s.workflow ?? null;
  const runDate = s.current_date ?? null;

  // Scores: canonical in run_metrics, fallback to phase_4
  const firstScore = s.run_metrics?.first_score ?? s.phases?.phase_4?.first_score ?? null;
  const finalScore = s.run_metrics?.final_score ?? s.phases?.phase_4?.final_score ?? null;

  // revision_count lives ONLY in phase_4
  const revisions = s.phases?.phase_4?.revision_count ?? null;

  // first_pass_pass_justified written by Critic — not in initial template
  const firstPassJustified = s.phases?.phase_4?.first_pass_pass_justified ?? null;

  // Phase 5 verdict
  const phase5Verdict = s.phases?.phase_5?.verdict ?? null;
  const secChanges = s.run_metrics?.security_required_change_count ?? 0;
  const testerChanges = s.run_metrics?.tester_required_change_count ?? 0;

  // Challenge data (may be absent on pre-P2-B runs)
  const challengeVerdict = s.phases?.phase_6_5?.verdict ?? null;
  const challengesTriggered = s.run_metrics?.challenges_triggered ?? null;
  const challengesUnresolved = s.run_metrics?.challenges_unresolved ?? null;

  // Source metrics
  const sourceCount = s.run_metrics?.source_count ?? null;
  const contradictions = s.run_metrics?.contradiction_count ?? null;

  // Token cost metrics
  const totalSubagentTokens = s.run_metrics?.token_usage?.total_subagent ?? null;
  const costEstimate = s.run_metrics?.cost_estimate_usd?.total_estimate ?? null;

  // ── Topic classification ─────────────────────────────────────────────────
  let classification;
  const phases = s.phases ?? {};
  const phaseStatuses = Object.values(phases).map(p => p?.status ?? '');
  const hasFailed = phaseStatuses.some(st => st === 'failed');
  const hasInProgress = phaseStatuses.some(st => st === 'in_progress');
  // Accept both "completed" and "complete" — pipeline agents use both spellings inconsistently
  const DONE_STATUSES = ['completed', 'complete', 'skipped'];
  const allDone = ['phase_0','phase_1','phase_2','phase_3','phase_4','phase_5','phase_6','phase_7','phase_8']
    .every(k => DONE_STATUSES.includes(phases[k]?.status));

  const isLegacy = !s.run_metrics || !('revision_count' in (s.phases?.phase_4 ?? {})) || !s.topic_slug;

  // Fallback: if run_metrics has a final_score AND the published verdict.md exists on disk,
  // treat as complete even if some phases are stuck at "pending" in state.json (state drift).
  const verdictExists = fs.existsSync(path.join(TOPICS_DIR, slug, 'verdict.md'));
  const hasFinalScore = finalScore !== null && finalScore > 0;
  const completeByFallback = !isLegacy && !hasFailed && !hasInProgress && hasFinalScore && verdictExists;

  if (isLegacy) {
    classification = 'legacy';
  } else if (hasFailed || hasInProgress) {
    classification = 'incomplete';
  } else if (allDone && hasFinalScore) {
    classification = 'complete';
  } else if (completeByFallback) {
    classification = 'complete';
  } else if (!allDone) {
    classification = 'incomplete';
  } else {
    classification = 'complete';
  }

  // Find which phase failed (for incomplete topics)
  let failedPhase = null;
  if (classification === 'incomplete') {
    for (const [k, v] of Object.entries(phases)) {
      if (v?.status === 'failed' || v?.status === 'in_progress') {
        failedPhase = k;
        break;
      }
    }
  }

  rows.push({
    slug: topicSlug ?? slug,
    workflow,
    runDate,
    firstScore,
    finalScore,
    revisions,
    firstPassJustified,
    phase5Verdict,
    secChanges,
    testerChanges,
    challengeVerdict,
    challengesTriggered,
    challengesUnresolved,
    sourceCount,
    contradictions,
    totalSubagentTokens,
    costEstimate,
    classification,
    failedPhase,
  });
}

// ── Segment rows ─────────────────────────────────────────────────────────────

const complete   = rows.filter(r => r.classification === 'complete');
const incomplete = rows.filter(r => r.classification === 'incomplete');
const legacy     = rows.filter(r => r.classification === 'legacy');
const hasChallengeData = rows.some(r => r.challengeVerdict !== null);

// ── Build report ─────────────────────────────────────────────────────────────

const lines = [];

lines.push(`---`);
lines.push(`title: Pipeline Benchmark Report`);
lines.push(`created: ${today}`);
lines.push(`tags: [meta, benchmark, pipeline]`);
lines.push(`---`);
lines.push(``);
lines.push(`# Pipeline Benchmark Report — ${today}`);
lines.push(``);

// ── 1. Summary ───────────────────────────────────────────────────────────────
lines.push(`## Summary`);
lines.push(``);

const allFinalScores = complete.map(r => r.finalScore).filter(v => v !== null);
const allFirstScores = complete.map(r => r.firstScore).filter(v => v !== null);
const allRevisions   = complete.map(r => r.revisions).filter(v => v !== null);

lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Total topics | ${rows.length} |`);
lines.push(`| Complete | ${complete.length} |`);
lines.push(`| Incomplete (interrupted) | ${incomplete.length} |`);
lines.push(`| Legacy (pre-schema) | ${legacy.length} |`);
lines.push(`| Mean first score | ${fmt(avg(allFirstScores))} |`);
lines.push(`| Mean final score | ${fmt(avg(allFinalScores))} |`);
lines.push(`| Mean revisions | ${fmt(avg(allRevisions), 2)} |`);
lines.push(`| Topics with revisions > 0 | ${complete.filter(r => r.revisions > 0).length} |`);
lines.push(`| Topics with first-pass PASS justified | ${complete.filter(r => r.firstPassJustified === true).length} |`);
lines.push(`| Security blocks (phase_5 BLOCK) | ${complete.filter(r => r.phase5Verdict === 'BLOCK').length} |`);
lines.push(``);

// Revision distribution
const revBuckets = { '0': 0, '1': 0, '2': 0, '3+': 0 };
for (const r of complete) {
  if (r.revisions === null) continue;
  if (r.revisions === 0) revBuckets['0']++;
  else if (r.revisions === 1) revBuckets['1']++;
  else if (r.revisions === 2) revBuckets['2']++;
  else revBuckets['3+']++;
}
lines.push(`**Revision distribution (complete topics):**`);
lines.push(`0 revisions: ${revBuckets['0']} | 1 revision: ${revBuckets['1']} | 2 revisions: ${revBuckets['2']} | 3+ revisions: ${revBuckets['3+']}`);
lines.push(``);

// ── 2. Per-Topic Table ───────────────────────────────────────────────────────
lines.push(`## Per-Topic Table`);
lines.push(``);
lines.push(`| Topic | Date | Workflow | First Score | Final Score | Revisions | Phase 5 | Sec Δ | Tester Δ | Sources | Contradictions | Challenge | Tokens (sub) | Est. Cost |`);
lines.push(`|-------|------|----------|-------------|-------------|-----------|---------|-------|----------|---------|----------------|-----------|--------------|-----------|`);

const allRowsSorted = [...rows].sort((a, b) => (a.slug ?? '').localeCompare(b.slug ?? ''));
for (const r of allRowsSorted) {
  const tokFmt = r.totalSubagentTokens != null ? r.totalSubagentTokens.toLocaleString() : '—';
  const costFmt = r.costEstimate != null ? `$${r.costEstimate.toFixed(2)}` : '—';
  lines.push(`| ${dash(r.slug)} | ${dash(r.runDate)} | ${dash(r.workflow)} | ${fmt(r.firstScore)} | ${fmt(r.finalScore)} | ${dash(r.revisions)} | ${dash(r.phase5Verdict)} | ${dash(r.secChanges)} | ${dash(r.testerChanges)} | ${dash(r.sourceCount)} | ${dash(r.contradictions)} | ${dash(r.challengeVerdict)} | ${tokFmt} | ${costFmt} |`);
}
lines.push(``);

// ── 3. Workflow Breakdown ────────────────────────────────────────────────────
lines.push(`## Workflow Breakdown`);
lines.push(``);

const workflowMap = {};
for (const r of complete) {
  const wf = r.workflow ?? 'unknown';
  if (!workflowMap[wf]) workflowMap[wf] = [];
  workflowMap[wf].push(r);
}

lines.push(`| Workflow | Count | Avg Final Score |`);
lines.push(`|----------|-------|-----------------|`);
for (const [wf, wrows] of Object.entries(workflowMap)) {
  const scores = wrows.map(r => r.finalScore).filter(v => v !== null);
  lines.push(`| ${wf} | ${wrows.length} | ${fmt(avg(scores))} |`);
}
lines.push(``);

// ── 4. Cost Summary ──────────────────────────────────────────────────────────
lines.push(`## Cost Summary (Subagent Tokens)`);
lines.push(``);
lines.push(`> Subagent tokens only — excludes Director (Opus) session tokens. Run \`/cost\` after each pipeline for full session total.`);
lines.push(`> Rates: Sonnet ~$8/M blended, Opus ~$39/M blended (60/40 input/output split). Verify at platform.anthropic.com/docs/pricing.`);
lines.push(``);

const rowsWithTokens = complete.filter(r => r.totalSubagentTokens != null);
const rowsWithCost   = complete.filter(r => r.costEstimate != null);

if (rowsWithTokens.length === 0) {
  lines.push(`No token data available — run a pipeline with the HANDOFF SUMMARY protocol active to populate \`run_metrics.token_usage\`.`);
} else {
  const totalTokensAll = rowsWithTokens.reduce((sum, r) => sum + r.totalSubagentTokens, 0);
  const totalCostAll   = rowsWithCost.reduce((sum, r) => sum + r.costEstimate, 0);
  const avgTokens      = totalTokensAll / rowsWithTokens.length;
  const avgCost        = rowsWithCost.length > 0 ? totalCostAll / rowsWithCost.length : null;
  const maxCostRow     = rowsWithCost.reduce((a, b) => a.costEstimate > b.costEstimate ? a : b, { costEstimate: -1, slug: null });
  const minCostRow     = rowsWithCost.reduce((a, b) => a.costEstimate < b.costEstimate ? a : b, { costEstimate: Infinity, slug: null });

  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Topics with token data | ${rowsWithTokens.length} of ${complete.length} complete |`);
  lines.push(`| Total subagent tokens (all tracked) | ${totalTokensAll.toLocaleString()} |`);
  lines.push(`| Avg subagent tokens per run | ${Math.round(avgTokens).toLocaleString()} |`);
  if (avgCost !== null) lines.push(`| Avg estimated cost per run | $${avgCost.toFixed(2)} |`);
  if (maxCostRow.slug) lines.push(`| Most expensive run | ${maxCostRow.slug} — $${maxCostRow.costEstimate.toFixed(2)} |`);
  if (minCostRow.slug && minCostRow.costEstimate !== Infinity) lines.push(`| Least expensive run | ${minCostRow.slug} — $${minCostRow.costEstimate.toFixed(2)} |`);
}
lines.push(``);

// ── 5. Challenge Summary (only if data exists) ────────────────────────────────
if (hasChallengeData) {
  lines.push(`## Challenge Summary`);
  lines.push(``);

  const withChallenge = rows.filter(r => r.challengeVerdict !== null);
  const stands    = withChallenge.filter(r => r.challengeVerdict === 'STANDS').length;
  const weakened  = withChallenge.filter(r => r.challengeVerdict === 'WEAKENED').length;
  const sustained = withChallenge.filter(r => r.challengeVerdict === 'SUSTAINED').length;
  const unresolved = rows.filter(r => r.challengesUnresolved && r.challengesUnresolved > 0).length;

  lines.push(`| Verdict | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| STANDS | ${stands} |`);
  lines.push(`| WEAKENED | ${weakened} |`);
  lines.push(`| SUSTAINED | ${sustained} |`);
  lines.push(`| Unresolved challenges | ${unresolved} |`);
  lines.push(``);
}

// ── 6. Incomplete Runs ───────────────────────────────────────────────────────
lines.push(`## Incomplete Runs`);
lines.push(``);

if (incomplete.length === 0) {
  lines.push(`None — all topics completed or are legacy.`);
} else {
  lines.push(`| Topic | Date | Failed/Stalled Phase |`);
  lines.push(`|-------|------|-----------------------|`);
  for (const r of incomplete) {
    lines.push(`| ${dash(r.slug)} | ${dash(r.runDate)} | ${dash(r.failedPhase)} |`);
  }
}
lines.push(``);

// ── 7. Legacy Topics ─────────────────────────────────────────────────────────
lines.push(`## Legacy Topics`);
lines.push(``);

if (legacy.length === 0) {
  lines.push(`None.`);
} else {
  lines.push(`Topics predating the current schema — consider re-running the pipeline.`);
  lines.push(``);
  for (const r of legacy) {
    lines.push(`- ${r.slug}${r.parseError ? ' *(parse error)*' : ''}`);
  }
}
lines.push(``);

// ── 8. Notable Outliers ──────────────────────────────────────────────────────
lines.push(`## Notable Outliers`);
lines.push(``);

const completeWithScores = complete.filter(r => r.finalScore !== null);

if (completeWithScores.length > 0) {
  const lowestScore = completeWithScores.reduce((a, b) => a.finalScore < b.finalScore ? a : b);
  const highestRevisions = complete.filter(r => r.revisions !== null).reduce((a, b) => a.revisions > b.revisions ? a : b, { revisions: -1, slug: null });

  lines.push(`**Lowest final score:** ${lowestScore.slug} — ${fmt(lowestScore.finalScore)}`);
  if (highestRevisions.slug) {
    lines.push(`**Most revisions:** ${highestRevisions.slug} — ${highestRevisions.revisions} revision(s)`);
  }
}

const secBlocks = complete.filter(r => r.phase5Verdict === 'BLOCK');
if (secBlocks.length > 0) {
  lines.push(`**Security BLOCK verdicts:** ${secBlocks.map(r => r.slug).join(', ')}`);
}

const unresolvedChallenges = rows.filter(r => r.challengesUnresolved && r.challengesUnresolved > 0);
if (unresolvedChallenges.length > 0) {
  lines.push(`**Unresolved challenges:** ${unresolvedChallenges.map(r => r.slug).join(', ')}`);
}

if (completeWithScores.length === 0 && secBlocks.length === 0 && unresolvedChallenges.length === 0) {
  lines.push(`No outliers detected.`);
}
lines.push(``);

lines.push(`---`);
lines.push(``);
lines.push(`*Generated by scripts/bench-report.js | ${today}*`);

// ── Write output ─────────────────────────────────────────────────────────────

const outPath = path.join(META_DIR, `bench-report-${today}.md`);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Benchmark report written: ${outPath}`);
console.log(`  ${complete.length} complete | ${incomplete.length} incomplete | ${legacy.length} legacy`);
if (allFinalScores.length > 0) {
  console.log(`  Mean final score: ${avg(allFinalScores).toFixed(2)}`);
}
