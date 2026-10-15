#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { listTopicSlugs, readJsonIfExists } = require("./lib/topic-utils");

const { PLUGIN_ROOT, WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");
// BRAINSTORMING_TOPICS_DIR lets tests (and ad-hoc runs) point the validator at an
// isolated topics root — same convention as validate-pipeline-state.js. Without it
// the floor guard below is untestable against an empty sandbox.
const topicsRoot = process.env.BRAINSTORMING_TOPICS_DIR
  ? path.resolve(process.env.BRAINSTORMING_TOPICS_DIR)
  : path.join(repoRoot, "topics");
const schemaRoot = path.join(PLUGIN_ROOT, "schemas");

const stateSchema = readJsonIfExists(path.join(schemaRoot, "pipeline-state.schema.json"));
const evidenceSchema = readJsonIfExists(path.join(schemaRoot, "evidence.schema.json"));

function loadJson(filePath, errors) {
  const data = readJsonIfExists(filePath);
  if (!data) return null;
  if (data.__parseError) {
    errors.push(`${path.relative(repoRoot, filePath)}: invalid JSON (${data.__parseError})`);
    return null;
  }
  return data;
}

function checkRequired(schema, data, filePath, errors) {
  const rel = path.relative(repoRoot, filePath);
  for (const key of schema.required || []) {
    if (!(key in data)) errors.push(`${rel}: missing required field "${key}"`);
  }
}

function checkState(data, filePath, errors) {
  const rel = path.relative(repoRoot, filePath);
  if (data.legacy_grandfathered === true) {
    // Pre-schema-v1 stub: enforce structural checks on present fields only.
  } else {
    checkRequired(stateSchema, data, filePath, errors);
  }

  if (data.schema_version && data.schema_version !== "1") {
    errors.push(`${rel}: schema_version "${data.schema_version}" is not recognized (expected "1")`);
  }

  if (data.topic_slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.topic_slug)) {
    errors.push(`${rel}: topic_slug must be kebab-case`);
  }
  if (data.current_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.current_date)) {
    errors.push(`${rel}: current_date must use YYYY-MM-DD`);
  }
  const validStatuses = new Set(["pending", "in_progress", "completed", "complete", "failed", "skipped"]);
  for (const [phaseName, phase] of Object.entries(data.phases || {})) {
    if (phase && phase.status && !validStatuses.has(phase.status)) {
      errors.push(`${rel}: ${phaseName}.status "${phase.status}" is not recognized`);
    }
  }
}

function checkEvidence(data, filePath, errors) {
  const rel = path.relative(repoRoot, filePath);
  if (data.legacy_grandfathered === true) {
    if (!Array.isArray(data.findings)) return;
  } else {
    checkRequired(evidenceSchema, data, filePath, errors);
  }

  // L21 fix (2026-06-07): schema_version policy = "validate-if-present, required on neither"
  if (data.schema_version && data.schema_version !== "1") {
    errors.push(`${rel}: schema_version "${data.schema_version}" is not recognized (expected "1")`);
  }

  if (!Array.isArray(data.findings)) {
    if (data.legacy_grandfathered !== true) {
      errors.push(`${rel}: findings must be an array`);
    }
    return;
  }
  const validConfidence = new Set(["HIGH", "MEDIUM", "LOW", "UNVERIFIED"]);
  for (const finding of data.findings) {
    if (!finding.id) errors.push(`${rel}: finding is missing id`);
    if (!finding.confidence) {
      errors.push(`${rel}: finding ${finding.id || "(no id)"} is missing required confidence field`);
    } else if (!validConfidence.has(finding.confidence)) {
      errors.push(`${rel}: finding ${finding.id} has invalid confidence "${finding.confidence}"`);
    }
  }
}

function main() {
  const errors = [];
  const slugs = listTopicSlugs(topicsRoot);

  // L1 fix (2026-06-07): TOPICS-FLOOR GUARD — ensure 0 topics never reads as green
  if (fs.existsSync(topicsRoot) && slugs.length === 0 && !process.env.ALLOW_EMPTY_TOPICS) {
    console.error(`0 topics found under ${path.relative(repoRoot, topicsRoot)} — working tree may be wiped; restore with: git checkout -- topics/  (set ALLOW_EMPTY_TOPICS=1 to bypass)`);
    process.exit(1);
  }

  for (const slug of slugs) {
    const pipelineDir = path.join(topicsRoot, slug, "_pipeline");
    const statePath = path.join(pipelineDir, "state.json");
    const evidencePath = path.join(pipelineDir, "evidence.json");

    if (fs.existsSync(statePath)) {
      const state = loadJson(statePath, errors);
      if (state) checkState(state, statePath, errors);
    }
    if (fs.existsSync(evidencePath)) {
      const evidence = loadJson(evidencePath, errors);
      if (evidence) checkEvidence(evidence, evidencePath, errors);
    }
  }

  if (errors.length > 0) {
    console.error(`Schema validation failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("Schema validation passed for topic state and evidence files.");
}

main();
