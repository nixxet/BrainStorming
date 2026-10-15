#!/usr/bin/env node
/*
Settings hygiene check.

Catches regressions in the research workspace's `.claude/settings.json` and
`.claude/settings.local.json`, and in the plugin's `hooks/hooks.json`, that are
known to break the pipeline:

  - A Read deny rule that globs over _pipeline (e.g. one targeting
    topics/<slug>/_pipeline) blocks every subagent from reading research
    artifacts. Slash-command invocation is the gate; layering on a Read deny
    re-blocks the very work that gate was supposed to authorize.
  - Blanket Read or Write denies on topics also break the pipeline.
  - Required plugin hooks missing from hooks/hooks.json (UserPromptSubmit
    invocation token, PostToolUse pipeline-write validator).

Read-only. Always exits 0 with a printable report; exits 1 only if the user
passes `--strict` and any regression check fails. Designed to be safe to
invoke from a Stop hook or CI in --strict mode.

Usage:
  node scripts/check-settings-hygiene.js
  node scripts/check-settings-hygiene.js --strict
  node scripts/check-settings-hygiene.js --json
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { PLUGIN_ROOT, WORKSPACE_ROOT } = require("./lib/workspace");

const BLOCKED_DENY_PATTERNS = [
  // Patterns that, if present in the deny list, will break the multi-agent
  // pipeline. Matched as exact strings — we don't try to be clever about
  // glob equivalence because the rule's intent is "don't add anything that
  // looks like this".
  /Read\(topics\/\*\/_pipeline\/\*\*\)/,
  /Read\(topics\/\*\*\/_pipeline\/\*\*\)/,
  /Read\(topics\/_pipeline\/\*\*\)/,
  /Read\(topics\/\*\*\)/,
  /Write\(topics\/\*\*\)/,
];

const REQUIRED_HOOK_COMMANDS = [
  "scripts/hooks/record-skill-invocation.js",
  "scripts/hooks/validate-on-pipeline-write.js",
];

function parseArgs(argv) {
  const args = { strict: false, json: false };
  for (const a of argv) {
    if (a === "--strict") args.strict = true;
    else if (a === "--json") args.json = true;
    else if (a === "-h" || a === "--help") {
      console.log("Usage: check-settings-hygiene.js [--strict] [--json]");
      process.exit(0);
    }
  }
  return args;
}

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    return { _parseError: err.message };
  }
}

function checkFile(label, p) {
  const findings = [];
  const data = loadJson(p);
  if (!data) {
    findings.push({ severity: "info", msg: `${label} not present (${p})` });
    return { data: null, findings };
  }
  if (data._parseError) {
    findings.push({
      severity: "error",
      msg: `${label} did not parse: ${data._parseError}`,
    });
    return { data: null, findings };
  }
  const denies = data?.permissions?.deny || [];
  for (const rule of denies) {
    for (const re of BLOCKED_DENY_PATTERNS) {
      if (re.test(String(rule))) {
        findings.push({
          severity: "error",
          msg: `${label} permissions.deny contains pipeline-breaking rule: "${rule}". Remove it — slash-command invocation is the gate, not Read denies.`,
        });
      }
    }
  }
  return { data, findings };
}

function checkHooks(data, label) {
  const findings = [];
  if (!data) return findings;
  const hookCommands = [];
  const hooks = data.hooks || {};
  for (const k of Object.keys(hooks)) {
    const items = Array.isArray(hooks[k]) ? hooks[k] : [];
    for (const entry of items) {
      const handlers = entry?.hooks || [];
      for (const h of handlers) {
        if (h?.command) hookCommands.push(h.command);
      }
    }
  }
  for (const required of REQUIRED_HOOK_COMMANDS) {
    if (!hookCommands.some((cmd) => String(cmd).includes(required))) {
      findings.push({
        severity: "warn",
        msg: `${label} is missing a hook that references ${required}. The pipeline's invocation gate and write validation depend on it.`,
      });
    }
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = [];

  // Workspace settings: must not deny the pipeline's own reads/writes.
  const settingsPath = path.join(WORKSPACE_ROOT, ".claude", "settings.json");
  const localPath = path.join(WORKSPACE_ROOT, ".claude", "settings.local.json");
  all.push(...checkFile(".claude/settings.json", settingsPath).findings);
  // settings.local.json overrides settings.json — must not silently re-deny.
  all.push(...checkFile(".claude/settings.local.json", localPath).findings);

  // Plugin hooks: the plugin, not the workspace, owns the pipeline hooks.
  const hooksPath = path.join(PLUGIN_ROOT, "hooks", "hooks.json");
  const pluginHooks = checkFile("hooks/hooks.json", hooksPath);
  all.push(...pluginHooks.findings.filter((x) => x.severity !== "info"));
  if (!pluginHooks.data) {
    all.push({ severity: "error", msg: `hooks/hooks.json missing or unreadable (${hooksPath})` });
  } else {
    all.push(...checkHooks(pluginHooks.data, "hooks/hooks.json"));
  }

  const errors = all.filter((f) => f.severity === "error");
  const warns = all.filter((f) => f.severity === "warn");

  if (args.json) {
    process.stdout.write(
      JSON.stringify({ ok: errors.length === 0, findings: all }, null, 2) + "\n",
    );
  } else {
    if (all.length === 0) {
      console.log("[settings-hygiene] OK — no known regressions.");
    } else {
      console.log("[settings-hygiene] findings:");
      for (const f of all) {
        console.log(`  [${f.severity}] ${f.msg}`);
      }
    }
  }

  if (args.strict && errors.length > 0) process.exit(1);
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { BLOCKED_DENY_PATTERNS, REQUIRED_HOOK_COMMANDS };
