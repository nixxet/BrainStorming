#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// H15 fix (2026-06-06): allow tests (and ad-hoc runs) to point the fallback scan
// at an isolated directory with a seeded secret, instead of only ever scanning the
// real repo. Falls back to the repo root when unset.
const repoRoot = process.env.SECRET_SCAN_ROOT
  ? path.resolve(process.env.SECRET_SCAN_ROOT)
  : require("./lib/workspace").WORKSPACE_ROOT;
const externalScanners = [
  {
    command: "gitleaks",
    versionArgs: ["version"],
    // `dir` scans the working tree as files on disk. `detect --source .` scans git
    // history only, so uncommitted files (exactly what a pre-publish gate must
    // catch) and non-git directories scanned 0 bytes and passed.
    scanArgs: ["dir", ".", "--redact", "--no-banner"],
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

    // Exit 1 is gitleaks' "leaks found" code. It reports on stderr with empty
    // stdout, so the exit code (not stdout) is the signal. Report and halt.
    if (result.status === 1) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      console.error(`${scanner.command} reported leaks (rerun without --redact locally to see values).`);
      process.exit(1);
    }

    // Non-zero exit with no stdout: runtime or config error — warn and try next
    process.stderr.write(
      `Warning: ${scanner.command} exited ${result.status} with no findings output. ` +
        `Stderr: ${(result.stderr || "").trim() || "(empty)"}\n`
    );
  }
  return false;
}

// H9 fix (2026-06-06): on a box with no gitleaks (this machine), this
// fallback is the ONLY secret gate. The original 5 patterns missed nearly every
// modern key format. Patterns below have distinctive prefixes (low false-positive
// risk on a markdown-heavy repo); the generic-assignment pattern at the end is
// deliberately conservative (quoted value, 16+ chars, mixed character classes,
// placeholder words excluded) so it doesn't fire on prose about "tokens"/"keys".
const PLACEHOLDER_VALUE = /^(?:x{3,}|\.{3,}|<[^>]+>|your[_-]?|example|placeholder|changeme|redacted|dummy|sample|test[_-]?key|\$\{)/i;

const secretPatterns = [
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  // Real sk- keys are base62 (no hyphens in the key body). URL slugs like
  // "sk-as-security-governance-concerns-mount" are excluded by requiring
  // 20+ alphanumeric-only chars after the optional provider prefix.
  { name: "OpenAI-style key", pattern: /sk-(?:proj-|org-)?[A-Za-z0-9]{20,}/ },
  // Anthropic keys use hyphenated segments the OpenAI pattern can't match.
  { name: "Anthropic API key", pattern: /sk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{20,}/ },
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Stripe secret key", pattern: /[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { name: "GitHub fine-grained PAT", pattern: /github_pat_[A-Za-z0-9_]{30,}/ },
  { name: "GitLab PAT", pattern: /glpat-[A-Za-z0-9_-]{20,}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { name: "Slack webhook URL", pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_]+\/B[A-Za-z0-9_]+\/[A-Za-z0-9_]+/ },
  { name: "JWT", pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "private key block", pattern: /-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY-----/ },
  {
    name: "generic secret assignment",
    // key/secret/token/password = "value" with a non-placeholder, mixed-class value
    pattern: /\b(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|password|passwd)\b["']?\s*[:=]\s*["']([^"']{16,})["']/i,
    validate: (m) => {
      const value = m[1];
      if (PLACEHOLDER_VALUE.test(value)) return false;
      // Require at least one letter and one digit (real secrets are mixed-class).
      return /[A-Za-z]/.test(value) && /[0-9]/.test(value);
    },
  },
];

const ignoredDirs = new Set([".git", "node_modules", "dist", "coverage", "_meta"]);
const ignoredFiles = new Set(["package-lock.json"]);
// L22 fix (2026-06-07): add size cap to prevent scanning massive binary files
const MAX_SCAN_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PREFIX_BYTES = 8192;

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
  const skipped = [];
  for (const file of walk(repoRoot)) {
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      continue;
    }
    // L22 fix (2026-06-07): skip files over size cap
    if (stat.size > MAX_SCAN_BYTES) {
      skipped.push(`${path.relative(repoRoot, file)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      continue;
    }

    let text;
    try {
      // L22 fix (2026-06-07): read prefix and sniff for binary content
      const buffer = Buffer.alloc(Math.min(MAX_PREFIX_BYTES, stat.size));
      const fd = fs.openSync(file, "r");
      fs.readSync(fd, buffer, 0, buffer.length);
      fs.closeSync(fd);
      // Check for NUL byte (binary file marker)
      if (buffer.includes(0)) {
        skipped.push(`${path.relative(repoRoot, file)} (binary)`);
        continue;
      }
      // The prefix is only for binary sniffing; scan the whole (size-capped) file
      // so a secret past the first 8 KB is not missed.
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { name, pattern, validate } of secretPatterns) {
      const rx = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
      let match;
      while ((match = rx.exec(text)) !== null) {
        if (validate && !validate(match)) continue;
        findings.push(`${path.relative(repoRoot, file)}: possible ${name}`);
        break;
      }
    }
  }

  if (findings.length > 0) {
    console.error(`Fallback secret scan found ${findings.length} issue(s):`);
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(1);
  }
  if (skipped.length > 0) {
    console.log(`Fallback secret scan skipped ${skipped.length} file(s) over size cap or binary.`);
  }
  console.log("Fallback secret scan completed without obvious secret patterns.");
}

console.log("Probing external scanners:");
// Defense in depth: the external scanner and the built-in patterns catch different
// things (gitleaks skips low-entropy keys; the patterns know fewer formats), so a
// clean external result never skips the built-in scan. Either finding exits 1.
if (!runExternalScanner()) {
  console.log("No external scanner available; using built-in pattern scan only.");
}
runFallbackScan();
