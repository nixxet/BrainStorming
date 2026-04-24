#!/usr/bin/env node
/*
---
title: Pipeline State Auditor and Repair Tool
created: 2026-04-16
purpose: Audit each topic's _pipeline/state.json against on-disk revision drafts, scorecards, security reviews, and stress tests, and optionally apply safe metadata repairs.
---
*/

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "topics");

function parseArgs(argv) {
  const args = {
    topic: null,
    write: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--topic") {
      args.topic = argv[i + 1];
      i += 1;
    } else if (arg === "--write") {
      args.write = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/validate-pipeline-state.js [--topic <slug>] [--write] [--json]

Options:
  --topic <slug>   Validate a single topic under topics/<slug>/
  --write          Apply safe state.json corrections
  --json           Output JSON summary
`);
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJsonIfExists(filePath) {
  const raw = readIfExists(filePath);
  if (raw == null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { __parseError: error.message, __raw: raw };
  }
}

function ensureObject(target, key, fallback = {}) {
  if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
    target[key] = fallback;
  }
  return target[key];
}

function extractFirstNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  return null;
}

function extractVerdict(text) {
  const patterns = [
    /<verdict>(PASS|REVISE|REWRITE|FLAG|BLOCK|CONDITIONAL|FAIL)<\/verdict>/i,
    /^\*\*Verdict:\*\*\s*\**(PASS|REVISE|REWRITE|FLAG|BLOCK|CONDITIONAL|FAIL)\**/im,
    /^## Verdict:\s*\**(PASS|REVISE|REWRITE|FLAG|BLOCK|CONDITIONAL|FAIL)\**/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

function verdictMatches(existingValue, expectedVerdict) {
  if (!expectedVerdict) {
    return true;
  }
  if (existingValue == null) {
    return false;
  }
  const existing = String(existingValue).toUpperCase();
  const expected = String(expectedVerdict).toUpperCase();

  if (existing === expected) {
    return true;
  }
  if (existing.startsWith(`${expected} `) || existing.startsWith(`${expected}—`) || existing.startsWith(`${expected} -`)) {
    return true;
  }
  if (existing.includes(expected)) {
    return true;
  }
  if (expected === "FLAG" && existing.includes("FLAG_RESOLVED")) {
    return true;
  }
  return false;
}

function extractRequiredChangeCount(text) {
  const sectionMatch = text.match(/## Required Report Changes([\s\S]*)$/m);
  if (!sectionMatch) {
    return 0;
  }
  const lines = sectionMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.filter((line) => /^\|\s*\d+\s*\|/.test(line)).length;
}

function extractDraftRevisionNumbers(fileNames) {
  const revisions = [];
  for (const fileName of fileNames) {
    const match = fileName.match(/^draft-rev(\d+)-(overview|notes|verdict)\.md$/);
    if (match) {
      revisions.push(Number(match[1]));
    }
  }
  return revisions;
}

function extractSummaryCounts(text) {
  return {
    criticalFailures: extractFirstNumber(text, [
      /\*\*Critical Failures:\*\*\s*(\d+)/i,
      /<critical_failures>(\d+)<\/critical_failures>/i,
    ]),
    highSeverity: extractFirstNumber(text, [
      /\*\*High Severity:\*\*\s*(\d+)/i,
      /\*\*High Severity:\*\*\s*(\d+)/i,
      /<high_severity>(\d+)<\/high_severity>/i,
    ]),
    mediumSeverity: extractFirstNumber(text, [
      /\*\*Medium Severity:\*\*\s*(\d+)/i,
      /<medium_severity>(\d+)<\/medium_severity>/i,
    ]),
    lowSeverity: extractFirstNumber(text, [
      /\*\*Low Severity:\*\*\s*(\d+)/i,
      /<low_severity>(\d+)<\/low_severity>/i,
    ]),
  };
}

function extractEvidenceMetrics(evidence) {
  if (!evidence || evidence.__parseError) {
    return {};
  }
  const confidenceDistribution = evidence.confidence_distribution || {};
  const metrics = evidence.metrics || {};
  const findings = Array.isArray(evidence.findings) ? evidence.findings : [];
  const uniqueDomains = new Set();

  for (const finding of findings) {
    if (Array.isArray(finding.sources)) {
      for (const source of finding.sources) {
        if (typeof source === "string") {
          try {
            uniqueDomains.add(new URL(source).hostname.replace(/^www\./, "").toLowerCase());
          } catch (_error) {
            // Ignore malformed URL strings in legacy files.
          }
        } else if (source && typeof source.url === "string") {
          try {
            uniqueDomains.add(new URL(source.url).hostname.replace(/^www\./, "").toLowerCase());
          } catch (_error) {
            // Ignore malformed URL strings in legacy files.
          }
        }
      }
    }
  }

  return {
    sourceCount: findings.reduce((sum, finding) => {
      if (typeof finding.source_count === "number") {
        return sum + finding.source_count;
      }
      return sum;
    }, 0) || null,
    sourceDomainCount: uniqueDomains.size || null,
    contradictionCount: typeof metrics.contradiction_count === "number" ? metrics.contradiction_count : null,
    criticalGapCount: typeof metrics.critical_gap_count === "number" ? metrics.critical_gap_count : null,
    significantGapCount: typeof metrics.significant_gap_count === "number" ? metrics.significant_gap_count : null,
    minorGapCount: typeof metrics.minor_gap_count === "number" ? metrics.minor_gap_count : null,
    mustSurviveCaveatCount:
      typeof metrics.must_survive_count === "number"
        ? metrics.must_survive_count
        : Array.isArray(evidence.must_carry_caveats)
          ? evidence.must_carry_caveats.length
          : null,
    confidenceDistribution,
  };
}

function validateTopic(topicDir, options) {
  const slug = path.basename(topicDir);
  const pipelineDir = path.join(topicDir, "_pipeline");
  const statePath = path.join(pipelineDir, "state.json");

  const result = {
    slug,
    statePath,
    exists: fs.existsSync(pipelineDir),
    issues: [],
    appliedFixes: [],
    warnings: [],
  };

  if (!result.exists) {
    result.warnings.push("No _pipeline directory found.");
    return result;
  }

  const fileNames = fs.readdirSync(pipelineDir);
  const state = parseJsonIfExists(statePath);
  if (!state) {
    result.issues.push("Missing state.json");
    return result;
  }
  if (state.__parseError) {
    result.issues.push(`Unreadable state.json: ${state.__parseError}`);
    return result;
  }

  ensureObject(state, "phases", {});
  ensureObject(state, "run_metrics", {});
  if (!Array.isArray(state.errors)) {
    state.errors = [];
  }

  const revisions = extractDraftRevisionNumbers(fileNames);
  const maxRevision = revisions.length > 0 ? Math.max(...revisions) : 0;
  const phase4 = ensureObject(state.phases, "phase_4", {});
  const phase5 = ensureObject(state.phases, "phase_5", {});
  const phase6 = ensureObject(state.phases, "phase_6", {});

  if ((phase4.revision_count || 0) < maxRevision) {
    result.issues.push(
      `phase_4.revision_count (${phase4.revision_count || 0}) is lower than highest draft revision (${maxRevision}).`
    );
    if (options.write) {
      phase4.revision_count = maxRevision;
      result.appliedFixes.push(`Set phase_4.revision_count=${maxRevision}`);
    }
  }

  const scorecardText = readIfExists(path.join(pipelineDir, "scorecard.md"));
  if (scorecardText) {
    const weightedTotal = extractFirstNumber(scorecardText, [
      /<weighted_total>([0-9]+(?:\.[0-9]+)?)<\/weighted_total>/i,
      /\*\*Weighted Total:\*\*\s*([0-9]+(?:\.[0-9]+)?)/i,
      /^weighted_total:\s*([0-9]+(?:\.[0-9]+)?)/im,
    ]);
    const verdict = extractVerdict(scorecardText);
    const reviewIncorporationScore = extractFirstNumber(scorecardText, [
      /review_incorporation_score="([0-9]+(?:\.[0-9]+)?)"/i,
      /\*\*Review incorporation score:\*\*\s*([0-9]+(?:\.[0-9]+)?)/i,
    ]);

    if (phase4.status !== "completed") {
      result.issues.push(`phase_4.status is "${phase4.status || "missing"}" but scorecard.md exists.`);
      if (options.write) {
        phase4.status = "completed";
        result.appliedFixes.push('Set phase_4.status="completed"');
      }
    }
    if (weightedTotal != null && phase4.final_score !== weightedTotal) {
      result.issues.push(
        `phase_4.final_score (${phase4.final_score ?? "missing"}) does not match scorecard (${weightedTotal}).`
      );
      if (options.write) {
        phase4.final_score = weightedTotal;
        state.run_metrics.final_score = weightedTotal;
        if (state.run_metrics.first_score == null || state.run_metrics.first_score === 0) {
          state.run_metrics.first_score = weightedTotal;
        }
        result.appliedFixes.push(`Set phase_4.final_score=${weightedTotal}`);
      }
    }
    if (!verdictMatches(phase4.verdict, verdict)) {
      result.issues.push(`phase_4.verdict (${phase4.verdict ?? "missing"}) does not match scorecard (${verdict}).`);
      if (options.write) {
        phase4.verdict = verdict;
        result.appliedFixes.push(`Set phase_4.verdict=${verdict}`);
      }
    }
    if (reviewIncorporationScore != null && state.run_metrics.review_incorporation_score !== reviewIncorporationScore) {
      result.issues.push(
        `run_metrics.review_incorporation_score (${state.run_metrics.review_incorporation_score ?? "missing"}) does not match scorecard (${reviewIncorporationScore}).`
      );
      if (options.write) {
        state.run_metrics.review_incorporation_score = reviewIncorporationScore;
        result.appliedFixes.push(`Set run_metrics.review_incorporation_score=${reviewIncorporationScore}`);
      }
    }
  }

  const securityReviewText = readIfExists(path.join(pipelineDir, "security-review.md"));
  if (securityReviewText) {
    const verdict = extractVerdict(securityReviewText);
    const requiredChangeCount = extractRequiredChangeCount(securityReviewText);
    if (phase5.status !== "completed" && phase5.status !== "failed") {
      result.issues.push(`phase_5.status is "${phase5.status || "missing"}" but security-review.md exists.`);
      if (options.write) {
        phase5.status = verdict === "BLOCK" ? "failed" : "completed";
        result.appliedFixes.push(`Set phase_5.status=${phase5.status}`);
      }
    }
    if (!verdictMatches(phase5.verdict, verdict)) {
      result.issues.push(`phase_5.verdict (${phase5.verdict ?? "missing"}) does not match security review (${verdict}).`);
      if (options.write) {
        phase5.verdict = verdict;
        result.appliedFixes.push(`Set phase_5.verdict=${verdict}`);
      }
    }
    if ((state.run_metrics.security_required_change_count || 0) !== requiredChangeCount) {
      result.issues.push(
        `run_metrics.security_required_change_count (${state.run_metrics.security_required_change_count || 0}) does not match security review (${requiredChangeCount}).`
      );
      if (options.write) {
        state.run_metrics.security_required_change_count = requiredChangeCount;
        phase5.security_required_change_count = requiredChangeCount;
        result.appliedFixes.push(`Set run_metrics.security_required_change_count=${requiredChangeCount}`);
      }
    }
  }

  const stressTestText = readIfExists(path.join(pipelineDir, "stress-test.md"));
  if (stressTestText) {
    const verdict = extractVerdict(stressTestText);
    const requiredChangeCount = extractRequiredChangeCount(stressTestText);
    const counts = extractSummaryCounts(stressTestText);
    if (phase6.status !== "completed" && phase6.status !== "failed") {
      result.issues.push(`phase_6.status is "${phase6.status || "missing"}" but stress-test.md exists.`);
      if (options.write) {
        phase6.status = verdict === "FAIL" ? "failed" : "completed";
        result.appliedFixes.push(`Set phase_6.status=${phase6.status}`);
      }
    }
    if (!verdictMatches(phase6.verdict, verdict)) {
      result.issues.push(`phase_6.verdict (${phase6.verdict ?? "missing"}) does not match stress test (${verdict}).`);
      if (options.write) {
        phase6.verdict = verdict;
        result.appliedFixes.push(`Set phase_6.verdict=${verdict}`);
      }
    }
    const metricMap = [
      ["critical_failures", counts.criticalFailures],
      ["high_severity_findings", counts.highSeverity],
      ["medium_severity_findings", counts.mediumSeverity],
      ["low_severity_findings", counts.lowSeverity],
      ["tester_required_change_count", requiredChangeCount],
    ];
    for (const [key, value] of metricMap) {
      if (value == null) {
        continue;
      }
      if (state.run_metrics[key] !== value) {
        result.issues.push(`run_metrics.${key} (${state.run_metrics[key] ?? "missing"}) does not match stress test (${value}).`);
        if (options.write) {
          state.run_metrics[key] = value;
          phase6[key] = value;
          result.appliedFixes.push(`Set run_metrics.${key}=${value}`);
        }
      }
    }
  }

  const evidence = parseJsonIfExists(path.join(pipelineDir, "evidence.json"));
  if (evidence && !evidence.__parseError) {
    const evidenceMetrics = extractEvidenceMetrics(evidence);
    const pairs = [
      ["source_count", evidenceMetrics.sourceCount],
      ["source_domain_count", evidenceMetrics.sourceDomainCount],
      ["contradiction_count", evidenceMetrics.contradictionCount],
      ["critical_gap_count", evidenceMetrics.criticalGapCount],
      ["significant_gap_count", evidenceMetrics.significantGapCount],
      ["minor_gap_count", evidenceMetrics.minorGapCount],
      ["must_survive_caveat_count", evidenceMetrics.mustSurviveCaveatCount],
    ];
    for (const [key, value] of pairs) {
      if (value == null) {
        continue;
      }
      if (state.run_metrics[key] !== value) {
        result.issues.push(`run_metrics.${key} (${state.run_metrics[key] ?? "missing"}) does not match evidence.json (${value}).`);
        if (options.write) {
          state.run_metrics[key] = value;
          result.appliedFixes.push(`Set run_metrics.${key}=${value}`);
        }
      }
    }
  }

  if (fileNames.includes("overview.md") || fileNames.includes("notes.md") || fileNames.includes("verdict.md")) {
    for (let phaseNumber = 0; phaseNumber <= 6; phaseNumber += 1) {
      const phaseKey = `phase_${phaseNumber}`;
      const phase = ensureObject(state.phases, phaseKey, {});
      if (!phase.status || phase.status === "pending") {
        result.issues.push(`${phaseKey}.status is "${phase.status || "missing"}" despite published/final artifacts existing.`);
        if (options.write) {
          phase.status = "completed";
          phase.note = "state retroactively corrected by validate-pipeline-state.js";
          result.appliedFixes.push(`Set ${phaseKey}.status="completed"`);
        }
      }
    }
  }

  if (options.write && result.appliedFixes.length > 0) {
    const stamp = new Date().toISOString().slice(0, 10);
    state.last_validated_on = stamp;
    state.last_validated_by = "scripts/validate-pipeline-state.js";
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  }

  return result;
}

function getTopicDirs(topicArg) {
  if (topicArg) {
    const singleTopic = path.join(topicsRoot, topicArg);
    if (!fs.existsSync(singleTopic) || !fs.statSync(singleTopic).isDirectory()) {
      throw new Error(`Topic not found: ${topicArg}`);
    }
    return [singleTopic];
  }

  return fs
    .readdirSync(topicsRoot)
    .map((entry) => path.join(topicsRoot, entry))
    .filter((entryPath) => fs.statSync(entryPath).isDirectory())
    .filter((entryPath) => path.basename(entryPath) !== "_tmp");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const topicDirs = getTopicDirs(options.topic);
  const results = topicDirs.map((topicDir) => validateTopic(topicDir, options));

  const summary = {
    topicsChecked: results.length,
    topicsWithIssues: results.filter((result) => result.issues.length > 0).length,
    topicsUpdated: results.filter((result) => result.appliedFixes.length > 0).length,
    results,
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Checked ${summary.topicsChecked} topic pipeline states.`);
  console.log(`Topics with issues: ${summary.topicsWithIssues}`);
  console.log(`Topics updated: ${summary.topicsUpdated}`);

  for (const result of results) {
    if (result.issues.length === 0 && result.appliedFixes.length === 0) {
      continue;
    }
    console.log(`\n[${result.slug}]`);
    for (const issue of result.issues) {
      console.log(`- ISSUE: ${issue}`);
    }
    for (const fix of result.appliedFixes) {
      console.log(`- FIXED: ${fix}`);
    }
    for (const warning of result.warnings) {
      console.log(`- WARNING: ${warning}`);
    }
  }
}

main();
