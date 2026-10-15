"use strict";

// Shared staleness/decay constants — single source of truth for
// check-staleness.js (overdue detection) and any consumer that stamps
// revalidation dates, so the thresholds cannot drift.

// Decay thresholds (days) per confidence_decay class.
const DECAY_THRESHOLD_DAYS = {
  volatile: 90,
  fast: 180,
  slow: 540,    // 18 months
  stable: 1825  // 5 years
};

// "Approaching threshold" warning bands (days before threshold).
const APPROACHING_BAND_DAYS = {
  volatile: 14,
  fast: 21,
  slow: 45,
  stable: 90
};

function normalizeDecayClass(value, fallback = "slow") {
  if (typeof value !== "string") return fallback;
  const direct = value.toLowerCase().trim();
  if (DECAY_THRESHOLD_DAYS[direct]) return direct;
  for (const key of Object.keys(DECAY_THRESHOLD_DAYS)) {
    if (direct.includes(key)) return key;
  }
  return fallback;
}

// The decay class that governs a topic's revalidation date: the fastest decay
// among material findings (staleness_summary.fastest_material_decay when the
// Analyzer recorded it, else the fastest per-finding class, else fallback).
function topicDecayClass(evidence, fallback = "slow") {
  if (!evidence || typeof evidence !== "object") return fallback;
  const summary = evidence.staleness_summary;
  if (summary && summary.fastest_material_decay) {
    return normalizeDecayClass(summary.fastest_material_decay, fallback);
  }
  const findings = Array.isArray(evidence.findings) ? evidence.findings : [];
  let fastest = null;
  for (const f of findings) {
    const cls = normalizeDecayClass(f && f.confidence_decay, fallback);
    if (fastest === null || DECAY_THRESHOLD_DAYS[cls] < DECAY_THRESHOLD_DAYS[fastest]) {
      fastest = cls;
    }
  }
  return fastest || fallback;
}

function addDaysIso(isoDate, days) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  DECAY_THRESHOLD_DAYS,
  APPROACHING_BAND_DAYS,
  normalizeDecayClass,
  topicDecayClass,
  addDaysIso,
};
