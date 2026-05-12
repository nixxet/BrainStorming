#!/usr/bin/env node

'use strict';

/**
 * Partition Planner — Prototype
 *
 * Generates a JSON fan-out plan for a research topic: N non-overlapping
 * partitions with explicit scope, anti-scope, and seed queries. Validates
 * the JSON shape and runs a lightweight overlap check before printing.
 *
 * Not wired into the Director yet — standalone proof-of-concept.
 *
 * Usage:
 *   node scripts/partition-planner.js --topic "Kubernetes cost optimization" --n 4
 *   node scripts/partition-planner.js --topic "<name>" --workflow recommend --out path.json
 *   node scripts/partition-planner.js --topic "<name>" --dry-run   # print prompt only
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const GEMINI_QUERY = process.env.GEMINI_QUERY_SCRIPT
  || (() => {
    console.error('error: set GEMINI_QUERY_SCRIPT to the absolute path of your gemini-query.js helper');
    process.exit(2);
  })();
const DEFAULT_N = 4;
const DEFAULT_WORKFLOW = 'research';
const OVERLAP_WARN_JACCARD = 0.30;

// Workflow-aware required dimensions. The planner is biased toward
// internal-engineering decomposition; without this it skips peers and
// adoption signals on tool-research topics.
const REQUIRED_DIMENSIONS = {
  research:  ['alternatives_or_peers', 'adoption_signals'],
  evaluate:  ['alternatives_or_peers', 'adoption_signals'],
  recommend: ['alternatives_or_peers', 'adoption_signals'],
  compare:   [],
};

// Fuzzy keyword groups used to verify a coverage_check dimension actually
// addresses each required slot. Match is case-insensitive substring.
const DIMENSION_KEYWORDS = {
  alternatives_or_peers: ['alternative', 'competitor', 'peer', 'rival', 'vs ', 'comparison', 'landscape'],
  adoption_signals:      ['adoption', 'community', 'sentiment', 'usage', 'popularity', 'github', 'real-world', 'production use'],
};

function parseArgs(argv) {
  const out = { topic: null, n: DEFAULT_N, workflow: DEFAULT_WORKFLOW, outPath: null, dryRun: false, model: 'flash' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--topic') out.topic = argv[++i];
    else if (a === '--n') out.n = parseInt(argv[++i], 10);
    else if (a === '--workflow') out.workflow = argv[++i];
    else if (a === '--out') out.outPath = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--model') out.model = argv[++i];
  }
  return out;
}

function buildPrompt(topic, workflow, n) {
  const required = REQUIRED_DIMENSIONS[workflow] || [];
  const requiredBlock = required.length
    ? `\nMANDATORY DIMENSIONS for workflow="${workflow}" — the coverage_check array MUST include at least one dimension addressing each of these, owned by exactly one partition:\n${required.map(r => `  - ${r} (e.g., competing tools/peers for "${r}"; community/adoption/GitHub-activity signals for adoption)`).join('\n')}\n`
    : '';

  return `You are a research-planning coordinator. Decompose this topic into ${n} mutually-exclusive partitions for parallel fan-out to ${n} sub-researchers.

TOPIC: ${topic}
WORKFLOW: ${workflow}
${requiredBlock}
Rules:
- Each partition must be NON-OVERLAPPING with the others. Two researchers must never have a reason to search the same thing.
- Each partition must be SUFFICIENT — together the ${n} partitions must cover the topic with no major blind spots.
- "anti_scope" is the killer field: it says what this partition must NOT cover (because a sibling partition owns it).
- Seed queries must be specific, not generic.
- coverage_check must enumerate ${n}+ dimensions of the topic and assert each is owned by exactly one partition.
- Do not let internal-engineering framing crowd out external dimensions like peers/alternatives and adoption/community evidence when they are listed as mandatory above.

Output ONLY valid JSON (no markdown fences, no prose) matching this exact shape:

{
  "topic": "${topic}",
  "workflow": "${workflow}",
  "n_partitions": ${n},
  "partitions": [
    {
      "id": "p1",
      "name": "short partition name",
      "scope": "what this researcher MUST cover (1-2 sentences)",
      "anti_scope": "what this researcher MUST NOT cover — owned by which sibling (1-2 sentences)",
      "seed_queries": ["specific query 1", "specific query 2", "specific query 3"]
    }
  ],
  "coverage_check": [
    {"dimension": "name of a topic dimension", "owned_by": "p1"}
  ]
}`;
}

function callGemini({ prompt, model }) {
  const stdout = execFileSync('node', [GEMINI_QUERY, prompt, '--model', model], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.trim();
}

function extractJson(raw) {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('no JSON object found in model output');
  return JSON.parse(text.slice(first, last + 1));
}

function tokenize(s) {
  return new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 3)
  );
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function validate(plan, n) {
  const errors = [];
  if (!plan || typeof plan !== 'object') errors.push('plan is not an object');
  if (!Array.isArray(plan.partitions)) errors.push('partitions is not an array');
  else if (plan.partitions.length !== n) errors.push(`expected ${n} partitions, got ${plan.partitions.length}`);

  const ids = new Set();
  (plan.partitions || []).forEach((p, i) => {
    if (!p.id) errors.push(`partition[${i}] missing id`);
    else if (ids.has(p.id)) errors.push(`duplicate partition id: ${p.id}`);
    else ids.add(p.id);
    for (const field of ['name', 'scope', 'anti_scope']) {
      if (!p[field] || typeof p[field] !== 'string') errors.push(`partition[${i}] missing ${field}`);
    }
    if (!Array.isArray(p.seed_queries) || p.seed_queries.length < 2) {
      errors.push(`partition[${i}] needs >=2 seed_queries`);
    }
  });

  if (!Array.isArray(plan.coverage_check) || plan.coverage_check.length < n) {
    errors.push(`coverage_check must have >=${n} dimensions`);
  } else {
    for (const c of plan.coverage_check) {
      if (!ids.has(c.owned_by)) errors.push(`coverage dimension "${c.dimension}" owned by unknown partition "${c.owned_by}"`);
    }
  }

  const required = REQUIRED_DIMENSIONS[plan.workflow] || [];
  const haystack = [
    ...(plan.coverage_check || []).map(c => String(c.dimension || '')),
    ...(plan.partitions || []).flatMap(p => [p.name, p.scope]),
  ].join(' ').toLowerCase();
  for (const slot of required) {
    const keywords = DIMENSION_KEYWORDS[slot] || [];
    const hit = keywords.some(k => haystack.includes(k.toLowerCase()));
    if (!hit) errors.push(`missing required dimension "${slot}" for workflow="${plan.workflow}" (no partition/coverage mentioned any of: ${keywords.join(', ')})`);
  }

  return errors;
}

function overlapReport(partitions) {
  const tokenSets = partitions.map(p => tokenize(`${p.name} ${p.scope}`));
  const pairs = [];
  for (let i = 0; i < partitions.length; i++) {
    for (let j = i + 1; j < partitions.length; j++) {
      const j2 = jaccard(tokenSets[i], tokenSets[j]);
      pairs.push({ a: partitions[i].id, b: partitions[j].id, jaccard: +j2.toFixed(3) });
    }
  }
  pairs.sort((x, y) => y.jaccard - x.jaccard);
  return pairs;
}

function main() {
  const { topic, n, workflow, outPath, dryRun, model } = parseArgs(process.argv.slice(2));
  if (!topic) {
    console.error('Usage: node partition-planner.js --topic "<name>" [--n 4] [--workflow research|recommend|evaluate|compare] [--out path.json] [--dry-run]');
    process.exit(1);
  }

  const prompt = buildPrompt(topic, workflow, n);

  if (dryRun) {
    console.log(prompt);
    return;
  }

  console.error(`[partition-planner] topic="${topic}" n=${n} workflow=${workflow} model=${model}`);
  const raw = callGemini({ prompt, model });

  let plan;
  try {
    plan = extractJson(raw);
  } catch (e) {
    console.error(`[partition-planner] JSON parse failed: ${e.message}`);
    console.error('--- raw model output ---');
    console.error(raw);
    process.exit(6);
  }

  const errors = validate(plan, n);
  if (errors.length) {
    console.error('[partition-planner] validation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(2);
  }

  const overlaps = overlapReport(plan.partitions);
  const worst = overlaps[0];
  plan._overlap_check = {
    metric: 'jaccard_on_scope_tokens',
    warn_threshold: OVERLAP_WARN_JACCARD,
    pairs: overlaps,
    worst_pair: worst,
    status: worst && worst.jaccard >= OVERLAP_WARN_JACCARD ? 'WARN' : 'OK',
  };

  const jsonOut = JSON.stringify(plan, null, 2);
  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, jsonOut);
    console.error(`[partition-planner] wrote ${outPath}`);
  }
  process.stdout.write(jsonOut + '\n');

  if (plan._overlap_check.status === 'WARN') {
    console.error(`[partition-planner] WARN: max scope overlap jaccard=${worst.jaccard} (${worst.a} vs ${worst.b}) >= ${OVERLAP_WARN_JACCARD}`);
    process.exit(3);
  }
}

main();
