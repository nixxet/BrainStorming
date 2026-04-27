#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const externalScanners = [
  {
    command: "gitleaks",
    versionArgs: ["version"],
    scanArgs: ["detect", "--source", ".", "--redact"],
  },
  {
    command: "trufflehog",
    versionArgs: ["--version"],
    scanArgs: ["filesystem", ".", "--only-verified", "--no-update"],
  },
];

/**
 * Probe whether a scanner binary is present and responds to its version flag.
 * Returns { found: bool, functional: bool, version: string|null, error: string|null }.
 */
function probeScanner({ command, versionArgs }) {
  const probe = spawnSync(command, versionArgs, { encoding: "utf8" });

  if (probe.error?.code === "ENOENT") {
    return { found: false, functional: false, version: null, error: "not installed" };
  }

  const combined = `${probe.stdout || ""}${probe.stderr || ""}`.trim();
  const notFoundSignals = ["not recognized", "command not found", "is not recognized"];
  if (notFoundSignals.some((s) => combined.toLowerCase().includes(s))) {
    return { found: false, functional: false, version: null, error: "not installed (shell)" };
  }

  if (probe.status !== 0 && !combined) {
    return { found: true, functional: false, version: null, error: `version probe exited ${probe.status} with no output` };
  }

  // Extract a version string from the first line of output
  const versionLine = combined.split(/\r?\n/)[0].trim();
  return { found: true, functional: true, version: versionLine || null, error: null };
}

function runExternalScanner() {
  for (const scanner of externalScanners) {
    const probe = probeScanner(scanner);

    if (!probe.found) {
      console.log(`  ${scanner.command}: not found — skipping`);
      continue;
    }

    if (!probe.functional) {
      console.warn(`  ${scanner.command}: found but not functional (${probe.error}) — skipping`);
      continue;
    }

    console.log(`  ${scanner.command}: ready (${probe.version}) — running scan`);

    const result = spawnSync(scanner.command, scanner.scanArgs, {
      cwd: repoRoot,
      encoding: "utf8",
    });

    // Clean exit — no findings
    if (result.status === 0) {
      console.log(`${scanner.command} completed without verified findings.`);
      return true;
    }

    // Non-zero exit with stdout: scanner found something — report and halt
    if (result.stdout && result.stdout.trim()) {
      process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.status);
    }

    // Non-zero exit with no stdout: runtime or config error — warn and try next
    process.stderr.write(
      `Warning: ${scanner.command} exited ${result.status} with no findings output. ` +
        `Stderr: ${(result.stderr || "").trim() || "(empty)"}\n`
    );
  }
  return false;
}

const secretPatterns = [
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  // Real sk- keys are base62 (no hyphens in the key body). URL slugs like
  // "sk-as-security-governance-concerns-mount" are excluded by requiring
  // 20+ alphanumeric-only chars after the optional provider prefix.
  { name: "OpenAI-style key", pattern: /sk-(?:proj-|org-)?[A-Za-z0-9]{20,}/ },
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

console.log("Probing external scanners:");
if (!runExternalScanner()) {
  console.log("No external scanner available; using built-in fallback pattern scan.");
  runFallbackScan();
}
