#!/usr/bin/env node
/*
UserPromptSubmit hook: detect when the user has typed a research-pipeline slash
command (/research, /evaluate, /quick, /compare, /recommend), and write a
single-shot invocation token at `.claude/state/last-invocation.json`.

Director Phase 0 MUST verify this token exists, was written within the last
30 minutes, and matches the workflow being run. If the token is missing or
stale, Director halts — this is the guardrail that catches Agent-tool
delegation masquerading as a slash invocation.

Always exits 0 (never blocks the user prompt).
*/

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const stateDir = path.join(repoRoot, ".claude", "state");
const tokenPath = path.join(stateDir, "last-invocation.json");

const KNOWN_WORKFLOWS = ["research", "evaluate", "quick", "compare", "recommend"];

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

const prompt = (event && event.prompt) || "";
const trimmed = String(prompt).trimStart();
if (!trimmed.startsWith("/")) process.exit(0);

const m = trimmed.match(/^\/(\w+)\s*([\s\S]*?)$/);
if (!m) process.exit(0);
const [, command, args] = m;
if (!KNOWN_WORKFLOWS.includes(command)) process.exit(0);

try {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    tokenPath,
    JSON.stringify(
      {
        workflow: command,
        arguments: args.trim(),
        prompt_excerpt: trimmed.slice(0, 500),
        written_at: new Date().toISOString(),
        source: "user-prompt-submit-hook",
      },
      null,
      2,
    ) + "\n",
  );
} catch {
  // best-effort; never block
}

process.exit(0);
