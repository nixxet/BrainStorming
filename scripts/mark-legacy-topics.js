#!/usr/bin/env node
/*
One-off migration: mark every existing topic with `legacy_grandfathered: true`
in `_pipeline/state.json`. Idempotent — re-running is a no-op.

Topics created from this point forward should set `legacy_grandfathered: false`
in their initial state.json (per director.md Phase 0).

Usage:
  node scripts/mark-legacy-topics.js [--dry-run]
*/

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

const dryRun = process.argv.includes("--dry-run");
const today = new Date().toISOString().slice(0, 10);

const slugs = fs
  .readdirSync(topicsRoot)
  .filter((s) => !s.startsWith("_"))
  .filter((s) => {
    const stat = fs.statSync(path.join(topicsRoot, s));
    return stat.isDirectory();
  });

let scanned = 0;
let marked = 0;
let alreadyFlagged = 0;
let skippedNoState = 0;

for (const slug of slugs) {
  const statePath = path.join(topicsRoot, slug, "_pipeline", "state.json");
  if (!fs.existsSync(statePath)) {
    skippedNoState += 1;
    continue;
  }
  scanned += 1;
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (e) {
    console.error(`SKIP ${slug}: cannot parse state.json (${e.message})`);
    continue;
  }
  if (state.legacy_grandfathered !== undefined) {
    alreadyFlagged += 1;
    continue;
  }
  state.legacy_grandfathered = true;
  state.legacy_marked_at = today;
  if (!dryRun) {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
  }
  marked += 1;
}

console.log(
  `${dryRun ? "DRY-RUN " : ""}Scanned: ${scanned}, Marked: ${marked}, Already flagged: ${alreadyFlagged}, Skipped (no state.json): ${skippedNoState}`,
);
