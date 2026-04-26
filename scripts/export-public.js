#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseFrontmatter, readJsonIfExists } = require("./lib/topic-utils");

const repoRoot = path.resolve(__dirname, "..");
const outRoot = path.join(repoRoot, "dist", "public");
const topicsRoot = path.join(repoRoot, "topics");
const publicTopicFiles = ["overview.md", "notes.md", "verdict.md"];
const rootFiles = ["README.md", "CLAUDE.md", "index.md", "archived-topics.md", "diagram.md", "LICENSE", "package.json"];

function removeDirectorySafe(target) {
  const resolved = path.resolve(target);
  const distRoot = path.join(repoRoot, "dist");
  if (!resolved.startsWith(distRoot + path.sep) && resolved !== distRoot) {
    throw new Error(`Refusing to remove path outside dist/: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function copyFileIfExists(source, destination) {
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

function isPublicTopicDir(entry) {
  if (!entry.isDirectory() || entry.name.startsWith("_")) return false;
  return publicTopicFiles.some(file => fs.existsSync(path.join(topicsRoot, entry.name, file)));
}

function assertNoPrivateArtifacts(dir) {
  const violations = [];
  const blockedNames = new Set(["_pipeline", "_meta", "_tmp", ".git", "node_modules"]);
  const secretPatterns = [/\.env(?:\.|$)/i, /\.(pem|key|p12|pfx|crt|cert)$/i];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replace(/\\/g, "/");
      if (blockedNames.has(entry.name) || secretPatterns.some(pattern => pattern.test(entry.name))) {
        violations.push(rel);
        continue;
      }
      if (entry.isDirectory()) walk(full);
    }
  }

  walk(dir);
  return violations;
}

function main() {
  removeDirectorySafe(outRoot);
  fs.mkdirSync(outRoot, { recursive: true });

  const copied = [];
  for (const file of rootFiles) {
    if (copyFileIfExists(path.join(repoRoot, file), path.join(outRoot, file))) {
      copied.push(file);
    }
  }

  const topicIndex = path.join(topicsRoot, "index.md");
  copyFileIfExists(topicIndex, path.join(outRoot, "topics", "index.md"));

  const topicDirs = fs.readdirSync(topicsRoot, { withFileTypes: true }).filter(isPublicTopicDir);
  const partialExports = [];
  for (const topic of topicDirs) {
    const present = [];
    const absent = [];
    for (const file of publicTopicFiles) {
      const source = path.join(topicsRoot, topic.name, file);
      const destination = path.join(outRoot, "topics", topic.name, file);
      if (copyFileIfExists(source, destination)) {
        copied.push(path.relative(repoRoot, source).replace(/\\/g, "/"));
        present.push(file);
      } else {
        absent.push(file);
      }
    }
    if (present.length > 0 && absent.length > 0) {
      partialExports.push({ slug: topic.name, present, absent });
    }
  }

  if (partialExports.length > 0) {
    for (const { slug, absent } of partialExports) {
      console.error(`Warning: topic "${slug}" is missing public file(s): ${absent.join(", ")}`);
    }
    console.error(`${partialExports.length} topic(s) exported with incomplete file sets.`);
    process.exit(1);
  }

  // Write machine-readable index.json for downstream consumers
  const indexEntries = topicDirs.map(topic => {
    const slug = topic.name;
    const verdictPath = path.join(topicsRoot, slug, "verdict.md");
    const statePath = path.join(topicsRoot, slug, "_pipeline", "state.json");
    const fm = fs.existsSync(verdictPath)
      ? parseFrontmatter(fs.readFileSync(verdictPath, "utf8"))
      : {};
    const state = readJsonIfExists(statePath) || {};
    const verdictText = fs.existsSync(verdictPath) ? fs.readFileSync(verdictPath, "utf8") : "";
    // Verdict: prefer frontmatter, then bold pattern in recommendation section
    const boldMatch = verdictText.match(/## Recommendation\s*\r?\n+\*\*([^*\n]+)\*\*/i);
    const rawVerdict = fm.verdict || (boldMatch ? boldMatch[1].trim() : null);
    const verdict = rawVerdict ? rawVerdict.toUpperCase().replace(/-/g, " ") : null;
    // Key recommendation: first non-empty paragraph in recommendation section
    const recSectionMatch = verdictText.match(/## Recommendation\s*\r?\n+([\s\S]*?)(?=\r?\n##|\r?\n---|\s*$)/i);
    const recSection = recSectionMatch ? recSectionMatch[1] : "";
    const firstPara = recSection
      .split(/\r?\n\r?\n/)
      .map(p => p.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim())
      .find(p => p.length > 20 && !p.startsWith("**") && !p.startsWith("#") && !p.startsWith("-") && !p.startsWith("|"));
    const key_recommendation = firstPara ? firstPara.slice(0, 200) : null;
    return {
      slug,
      title: fm.title || slug,
      verdict,
      score: state.run_metrics?.final_score ?? null,
      confidence: fm.confidence || null,
      created: fm.created || null,
      updated: fm.updated || fm.created || null,
      key_recommendation,
    };
  });

  const indexJsonPath = path.join(outRoot, "index.json");
  fs.writeFileSync(
    indexJsonPath,
    `${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), topics: indexEntries }, null, 2)}\n`,
    "utf8"
  );

  const violations = assertNoPrivateArtifacts(outRoot);
  if (violations.length > 0) {
    console.error("Public export contains private or sensitive artifacts:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(`Public export written to ${path.relative(repoRoot, outRoot).replace(/\\/g, "/")}`);
  console.log(`Copied ${copied.length} file(s) across ${topicDirs.length} topic(s).`);
  console.log(`Machine-readable index written to ${path.relative(repoRoot, indexJsonPath).replace(/\\/g, "/")}.`);
}

main();
