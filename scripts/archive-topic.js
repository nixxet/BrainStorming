#!/usr/bin/env node
/*
title: Topic Archive/Restore Helper
purpose: Move a topic row between index.md and archived-topics.md cleanly, or restore it.
*/

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "index.md");
const archivePath = path.join(repoRoot, "archived-topics.md");
const topicsRoot = path.join(repoRoot, "topics");

function printHelp() {
  console.log(`Usage:
  node scripts/archive-topic.js archive <slug> [--dry-run] [--json]
  node scripts/archive-topic.js restore <slug> [--dry-run] [--json]
  node scripts/archive-topic.js list [--json]

Commands:
  archive <slug>   Move topic row from index.md to archived-topics.md
  restore <slug>   Move topic row from archived-topics.md back to index.md
  list             List all currently archived topics

Options:
  --dry-run        Preview without writing
  --json           Output JSON result
  --help, -h       Show this help

Exit codes:
  0  Success
  1  Error (slug not found, topic folder missing, parse error)
`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = { command: null, slug: null, dryRun: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") { args.dryRun = true; }
    else if (a === "--json") { args.json = true; }
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else if (!args.command) { args.command = a; }
    else if (!args.slug) { args.slug = a; }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(1); }
  }
  return args;
}

function readFile(p) {
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8");
}

function parseTableRows(content) {
  const rows = [];
  const lines = content.split("\n");
  let inTable = false;
  let headerSeen = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("| Topic") || line.startsWith("|Topic")) {
      inTable = true;
      headerSeen = false;
      continue;
    }
    if (inTable && line.startsWith("|---")) {
      headerSeen = true;
      continue;
    }
    if (inTable && headerSeen && line.startsWith("|")) {
      rows.push({ lineIndex: i, raw: lines[i] });
    } else if (inTable && line === "") {
      inTable = false;
    }
  }
  return rows;
}

function slugFromRow(raw) {
  const m = raw.match(/\[.*?\]\(topics\/([^/]+)\//);
  return m ? m[1] : null;
}

function setRowStatus(raw, newStatus) {
  return raw.replace(/\| [^|]+ \|(\s*[^|]+\s*)\|/, (match, _status, rest) => {
    return `| ${newStatus} |${rest}`;
  });
}

function markArchivedInRow(raw, date) {
  const cells = raw.split("|").map((c) => c.trim()).filter(Boolean);
  if (cells.length < 3) return raw;
  const topicCell = cells[0];
  let verdictCell = cells[2];
  if (!verdictCell.endsWith("(archived)")) {
    verdictCell = verdictCell + " (archived)";
  }
  return `| ${topicCell} | Archived ${date} | ${verdictCell} |`;
}

function unmarkArchivedInRow(raw) {
  return raw.replace(/\s*\(archived\)/g, "").replace(/\| Archived \d{4}-\d{2}-\d{2} \|/, "| Restored |");
}

function rebuildContent(originalContent, removedLineIndex, replacement) {
  const lines = originalContent.split("\n");
  if (replacement !== null) {
    lines[removedLineIndex] = replacement;
  } else {
    lines.splice(removedLineIndex, 1);
  }
  return lines.join("\n");
}

function appendRowToFile(content, row) {
  const lines = content.trimEnd().split("\n");
  lines.push(row);
  lines.push("");
  return lines.join("\n");
}

function listArchived() {
  const content = readFile(archivePath);
  const rows = parseTableRows(content);
  return rows.map((r) => ({ slug: slugFromRow(r.raw), raw: r.raw.trim() })).filter((r) => r.slug);
}

function doArchive(slug, dryRun) {
  const topicDir = path.join(topicsRoot, slug);
  if (!fs.existsSync(topicDir)) {
    console.error(`Error: topics/${slug}/ does not exist.`);
    process.exit(1);
  }

  const indexContent = readFile(indexPath);
  const indexRows = parseTableRows(indexContent);
  const match = indexRows.find((r) => slugFromRow(r.raw) === slug);
  if (!match) {
    console.error(`Error: "${slug}" not found in index.md. Already archived or never added?`);
    process.exit(1);
  }

  const date = today();
  const archivedRow = markArchivedInRow(match.raw, date);

  const archiveContent = readFile(archivePath);
  const newIndexContent = rebuildContent(indexContent, match.lineIndex, null);
  const newArchiveContent = appendRowToFile(archiveContent, archivedRow);

  if (dryRun) {
    return { action: "archive", slug, dryRun: true, archivedRow: archivedRow.trim(), indexLinesRemoved: 1 };
  }

  fs.writeFileSync(indexPath, newIndexContent, "utf8");
  fs.writeFileSync(archivePath, newArchiveContent, "utf8");
  return { action: "archive", slug, dryRun: false, archivedRow: archivedRow.trim() };
}

function doRestore(slug, dryRun) {
  const archiveContent = readFile(archivePath);
  const archiveRows = parseTableRows(archiveContent);
  const match = archiveRows.find((r) => slugFromRow(r.raw) === slug);
  if (!match) {
    console.error(`Error: "${slug}" not found in archived-topics.md.`);
    process.exit(1);
  }

  const restoredRow = unmarkArchivedInRow(match.raw);
  const indexContent = readFile(indexPath);
  const newArchiveContent = rebuildContent(archiveContent, match.lineIndex, null);
  const newIndexContent = appendRowToFile(indexContent, restoredRow);

  if (dryRun) {
    return { action: "restore", slug, dryRun: true, restoredRow: restoredRow.trim(), note: "Re-run pipeline to refresh research." };
  }

  fs.writeFileSync(archivePath, newArchiveContent, "utf8");
  fs.writeFileSync(indexPath, newIndexContent, "utf8");
  return { action: "restore", slug, dryRun: false, restoredRow: restoredRow.trim(), note: "Re-run /research <slug> to refresh." };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command || args.command === "--help" || args.command === "-h") {
    printHelp();
    process.exit(args.command ? 0 : 1);
  }

  if (args.command === "list") {
    const archived = listArchived();
    if (args.json) {
      console.log(JSON.stringify({ archived }, null, 2));
    } else {
      if (archived.length === 0) {
        console.log("No archived topics.");
      } else {
        console.log(`Archived topics (${archived.length}):`);
        archived.forEach((a) => console.log(`  ${a.slug}`));
      }
    }
    process.exit(0);
  }

  if (args.command === "archive") {
    if (!args.slug) { console.error("Error: slug required for archive command."); process.exit(1); }
    const result = doArchive(args.slug, args.dryRun);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (args.dryRun) {
      console.log(`[dry-run] Would archive "${args.slug}" from index.md to archived-topics.md`);
      console.log(`  Row: ${result.archivedRow}`);
    } else {
      console.log(`Archived "${args.slug}": moved from index.md to archived-topics.md.`);
    }
    process.exit(0);
  }

  if (args.command === "restore") {
    if (!args.slug) { console.error("Error: slug required for restore command."); process.exit(1); }
    const result = doRestore(args.slug, args.dryRun);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (args.dryRun) {
      console.log(`[dry-run] Would restore "${args.slug}" from archived-topics.md to index.md`);
      console.log(`  Row: ${result.restoredRow}`);
    } else {
      console.log(`Restored "${args.slug}": moved from archived-topics.md to index.md.`);
      console.log(`Note: ${result.note}`);
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(1);
}

main();
