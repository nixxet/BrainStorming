#!/usr/bin/env node
/*
Publisher gate. Two modes:

  --mode pre   (default): pre-publication readiness check. Run BEFORE spawning
               Phase 7 (Publisher). Verifies Phases 1–6.5 produced their
               artifacts and manifests, drafts cite sources, ground-truth
               anchor exists for URL-typed inputs, and Critic/Challenger
               gates passed. Does NOT require phase-7-publisher.json or
               publication.json (Publisher hasn't run yet).

  --mode post: post-publication audit. Run AFTER Publisher completes.
               Adds checks that the Publisher's own manifests (phase-7 and
               publication.json) exist and reference real output files.

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
  8. (2026-05-09) Each draft file contains >= 3 URL occurrences (deterministic
     citation gate — catches hallucinated/uncited drafts that pass agent review)
  9. (2026-05-09) For URL-typed topics (state.user_request contains http:// or
     https://), the source-truth/ directory must exist with at least one file
     (deterministic ground-truth anchor — catches Director skipping Phase 0.5)
 10. (2026-05-17, post mode only) Publisher manifests present and reference
     real final files in topics/<slug>/.

Usage:
  node scripts/check-publisher-gate.js --topic <slug> [--mode pre|post] [--json]

Exit:
  0 — safe to publish (or topic is legacy)
  1 — checks failed; do not publish without addressing
  2 — usage error
*/

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");
const topicsRoot = path.join(repoRoot, "topics");

const REQUIRED_DRAFTS = ["draft-overview.md", "draft-notes.md", "draft-verdict.md"];
// Manifests required pre-Publisher. Phase 7 / publication manifests are
// produced BY the Publisher, so they belong in POST_MODE_REQUIRED, not here.
const REQUIRED_PHASE_MANIFESTS = [
  "phase-1-researcher.json",
  "phase-1-investigator.json",
  "phase-2-analyzer.json",
  "phase-3-writer.json",
  "phase-4-critic.json",
];
const OPTIONAL_PHASE_MANIFESTS = [
  "phase-1b-gap-fill.json",
  "phase-5-security.json",
  "phase-6-tester.json",
  "phase-6-5-challenger.json",
];
const POST_MODE_REQUIRED_MANIFESTS = [
  "phase-7-publisher.json",
  "publication.json",
];

function parseArgs(argv) {
  const args = { topic: null, json: false, mode: "pre" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--topic") args.topic = argv[++i];
    else if (arg === "--mode") args.mode = argv[++i];
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
  if (args.mode !== "pre" && args.mode !== "post") {
    console.error(`Invalid --mode "${args.mode}". Use "pre" or "post".`);
    printHelp();
    process.exit(2);
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-publisher-gate.js --topic <slug> [--mode pre|post] [--json]

Validates that a topic's draft set is ready for publication.

Modes:
  pre  (default) — pre-Publisher readiness check (Phase 1–6.5 artifacts)
  post           — post-Publisher audit (adds phase-7-publisher.json + publication.json)

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

function check(slug, mode = "pre") {
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

  const CITATION_FLOOR = 3;
  for (const draft of REQUIRED_DRAFTS) {
    const draftPath = path.join(pipelineDir, draft);
    if (!fs.existsSync(draftPath)) {
      errors.push(`missing draft: _pipeline/${draft}`);
      continue;
    }
    const content = fs.readFileSync(draftPath, "utf8");
    const urlLines = content.split(/\r?\n/).filter((l) => l.includes("https")).length;
    if (urlLines < CITATION_FLOOR) {
      errors.push(
        `_pipeline/${draft}: ${urlLines} URL line(s); deterministic citation gate requires >= ${CITATION_FLOOR}. ` +
          `Zero or sparse citations is a hallucination/under-citation containment failure.`,
      );
    }
  }

  const userRequest = String(state.user_request || "");
  const isUrlTyped = /https?:\/\//.test(userRequest);
  if (isUrlTyped) {
    const sourceTruthDir = path.join(pipelineDir, "source-truth");
    if (!fs.existsSync(sourceTruthDir)) {
      errors.push(
        `URL-typed input requires source-truth anchor (Phase 0.5): ` +
          `_pipeline/source-truth/ does not exist. Director must fetch repo metadata/README before research.`,
      );
    } else {
      const stEntries = fs.readdirSync(sourceTruthDir).filter((n) => !n.startsWith("."));
      if (stEntries.length === 0) {
        errors.push(
          `_pipeline/source-truth/ exists but is empty. Phase 0.5 ground-truth anchor was not populated.`,
        );
      }
    }
  }

  // C1 fix (2026-06-06): the Investigator is deliberately skipped in quick mode
  // (Director sets state.skip_investigator=true / recommended_mode="quick"), so
  // phase-1-investigator.json is never written. Requiring it unconditionally made
  // quick mode structurally unable to pass the gate — i.e. unable to publish at
  // all. Treat the investigator manifest as optional when the run explicitly
  // skipped it. A SKIPPED-status manifest, if present, still satisfies the gate.
  const investigatorSkipped =
    state.skip_investigator === true || state.recommended_mode === "quick";
  const basePhaseManifests = investigatorSkipped
    ? REQUIRED_PHASE_MANIFESTS.filter((m) => m !== "phase-1-investigator.json")
    : REQUIRED_PHASE_MANIFESTS;
  const requiredManifests =
    mode === "post"
      ? [...basePhaseManifests, ...POST_MODE_REQUIRED_MANIFESTS]
      : basePhaseManifests;
  for (const m of requiredManifests) {
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
    // L26 fix (2026-06-06): the schema requires outputs minItems:1, but the gate
    // previously iterated `manifest.outputs || []` and never failed on an
    // empty/missing outputs array.
    if (!Array.isArray(manifest.outputs) || manifest.outputs.length === 0) {
      errors.push(`manifest ${m}: outputs must be a non-empty array`);
    } else {
      for (const out of manifest.outputs) {
        if (typeof out !== "string") continue;
        if (!fs.existsSync(path.join(topicDir, out))) {
          errors.push(`manifest ${m}: referenced output missing: ${out}`);
        }
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
const result = check(args.topic, args.mode);

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
