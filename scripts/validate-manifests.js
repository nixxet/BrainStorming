#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { listTopicSlugs, readJsonIfExists } = require("./lib/topic-utils");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

const EXPECTED_PHASES = [
  {
    manifest: "phase-1-researcher.json",
    phase: "phase_1_researcher",
    agent: "researcher",
    outputs: ["_pipeline/landscape.md"],
  },
  {
    manifest: "phase-1-investigator.json",
    phase: "phase_1_investigator",
    agent: "investigator",
    outputs: ["_pipeline/deep-dive.md"],
  },
  {
    manifest: "phase-1b-gap-fill.json",
    phase: "phase_1b_gap_fill",
    agent: "gap_fill",
    outputs: ["_pipeline/gap-fill.md"],
    optional: true,
  },
  {
    manifest: "phase-2-analyzer.json",
    phase: "phase_2_analyzer",
    agent: "analyzer",
    outputs: ["_pipeline/verified-synthesis.md", "_pipeline/evidence.json"],
  },
  {
    manifest: "phase-3-writer.json",
    phase: "phase_3_writer",
    agent: "writer",
    outputs: ["_pipeline/draft-overview.md", "_pipeline/draft-notes.md", "_pipeline/draft-verdict.md"],
  },
  {
    manifest: "phase-4-critic.json",
    phase: "phase_4_critic",
    agent: "critic",
    outputs: ["_pipeline/scorecard.md"],
    requiredFields: ["weighted_total", "verdict"],
  },
  {
    manifest: "phase-5-security.json",
    phase: "phase_5_security",
    agent: "security_reviewer",
    outputs: ["_pipeline/security-review.md"],
    optional: true,
  },
  {
    manifest: "phase-6-tester.json",
    phase: "phase_6_tester",
    agent: "tester",
    outputs: ["_pipeline/stress-test.md"],
    optional: true,
  },
  {
    manifest: "phase-6-5-challenger.json",
    phase: "phase_6_5_challenger",
    agent: "challenger",
    outputs: ["_pipeline/challenge.md"],
    optional: true,
  },
  {
    manifest: "phase-7-publisher.json",
    phase: "phase_7_publisher",
    agent: "publisher",
    outputs: ["overview.md", "notes.md", "verdict.md"],
  },
];

const REQUIRED_PHASE_FIELDS = [
  "schema_version",
  "topic_slug",
  "phase",
  "agent",
  "status",
  "outputs",
  "key_finding",
  "quality_signal",
];

const REQUIRED_PUBLICATION_FIELDS = [
  "schema_version",
  "topic_slug",
  "published_files",
  "quality_score",
  "recommendation",
  "confidence_distribution",
  "must_survive_coverage",
];

function printHelp() {
  console.log(`Usage:
  node scripts/validate-manifests.js [--topic <slug>] [--json]

Validates compact phase/publication manifests under:
  topics/{slug}/_pipeline/manifests/

This script is intentionally strict. If a known phase artifact exists, its
manifest must exist and must reference real files.
`);
}

function parseArgs(argv) {
  const args = { topic: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--topic") {
      args.topic = argv[++i];
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }
  return args;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function existsFromTopic(topicDir, relPath) {
  return fs.existsSync(path.join(topicDir, relPath));
}

function loadJson(filePath, errors) {
  const data = readJsonIfExists(filePath);
  if (!data) return null;
  if (data.__parseError) {
    errors.push(`${rel(filePath)}: invalid JSON (${data.__parseError})`);
    return null;
  }
  return data;
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
}

function checkRequired(data, fields, filePath, errors) {
  for (const field of fields) {
    if (!hasValue(data[field])) {
      errors.push(`${rel(filePath)}: missing required field "${field}"`);
    }
  }
}

function validatePhaseManifest(topicDir, slug, expected, filePath, errors) {
  const manifest = loadJson(filePath, errors);
  if (!manifest) return;

  checkRequired(manifest, [...REQUIRED_PHASE_FIELDS, ...(expected.requiredFields || [])], filePath, errors);

  if (manifest.schema_version && manifest.schema_version !== "1") {
    errors.push(`${rel(filePath)}: schema_version must be "1"`);
  }
  if (manifest.topic_slug && manifest.topic_slug !== slug) {
    errors.push(`${rel(filePath)}: topic_slug "${manifest.topic_slug}" does not match folder "${slug}"`);
  }
  if (manifest.phase && manifest.phase !== expected.phase) {
    errors.push(`${rel(filePath)}: phase "${manifest.phase}" should be "${expected.phase}"`);
  }
  if (manifest.agent && manifest.agent !== expected.agent) {
    errors.push(`${rel(filePath)}: agent "${manifest.agent}" should be "${expected.agent}"`);
  }
  if (!Array.isArray(manifest.outputs)) {
    errors.push(`${rel(filePath)}: outputs must be a non-empty array`);
    return;
  }

  for (const output of manifest.outputs) {
    if (typeof output !== "string" || output.trim() === "") {
      errors.push(`${rel(filePath)}: outputs must contain non-empty path strings`);
      continue;
    }
    if (!existsFromTopic(topicDir, output)) {
      errors.push(`${rel(filePath)}: referenced output is missing: ${output}`);
    }
  }

  if (expected.phase === "phase_4_critic") {
    if (typeof manifest.weighted_total !== "number") {
      errors.push(`${rel(filePath)}: critic manifest must include numeric weighted_total`);
    }
    if (!manifest.verdict) {
      errors.push(`${rel(filePath)}: critic manifest must include verdict`);
    }
  }
}

function validatePublicationManifest(topicDir, slug, filePath, errors) {
  const manifest = loadJson(filePath, errors);
  if (!manifest) return;

  checkRequired(manifest, REQUIRED_PUBLICATION_FIELDS, filePath, errors);

  if (manifest.schema_version && manifest.schema_version !== "1") {
    errors.push(`${rel(filePath)}: schema_version must be "1"`);
  }
  if (manifest.topic_slug && manifest.topic_slug !== slug) {
    errors.push(`${rel(filePath)}: topic_slug "${manifest.topic_slug}" does not match folder "${slug}"`);
  }
  if (!Array.isArray(manifest.published_files)) {
    errors.push(`${rel(filePath)}: published_files must be a non-empty array`);
  } else {
    for (const output of manifest.published_files) {
      if (!existsFromTopic(topicDir, output)) {
        errors.push(`${rel(filePath)}: referenced published file is missing: ${output}`);
      }
    }
  }
  if (typeof manifest.quality_score !== "number") {
    errors.push(`${rel(filePath)}: publication manifest must include numeric quality_score`);
  }
  if (!manifest.must_survive_coverage) {
    errors.push(`${rel(filePath)}: publication manifest must include must_survive_coverage`);
  }
}

function validateTopic(slug) {
  const errors = [];
  const warnings = [];
  const topicDir = path.join(topicsRoot, slug);
  const manifestDir = path.join(topicDir, "_pipeline", "manifests");

  for (const expected of EXPECTED_PHASES) {
    const outputExists = expected.outputs.some(output => existsFromTopic(topicDir, output));
    const manifestPath = path.join(manifestDir, expected.manifest);
    const manifestExists = fs.existsSync(manifestPath);

    if (outputExists && !manifestExists) {
      errors.push(`${rel(manifestPath)}: missing manifest for existing phase output (${expected.outputs.join(", ")})`);
      continue;
    }

    if (manifestExists) {
      validatePhaseManifest(topicDir, slug, expected, manifestPath, errors);
    } else if (!expected.optional) {
      warnings.push(`${rel(manifestPath)}: no phase output or manifest found`);
    }
  }

  const publicationManifestPath = path.join(manifestDir, "publication.json");
  const publicationOutputsExist = ["overview.md", "notes.md", "verdict.md"].some(output => existsFromTopic(topicDir, output));
  if (publicationOutputsExist && !fs.existsSync(publicationManifestPath)) {
    errors.push(`${rel(publicationManifestPath)}: missing publication manifest for published topic files`);
  } else if (fs.existsSync(publicationManifestPath)) {
    validatePublicationManifest(topicDir, slug, publicationManifestPath, errors);
  }

  return {
    slug,
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = args.topic ? [args.topic] : listTopicSlugs(topicsRoot);
  const results = slugs.map(validateTopic);
  const failed = results.filter(result => !result.passed);

  if (args.json) {
    console.log(JSON.stringify({
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      results,
    }, null, 2));
  } else if (failed.length > 0) {
    console.error(`Manifest validation failed with ${failed.reduce((sum, result) => sum + result.errors.length, 0)} issue(s):`);
    for (const result of failed) {
      for (const error of result.errors) console.error(`- ${error}`);
    }
  } else {
    console.log(`Manifest validation passed for ${results.length} topic(s).`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
