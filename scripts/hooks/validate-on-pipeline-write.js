#!/usr/bin/env node
/*
PostToolUse hook: when a Write/Edit/MultiEdit touches a topic's _pipeline/ tree,
run validate-pipeline-state for just that topic and surface any issues.

Also logs to errors.jsonl when:
- The tool call returned a permission/sandbox error (silent denial detector).
- The tool wrote inside _pipeline/ but state.json validation surfaced issues
  (state drift).

Always exits 0. Surfaces findings via stderr so Claude sees them in the next turn.
*/

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { PLUGIN_ROOT, WORKSPACE_ROOT } = require("../lib/workspace");

let payload = "";
try {
  payload = fs.readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let event;
try {
  event = JSON.parse(payload);
} catch {
  process.exit(0);
}

const filePath =
  event?.tool_input?.file_path ||
  event?.tool_input?.notebook_path ||
  "";

// --- silent-denial detector ------------------------------------------------
// If the tool call errored with a permission/sandbox/denied message and the
// path was inside _pipeline/, that's the failure mode that broke the
// 2026-05-17 flux-prompt-generator run. Capture it.
const errorText =
  (event?.tool_result?.error || event?.tool_result?.is_error
    ? JSON.stringify(event.tool_result)
    : "") ||
  event?.error ||
  "";
const looksDenied = /permission|denied|sandbox|deny|not allowed|blocked/i.test(
  String(errorText),
);
if (looksDenied && filePath) {
  const logger = path.join(PLUGIN_ROOT, "scripts", "log-pipeline-error.js");
  const norm = filePath.replace(/\\/g, "/");
  const slugMatch = norm.match(/topics\/([^/]+)\//);
  const slug = slugMatch ? slugMatch[1] : null;
  const args = [
    logger,
    "--kind",
    "permission_denied",
    "--summary",
    `Tool denied: ${path.basename(filePath)} (${event?.tool_name || "unknown"})`,
    "--detail",
    JSON.stringify({ file: norm, tool: event?.tool_name, error: errorText }),
  ];
  if (slug) args.push("--topic", slug);
  try {
    spawnSync(process.execPath, args, { cwd: WORKSPACE_ROOT, stdio: "ignore" });
  } catch {
    /* never block the hook on logger failure */
  }
}

if (!filePath) process.exit(0);

const norm = filePath.replace(/\\/g, "/");
const match = norm.match(/topics\/([^/]+)\/_pipeline\//);
if (!match) process.exit(0);
const slug = match[1];

const validator = path.join(PLUGIN_ROOT, "scripts", "validate-pipeline-state.js");

const result = spawnSync(process.execPath, [validator, "--topic", slug, "--json"], {
  cwd: WORKSPACE_ROOT,
  encoding: "utf8",
});

if (result.error) process.exit(0);

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.exit(0);
}

const results = report.results || report.topics || [];
const topic = results.find((t) => (t.slug || t.topic) === slug) || results[0];
const issues = (topic && topic.issues) || [];
if (issues.length === 0) process.exit(0);

process.stderr.write(
  `[validate-pipeline-state] topic="${slug}" has ${issues.length} issue(s):\n`,
);
for (const issue of issues) {
  process.stderr.write(`  - ${issue}\n`);
}
process.stderr.write(
  `Run 'npm run validate-pipeline-state:repair -- --topic ${slug}' to auto-fix safe drift.\n`,
);

// Log to errors.jsonl so learn-from-runs can spot repeat drift patterns.
try {
  const logger = path.join(PLUGIN_ROOT, "scripts", "log-pipeline-error.js");
  spawnSync(
    process.execPath,
    [
      logger,
      "--topic",
      slug,
      "--kind",
      "state_drift",
      "--phase",
      "hook",
      "--summary",
      `state.json drift after ${event?.tool_name || "write"}: ${issues.length} issue(s)`,
      "--detail",
      JSON.stringify({ issues, file: norm }),
    ],
    { cwd: WORKSPACE_ROOT, stdio: "ignore" },
  );
} catch {
  /* never block the hook on logger failure */
}

process.exit(0);
