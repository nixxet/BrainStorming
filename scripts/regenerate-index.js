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

const TOPICS_DIR = path.join(__dirname, '..', 'topics');
const INDEX_PATH = path.join(__dirname, '..', 'index.md');
const DRY_RUN = process.argv.includes('--dry-run');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
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
  return date ? `${label} ${date}` : label;
}

function getTopicDisplayName(fm, slug) {
  if (fm.title) {
    // Strip " — Verdict" or " - Verdict" suffix
    return fm.title.replace(/\s*[—–-]\s*Verdict.*$/i, '').trim();
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

  const rows = [];

  for (const slug of topicDirs) {
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

    rows.push(`| [${name}](topics/${slug}/) | ${status} | ${verdict} |`);
  }

  const output = [
    '# BrainStorming — Topic Index',
    '',
    '| Topic | Status | Verdict |',
    '|-------|--------|---------|',
    ...rows,
    ''
  ].join('\n');

  if (DRY_RUN) {
    console.log(output);
    console.log(`\n--- ${rows.length} topics found (dry run, index.md not written) ---`);
  } else {
    fs.writeFileSync(INDEX_PATH, output, 'utf8');
    console.log(`index.md regenerated with ${rows.length} topics.`);
  }
}

main();
