#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  latestFileMatching,
  listTopicSlugs,
  readJsonIfExists,
  readTopicFrontmatter,
} = require("./lib/topic-utils");

const ROOT = path.join(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "topics");
const OUT_DIR = path.join(ROOT, "dist", "dashboard");
const OUT_FILE = path.join(OUT_DIR, "index.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function readFirstHeading(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function citationSummary(slug) {
  const pipelineDir = path.join(TOPICS_DIR, slug, "_pipeline");
  const latest = latestFileMatching(pipelineDir, /^citation-check-\d{4}-\d{2}-\d{2}\.json$/);
  const report = latest ? readJsonIfExists(latest) : null;
  if (!report || report.__parseError) return { label: "not checked", status: "warn", checkedOn: null };

  const failures = (report.dead ?? 0) + (report.timeout ?? 0) + (report.error ?? 0) + (report.blocked ?? 0) + (report.dns_error ?? 0);
  const warnings = (report.warn_auth ?? 0) + (report.warn_placeholder ?? 0);
  const status = failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
  return {
    checkedOn: report.checked_on,
    label: `${report.ok ?? 0}/${report.total_urls ?? 0} OK, ${failures} fail`,
    status,
  };
}

function topicRow(slug) {
  const state = readJsonIfExists(path.join(TOPICS_DIR, slug, "_pipeline", "state.json")) ?? {};
  const fm = readTopicFrontmatter(TOPICS_DIR, slug, "verdict.md");
  const title = state.topic_name || fm.title || readFirstHeading(path.join(TOPICS_DIR, slug, "verdict.md")) || slug;
  const score = state.run_metrics?.final_score ?? state.phases?.phase_4?.final_score ?? null;
  const security = state.security_review_required
    ? dash(state.phases?.phase_5?.verdict)
    : "not required";
  const citations = citationSummary(slug);
  const freshness = fm.created ? `created ${fm.created}` : "unknown";
  const recommendation = readRecommendation(path.join(TOPICS_DIR, slug, "verdict.md"));

  return {
    slug,
    title,
    workflow: state.workflow ?? "unknown",
    score,
    confidence: extractConfidence(path.join(TOPICS_DIR, slug, "verdict.md")),
    freshness,
    security,
    citationLabel: citations.label,
    citationStatus: citations.status,
    citationCheckedOn: citations.checkedOn,
    recommendation,
  };
}

function extractConfidence(filePath) {
  if (!fs.existsSync(filePath)) return "unknown";
  const content = fs.readFileSync(filePath, "utf8");
  const matches = [...content.matchAll(/\*\*\[(HIGH|MEDIUM|LOW|UNVERIFIED)\]\*\*/g)].map(match => match[1]);
  if (matches.length === 0) return "unknown";
  const counts = matches.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function readRecommendation(filePath) {
  if (!fs.existsSync(filePath)) return "No verdict file";
  const content = fs.readFileSync(filePath, "utf8");
  const recommendation = content.match(/\*\*([A-Z][A-Z\s-]{3,40})\*\*/);
  if (recommendation) return recommendation[1].trim();
  const firstBullet = content.match(/^-\s+(.+)$/m);
  return firstBullet ? firstBullet[1].slice(0, 100) : "See verdict";
}

function badgeClass(value) {
  if (value === "pass") return "badge pass";
  if (value === "fail") return "badge fail";
  return "badge warn";
}

function render(rows) {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const averageScore = rows
    .map(row => Number(row.score))
    .filter(Number.isFinite)
    .reduce((sum, score, _index, arr) => sum + score / arr.length, 0);
  const citationFailures = rows.filter(row => row.citationStatus === "fail").length;

  const bodyRows = rows.map(row => `
        <tr>
          <td><a href="../../topics/${escapeHtml(row.slug)}/verdict.md">${escapeHtml(row.title)}</a><span>${escapeHtml(row.slug)}</span></td>
          <td>${escapeHtml(row.workflow)}</td>
          <td>${escapeHtml(row.score === null ? "-" : Number(row.score).toFixed(2))}</td>
          <td>${escapeHtml(row.confidence)}</td>
          <td>${escapeHtml(row.freshness)}</td>
          <td>${escapeHtml(row.security)}</td>
          <td><span class="${badgeClass(row.citationStatus)}">${escapeHtml(row.citationLabel)}</span></td>
          <td>${escapeHtml(row.recommendation)}</td>
        </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BrainStorming Dashboard</title>
  <style>
    :root { color-scheme: light; --ink: #17202a; --muted: #5b6774; --line: #d7dde5; --soft: #f5f7fa; --pass: #147a4b; --warn: #9a5b00; --fail: #b42318; }
    body { margin: 0; font: 14px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; color: var(--ink); background: #ffffff; }
    header { padding: 32px clamp(20px, 4vw, 56px) 20px; border-bottom: 1px solid var(--line); }
    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); }
    main { padding: 24px clamp(20px, 4vw, 56px) 48px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat { border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; background: var(--soft); }
    .stat strong { display: block; font-size: 22px; }
    .stat span { color: var(--muted); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; min-width: 980px; }
    th, td { padding: 11px 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { background: var(--soft); font-size: 12px; text-transform: uppercase; color: var(--muted); }
    td span { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }
    a { color: #0f5ea8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 12px; color: #fff; }
    .badge.pass { background: var(--pass); }
    .badge.warn { background: var(--warn); }
    .badge.fail { background: var(--fail); }
  </style>
</head>
<body>
  <header>
    <h1>BrainStorming Dashboard</h1>
    <p>Generated ${escapeHtml(generatedOn)} from published topic files and local pipeline metadata.</p>
  </header>
  <main>
    <section class="stats" aria-label="Summary">
      <div class="stat"><strong>${rows.length}</strong><span>Topics</span></div>
      <div class="stat"><strong>${Number.isFinite(averageScore) ? averageScore.toFixed(2) : "-"}</strong><span>Average final score</span></div>
      <div class="stat"><strong>${citationFailures}</strong><span>Citation failure topics</span></div>
    </section>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Workflow</th>
            <th>Score</th>
            <th>Confidence</th>
            <th>Freshness</th>
            <th>Security</th>
            <th>Citations</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>${bodyRows}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

const rows = listTopicSlugs(TOPICS_DIR).map(topicRow);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, render(rows), "utf8");
console.log(`Dashboard written: ${OUT_FILE}`);
