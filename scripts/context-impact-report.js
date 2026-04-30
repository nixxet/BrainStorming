#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  latestFileMatching,
  listTopicSlugs,
  parseFrontmatter,
  readJsonIfExists,
} = require("./lib/topic-utils");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");
const metaRoot = path.join(topicsRoot, "_meta");

const PIPELINE_FULL_ARTIFACTS = [
  "landscape.md",
  "deep-dive.md",
  "gap-fill.md",
  "verified-synthesis.md",
  "scorecard.md",
  "security-review.md",
  "stress-test.md",
  "challenge.md",
];

const FINAL_FILES = ["overview.md", "notes.md", "verdict.md"];

const STALENESS_THRESHOLDS = {
  volatile: 90,
  fast: 180,
  slow: 540,
  stable: 1825,
};

const APPROACHING_BAND = {
  volatile: 14,
  fast: 21,
  slow: 45,
  stable: 90,
};

function printHelp() {
  console.log(`Usage:
  node scripts/context-impact-report.js [--topic <slug>] [--json] [--write]

Measures topic artifact sizes and routing-relevant metrics so the Director can
prefer compact manifests/metrics over full artifact reads.
`);
}

function parseArgs(argv) {
  const args = { topic: null, json: false, write: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--topic") {
      args.topic = argv[++i];
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--write") {
      args.write = true;
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

function fileSize(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}

function sumFileSizes(files) {
  return files.reduce((sum, filePath) => sum + fileSize(filePath), 0);
}

function listFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => path.join(dir, entry.name));
}

function listFilesRecursive(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...listFilesRecursive(entryPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      found.push(entryPath);
    }
  }
  return found;
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function countCitations(text) {
  const matches = text.match(/https?:\/\/[^\s)>\]]+/g);
  return matches ? matches.length : 0;
}

function extractScorecardScore(text) {
  const patterns = [
    /<weighted_total>([0-9]+(?:\.[0-9]+)?)<\/weighted_total>/i,
    /\*\*Weighted Total:\*\*\s*([0-9]+(?:\.[0-9]+)?)/i,
    /^weighted_total:\s*([0-9]+(?:\.[0-9]+)?)/im,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function extractCitationStatus(pipelineDir) {
  const latest = latestFileMatching(pipelineDir, /^citation-check-\d{4}-\d{2}-\d{2}\.json$/);
  if (!latest) return { status: "not-run", file: null };
  const data = readJsonIfExists(latest);
  if (!data || data.__parseError) return { status: "unreadable", file: path.basename(latest) };

  const summary = data.summary || data.aggregate || data;
  const dead = Number(summary.dead || summary.failed || summary.failure_count || 0);
  const total = Number(summary.total || summary.url_count || summary.checked || 0);
  return {
    status: dead > 0 ? "has-failures" : "pass-or-warnings",
    file: path.basename(latest),
    total: Number.isFinite(total) ? total : null,
    failed: Number.isFinite(dead) ? dead : null,
  };
}

function normalizeDecayClass(value, fallback = "slow") {
  if (typeof value !== "string") return fallback;
  const normalized = value.toLowerCase().trim();
  if (STALENESS_THRESHOLDS[normalized]) return normalized;
  for (const key of Object.keys(STALENESS_THRESHOLDS)) {
    if (normalized.includes(key)) return key;
  }
  return fallback;
}

function normalizeFindingId(value) {
  if (typeof value !== "string") return value;
  const match = value.match(/^([A-Za-z]+\d+)/);
  return match ? match[1] : value;
}

function extractStalenessStatus(slug, topicDir, evidence) {
  const verdictText = readTextIfExists(path.join(topicDir, "verdict.md"));
  const frontmatter = parseFrontmatter(verdictText);
  const dateValue = frontmatter.created || frontmatter.updated;
  if (!dateValue) return { status: "unknown", reason: "no created/updated frontmatter" };

  const researchDate = new Date(dateValue);
  if (Number.isNaN(researchDate.getTime())) return { status: "unknown", reason: "invalid frontmatter date" };

  const ageInDays = Math.round((new Date() - researchDate) / 86400000);
  const findings = Array.isArray(evidence?.findings) ? evidence.findings : [];
  const materialIds = (evidence?.staleness_summary?.material_findings || []).map(normalizeFindingId);

  if (materialIds.length > 0) {
    const decayClass = normalizeDecayClass(evidence.staleness_summary.fastest_material_decay, "slow");
    const overdue = materialIds.filter(id => {
      const finding = findings.find(item => item.id === id);
      const decay = normalizeDecayClass(finding?.confidence_decay, "slow");
      return ageInDays > STALENESS_THRESHOLDS[decay];
    });
    const coreOverdue = overdue.filter(id => {
      const finding = findings.find(item => item.id === id);
      return finding?.recommendation_role === "core";
    });
    const isOverdue = coreOverdue.length >= 1 || overdue.length >= 2;
    if (isOverdue) {
      return { status: "overdue", age_days: ageInDays, decay_class: decayClass, triggering_findings: overdue.slice(0, 3) };
    }
    const closestThreshold = Math.min(...materialIds.map(id => {
      const finding = findings.find(item => item.id === id);
      const decay = normalizeDecayClass(finding?.confidence_decay, "slow");
      return STALENESS_THRESHOLDS[decay] - ageInDays;
    }));
    if (closestThreshold >= 0 && closestThreshold <= APPROACHING_BAND[decayClass]) {
      return { status: "approaching", age_days: ageInDays, decay_class: decayClass, days_until_threshold: Math.round(closestThreshold) };
    }
    return { status: "current", age_days: ageInDays, decay_class: decayClass };
  }

  const decayClass = "slow";
  const daysUntilThreshold = STALENESS_THRESHOLDS[decayClass] - ageInDays;
  if (daysUntilThreshold < 0) {
    return { status: "overdue", age_days: ageInDays, decay_class: decayClass, reason: "no material staleness summary" };
  }
  if (daysUntilThreshold <= APPROACHING_BAND[decayClass]) {
    return { status: "approaching", age_days: ageInDays, decay_class: decayClass, days_until_threshold: Math.round(daysUntilThreshold) };
  }
  return { status: "current", age_days: ageInDays, decay_class: decayClass, reason: "default slow decay" };
}

function analyzeTopic(slug) {
  const topicDir = path.join(topicsRoot, slug);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const manifestDir = path.join(pipelineDir, "manifests");

  const pipelineMarkdownFiles = listFiles(pipelineDir, /\.md$/i);
  const pipelineJsonFiles = listFiles(pipelineDir, /\.json$/i);
  const manifestFiles = listFilesRecursive(manifestDir, /\.json$/i);
  const revisionDrafts = pipelineMarkdownFiles.filter(filePath => /^draft-rev\d+-(overview|notes|verdict)\.md$/i.test(path.basename(filePath)));
  const finalFiles = FINAL_FILES.map(fileName => path.join(topicDir, fileName)).filter(fs.existsSync);

  const evidence = readJsonIfExists(path.join(pipelineDir, "evidence.json"));
  const scorecardText = readTextIfExists(path.join(pipelineDir, "scorecard.md"));
  const finalText = finalFiles.map(readTextIfExists).join("\n");

  const fullArtifactBytes = sumFileSizes(PIPELINE_FULL_ARTIFACTS.map(fileName => path.join(pipelineDir, fileName)));
  const manifestBytes = sumFileSizes(manifestFiles);
  const avoidedContextBytes = Math.max(0, fullArtifactBytes - manifestBytes);

  return {
    slug,
    pipeline_markdown_bytes: sumFileSizes(pipelineMarkdownFiles),
    pipeline_json_bytes: sumFileSizes(pipelineJsonFiles),
    manifest_bytes: manifestBytes,
    revision_draft_count: revisionDrafts.length,
    final_output_bytes: sumFileSizes(finalFiles),
    citation_count: countCitations(finalText),
    evidence_finding_count: Array.isArray(evidence?.findings) ? evidence.findings.length : null,
    scorecard_score: extractScorecardScore(scorecardText),
    stale_status: extractStalenessStatus(slug, topicDir, evidence),
    citation_status: extractCitationStatus(pipelineDir),
    avoided_context_bytes: avoidedContextBytes,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function markdownReport(rows) {
  const totalAvoided = rows.reduce((sum, row) => sum + row.avoided_context_bytes, 0);
  const generated = new Date().toISOString().slice(0, 10);
  const lines = [
    "---",
    "title: Context Impact Report",
    "tags: [meta, context, pipeline]",
    `created: ${generated}`,
    "---",
    "",
    `# Context Impact Report - ${generated}`,
    "",
    `Estimated avoidable full-artifact context: **${formatBytes(totalAvoided)}**`,
    "",
    "| Topic | Pipeline MD | Pipeline JSON | Manifests | Revisions | Final Files | Citations | Findings | Score | Stale | Citation Check | Avoided Context |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |",
  ];

  for (const row of rows) {
    lines.push([
      `| ${row.slug}`,
      formatBytes(row.pipeline_markdown_bytes),
      formatBytes(row.pipeline_json_bytes),
      formatBytes(row.manifest_bytes),
      row.revision_draft_count,
      formatBytes(row.final_output_bytes),
      row.citation_count,
      row.evidence_finding_count ?? "n/a",
      row.scorecard_score ?? "n/a",
      row.stale_status.status,
      row.citation_status.status,
      `${formatBytes(row.avoided_context_bytes)} |`,
    ].join(" | "));
  }

  lines.push("");
  lines.push("Note: avoided context is an approximation: selected full private artifacts minus manifest JSON currently present.");
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = args.topic ? [args.topic] : listTopicSlugs(topicsRoot);
  const rows = slugs.map(analyzeTopic);

  if (args.json) {
    console.log(JSON.stringify({ total: rows.length, rows }, null, 2));
    return;
  }

  const report = markdownReport(rows);
  console.log(report);

  if (args.write) {
    fs.mkdirSync(metaRoot, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const outPath = path.join(metaRoot, `context-impact-report-${today}.md`);
    fs.writeFileSync(outPath, report);
    console.log(`Wrote ${path.relative(repoRoot, outPath).replace(/\\/g, "/")}`);
  }
}

main();
