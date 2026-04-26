#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { listTopicSlugs } = require("./lib/topic-utils");

const ROOT = path.join(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "topics");
const PUBLISHED_FILES = ["overview.md", "notes.md", "verdict.md"];
const CONFIDENCE_PATTERN = /\b(HIGH|MEDIUM|LOW|UNVERIFIED)\b/;
const URL_PATTERN = /https?:\/\/|]\(https?:\/\//;
const SOURCE_PATTERN = /\[[A-Z][A-Za-z0-9 .,#:-]{1,80}\]|\b[Ss]ources?:/;

const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(`Usage:
  node scripts/claim-support-check.js --all [--strict]
  node scripts/claim-support-check.js --topic {slug} [--strict]

Checks published topic files for claim-like lines that contain confidence labels
or source markers but no direct URL. This is a local support heuristic, not a
truth validator.
`);
  process.exit(0);
}

const strict = args.includes("--strict");
const allMode = args.includes("--all");
const topic = args.includes("--topic") ? args[args.indexOf("--topic") + 1] : null;

if (!allMode && !topic) {
  console.error("Error: provide --all or --topic {slug}");
  process.exit(1);
}

function stripMarkdown(line) {
  return line.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function contentLinesWithoutFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  const numbered = lines.map((text, index) => ({ text, lineNumber: index + 1 }));
  if (lines[0] !== "---") return numbered;
  const end = lines.findIndex((line, index) => index > 0 && line === "---");
  return end > 0 ? numbered.slice(end + 1) : numbered;
}

function inspectLine(line, lineNumber, fileName) {
  const text = stripMarkdown(line);
  if (!text || text.startsWith("#") || text.startsWith("|")) return null;
  const hasConfidence = CONFIDENCE_PATTERN.test(text);
  const hasSourceMarker = SOURCE_PATTERN.test(text);
  if (!hasConfidence && !hasSourceMarker) return null;

  const supported = URL_PATTERN.test(text);
  return {
    file: fileName,
    line: lineNumber,
    supported,
    confidence: hasConfidence ? (text.match(CONFIDENCE_PATTERN) || [null, null])[1] : null,
    text: text.slice(0, 220),
  };
}

function checkTopic(slug) {
  const topicDir = path.join(TOPICS_DIR, slug);
  const findings = [];

  for (const fileName of PUBLISHED_FILES) {
    const filePath = path.join(topicDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    const lines = contentLinesWithoutFrontmatter(fs.readFileSync(filePath, "utf8"));
    lines.forEach(({ text, lineNumber }) => {
      const finding = inspectLine(text, lineNumber, fileName);
      if (finding) findings.push(finding);
    });
  }

  const supported = findings.filter(finding => finding.supported).length;
  const needsReview = findings.filter(finding => !finding.supported);
  return {
    slug,
    claims_checked: findings.length,
    directly_supported: supported,
    needs_review: needsReview.length,
    findings: needsReview,
  };
}

const slugs = allMode ? listTopicSlugs(TOPICS_DIR) : [topic];
const topics = slugs.map(checkTopic);
const summary = {
  topics_checked: topics.length,
  claims_checked: topics.reduce((sum, item) => sum + item.claims_checked, 0),
  directly_supported: topics.reduce((sum, item) => sum + item.directly_supported, 0),
  needs_review: topics.reduce((sum, item) => sum + item.needs_review, 0),
};

console.log(JSON.stringify({ summary, topics }, null, 2));
process.exit(strict && summary.needs_review > 0 ? 1 : 0);
