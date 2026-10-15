"use strict";

// Shared claim-support primitives (PRD Fix #2, 2026-06-07).
// The deterministic core of the semantic gate: given a CLAIM and the text of
// its cited SOURCE, decide whether the source plausibly supports the claim.
// Pure + side-effect-free so it is fully unit-testable; the network fetch and
// the optional LLM adjudication live in scripts/claim-support-semantic.js.
//
// Also the single home for STOP_WORDS / extractSignificantTerms, which
// verify-citations.js imports (was a duplicated copy).

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
  "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can",
  "this", "that", "these", "those", "it", "its", "they", "them", "their", "we", "our",
  "you", "your", "he", "she", "his", "her", "i", "my", "me", "us", "not", "no", "nor",
  "as", "if", "then", "than", "so", "yet", "both", "either", "neither", "each", "few",
  "more", "most", "other", "some", "such", "only", "own", "same", "also", "just",
  "into", "through", "during", "before", "after", "above", "below", "between", "out",
  "up", "down", "about", "against", "per", "via",
]);

// Lowercased significant words (>= 4 chars, not stop words). Dedup so a claim
// that repeats a term doesn't inflate the denominator.
function extractSignificantTerms(text) {
  const seen = new Set();
  for (const w of String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)) {
    if (w.length >= 4 && !STOP_WORDS.has(w)) seen.add(w);
  }
  return [...seen];
}

// Cheap HTML/markdown -> text flattening for overlap counting.
function stripToText(raw) {
  return String(raw ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Default thresholds for the deterministic band split. The middle band
// (UNRELATED_RATIO <= r < SUPPORT_RATIO) is what the LLM judge adjudicates.
const SUPPORT_RATIO = 0.6;   // >= => SUPPORTED outright
const UNRELATED_RATIO = 0.3; // <  => UNRELATED outright
const MIN_TERMS = 3;         // fewer significant terms in the CLAIM => not mechanically checkable
// A would-be UNRELATED (the only *blocking* deterministic verdict) is trusted only
// when the SOURCE body carries at least this many distinct significant terms. A
// thinner body means we got no real content -- a redirect shell, a JS-app skeleton,
// or a bot-challenge page -- so we cannot honestly conclude "unrelated" and must not
// block on it. Such a source is reported UNCHECKABLE instead. (PRD Fix #2 Part 2,
// 2026-06-07: live keepachangelog.com returned a 1-char body -> false UNRELATED.)
const MIN_SOURCE_TERMS = 25;

/**
 * Deterministic verdict for a single claim against its source text.
 * @returns {{verdict: 'SUPPORTED'|'UNRELATED'|'AMBIGUOUS'|'UNCHECKABLE',
 *            ratio: number, terms: number, found: number}}
 *  - SUPPORTED   : strong lexical overlap; source covers the claim's terms
 *  - UNRELATED   : almost no overlap; the cited page is not about this claim
 *  - AMBIGUOUS   : middle band — needs LLM adjudication (or stays flagged)
 *  - UNCHECKABLE : claim too short to mechanically check (<3 significant terms)
 */
function classifyClaimSupport(claimText, sourceText, opts = {}) {
  const support = opts.supportRatio ?? SUPPORT_RATIO;
  const unrelated = opts.unrelatedRatio ?? UNRELATED_RATIO;
  const terms = extractSignificantTerms(claimText);
  if (terms.length < MIN_TERMS) {
    return { verdict: "UNCHECKABLE", ratio: 0, terms: terms.length, found: 0 };
  }
  const minSourceTerms = opts.minSourceTerms ?? MIN_SOURCE_TERMS;
  const body = stripToText(sourceText);
  const bodyTerms = extractSignificantTerms(body).length;
  const found = terms.filter((t) => body.includes(t)).length;
  const ratio = found / terms.length;
  let verdict;
  if (ratio >= support) {
    verdict = "SUPPORTED";
  } else if (ratio < unrelated) {
    // Only block on UNRELATED when the body is substantial enough to trust the
    // judgment; otherwise we got no real content and cannot conclude anything.
    verdict = bodyTerms >= minSourceTerms ? "UNRELATED" : "UNCHECKABLE";
  } else {
    verdict = "AMBIGUOUS";
  }
  return { verdict, ratio: Number(ratio.toFixed(3)), terms: terms.length, found, bodyTerms };
}

module.exports = {
  STOP_WORDS,
  extractSignificantTerms,
  stripToText,
  classifyClaimSupport,
  SUPPORT_RATIO,
  UNRELATED_RATIO,
  MIN_TERMS,
  MIN_SOURCE_TERMS,
};
