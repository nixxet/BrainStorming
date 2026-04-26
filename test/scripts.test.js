const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { parseFrontmatter } = require("../scripts/lib/topic-utils");
const { parseMarkdownRow, parseRowsAfterHeader } = require("../scripts/lib/markdown-table");
const { readPipelineState } = require("../scripts/lib/pipeline-state");
const { isValidTopicSlug, resolveInside, statePathForTopic } = require("../scripts/lib/safe-paths");
const {
  classifyHttpStatus,
  classifyRequestError,
  citationCountKey,
  isFailedCitationStatus,
} = require("../scripts/lib/citation-status");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRoot = path.join(__dirname, "fixtures", "topics");

function run(args) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function installFixtureTopic(slug) {
  const source = path.join(fixtureRoot, slug);
  const target = path.join(repoRoot, "topics", slug);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  return target;
}

test("frontmatter parser handles fixture markdown with CRLF line endings", () => {
  const fixturePath = path.join(fixtureRoot, "valid-topic", "overview.md");
  const content = fs.readFileSync(fixturePath, "utf8").replace(/\n/g, "\r\n");
  const frontmatter = parseFrontmatter(content);

  assert.equal(frontmatter.title, "Fixture Valid Topic - Overview");
  assert.equal(frontmatter.created, "2026-04-24");
});

test("markdown table helper parses rows after a matching header", () => {
  const table = [
    "| Topic | Status | Verdict |",
    "| --- | --- | --- |",
    "| [Fixture](topics/fixture/) | Published | Adopt |",
    "",
  ].join("\n");

  assert.deepEqual(parseMarkdownRow("| A | B |"), ["A", "B"]);
  const rows = parseRowsAfterHeader(table, cells => cells[0] === "Topic");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cells[0], "[Fixture](topics/fixture/)");
  assert.equal(rows[0].lineIndex, 2);
});

test("safe path helper rejects escaping paths and validates topic slugs", () => {
  assert.equal(isValidTopicSlug("valid-topic-1"), true);
  assert.equal(isValidTopicSlug("../escape"), false);
  assert.throws(() => resolveInside(path.join(repoRoot, "topics"), "..", "README.md"), /escapes root/);
});

test("check-staleness --json emits parseable topic freshness data", () => {
  const result = run(["scripts/check-staleness.js", "--json"]);
  assert.equal(result.status, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.summary.skipped, 0);
  assert.ok(payload.summary.fresh >= 2);
  assert.ok(payload.fresh.some(topic => topic.slug === "markitdown"));
  assert.ok(payload.fresh.some(topic => topic.slug === "markitdown-codex-version"));
});

test("validate-pipeline-state skips reserved metadata directories", () => {
  const result = run(["scripts/validate-pipeline-state.js", "--json"]);
  assert.equal(result.status, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.topicsWithIssues, 0);
  assert.equal(payload.topicsChecked, 2);
  assert.ok(!payload.results.some(topic => topic.slug === "_meta"));
});

test("validate-pipeline-state repair previews before writing", () => {
  const slug = "state-repair-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const statePath = statePathForTopic(topicDir);

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(pipelineDir, { recursive: true });

  const initialState = {
    topic_slug: slug,
    phases: {
      phase_4: {
        status: "pending",
        final_score: 0,
        verdict: null,
      },
    },
    run_metrics: {
      final_score: 0,
    },
    errors: [],
  };

  try {
    fs.writeFileSync(path.join(topicDir, "overview.md"), "# State Repair Test\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "notes.md"), "# Notes\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "verdict.md"), "# Verdict\n", "utf8");
    fs.writeFileSync(statePath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
    fs.writeFileSync(
      path.join(pipelineDir, "scorecard.md"),
      "**Weighted Total:** 8.25\n\n**Verdict:** PASS\n",
      "utf8"
    );

    const preview = run(["scripts/validate-pipeline-state.js", "--topic", slug, "--repair", "--json"]);
    assert.equal(preview.status, 0, preview.stderr);
    const previewPayload = JSON.parse(preview.stdout);
    assert.equal(previewPayload.topicsWithIssues, 1);
    assert.equal(previewPayload.topicsUpdated, 0);
    assert.ok(previewPayload.results[0].issues.some(issue => issue.includes("phase_4.status")));
    assert.equal(JSON.parse(fs.readFileSync(statePath, "utf8")).phases.phase_4.status, "pending");

    const write = run(["scripts/validate-pipeline-state.js", "--topic", slug, "--repair", "--write", "--json"]);
    assert.equal(write.status, 0, write.stderr);
    const writePayload = JSON.parse(write.stdout);
    assert.equal(writePayload.topicsUpdated, 1);
    assert.ok(writePayload.results[0].appliedFixes.some(fix => fix.includes("phase_4.status")));

    const repaired = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(repaired.phases.phase_4.status, "completed");
    assert.equal(repaired.phases.phase_4.final_score, 8.25);
    assert.equal(repaired.run_metrics.final_score, 8.25);
    assert.equal(readPipelineState(topicDir).state.phases.phase_4.status, "completed");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("validate-pipeline-state reports malformed fixture state", () => {
  const slug = "malformed-state";
  const topicDir = installFixtureTopic(slug);

  try {
    const result = run(["scripts/validate-pipeline-state.js", "--topic", slug, "--json"]);
    assert.equal(result.status, 0, result.stderr);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.topicsChecked, 1);
    assert.equal(payload.topicsWithIssues, 1);
    assert.match(payload.results[0].issues.join("\n"), /Unreadable state\.json/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("pipeline preflight runs state validation through shared process runner", () => {
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);

  try {
    const result = run(["scripts/pipeline-preflight.js", slug, "--mode", "evaluate", "--re-evaluate", "--json"]);
    assert.equal(result.status, 0, result.stderr);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "PASS");
    assert.ok(payload.checks.some(check => check.name === "state-integrity" && check.passed));
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("schema validator accepts current topic state and evidence contracts", () => {
  const result = run(["scripts/validate-schemas.js"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Schema validation passed/);
});

test("public export excludes private pipeline and meta artifacts", () => {
  const result = run(["scripts/export-public.js"]);
  assert.equal(result.status, 0, result.stderr);

  const publicRoot = path.join(repoRoot, "dist", "public");
  assert.ok(fs.existsSync(path.join(publicRoot, "README.md")));
  assert.ok(fs.existsSync(path.join(publicRoot, "topics", "markitdown", "overview.md")));
  assert.ok(!fs.existsSync(path.join(publicRoot, "topics", "markitdown", "_pipeline")));
  assert.ok(!fs.existsSync(path.join(publicRoot, "topics", "_meta")));
});

test("citation checker blocks private network URLs", () => {
  const slug = "broken-citation-topic";
  const topicDir = installFixtureTopic(slug);

  try {
    const result = run(["scripts/verify-citations.js", "--topic", slug, "--cache", "--cache-ttl-days", "7"]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /BLOCKED_PRIVATE_NETWORK/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("citation status helper separates verifier failures from dead links", () => {
  assert.equal(classifyHttpStatus(200, 0), "OK");
  assert.equal(classifyHttpStatus(200, 1), "REDIRECT_OK");
  assert.equal(classifyHttpStatus(403, 0), "HTTP_FORBIDDEN");
  assert.equal(classifyHttpStatus(404, 0), "DEAD");
  assert.equal(classifyHttpStatus(503, 0), "HTTP_SERVER_ERROR");
  assert.equal(classifyRequestError(new Error("TIMEOUT")), "TIMEOUT");
  assert.equal(classifyRequestError({ code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" }), "TLS_ERROR");
  assert.equal(classifyRequestError({ code: "ENOTFOUND" }), "DNS_ERROR");
  assert.equal(classifyRequestError({ code: "ECONNRESET" }), "UNKNOWN_ERROR");
  assert.equal(citationCountKey("REDIRECT_BLOCKED"), "redirect_blocked");
  assert.equal(citationCountKey("BLOCKED_PRIVATE_NETWORK"), "private_network_blocked");
  assert.equal(isFailedCitationStatus("HTTP_FORBIDDEN"), false);
  assert.equal(isFailedCitationStatus("HTTP_SERVER_ERROR"), true);
});

test("leadership index generator writes decision metadata", () => {
  const result = run(["scripts/generate-leadership-index.js"]);
  assert.equal(result.status, 0, result.stderr);

  const index = fs.readFileSync(path.join(repoRoot, "topics", "index.md"), "utf8");
  assert.match(index, /\| Topic \| Status \| Workflow \| Score \| Confidence \| Freshness \| Citations \| Security \| Verdict \|/);
  assert.match(index, /MarkItDown/);
});

test("dashboard generator writes local HTML summary", () => {
  const result = run(["scripts/generate-dashboard.js"]);
  assert.equal(result.status, 0, result.stderr);

  const dashboard = fs.readFileSync(path.join(repoRoot, "dist", "dashboard", "index.html"), "utf8");
  assert.match(dashboard, /BrainStorming Dashboard/);
  assert.match(dashboard, /MarkItDown/);
});

test("claim support checker emits parseable JSON summary", () => {
  const result = run(["scripts/claim-support-check.js", "--all"]);
  assert.equal(result.status, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.ok(payload.summary.topics_checked >= 2);
  assert.ok(Number.isInteger(payload.summary.claims_checked));
  assert.equal(payload.summary.needs_review, 0);
  assert.ok(Array.isArray(payload.topics));
});

test("trend report generator writes operations report", () => {
  const result = run(["scripts/trend-report.js"]);
  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Trend report written/);
});
