#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const cachePath = path.join(repoRoot, "topics", "_meta", "citation-cache.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const jsonOutput = args.includes("--json");

const maxAgeDaysIndex = args.indexOf("--max-age-days");
const maxAgeDays = maxAgeDaysIndex !== -1 ? Number(args[maxAgeDaysIndex + 1]) : 180;

if (!Number.isFinite(maxAgeDays) || maxAgeDays < 1) {
  console.error("Error: --max-age-days must be a positive number");
  process.exit(1);
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function main() {
  if (!fs.existsSync(cachePath)) {
    const msg = `Citation cache not found at ${path.relative(repoRoot, cachePath)} — nothing to prune.`;
    if (jsonOutput) {
      console.log(JSON.stringify({ pruned: 0, kept: 0, message: msg }));
    } else {
      console.log(msg);
    }
    return;
  }

  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch (err) {
    console.error(`Error reading citation cache: ${err.message}`);
    process.exit(1);
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);

  const pruned = [];
  const kept = {};

  for (const [url, entry] of Object.entries(cache)) {
    const checkedOn = parseDate(entry?.checked_on);
    if (!checkedOn || checkedOn < cutoff) {
      pruned.push({ url, checked_on: entry?.checked_on || null, reason: !checkedOn ? "invalid_date" : "expired" });
    } else {
      kept[url] = entry;
    }
  }

  const result = {
    pruned: pruned.length,
    kept: Object.keys(kept).length,
    max_age_days: maxAgeDays,
    dry_run: dryRun,
  };

  if (!dryRun && pruned.length > 0) {
    fs.writeFileSync(cachePath, `${JSON.stringify(kept, null, 2)}\n`, "utf8");
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ ...result, pruned_entries: pruned }, null, 2));
  } else if (pruned.length === 0) {
    console.log(`Citation cache is clean — ${result.kept} entries, all within ${maxAgeDays}-day limit.`);
  } else {
    const prefix = dryRun ? "[DRY RUN] Would prune" : "Pruned";
    console.log(`${prefix} ${pruned.length} expired citation cache entry(ies) (older than ${maxAgeDays} days).`);
    console.log(`Kept: ${result.kept} entries.`);
    if (dryRun) {
      console.log("Re-run without --dry-run to apply.");
    }
  }
}

main();
