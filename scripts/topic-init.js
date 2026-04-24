#!/usr/bin/env node
/*
title: Topic Scaffolder
purpose: Create a new topic skeleton with correct folder structure and frontmatter stubs.
*/

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

function printHelp() {
  console.log(`Usage:
  node scripts/topic-init.js <slug> [--title "Human Title"] [--tags tag1,tag2] [--dry-run] [--json]

Arguments:
  <slug>           Topic slug (kebab-case, e.g. my-new-topic). Required.

Options:
  --title <text>   Human-readable title (default: title-cased slug)
  --tags <csv>     Comma-separated tags (default: research)
  --dry-run        Preview what would be created without writing files
  --json           Output JSON result
  --help, -h       Show this help

Exit codes:
  0  Success (or dry-run preview)
  1  Error (slug missing, slug already exists, invalid slug)
`);
}

function titleCase(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = { slug: null, title: null, tags: ["research"], dryRun: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") { args.dryRun = true; }
    else if (a === "--json") { args.json = true; }
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else if (a === "--title") { args.title = argv[++i]; }
    else if (a === "--tags") { args.tags = argv[++i].split(",").map((t) => t.trim()); }
    else if (!a.startsWith("--") && !args.slug) { args.slug = a; }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(1); }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.slug) {
    console.error("Error: <slug> is required.");
    printHelp();
    process.exit(1);
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.slug)) {
    console.error(`Error: slug must be kebab-case (lowercase letters, digits, hyphens). Got: "${args.slug}"`);
    process.exit(1);
  }

  const topicDir = path.join(topicsRoot, args.slug);
  if (fs.existsSync(topicDir)) {
    console.error(`Error: topics/${args.slug}/ already exists. Use the pipeline to re-research an existing topic.`);
    process.exit(1);
  }

  const title = args.title || titleCase(args.slug);
  const tagsYaml = "[" + args.tags.map((t) => `${t}`).join(", ") + "]";
  const created = today();

  const overviewMd = `---
title: ${title}
tags: ${tagsYaml}
created: ${created}
status: New
---

# ${title}

## What It Is

<!-- Describe what this topic is in 1-3 sentences. -->

## Key Concepts

<!-- Bullet list of key terms/concepts. -->

## Links

<!-- Official docs, repo, key articles. -->
`;

  const notesMd = `---
title: ${title} — Research Notes
tags: [research, findings]
created: ${created}
status: New
---

# ${title} — Research Notes

## Key Findings

<!-- Add findings with confidence ratings: HIGH / MEDIUM / LOW / UNVERIFIED -->

## Counterarguments

<!-- What pushes back on the main narrative? -->

## Gaps & Unknowns

<!-- What do you still not know? -->
`;

  const verdictMd = `---
title: ${title} — Verdict
tags: [verdict, recommendation]
created: ${created}
status: New
score: null
verdict: null
---

# ${title} — Verdict

## Recommendation

<!-- One clear recommendation with rationale. -->

## Risks & Caveats

<!-- Key risks and must-survive caveats. -->

## Next Steps

<!-- Concrete next actions if adopting. -->
`;

  const pipelineDir = path.join(topicDir, "_pipeline");
  const stateJson = JSON.stringify({
    topic: args.slug,
    created: created,
    mode: "manual",
    status: "new",
    phase_0: { status: "skipped" },
    phase_1: { status: "skipped" },
    phase_2: { status: "skipped" },
    phase_3: { status: "skipped" },
    phase_4: { status: "skipped" },
    phase_5: { status: "skipped" },
    phase_6: { status: "skipped" },
    phase_7: { status: "skipped" },
    run_metrics: {}
  }, null, 2);

  const files = [
    { rel: "overview.md", content: overviewMd },
    { rel: "notes.md", content: notesMd },
    { rel: "verdict.md", content: verdictMd },
    { rel: path.join("_pipeline", "state.json"), content: stateJson },
  ];

  const result = {
    slug: args.slug,
    title,
    topicDir: topicDir.replace(/\\/g, "/"),
    dryRun: args.dryRun,
    filesCreated: files.map((f) => f.rel),
  };

  if (args.dryRun) {
    if (args.json) {
      console.log(JSON.stringify({ ...result, status: "dry-run" }, null, 2));
    } else {
      console.log(`[dry-run] Would create topics/${args.slug}/`);
      files.forEach((f) => console.log(`  + topics/${args.slug}/${f.rel}`));
    }
    process.exit(0);
  }

  fs.mkdirSync(pipelineDir, { recursive: true });
  files.forEach((f) => {
    fs.writeFileSync(path.join(topicDir, f.rel), f.content, "utf8");
  });

  if (args.json) {
    console.log(JSON.stringify({ ...result, status: "created" }, null, 2));
  } else {
    console.log(`Created topics/${args.slug}/`);
    files.forEach((f) => console.log(`  + topics/${args.slug}/${f.rel}`));
    console.log(`\nNext: populate overview.md and notes.md, then run the pipeline or update index.md manually.`);
  }
}

main();
