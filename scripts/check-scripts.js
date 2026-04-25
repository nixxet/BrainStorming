#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const scriptsDir = path.join(repoRoot, "scripts");

function listJavaScriptFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listJavaScriptFiles(fullPath);
      }
      return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
    });
}

const files = listJavaScriptFiles(scriptsDir);
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failures.push({
      file: path.relative(repoRoot, file),
      stderr: result.stderr.trim(),
      stdout: result.stdout.trim(),
    });
  }
}

if (failures.length > 0) {
  console.error(`JavaScript syntax check failed for ${failures.length} file(s).`);
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    if (failure.stderr) console.error(failure.stderr);
    if (failure.stdout) console.error(failure.stdout);
  }
  process.exit(1);
}

console.log(`JavaScript syntax check passed for ${files.length} file(s).`);
