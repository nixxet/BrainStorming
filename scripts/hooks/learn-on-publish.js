#!/usr/bin/env node
/*
Stop hook: when a publish has occurred recently in this session, run
learn-from-runs for the published topic and print the report to stderr so
Claude sees it in the next turn.

"Recently" = any topics/<slug>/_pipeline/phase-7-publisher.json with mtime in
the last 120 seconds. If multiple, picks the newest.

Always exits 0. Silent when no recent publish — designed to be safe on every
Stop, not just publish runs.

Rationale: closes the learn loop documented in the 2026-05-17 session log
without requiring the user to remember `npm run learn-from-runs` after each
research run.
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { PLUGIN_ROOT, WORKSPACE_ROOT } = require("../lib/workspace");
const topicsRoot = path.join(WORKSPACE_ROOT, "topics");
const WINDOW_MS = 120 * 1000;

function findRecentPublish() {
  if (!fs.existsSync(topicsRoot)) return null;
  const now = Date.now();
  let newest = null;
  for (const slug of fs.readdirSync(topicsRoot)) {
    const p = path.join(topicsRoot, slug, "_pipeline", "phase-7-publisher.json");
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (now - st.mtimeMs > WINDOW_MS) continue;
    if (!newest || st.mtimeMs > newest.mtimeMs) {
      newest = { slug, mtimeMs: st.mtimeMs };
    }
  }
  return newest;
}

try {
  // Drain stdin (Stop hook payload), but we don't need its contents.
  try { fs.readFileSync(0, "utf8"); } catch {}

  const recent = findRecentPublish();
  if (!recent) process.exit(0);

  const learn = path.join(PLUGIN_ROOT, "scripts", "learn-from-runs.js");
  if (!fs.existsSync(learn)) process.exit(0);

  // L19 fix (2026-06-06): use process.execPath, not "node" by name. On a
  // Windows/version-managed install where node isn't on PATH, the Stop hook
  // silently swallowed the spawn error and the learn loop never fired.
  const result = spawnSync(process.execPath, [learn, "--topic", recent.slug], {
    cwd: WORKSPACE_ROOT,
    encoding: "utf8",
    timeout: 30 * 1000,
  });

  const out = (result.stdout || "").trim();
  if (out) {
    process.stderr.write(`\n[learn-on-publish] Recent publish detected: ${recent.slug}\n`);
    process.stderr.write(out + "\n");
  }
} catch (e) {
  // Hooks must never fail the session.
}
process.exit(0);
