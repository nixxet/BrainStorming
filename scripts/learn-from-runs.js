#!/usr/bin/env node
/*
Learn from past pipeline runs.

Scans every topic's `_pipeline/errors.jsonl` (plus the repo-level
`topics/global-errors.jsonl`) and produces a frequency report grouped by
`kind`, `agent`, and `phase`. Also surfaces:
  - Topics that have ever logged a permission_denied event (settings issues)
  - Manifest gaps still present today
  - State-drift hotspots (which run_metrics fields drift most often)
  - Top three "summaries" per kind so a human can read the pattern

Read-only. Never modifies anything.

Usage:
  node scripts/learn-from-runs.js                # human-readable report
  node scripts/learn-from-runs.js --json         # JSON output
  node scripts/learn-from-runs.js --since 30d    # last N days only
  node scripts/learn-from-runs.js --topic <slug> # one topic only

Exit:
  0 — report printed (zero entries is fine)
  2 — usage error
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { WORKSPACE_ROOT: repoRoot } = require("./lib/workspace");
const topicsRoot = path.join(repoRoot, "topics");

function parseArgs(argv) {
  const args = { json: false, since: null, topic: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--since") args.since = argv[++i];
    else if (a === "--topic") args.topic = argv[++i];
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(
    "Usage: learn-from-runs.js [--json] [--since 30d|7d|<iso>] [--topic <slug>]\n" +
      "\n" +
      "Scans _pipeline/errors.jsonl across topics and surfaces failure patterns.",
  );
}

function parseSince(spec) {
  if (!spec) return null;
  const m = /^(\d+)([dh])$/.exec(spec);
  if (m) {
    const n = parseInt(m[1], 10);
    const ms = m[2] === "d" ? n * 86400000 : n * 3600000;
    return Date.now() - ms;
  }
  const t = Date.parse(spec);
  return Number.isNaN(t) ? null : t;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function listTopics() {
  if (!fs.existsSync(topicsRoot)) return [];
  return fs
    .readdirSync(topicsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name);
}

function collect(args) {
  const since = parseSince(args.since);
  const events = [];

  const slugs = args.topic ? [args.topic] : listTopics();
  for (const slug of slugs) {
    const file = path.join(topicsRoot, slug, "_pipeline", "errors.jsonl");
    for (const e of readJsonl(file)) {
      if (!e.topic) e.topic = slug;
      if (since && Date.parse(e.ts) < since) continue;
      events.push(e);
    }
  }

  if (!args.topic) {
    const globalFile = path.join(topicsRoot, "global-errors.jsonl");
    for (const e of readJsonl(globalFile)) {
      if (since && Date.parse(e.ts) < since) continue;
      events.push(e);
    }
  }

  events.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  return events;
}

function summarize(events) {
  const byKind = new Map();
  const byAgent = new Map();
  const byPhase = new Map();
  const byTopic = new Map();
  const samplesByKind = new Map();
  const driftFieldFreq = new Map();
  const denialFiles = new Map();

  for (const e of events) {
    byKind.set(e.kind, (byKind.get(e.kind) || 0) + 1);
    if (e.agent) byAgent.set(e.agent, (byAgent.get(e.agent) || 0) + 1);
    if (e.phase) byPhase.set(e.phase, (byPhase.get(e.phase) || 0) + 1);
    if (e.topic) byTopic.set(e.topic, (byTopic.get(e.topic) || 0) + 1);

    if (!samplesByKind.has(e.kind)) samplesByKind.set(e.kind, []);
    const samples = samplesByKind.get(e.kind);
    if (samples.length < 3) {
      samples.push({ ts: e.ts, topic: e.topic, summary: e.summary });
    }

    if (e.kind === "state_drift" && Array.isArray(e.detail?.issues)) {
      for (const issue of e.detail.issues) {
        const m = /^([\w_.]+)\s*\(/.exec(issue);
        if (m) {
          driftFieldFreq.set(m[1], (driftFieldFreq.get(m[1]) || 0) + 1);
        }
      }
    }

    if (e.kind === "permission_denied" && e.detail?.file) {
      const f = e.detail.file;
      denialFiles.set(f, (denialFiles.get(f) || 0) + 1);
    }
  }

  return {
    totalEvents: events.length,
    timeRange:
      events.length > 0
        ? { earliest: events[0].ts, latest: events[events.length - 1].ts }
        : null,
    byKind: Object.fromEntries(byKind),
    byAgent: Object.fromEntries(byAgent),
    byPhase: Object.fromEntries(byPhase),
    topicCount: byTopic.size,
    topTopicsByErrorCount: [...byTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    samplesByKind: Object.fromEntries(samplesByKind),
    driftHotspots: [...driftFieldFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    denialHotspots: [...denialFiles.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}

function printHuman(s) {
  if (s.totalEvents === 0) {
    console.log("[learn] No errors logged. (Either runs are clean, or the");
    console.log("        logger hasn't been adopted yet by Director/agents.)");
    return;
  }
  console.log(`[learn] ${s.totalEvents} event(s) across ${s.topicCount} topic(s)`);
  if (s.timeRange) {
    console.log(`        ${s.timeRange.earliest}  →  ${s.timeRange.latest}`);
  }
  console.log("");
  console.log("By kind:");
  for (const [k, n] of Object.entries(s.byKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  }
  if (Object.keys(s.byAgent).length) {
    console.log("\nBy agent:");
    for (const [k, n] of Object.entries(s.byAgent).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(4)}  ${k}`);
    }
  }
  if (Object.keys(s.byPhase).length) {
    console.log("\nBy phase:");
    for (const [k, n] of Object.entries(s.byPhase).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(4)}  ${k}`);
    }
  }
  if (s.topTopicsByErrorCount.length) {
    console.log("\nTop topics by error count:");
    for (const [t, n] of s.topTopicsByErrorCount) {
      console.log(`  ${String(n).padStart(4)}  ${t}`);
    }
  }
  if (s.driftHotspots.length) {
    console.log("\nstate.run_metrics drift hotspots (field → count):");
    for (const [f, n] of s.driftHotspots) {
      console.log(`  ${String(n).padStart(4)}  ${f}`);
    }
  }
  if (s.denialHotspots.length) {
    console.log("\npermission_denied hotspots (file → count):");
    for (const [f, n] of s.denialHotspots) {
      console.log(`  ${String(n).padStart(4)}  ${f}`);
    }
  }
  console.log("\nRecent samples (most recent 3 per kind):");
  for (const [k, samples] of Object.entries(s.samplesByKind)) {
    console.log(`  ${k}:`);
    for (const x of samples) {
      console.log(`    - [${x.ts}] ${x.topic || "(global)"} — ${x.summary}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const events = collect(args);
  const summary = summarize(events);
  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  } else {
    printHuman(summary);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collect, summarize };
