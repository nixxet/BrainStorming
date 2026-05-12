#!/usr/bin/env node
'use strict';
/**
 * check-hygiene.js — Citation floor + topic-folder contract check.
 *
 * Enforces two invariants for published topics:
 *   1. Every published file (overview.md, notes.md, verdict.md) contains at
 *      least N inline URL occurrences (default: 3). Zero URLs = containment
 *      failure.
 *   2. Topic folders contain only the published-files contract:
 *      overview.md, notes.md, verdict.md, _pipeline/. Any extra file is a
 *      ceremony-pollution failure.
 *
 * Usage:
 *   node scripts/check-hygiene.js                    Console table; exit 1 on failure
 *   node scripts/check-hygiene.js --floor 5          Custom floor
 *   node scripts/check-hygiene.js --json             JSON to stdout
 *   node scripts/check-hygiene.js --write            Write report to topics/_meta/
 *   node scripts/check-hygiene.js --topic <slug>     Single-topic check
 *   node scripts/check-hygiene.js --quiet            Only print failures
 *
 * Exit codes:
 *   0 = all pass
 *   1 = one or more topics fail
 *   2 = invocation error
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'topics');
const META_DIR   = path.join(TOPICS_DIR, '_meta');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/check-hygiene.js [options]

Audit published topic files for the citation floor and folder contract.

Options:
  --floor N         Minimum URL count per published file (default: 3)
  --topic <slug>    Check a single topic only
  --json            JSON summary to stdout (suppresses table)
  --write           Write report to topics/_meta/hygiene-report-<date>.md
  --quiet           Only print failing topics
  --help, -h        Show this help

Exit codes: 0 = all pass | 1 = one or more failures | 2 = error
`);
  process.exit(0);
}

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  return argv[i + 1];
}
function has(name) { return argv.includes(name); }

const floor      = Number(flag('--floor') ?? 3);
const onlySlug   = flag('--topic');
const outputJson = has('--json');
const writeReport = has('--write');
const quiet      = has('--quiet');

if (!Number.isFinite(floor) || floor < 0) {
  console.error(`error: --floor must be a non-negative integer (got "${flag('--floor')}")`);
  process.exit(2);
}
if (!fs.existsSync(TOPICS_DIR)) {
  console.error(`error: topics directory not found at ${TOPICS_DIR}`);
  process.exit(2);
}

const ALLOWED_TOPIC_ENTRIES = new Set(['overview.md', 'notes.md', 'verdict.md', '_pipeline']);
const PUBLISHED_FILES = ['overview.md', 'notes.md', 'verdict.md'];

// If a topic has _pipeline/manifests/ at all, these core manifests must exist.
// Catches the "Director inlined some phases instead of spawning subagents"
// failure mode (partial manifests indicate a corrupted run).
const REQUIRED_PHASE_MANIFESTS = [
  'phase-1-researcher.json',
  'phase-1-investigator.json',
  'phase-2-analyzer.json',
  'phase-3-writer.json',
  'phase-4-critic.json',
  'phase-7-publisher.json',
];

function countUrlLines(filePath) {
  if (!fs.existsSync(filePath)) return -1;
  const content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const line of content.split(/\r?\n/)) {
    if (line.includes('https')) count++;
  }
  return count;
}

function loadArchivedSlugs() {
  const archivedPath = path.join(ROOT, 'archived-topics.md');
  const slugs = new Set();
  if (!fs.existsSync(archivedPath)) return slugs;
  const content = fs.readFileSync(archivedPath, 'utf8');
  for (const m of content.matchAll(/\[([^\]]+)\]\(topics\/([^/)]+)\//g)) {
    slugs.add(m[2]);
  }
  return slugs;
}

function isLegacyGrandfathered(slug) {
  const statePath = path.join(TOPICS_DIR, slug, '_pipeline', 'state.json');
  if (!fs.existsSync(statePath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return data.legacy_grandfathered === true;
  } catch { return false; }
}

const archivedSlugs = loadArchivedSlugs();

function listTopicSlugs() {
  const entries = fs.readdirSync(TOPICS_DIR, { withFileTypes: true });
  const slugs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_')) continue;
    if (archivedSlugs.has(entry.name)) continue;
    if (isLegacyGrandfathered(entry.name)) continue;
    if (onlySlug && entry.name !== onlySlug) continue;
    slugs.push(entry.name);
  }
  return slugs.sort();
}

function checkTopic(slug) {
  const dir = path.join(TOPICS_DIR, slug);
  const result = {
    slug,
    counts: {},
    floorFailures: [],
    contractFailures: [],
    manifestFailures: [],
    skipped: false,
  };

  let hasAll = true;
  for (const f of PUBLISHED_FILES) {
    const c = countUrlLines(path.join(dir, f));
    if (c === -1) hasAll = false;
    result.counts[f] = c;
  }
  if (!hasAll) {
    result.skipped = true;
    return result;
  }

  for (const f of PUBLISHED_FILES) {
    if (result.counts[f] < floor) {
      result.floorFailures.push({ file: f, count: result.counts[f] });
    }
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!ALLOWED_TOPIC_ENTRIES.has(entry.name)) {
      result.contractFailures.push(entry.name);
    }
  }

  const manifestDir = path.join(dir, '_pipeline', 'manifests');
  if (fs.existsSync(manifestDir)) {
    for (const m of REQUIRED_PHASE_MANIFESTS) {
      if (!fs.existsSync(path.join(manifestDir, m))) {
        result.manifestFailures.push(m);
      }
    }
  }

  return result;
}

const slugs = listTopicSlugs();
if (onlySlug && slugs.length === 0) {
  console.error(`error: topic "${onlySlug}" not found under ${TOPICS_DIR}`);
  process.exit(2);
}

const results = slugs.map(checkTopic);
const evaluated = results.filter(r => !r.skipped);
const failing = evaluated.filter(r => r.floorFailures.length > 0 || r.contractFailures.length > 0 || r.manifestFailures.length > 0);
const skipped = results.filter(r => r.skipped);

const summary = {
  generated_at: new Date().toISOString(),
  floor,
  total: results.length,
  evaluated: evaluated.length,
  passing: evaluated.length - failing.length,
  failing: failing.length,
  skipped: skipped.length,
  failures: failing.map(r => ({
    slug: r.slug,
    counts: r.counts,
    floor_failures: r.floorFailures,
    contract_failures: r.contractFailures,
  })),
  skipped_slugs: skipped.map(r => r.slug),
};

if (outputJson) {
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} else {
  if (!quiet) {
    console.log(`Hygiene check — floor=${floor} URLs/file, contract=overview/notes/verdict + _pipeline/`);
    console.log('-'.repeat(78));
    console.log('total      ov   nt   vd   slug');
    for (const r of evaluated) {
      const fail = r.floorFailures.length > 0 || r.contractFailures.length > 0 || r.manifestFailures.length > 0;
      const tag = fail ? 'X' : 'OK';
      const total = r.counts['overview.md'] + r.counts['notes.md'] + r.counts['verdict.md'];
      const line = `${tag} ${String(total).padStart(4)}     ${String(r.counts['overview.md']).padStart(3)}  ${String(r.counts['notes.md']).padStart(3)}  ${String(r.counts['verdict.md']).padStart(3)}   ${r.slug}`;
      if (!quiet || fail) console.log(line);
    }
    console.log('-'.repeat(78));
  }
  if (failing.length > 0) {
    console.log('');
    console.log('FAILURES:');
    for (const r of failing) {
      console.log(`  ${r.slug}`);
      for (const ff of r.floorFailures) {
        console.log(`    floor:    ${ff.file} has ${ff.count} URL line(s); minimum is ${floor}`);
      }
      for (const cf of r.contractFailures) {
        console.log(`    contract: unexpected entry "${cf}" — only overview.md/notes.md/verdict.md/_pipeline/ allowed`);
      }
      for (const mf of r.manifestFailures) {
        console.log(`    manifest: missing _pipeline/manifests/${mf} — partial-manifests pattern indicates a Director-inlined phase (subagent did not actually run)`);
      }
    }
  }
  if (skipped.length > 0 && !quiet) {
    console.log(`\nSkipped (missing one or more published files): ${skipped.map(r => r.slug).join(', ')}`);
  }
  console.log('');
  console.log(`${summary.passing} / ${summary.evaluated} topics pass${skipped.length ? ` (${skipped.length} skipped)` : ''}`);
}

if (writeReport) {
  if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const reportPath = path.join(META_DIR, `hygiene-report-${stamp}.md`);
  const lines = [
    `# Hygiene Report — ${stamp}`,
    '',
    `- Floor: ${floor} URL line(s) per published file`,
    `- Contract: \`overview.md\`, \`notes.md\`, \`verdict.md\`, \`_pipeline/\``,
    `- Total: ${summary.total} | Evaluated: ${summary.evaluated} | Passing: ${summary.passing} | Failing: ${summary.failing} | Skipped: ${summary.skipped}`,
    '',
  ];
  if (failing.length > 0) {
    lines.push('## Failures', '');
    lines.push('| Topic | overview | notes | verdict | Issues |');
    lines.push('|---|---:|---:|---:|---|');
    for (const r of failing) {
      const issues = [
        ...r.floorFailures.map(ff => `\`${ff.file}\` has ${ff.count} (<${floor})`),
        ...r.contractFailures.map(cf => `unexpected \`${cf}\``),
      ].join('; ');
      lines.push(`| \`${r.slug}\` | ${r.counts['overview.md']} | ${r.counts['notes.md']} | ${r.counts['verdict.md']} | ${issues} |`);
    }
    lines.push('');
  } else {
    lines.push('All evaluated topics pass.', '');
  }
  if (skipped.length > 0) {
    lines.push('## Skipped (missing published files)', '');
    for (const r of skipped) lines.push(`- \`${r.slug}\``);
    lines.push('');
  }
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  if (!outputJson) console.log(`Report written: ${reportPath}`);
}

process.exit(failing.length > 0 ? 1 : 0);
