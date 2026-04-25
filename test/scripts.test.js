const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");

function run(args) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

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
  const slug = "citation-safety-test";
  const topicDir = path.join(repoRoot, "topics", slug);
  fs.rmSync(topicDir, { recursive: true, force: true });
  fs.mkdirSync(topicDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(topicDir, "overview.md"), "# Citation Safety\n\n[private](http://127.0.0.1/secret)\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "notes.md"), "# Notes\n", "utf8");
    fs.writeFileSync(path.join(topicDir, "verdict.md"), "# Verdict\n", "utf8");

    const result = run(["scripts/verify-citations.js", "--topic", slug]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /BLOCKED_PRIVATE_NETWORK/);
  } finally {
    fs.rmSync(topicDir, { recursive: true, force: true });
  }
});
