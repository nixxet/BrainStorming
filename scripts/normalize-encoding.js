#!/usr/bin/env node
"use strict";

/**
 * normalize-encoding.js — fold copy-paste-hostile typography to ASCII (2026-06-07).
 *
 * The published corpus is valid UTF-8, but ~24.5k non-ASCII typographic chars
 * (em/en dashes, curly quotes, arrows, math operators, ellipsis) render as
 * "weird objects" when pasted into cp1252 / plain-text fields. This folds the
 * UNAMBIGUOUSLY-SAFE set only. It deliberately PRESERVES:
 *   - emoji / status glyphs used in scorecards (✓ ✅ ✗ ❌ ⚠️)
 *   - box-drawing used in diagram.md ASCII art (═ ─ │ └ ├ …)
 * Folding those would change how documents render, so they're out of scope.
 *
 * Usage:
 *   node scripts/normalize-encoding.js [--check|--write] [--all | --topic <slug> | --dir <path>]
 *
 * --check (default): report foldable chars per file; exit 1 if any remain.
 * --write:           fold in place; exit 0.
 * Targets (default --all): --all = all tracked *.md; --topic = one topic's *.md;
 *   --dir = walk a directory for *.md (used by tests).
 *
 * EOL-preserving: only the listed code points are replaced; line endings,
 * emoji, and box-drawing are left byte-for-byte intact.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { isValidTopicSlug } = require("./lib/safe-paths");

const { WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");

// Ordered: multi-char targets and siblings of the same intent. Keys are single
// code points; values are ASCII. Anything not listed is preserved.
const FOLD_MAP = new Map([
  ["—", "--"],  // — em dash
  ["―", "--"],  // ― horizontal bar
  ["–", "-"],   // – en dash
  ["‒", "-"],   // ‒ figure dash
  ["−", "-"],   // − minus sign
  ["→", "->"],  // → rightwards arrow
  ["←", "<-"],  // ← leftwards arrow
  ["↔", "<->"], // ↔ left-right arrow
  ["⇒", "=>"],  // ⇒ rightwards double arrow
  ["“", '"'],   // " left double quote
  ["”", '"'],   // " right double quote
  ["„", '"'],   // „ low double quote
  ["‘", "'"],   // ' left single quote
  ["’", "'"],   // ' right single quote / apostrophe
  ["‚", "'"],   // ‚ low single quote
  ["…", "..."], // … ellipsis
  ["≥", ">="],  // ≥
  ["≤", "<="],  // ≤
  ["≠", "!="],  // ≠
  ["≈", "~="],  // ≈
  ["×", "x"],   // × multiplication sign
]);

const FOLD_REGEX = new RegExp(`[${[...FOLD_MAP.keys()].join("")}]`, "g");

function fold(content) {
  let count = 0;
  const out = content.replace(FOLD_REGEX, (ch) => {
    count += 1;
    return FOLD_MAP.get(ch);
  });
  return { out, count };
}

function walkMarkdown(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      results.push(...walkMarkdown(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

function targetFiles(args) {
  const dirIdx = args.indexOf("--dir");
  if (dirIdx !== -1) {
    const dir = path.resolve(args[dirIdx + 1]);
    return fs.existsSync(dir) ? walkMarkdown(dir) : [];
  }
  const topicIdx = args.indexOf("--topic");
  let listed;
  try {
    listed = execFileSync("git", ["ls-files", "--", "*.md"], { cwd: repoRoot, encoding: "utf8" })
      .trim().split("\n").filter(Boolean);
  } catch {
    listed = walkMarkdown(repoRoot).map((f) => path.relative(repoRoot, f));
  }
  let files = listed.map((rel) => path.join(repoRoot, rel));
  if (topicIdx !== -1) {
    const slug = args[topicIdx + 1];
    if (!isValidTopicSlug(slug)) {
      console.error(`Invalid topic slug: ${slug}`);
      process.exit(1);
    }
    const prefix = path.join(repoRoot, "topics", slug) + path.sep;
    files = files.filter((f) => f.startsWith(prefix));
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: node scripts/normalize-encoding.js [--check|--write] [--all|--topic <slug>|--dir <path>]");
    process.exit(0);
  }
  const write = args.includes("--write");
  const files = targetFiles(args);

  const offenders = [];
  let total = 0;
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const { out, count } = fold(content);
    if (count === 0) continue;
    total += count;
    offenders.push({ file: path.relative(repoRoot, file), count });
    if (write) fs.writeFileSync(file, out, "utf8");
  }

  if (write) {
    console.log(`normalize-encoding: folded ${total} char(s) across ${offenders.length} file(s).`);
    process.exit(0);
  }

  if (offenders.length === 0) {
    console.log(`normalize-encoding: clean — ${files.length} file(s) scanned, 0 foldable chars.`);
    process.exit(0);
  }
  console.error(`normalize-encoding: ${total} foldable char(s) in ${offenders.length} file(s) (run with --write):`);
  for (const o of offenders.slice(0, 40)) console.error(`  ${o.count.toString().padStart(5)}  ${o.file}`);
  if (offenders.length > 40) console.error(`  … and ${offenders.length - 40} more`);
  process.exit(1);
}

main();
