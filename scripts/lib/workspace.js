"use strict";

/**
 * Two roots, kept separate so the pipeline works as an installed plugin:
 *
 * PLUGIN_ROOT     where this code ships (agents/, skills/, scripts/, schemas/).
 *                 Read-only at runtime: an installed plugin is a versioned copy
 *                 that is replaced on update.
 *
 * WORKSPACE_ROOT  where research lives (topics/, index.md, archived-topics.md,
 *                 config.json, dist/). Resolved, in order, from:
 *                   1. BRAINSTORMING_WORKSPACE  explicit override
 *                   2. CLAUDE_PROJECT_DIR       set by Claude Code for hooks
 *                   3. process.cwd()            the directory Claude Code runs in
 */

const path = require("node:path");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

function resolveWorkspaceRoot(env = process.env, cwd = process.cwd()) {
  const chosen = env.BRAINSTORMING_WORKSPACE || env.CLAUDE_PROJECT_DIR || cwd;
  return path.resolve(chosen);
}

const WORKSPACE_ROOT = resolveWorkspaceRoot();

module.exports = { PLUGIN_ROOT, WORKSPACE_ROOT, resolveWorkspaceRoot };
