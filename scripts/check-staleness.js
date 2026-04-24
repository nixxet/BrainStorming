#!/usr/bin/env node
'use strict';
/**
 * check-staleness.js — Material staleness detection for BrainStorming topics.
 * Flags topics whose recommendation-driving findings have exceeded their decay threshold.
 * Requires P1-C: evidence.json with confidence_decay + staleness_material fields.
 *
 * Usage:
 *   node scripts/check-staleness.js           Console output only
 *   node scripts/check-staleness.js --write   Also write stale-report to topics/_meta/
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'topics');
const META_DIR   = path.join(TOPICS_DIR, '_meta');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/check-staleness.js [options]

Detect topics whose recommendation-driving findings have exceeded their decay threshold.

Options:
  --write      Write stale-report to topics/_meta/ (default: console only)
  --json       Output JSON summary to stdout
  --help, -h   Show this help

Exit codes: 0 = no overdue topics  |  1 = one or more topics overdue  |  2 = error
`);
  process.exit(0);
}

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
const writeReport = process.argv.includes('--write');
const outputJson = process.argv.includes('--json');

// ── Thresholds (days) ────────────────────────────────────────────────────────
const THRESHOLDS = {
  volatile: 90,
  fast: 180,
  slow: 540,    // 18 months
  stable: 1825  // 5 years
};

// ── "Approaching threshold" warning bands (days before threshold) ────────────
const APPROACHING_BAND = {
  volatile: 14,
  fast: 21,
  slow: 45,
  stable: 90
};

// ── Frontmatter parser (simple YAML, handles key: value lines) ───────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w_-]*):\s*(.+)$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

// ── Build archived slug set from archived-topics.md ─────────────────────────
const archivedSlugs = new Set();
const archivedPath = path.join(ROOT, 'archived-topics.md');
if (fs.existsSync(archivedPath)) {
  const archivedContent = fs.readFileSync(archivedPath, 'utf8');
  for (const match of archivedContent.matchAll(/\[([^\]]+)\]\(topics\/([^/)]+)\//g)) {
    archivedSlugs.add(match[2]);
  }
}

// ── Discover topic slugs ─────────────────────────────────────────────────────
const slugs = fs.readdirSync(TOPICS_DIR)
  .filter(name => {
    if (name.startsWith('_')) return false;
    return fs.statSync(path.join(TOPICS_DIR, name)).isDirectory();
  });

// ── Per-topic analysis ───────────────────────────────────────────────────────

const overdue     = [];
const approaching = [];
const upToDate    = [];
const skipped     = [];

for (const slug of slugs) {
  // Skip archived topics
  if (archivedSlugs.has(slug)) continue;

  // Find research date from verdict.md frontmatter
  const verdictPath = path.join(TOPICS_DIR, slug, 'verdict.md');
  if (!fs.existsSync(verdictPath)) {
    skipped.push({ slug, reason: 'no verdict.md' });
    continue;
  }

  const verdictContent = fs.readFileSync(verdictPath, 'utf8');
  const fm = parseFrontmatter(verdictContent);

  let researchDate = null;
  if (fm.created) {
    researchDate = new Date(fm.created);
  } else if (fm.updated) {
    researchDate = new Date(fm.updated);
  }

  if (!researchDate || isNaN(researchDate.getTime())) {
    skipped.push({ slug, reason: "Cannot determine research date — no 'created' field in frontmatter" });
    continue;
  }

  const ageInDays = (today - researchDate) / 86400000;

  // Load evidence.json if present
  const evidencePath = path.join(TOPICS_DIR, slug, '_pipeline', 'evidence.json');
  let evidence = null;
  if (fs.existsSync(evidencePath)) {
    try {
      evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    } catch {
      evidence = null;
    }
  }

  let shouldFlag = false;
  let approaching_flag = false;
  let decayClass = 'slow';
  let triggeringFindings = [];
  let daysOverdue = 0;
  let daysUntilThreshold = null;

  const staleness_summary = evidence?.staleness_summary;
  const findings = evidence?.findings ?? [];

  // Case 1: evidence.json with staleness_summary
  if (staleness_summary?.material_findings?.length > 0) {
    decayClass = staleness_summary.fastest_material_decay ?? 'slow';

    const overdueMaterial = staleness_summary.material_findings.filter(id => {
      const finding = findings.find(f => f.id === id);
      const decay = finding?.confidence_decay ?? 'slow';
      return ageInDays > THRESHOLDS[decay];
    });

    const overdueCore = overdueMaterial.filter(id => {
      const finding = findings.find(f => f.id === id);
      return finding?.recommendation_role === 'core';
    });

    shouldFlag = overdueCore.length >= 1 || overdueMaterial.length >= 2;
    triggeringFindings = [
      ...overdueCore,
      ...overdueMaterial.filter(id => !overdueCore.includes(id))
    ].slice(0, 3);

    if (shouldFlag) {
      // Days overdue: max overdue amount among triggering findings
      daysOverdue = Math.max(...triggeringFindings.map(id => {
        const finding = findings.find(f => f.id === id);
        const decay = finding?.confidence_decay ?? 'slow';
        return Math.round(ageInDays - THRESHOLDS[decay]);
      }));
    } else {
      // Check if approaching
      const closestThreshold = Math.min(...staleness_summary.material_findings.map(id => {
        const finding = findings.find(f => f.id === id);
        const decay = finding?.confidence_decay ?? 'slow';
        return THRESHOLDS[decay] - ageInDays;
      }));

      if (closestThreshold >= 0 && closestThreshold <= APPROACHING_BAND[decayClass]) {
        approaching_flag = true;
        daysUntilThreshold = Math.round(closestThreshold);
      }
    }

  } else {
    // Case 2: no staleness_summary — conservative default (slow)
    decayClass = 'slow';
    shouldFlag = ageInDays > THRESHOLDS.slow;
    triggeringFindings = ['(no evidence.json — defaulted to slow threshold)'];

    if (shouldFlag) {
      daysOverdue = Math.round(ageInDays - THRESHOLDS.slow);
    } else {
      const daysLeft = THRESHOLDS.slow - ageInDays;
      if (daysLeft <= APPROACHING_BAND.slow) {
        approaching_flag = true;
        daysUntilThreshold = Math.round(daysLeft);
      }
    }
  }

  // Build readable triggering finding descriptions
  const triggerDescs = triggeringFindings.map(id => {
    const finding = findings.find(f => f.id === id);
    if (!finding) return id;
    return `${id}: ${finding.title} (${finding.confidence_decay ?? 'slow'}-decay, role: ${finding.recommendation_role ?? '?'})`;
  });

  const row = {
    slug,
    lastResearched: fm.created ?? fm.updated,
    decayClass,
    ageInDays: Math.round(ageInDays),
    threshold: THRESHOLDS[decayClass],
    daysOverdue,
    daysUntilThreshold,
    triggeringFindings: triggerDescs,
    hasEvidenceJson: evidence !== null,
  };

  if (shouldFlag) {
    overdue.push(row);
  } else if (approaching_flag) {
    approaching.push(row);
  } else {
    upToDate.push(row);
  }
}

// ── Format report ────────────────────────────────────────────────────────────

function tableRow(r) {
  return `| [${r.slug}](topics/${r.slug}/) | ${r.lastResearched} | ${r.decayClass} | ${r.ageInDays}d | ${r.threshold}d | ${r.daysOverdue > 0 ? r.daysOverdue + 'd' : '—'} | ${r.triggeringFindings[0] ?? '—'} |`;
}

const lines = [];

lines.push(`---`);
lines.push(`title: Staleness Report`);
lines.push(`created: ${todayStr}`);
lines.push(`tags: [meta, staleness]`);
lines.push(`---`);
lines.push(``);
lines.push(`# Staleness Report — ${todayStr}`);
lines.push(``);
lines.push(`Topics are flagged based on their recommendation-driving findings, not blanket age.`);
lines.push(`Decay class and thresholds: volatile=90d, fast=180d, slow=540d, stable=1825d.`);
lines.push(``);

// Overdue
lines.push(`## Overdue Topics (${overdue.length})`);
lines.push(``);
if (overdue.length === 0) {
  lines.push(`None.`);
} else {
  lines.push(`| Topic | Last Researched | Decay Class | Age | Threshold | Days Overdue | Triggering Finding |`);
  lines.push(`|-------|----------------|-------------|-----|-----------|--------------|-------------------|`);
  for (const r of overdue) lines.push(tableRow(r));
}
lines.push(``);

// Approaching
lines.push(`## Approaching Threshold (${approaching.length})`);
lines.push(``);
if (approaching.length === 0) {
  lines.push(`None.`);
} else {
  lines.push(`| Topic | Last Researched | Decay Class | Age | Threshold | Days Until Threshold | Triggering Finding |`);
  lines.push(`|-------|----------------|-------------|-----|-----------|---------------------|-------------------|`);
  for (const r of approaching) {
    lines.push(`| [${r.slug}](topics/${r.slug}/) | ${r.lastResearched} | ${r.decayClass} | ${r.ageInDays}d | ${r.threshold}d | ${r.daysUntilThreshold}d | ${r.triggeringFindings[0] ?? '—'} |`);
  }
}
lines.push(``);

// Up to date
lines.push(`## Up-to-Date Topics`);
lines.push(``);
lines.push(`${upToDate.length} topics are within threshold. (Not listed to keep report actionable.)`);
lines.push(``);

// Skipped
if (skipped.length > 0) {
  lines.push(`## Skipped (${skipped.length})`);
  lines.push(``);
  for (const s of skipped) {
    lines.push(`- **${s.slug}** — ${s.reason}`);
  }
  lines.push(``);
}

// Why each topic was flagged
if (overdue.length > 0) {
  lines.push(`## Why Each Topic Was Flagged`);
  lines.push(``);
  for (const r of overdue) {
    lines.push(`### ${r.slug}`);
    lines.push(``);
    lines.push(`- **Last researched:** ${r.lastResearched} (${r.ageInDays} days ago)`);
    lines.push(`- **Decay class:** ${r.decayClass} (threshold: ${r.threshold} days)`);
    lines.push(`- **Days overdue:** ${r.daysOverdue}`);
    lines.push(`- **Evidence.json present:** ${r.hasEvidenceJson ? 'yes' : 'no (defaulted to slow threshold)'}`);
    lines.push(`- **Triggering findings:**`);
    for (const tf of r.triggeringFindings) {
      lines.push(`  - ${tf}`);
    }
    lines.push(``);
  }
}

lines.push(`---`);
lines.push(``);
lines.push(`*Generated by scripts/check-staleness.js | ${todayStr}*`);

const report = lines.join('\n');

// ── Output ───────────────────────────────────────────────────────────────────

console.log(report);

if (writeReport) {
  fs.mkdirSync(META_DIR, { recursive: true });
  const outPath = path.join(META_DIR, `stale-report-${todayStr}.md`);
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`\nStale report written: ${outPath}`);
}
