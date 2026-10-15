"use strict";

/*
purpose: Single source of truth for the archived-topic slug set, parsed from
archived-topics.md. Archived topic folders intentionally stay on disk (the
archive operation moves registry rows, not directories), so every script that
enumerates topics/ by directory listing MUST consult this set or it will treat
retired topics as active. Incident: 2026-06-09 — regenerate-index, both
exporters, and check-staleness all disagreed about the active corpus (47 vs 67).
*/

const fs = require("node:fs");
const path = require("node:path");

const ARCHIVED_LINK_PATTERN = /\[([^\]]+)\]\(topics\/([^/)]+)\//g;

/**
 * Returns the Set of archived topic slugs listed in {rootDir}/archived-topics.md.
 * Missing file yields an empty set (e.g. test fixtures without an archive).
 */
function readArchivedSlugs(rootDir) {
  const slugs = new Set();
  const archivedPath = path.join(rootDir, "archived-topics.md");
  if (!fs.existsSync(archivedPath)) return slugs;
  const content = fs.readFileSync(archivedPath, "utf8");
  for (const match of content.matchAll(ARCHIVED_LINK_PATTERN)) {
    slugs.add(match[2]);
  }
  return slugs;
}

module.exports = { readArchivedSlugs };
