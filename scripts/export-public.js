#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

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
  for (const topic of topicDirs) {
    for (const file of publicTopicFiles) {
      const source = path.join(topicsRoot, topic.name, file);
      const destination = path.join(outRoot, "topics", topic.name, file);
      if (copyFileIfExists(source, destination)) {
        copied.push(path.relative(repoRoot, source).replace(/\\/g, "/"));
      }
    }
  }

  const violations = assertNoPrivateArtifacts(outRoot);
  if (violations.length > 0) {
    console.error("Public export contains private or sensitive artifacts:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(`Public export written to ${path.relative(repoRoot, outRoot).replace(/\\/g, "/")}`);
  console.log(`Copied ${copied.length} file(s) across ${topicDirs.length} topic(s).`);
}

main();
