"use strict";

const fs = require("node:fs");
const path = require("node:path");

const RESERVED_TOPIC_PREFIX = "_";

function parseFrontmatter(content) {
  const normalized = content.replace(/\r/g, "");
  const match = normalized.match(/^---([\s\S]*?)\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split("\n")) {
    const parsed = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (!parsed) continue;
    let value = parsed[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[parsed[1]] = value;
  }
  return result;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __parseError: error.message };
  }
}

function listTopicSlugs(topicsRoot) {
  if (!fs.existsSync(topicsRoot)) return [];
  return fs
    .readdirSync(topicsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => !name.startsWith(RESERVED_TOPIC_PREFIX))
    .filter(name => fs.existsSync(path.join(topicsRoot, name, "verdict.md")))
    .sort();
}

function readTopicFrontmatter(topicsRoot, slug, fileName = "verdict.md") {
  const filePath = path.join(topicsRoot, slug, fileName);
  if (!fs.existsSync(filePath)) return {};
  return parseFrontmatter(fs.readFileSync(filePath, "utf8"));
}

function latestFileMatching(dir, pattern) {
  if (!fs.existsSync(dir)) return null;
  const matches = fs
    .readdirSync(dir)
    .filter(file => pattern.test(file))
    .sort();
  return matches.length > 0 ? path.join(dir, matches[matches.length - 1]) : null;
}

module.exports = {
  latestFileMatching,
  listTopicSlugs,
  parseFrontmatter,
  readJsonIfExists,
  readTopicFrontmatter,
};
