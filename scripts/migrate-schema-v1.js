#!/usr/bin/env node
"use strict";

/**
 * One-shot migration: bring existing pipeline artifacts into schema v1 compliance.
 * Fixes: missing schema_version, missing topic_slug, missing findings array,
 * invalid confidence values, missing run_metrics in state.json.
 * Safe to re-run (idempotent).
 */

const fs = require("node:fs");
const path = require("node:path");

const VALID_CONFIDENCE = new Set(["HIGH", "MEDIUM", "LOW", "UNVERIFIED"]);

function normalizeConfidence(val) {
  if (!val || typeof val !== "string") return "UNVERIFIED";
  const upper = val.toUpperCase();
  if (VALID_CONFIDENCE.has(upper)) return upper;
  if (upper.includes("HIGH")) return "HIGH";
  if (upper.includes("MEDIUM")) return "MEDIUM";
  if (upper.includes("LOW")) return "LOW";
  return "UNVERIFIED";
}

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");
const dryRun = process.argv.includes("--dry-run");

let fixed = 0;
let skipped = 0;

const slugDirs = fs.readdirSync(topicsRoot, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith("_"))
  .map(d => d.name);

for (const slug of slugDirs) {
  const pipelineDir = path.join(topicsRoot, slug, "_pipeline");
  if (!fs.existsSync(pipelineDir)) continue;

  const evidencePath = path.join(pipelineDir, "evidence.json");
  if (fs.existsSync(evidencePath)) {
    let data;
    try { data = JSON.parse(fs.readFileSync(evidencePath, "utf8")); }
    catch { console.error(`SKIP ${slug}/evidence.json: invalid JSON`); skipped++; continue; }

    let changed = false;

    if (!data.schema_version) { data.schema_version = "1"; changed = true; }
    if (!data.topic_slug) { data.topic_slug = slug; changed = true; }
    if (!Array.isArray(data.findings)) {
      data.findings = [];
      changed = true;
    } else {
      for (const f of data.findings) {
        if (f.confidence && !VALID_CONFIDENCE.has(f.confidence)) {
          const normalized = normalizeConfidence(f.confidence);
          console.log(`  ${slug}/evidence.json: confidence "${f.confidence}" -> "${normalized}"`);
          f.confidence = normalized;
          changed = true;
        }
      }
    }

    if (changed) {
      console.log(`FIX evidence.json: ${slug}`);
      if (!dryRun) fs.writeFileSync(evidencePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      fixed++;
    }
  }

  const statePath = path.join(pipelineDir, "state.json");
  if (fs.existsSync(statePath)) {
    let data;
    try { data = JSON.parse(fs.readFileSync(statePath, "utf8")); }
    catch { console.error(`SKIP ${slug}/state.json: invalid JSON`); skipped++; continue; }

    let changed = false;
    if (!data.run_metrics) { data.run_metrics = {}; changed = true; }

    const SCHEMA_V1_REQUIRED = ["topic_slug", "workflow", "current_date", "phases", "run_metrics", "errors"];
    const missing = SCHEMA_V1_REQUIRED.filter(k => !(k in data));
    if (missing.length > 0 && data.legacy_grandfathered !== true) {
      data.legacy_grandfathered = true;
      data.legacy_marked_at = new Date().toISOString().slice(0, 10);
      data.legacy_note = `stub state.json created during legacy migration; original run predates schema v1 (missing: ${missing.join(", ")})`;
      if (!data.topic_slug) data.topic_slug = slug;
      changed = true;
      console.log(`GRANDFATHER state.json: ${slug} (missing: ${missing.join(", ")})`);
    }

    if (changed) {
      if (!data.legacy_grandfathered) console.log(`FIX state.json:    ${slug}`);
      if (!dryRun) fs.writeFileSync(statePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      fixed++;
    }
  }
}

console.log(`\nMigration complete: ${fixed} file(s) updated, ${skipped} skipped.${dryRun ? " (DRY RUN)" : ""}`);
