"use strict";

function parseMarkdownRow(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed.startsWith("|")) return null;
  const body = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return body.split("|").map(cell => cell.trim());
}

function isSeparatorRow(cells) {
  return Array.isArray(cells) && cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function parseRowsAfterHeader(content, headerPredicate) {
  const rows = [];
  const lines = String(content ?? "").split(/\r?\n/);
  let inTable = false;
  let headerSeen = false;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const cells = parseMarkdownRow(raw);

    if (cells && headerPredicate(cells, raw)) {
      inTable = true;
      headerSeen = false;
      continue;
    }

    if (inTable && cells && isSeparatorRow(cells)) {
      headerSeen = true;
      continue;
    }

    if (inTable && headerSeen && cells) {
      rows.push({ lineIndex: i, raw, cells });
      continue;
    }

    if (inTable && String(raw).trim() === "") {
      inTable = false;
      headerSeen = false;
    }
  }

  return rows;
}

module.exports = {
  isSeparatorRow,
  parseMarkdownRow,
  parseRowsAfterHeader,
};
