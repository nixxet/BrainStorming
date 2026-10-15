"use strict";

const fs = require("node:fs");
const { pipelineDirForTopic, statePathForTopic } = require("./safe-paths");

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function readJsonFile(filePath) {
  const raw = readTextIfExists(filePath);
  if (raw == null) return { data: null, raw: null, parseError: null };
  try {
    return { data: JSON.parse(raw), raw, parseError: null };
  } catch (error) {
    return { data: null, raw, parseError: error.message };
  }
}

function readPipelineState(topicDirPath) {
  const pipelineDir = pipelineDirForTopic(topicDirPath);
  const statePath = statePathForTopic(topicDirPath);
  const parsed = readJsonFile(statePath);
  return {
    exists: fs.existsSync(pipelineDir),
    pipelineDir,
    statePath,
    state: parsed.data,
    raw: parsed.raw,
    parseError: parsed.parseError,
  };
}

function writePipelineState(statePath, state) {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function ensureObject(target, key, fallback = {}) {
  if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
    target[key] = fallback;
  }
  return target[key];
}

module.exports = {
  ensureObject,
  readJsonFile,
  readPipelineState,
  readTextIfExists,
  writePipelineState,
};
