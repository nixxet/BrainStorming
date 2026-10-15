"use strict";

// Shared SSRF-guarded network primitives (PRD Fix #2 Part 2, 2026-06-07).
// Extracted verbatim from verify-citations.js so the semantic claim-support gate
// (scripts/claim-support-semantic.js) fetches source pages through the SAME
// hardened path instead of a second, drift-prone copy.
//
// Security-critical: assertSafeUrl blocks private/loopback/link-local targets at
// BOTH the literal-IP and post-DNS layers, and fetchBody re-checks every redirect
// hop (H8 fix, 2026-06-06) so a public URL cannot 30x-redirect into the metadata
// endpoint or localhost. Keep these guards intact when editing.

const https = require("node:https");
const http = require("node:http");
const dns = require("node:dns").promises;
const net = require("node:net");

const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 51200; // 50KB — enough to find claim terms in typical abstracts/intros
const PRIVATE_HOST_PATTERNS = /(^|\.)localhost$|(^|\.)local$|(^|\.)internal$/i;

function isPrivateIPv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(address) {
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd");
}

async function assertSafeUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, status: "UNKNOWN_ERROR", note: "invalid url" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { safe: false, status: "BLOCKED_UNSUPPORTED_PROTOCOL", note: `unsupported protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.test(hostname)) {
    return { safe: false, status: "BLOCKED_PRIVATE_NETWORK", note: `blocked hostname: ${hostname}` };
  }

  const literalVersion = net.isIP(hostname);
  if (literalVersion === 4 && isPrivateIPv4(hostname)) {
    return { safe: false, status: "BLOCKED_PRIVATE_NETWORK", note: `blocked private IPv4: ${hostname}` };
  }
  if (literalVersion === 6 && isPrivateIPv6(hostname)) {
    return { safe: false, status: "BLOCKED_PRIVATE_NETWORK", note: `blocked private IPv6: ${hostname}` };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return { safe: false, status: "BLOCKED_PRIVATE_NETWORK", note: `DNS resolved to private IPv4: ${record.address}` };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return { safe: false, status: "BLOCKED_PRIVATE_NETWORK", note: `DNS resolved to private IPv6: ${record.address}` };
      }
    }
  } catch (err) {
    return { safe: false, status: "DNS_ERROR", note: err.code || err.message };
  }

  return { safe: true };
}

/**
 * Fetch up to MAX_BODY_BYTES of a URL's response body.
 * Returns { text: string } or { error: string }.
 *
 * H8 (2026-06-06): re-checks each redirect hop with assertSafeUrl and caps
 * redirect depth, so a public URL cannot 30x-redirect to localhost/169.254.169.254
 * (SSRF) and a redirect loop cannot hang unbounded.
 */
async function fetchBody(url, redirectCount = 0) {
  const safety = await assertSafeUrl(url);
  if (!safety.safe) return { error: safety.status };
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); } catch { return resolve({ error: "invalid-url" }); }
    const lib = parsed.protocol === "https:" ? https : http;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: { "User-Agent": "BrainStorming-CitationChecker/1.0", "Accept": "text/html,text/plain,*/*" },
      timeout: TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      // Follow one redirect level (re-validated by the recursive call above).
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirectCount >= MAX_REDIRECTS) {
          return resolve({ error: "redirect-blocked" });
        }
        const next = new URL(res.headers.location, url).toString();
        return fetchBody(next, redirectCount + 1).then(resolve);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return resolve({ error: `http-${res.statusCode}` });
      }

      const chunks = [];
      let total = 0;
      let settled = false;
      const finishText = () => {
        if (settled) return;
        settled = true;
        resolve({ text: Buffer.concat(chunks).toString("utf8", 0, MAX_BODY_BYTES) });
      };
      res.on("data", (chunk) => {
        total += chunk.length;
        chunks.push(chunk);
        // Cap reached: stop downloading and return the truncated body. Previously
        // this called req.destroy(), which raced an "aborted" error event and lost
        // the body entirely (PRD Fix #2 Part 2, 2026-06-07) — large real pages
        // (e.g. GitHub docs) never got checked. Resolve with what we have instead.
        if (total >= MAX_BODY_BYTES) {
          finishText();
          res.destroy();
        }
      });
      res.on("end", finishText);
      res.on("error", (e) => { if (!settled) { settled = true; resolve({ error: e.message }); } });
    });

    req.on("timeout", () => { req.destroy(); resolve({ error: "timeout" }); });
    req.on("error", (e) => resolve({ error: e.message }));
    req.end();
  });
}

module.exports = {
  TIMEOUT_MS,
  MAX_REDIRECTS,
  MAX_BODY_BYTES,
  PRIVATE_HOST_PATTERNS,
  isPrivateIPv4,
  isPrivateIPv6,
  assertSafeUrl,
  fetchBody,
};
