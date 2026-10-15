#!/usr/bin/env node
"use strict";

/**
 * claim-support-semantic.js — Semantic claim-support gate (PRD Fix #2 Part 2).
 *
 * For each `must_survive` finding in a topic's evidence.json, fetches the cited
 * source page(s) through the SSRF-guarded lib/safe-fetch path and classifies
 * whether the source actually supports the claim:
 *
 *   deterministic (lib/claim-support):
 *     SUPPORTED   — strong lexical overlap; source covers the claim
 *     UNRELATED   — almost no overlap; cited page is not about this claim   (BLOCKING)
 *     AMBIGUOUS   — middle band; escalate to an LLM judge
 *     UNCHECKABLE — claim too short, or no fetchable source URL              (non-blocking)
 *
 *   LLM judge (Gemini flash) for AMBIGUOUS only — opt-in, degrades gracefully:
 *     SUPPORTED      — passes
 *     CONTRADICTED   — source refutes the claim                             (BLOCKING)
 *     INCONCLUSIVE   — related but neither confirms nor refutes             (non-blocking)
 *
 * Degradation contract: if GEMINI_API_KEY is absent (or the LLM call fails),
 * AMBIGUOUS findings are reported as INCONCLUSIVE and the gate does NOT hard-fail.
 * Exit 1 happens ONLY when a must_survive finding is deterministically UNRELATED
 * or LLM-judged CONTRADICTED. Availability of a citation is a different problem
 * (verify-citations.js); this gate is about whether the page supports the claim.
 *
 * Usage:
 *   node scripts/claim-support-semantic.js --topic {slug} [--json]
 *   node scripts/claim-support-semantic.js --all [--json]
 *
 * Test seams (offline):
 *   CLAIM_SUPPORT_SOURCES  JSON map { "<url>": "<source text>" }. When set, NO
 *                          network is used — sources come from the map; a missing
 *                          url is treated as an unfetchable source.
 *   CLAIM_SUPPORT_LLM      JSON. Forces the LLM verdict without calling Gemini.
 *                          Either a bare string ("CONTRADICTED") applied to every
 *                          AMBIGUOUS finding, or an object keyed by finding id
 *                          (with optional "*" / "default" fallback).
 *
 * Exit codes: 0 = no blocking finding  |  1 = a must_survive finding is UNRELATED
 *             or CONTRADICTED  |  2 = usage / IO error.
 */

const fs = require("node:fs");
const path = require("node:path");

const { classifyClaimSupport } = require("./lib/claim-support");
const { requestGeminiJSON } = require("./lib/gemini-client");
const { fetchBody } = require("./lib/safe-fetch");
const { isValidTopicSlug, topicDir, evidencePathForTopic } = require("./lib/safe-paths");
const { listTopicSlugs } = require("./lib/topic-utils");

const { WORKSPACE_ROOT: ROOT } = require("./lib/workspace");
const TOPICS_DIR = process.env.BRAINSTORMING_TOPICS_DIR
  ? path.resolve(process.env.BRAINSTORMING_TOPICS_DIR)
  : path.join(ROOT, "topics");

const JUDGE_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_JUDGE_CHARS = 8000;

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(`claim-support-semantic.js — semantic claim-support gate (PRD Fix #2)

Usage:
  node scripts/claim-support-semantic.js --topic {slug} [--json]
  node scripts/claim-support-semantic.js --all [--json]

Fetches cited sources for each must_survive finding and checks whether the page
supports the claim. Exit 1 only on UNRELATED (deterministic) or CONTRADICTED (LLM)
for a must_survive finding. AMBIGUOUS findings need a Gemini flash judge; without
GEMINI_API_KEY they are reported INCONCLUSIVE and do NOT fail the gate.`);
  process.exit(0);
}

const allMode = args.includes("--all");
const jsonMode = args.includes("--json");
const topicArg = args.includes("--topic") ? args[args.indexOf("--topic") + 1] : null;

if (!allMode && !topicArg) {
  console.error("Error: provide --topic {slug} or --all");
  process.exit(2);
}
if (topicArg !== null && !isValidTopicSlug(topicArg)) {
  console.error(`Error: invalid topic slug "${topicArg}" — slugs must be lowercase alphanumeric and hyphens only`);
  process.exit(2);
}

// ── Source acquisition (injectable for offline tests) ───────────────────────────

let injectedSources = null;
if (process.env.CLAIM_SUPPORT_SOURCES) {
  try {
    injectedSources = JSON.parse(process.env.CLAIM_SUPPORT_SOURCES);
  } catch (err) {
    console.error(`Error: CLAIM_SUPPORT_SOURCES is not valid JSON: ${err.message}`);
    process.exit(2);
  }
}

async function getSourceText(url) {
  if (injectedSources) {
    return Object.prototype.hasOwnProperty.call(injectedSources, url)
      ? { text: String(injectedSources[url]) }
      : { error: "no-injected-source" };
  }
  return fetchBody(url);
}

// ── LLM judge (injectable; degrades to INCONCLUSIVE) ────────────────────────────

let injectedLlm = null;
let injectedLlmIsString = false;
if (process.env.CLAIM_SUPPORT_LLM) {
  try {
    injectedLlm = JSON.parse(process.env.CLAIM_SUPPORT_LLM);
    injectedLlmIsString = typeof injectedLlm === "string";
  } catch {
    // Treat a bare unquoted token as a single forced verdict.
    injectedLlm = process.env.CLAIM_SUPPORT_LLM.trim();
    injectedLlmIsString = true;
  }
}

function injectedVerdictFor(findingId) {
  if (injectedLlm == null) return null;
  if (injectedLlmIsString) return normalizeJudgeVerdict(injectedLlm);
  const v = injectedLlm[findingId] ?? injectedLlm["*"] ?? injectedLlm.default;
  return v ? normalizeJudgeVerdict(v) : null;
}

function normalizeJudgeVerdict(raw) {
  const v = String(raw || "").toUpperCase();
  if (v === "SUPPORTED" || v === "CONTRADICTED" || v === "INCONCLUSIVE") return v;
  return "INCONCLUSIVE";
}

// The optional LLM judge arms only when GEMINI_API_KEY is set in the environment.
let geminiState = null; // { available, apiKey, requestGeminiJSON }
function geminiJudgeAvailable() {
  if (geminiState) return geminiState.available;
  if (injectedLlm != null) {
    geminiState = { available: true, injected: true };
    return true;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  geminiState = apiKey
    ? { available: true, apiKey, requestGeminiJSON }
    : { available: false };
  return geminiState.available;
}

async function judgeWithLlm(finding, claim, sourceText) {
  // Offline injection wins.
  const injected = injectedVerdictFor(finding.id);
  if (injected) return { verdict: injected, source: "injected" };

  if (!geminiJudgeAvailable() || !geminiState.apiKey) {
    return { verdict: "INCONCLUSIVE", source: "no-llm" };
  }

  const prompt = [
    "You are verifying whether a cited SOURCE supports a research CLAIM.",
    'Respond ONLY with JSON: {"verdict": "SUPPORTED"|"CONTRADICTED"|"INCONCLUSIVE", "reason": "<one sentence>"}.',
    "SUPPORTED = the source substantiates the claim.",
    "CONTRADICTED = the source asserts the opposite or refutes the claim.",
    "INCONCLUSIVE = the source is related but does not clearly confirm or refute the claim.",
    "",
    `CLAIM: ${claim}`,
    "",
    `SOURCE (truncated):\n${String(sourceText).slice(0, MAX_JUDGE_CHARS)}`,
  ].join("\n");

  try {
    const resp = await geminiState.requestGeminiJSON({
      model: JUDGE_MODEL,
      apiKey: geminiState.apiKey,
      scriptName: "claim-support-semantic",
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      },
    });
    const parts = resp?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text).filter(Boolean).join("\n");
    const parsed = JSON.parse(text);
    return { verdict: normalizeJudgeVerdict(parsed.verdict), reason: parsed.reason, source: "gemini" };
  } catch (err) {
    // Any LLM failure degrades to INCONCLUSIVE — never hard-fail on the judge.
    return { verdict: "INCONCLUSIVE", source: "llm-error", error: err.message };
  }
}

// ── Finding helpers ─────────────────────────────────────────────────────────────

function claimTextOf(finding) {
  return String(finding.claim || finding.summary || finding.title || "").trim();
}

function sourceUrlsOf(finding) {
  const sources = Array.isArray(finding.sources) ? finding.sources : [];
  return sources.filter(s => typeof s === "string" && /^https?:\/\//i.test(s.trim())).map(s => s.trim());
}

// Aggregate per-source deterministic verdicts into one finding verdict.
function aggregateDeterministic(perSource) {
  const verdicts = perSource.map(s => s.verdict);
  if (verdicts.includes("SUPPORTED")) return "SUPPORTED";
  if (verdicts.includes("AMBIGUOUS")) return "AMBIGUOUS";
  if (verdicts.includes("UNRELATED")) return "UNRELATED";
  return "UNCHECKABLE";
}

// ── Topic processing ────────────────────────────────────────────────────────────

async function processTopic(slug) {
  const dir = topicDir(TOPICS_DIR, slug);
  const evidencePath = evidencePathForTopic(dir);
  if (!fs.existsSync(evidencePath)) {
    return { topic_slug: slug, evidence_present: false, must_survive_total: 0, findings: [], summary: emptySummary() };
  }

  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  } catch (err) {
    return { topic_slug: slug, evidence_present: true, parse_error: err.message, must_survive_total: 0, findings: [], summary: emptySummary() };
  }

  const findings = (Array.isArray(evidence.findings) ? evidence.findings : []).filter(f => f.must_survive === true);
  const reportFindings = [];

  for (const finding of findings) {
    const claim = claimTextOf(finding);
    const urls = sourceUrlsOf(finding);
    const perSource = [];

    for (const url of urls) {
      const fetched = await getSourceText(url);
      if (fetched.error) {
        perSource.push({ url, verdict: "UNCHECKABLE", error: fetched.error });
        continue;
      }
      const c = classifyClaimSupport(claim, fetched.text);
      perSource.push({ url, verdict: c.verdict, ratio: c.ratio, terms: c.terms, found: c.found, body_terms: c.bodyTerms, text: fetched.text });
    }

    let deterministic = urls.length === 0 ? "UNCHECKABLE" : aggregateDeterministic(perSource);
    let finalVerdict = deterministic;
    let llm = null;

    if (deterministic === "AMBIGUOUS") {
      const ambiguousText = perSource.filter(s => s.verdict === "AMBIGUOUS" && s.text).map(s => s.text).join("\n\n");
      llm = await judgeWithLlm(finding, claim, ambiguousText);
      finalVerdict = llm.verdict; // SUPPORTED | CONTRADICTED | INCONCLUSIVE
    }

    const blocking = finalVerdict === "UNRELATED" || finalVerdict === "CONTRADICTED";
    reportFindings.push({
      id: finding.id,
      claim,
      must_survive: true,
      source_urls: urls,
      sources_checked: perSource.map(({ text, ...rest }) => rest), // drop raw body from report
      deterministic_verdict: deterministic,
      llm_verdict: llm ? llm.verdict : null,
      llm_source: llm ? llm.source : null,
      final_verdict: finalVerdict,
      blocking,
    });
  }

  return {
    topic_slug: slug,
    evidence_present: true,
    gemini_available: injectedLlm != null ? "injected" : geminiJudgeAvailable(),
    injected_sources: injectedSources != null,
    must_survive_total: findings.length,
    findings: reportFindings,
    summary: summarize(reportFindings),
  };
}

function emptySummary() {
  return { supported: 0, unrelated: 0, ambiguous: 0, uncheckable: 0, inconclusive: 0, contradicted: 0, blocking: 0 };
}

function summarize(findings) {
  const s = emptySummary();
  for (const f of findings) {
    switch (f.final_verdict) {
      case "SUPPORTED": s.supported += 1; break;
      case "UNRELATED": s.unrelated += 1; break;
      case "AMBIGUOUS": s.ambiguous += 1; break;
      case "UNCHECKABLE": s.uncheckable += 1; break;
      case "INCONCLUSIVE": s.inconclusive += 1; break;
      case "CONTRADICTED": s.contradicted += 1; break;
      default: break;
    }
    if (f.blocking) s.blocking += 1;
  }
  return s;
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const slugs = allMode ? listTopicSlugs(TOPICS_DIR) : [topicArg];
  const reports = [];
  let blocking = 0;

  for (const slug of slugs) {
    const report = await processTopic(slug);
    reports.push(report);
    blocking += report.summary.blocking;

    // Persist per-topic report alongside the other _pipeline artifacts.
    if (report.evidence_present) {
      try {
        const pipelineDir = path.dirname(evidencePathForTopic(topicDir(TOPICS_DIR, slug)));
        fs.mkdirSync(pipelineDir, { recursive: true });
        fs.writeFileSync(
          path.join(pipelineDir, "claim-support-report.json"),
          `${JSON.stringify(report, null, 2)}\n`,
          "utf8",
        );
      } catch (err) {
        console.error(`Warning: could not write claim-support-report.json for ${slug}: ${err.message}`);
      }
    }
  }

  const summary = {
    topics_checked: reports.length,
    must_survive_total: reports.reduce((n, r) => n + r.must_survive_total, 0),
    blocking,
    by_topic: reports.map(r => ({ topic_slug: r.topic_slug, ...r.summary })),
  };

  if (jsonMode) {
    console.log(JSON.stringify({ summary, topics: reports }, null, 2));
  } else {
    console.log(`# Semantic Claim-Support Gate`);
    console.log(`Topics: ${summary.topics_checked} | must_survive findings: ${summary.must_survive_total} | BLOCKING: ${blocking}`);
    for (const r of reports) {
      if (!r.evidence_present || r.must_survive_total === 0) continue;
      const s = r.summary;
      console.log(`\n[${r.topic_slug}] supported:${s.supported} unrelated:${s.unrelated} inconclusive:${s.inconclusive} contradicted:${s.contradicted} uncheckable:${s.uncheckable}`);
      for (const f of r.findings.filter(x => x.blocking)) {
        console.log(`  BLOCKING ${f.final_verdict} ${f.id}: ${f.claim.slice(0, 100)}`);
      }
    }
    if (blocking === 0) console.log(`\nNo blocking findings.`);
  }

  process.exit(blocking > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(2);
});
