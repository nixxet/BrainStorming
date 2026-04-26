#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { listTopicSlugs } = require("./lib/topic-utils");
const { isValidTopicSlug } = require("./lib/safe-paths");

const ROOT = path.join(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "topics");
const ALIAS_CONFIG_PATH = path.join(__dirname, "config", "source-aliases.json");

function loadSourceAliases() {
  try {
    const raw = fs.readFileSync(ALIAS_CONFIG_PATH, "utf8");
    const data = JSON.parse(raw);
    const result = {};
    for (const [fragment, aliases] of Object.entries(data)) {
      if (fragment.startsWith("_")) continue;
      result[fragment] = Array.isArray(aliases) ? aliases : [aliases];
    }
    return result;
  } catch {
    return {};
  }
}

const SOURCE_ALIASES = loadSourceAliases();
const PUBLISHED_FILES = ["overview.md", "notes.md", "verdict.md"];
const CONFIDENCE_PATTERN = /\b(HIGH|MEDIUM|LOW|UNVERIFIED)\b/;
const URL_PATTERN = /https?:\/\/|]\(https?:\/\//;
const INTERNAL_LINK_PATTERN = /\]\(internal\)/;
const SOURCE_PATTERN = /\[[A-Z][A-Za-z0-9 .,#:-]{1,80}\]|\b[Ss]ources?:/;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const BRACKET_PATTERN = /\[([^\]]+)\]/g;
const NON_SOURCE_LABELS = new Set(["HIGH", "MEDIUM", "LOW", "UNVERIFIED"]);
const INTERNAL_ANALYSIS_PATTERN = /\b(analy\w*|interpret\w*|history|gaps?|benchmark\w*|deep.?dive|stress.test|landscape|finding\w*|protocol\w*|practic\w*|material\w*|guide|comparison\w*|multiple|counter|caveat\w*|synthesis|recommendation\w*|mitigation\w*)\b/i;

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

function normalizeLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function aliasesForLabel(label) {
  const normalized = normalizeLabel(label);
  if (!normalized) return [];

  const aliases = new Set([normalized]);
  const words = normalized.split(" ");
  if (words.length > 1) aliases.add(words[0]);

  const compact = normalized
    .replace(/\b(benchmark|comparison|real world|project|page|repository|metadata|readme|release notes|releases|documentation|article|blog|security advisory|advisory)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (compact) aliases.add(compact);

  if (normalized.includes("github issue")) aliases.add("github issue");
  if (normalized.includes("github 41")) aliases.add("github issue 41");
  if (normalized.includes("github releases")) aliases.add("github releases");
  if (normalized.includes("github")) aliases.add("github");
  if (normalized.includes("nvd")) aliases.add("nvd");
  if (normalized.includes("semver")) aliases.add("semver");
  if (normalized.includes("pyproject")) aliases.add("pyproject toml");
  if (normalized.includes("dev community")) aliases.add("dev community");

  for (const [fragment, aliasValues] of Object.entries(SOURCE_ALIASES)) {
    if (normalized.includes(fragment)) {
      for (const alias of aliasValues) aliases.add(alias);
    }
  }

  return [...aliases].filter(Boolean);
}

function addRegistryEntry(registry, label, url) {
  for (const alias of aliasesForLabel(label)) {
    if (!registry.has(alias)) registry.set(alias, { label, url });
  }
}

function contentLinesWithoutFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  const numbered = lines.map((text, index) => ({ text, lineNumber: index + 1 }));
  if (lines[0] !== "---") return numbered;
  const end = lines.findIndex((line, index) => index > 0 && line === "---");
  return end > 0 ? numbered.slice(end + 1) : numbered;
}

function extractSourceLabels(text) {
  const labels = [];
  let match;
  BRACKET_PATTERN.lastIndex = 0;
  while ((match = BRACKET_PATTERN.exec(text)) !== null) {
    const raw = match[1].trim();
    if (NON_SOURCE_LABELS.has(raw)) continue;
    if (/^(HIGH|MEDIUM|LOW|UNVERIFIED)\b/.test(raw)) continue;
    for (const part of raw.split(",")) {
      const label = part.trim();
      if (!label || NON_SOURCE_LABELS.has(label)) continue;
      if (/^[a-z0-9_-]+$/.test(label)) continue;
      if (/^[a-z]\S* /.test(label)) continue; // lowercase-starting multi-word: example data, not a source
      if (/^[A-Z][A-Z\s]+$/.test(label)) continue; // all-caps: template placeholder, not a source
      labels.push(label);
    }
  }
  return labels;
}

function buildSourceRegistry(topicDir) {
  const registry = new Map();
  for (const fileName of PUBLISHED_FILES) {
    const filePath = path.join(topicDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    let match;
    MARKDOWN_LINK_PATTERN.lastIndex = 0;
    while ((match = MARKDOWN_LINK_PATTERN.exec(content)) !== null) {
      addRegistryEntry(registry, match[1], match[2]);
    }
  }
  return registry;
}

function sourceRegistrySupport(labels, registry) {
  if (labels.length === 0) return [];
  return labels
    .map(label => {
      const source = registry.get(normalizeLabel(label));
      return source ? { label, url: source.url, registry_label: source.label } : null;
    })
    .filter(Boolean);
}

function mentionedRegistrySupport(text, registry) {
  const normalizedText = normalizeLabel(text);
  const matches = [];
  for (const [alias, source] of registry.entries()) {
    if (alias.length < 5) continue;
    if (normalizedText.includes(alias)) {
      matches.push({ label: alias, url: source.url, registry_label: source.label });
    }
  }
  return matches;
}

function hasNearbyEvidence(lines, index) {
  return lines
    .slice(index + 1, index + 11)
    .some(({ text }) => URL_PATTERN.test(text));
}

function inspectLine(line, lineNumber, fileName, registry, lines, index) {
  const text = stripMarkdown(line);
  if (!text || text.startsWith("#") || text.startsWith("|")) return null;
  if (/^-\s*(HIGH|MEDIUM|LOW|UNVERIFIED):\s*\d+/i.test(text)) return null;
  const hasConfidence = CONFIDENCE_PATTERN.test(text);
  const hasSourceMarker = SOURCE_PATTERN.test(text);
  if (!hasConfidence && !hasSourceMarker) return null;

  const sourceLabels = extractSourceLabels(text);
  const registryMatches = sourceRegistrySupport(sourceLabels, registry);
  const mentionedMatches = sourceLabels.length === 0 ? mentionedRegistrySupport(text, registry) : [];
  const directlySupported = URL_PATTERN.test(text) || INTERNAL_LINK_PATTERN.test(text);
  const inlineInternalAnalysis = /\bSource:\s+internal (analysis|synthesis)\b/i.test(text) ||
    (sourceLabels.length === 0 && INTERNAL_ANALYSIS_PATTERN.test(text));
  const internalAnalysis = !directlySupported && (
    inlineInternalAnalysis ||
    (sourceLabels.length > 0 && sourceLabels.every(label => INTERNAL_ANALYSIS_PATTERN.test(label)))
  );
  const nearbyEvidence = !directlySupported && sourceLabels.length === 0 && text.endsWith(":") && hasNearbyEvidence(lines, index);
  const registrySupported = !directlySupported && sourceLabels.length > 0 && registryMatches.length === sourceLabels.length;
  const mentionedSupported = !directlySupported && sourceLabels.length === 0 && mentionedMatches.length > 0;
  const supported = directlySupported || registrySupported || mentionedSupported || internalAnalysis || nearbyEvidence;
  return {
    file: fileName,
    line: lineNumber,
    supported,
    support_type: directlySupported ? "direct_url" : registrySupported ? "source_registry" : mentionedSupported ? "source_registry" : nearbyEvidence ? "nearby_evidence" : internalAnalysis ? "internal_analysis" : "needs_review",
    confidence: hasConfidence ? (text.match(CONFIDENCE_PATTERN) || [null, null])[1] : null,
    source_labels: sourceLabels,
    registry_matches: registryMatches.length > 0 ? registryMatches : mentionedMatches,
    text: text.slice(0, 220),
  };
}

function checkTopic(slug) {
  const topicDir = path.join(TOPICS_DIR, slug);
  const registry = buildSourceRegistry(topicDir);
  const findings = [];

  for (const fileName of PUBLISHED_FILES) {
    const filePath = path.join(topicDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    const lines = contentLinesWithoutFrontmatter(fs.readFileSync(filePath, "utf8"));
    lines.forEach(({ text, lineNumber }, index) => {
      const finding = inspectLine(text, lineNumber, fileName, registry, lines, index);
      if (finding) findings.push(finding);
    });
  }

  const directlySupported = findings.filter(finding => finding.support_type === "direct_url").length;
  const registrySupported = findings.filter(finding => finding.support_type === "source_registry").length;
  const nearbyEvidence = findings.filter(finding => finding.support_type === "nearby_evidence").length;
  const internalAnalysis = findings.filter(finding => finding.support_type === "internal_analysis").length;
  const needsReview = findings.filter(finding => !finding.supported);
  return {
    slug,
    source_registry_entries: registry.size,
    claims_checked: findings.length,
    directly_supported: directlySupported,
    registry_supported: registrySupported,
    nearby_evidence: nearbyEvidence,
    internal_analysis: internalAnalysis,
    needs_review: needsReview.length,
    findings: needsReview,
  };
}

if (topic && !isValidTopicSlug(topic)) {
  console.error(`Error: invalid topic slug "${topic}" — slugs must be lowercase alphanumeric and hyphens only`);
  process.exit(1);
}

const slugs = allMode ? listTopicSlugs(TOPICS_DIR) : [topic];
const topics = slugs.map(checkTopic);
const summary = {
  topics_checked: topics.length,
  claims_checked: topics.reduce((sum, item) => sum + item.claims_checked, 0),
  directly_supported: topics.reduce((sum, item) => sum + item.directly_supported, 0),
  registry_supported: topics.reduce((sum, item) => sum + item.registry_supported, 0),
  nearby_evidence: topics.reduce((sum, item) => sum + item.nearby_evidence, 0),
  internal_analysis: topics.reduce((sum, item) => sum + item.internal_analysis, 0),
  needs_review: topics.reduce((sum, item) => sum + item.needs_review, 0),
};

console.log(JSON.stringify({ summary, topics }, null, 2));
process.exit(strict && summary.needs_review > 0 ? 1 : 0);
