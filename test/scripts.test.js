const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
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
const citationCachePath = path.join(repoRoot, "topics", "_meta", "citation-cache.json");

function run(args, env) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function installFixtureTopic(slug) {
  const source = path.join(fixtureRoot, slug);
  const target = path.join(repoRoot, "topics", slug);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  return target;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function withCitationCache(cache, fn) {
  const hadCache = fs.existsSync(citationCachePath);
  const original = hadCache ? fs.readFileSync(citationCachePath, "utf8") : null;
  fs.mkdirSync(path.dirname(citationCachePath), { recursive: true });
  fs.writeFileSync(citationCachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");

  try {
    return fn();
  } finally {
    if (hadCache) {
      fs.writeFileSync(citationCachePath, original, "utf8");
    } else {
      fs.rmSync(citationCachePath, { force: true });
    }
  }
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
  // Hermetic: a temp workspace with one fresh topic and one archived topic, so the
  // assertions do not depend on whatever topics the repository happens to hold.
  const ws = makeWorkspace();
  try {
    const verdict = path.join(ws, "topics", "valid-topic", "verdict.md");
    fs.writeFileSync(verdict, fs.readFileSync(verdict, "utf8").replace(/^created: .*$/m, `created: ${todayIso()}`));
    fs.cpSync(path.join(ws, "topics", "valid-topic"), path.join(ws, "topics", "retired-topic"), { recursive: true });
    fs.writeFileSync(
      path.join(ws, "archived-topics.md"),
      "# Archived\n\n| Topic | Status | Verdict |\n|---|---|---|\n| [Retired](topics/retired-topic/) | Archived | fixture |\n",
    );

    const result = runFrom(ws, ["scripts/check-staleness.js", "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    // No silent omission: every on-disk topic dir lands in exactly one bucket.
    const topicDirCount = fs.readdirSync(path.join(ws, "topics"), { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith("_")).length;
    const accounted = payload.summary.overdue + payload.summary.approaching
      + payload.summary.fresh + payload.summary.skipped;
    assert.equal(accounted, topicDirCount);
    assert.equal(payload.summary.fresh, 1, result.stdout);
    assert.ok(payload.fresh.every(t => typeof t.slug === "string" && typeof t.lastResearched === "string"));
    assert.deepEqual(payload.skipped.map(x => x.slug), ["retired-topic"]);
    assert.ok(payload.skipped.every(x => x.reason.length > 0));
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
  }
});

test("validate-pipeline-state skips reserved metadata directories", () => {
  // Drive the auditor against an isolated fixture tree (via BRAINSTORMING_TOPICS_DIR)
  // so the assertion no longer depends on ambient repo data drift.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "bs-pipeline-state-"));
  try {
    fs.cpSync(
      path.join(fixtureRoot, "valid-topic"),
      path.join(sandbox, "valid-topic"),
      { recursive: true }
    );
    // A reserved metadata dir that must be skipped, not validated as a topic.
    fs.mkdirSync(path.join(sandbox, "_meta"), { recursive: true });

    const result = run(
      ["scripts/validate-pipeline-state.js", "--json"],
      { BRAINSTORMING_TOPICS_DIR: sandbox }
    );
    assert.equal(result.status, 0, result.stderr);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.topicsWithIssues, 0);
    assert.ok(payload.topicsChecked >= 1);
    assert.ok(!payload.results.some(topic => topic.slug === "_meta"));
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
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

test("manifest validator requires manifests for existing phase outputs", () => {
  const slug = "manifest-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const manifestDir = path.join(pipelineDir, "manifests");

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(pipelineDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(topicDir, "overview.md"), "# Manifest Test\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "notes.md"), "# Notes\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "verdict.md"), "# Verdict\n", "utf8");
    fs.writeFileSync(path.join(pipelineDir, "scorecard.md"), "<weighted_total>8.5</weighted_total>\n<verdict>PASS</verdict>\n", "utf8");

    const missing = run(["scripts/validate-manifests.js", "--topic", slug, "--json"]);
    assert.equal(missing.status, 1);
    assert.match(missing.stdout, /phase-4-critic\.json/);

    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(path.join(manifestDir, "phase-4-critic.json"), `${JSON.stringify({
      schema_version: "1",
      topic_slug: slug,
      phase: "phase_4_critic",
      agent: "critic",
      status: "COMPLETE",
      outputs: ["_pipeline/scorecard.md"],
      key_finding: "Drafts pass the quality gate.",
      quality_signal: "PASS",
      weighted_total: 8.5,
      verdict: "PASS",
    }, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(manifestDir, "phase-7-publisher.json"), `${JSON.stringify({
      schema_version: "1",
      topic_slug: slug,
      phase: "phase_7_publisher",
      agent: "publisher",
      status: "COMPLETE",
      outputs: ["overview.md", "notes.md", "verdict.md"],
      key_finding: "Published public topic files.",
      quality_signal: "PASS",
    }, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(manifestDir, "publication.json"), `${JSON.stringify({
      schema_version: "1",
      topic_slug: slug,
      published_files: ["overview.md", "notes.md", "verdict.md"],
      quality_score: 8.5,
      recommendation: "ADOPT",
      confidence_distribution: { HIGH: 1, MEDIUM: 0, LOW: 0, UNVERIFIED: 0 },
      must_survive_coverage: "PASS",
      // L28 fix (2026-06-07): challenge_verdict is now a required publication field
      challenge_verdict: "UPHELD",
    }, null, 2)}\n`, "utf8");

    const passing = run(["scripts/validate-manifests.js", "--topic", slug, "--json"]);
    assert.equal(passing.status, 0, passing.stderr);
    const payload = JSON.parse(passing.stdout);
    assert.equal(payload.failed, 0);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("manifest validator rejects invalid status and out-of-range scores", () => {
  // H2 regression: the status enum and 0–10 score ranges were documented in the
  // schema files but never enforced, so a bogus status / score used to pass.
  const slug = "manifest-status-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const manifestDir = path.join(pipelineDir, "manifests");

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(manifestDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(pipelineDir, "scorecard.md"), "<weighted_total>99</weighted_total>\n", "utf8");
    fs.writeFileSync(path.join(manifestDir, "phase-4-critic.json"), `${JSON.stringify({
      schema_version: "1",
      topic_slug: slug,
      phase: "phase_4_critic",
      agent: "critic",
      status: "BOGUS_STATUS",
      outputs: ["_pipeline/scorecard.md"],
      key_finding: "x",
      quality_signal: "PASS",
      weighted_total: 99,
      verdict: "PASS",
    }, null, 2)}\n`, "utf8");

    const result = run(["scripts/validate-manifests.js", "--topic", slug, "--json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    const errors = payload.results.flatMap(r => r.errors);
    assert.ok(
      errors.some(e => /status "BOGUS_STATUS" must be one of/.test(e)),
      `expected status enum error; got: ${JSON.stringify(errors)}`
    );
    assert.ok(
      errors.some(e => /weighted_total 99 is out of range/.test(e)),
      `expected score-range error; got: ${JSON.stringify(errors)}`
    );
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("context impact report emits topic metrics as JSON using fixture topic with pipeline", () => {
  // H14 fix (2026-06-07): drive context-impact-report against a fixture topic to eliminate
  // ambient-repo coupling (previously hard-coded "markitdown"). The fixture has _pipeline/
  // markdown (scorecard.md, draft-revision.md) so we can assert pipeline_markdown_bytes > 0.
  // Note: context-impact-report.js does NOT support BRAINSTORMING_TOPICS_DIR override, so
  // we install the fixture into the real topics/ and clean up after.
  const slug = "fixture-pipeline-rich";
  const topicDir = installFixtureTopic(slug);
  try {
    const result = run(["scripts/context-impact-report.js", "--topic", slug, "--json"]);
    assert.equal(result.status, 0, result.stderr);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.total, 1);
    assert.equal(payload.rows[0].slug, slug);
    assert.ok(payload.rows[0].pipeline_markdown_bytes > 0, "should measure scorecard.md and draft-revision.md");
    assert.ok(payload.rows[0].avoided_context_bytes > 0);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});


function walkForPattern(dir, pattern) {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (pattern.test(entry.name)) return true;
    if (entry.isDirectory() && walkForPattern(full, pattern)) return true;
  }
  return false;
}

test("citation checker blocks private network URLs", () => {
  const slug = "broken-citation-topic";
  const topicDir = installFixtureTopic(slug);

  try {
    const result = run(["scripts/verify-citations.js", "--topic", slug]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /BLOCKED_PRIVATE_NETWORK/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("citation checker writes cache entries with actionable metadata", () => {
  const slug = "broken-citation-topic";
  const url = "http://127.0.0.1/secret";
  const topicDir = installFixtureTopic(slug);

  try {
    withCitationCache({}, () => {
      const result = run(["scripts/verify-citations.js", "--topic", slug, "--cache", "--cache-ttl-days", "7"]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /BLOCKED_PRIVATE_NETWORK/);

      const cache = JSON.parse(fs.readFileSync(citationCachePath, "utf8"));
      assert.equal(cache[url].url, url);
      assert.equal(cache[url].checked_on, todayIso());
      assert.equal(cache[url].final_url, url);
      assert.equal(cache[url].status, "BLOCKED_PRIVATE_NETWORK");
      assert.equal(cache[url].http_code, null);
      assert.equal(cache[url].error_class, "private_network_blocked");
      assert.equal(cache[url].result.status, "BLOCKED_PRIVATE_NETWORK");
    });
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("citation checker uses fresh cache and bypasses cache when omitted", () => {
  const slug = "broken-citation-topic";
  const url = "http://127.0.0.1/secret";
  const topicDir = installFixtureTopic(slug);
  const cachedOk = {
    [url]: {
      url,
      checked_on: todayIso(),
      final_url: url,
      status: "OK",
      http_code: 200,
      error_class: "ok",
      result: {
        url,
        source_file: "",
        final_url: url,
        http_code: 200,
        method_used: "HEAD",
        status: "OK",
      },
    },
  };

  try {
    withCitationCache(cachedOk, () => {
      const cached = run(["scripts/verify-citations.js", "--topic", slug, "--cache", "--cache-ttl-days", "7"]);
      assert.equal(cached.status, 0, cached.stderr);
      assert.match(cached.stdout, /CACHE_OK/);

      const bypassed = run(["scripts/verify-citations.js", "--topic", slug]);
      assert.equal(bypassed.status, 1);
      assert.match(bypassed.stdout, /BLOCKED_PRIVATE_NETWORK/);
    });
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("citation checker expires stale cache entries", () => {
  const slug = "broken-citation-topic";
  const url = "http://127.0.0.1/secret";
  const topicDir = installFixtureTopic(slug);
  const staleCache = {
    [url]: {
      url,
      checked_on: daysAgoIso(30),
      final_url: url,
      status: "OK",
      http_code: 200,
      error_class: "ok",
      result: {
        url,
        source_file: "",
        final_url: url,
        http_code: 200,
        method_used: "HEAD",
        status: "OK",
      },
    },
  };

  try {
    withCitationCache(staleCache, () => {
      const result = run(["scripts/verify-citations.js", "--topic", slug, "--cache", "--cache-ttl-days", "7"]);
      assert.equal(result.status, 1);
      assert.doesNotMatch(result.stdout, /CACHE_OK/);
      assert.match(result.stdout, /BLOCKED_PRIVATE_NETWORK/);
    });
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

test("leadership index generator writes decision metadata with fixture topic", () => {
  // H14 fix (2026-06-07): install fixture topic so index includes it; no more ambiguity
  // about whether "MarkItDown" text comes from ambient repo or test input.
  // L18 (2026-06-07): snapshot/restore the real topics/index.md — this generator
  // writes to the tracked tree, and without restore every test run leaks a
  // "Fixture Valid Topic" row into it.
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);
  const indexPath = path.join(repoRoot, "topics", "index.md");
  const hadIndex = fs.existsSync(indexPath);
  const originalIndex = hadIndex ? fs.readFileSync(indexPath, "utf8") : null;
  try {
    const result = run(["scripts/generate-leadership-index.js"]);
    assert.equal(result.status, 0, result.stderr);

    const index = fs.readFileSync(indexPath, "utf8");
    assert.match(index, /\| Topic \| Status \| Workflow \| Score \| Confidence \| Freshness \| Citations \| Security \| Verdict \|/);
    assert.match(index, /Fixture Valid Topic/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    if (hadIndex) fs.writeFileSync(indexPath, originalIndex, "utf8");
    else fs.rmSync(indexPath, { force: true });
  }
});

test("dashboard generator writes local HTML summary", () => {
  // H14 (2026-06-07): assert on an installed fixture, not the ambient markitdown
  // topic — this was a missed ambient coupling from the original sweep.
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);
  try {
    const result = run(["scripts/generate-dashboard.js"]);
    assert.equal(result.status, 0, result.stderr);

    const dashboard = fs.readFileSync(path.join(repoRoot, "dist", "dashboard", "index.html"), "utf8");
    assert.match(dashboard, /BrainStorming Dashboard/);
    assert.match(dashboard, /Fixture Valid Topic/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("claim support checker emits parseable JSON summary", () => {
  const result = run(["scripts/claim-support-check.js", "--all"]);
  assert.equal(result.status, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.ok(payload.summary.topics_checked >= 1);
  assert.ok(Number.isInteger(payload.summary.claims_checked));
  assert.ok(Number.isInteger(payload.summary.needs_review));
  assert.ok(Array.isArray(payload.topics));
});

test("trend report generator writes operations report", () => {
  const result = run(["scripts/trend-report.js"]);
  assert.equal(result.status, 0, result.stderr);

  assert.match(result.stdout, /Trend report written/);
});

// ── Phase A Fixes ────────────────────────────────────────────────────────────

test("evidence schema validator requires confidence on each finding", () => {
  const slug = "schema-confidence-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(pipelineDir, { recursive: true });

  const evidenceWithoutConfidence = {
    schema_version: "1",
    topic_slug: slug,
    findings: [
      { id: "F1", title: "Test finding", summary: "No confidence field" },
    ],
  };

  fs.writeFileSync(
    path.join(topicDir, "verdict.md"),
    "---\ntitle: Test\ncreated: 2026-04-26\n---\n# Test\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(pipelineDir, "state.json"),
    JSON.stringify({
      topic_slug: slug, workflow: "evaluate", current_date: "2026-04-26",
      phases: {}, run_metrics: {}, errors: [],
    }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(pipelineDir, "evidence.json"),
    JSON.stringify(evidenceWithoutConfidence, null, 2),
    "utf8"
  );

  try {
    const result = run(["scripts/validate-schemas.js"]);
    assert.equal(result.status, 1, "should fail when confidence is missing");
    assert.match(result.stderr, /missing required confidence/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("evidence schema validator accepts findings with valid confidence", () => {
  const slug = "schema-confidence-valid-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(pipelineDir, { recursive: true });

  const evidenceWithConfidence = {
    schema_version: "1",
    topic_slug: slug,
    findings: [
      { id: "F1", title: "Test finding", confidence: "HIGH", summary: "Has confidence" },
      { id: "F2", title: "Other finding", confidence: "LOW" },
    ],
  };

  fs.writeFileSync(
    path.join(topicDir, "verdict.md"),
    "---\ntitle: Test\ncreated: 2026-04-26\n---\n# Test\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(pipelineDir, "state.json"),
    JSON.stringify({
      topic_slug: slug, workflow: "evaluate", current_date: "2026-04-26",
      phases: {}, run_metrics: {}, errors: [],
    }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(pipelineDir, "evidence.json"),
    JSON.stringify(evidenceWithConfidence, null, 2),
    "utf8"
  );

  try {
    const result = run(["scripts/validate-schemas.js"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Schema validation passed/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("publisher gate does not require investigator manifest when quick mode skipped it", () => {
  // C1 regression: quick mode sets skip_investigator=true, so
  // phase-1-investigator.json is never written. The gate must not demand it,
  // or quick-mode topics can never publish.
  const slug = "quick-mode-gate-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");

  function writeState(skipInvestigator) {
    fs.rmSync(topicDir, { recursive: true, force: true });
    fs.mkdirSync(pipelineDir, { recursive: true });
    fs.writeFileSync(
      path.join(pipelineDir, "state.json"),
      JSON.stringify({
        topic_slug: slug,
        legacy_grandfathered: false,
        skip_investigator: skipInvestigator,
        recommended_mode: skipInvestigator ? "quick" : "standard",
        phases: {},
        run_metrics: {},
      }, null, 2),
      "utf8"
    );
  }

  const investigatorError = /phase-1-investigator\.json/;
  try {
    // Quick mode: investigator manifest absence must NOT be flagged.
    writeState(true);
    const quick = run(["scripts/check-publisher-gate.js", "--topic", slug, "--json"]);
    const quickResult = JSON.parse(quick.stdout);
    assert.ok(
      !quickResult.errors.some(e => investigatorError.test(e)),
      `quick mode should not require investigator manifest; got: ${JSON.stringify(quickResult.errors)}`
    );

    // Standard mode (negative control): absence MUST be flagged.
    writeState(false);
    const standard = run(["scripts/check-publisher-gate.js", "--topic", slug, "--json"]);
    const standardResult = JSON.parse(standard.stdout);
    assert.ok(
      standardResult.errors.some(e => investigatorError.test(e)),
      `standard mode should require investigator manifest; got: ${JSON.stringify(standardResult.errors)}`
    );
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("pipeline-preflight detects an interrupted (in_progress) prior run as resumable", () => {
  // H1 regression: phases live under state.phases.phase_N. Reading state.phase_N
  // directly made resume detection dead code (always "complete").
  const slug = "preflight-resume-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");

  function writeState(phaseStatus) {
    fs.rmSync(topicDir, { recursive: true, force: true });
    fs.mkdirSync(pipelineDir, { recursive: true });
    fs.writeFileSync(
      path.join(pipelineDir, "state.json"),
      JSON.stringify({
        topic_slug: slug,
        workflow: "research",
        phases: { phase_2: { status: phaseStatus } },
        run_metrics: {},
        errors: [],
      }, null, 2),
      "utf8"
    );
  }

  try {
    // Positive control: an in_progress phase must surface as resumable.
    writeState("in_progress");
    const resumable = run(["scripts/pipeline-preflight.js", slug, "--mode", "research", "--json"]);
    const resumableResult = JSON.parse(resumable.stdout);
    const incompleteCheck = resumableResult.checks.find(c => c.name === "no-incomplete-run");
    assert.ok(incompleteCheck, "expected a no-incomplete-run check to be present");
    assert.equal(incompleteCheck.passed, false);
    assert.match(incompleteCheck.message, /phase_2/);

    // Negative control: a completed phase must NOT be flagged resumable.
    writeState("completed");
    const done = run(["scripts/pipeline-preflight.js", slug, "--mode", "research", "--json"]);
    const doneResult = JSON.parse(done.stdout);
    const doneIncomplete = doneResult.checks.find(c => c.name === "no-incomplete-run");
    assert.ok(!doneIncomplete, "completed run should not be flagged as resumable");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});


test("claim-support-check rejects invalid topic slug", () => {
  const result = run(["scripts/claim-support-check.js", "--topic", "../etc/passwd"]);
  assert.equal(result.status, 1, "should reject path traversal slug");
  assert.match(result.stderr, /invalid topic slug/);
});

test("claim-support-check matches bare ALL-CAPS acronym mentions against short registry aliases", () => {
  // L11 regression: registry aliases are normalized to lowercase, and aliases
  // shorter than 5 chars were unconditionally skipped — so a claim mentioning
  // "NVD" never matched the registered [NVD Database](...) source and was
  // flagged needs_review. Positive control: all-caps mention registry-matches.
  const slug = "l11-acronym-fixture";
  const topicDir = path.join(repoRoot, "topics", slug);
  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(topicDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(topicDir, "notes.md"), [
      "---", "title: L11 Fixture", "---", "# Notes", "",
      "- NVD lists three CVEs affecting the 2.x series (HIGH confidence).",
      "", "## Key Sources", "",
      "1. [NVD Database](https://nvd.nist.gov/vuln/detail/CVE-2024-0001) — vulnerability registry",
      "",
    ].join("\n"), "utf8");
    const result = run(["scripts/claim-support-check.js", "--topic", slug, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.summary.registry_supported, 1, "ALL-CAPS NVD mention must registry-match");
    assert.equal(payload.summary.needs_review, 0, "no claim should be left needs_review");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("secret-scan flags a seeded secret and passes a clean tree", () => {
  // H15/M13 regression: the old test ran an inline regex via `node -e` and never
  // invoked scripts/secret-scan.js, so the walk, file filtering, scanner probing,
  // and exit-code logic were untested. Drive the real script against isolated
  // trees via SECRET_SCAN_ROOT (positive + negative control).
  const dirtyDir = fs.mkdtempSync(path.join(os.tmpdir(), "bs-secret-dirty-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "bs-secret-clean-"));
  try {
    // Fake but pattern-matching AWS key (not a real credential).
    fs.writeFileSync(path.join(dirtyDir, "leak.txt"), `aws_key = AKIA${"A".repeat(16)}\n`, "utf8");
    fs.writeFileSync(path.join(cleanDir, "notes.md"), "# notes\nnothing secret here\n", "utf8");

    const dirty = run(["scripts/secret-scan.js"], { SECRET_SCAN_ROOT: dirtyDir });
    assert.equal(dirty.status, 1, `seeded secret should fail: ${dirty.stdout}${dirty.stderr}`);

    const clean = run(["scripts/secret-scan.js"], { SECRET_SCAN_ROOT: cleanDir });
    assert.equal(clean.status, 0, `clean tree should pass: ${clean.stdout}${clean.stderr}`);
  } finally {
    fs.rmSync(dirtyDir, { recursive: true, force: true });
    fs.rmSync(cleanDir, { recursive: true, force: true });
  }
});

// ── Phase B Automation ───────────────────────────────────────────────────────

test("lint-agents passes all current agent spec files", () => {
  const result = run(["scripts/lint-agents.js"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Agent spec lint passed/);
});

test("lint-agents JSON output reports agents checked", () => {
  const result = run(["scripts/lint-agents.js", "--json"]);
  assert.equal(result.status, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.passed, true);
  assert.ok(payload.agents_checked >= 12, `expected >=12 agents, got ${payload.agents_checked}`);
  assert.ok(Array.isArray(payload.errors));
  assert.equal(payload.errors.length, 0);
});

test("lint-agents detects missing frontmatter field", () => {
  const testAgentPath = path.join(repoRoot, "pipeline", "agents", "_test-lint-agent.md");
  fs.writeFileSync(
    testAgentPath,
    "---\nname: test-lint-agent\n---\n# Test\n## Untrusted Source Handling\nHandled.\n",
    "utf8"
  );

  try {
    const result = run(["scripts/lint-agents.js"]);
    assert.equal(result.status, 1, "should fail when model/maxTurns are missing");
    assert.match(result.stderr, /missing required field "model"/);
  } finally {
    fs.rmSync(testAgentPath, { force: true });
  }
});

test("diagnose-run returns structured status for a fixture topic", () => {
  // H14 fix (2026-06-07): use fixture topic instead of ambient "markitdown".
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);
  try {
    const result = run(["scripts/diagnose-run.js", "--topic", slug, "--json"]);
    assert.equal(result.status, 0, result.stderr);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.slug, slug);
    assert.ok(["STALLED", "PUBLISHED", "PIPELINE_COMPLETE", "FAILED", "IN_PROGRESS"].includes(payload.status));
    assert.ok(Array.isArray(payload.advice));
    assert.ok(typeof payload.phases_completed === "number");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("diagnose-run rejects invalid slug", () => {
  const result = run(["scripts/diagnose-run.js", "--topic", "../../etc"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid topic slug/);
});

test("prune-citation-cache reports no-op when cache is absent", () => {
  const result = run(["scripts/prune-citation-cache.js", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(typeof payload.pruned, "number");
  assert.equal(typeof payload.kept, "number");
});

// ── Phase C Knowledge Base ───────────────────────────────────────────────────


// ── M12 Task: State-Mutating Script Tests ───────────────────────────────────

test("archive-topic archive moves a topic row from index to archived-topics", () => {
  // M12: Positive control for archive-topic. Install a fixture, then archive it.
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);

  // Create index with the topic at repo root
  const indexPath = path.join(repoRoot, "index.md");
  const indexContent = `# BrainStorming Topics

| Topic | Status | Verdict |
| --- | --- | --- |
| [${slug}](topics/${slug}/) | Published | Adopt |
`;
  const archivedContent = `# Archived Topics

(empty)
`;
  const hadIndex = fs.existsSync(indexPath);
  const originalIndex = hadIndex ? fs.readFileSync(indexPath, "utf8") : null;
  const hadArchived = fs.existsSync(path.join(repoRoot, "archived-topics.md"));
  const originalArchived = hadArchived ? fs.readFileSync(path.join(repoRoot, "archived-topics.md"), "utf8") : null;

  fs.writeFileSync(indexPath, indexContent, "utf8");
  fs.writeFileSync(path.join(repoRoot, "archived-topics.md"), archivedContent, "utf8");

  try {
    // Run archive with subcommand
    const archive = run(["scripts/archive-topic.js", "archive", slug]);
    assert.equal(archive.status, 0, `${archive.stderr}`);

    // Verify topic moved from index to archived
    const newIndex = fs.readFileSync(indexPath, "utf8");
    assert.ok(!newIndex.includes(`[${slug}]`), "topic should be removed from active index");

    // Verify topic is now in archived-topics
    const archived = fs.readFileSync(path.join(repoRoot, "archived-topics.md"), "utf8");
    assert.match(archived, new RegExp(`\\[${slug}\\]`), "topic should appear in archived list");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    if (hadIndex) fs.writeFileSync(indexPath, originalIndex, "utf8");
    else fs.rmSync(indexPath, { force: true });
    if (hadArchived) fs.writeFileSync(path.join(repoRoot, "archived-topics.md"), originalArchived, "utf8");
    else fs.rmSync(path.join(repoRoot, "archived-topics.md"), { force: true });
  }
});

test("archive-topic restore moves topic back from archived-topics to index", () => {
  // M12: Negative control for archive-topic (restore from archived).
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);

  const indexPath = path.join(repoRoot, "index.md");
  const archivedPath = path.join(repoRoot, "archived-topics.md");

  const hadIndex = fs.existsSync(indexPath);
  const originalIndex = hadIndex ? fs.readFileSync(indexPath, "utf8") : null;
  const hadArchived = fs.existsSync(archivedPath);
  const originalArchived = hadArchived ? fs.readFileSync(archivedPath, "utf8") : null;

  // Setup: topic starts in archived-topics
  const indexContent = `# BrainStorming Topics

| Topic | Status | Verdict |
| --- | --- | --- |
`;
  const archivedContent = `# Archived Topics

| Topic | Status | Verdict |
| --- | --- | --- |
| [${slug}](topics/${slug}/) | Archived | Adopt |
`;
  fs.writeFileSync(indexPath, indexContent, "utf8");
  fs.writeFileSync(archivedPath, archivedContent, "utf8");

  try {
    // Run archive with restore subcommand
    const restore = run(["scripts/archive-topic.js", "restore", slug]);
    assert.equal(restore.status, 0, `${restore.stderr}`);

    // Verify topic moved back to index
    const newIndex = fs.readFileSync(indexPath, "utf8");
    assert.match(newIndex, new RegExp(`\\[${slug}\\]`), "topic should be restored to active index");

    const newArchived = fs.readFileSync(archivedPath, "utf8");
    assert.ok(!newArchived.includes(`[${slug}]`), "topic should be removed from archived list");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    if (hadIndex) fs.writeFileSync(indexPath, originalIndex, "utf8");
    else fs.rmSync(indexPath, { force: true });
    if (hadArchived) fs.writeFileSync(archivedPath, originalArchived, "utf8");
    else fs.rmSync(archivedPath, { force: true });
  }
});

test("regenerate-index produces valid index.md with fixture topics", () => {
  // M12: Positive control for regenerate-index.
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);
  const indexPath = path.join(repoRoot, "index.md");

  const hadIndex = fs.existsSync(indexPath);
  const originalIndex = hadIndex ? fs.readFileSync(indexPath, "utf8") : null;

  try {
    const result = run(["scripts/regenerate-index.js"]);
    assert.equal(result.status, 0, result.stderr);

    assert.ok(fs.existsSync(indexPath), "index.md should be generated at repo root");

    const index = fs.readFileSync(indexPath, "utf8");
    // Should contain fixture topic title (properly escaped)
    assert.match(index, /Fixture Valid Topic/);
    // Should be a valid markdown table
    assert.match(index, /\| Topic/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    if (hadIndex) fs.writeFileSync(indexPath, originalIndex, "utf8");
    else fs.rmSync(indexPath, { force: true });
  }
});

test("regenerate-index excludes archived topics instead of resurrecting them", () => {
  // 2026-06-09 regression guard: archive-topic.js moves registry rows but
  // folders stay on disk; an unfiltered rebuild silently un-archived every
  // retired topic. Uses the ambient repo's archived-topics.md as ground truth.
  const archivedMd = fs.readFileSync(path.join(repoRoot, "archived-topics.md"), "utf8");
  const archivedSlugs = [...archivedMd.matchAll(/\[[^\]]+\]\(topics\/([^/)]+)\//g)].map(m => m[1]);
  const onDiskArchived = archivedSlugs.filter(slug =>
    fs.existsSync(path.join(repoRoot, "topics", slug, "verdict.md")));
  if (onDiskArchived.length === 0) return; // nothing to assert against

  const result = run(["scripts/regenerate-index.js", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  // Negative control: no archived topic row in the rebuilt index.
  for (const slug of onDiskArchived) {
    assert.ok(!result.stdout.includes(`(topics/${slug}/)`),
      `archived topic "${slug}" must not be resurrected into index.md`);
  }
  // The exclusion must be reported, not silent.
  assert.match(result.stdout, /EXCLUDED \(archived/);
});

test("topic-init creates required contract files with valid frontmatter", () => {
  // M12: Positive control for topic-init.
  const slug = "test-init-topic";
  const topicDir = path.join(repoRoot, "topics", slug);

  try {
    fs.rmSync(topicDir, { recursive: true, force: true });

    const result = run(["scripts/topic-init.js", slug]);
    assert.equal(result.status, 0, result.stderr);

    // Verify contract files exist
    assert.ok(fs.existsSync(path.join(topicDir, "overview.md")), "overview.md should exist");
    assert.ok(fs.existsSync(path.join(topicDir, "notes.md")), "notes.md should exist");
    assert.ok(fs.existsSync(path.join(topicDir, "verdict.md")), "verdict.md should exist");

    // Verify they have valid frontmatter
    const overview = fs.readFileSync(path.join(topicDir, "overview.md"), "utf8");
    assert.match(overview, /^---[\s\S]*?title:[\s\S]*?---/, "overview.md should have frontmatter with title");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("topic-init rejects invalid slug", () => {
  // M12: Negative control for topic-init.
  const slug = "../../etc/passwd";

  const result = run(["scripts/topic-init.js", slug]);
  assert.equal(result.status, 1, "should reject path traversal slug");
  assert.match(result.stderr, /kebab-case|invalid|slug/i);
});

test("topic-validate passes fixture topic with all required files", () => {
  // M12: Positive control for topic-validate. The validator requires the topic to
  // be listed in index.md, so register the fixture row for the duration of the
  // test (snapshot/restore — earlier this test only passed because a leaked
  // fixture row was contaminating the real index, see L18).
  const slug = "valid-topic";
  const topicDir = installFixtureTopic(slug);
  const indexPath = path.join(repoRoot, "index.md");
  const originalIndex = fs.readFileSync(indexPath, "utf8");

  try {
    fs.writeFileSync(
      indexPath,
      `${originalIndex.trimEnd()}\n| [Fixture Valid Topic](topics/${slug}/) | Complete | test fixture |\n`,
      "utf8"
    );
    const result = run(["scripts/topic-validate.js", slug]);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    fs.writeFileSync(indexPath, originalIndex, "utf8");
  }
});

test("topic-validate fails when verdict.md is missing", () => {
  // M12: Negative control for topic-validate.
  const slug = "topic-validate-missing-verdict";
  const topicDir = path.join(repoRoot, "topics", slug);

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(topicDir, { recursive: true });

  try {
    // Only create overview and notes, omit verdict
    fs.writeFileSync(path.join(topicDir, "overview.md"), "---\ntitle: Test\ntags: [test]\n---\n# Overview\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "notes.md"), "# Notes\n", "utf8");

    const result = run(["scripts/topic-validate.js", slug]);
    // topic-validate exits 1 when checks fail
    assert.equal(result.status, 1, "should fail when verdict.md is missing");
    // The error is in stdout as JSON or human-readable
    assert.match(result.stdout || result.stderr, /file:verdict\.md|verdict\.md|Missing/i);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("log-pipeline-error appends JSONL to topic _pipeline/ directory", () => {
  // M12: Positive control for log-pipeline-error.
  const slug = "test-log-error";
  const topicDir = path.join(repoRoot, "topics", slug);
  const pipelineDir = path.join(topicDir, "_pipeline");

  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(pipelineDir, { recursive: true });

  try {
    // log-pipeline-error requires --topic --phase --kind --summary format
    // Run the logger with proper flags
    const result = run([
      "scripts/log-pipeline-error.js",
      "--topic", slug,
      "--phase", "phase_2",
      "--kind", "other",
      "--summary", "Test error message"
    ]);
    assert.equal(result.status, 0, `${result.stderr}${result.stdout}`);

    // Verify JSONL file was created (errors.jsonl, not errors-*.jsonl)
    const errorLogPath = path.join(pipelineDir, "errors.jsonl");
    assert.ok(fs.existsSync(errorLogPath), "should create errors.jsonl file");

    const errorLog = fs.readFileSync(errorLogPath, "utf8");
    assert.match(errorLog, /phase_2/, "error log should contain phase");
    assert.match(errorLog, /Test error message/, "error log should contain summary");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});

test("log-pipeline-error rejects path traversal slug", () => {
  // M12: Negative control for log-pipeline-error (traversal attack).
  const slug = "../../evil";
  const testError = JSON.stringify({ phase: "evil", error: "should not exist" });

  const result = run(
    ["scripts/log-pipeline-error.js", slug, testError],
    { slug }
  );
  assert.equal(result.status, 1, "should reject path traversal slug");

  // Verify no evil path was created outside repo
  const evilPath = path.resolve(path.join(repoRoot, "..", "..", "evil"));
  assert.ok(!fs.existsSync(evilPath), "traversal attack should be blocked");
});


test("validate-schemas and validate-manifests fail on an empty topics dir (floor guard)", () => {
  // FLOOR-GUARD negative control: the 2026-06-06 audit's root failure was a wiped
  // topics/ tree reading as green. An empty topics root MUST exit 1.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "bs-floor-guard-"));
  try {
    for (const script of ["scripts/validate-schemas.js", "scripts/validate-manifests.js"]) {
      const result = run([script], { BRAINSTORMING_TOPICS_DIR: sandbox });
      assert.equal(result.status, 1, `${script} must fail on 0 topics: ${result.stdout}${result.stderr}`);
      assert.match(`${result.stdout}${result.stderr}`, /0 topics found/, script);
    }
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("validate-schemas exits 0 on an empty topics dir with ALLOW_EMPTY_TOPICS escape hatch", () => {
  // FLOOR-GUARD escape hatch: explicit opt-in for fresh sandboxes.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "bs-floor-hatch-"));
  try {
    const result = run(
      ["scripts/validate-schemas.js"],
      { BRAINSTORMING_TOPICS_DIR: sandbox, ALLOW_EMPTY_TOPICS: "1" }
    );
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("validate-schemas with fixture topic exits 0 (positive control for floor guard)", () => {
  // FLOOR-GUARD test: Positive control — 1+ topics should pass.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "bs-schema-fixture-"));
  try {
    fs.cpSync(
      path.join(fixtureRoot, "valid-topic"),
      path.join(sandbox, "valid-topic"),
      { recursive: true }
    );

    const result = run(
      ["scripts/validate-schemas.js"],
      { BRAINSTORMING_TOPICS_DIR: sandbox }
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Schema validation passed|passed/i);
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});


// ── normalize-encoding (copy-paste-safe typography fold) ────────────────────

test("normalize-encoding folds unsafe typography but preserves emoji and box-drawing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bs-enc-"));
  const file = path.join(dir, "sample.md");
  // Foldable: em/en dash, arrow, curly quotes+apostrophe, ellipsis, >=, x.
  // Preserved: check, warning+VS16, box-drawing.
  const original = [
    "# Title — subtitle",
    "It doesn’t “work” → see below…",
    "Score ≥ 8 × 2 – done",
    "Status: ✅ pass ⚠️ warn ✗ fail",
    "═══ │ box art └─",
    "",
  ].join("\n");
  fs.writeFileSync(file, original, "utf8");
  try {
    // Negative control: --check on dirty content exits 1.
    const check = run(["scripts/normalize-encoding.js", "--check", "--dir", dir]);
    assert.equal(check.status, 1, "dirty content must fail --check");

    // Apply the fold.
    const write = run(["scripts/normalize-encoding.js", "--write", "--dir", dir]);
    assert.equal(write.status, 0, write.stderr);

    const folded = fs.readFileSync(file, "utf8");
    assert.match(folded, /# Title -- subtitle/);
    assert.match(folded, /doesn't "work" -> see below\.\.\./);
    assert.match(folded, /Score >= 8 x 2 - done/);
    // Preserved glyphs survive untouched.
    assert.ok(folded.includes("✅"), "checkmark emoji preserved");
    assert.ok(folded.includes("⚠️"), "warning+VS16 preserved");
    assert.ok(folded.includes("═══"), "box-drawing preserved");
    // No foldable char remains.
    assert.ok(!/[–—‘’“”…→≥×]/.test(folded));

    // Positive control: --check on cleaned content exits 0.
    const recheck = run(["scripts/normalize-encoding.js", "--check", "--dir", dir]);
    assert.equal(recheck.status, 0, "clean content must pass --check");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("regenerate-index strips a folded '-- Verdict' suffix without leaving a dangling dash", () => {
  // Regression (2026-06-07): the encoding fold turns title em-dashes into "--",
  // and the single-dash strip regex left "[Topic -]" dangling in the index.
  const slug = "dash-suffix-fixture";
  const topicDir = path.join(repoRoot, "topics", slug);
  const indexPath = path.join(repoRoot, "index.md");
  const originalIndex = fs.readFileSync(indexPath, "utf8");
  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(topicDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(topicDir, "overview.md"), "# Dash Suffix Fixture\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "notes.md"), "# Notes\n", "utf8");
    fs.writeFileSync(
      path.join(topicDir, "verdict.md"),
      "---\ntitle: Dash Suffix Fixture -- Verdict\ncreated: 2026-06-07\nstatus: complete\n---\n\n# Verdict\n",
      "utf8"
    );
    const result = run(["scripts/regenerate-index.js"]);
    assert.equal(result.status, 0, result.stderr);
    const index = fs.readFileSync(indexPath, "utf8");
    assert.match(index, /\[Dash Suffix Fixture\]\(topics\/dash-suffix-fixture\/\)/, "clean title");
    assert.ok(!/Dash Suffix Fixture -\]/.test(index), "no dangling ' -' on the title");
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
    fs.writeFileSync(indexPath, originalIndex, "utf8");
  }
});

// ── claim-support classifier core (PRD Fix #2 semantic gate) ────────────────

test("classifyClaimSupport distinguishes supported / unrelated / ambiguous / uncheckable", () => {
  const { classifyClaimSupport } = require("../scripts/lib/claim-support");

  // SUPPORTED: the source text contains the claim's significant terms.
  const supported = classifyClaimSupport(
    "FLUX.2-klein delivers photorealistic image generation with accurate hands",
    "Independent benchmarks show FLUX.2-klein produces photorealistic generation; " +
      "hands render accurately and detail is high across the image set."
  );
  assert.equal(supported.verdict, "SUPPORTED", JSON.stringify(supported));

  // UNRELATED: a SUBSTANTIAL live page that has nothing to do with the claim's
  // terms. Must be substantial (>= MIN_SOURCE_TERMS) — a thin off-topic body is
  // treated as UNCHECKABLE instead (see the thin-source test below).
  const unrelated = classifyClaimSupport(
    "FLUX.2-klein delivers photorealistic image generation with accurate hands",
    "The quarterly earnings call covered revenue guidance, operating margins, headcount " +
      "reductions, supply chain logistics, warehouse automation, freight contracts, currency " +
      "hedging, dividend policy, shareholder buybacks, regulatory compliance, audit findings, " +
      "pension liabilities, depreciation schedules, inventory turnover, accounts receivable, " +
      "treasury management, and forecasting assumptions for the upcoming fiscal period."
  );
  assert.equal(unrelated.verdict, "UNRELATED", JSON.stringify(unrelated));

  // AMBIGUOUS: middle band — some terms present, not enough for SUPPORTED.
  const ambiguous = classifyClaimSupport(
    "FLUX.2-klein delivers photorealistic generation with accurate anatomical hands",
    "FLUX.2-klein is an image model. Photorealistic output is one goal."
  );
  assert.equal(ambiguous.verdict, "AMBIGUOUS", JSON.stringify(ambiguous));

  // UNCHECKABLE: too few significant terms to mechanically verify.
  const tiny = classifyClaimSupport("It is fast", "anything at all here");
  assert.equal(tiny.verdict, "UNCHECKABLE", JSON.stringify(tiny));
});

test("classifyClaimSupport strips HTML and is robust to markup in the source", () => {
  const { classifyClaimSupport } = require("../scripts/lib/claim-support");
  const r = classifyClaimSupport(
    "hybrid search combines vector and keyword retrieval",
    "<html><body><p>The system uses <b>hybrid</b> search combining <i>vector</i> " +
      "and <code>keyword</code> retrieval methods.</p></body></html>"
  );
  assert.equal(r.verdict, "SUPPORTED", JSON.stringify(r));
});

test("classifyClaimSupport does NOT block on a thin/empty source body (UNCHECKABLE, not UNRELATED)", () => {
  const { classifyClaimSupport } = require("../scripts/lib/claim-support");
  // A redirect shell / JS-app skeleton: almost no real content. Zero claim-term
  // overlap, but we cannot honestly call it "unrelated" — it must NOT block.
  const shell = classifyClaimSupport(
    "FLUX.2-klein delivers photorealistic image generation with accurate hands",
    "<html><head><title>Redirecting</title></head><body>Loading...</body></html>"
  );
  assert.equal(shell.verdict, "UNCHECKABLE", JSON.stringify(shell));
  // Sanity: a substantial body with the same zero overlap still yields UNRELATED
  // (proven by the distinguishes-… test above) — so the guard is body-size, not
  // a blanket suppression of UNRELATED.
});

// ── claim-support-semantic gate (PRD Fix #2 Part 2) ─────────────────────────
// Hermetic: a temp topics dir (BRAINSTORMING_TOPICS_DIR) + injected source text
// (CLAIM_SUPPORT_SOURCES) so no network is touched; the LLM judge is forced off
// (GEMINI_API_KEY="") or injected (CLAIM_SUPPORT_LLM).

const SEMANTIC_CLAIM =
  "Hybrid search combines vector embeddings and keyword retrieval for better recall";
const SEMANTIC_URL = "https://example.com/hybrid";

function withSemanticTopic(finding, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claim-support-"));
  const topicDir = path.join(dir, "demo", "_pipeline");
  fs.mkdirSync(topicDir, { recursive: true });
  fs.writeFileSync(
    path.join(topicDir, "evidence.json"),
    JSON.stringify({ schema_version: "1", topic_slug: "demo", findings: [finding] }),
    "utf8",
  );
  try {
    return fn(dir, topicDir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runSemantic(topicsDir, env) {
  return run(["scripts/claim-support-semantic.js", "--topic", "demo", "--json"], {
    BRAINSTORMING_TOPICS_DIR: topicsDir,
    GEMINI_API_KEY: "", // judge off unless a test injects CLAIM_SUPPORT_LLM
    ...env,
  });
}

test("claim-support-semantic passes a must_survive finding whose source supports the claim (positive control)", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: [SEMANTIC_URL] },
    (topicsDir) => {
      const result = runSemantic(topicsDir, {
        CLAIM_SUPPORT_SOURCES: JSON.stringify({
          [SEMANTIC_URL]:
            "Hybrid search combines vector embeddings and keyword retrieval methods to improve recall across queries.",
        }),
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      const report = JSON.parse(result.stdout);
      assert.equal(report.topics[0].findings[0].final_verdict, "SUPPORTED");
      assert.equal(report.summary.blocking, 0);
    },
  );
});

test("claim-support-semantic fails (exit 1) when a must_survive source is unrelated (negative control)", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: [SEMANTIC_URL] },
    (topicsDir) => {
      const result = runSemantic(topicsDir, {
        CLAIM_SUPPORT_SOURCES: JSON.stringify({
          // Substantial (>= MIN_SOURCE_TERMS) but entirely off-topic: a real live
          // page that does not support the claim — the case the gate must block on.
          [SEMANTIC_URL]:
            "The quarterly earnings call covered revenue guidance, operating margins, headcount " +
            "reductions, supply chain logistics, warehouse automation, freight contracts, currency " +
            "hedging, dividend policy, shareholder buybacks, regulatory compliance, audit findings, " +
            "pension liabilities, depreciation schedules, inventory turnover, accounts receivable, " +
            "treasury management, and forecasting assumptions for the upcoming fiscal period.",
        }),
      });
      assert.equal(result.status, 1, result.stdout);
      const report = JSON.parse(result.stdout);
      assert.equal(report.topics[0].findings[0].final_verdict, "UNRELATED");
      assert.equal(report.topics[0].findings[0].blocking, true);
    },
  );
});

test("claim-support-semantic degrades AMBIGUOUS to INCONCLUSIVE and does NOT fail when no LLM judge is available", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: [SEMANTIC_URL] },
    (topicsDir) => {
      const result = runSemantic(topicsDir, {
        CLAIM_SUPPORT_SOURCES: JSON.stringify({
          [SEMANTIC_URL]: "Hybrid search is one retrieval approach. Vector methods exist.",
        }),
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      const finding = JSON.parse(result.stdout).topics[0].findings[0];
      assert.equal(finding.deterministic_verdict, "AMBIGUOUS");
      assert.equal(finding.final_verdict, "INCONCLUSIVE");
      assert.equal(finding.llm_source, "no-llm");
      assert.equal(finding.blocking, false);
    },
  );
});

test("claim-support-semantic blocks (exit 1) when the LLM judge returns CONTRADICTED on an AMBIGUOUS finding", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: [SEMANTIC_URL] },
    (topicsDir) => {
      const result = runSemantic(topicsDir, {
        CLAIM_SUPPORT_SOURCES: JSON.stringify({
          [SEMANTIC_URL]: "Hybrid search is one retrieval approach. Vector methods exist.",
        }),
        CLAIM_SUPPORT_LLM: '"CONTRADICTED"',
      });
      assert.equal(result.status, 1, result.stdout);
      const finding = JSON.parse(result.stdout).topics[0].findings[0];
      assert.equal(finding.deterministic_verdict, "AMBIGUOUS");
      assert.equal(finding.final_verdict, "CONTRADICTED");
      assert.equal(finding.blocking, true);
    },
  );
});

test("claim-support-semantic treats a must_survive finding with no fetchable URL as UNCHECKABLE, not blocking (no over-blocking)", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: ["Medium: some article title, not a URL"] },
    (topicsDir) => {
      const result = runSemantic(topicsDir, { CLAIM_SUPPORT_SOURCES: "{}" });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      const finding = JSON.parse(result.stdout).topics[0].findings[0];
      assert.equal(finding.final_verdict, "UNCHECKABLE");
      assert.equal(finding.blocking, false);
    },
  );
});

test("claim-support-semantic writes a per-topic claim-support-report.json artifact", () => {
  withSemanticTopic(
    { id: "F1", must_survive: true, claim: SEMANTIC_CLAIM, sources: [SEMANTIC_URL] },
    (topicsDir, pipelineDir) => {
      runSemantic(topicsDir, {
        CLAIM_SUPPORT_SOURCES: JSON.stringify({ [SEMANTIC_URL]: SEMANTIC_CLAIM }),
      });
      const reportPath = path.join(pipelineDir, "claim-support-report.json");
      assert.ok(fs.existsSync(reportPath), "report file should be written");
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      assert.equal(report.topic_slug, "demo");
      assert.equal(report.must_survive_total, 1);
    },
  );
});

test("claim-support-semantic rejects an invalid topic slug", () => {
  const result = run(["scripts/claim-support-semantic.js", "--topic", "../etc/passwd"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid topic slug/i);
});

// ── check-links (FAST-mode anti-ghost-link gate) ────────────────────────────
// Offline controls only — live reachability would be flaky in CI.

test("check-links exits 2 with a usage error when given no URLs", () => {
  const result = run(["scripts/check-links.js"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
});

test("check-links flags an unsupported-protocol URL as DEAD (exit 1)", () => {
  // file:// is blocked by assertSafeUrl before any network call — deterministic, offline.
  const result = run(["scripts/check-links.js", "file:///etc/passwd"]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /DEAD/);
});

// ── plugin layout: workspace separate from plugin root ──────────────────────
// As an installed plugin, scripts live in the plugin cache and research lives in
// the user's project. These run scripts from a foreign cwd to prove the split.

function makeWorkspace() {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), "bs-workspace-"));
  fs.cpSync(path.join(fixtureRoot, "valid-topic"), path.join(ws, "topics", "valid-topic"), { recursive: true });
  fs.writeFileSync(
    path.join(ws, "index.md"),
    "# Topic Index\n\n| Topic | Status | Verdict |\n|---|---|---|\n| [Valid Topic](topics/valid-topic/) | Complete | fixture |\n",
  );
  return ws;
}

function runFrom(cwd, args, env = {}) {
  const base = { ...process.env };
  delete base.BRAINSTORMING_WORKSPACE;
  delete base.CLAUDE_PROJECT_DIR;
  delete base.BRAINSTORMING_TOPICS_DIR;
  return spawnSync(process.execPath, args.map((a, i) => (i === 0 ? path.join(repoRoot, a) : a)), {
    cwd,
    encoding: "utf8",
    env: { ...base, ...env },
  });
}

test("workspace resolves from BRAINSTORMING_WORKSPACE, not the plugin root", () => {
  const ws = makeWorkspace();
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "bs-elsewhere-"));
  try {
    const ok = runFrom(elsewhere, ["scripts/topic-validate.js", "valid-topic"], { BRAINSTORMING_WORKSPACE: ws });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    // Negative control: a topic that exists only in the plugin repo is NOT visible.
    const miss = runFrom(elsewhere, ["scripts/topic-validate.js", "open-design"], { BRAINSTORMING_WORKSPACE: ws });
    assert.notEqual(miss.status, 0, "plugin-repo topic must not leak into the workspace");
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
    fs.rmSync(elsewhere, { recursive: true, force: true });
  }
});

test("workspace falls back to CLAUDE_PROJECT_DIR, then the current directory", () => {
  const ws = makeWorkspace();
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "bs-elsewhere-"));
  try {
    const viaProjectDir = runFrom(elsewhere, ["scripts/topic-validate.js", "valid-topic"], { CLAUDE_PROJECT_DIR: ws });
    assert.equal(viaProjectDir.status, 0, viaProjectDir.stdout + viaProjectDir.stderr);
    const viaCwd = runFrom(ws, ["scripts/topic-validate.js", "valid-topic"]);
    assert.equal(viaCwd.status, 0, viaCwd.stdout + viaCwd.stderr);
    const wrongCwd = runFrom(elsewhere, ["scripts/topic-validate.js", "valid-topic"]);
    assert.notEqual(wrongCwd.status, 0, "with no override, a cwd without the topic must fail");
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
    fs.rmSync(elsewhere, { recursive: true, force: true });
  }
});

test("lint-agents finds pipeline/agents in the plugin root from any cwd", () => {
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "bs-elsewhere-"));
  try {
    const result = runFrom(elsewhere, ["scripts/lint-agents.js"]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Agent spec lint passed — 12 agent/);
  } finally {
    fs.rmSync(elsewhere, { recursive: true, force: true });
  }
});

test("settings hygiene checks workspace denies and the plugin's hooks.json", () => {
  const ws = makeWorkspace();
  try {
    const clean = runFrom(ws, ["scripts/check-settings-hygiene.js", "--strict", "--json"]);
    assert.equal(clean.status, 0, clean.stdout);
    const cleanReport = JSON.parse(clean.stdout);
    assert.equal(cleanReport.findings.filter((f) => f.severity !== "info").length, 0, clean.stdout);

    fs.mkdirSync(path.join(ws, ".claude"), { recursive: true });
    fs.writeFileSync(
      path.join(ws, ".claude", "settings.json"),
      JSON.stringify({ permissions: { deny: ["Read(topics/*/_pipeline/**)"] } }),
    );
    const dirty = runFrom(ws, ["scripts/check-settings-hygiene.js", "--strict", "--json"]);
    assert.equal(dirty.status, 1, dirty.stdout);
    assert.match(dirty.stdout, /pipeline-breaking rule/);
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
  }
});
