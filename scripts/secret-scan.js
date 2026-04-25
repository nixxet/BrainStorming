#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const externalScanners = [
  { command: "gitleaks", args: ["detect", "--source", ".", "--redact"] },
  { command: "trufflehog", args: ["filesystem", ".", "--only-verified", "--no-update"] },
];

function runExternalScanner() {
  for (const scanner of externalScanners) {
    const result = spawnSync(scanner.command, scanner.args, {
      cwd: repoRoot,
      encoding: "utf8",
    });
    if (result.error && result.error.code === "ENOENT") continue;
    const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`.toLowerCase();
    if (
      result.status !== 0 &&
      (combinedOutput.includes("not recognized") ||
        combinedOutput.includes("command not found") ||
        combinedOutput.includes("not found"))
    ) {
      continue;
    }
    if (result.status === 0) {
      console.log(`${scanner.command} completed without verified findings.`);
      return true;
    }
    if (result.status !== null) {
      process.stdout.write(result.stdout || "");
      process.stderr.write(result.stderr || "");
      process.exit(result.status);
    }
  }
  return false;
}

const secretPatterns = [
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "OpenAI-style key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { name: "private key block", pattern: /-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY-----/ },
];

const ignoredDirs = new Set([".git", "node_modules", "dist", "coverage", "_meta"]);
const ignoredFiles = new Set(["package-lock.json"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (!ignoredFiles.has(entry.name)) files.push(full);
  }
  return files;
}

function runFallbackScan() {
  const findings = [];
  for (const file of walk(repoRoot)) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(text)) {
        findings.push(`${path.relative(repoRoot, file)}: possible ${name}`);
      }
    }
  }

  if (findings.length > 0) {
    console.error(`Fallback secret scan found ${findings.length} issue(s):`);
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(1);
  }
  console.log("Fallback secret scan completed without obvious secret patterns.");
}

if (!runExternalScanner()) {
  console.log("No external secret scanner found; using built-in fallback pattern scan.");
  runFallbackScan();
}
