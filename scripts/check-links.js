#!/usr/bin/env node
"use strict";

/**
 * check-links.js — fast anti-ghost-link gate for FAST-mode research.
 *
 * Verifies that each cited URL actually resolves (HEAD, then GET fallback),
 * through the SSRF-guarded assertSafeUrl from lib/safe-fetch. Prints one line
 * per URL and exits 1 if ANY URL fails to resolve (non-2xx/3xx, DNS/TLS error,
 * blocked, or timeout) — so the fast research path can drop or flag dead links
 * before presenting them, with zero LLM cost.
 *
 * Usage:
 *   node scripts/check-links.js <url> [url2 ...]
 *   node scripts/check-links.js --json <url> ...
 *   printf '%s\n' url1 url2 | node scripts/check-links.js --stdin
 *
 * Exit: 0 = all resolve | 1 = >=1 failed | 2 = usage error.
 */

const https = require("node:https");
const http = require("node:http");
const { assertSafeUrl } = require("./lib/safe-fetch");

const TIMEOUT_MS = 9000;
const MAX_REDIRECTS = 4;
const UA = "Mozilla/5.0 (BrainStorming-LinkCheck)";

const argv = process.argv.slice(2);
const jsonMode = argv.includes("--json");
const stdinMode = argv.includes("--stdin");
let urls = argv.filter(a => !a.startsWith("--"));

function fromStdin() {
  try {
    const raw = require("node:fs").readFileSync(0, "utf8");
    return raw.split(/\s+/).map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

if (stdinMode) urls = urls.concat(fromStdin());
urls = [...new Set(urls)];

if (urls.length === 0) {
  console.error("Usage: node scripts/check-links.js <url> [url2 ...]   (or --stdin)");
  process.exit(2);
}

// One request; resolves { ok, status, note, finalUrl }. Follows redirects
// (re-validated each hop) up to MAX_REDIRECTS. HEAD first, GET on 405/empty.
function request(url, method, redirects, resolve) {
  let parsed;
  try { parsed = new URL(url); } catch { return resolve({ ok: false, status: "BAD_URL", finalUrl: url }); }
  const lib = parsed.protocol === "https:" ? https : http;
  const req = lib.request(
    url,
    { method, timeout: TIMEOUT_MS, headers: { "User-Agent": UA, Accept: "*/*" } },
    (res) => {
      res.resume();
      const code = res.statusCode;
      if ([301, 302, 303, 307, 308].includes(code) && res.headers.location) {
        if (redirects >= MAX_REDIRECTS) return resolve({ ok: false, status: "REDIRECT_LOOP", finalUrl: url });
        const next = new URL(res.headers.location, url).toString();
        return assertSafeUrl(next).then((s) => {
          if (!s.safe) return resolve({ ok: false, status: s.status, finalUrl: next });
          request(next, "GET", redirects + 1, resolve);
        });
      }
      if (code === 405 && method === "HEAD") return request(url, "GET", redirects, resolve);
      resolve({ ok: code >= 200 && code < 400, status: code, finalUrl: url });
    },
  );
  req.on("timeout", () => { req.destroy(); resolve({ ok: false, status: "TIMEOUT", finalUrl: url }); });
  req.on("error", (e) => resolve({ ok: false, status: e.code || e.message, finalUrl: url }));
  req.end();
}

async function check(url) {
  const safety = await assertSafeUrl(url);
  if (!safety.safe) return { url, ok: false, status: safety.status };
  return new Promise((resolve) => request(url, "HEAD", 0, (r) => resolve({ url, ...r })));
}

(async () => {
  const results = await Promise.all(urls.map(check));
  const failed = results.filter(r => !r.ok);
  if (jsonMode) {
    console.log(JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
  } else {
    for (const r of results) console.log(`${r.ok ? "OK " : "DEAD"}  ${r.status}  ${r.url}`);
    if (failed.length) console.log(`\n${failed.length}/${results.length} link(s) failed to resolve — drop or replace before citing.`);
    else console.log(`\nAll ${results.length} links resolve.`);
  }
  process.exit(failed.length ? 1 : 0);
})();
