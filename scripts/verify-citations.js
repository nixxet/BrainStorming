#!/usr/bin/env node
'use strict';
/**
 * verify-citations.js — Deterministic URL verification for published topic files.
 * Operates on published files only: topics/{slug}/overview.md, notes.md, verdict.md
 * Does NOT scan _pipeline/ draft files.
 *
 * Usage:
 *   node scripts/verify-citations.js --topic {slug}
 *   node scripts/verify-citations.js --all
 *   node scripts/verify-citations.js --help
 *
 * Exit codes:
 *   0 — all URLs OK, REDIRECT_OK, WARN_AUTH, or WARN_PLACEHOLDER
 *   1 — any DEAD, TIMEOUT, or ERROR URLs found
 */

const fs = require('fs');
const path = require('path');
const https = require('node:https');
const http = require('node:http');
const dns = require('node:dns').promises;
const net = require('node:net');

const ROOT       = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'topics');
const META_DIR   = path.join(TOPICS_DIR, '_meta');

const SCOPE_BOUNDARY = `This script verifies that URLs resolve. It does not verify that cited pages support the claims made. Availability validation and semantic claim validation are different problems.`;

const PLACEHOLDER_PATTERNS = /example\.com|TODO|TBD|PLACEHOLDER/i;
const URL_REGEX = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const PUBLISHED_FILES = ['overview.md', 'notes.md', 'verdict.md'];
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const RAW_GH_RETRY_DELAY_MS = 1500;
const PRIVATE_HOST_PATTERNS = /(^|\.)localhost$|(^|\.)local$|(^|\.)internal$/i;

// ── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
verify-citations.js — URL verification for published BrainStorming topics

${SCOPE_BOUNDARY}

Usage:
  node scripts/verify-citations.js --topic {slug}              Verify one topic (URL reachability)
  node scripts/verify-citations.js --topic {slug} --claim-check  Verify + check claim text in page body
  node scripts/verify-citations.js --all                        Verify all topics + write aggregate report
  node scripts/verify-citations.js --all --claim-check          Verify + claim-check all topics

--claim-check: For each reachable URL, fetches the page body (up to 50KB) and checks whether
significant terms from the citation's link text appear in the content. Reports CLAIM-PRESENT,
CLAIM-ABSENT, or CLAIM-UNVERIFIABLE (when link text is too short to verify meaningfully).
This is text-match verification — not semantic verification. A CLAIM-ABSENT result means
the specific phrasing used in the link text was not found; it does not prove the claim is false.

Exit codes: 0 = all pass/warn  |  1 = any DEAD, TIMEOUT, ERROR, or CLAIM-ABSENT
`);
  process.exit(0);
}

const topicArg      = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const allMode       = args.includes('--all');
const claimCheckMode = args.includes('--claim-check');

if (!topicArg && !allMode) {
  console.error('Error: provide --topic {slug} or --all');
  process.exit(1);
}

// ── HTTP checking ─────────────────────────────────────────────────────────────

/**
 * Make one HTTP request and resolve with { statusCode, finalUrl, redirectCount }.
 */
function makeRequest(url, method, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'User-Agent': 'BrainStorming-CitationChecker/1.0',
      },
      timeout: TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      // Consume response body to free socket
      res.resume();

      const code = res.statusCode;

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(code) && res.headers.location) {
        if (redirectCount >= MAX_REDIRECTS) {
          return resolve({ statusCode: code, finalUrl: url, redirectCount, maxRedirectsExceeded: true });
        }
        const nextUrl = new URL(res.headers.location, url).toString();
        return resolve({ redirect: true, nextUrl, redirectCount: redirectCount + 1 });
      }

      resolve({ statusCode: code, finalUrl: url, redirectCount });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function isPrivateIPv4(address) {
  const parts = address.split('.').map(Number);
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
  return normalized === '::1' || normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd');
}

async function assertSafeUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, status: 'ERROR', note: 'invalid url' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, status: 'BLOCKED_UNSUPPORTED_PROTOCOL', note: `unsupported protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.test(hostname)) {
    return { safe: false, status: 'BLOCKED_PRIVATE_NETWORK', note: `blocked hostname: ${hostname}` };
  }

  const literalVersion = net.isIP(hostname);
  if (literalVersion === 4 && isPrivateIPv4(hostname)) {
    return { safe: false, status: 'BLOCKED_PRIVATE_NETWORK', note: `blocked private IPv4: ${hostname}` };
  }
  if (literalVersion === 6 && isPrivateIPv6(hostname)) {
    return { safe: false, status: 'BLOCKED_PRIVATE_NETWORK', note: `blocked private IPv6: ${hostname}` };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return { safe: false, status: 'BLOCKED_PRIVATE_NETWORK', note: `DNS resolved to private IPv4: ${record.address}` };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return { safe: false, status: 'BLOCKED_PRIVATE_NETWORK', note: `DNS resolved to private IPv6: ${record.address}` };
      }
    }
  } catch (err) {
    return { safe: false, status: 'DNS_ERROR', note: err.code || err.message };
  }

  return { safe: true };
}

/**
 * Follow redirects up to MAX_REDIRECTS, return final { statusCode, finalUrl }.
 */
async function fetchFollowRedirects(url, method) {
  let current = url;
  let hops = 0;

  while (hops <= MAX_REDIRECTS) {
    const safety = await assertSafeUrl(current);
    if (!safety.safe) {
      return { statusCode: null, finalUrl: current, error: safety.status, note: safety.note };
    }

    const result = await makeRequest(current, method, hops);

    if (result.maxRedirectsExceeded) {
      return { statusCode: result.statusCode, finalUrl: current, error: 'MAX_REDIRECTS' };
    }

    if (result.redirect) {
      current = result.nextUrl;
      hops = result.redirectCount;
      continue;
    }

    return { statusCode: result.statusCode, finalUrl: result.finalUrl, redirects: hops };
  }

  return { statusCode: null, finalUrl: current, error: 'MAX_REDIRECTS' };
}

/**
 * Classify URL and check it. Returns result object.
 */
async function checkUrl(url, sourceFile) {
  const base = { url, source_file: sourceFile, final_url: url, http_code: null, method_used: null };

  // Placeholder check
  if (PLACEHOLDER_PATTERNS.test(url)) {
    return { ...base, status: 'WARN_PLACEHOLDER' };
  }

  const isRawGitHub = url.includes('raw.githubusercontent.com');

  const attempt = async (method) => {
    try {
      const result = await fetchFollowRedirects(url, method);

      if (result.error === 'MAX_REDIRECTS') {
        return { ...base, status: 'ERROR', method_used: method, final_url: result.finalUrl, note: 'max redirects exceeded' };
      }
      if (['DNS_ERROR', 'BLOCKED_PRIVATE_NETWORK', 'BLOCKED_UNSUPPORTED_PROTOCOL'].includes(result.error)) {
        return { ...base, status: result.error, method_used: method, final_url: result.finalUrl, note: result.note };
      }

      const code = result.statusCode;
      const hops = result.redirects ?? 0;

      let status;
      if (code >= 200 && code < 300) {
        status = hops > 0 ? 'REDIRECT_OK' : 'OK';
      } else if (code === 401 || code === 403) {
        status = 'WARN_AUTH';
      } else if (code >= 400 && code < 600) {
        status = 'DEAD';
      } else {
        status = 'ERROR';
      }

      return { ...base, status, http_code: code, final_url: result.finalUrl, method_used: method };
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        return { ...base, status: 'TIMEOUT', method_used: method };
      }
      return { ...base, status: 'ERROR', method_used: method, note: err.message };
    }
  };

  // Try HEAD first
  let result = await attempt('HEAD');

  // If HEAD returns 405, or connection error: retry with GET
  if (result.http_code === 405 || (result.status === 'ERROR' && result.http_code === null)) {
    result = await attempt('GET');
  }

  // Raw GitHub: retry once after delay on any failure
  if (isRawGitHub && (result.status === 'DEAD' || result.status === 'ERROR' || result.status === 'TIMEOUT')) {
    await new Promise(r => setTimeout(r, RAW_GH_RETRY_DELAY_MS));
    result = await attempt('GET');
  }

  return result;
}

// ── Claim checking (--claim-check mode) ──────────────────────────────────────

const MAX_BODY_BYTES = 51200; // 50KB — enough to find claim terms in typical abstracts/intros

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','can',
  'this','that','these','those','it','its','they','them','their','we','our',
  'you','your','he','she','his','her','i','my','me','us','not','no','nor',
  'as','if','then','than','so','yet','both','either','neither','each','few',
  'more','most','other','some','such','only','own','same','also','just',
  'into','through','during','before','after','above','below','between','out',
  'up','down','about','against','per','via',
]);

/**
 * Fetch up to MAX_BODY_BYTES of a URL's response body.
 * Returns { text: string } or { error: string }.
 */
function fetchBody(url) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); } catch { return resolve({ error: 'invalid-url' }); }
    const lib = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': 'BrainStorming-CitationChecker/1.0', 'Accept': 'text/html,text/plain,*/*' },
      timeout: TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      // Follow one redirect level for claim-check
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return fetchBody(next).then(resolve);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return resolve({ error: `http-${res.statusCode}` });
      }

      const chunks = [];
      let total = 0;
      res.on('data', (chunk) => {
        total += chunk.length;
        chunks.push(chunk);
        if (total >= MAX_BODY_BYTES) req.destroy();
      });
      res.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8', 0, MAX_BODY_BYTES) }));
      res.on('error', (e) => resolve({ error: e.message }));
    });

    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

/**
 * Strip HTML tags and collapse whitespace.
 */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Extract significant terms from citation link text.
 * Returns array of lowercase significant words (≥4 chars, not stop words).
 */
function extractSignificantTerms(linkText) {
  return linkText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

/**
 * Check whether claim terms appear in the fetched page body.
 * Returns: 'CLAIM-PRESENT' | 'CLAIM-ABSENT' | 'CLAIM-UNVERIFIABLE'
 *
 * CLAIM-PRESENT:      ≥60% of significant terms found in body
 * CLAIM-ABSENT:       <40% of significant terms found
 * CLAIM-UNVERIFIABLE: <3 significant terms (link text too short)
 */
function checkClaimInBody(linkText, bodyText) {
  const terms = extractSignificantTerms(linkText);
  if (terms.length < 3) return 'CLAIM-UNVERIFIABLE';

  const body = stripHtml(bodyText);
  const found = terms.filter(t => body.includes(t)).length;
  const ratio = found / terms.length;

  if (ratio >= 0.6) return 'CLAIM-PRESENT';
  if (ratio < 0.4) return 'CLAIM-ABSENT';
  return 'CLAIM-UNVERIFIABLE'; // 40–59% is ambiguous
}

// ── Topic processing ──────────────────────────────────────────────────────────

function extractUrls(content, fileName) {
  const urls = [];
  let match;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(content)) !== null) {
    urls.push({ url: match[2], linkText: match[1], sourceFile: fileName });
  }
  return urls;
}

async function verifyTopic(slug) {
  const topicDir = path.join(TOPICS_DIR, slug);
  const today = new Date().toISOString().slice(0, 10);

  // Guard: check topic has published files
  const existingFiles = PUBLISHED_FILES.filter(f => fs.existsSync(path.join(topicDir, f)));
  if (existingFiles.length === 0) {
    console.error(`Topic ${slug} has no published files — run after the pipeline completes.`);
    return null;
  }

  // Extract all URLs
  const allUrls = [];
  for (const fileName of existingFiles) {
    const content = fs.readFileSync(path.join(topicDir, fileName), 'utf8');
    allUrls.push(...extractUrls(content, fileName));
  }

  if (allUrls.length === 0) {
    console.log(`[${slug}] No URLs found in published files.`);
    return buildReport(slug, today, []);
  }

  console.log(`[${slug}] Checking ${allUrls.length} URLs...`);

  // Deduplicate URLs for checking (but keep all source references)
  const uniqueUrls = [...new Set(allUrls.map(u => u.url))];
  const checkResults = new Map();

  for (const url of uniqueUrls) {
    process.stdout.write(`  ${url.slice(0, 80)}... `);
    const result = await checkUrl(url, '');
    checkResults.set(url, result);
    console.log(result.status + (result.http_code ? ` (${result.http_code})` : ''));
  }

  // Optional: claim-check reachable URLs
  const claimResults = new Map(); // url -> { claimVerdict, linkText }
  if (claimCheckMode) {
    console.log(`[${slug}] Claim-checking reachable URLs...`);
    // Build a map of url -> representative link text (first occurrence wins)
    const urlToLinkText = new Map();
    for (const { url, linkText } of allUrls) {
      if (!urlToLinkText.has(url)) urlToLinkText.set(url, linkText);
    }

    for (const url of uniqueUrls) {
      const r = checkResults.get(url);
      if (!['OK', 'REDIRECT_OK'].includes(r.status)) continue;

      const linkText = urlToLinkText.get(url) ?? '';
      process.stdout.write(`  [claim] ${url.slice(0, 70)}... `);
      const bodyResult = await fetchBody(r.final_url ?? url);
      if (bodyResult.error) {
        claimResults.set(url, { claimVerdict: 'CLAIM-FETCH-ERROR', linkText, error: bodyResult.error });
        console.log(`CLAIM-FETCH-ERROR (${bodyResult.error})`);
      } else {
        const verdict = checkClaimInBody(linkText, bodyResult.text);
        claimResults.set(url, { claimVerdict: verdict, linkText });
        console.log(verdict);
      }
    }
  }

  // Build per-URL results with correct source files
  const results = allUrls.map(({ url, sourceFile, linkText }) => {
    const r = checkResults.get(url);
    const claim = claimResults.get(url);
    return {
      ...r,
      source_file: sourceFile,
      link_text: linkText,
      ...(claim ? { claim_verdict: claim.claimVerdict } : {}),
    };
  });

  return buildReport(slug, today, results);
}

function buildReport(slug, date, results) {
  const counts = { ok: 0, redirect_ok: 0, warn_auth: 0, warn_placeholder: 0, timeout: 0, dead: 0, error: 0, blocked: 0, dns_error: 0 };
  for (const r of results) {
    const key = r.status.toLowerCase().replace('_ok', '_ok').replace('warn_', 'warn_');
    if (key === 'ok') counts.ok++;
    else if (key === 'redirect_ok') counts.redirect_ok++;
    else if (key === 'warn_auth') counts.warn_auth++;
    else if (key === 'warn_placeholder') counts.warn_placeholder++;
    else if (key === 'timeout') counts.timeout++;
    else if (key === 'dead') counts.dead++;
    else if (key.startsWith('blocked')) counts.blocked++;
    else if (key === 'dns_error') counts.dns_error++;
    else if (key === 'error') counts.error++;
  }

  // Claim-check counts (only populated when --claim-check was used)
  const claimCounts = {
    claim_present: results.filter(r => r.claim_verdict === 'CLAIM-PRESENT').length,
    claim_absent: results.filter(r => r.claim_verdict === 'CLAIM-ABSENT').length,
    claim_unverifiable: results.filter(r => r.claim_verdict === 'CLAIM-UNVERIFIABLE').length,
    claim_fetch_error: results.filter(r => r.claim_verdict === 'CLAIM-FETCH-ERROR').length,
  };

  return {
    topic_slug: slug,
    checked_on: date,
    total_urls: results.length,
    ...counts,
    ...(claimCheckMode ? claimCounts : {}),
    results,
  };
}

function printReport(report) {
  const { topic_slug: slug, checked_on, total_urls, ok, redirect_ok, warn_auth, warn_placeholder, timeout, dead, error, blocked, dns_error } = report;
  console.log(`\n# Citation Check: ${slug} — ${checked_on}`);
  console.log(`\n${SCOPE_BOUNDARY}\n`);
  console.log(`Total: ${total_urls} | OK: ${ok} | Redirect OK: ${redirect_ok} | Dead: ${dead} | Timeout: ${timeout} | DNS: ${dns_error} | Blocked: ${blocked} | Error: ${error} | Auth-Gated: ${warn_auth} | Placeholder: ${warn_placeholder}`);

  const failed = report.results.filter(r => ['DEAD','TIMEOUT','ERROR','DNS_ERROR','BLOCKED_PRIVATE_NETWORK','BLOCKED_UNSUPPORTED_PROTOCOL'].includes(r.status));
  if (failed.length > 0) {
    console.log(`\n## Dead / Failed URLs`);
    for (const r of failed) {
      const code = r.http_code ? ` (${r.http_code})` : '';
      console.log(`- [${r.source_file}] ${r.status}${code}: ${r.url}`);
    }
  }

  if (claimCheckMode) {
    const absent = report.results.filter(r => r.claim_verdict === 'CLAIM-ABSENT');
    const present = report.results.filter(r => r.claim_verdict === 'CLAIM-PRESENT');
    const unverifiable = report.results.filter(r => r.claim_verdict === 'CLAIM-UNVERIFIABLE');
    const fetchErr = report.results.filter(r => r.claim_verdict === 'CLAIM-FETCH-ERROR');

    console.log(`\n## Claim Check Results`);
    console.log(`Present: ${present.length} | Absent: ${absent.length} | Unverifiable: ${unverifiable.length} | Fetch Error: ${fetchErr.length}`);
    console.log(`Note: CLAIM-ABSENT means link text terms not found in page body — verify manually. Does not prove the claim is false.`);

    if (absent.length > 0) {
      console.log(`\n### CLAIM-ABSENT (review these)`);
      for (const r of absent) {
        console.log(`- [${r.source_file}] "${r.link_text?.slice(0, 80)}"`);
        console.log(`  URL: ${r.url}`);
      }
    }
  }
}

function hasFailed(report) {
  return report.results.some(r =>
    ['DEAD','TIMEOUT','ERROR','DNS_ERROR','BLOCKED_PRIVATE_NETWORK','BLOCKED_UNSUPPORTED_PROTOCOL'].includes(r.status) ||
    (claimCheckMode && r.claim_verdict === 'CLAIM-ABSENT')
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(META_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);

  if (allMode) {
    const slugs = fs.readdirSync(TOPICS_DIR)
      .filter(name => {
        if (name.startsWith('_')) return false;
        return fs.statSync(path.join(TOPICS_DIR, name)).isDirectory();
      });

    const reports = [];
    let anyFailed = false;

    for (const slug of slugs) {
      const report = await verifyTopic(slug);
      if (!report) continue;
      reports.push(report);

      // Save per-topic JSON
      const pipelineDir = path.join(TOPICS_DIR, slug, '_pipeline');
      fs.mkdirSync(pipelineDir, { recursive: true });
      const jsonPath = path.join(pipelineDir, `citation-check-${today}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

      if (hasFailed(report)) anyFailed = true;
    }

    // Write aggregate markdown report
    const aggLines = [];
    aggLines.push(`---`);
    aggLines.push(`title: Citation Check — All Topics`);
    aggLines.push(`created: ${today}`);
    aggLines.push(`tags: [meta, citations]`);
    aggLines.push(`---`);
    aggLines.push(``);
    aggLines.push(`# Citation Check: All Topics — ${today}`);
    aggLines.push(``);
    aggLines.push(`> ${SCOPE_BOUNDARY}`);
    aggLines.push(``);
    aggLines.push(`| Topic | Total | OK | Redirect | Dead | Timeout | DNS | Blocked | Error | Auth | Placeholder |`);
    aggLines.push(`|-------|-------|----|----------|------|---------|-----|---------|-------|------|-------------|`);
    for (const r of reports) {
      aggLines.push(`| ${r.topic_slug} | ${r.total_urls} | ${r.ok} | ${r.redirect_ok} | ${r.dead} | ${r.timeout} | ${r.dns_error} | ${r.blocked} | ${r.error} | ${r.warn_auth} | ${r.warn_placeholder} |`);
    }
    aggLines.push(``);

    const failedTopics = reports.filter(hasFailed);
    if (failedTopics.length > 0) {
      aggLines.push(`## Topics With Failed URLs`);
      aggLines.push(``);
      for (const r of failedTopics) {
        aggLines.push(`### ${r.topic_slug}`);
        for (const res of r.results.filter(x => ['DEAD','TIMEOUT','ERROR','DNS_ERROR','BLOCKED_PRIVATE_NETWORK','BLOCKED_UNSUPPORTED_PROTOCOL'].includes(x.status))) {
          const code = res.http_code ? ` (${res.http_code})` : '';
          aggLines.push(`- [${res.source_file}] ${res.status}${code}: ${res.url}`);
        }
        aggLines.push(``);
      }
    }

    const aggPath = path.join(META_DIR, `citation-check-${today}.md`);
    fs.writeFileSync(aggPath, aggLines.join('\n'), 'utf8');
    console.log(`\nAggregate report written: ${aggPath}`);

    process.exit(anyFailed ? 1 : 0);

  } else {
    // Single topic mode
    const report = await verifyTopic(topicArg);
    if (!report) {
      process.exit(1);
    }

    printReport(report);

    // Save JSON
    const pipelineDir = path.join(TOPICS_DIR, topicArg, '_pipeline');
    fs.mkdirSync(pipelineDir, { recursive: true });
    const jsonPath = path.join(pipelineDir, `citation-check-${today}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nJSON results: ${jsonPath}`);

    process.exit(hasFailed(report) ? 1 : 0);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
