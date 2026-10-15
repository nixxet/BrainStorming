#!/usr/bin/env node
/*
Pipeline error log writer.

Appends a single JSONL record to `_pipeline/errors.jsonl` for a topic, or to
`_pipeline/global-errors.jsonl` (under the topics root) when no topic is given.
Used by hooks, the Director, and validators to capture failures as they
happen — so the "learn" step (`scripts/learn-from-runs.js`) has structured
data to scan instead of conversation logs that vanish.

Schema (each line is one JSON object):
  {
    "ts":       "2026-05-17T22:30:00Z",
    "topic":    "flux-prompt-generator" | null,
    "phase":    "phase_2" | "hook" | "gate" | "intake" | null,
    "kind":     "agent_failed" | "manifest_missing" | "permission_denied"
              | "tool_error" | "gate_failed" | "settings_regression"
              | "agent_truncated" | "other",
    "agent":    "analyzer" | "writer" | ... | null,
    "summary":  "one-line human-readable summary",
    "detail":   {...optional structured detail...}
  }

Usage:
  node scripts/log-pipeline-error.js --topic <slug> --phase <name> --kind <kind> \
       --agent <name> --summary "<text>" [--detail '<json>']

  # No-topic mode (settings issue, infra error):
  node scripts/log-pipeline-error.js --kind settings_regression \
       --summary "Read deny on topics _pipeline reintroduced"

  # Read from stdin (JSON event):
  echo '{"topic":"foo","kind":"agent_failed",...}' | node scripts/log-pipeline-error.js --stdin

Exit:
  0 — record appended
  1 — invalid input
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { isValidTopicSlug, topicDir } = require("./lib/safe-paths");

const { WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");
const topicsRoot = path.join(repoRoot, "topics");

const VALID_KINDS = new Set([
  "agent_failed",
  "agent_truncated",
  "manifest_missing",
  "permission_denied",
  "tool_error",
  "gate_failed",
  "settings_regression",
  "state_drift",
  "other",
]);

function parseArgs(argv) {
  const args = {
    topic: null,
    phase: null,
    kind: null,
    agent: null,
    summary: null,
    detail: null,
    stdin: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--topic") args.topic = argv[++i];
    else if (a === "--phase") args.phase = argv[++i];
    else if (a === "--kind") args.kind = argv[++i];
    else if (a === "--agent") args.agent = argv[++i];
    else if (a === "--summary") args.summary = argv[++i];
    else if (a === "--detail") args.detail = argv[++i];
    else if (a === "--stdin") args.stdin = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(
    "Usage: log-pipeline-error.js [--topic <slug>] --kind <kind> --summary <text> " +
      "[--phase <name>] [--agent <name>] [--detail <json>]\n" +
      "  or: ... --stdin (read a JSON event from stdin)\n\n" +
      "Valid --kind values: " +
      [...VALID_KINDS].join(", "),
  );
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function build(record) {
  const out = {
    ts: new Date().toISOString(),
    topic: record.topic ?? null,
    phase: record.phase ?? null,
    kind: record.kind,
    agent: record.agent ?? null,
    summary: record.summary,
  };
  if (record.detail) out.detail = record.detail;
  return out;
}

function logPath(topic) {
  // H10 fix (2026-06-06): validate the slug before building a path. An unvalidated
  // --topic / stdin record.topic like "../../../evil" otherwise creates and appends
  // a JSONL file outside topics/ (append-only write primitive). Invalid slugs fall
  // back to the global error log rather than writing out of tree.
  if (topic && isValidTopicSlug(topic)) {
    return path.join(topicDir(topicsRoot, topic), "_pipeline", "errors.jsonl");
  }
  if (topic) {
    process.stderr.write(`[pipeline-error] invalid topic slug "${topic}"; logging to global-errors.jsonl\n`);
  }
  return path.join(topicsRoot, "global-errors.jsonl");
}

function append(record) {
  const file = logPath(record.topic);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(record) + "\n", "utf8");
  return file;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let record;
  if (args.stdin) {
    const raw = readStdin().trim();
    if (!raw) {
      console.error("--stdin given but stdin was empty");
      process.exit(1);
    }
    try {
      record = JSON.parse(raw);
    } catch (err) {
      console.error("invalid JSON on stdin:", err.message);
      process.exit(1);
    }
  } else {
    record = {
      topic: args.topic,
      phase: args.phase,
      kind: args.kind,
      agent: args.agent,
      summary: args.summary,
    };
    if (args.detail) {
      try {
        record.detail = JSON.parse(args.detail);
      } catch {
        record.detail = { raw: args.detail };
      }
    }
  }

  if (!record.kind || !VALID_KINDS.has(record.kind)) {
    console.error(
      `--kind required and must be one of: ${[...VALID_KINDS].join(", ")}`,
    );
    process.exit(1);
  }
  if (!record.summary || typeof record.summary !== "string") {
    console.error("--summary required");
    process.exit(1);
  }

  const out = build(record);
  const file = append(out);
  if (process.env.PIPELINE_LOG_QUIET !== "1") {
    process.stderr.write(`[pipeline-error] logged to ${path.relative(repoRoot, file)}\n`);
  }
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { append, build, VALID_KINDS };
