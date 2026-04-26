#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { readPipelineState } = require("./lib/pipeline-state");
const { isValidTopicSlug, listTopicDirs, topicDir: resolveTopicDir } = require("./lib/safe-paths");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

const PHASE_LABELS = {
  phase_0: "Phase 0 — Framing Gate",
  phase_1: "Phase 1 — Research (Researcher + Investigator)",
  phase_1b: "Phase 1b — Gap-Fill (optional)",
  phase_2: "Phase 2 — Analysis (Analyzer)",
  phase_3: "Phase 3 — Writing (Writer)",
  phase_4: "Phase 4 — Critique (Critic, up to 3 cycles)",
  phase_5: "Phase 5 — Security Review + Tester",
  phase_6: "Phase 6 — Challenge (Challenger)",
  phase_7: "Phase 7 — Publication (Publisher)",
  phase_8: "Phase 8 — Index Update + Finalization",
};

const RECOVERY_ADVICE = {
  failed: [
    "Re-invoke the pipeline skill for this topic to resume. The Director will skip completed phases.",
    "If state.json is corrupt, run: npm run validate-pipeline-state -- --topic {slug} --repair --write",
    "Check the errors[] array in state.json for the Director's error log.",
  ],
  in_progress: [
    "This phase appears to have started but not completed. The pipeline may have been interrupted.",
    "Re-invoke the pipeline skill for this topic — the Director should detect the incomplete phase and resume.",
    "If the phase appears stuck (e.g., the agent timed out), running pipeline-preflight may help: npm run preflight -- {slug}",
  ],
  stalled: [
    "No phase is currently in_progress but the pipeline is not complete.",
    "Re-invoke the original pipeline skill to continue from the last completed phase.",
  ],
};

function diagnose(slug) {
  let topicDirPath;
  try {
    topicDirPath = resolveTopicDir(topicsRoot, slug);
  } catch (err) {
    return { slug, error: `Invalid slug: ${err.message}` };
  }

  if (!fs.existsSync(topicDirPath)) {
    return { slug, error: `Topic directory not found: ${topicDirPath}` };
  }

  const { state, error: readError } = readPipelineState(topicDirPath);
  if (readError || !state) {
    return {
      slug,
      error: readError || "state.json is missing or unreadable",
      advice: [
        "Run: npm run validate-pipeline-state -- --topic " + slug + " --repair --write",
        "If state.json does not exist, start a fresh pipeline run for this topic.",
      ],
    };
  }

  const phases = state.phases || {};
  const phaseEntries = Object.entries(phases);

  const completed = phaseEntries.filter(([, p]) => p && (p.status === "completed" || p.status === "complete"));
  const failed = phaseEntries.filter(([, p]) => p && p.status === "failed");
  const inProgress = phaseEntries.filter(([, p]) => p && p.status === "in_progress");
  const pending = phaseEntries.filter(([, p]) => p && p.status === "pending");
  const skipped = phaseEntries.filter(([, p]) => p && p.status === "skipped");

  const isFullyComplete =
    failed.length === 0 &&
    inProgress.length === 0 &&
    pending.filter(([name]) => name !== "phase_1b").length === 0;

  const hasPublicFiles =
    fs.existsSync(path.join(topicDirPath, "overview.md")) &&
    fs.existsSync(path.join(topicDirPath, "notes.md")) &&
    fs.existsSync(path.join(topicDirPath, "verdict.md"));

  const status = failed.length > 0
    ? "FAILED"
    : inProgress.length > 0
      ? "IN_PROGRESS"
      : isFullyComplete && hasPublicFiles
        ? "PUBLISHED"
        : isFullyComplete
          ? "PIPELINE_COMPLETE"
          : "STALLED";

  const diagnosis = {
    slug,
    status,
    workflow: state.workflow || "(unknown)",
    current_date: state.current_date || "(unknown)",
    schema_version: state.schema_version || "(missing — not versioned)",
    phases_completed: completed.length,
    phases_failed: failed.length,
    phases_in_progress: inProgress.length,
    phases_pending: pending.length,
    phases_skipped: skipped.length,
    final_score: state.run_metrics?.final_score ?? null,
    errors: state.errors || [],
  };

  if (failed.length > 0) {
    diagnosis.failed_phases = failed.map(([name, phase]) => ({
      phase: name,
      label: PHASE_LABELS[name] || name,
      timestamp: phase.timestamp || null,
      outputs: phase.outputs || [],
    }));
    diagnosis.advice = RECOVERY_ADVICE.failed.map(a => a.replace("{slug}", slug));
  } else if (inProgress.length > 0) {
    diagnosis.in_progress_phases = inProgress.map(([name]) => ({
      phase: name,
      label: PHASE_LABELS[name] || name,
    }));
    diagnosis.advice = RECOVERY_ADVICE.in_progress.map(a => a.replace("{slug}", slug));
  } else if (status === "STALLED") {
    const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;
    diagnosis.last_completed_phase = lastCompleted
      ? { phase: lastCompleted[0], label: PHASE_LABELS[lastCompleted[0]] || lastCompleted[0] }
      : null;
    diagnosis.advice = [...RECOVERY_ADVICE.stalled];
    if (hasPublicFiles) {
      diagnosis.advice.push(
        "This topic has public files (overview.md, notes.md, verdict.md) — the pipeline may have completed but state.json was not fully updated.",
        "Run: npm run validate-pipeline-state -- --topic " + slug + " --repair --write"
      );
    }
  } else if (status === "PIPELINE_COMPLETE") {
    diagnosis.advice = [
      "Pipeline is complete but public files are missing.",
      "Check for the publisher output in topics/" + slug + "/ — all three of overview.md, notes.md, verdict.md must exist.",
      "Re-run the Publisher phase if needed: re-invoke the pipeline skill and the Director will detect the missing files.",
    ];
  } else {
    diagnosis.advice = ["This topic is fully published and up to date."];
  }

  return diagnosis;
}

function formatDiagnosis(d) {
  const lines = [];
  lines.push(`Topic: ${d.slug}`);
  if (d.error) {
    lines.push(`Status: ERROR`);
    lines.push(`Error: ${d.error}`);
    if (d.advice) {
      lines.push("Advice:");
      for (const a of d.advice) lines.push(`  - ${a}`);
    }
    return lines.join("\n");
  }

  lines.push(`Status: ${d.status}`);
  lines.push(`Workflow: ${d.workflow}  |  Run date: ${d.current_date}  |  Schema: ${d.schema_version}`);
  lines.push(`Phases: ${d.phases_completed} completed, ${d.phases_failed} failed, ${d.phases_in_progress} in-progress, ${d.phases_pending} pending, ${d.phases_skipped} skipped`);
  if (d.final_score !== null) lines.push(`Final score: ${d.final_score}`);

  if (d.failed_phases?.length) {
    lines.push("\nFailed phases:");
    for (const p of d.failed_phases) {
      lines.push(`  [FAILED] ${p.label}`);
      if (p.timestamp) lines.push(`           Timestamp: ${p.timestamp}`);
    }
  }
  if (d.in_progress_phases?.length) {
    lines.push("\nIn-progress phases:");
    for (const p of d.in_progress_phases) {
      lines.push(`  [IN_PROGRESS] ${p.label}`);
    }
  }
  if (d.last_completed_phase) {
    lines.push(`\nLast completed phase: ${d.last_completed_phase.label}`);
  }
  if (d.errors?.length) {
    lines.push("\nPipeline errors from state.json:");
    for (const e of d.errors) {
      lines.push(`  - ${typeof e === "string" ? e : JSON.stringify(e)}`);
    }
  }
  if (d.advice?.length) {
    lines.push("\nRecommended next steps:");
    for (const a of d.advice) lines.push(`  - ${a}`);
  }

  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const allMode = args.includes("--all");
  const topicIndex = args.indexOf("--topic");
  const slug = topicIndex !== -1 ? args[topicIndex + 1] : null;

  if (!allMode && !slug) {
    console.error("Usage: node scripts/diagnose-run.js --topic <slug> [--json]");
    console.error("       node scripts/diagnose-run.js --all [--json]");
    process.exit(1);
  }

  if (slug && !isValidTopicSlug(slug)) {
    console.error(`Error: invalid topic slug "${slug}"`);
    process.exit(1);
  }

  let slugs;
  if (allMode) {
    slugs = listTopicDirs(topicsRoot)
      .map(d => path.basename(d))
      .filter(s => isValidTopicSlug(s));
  } else {
    slugs = [slug];
  }

  const results = slugs.map(diagnose);

  if (jsonOutput) {
    console.log(JSON.stringify(allMode ? results : results[0], null, 2));
  } else {
    for (let i = 0; i < results.length; i++) {
      if (i > 0) console.log("\n" + "─".repeat(60) + "\n");
      console.log(formatDiagnosis(results[i]));
    }
  }
}

main();
