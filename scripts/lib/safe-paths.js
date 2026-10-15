"use strict";

const fs = require("node:fs");
const path = require("node:path");

const RESERVED_TOPIC_PREFIX = "_";
const RESERVED_TOPIC_NAMES = new Set(["_meta", "_cross", "_tmp"]);
const TOPIC_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function normalizeForCompare(filePath) {
  return path.resolve(filePath).toLowerCase();
}

function resolveInside(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...segments);
  const rootCmp = normalizeForCompare(resolvedRoot);
  const targetCmp = normalizeForCompare(target);
  if (targetCmp !== rootCmp && !targetCmp.startsWith(`${rootCmp}${path.sep}`)) {
    throw new Error(`Resolved path escapes root: ${target}`);
  }
  return target;
}

function isReservedTopicName(name) {
  return RESERVED_TOPIC_NAMES.has(name) || String(name ?? "").startsWith(RESERVED_TOPIC_PREFIX);
}

function isValidTopicSlug(slug) {
  return TOPIC_SLUG_PATTERN.test(String(slug ?? ""));
}

function topicDir(topicsRoot, slug) {
  if (!isValidTopicSlug(slug)) {
    throw new Error(`Invalid topic slug: ${slug}`);
  }
  return resolveInside(topicsRoot, slug);
}

function pipelineDirForTopic(topicDirPath) {
  return resolveInside(topicDirPath, "_pipeline");
}

function statePathForTopic(topicDirPath) {
  return resolveInside(pipelineDirForTopic(topicDirPath), "state.json");
}

function evidencePathForTopic(topicDirPath) {
  return resolveInside(pipelineDirForTopic(topicDirPath), "evidence.json");
}

function listTopicDirs(topicsRoot, options = {}) {
  if (!fs.existsSync(topicsRoot)) return [];
  const includeReserved = options.includeReserved === true;
  const requireVerdict = options.requireVerdict === true;

  return fs
    .readdirSync(topicsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => includeReserved || !isReservedTopicName(name))
    .filter(name => !requireVerdict || fs.existsSync(resolveInside(topicsRoot, name, "verdict.md")))
    .sort()
    .map(name => resolveInside(topicsRoot, name));
}

module.exports = {
  evidencePathForTopic,
  isReservedTopicName,
  isValidTopicSlug,
  listTopicDirs,
  pipelineDirForTopic,
  resolveInside,
  statePathForTopic,
  topicDir,
};
