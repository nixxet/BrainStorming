#!/usr/bin/env node
/*
PostToolUse hook: when a Write/Edit/MultiEdit touches a topic's _pipeline/ tree,
run validate-pipeline-state for just that topic and surface any issues.

Always exits 0. Surfaces findings via stderr so Claude sees them in the next turn.
*/

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
if (!filePath) process.exit(0);

const norm = filePath.replace(/\\/g, "/");
const match = norm.match(/topics\/([^/]+)\/_pipeline\//);
if (!match) process.exit(0);
const slug = match[1];

const repoRoot = path.resolve(__dirname, "..", "..");
const validator = path.join(repoRoot, "scripts", "validate-pipeline-state.js");

const result = spawnSync(process.execPath, [validator, "--topic", slug, "--json"], {
  cwd: repoRoot,
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
process.exit(0);
