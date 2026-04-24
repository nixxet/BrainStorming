#!/usr/bin/env node
'use strict';
/**
 * bench-diff.js — Compare two bench-report files to show score drift per topic.
 *
 * Usage:
 *   node scripts/bench-diff.js                         # diff two most recent reports
 *   node scripts/bench-diff.js --old 2026-04-01        # compare specific date to latest
 *   node scripts/bench-diff.js --old 2026-04-01 --new 2026-04-16
 *   node scripts/bench-diff.js --list                  # list available bench-reports
 */

const fs = require('fs');
const path = require('path');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/bench-diff.js [options]

Compare two bench-report files to show score drift per topic.

Options:
  --old <date>     Compare from this date (default: second most recent report)
  --new <date>     Compare to this date (default: most recent report)
  --list           List available bench-report files
  --help, -h       Show this help

Exit codes: 0 = success  |  1 = error (no reports found, invalid date)
`);
  process.exit(0);
}

const META_DIR = path.join(__dirname, '..', 'topics', '_meta');

// ── Helpers ──────────────────────────────────────────────────────────────────

function listReports() {
  return fs.readdirSync(META_DIR)
    .filter(f => /^bench-report-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();
}

function parseDateFromFilename(filename) {
  const m = filename.match(/bench-report-(\d{4}-\d{2}-\d{2})\.md$/);
  return m ? m[1] : null;
}

function parseReport(filepath) {
  const text = fs.readFileSync(filepath, 'utf8');
  const rows = {};

  // Extract per-topic table rows
  // Format: | slug | date | workflow | firstScore | finalScore | revisions | phase5 | secΔ | testerΔ | sources | contradictions | challenge |
  const tableSection = text.match(/## Per-Topic Table([\s\S]*?)(?=^## |\Z)/m);
  if (!tableSection) return rows;

  const lines = tableSection[1].split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter((c, i) => i > 0);
    if (cells.length < 5) continue;
    const slug = cells[0];
    if (!slug || slug === 'Topic' || slug.startsWith('---')) continue;

    const finalScore = parseFloat(cells[4]);
    const firstScore = parseFloat(cells[3]);
    const revisions = parseInt(cells[5], 10);

    rows[slug] = {
      slug,
      date: cells[1] || '—',
      workflow: cells[2] || '—',
      firstScore: isNaN(firstScore) ? null : firstScore,
      finalScore: isNaN(finalScore) ? null : finalScore,
      revisions: isNaN(revisions) ? null : revisions,
      phase5: cells[6] || '—',
      challenge: cells[11] || '—',
    };
  }

  return rows;
}

function fmt(v, decimals = 2) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toFixed(decimals);
}

function scoreSymbol(delta) {
  if (delta === null || isNaN(delta)) return '·';
  if (delta > 0.15) return '↑';
  if (delta < -0.15) return '↓';
  return '→';
}

// ── Argument parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let oldDate = null;
let newDate = null;
let listMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--old') oldDate = args[++i];
  else if (args[i] === '--new') newDate = args[++i];
  else if (args[i] === '--list') listMode = true;
}

const allReports = listReports();

if (listMode) {
  console.log('Available bench-reports:');
  for (const r of allReports) {
    console.log(' ', parseDateFromFilename(r));
  }
  process.exit(0);
}

if (allReports.length < 2) {
  console.error('Need at least 2 bench-reports to diff. Run npm run bench-report to generate one.');
  process.exit(1);
}

// Resolve dates
const resolvedNew = newDate
  ? `bench-report-${newDate}.md`
  : allReports[allReports.length - 1];

const resolvedOld = oldDate
  ? `bench-report-${oldDate}.md`
  : allReports[allReports.length - 2];

const oldPath = path.join(META_DIR, resolvedOld);
const newPath = path.join(META_DIR, resolvedNew);

if (!fs.existsSync(oldPath)) {
  console.error(`Old report not found: ${oldPath}`);
  process.exit(1);
}
if (!fs.existsSync(newPath)) {
  console.error(`New report not found: ${newPath}`);
  process.exit(1);
}

const oldRows = parseReport(oldPath);
const newRows = parseReport(newPath);

const oldDateStr = parseDateFromFilename(resolvedOld);
const newDateStr = parseDateFromFilename(resolvedNew);

// ── Build diff ────────────────────────────────────────────────────────────────

const allSlugs = new Set([...Object.keys(oldRows), ...Object.keys(newRows)]);
const changed = [];
const unchanged = [];
const added = [];
const removed = [];

for (const slug of [...allSlugs].sort()) {
  const o = oldRows[slug];
  const n = newRows[slug];

  if (!o) {
    added.push({ slug, row: n });
  } else if (!n) {
    removed.push({ slug, row: o });
  } else {
    const delta = (n.finalScore !== null && o.finalScore !== null)
      ? n.finalScore - o.finalScore
      : null;
    const entry = { slug, old: o, new: n, delta };
    if (delta !== null && Math.abs(delta) > 0.01) {
      changed.push(entry);
    } else {
      unchanged.push(entry);
    }
  }
}

// Sort changed: biggest drops first, then biggest gains
changed.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));

// ── Output ────────────────────────────────────────────────────────────────────

console.log(`\nBench Diff: ${oldDateStr} → ${newDateStr}`);
console.log(`${'─'.repeat(70)}`);

if (changed.length > 0) {
  console.log(`\nScore Changes (${changed.length} topics):\n`);
  console.log(`  ${'Topic'.padEnd(35)} ${'Old'.padStart(6)}  ${'New'.padStart(6)}  ${'Δ'.padStart(6)}  Status`);
  console.log(`  ${'─'.repeat(65)}`);
  for (const { slug, old: o, new: n, delta } of changed) {
    const sym = scoreSymbol(delta);
    const deltaStr = delta !== null ? (delta > 0 ? `+${fmt(delta)}` : fmt(delta)) : '—';
    console.log(`  ${sym} ${slug.padEnd(33)} ${fmt(o.finalScore).padStart(6)}  ${fmt(n.finalScore).padStart(6)}  ${deltaStr.padStart(6)}  ${n.phase5 !== '—' ? `Phase5:${n.phase5}` : ''}`);
  }
}

if (added.length > 0) {
  console.log(`\nNew Topics (${added.length}):\n`);
  for (const { slug, row } of added) {
    console.log(`  + ${slug.padEnd(33)} score: ${fmt(row.finalScore)}  (${row.workflow})`);
  }
}

if (removed.length > 0) {
  console.log(`\nRemoved Topics (${removed.length}):\n`);
  for (const { slug, row } of removed) {
    console.log(`  - ${slug.padEnd(33)} was: ${fmt(row.finalScore)}`);
  }
}

if (unchanged.length > 0) {
  console.log(`\nUnchanged (${unchanged.length} topics): ${unchanged.map(u => u.slug).join(', ')}`);
}

// Summary line
const avgOld = Object.values(oldRows)
  .map(r => r.finalScore).filter(v => v !== null);
const avgNew = Object.values(newRows)
  .map(r => r.finalScore).filter(v => v !== null);
const meanOld = avgOld.reduce((a, b) => a + b, 0) / avgOld.length;
const meanNew = avgNew.reduce((a, b) => a + b, 0) / avgNew.length;
const meanDelta = meanNew - meanOld;
const meanDeltaStr = meanDelta > 0 ? `+${fmt(meanDelta)}` : fmt(meanDelta);

console.log(`\n${'─'.repeat(70)}`);
console.log(`Mean final score: ${fmt(meanOld)} → ${fmt(meanNew)}  (${meanDeltaStr})`);
console.log(`Topics: ${Object.keys(oldRows).length} → ${Object.keys(newRows).length}  (${added.length} added, ${removed.length} removed, ${changed.length} score changes)\n`);
