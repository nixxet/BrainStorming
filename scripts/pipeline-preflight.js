#!/usr/bin/env node
/*
title: Pipeline Preflight Check
purpose: Verify a topic is ready for a pipeline run before any research work starts writing artifacts.
*/

const fs = require("fs");
const path = require("path");
const { runNodeScript } = require("./lib/process-runner");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");
const indexPath = path.join(repoRoot, "index.md");
const archivePath = path.join(repoRoot, "archived-topics.md");

function printHelp() {
  console.log(`Usage:
  node scripts/pipeline-preflight.js <slug> [--mode <research|quick|compare|evaluate|recommend>] [--re-evaluate] [--json]

Arguments:
  <slug>   Topic slug for the intended pipeline run

Options:
  --mode <mode>    Pipeline mode (default: research)
  --re-evaluate    Flag as re-evaluation run
  --json           Output JSON result
  --help, -h       Show this help

Checks performed:
  1. topics/ root is writable
  2. Topics folder path is valid and accessible
  3. If topic already exists: detect incomplete prior run, check resumability
  4. If topic is new: validate slug format
  5. Maintenance checks: validate-pipeline-state, check-staleness (summary only)
  6. No reserved slug collision (_meta, _cross, _tmp)

Exit codes:
  0  All checks pass — safe to proceed
  1  One or more FATAL checks failed — do not proceed
  2  Warnings present but no fatals — proceed with caution
`);
}

function parseArgs(argv) {
  const args = { slug: null, mode: "research", reEvaluate: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") { args.json = true; }
    else if (a === "--re-evaluate") { args.reEvaluate = true; }
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else if (a === "--mode") { args.mode = argv[++i]; }
    else if (!a.startsWith("--") && !args.slug) { args.slug = a; }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(1); }
  }
  return args;
}

const RESERVED = new Set(["_meta", "_cross", "_tmp"]);
const VALID_MODES = new Set(["research", "quick", "compare", "evaluate", "recommend"]);

function readIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function parseJsonIfExists(p) {
  const raw = readIfExists(p);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function indexStatus(slug) {
  const idx = readIfExists(indexPath) || "";
  const arch = readIfExists(archivePath) || "";
  const pattern = `topics/${slug}/`;
  return { inIndex: idx.includes(pattern), inArchive: arch.includes(pattern) };
}

function isWritable(dir) {
  try { fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; }
}

function detectIncompleteRun(topicDir) {
  const statePath = path.join(topicDir, "_pipeline", "state.json");
  const state = parseJsonIfExists(statePath);
  if (!state) return null;

  const phases = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => `phase_${n}`);
  const incompletePhases = phases.filter((p) => {
    const ph = state[p];
    return ph && ph.status && ph.status === "in_progress";
  });

  return {
    hasState: true,
    mode: state.mode || state.workflow || "unknown",
    incompletePhases,
    isResumable: incompletePhases.length > 0,
    lastKnownPhase: phases.reverse().find((p) => state[p] && state[p].status && state[p].status !== "skipped") || "none",
  };
}

function runValidateState(slug) {
  try {
    const scriptPath = path.join(__dirname, "validate-pipeline-state.js");
    const args = slug ? ["--topic", slug, "--json"] : ["--json"];
    const result = runNodeScript(scriptPath, args, {
      cwd: repoRoot,
      timeout: 10000,
    });
    if (result.status !== 0) {
      return { ran: false, error: result.stderr || result.stdout };
    }
    const data = JSON.parse(result.stdout);
    const target = slug
      ? data.results.find((r) => r.slug === slug)
      : null;
    return { ran: true, topicsWithIssues: data.topicsWithIssues, topicResult: target };
  } catch (error) {
    return { ran: false, error: error.message };
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.slug) {
    console.error("Error: <slug> is required.");
    printHelp();
    process.exit(1);
  }

  const checks = [];
  let hasFatal = false;
  let hasWarning = false;

  function check(name, level, passed, message) {
    checks.push({ name, level, passed, message: passed ? "OK" : message });
    if (!passed) {
      if (level === "FATAL") hasFatal = true;
      else hasWarning = true;
    }
  }

  // 1. Reserved slug check
  check("slug-not-reserved", "FATAL", !RESERVED.has(args.slug),
    `"${args.slug}" is a reserved folder name. Choose a different slug.`);

  // 2. Slug format
  check("slug-format", "FATAL", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.slug),
    `Slug must be kebab-case (lowercase letters, digits, hyphens). Got: "${args.slug}"`);

  // 3. Mode validity
  check("mode-valid", "FATAL", VALID_MODES.has(args.mode),
    `Unknown mode: "${args.mode}". Valid: ${[...VALID_MODES].join(", ")}`);

  // 4. topics/ writable
  check("topics-dir-writable", "FATAL", isWritable(topicsRoot),
    `topics/ directory is not writable. Check filesystem permissions.`);

  // Bail early if slug or topics/ checks failed (no point continuing)
  if (hasFatal) {
    outputResult(args, checks, hasFatal, hasWarning);
    process.exit(1);
  }

  const topicDir = path.join(topicsRoot, args.slug);
  const topicExists = fs.existsSync(topicDir);

  // 5. Topic existence + incomplete run detection
  if (topicExists) {
    const runInfo = detectIncompleteRun(topicDir);
    if (runInfo && runInfo.isResumable) {
      check("no-incomplete-run", "WARN", false,
        `Incomplete prior run detected (phases in_progress: ${runInfo.incompletePhases.join(", ")}). Director should resume rather than restart.`);
    } else if (runInfo && runInfo.hasState && !args.reEvaluate) {
      check("prior-run-acknowledged", "WARN", false,
        `topics/${args.slug}/ already has a completed pipeline run. Pass --re-evaluate if re-researching.`);
    } else {
      check("topic-folder", "INFO", true, `topics/${args.slug}/ exists`);
    }

    // 6. State integrity for existing topic
    const stateResult = runValidateState(args.slug);
    if (stateResult.ran && stateResult.topicResult) {
      const issues = stateResult.topicResult.issues || [];
      check("state-integrity", issues.length > 0 ? "WARN" : "INFO",
        issues.length === 0,
        `state.json has ${issues.length} integrity issues. Run: npm run validate-pipeline-state:repair`);
    }

    // 7. Archive status check
    const { inArchive } = indexStatus(args.slug);
    check("not-archived", "WARN", !inArchive,
      `"${args.slug}" is currently archived. Restore it from archived-topics.md before re-researching.`);
  } else {
    check("new-topic", "INFO", true, `topics/${args.slug}/ does not exist — new topic will be created`);
  }

  // 8. Overall maintenance state (summary only — just check if global issues count is high)
  const globalState = runValidateState(null);
  if (globalState.ran) {
    check("global-state-health", globalState.topicsWithIssues > 5 ? "WARN" : "INFO",
      globalState.topicsWithIssues <= 5,
      `${globalState.topicsWithIssues} topics have state.json integrity issues. Run validate-pipeline-state:repair before long sessions.`);
  }

  outputResult(args, checks, hasFatal, hasWarning);
  process.exit(hasFatal ? 1 : hasWarning ? 2 : 0);
}

function outputResult(args, checks, hasFatal, hasWarning) {
  const status = hasFatal ? "FATAL" : hasWarning ? "WARN" : "PASS";
  const result = { slug: args.slug, mode: args.mode, reEvaluate: args.reEvaluate, status, checks };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const icon = { PASS: "PASS", WARN: "WARN", FATAL: "FAIL" }[status];
  console.log(`[${icon}] Pipeline preflight: ${args.slug} (mode: ${args.mode})`);
  for (const c of checks) {
    if (!c.passed) {
      console.log(`  [${c.level}] ${c.name}: ${c.message}`);
    }
  }
  if (status === "PASS") {
    console.log(`  All checks passed. Safe to start pipeline.`);
  } else if (status === "WARN") {
    console.log(`  Warnings present. Review before proceeding.`);
  } else {
    console.log(`  Fatal issues found. Do not proceed until resolved.`);
  }
}

main();
