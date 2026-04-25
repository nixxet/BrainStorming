#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { listTopicSlugs, readJsonIfExists } = require("./lib/topic-utils");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");
const schemaRoot = path.join(repoRoot, "schemas");

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
  checkRequired(stateSchema, data, filePath, errors);
  const rel = path.relative(repoRoot, filePath);

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
  checkRequired(evidenceSchema, data, filePath, errors);
  const rel = path.relative(repoRoot, filePath);

  if (!Array.isArray(data.findings)) {
    errors.push(`${rel}: findings must be an array`);
    return;
  }
  for (const finding of data.findings) {
    if (!finding.id) errors.push(`${rel}: finding is missing id`);
    if (finding.confidence && !["HIGH", "MEDIUM", "LOW", "UNVERIFIED"].includes(finding.confidence)) {
      errors.push(`${rel}: finding ${finding.id} has invalid confidence "${finding.confidence}"`);
    }
  }
}

function main() {
  const errors = [];

  for (const slug of listTopicSlugs(topicsRoot)) {
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
