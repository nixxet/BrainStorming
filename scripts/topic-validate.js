#!/usr/bin/env node
/*
title: Topic Publish-Readiness Validator
purpose: Check whether a topic folder meets the structural contract before publishing or re-research.
*/

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");
const indexPath = path.join(repoRoot, "index.md");
const archivePath = path.join(repoRoot, "archived-topics.md");

function printHelp() {
  console.log(`Usage:
  node scripts/topic-validate.js <slug> [--json]
  node scripts/topic-validate.js --all [--json]

Arguments:
  <slug>   Validate a single topic under topics/<slug>/

Options:
  --all    Validate all non-reserved topic folders
  --json   Output JSON result
  --help   Show this help

Checks performed:
  - Required files present: overview.md, notes.md, verdict.md
  - Recommended frontmatter keys present in overview.md and verdict.md
  - verdict.md has non-null score and verdict fields
  - Topic row exists in index.md (or archived-topics.md)

Exit codes:
  0  All checks passed
  1  One or more checks failed
`);
}

function parseArgs(argv) {
  const args = { slug: null, all: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") { args.all = true; }
    else if (a === "--json") { args.json = true; }
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else if (!a.startsWith("--") && !args.slug) { args.slug = a; }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(1); }
  }
  return args;
}

const RESERVED = new Set(["_meta", "_cross", "_tmp"]);

function readIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function parseFrontmatter(content) {
  if (!content || !content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end === -1) return {};
  const yaml = content.slice(4, end);
  const result = {};
  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.trim();
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

function indexContains(slug) {
  const idx = readIfExists(indexPath) || "";
  const arch = readIfExists(archivePath) || "";
  const pattern = `topics/${slug}/`;
  return { inIndex: idx.includes(pattern), inArchive: arch.includes(pattern) };
}

function validateTopic(slug) {
  const topicDir = path.join(topicsRoot, slug);
  const checks = [];

  function check(name, passed, message) {
    checks.push({ name, passed, message: passed ? "OK" : message });
  }

  if (!fs.existsSync(topicDir)) {
    return { slug, passed: false, checks: [{ name: "folder-exists", passed: false, message: `topics/${slug}/ does not exist` }] };
  }

  const requiredFiles = ["overview.md", "notes.md", "verdict.md"];
  for (const f of requiredFiles) {
    check(`file:${f}`, fs.existsSync(path.join(topicDir, f)), `Missing: topics/${slug}/${f}`);
  }

  const overviewContent = readIfExists(path.join(topicDir, "overview.md"));
  if (overviewContent) {
    const fm = parseFrontmatter(overviewContent);
    const required = ["title", "tags"];
    for (const k of required) {
      check(`overview-frontmatter:${k}`, !!fm[k], `overview.md missing frontmatter key: ${k}`);
    }
  }

  const verdictContent = readIfExists(path.join(topicDir, "verdict.md"));
  if (verdictContent) {
    const fm = parseFrontmatter(verdictContent);
    const required = ["title", "tags"];
    for (const k of required) {
      check(`verdict-frontmatter:${k}`, !!fm[k], `verdict.md missing frontmatter key: ${k}`);
    }
    const score = fm.score;
    const verdict = fm.verdict;
    // score/verdict are optional — newer pipeline topics populate them; older/manual topics may not
    if (score !== undefined) {
      check("verdict-score-present", score && score !== "null" && score !== "", "verdict.md: score field is null or empty");
    }
    if (verdict !== undefined) {
      check("verdict-verdict-present", verdict && verdict !== "null" && verdict !== "", "verdict.md: verdict field is null or empty");
    }
  }

  const stateContent = readIfExists(path.join(topicDir, "_pipeline", "state.json"));
  if (stateContent) {
    let state;
    try { state = JSON.parse(stateContent); } catch (e) { check("state-json-parseable", false, `state.json parse error: ${e.message}`); }
    if (state) {
      // Accept any pipeline-created state (has topic_slug), manual (mode=manual), or explicit status
      const isPipelineCreated = !!state.topic_slug;
      const isManual = state.mode === "manual";
      const st = (state.status || "").toLowerCase();
      const isExplicitComplete = st === "complete" || st === "published";
      check("state-not-empty", isPipelineCreated || isManual || isExplicitComplete,
        `state.json has no topic_slug, no mode=manual, and no complete status — may be uninitialized`);
    }
  }

  const { inIndex, inArchive } = indexContains(slug);
  check("in-index-or-archive", inIndex || inArchive, `"${slug}" not found in index.md or archived-topics.md`);

  const passed = checks.every((c) => c.passed);
  return { slug, passed, checks };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let slugs = [];
  if (args.all) {
    slugs = fs.readdirSync(topicsRoot).filter((d) => {
      if (RESERVED.has(d)) return false;
      return fs.statSync(path.join(topicsRoot, d)).isDirectory();
    });
  } else if (args.slug) {
    slugs = [args.slug];
  } else {
    console.error("Error: provide a <slug> or --all");
    printHelp();
    process.exit(1);
  }

  const results = slugs.map(validateTopic);
  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  if (args.json) {
    console.log(JSON.stringify({ total: results.length, passed: passed.length, failed: failed.length, results }, null, 2));
  } else {
    if (failed.length === 0) {
      console.log(`All ${results.length} topic(s) passed validation.`);
    } else {
      console.log(`${passed.length}/${results.length} topics passed. ${failed.length} failed:\n`);
      for (const r of failed) {
        console.log(`  FAIL: ${r.slug}`);
        for (const c of r.checks.filter((c) => !c.passed)) {
          console.log(`    - ${c.name}: ${c.message}`);
        }
      }
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
