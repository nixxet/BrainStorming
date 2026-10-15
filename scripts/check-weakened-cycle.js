#!/usr/bin/env node
/*
WEAKENED-cycle revision-count check.

Asserts: for any topic whose phase_6_5.weakened_cycle_count >= 1, the
phase_4.revision_count must be >= weakened_cycle_count + 1. This catches
the budget-skip pattern where Director marks a WEAKENED cycle as complete
without running the required re-Critic + re-Challenger revision pass (see
docs/reliability/FAILURE_MODES.md and the 2026-05-17 session log).

Read-only. Default behavior is report-and-pass (exit 0). --strict exits 1
on any violation, suitable for CI or publisher gate.

Topics with no _pipeline/state.json on disk are skipped silently — the
_pipeline directory is gitignored and may not be present on every clone.

Usage:
  node scripts/check-weakened-cycle.js
  node scripts/check-weakened-cycle.js --strict
  node scripts/check-weakened-cycle.js --topic <slug>
  node scripts/check-weakened-cycle.js --json
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");
const topicsRoot = path.join(repoRoot, "topics");

function parseArgs(argv) {
  const args = { strict: false, json: false, topic: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") args.strict = true;
    else if (a === "--json") args.json = true;
    else if (a === "--topic") args.topic = argv[++i];
  }
  return args;
}

function listTopicSlugs(only) {
  if (only) return [only];
  if (!fs.existsSync(topicsRoot)) return [];
  return fs.readdirSync(topicsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .map(d => d.name)
    .sort();
}

function check(slug) {
  const statePath = path.join(topicsRoot, slug, "_pipeline", "state.json");
  if (!fs.existsSync(statePath)) return { slug, skipped: "no state.json" };
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (e) {
    return { slug, error: `unreadable state.json: ${e.message}` };
  }
  const phases = state.phases || {};
  const wcc = (phases.phase_6_5 || {}).weakened_cycle_count || 0;
  if (wcc < 1) return { slug, skipped: "no WEAKENED cycle" };
  const rc = (phases.phase_4 || {}).revision_count || 0;
  const required = wcc + 1;
  return {
    slug,
    weakened_cycle_count: wcc,
    revision_count: rc,
    required,
    pass: rc >= required,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = listTopicSlugs(args.topic);
  const results = slugs.map(check);
  const violations = results.filter(r => r.pass === false);
  const errors = results.filter(r => r.error);

  if (args.json) {
    console.log(JSON.stringify({ results, violations, errors }, null, 2));
  } else {
    const checked = results.filter(r => typeof r.pass === "boolean").length;
    console.log(`[weakened-cycle] Checked ${checked} topic(s) with WEAKENED cycles across ${slugs.length} candidate(s).`);
    for (const e of errors) console.log(`[weakened-cycle] ERROR ${e.slug}: ${e.error}`);
    if (violations.length === 0) {
      console.log("[weakened-cycle] OK — no revision-count violations.");
    } else {
      console.log(`[weakened-cycle] VIOLATIONS (${violations.length}):`);
      for (const v of violations) {
        console.log(`  - ${v.slug}: revision_count=${v.revision_count} < required=${v.required} (weakened_cycle_count=${v.weakened_cycle_count})`);
      }
    }
  }

  if (args.strict && (violations.length > 0 || errors.length > 0)) {
    process.exit(1);
  }
}

main();
