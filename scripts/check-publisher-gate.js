#!/usr/bin/env node
/*
Pre-publication gate. Run BEFORE Phase 7 (Publisher) writes final files.

Strict mode applies to non-legacy topics only. Legacy-grandfathered topics
exit 0 with a "skipped: legacy" note — their integrity is documented as
not enforceable retroactively (see docs/reliability/VALID_RUN_DEFINITION.md).

Checks for non-legacy topics:
  1. state.json present and parseable
  2. legacy_grandfathered === false (must be explicit)
  3. All required draft files present
  4. All non-optional phase manifests present and reference real artifacts
  5. Phase 4 (Critic) final score >= 8.0 OR state.quality_gate_exception explains it
  6. If Phase 6.5 (Challenger) ran with verdict STANDS, search_count >= 8
  7. state.run_metrics not all zero (heuristic for "metrics weren't filled in")

Usage:
  node scripts/check-publisher-gate.js --topic <slug> [--json]

Exit:
  0 — safe to publish (or topic is legacy)
  1 — checks failed; do not publish without addressing
  2 — usage error
*/

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

const REQUIRED_DRAFTS = ["draft-overview.md", "draft-notes.md", "draft-verdict.md"];
const REQUIRED_PHASE_MANIFESTS = [
  "phase-1-researcher.json",
  "phase-1-investigator.json",
  "phase-2-analyzer.json",
  "phase-3-writer.json",
  "phase-4-critic.json",
  "phase-7-publisher.json",
];
const OPTIONAL_PHASE_MANIFESTS = [
  "phase-1b-gap-fill.json",
  "phase-5-security.json",
  "phase-6-tester.json",
  "phase-6-5-challenger.json",
];

function parseArgs(argv) {
  const args = { topic: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--topic") args.topic = argv[++i];
    else if (arg === "--json") args.json = true;
    else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(2);
    }
  }
  if (!args.topic) {
    console.error("Required: --topic <slug>");
    printHelp();
    process.exit(2);
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-publisher-gate.js --topic <slug> [--json]

Validates that a topic's draft set is ready for publication.
Legacy-grandfathered topics are auto-passed.
`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function check(slug) {
  const topicDir = path.join(topicsRoot, slug);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const manifestDir = path.join(pipelineDir, "manifests");
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(topicDir)) {
    return { slug, passed: false, errors: [`topic directory not found: topics/${slug}`], warnings, legacy: false };
  }

  const statePath = path.join(pipelineDir, "state.json");
  if (!fs.existsSync(statePath)) {
    errors.push(`missing _pipeline/state.json`);
    return { slug, passed: false, errors, warnings, legacy: false };
  }
  const state = readJson(statePath);
  if (!state) {
    errors.push(`unparseable _pipeline/state.json`);
    return { slug, passed: false, errors, warnings, legacy: false };
  }

  if (state.legacy_grandfathered === true) {
    return {
      slug,
      passed: true,
      legacy: true,
      errors: [],
      warnings: ["legacy_grandfathered=true; publisher gate skipped"],
    };
  }

  if (state.legacy_grandfathered !== false) {
    errors.push(
      `state.legacy_grandfathered must be explicitly true or false (got ${JSON.stringify(state.legacy_grandfathered)})`,
    );
  }

  for (const draft of REQUIRED_DRAFTS) {
    if (!fs.existsSync(path.join(pipelineDir, draft))) {
      errors.push(`missing draft: _pipeline/${draft}`);
    }
  }

  for (const m of REQUIRED_PHASE_MANIFESTS) {
    const mp = path.join(manifestDir, m);
    if (!fs.existsSync(mp)) {
      errors.push(`missing required manifest: _pipeline/manifests/${m}`);
      continue;
    }
    const manifest = readJson(mp);
    if (!manifest) {
      errors.push(`unparseable manifest: _pipeline/manifests/${m}`);
      continue;
    }
    if (manifest.topic_slug && manifest.topic_slug !== slug) {
      errors.push(`manifest ${m}: topic_slug "${manifest.topic_slug}" does not match folder "${slug}"`);
    }
    for (const out of manifest.outputs || []) {
      if (typeof out !== "string") continue;
      if (!fs.existsSync(path.join(topicDir, out))) {
        errors.push(`manifest ${m}: referenced output missing: ${out}`);
      }
    }
  }

  const criticManifest = readJson(path.join(manifestDir, "phase-4-critic.json"));
  if (criticManifest) {
    const score = criticManifest.weighted_total;
    if (typeof score !== "number") {
      errors.push(`phase-4-critic.json missing numeric weighted_total`);
    } else if (score < 8.0 && !state.quality_gate_exception) {
      errors.push(
        `quality gate not met: phase 4 weighted_total=${score} < 8.0 and state.quality_gate_exception is not set`,
      );
    }
  }

  const challengerManifest = readJson(path.join(manifestDir, "phase-6-5-challenger.json"));
  if (challengerManifest && challengerManifest.verdict === "STANDS") {
    const sc = challengerManifest.search_count;
    if (typeof sc !== "number" || sc < 8) {
      errors.push(
        `challenger STANDS verdict requires search_count >= 8 (got ${JSON.stringify(sc)})`,
      );
    }
  }

  const rm = state.run_metrics || {};
  const numericFields = [
    "source_count",
    "source_domain_count",
    "first_score",
    "final_score",
  ];
  const allZero = numericFields.every((f) => !rm[f]);
  if (allZero) {
    errors.push(
      `state.run_metrics looks unfilled (all of ${numericFields.join(", ")} are zero/missing). ` +
        `Run 'npm run validate-pipeline-state:repair -- --topic ${slug}' first.`,
    );
  }

  return {
    slug,
    passed: errors.length === 0,
    legacy: false,
    errors,
    warnings,
  };
}

const args = parseArgs(process.argv.slice(2));
const result = check(args.topic);

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  if (result.legacy) {
    console.log(`[publisher-gate] ${args.topic}: legacy_grandfathered=true; skipped.`);
  } else if (result.passed) {
    console.log(`[publisher-gate] ${args.topic}: PASS.`);
  } else {
    console.error(`[publisher-gate] ${args.topic}: FAIL (${result.errors.length} issue(s)):`);
    for (const e of result.errors) console.error(`  - ${e}`);
  }
}

process.exit(result.passed ? 0 : 1);
