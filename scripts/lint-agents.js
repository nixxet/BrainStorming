#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const agentsDir = path.join(repoRoot, ".claude", "agents");

const REQUIRED_FRONTMATTER = ["name", "model", "maxTurns"];

// Agents that handle external/untrusted content and must have the safety section
const REQUIRE_UNTRUSTED_SECTION = new Set([
  "researcher",
  "investigator",
  "analyzer",
  "writer",
  "publisher",
  "gap-fill",
  "challenger",
  "security-reviewer",
]);

const VALID_MODELS = new Set(["sonnet", "opus", "haiku"]);

function parseFrontmatter(content) {
  const normalized = content.replace(/\r/g, "");
  const match = normalized.match(/^---([\s\S]*?)\n---/);
  if (!match) return null;
  const result = {};
  for (const line of match[1].split("\n")) {
    const parsed = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (!parsed) continue;
    result[parsed[1]] = parsed[2].trim();
  }
  return result;
}

function lintAgentFile(filePath) {
  const errors = [];
  const rel = path.relative(repoRoot, filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return [`${rel}: cannot read file — ${err.message}`];
  }

  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push(`${rel}: missing or malformed YAML frontmatter (expected ---...--- block)`);
    return errors;
  }

  for (const key of REQUIRED_FRONTMATTER) {
    if (!fm[key]) errors.push(`${rel}: frontmatter missing required field "${key}"`);
  }

  if (fm.model && !VALID_MODELS.has(fm.model)) {
    errors.push(`${rel}: frontmatter "model" value "${fm.model}" is not a recognized model (expected: ${[...VALID_MODELS].join(", ")})`);
  }

  if (fm.maxTurns) {
    const turns = Number(fm.maxTurns);
    if (!Number.isInteger(turns) || turns < 1 || turns > 100) {
      errors.push(`${rel}: frontmatter "maxTurns" must be an integer between 1 and 100 (got "${fm.maxTurns}")`);
    }
  }

  const agentName = fm.name || path.basename(filePath, ".md");
  if (REQUIRE_UNTRUSTED_SECTION.has(agentName)) {
    if (!content.includes("Untrusted Source Handling")) {
      errors.push(`${rel}: missing required "Untrusted Source Handling" section (required for agents that process external content)`);
    }
  }

  return errors;
}

function getDirectorAgentRefs(directorPath) {
  let content;
  try {
    content = fs.readFileSync(directorPath, "utf8");
  } catch {
    return new Set();
  }
  const refs = new Set();
  const pattern = /\.claude\/agents\/([a-z-]+)\.md/g;
  const pattern2 = /`([a-z-]+)\.md`/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    if (name !== "director") refs.add(name);
  }
  while ((match = pattern2.exec(content)) !== null) {
    const name = match[1];
    if (!name.includes(".") && /^[a-z-]+$/.test(name) && name !== "director") refs.add(name);
  }
  return refs;
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");

  const errors = [];

  if (!fs.existsSync(agentsDir)) {
    errors.push(`agents directory not found: ${agentsDir}`);
    if (jsonOutput) {
      console.log(JSON.stringify({ passed: false, errors }, null, 2));
    } else {
      console.error(`Lint failed: ${errors[0]}`);
    }
    process.exit(1);
  }

  const agentFiles = fs
    .readdirSync(agentsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".md"))
    .map(entry => path.join(agentsDir, entry.name));

  const knownAgentNames = new Set(agentFiles.map(f => path.basename(f, ".md")));

  for (const filePath of agentFiles) {
    const fileErrors = lintAgentFile(filePath);
    errors.push(...fileErrors);
  }

  // Check that agent names referenced in director.md have corresponding files
  const directorPath = path.join(agentsDir, "director.md");
  if (fs.existsSync(directorPath)) {
    const refs = getDirectorAgentRefs(directorPath);
    const agentOnlyRefs = new Set(
      [...refs].filter(name => {
        // Only flag names that look like agent names (not output file names or docs)
        return /^[a-z-]+$/.test(name) &&
          !["landscape", "deep-dive", "gap-fill", "verified-synthesis",
            "scorecard", "security-review", "stress-test", "challenge",
            "archived-topics", "index", "notes", "overview", "verdict",
            "draft-notes", "draft-overview", "draft-verdict"].includes(name);
      })
    );
    for (const ref of agentOnlyRefs) {
      if (!knownAgentNames.has(ref)) {
        errors.push(`director.md references agent "${ref}.md" but no such file exists in .claude/agents/`);
      }
    }
  } else {
    errors.push(".claude/agents/director.md not found — cannot verify agent registry");
  }

  const passed = errors.length === 0;

  if (jsonOutput) {
    console.log(JSON.stringify({ passed, agents_checked: agentFiles.length, errors }, null, 2));
  } else if (passed) {
    console.log(`Agent spec lint passed — ${agentFiles.length} agent(s) checked.`);
  } else {
    console.error(`Agent spec lint failed with ${errors.length} issue(s):`);
    for (const err of errors) console.error(`- ${err}`);
  }

  process.exit(passed ? 0 : 1);
}

main();
