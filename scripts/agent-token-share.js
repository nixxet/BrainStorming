#!/usr/bin/env node
// Per-agent token-share diagnostic. Reads every topics/*/_pipeline/state.json
// and sums run_metrics.token_usage by agent key.
//
// Usage: node scripts/agent-token-share.js [--csv] [--top=N]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const asCsv = args.includes('--csv');
const topArg = args.find(a => a.startsWith('--top='));
const topN = topArg ? parseInt(topArg.split('=')[1], 10) : null;

const ROOT = path.join(require('./lib/workspace').WORKSPACE_ROOT, 'topics');

const AGENT_KEYS = [
  'researcher', 'investigator', 'gap_fill', 'analyzer',
  'writer', 'critic', 'security_reviewer', 'tester',
  'challenger', 'publisher',
];

function findStateFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findStateFiles(p));
    else if (entry.name === 'state.json') out.push(p);
  }
  return out;
}

const SONNET_RATE = 8 / 1_000_000;
const OPUS_RATE = 39 / 1_000_000;
const AGENT_MODEL = {
  researcher: 'sonnet', investigator: 'sonnet', gap_fill: 'sonnet', tester: 'sonnet',
  publisher: 'haiku',
  analyzer: 'opus', writer: 'opus', critic: 'opus',
  security_reviewer: 'opus', challenger: 'opus',
};
const HAIKU_RATE = 1 / 1_000_000;
function rateFor(agent) {
  const m = AGENT_MODEL[agent];
  if (m === 'opus') return OPUS_RATE;
  if (m === 'haiku') return HAIKU_RATE;
  return SONNET_RATE;
}

const files = findStateFiles(ROOT);
const agentTotals = Object.fromEntries(AGENT_KEYS.map(k => [k, { tokens: 0, runs: 0, max: 0, maxTopic: null }]));
const perTopic = [];
let runsWithAnyData = 0;

for (const f of files) {
  let s;
  try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  const tu = s.run_metrics?.token_usage;
  if (!tu) continue;
  const slug = path.basename(path.dirname(path.dirname(f)));
  let runHasData = false;
  const row = { slug, total: 0 };
  for (const k of AGENT_KEYS) {
    const v = typeof tu[k] === 'number' ? tu[k] : 0;
    if (v > 0) {
      agentTotals[k].tokens += v;
      agentTotals[k].runs += 1;
      if (v > agentTotals[k].max) { agentTotals[k].max = v; agentTotals[k].maxTopic = slug; }
      runHasData = true;
    }
    row[k] = v;
    row.total += v;
  }
  if (runHasData) { runsWithAnyData += 1; perTopic.push(row); }
}

const grandTotal = AGENT_KEYS.reduce((sum, k) => sum + agentTotals[k].tokens, 0);
const grandCost = AGENT_KEYS.reduce((sum, k) => sum + agentTotals[k].tokens * rateFor(k), 0);

if (asCsv) {
  console.log('agent,tokens,share_pct,est_cost_usd,runs_with_data,max_tokens_in_run,max_topic');
  for (const k of AGENT_KEYS) {
    const t = agentTotals[k];
    const share = grandTotal ? (t.tokens / grandTotal * 100).toFixed(1) : '0.0';
    const cost = (t.tokens * rateFor(k)).toFixed(2);
    console.log([k, t.tokens, share, cost, t.runs, t.max, t.maxTopic ?? ''].join(','));
  }
  process.exit(0);
}

const fmtNum = n => n.toLocaleString();
const fmtPct = n => grandTotal ? `${(n / grandTotal * 100).toFixed(1)}%` : '0.0%';
const fmtUsd = n => `$${n.toFixed(2)}`;

const sorted = [...AGENT_KEYS].sort((a, b) => agentTotals[b].tokens - agentTotals[a].tokens);

console.log(`\nPer-Agent Token Share — ${runsWithAnyData} runs with token data, ${files.length} state files scanned`);
console.log(`Grand total: ${fmtNum(grandTotal)} tokens | est. cost ${fmtUsd(grandCost)}\n`);

console.log('| Agent              | Model  | Tokens       | Share  | Est. Cost  | Runs | Max in Single Run | Max Topic |');
console.log('|--------------------|--------|--------------|--------|------------|------|-------------------|-----------|');
for (const k of sorted) {
  const t = agentTotals[k];
  const cost = t.tokens * rateFor(k);
  console.log(`| ${k.padEnd(18)} | ${AGENT_MODEL[k].padEnd(6)} | ${fmtNum(t.tokens).padStart(12)} | ${fmtPct(t.tokens).padStart(6)} | ${fmtUsd(cost).padStart(10)} | ${String(t.runs).padStart(4)} | ${fmtNum(t.max).padStart(17)} | ${t.maxTopic ?? '—'} |`);
}

if (topN && topN > 0) {
  console.log(`\nTop ${topN} runs by total tokens:\n`);
  const top = perTopic.sort((a, b) => b.total - a.total).slice(0, topN);
  const cols = ['slug', 'total', ...sorted];
  console.log('| ' + cols.map(c => c.padEnd(c === 'slug' ? 32 : 10)).join(' | ') + ' |');
  console.log('|' + cols.map(c => '-'.repeat((c === 'slug' ? 32 : 10) + 2)).join('|') + '|');
  for (const r of top) {
    const cells = [r.slug.padEnd(32), fmtNum(r.total).padStart(10), ...sorted.map(k => fmtNum(r[k] || 0).padStart(10))];
    console.log('| ' + cells.join(' | ') + ' |');
  }
}

console.log('');
