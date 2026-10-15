#!/usr/bin/env node
/*
---
title: Topic Index Rebuilder
created: 2026-04-14
purpose: Reconstruct the BrainStorming topic registry in index.md by extracting canonical title, status, and recommendation summary data from topics/{slug}/verdict.md files.
---
*/
// Usage: node scripts/regenerate-index.js [--dry-run]

const fs = require('fs');
const path = require('path');
const { readArchivedSlugs } = require('./lib/archived-topics');
const { WORKSPACE_ROOT } = require('./lib/workspace');

const HELP_FLAGS = ['--help', '-h'];
const KNOWN_FLAGS = ['--dry-run', ...HELP_FLAGS];

if (process.argv.slice(2).some(a => HELP_FLAGS.includes(a))) {
  console.log(`Usage: node scripts/regenerate-index.js [--dry-run]

REPAIR/REBUILD TOOL ONLY — do not run as part of normal pipeline operation.
Rebuilds index.md from verdict.md files alphabetically, overwriting hand-crafted Publisher summaries.
Only use if index.md is corrupted or needs a full rebuild.

Options:
  --dry-run    Preview without writing
  --help, -h   Show this help

Exit codes: 0 = success  |  1 = error
`);
  process.exit(0);
}

const unknownFlags = process.argv.slice(2).filter(a => a.startsWith('--') && !KNOWN_FLAGS.includes(a));
if (unknownFlags.length > 0) {
  console.error(`Unknown flags: ${unknownFlags.join(', ')}. Run with --help for usage.`);
  process.exit(1);
}

const TOPICS_DIR = path.join(WORKSPACE_ROOT, 'topics');
const INDEX_PATH = path.join(WORKSPACE_ROOT, 'index.md');
const DRY_RUN = process.argv.includes('--dry-run');

function parseFrontmatter(content) {
  // M4 fix (2026-06-06): tolerate CRLF. The old /^---\n/ never matched a Windows
  // verdict.md (---\r\n), so title fell back to slug and status to "Unknown". The
  // per-line trim() below already strips \r from values.
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

// M4 fix (2026-06-06): escape `|` and collapse newlines so a title/verdict
// containing a pipe can't inject extra table columns or break the GFM row.
function cell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n+/g, " ").trim();
}

function extractRecommendation(content) {
  // Try multiple heading patterns used across topic generations
  const patterns = [
    /## Recommendation\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/,
    /## Verdict\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/,
    /## Executive Verdict\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/,
    /## Bottom Line\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/,
    /## Key Recommendation\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/,
    /## Status:.*?\n+([\s\S]*?)(?=\n##|\n---|\n$)/
  ];
  let match = null;
  for (const pat of patterns) {
    match = content.match(pat);
    if (match) break;
  }
  if (!match) return '';
  // Get first paragraph — text up to the first blank line
  const firstPara = match[1].split(/\n\s*\n/)[0].trim();
  // Strip markdown bold/italic and clean up
  let clean = firstPara
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  // Truncate to ~200 chars at a sentence boundary
  if (clean.length > 200) {
    const truncated = clean.slice(0, 200);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSemicolon = truncated.lastIndexOf(';');
    const breakAt = Math.max(lastPeriod, lastSemicolon);
    clean = breakAt > 100 ? clean.slice(0, breakAt + 1) : truncated + '...';
  }
  return clean;
}

function getStatus(fm) {
  const status = fm.status || 'Unknown';
  const created = fm.created || '';
  const updated = fm.updated || '';
  const date = updated || created;
  // Capitalize first letter
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  // Some topics embed the date in the status frontmatter itself ("archived
  // 2026-05-13") — don't append it a second time.
  if (!date || label.includes(String(date))) return label;
  return `${label} ${date}`;
}

function getTopicDisplayName(fm, slug) {
  if (fm.title) {
    // Strip " — Verdict" / " - Verdict" / " -- Verdict" suffix. The `+` is load-bearing
    // (2026-06-07): the encoding fold turns title em-dashes into "--", so a single-dash
    // class left a dangling " -" on the stripped title.
    return fm.title.replace(/\s*[—–-]+\s*Verdict.*$/i, '').trim();
  }
  // Fallback: slug to title case
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function main() {
  const topicDirs = fs.readdirSync(TOPICS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const inProgress = topicDirs.filter(slug => {
    const statePath = path.join(TOPICS_DIR, slug, '_pipeline', 'state.json');
    if (!fs.existsSync(statePath)) return false;
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return state.phases && Object.values(state.phases).some(p => p.status === 'in_progress');
    } catch {
      return false;
    }
  });
  if (inProgress.length > 0) {
    console.error(`ERROR: Active pipeline runs detected: ${inProgress.join(', ')}`);
    console.error('Cannot regenerate index while pipelines are in progress. Wait for them to complete.');
    process.exit(1);
  }

  // 2026-06-09 fix: archive-topic.js moves rows from index.md to
  // archived-topics.md but folders stay on disk, so an unfiltered rebuild
  // silently un-archived every retired topic (20 resurrected rows).
  const archivedSlugs = readArchivedSlugs(WORKSPACE_ROOT);

  const rows = [];
  const excludedArchived = [];

  for (const slug of topicDirs) {
    if (archivedSlugs.has(slug)) {
      excludedArchived.push(slug);
      continue;
    }
    const verdictPath = path.join(TOPICS_DIR, slug, 'verdict.md');
    if (!fs.existsSync(verdictPath)) {
      console.warn(`SKIP: ${slug} — no verdict.md`);
      continue;
    }

    const content = fs.readFileSync(verdictPath, 'utf8');
    const fm = parseFrontmatter(content);
    const name = getTopicDisplayName(fm, slug);
    const status = getStatus(fm);
    const verdict = extractRecommendation(content);

    rows.push(`| [${cell(name)}](topics/${slug}/) | ${cell(status)} | ${cell(verdict)} |`);
  }

  const output = [
    '# BrainStorming -- Topic Index',
    '',
    '| Topic | Status | Verdict |',
    '|-------|--------|---------|',
    ...rows,
    ''
  ].join('\n');

  if (excludedArchived.length > 0) {
    console.log(`EXCLUDED (archived, listed in archived-topics.md): ${excludedArchived.length} topic(s).`);
  }
  if (DRY_RUN) {
    console.log(output);
    console.log(`\n--- ${rows.length} topics found (dry run, index.md not written) ---`);
  } else {
    fs.writeFileSync(INDEX_PATH, output, 'utf8');
    console.log(`index.md regenerated with ${rows.length} topics.`);
  }
}

main();
