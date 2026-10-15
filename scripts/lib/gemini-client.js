"use strict";

/**
 * Minimal Gemini generateContent client (no dependencies, Node >= 22).
 *
 * Used only by the optional semantic claim-support judge. The judge is off
 * unless GEMINI_API_KEY is set in the environment; callers treat any error
 * thrown here as an INCONCLUSIVE verdict, never as a gate failure.
 *
 * Retries 429 / 5xx responses and network errors with exponential backoff
 * (honoring Retry-After when the server sends it).
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) > 0
  ? Number(process.env.GEMINI_TIMEOUT_MS)
  : 60_000;

function backoffMs(attempt, retryAfterHeader) {
  const retryAfterSec = Number.parseInt(retryAfterHeader, 10);
  if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) return Math.min(retryAfterSec * 1000, 60_000);
  return Math.min(30_000, 2 ** attempt * 1000) + Math.random() * 500;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST a generateContent request and return the parsed JSON response.
 * @param {object} args
 * @param {string} args.model      Gemini model id, e.g. "gemini-3.8-flash"
 * @param {object} args.body       generateContent request body
 * @param {string} args.apiKey     GEMINI_API_KEY
 * @param {number} [args.timeoutMs]
 * @param {number} [args.maxAttempts=3]
 * @param {Function} [args.fetchImpl=globalThis.fetch]  injectable for tests
 * @param {Function} [args.sleepImpl]                   injectable for tests
 */
async function requestGeminiJSON({
  model,
  body,
  apiKey,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = 3,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
}) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!model) throw new Error("model is required");

  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const isLast = attempt === maxAttempts - 1;
    let res;
    try {
      res = await fetchImpl(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastError = err;
      if (isLast) break;
      await sleepImpl(backoffMs(attempt));
      continue;
    }

    if (RETRYABLE_STATUS.has(res.status) && !isLast) {
      lastError = new Error(`Gemini HTTP ${res.status}`);
      await sleepImpl(backoffMs(attempt, res.headers.get("retry-after")));
      continue;
    }

    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Gemini HTTP ${res.status}: response was not JSON (${err.message})`);
    }
    if (!res.ok || parsed.error) {
      throw new Error(`Gemini HTTP ${res.status}: ${parsed.error?.message || "request failed"}`);
    }
    return parsed;
  }
  throw lastError || new Error("Gemini request failed");
}

module.exports = { requestGeminiJSON, backoffMs };
