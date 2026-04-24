---
title: Claude-Mem — Evaluation Notes
tags: [research, findings, persistent-memory]
created: 2026-04-14
updated: 2026-04-17
status: published
published: 2026-04-17
quality_score: 8.79
---

# Claude-Mem — Evaluation Notes

## Delta Since The April 14 Pass

- **[HIGH]** `v12.1.6` fixed a real regression: observation/summary saving was broken on Claude Code `2.1.109+`, and the release explicitly shipped a fix for `#2049`. [Release v12.1.6](https://github.com/thedotmack/claude-mem/releases/tag/v12.1.6) [Issue #2049](https://github.com/thedotmack/claude-mem/issues/2049)
- **[HIGH]** `v12.2.0` shipped meaningful new functionality around worktree adoption and parent/worktree memory remapping. That is product progress, not just marketing motion. [Release v12.2.0](https://github.com/thedotmack/claude-mem/releases/tag/v12.2.0)
- **[HIGH]** Several bug IDs previously treated as “open bugs” are now **closed by consolidation**, not necessarily resolved. `#1798`, `#1801`, `#1797`, and `#1806` were closed during the April backlog cleanup and mapped to canonical issues `#1887`, `#1867`, `#1881`, and `#1886`. Treat them as still relevant unless the canonical issues close with an actual fix. [#1798](https://github.com/thedotmack/claude-mem/issues/1798) [#1887](https://github.com/thedotmack/claude-mem/issues/1887) [#1801](https://github.com/thedotmack/claude-mem/issues/1801) [#1867](https://github.com/thedotmack/claude-mem/issues/1867) [#1797](https://github.com/thedotmack/claude-mem/issues/1797) [#1881](https://github.com/thedotmack/claude-mem/issues/1881) [#1806](https://github.com/thedotmack/claude-mem/issues/1806) [#1886](https://github.com/thedotmack/claude-mem/issues/1886)
- **[HIGH]** I am **not carrying forward** the earlier “native Claude Code auto-memory covers ~80% of use cases” claim. I could not re-verify that number from primary sources in this pass, so it should not anchor the verdict.

## Verified Strengths

### Product Reality

- **[HIGH]** Claude-Mem is a real, non-trivial system: hooks, MCP tools, worker service, web viewer, search architecture, and active release flow are all present on current `main`. [README](https://github.com/thedotmack/claude-mem) [Architecture overview](https://docs.claude-mem.ai/architecture/overview)
- **[HIGH]** The “progressive retrieval” idea is genuine. The repo and docs consistently describe staged retrieval rather than blind transcript stuffing. [README](https://github.com/thedotmack/claude-mem) [Context engineering docs](https://docs.claude-mem.ai/context-engineering)
- **[HIGH]** Release cadence is very active. Between April 15 and April 18 UTC the project shipped five releases, including a real regression fix and a new worktree feature set. [Releases](https://github.com/thedotmack/claude-mem/releases)

### Maintenance Signal

- **[HIGH]** The project has strong visible traction: 61k+ stars and 95 contributors. [GitHub repo](https://github.com/thedotmack/claude-mem)
- **[MEDIUM]** The contributor graph is still highly concentrated. The maintainer dominates contribution volume, so “many contributors” does not fully remove bus-factor risk. [GitHub contributors](https://github.com/thedotmack/claude-mem/graphs/contributors)

## Verified Weaknesses

### Security Surface

- **[HIGH]** The worker HTTP surface is still weakly protected on current `main`. Admin routes use `requireLocalhost`, but the broader worker API still exposes settings, branch operations, memory-save, and queue-management routes without equivalent protection or token auth. [Server.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/server/Server.ts) [SettingsRoutes.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/worker/http/routes/SettingsRoutes.ts) [DataRoutes.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/worker/http/routes/DataRoutes.ts) [MemoryRoutes.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/worker/http/routes/MemoryRoutes.ts)
- **[HIGH]** Open consolidated security issue `#1933` remains directionally correct: the product still exposes a meaningful local API attack surface around `/api/settings`, `/api/memory/save`, and queue endpoints. [Issue #1933](https://github.com/thedotmack/claude-mem/issues/1933)
- **[HIGH]** `smart_search`, `smart_unfold`, and `smart_outline` still accept user-controlled paths with `resolve(...)` and no obvious project-root boundary enforcement in the current MCP server implementation. That keeps the arbitrary-file-read concern alive. [mcp-server.ts](https://github.com/thedotmack/claude-mem/blob/main/src/servers/mcp-server.ts)
- **[HIGH]** Default port design still creates a cross-user risk surface on shared machines: the worker defaults to machine-wide port `37777`, and the open issue about second-user sessions connecting to the first user’s worker remains unresolved. [SettingsDefaultsManager.ts](https://github.com/thedotmack/claude-mem/blob/main/src/shared/SettingsDefaultsManager.ts) [Issue #1936](https://github.com/thedotmack/claude-mem/issues/1936)
- **[HIGH]** Prompt/context hardening is incomplete. The current SDK prompt builders still interpolate raw `userPrompt` and tool output into XML-shaped prompts, and the `CLAUDE.md` tag replacement helper writes new content without sanitization. [sdk/prompts.ts](https://github.com/thedotmack/claude-mem/blob/main/src/sdk/prompts.ts) [claude-md-utils.ts](https://github.com/thedotmack/claude-mem/blob/main/src/utils/claude-md-utils.ts) [Issue #1935](https://github.com/thedotmack/claude-mem/issues/1935)
- **[MEDIUM]** The earlier security-audit issue `#1251` was closed for backlog hygiene, not because the repo cleanly resolved the underlying risk class. The security risk moved into consolidated tickets rather than disappearing. [Issue #1251](https://github.com/thedotmack/claude-mem/issues/1251)

### Stability And Portability

- **[HIGH]** PowerShell and Windows hook compatibility is still an issue on current `main`. `plugin/hooks/hooks.json` still contains Bash-centric constructs such as `export PATH`, `[ -z ... ]`, `curl`, shell loops, and redirection syntax. That is hard evidence against treating Windows portability as solved. [hooks.json](https://github.com/thedotmack/claude-mem/blob/main/plugin/hooks/hooks.json) [Issue #1886](https://github.com/thedotmack/claude-mem/issues/1886)
- **[MEDIUM]** Some lower-level Windows/runtime mitigations have landed on `main` since older reports: process-management and worker-spawn code now includes several Windows-specific hardening paths. That improvement matters, but it does not neutralize the still-POSIX hook manifest or the still-open canonical Windows issues. [ProcessManager.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/infrastructure/ProcessManager.ts) [worker-service.ts](https://github.com/thedotmack/claude-mem/blob/main/src/services/worker-service.ts)
- **[HIGH]** The canonical Windows deadlock/worker-blocking issue remains open as `#1887`. The old issue number is gone, but the core operational risk is not fully retired. [Issue #1887](https://github.com/thedotmack/claude-mem/issues/1887)
- **[MEDIUM]** The username-with-spaces bug is no longer a clean “obviously unfixed” case. A fix landed in commit/PR `#1843`, but the consolidated canonical issue `#1881` remains open, so the safest current framing is **partially fixed / not fully retired**. [PR #1843](https://github.com/thedotmack/claude-mem/pull/1843) [Issue #1881](https://github.com/thedotmack/claude-mem/issues/1881)
- **[MEDIUM]** The worker-queue silent-death issue is open but less definitive than before. The canonical issue itself marks it as `UNCERTAIN` after refactoring, so this should stay in the caveat set but not be overstated as a currently reproduced fact. [Issue #1867](https://github.com/thedotmack/claude-mem/issues/1867)

### Documentation And Packaging Drift

- **[MEDIUM]** Current repo metadata has drift. `package.json` says `12.2.0`, while the README badge near the top still shows `6.5.0`. That is not catastrophic, but it is a concrete sign that public-facing docs are not perfectly synchronized with the product. [package.json](https://github.com/thedotmack/claude-mem/blob/main/package.json) [README](https://github.com/thedotmack/claude-mem)
- **[MEDIUM]** Some historical docs in `docs/reports/` are now stale snapshots rather than current status pages. They still describe older Windows issues as open even where parts of the codebase have since changed. [CHANGELOG](https://github.com/thedotmack/claude-mem/blob/main/CHANGELOG.md) [docs/reports](https://github.com/thedotmack/claude-mem/tree/main/docs/reports)
- **[MEDIUM]** Mixed licensing is real but narrower than it first looked. The root package is AGPL-3.0, while `ragtime/` is separately licensed and appears excluded from the published package file list. That means licensing complexity is genuine, but not the same as “the whole shipped plugin is noncommercial.” [LICENSE](https://github.com/thedotmack/claude-mem/blob/main/LICENSE) [ragtime/LICENSE](https://github.com/thedotmack/claude-mem/blob/main/ragtime/LICENSE) [package.json](https://github.com/thedotmack/claude-mem/blob/main/package.json)

## Claims I Downgraded In This Pass

- **[MEDIUM]** The old 3x token-overhead claim still exists as an historical issue report (`#618`), but I did not find fresh primary-source benchmarking on current `v12.2.0`. It remains a caution, not a core decision anchor. [Issue #618](https://github.com/thedotmack/claude-mem/issues/618)
- **[HIGH]** The prior report leaned too hard on older open issue numbers. The re-evaluation now distinguishes administrative closure from true resolution.
- **[HIGH]** The prior report leaned on a numeric built-in-memory comparison that could not be re-established from primary evidence, so it has been removed.

## Reusable Patterns

- **[HIGH]** Progressive retrieval is the strongest reusable idea here: retrieve summaries first, then timeline context, then deep detail only when needed.
- **[HIGH]** Worktree adoption is a genuinely useful pattern for memory systems tied to repo topology. `v12.2.0` improves that story materially. [Release v12.2.0](https://github.com/thedotmack/claude-mem/releases/tag/v12.2.0)
- **[MEDIUM]** The project also demonstrates the downside of “local helper becomes local platform”: once a memory plugin grows its own worker API, branching controls, update flows, and multi-runtime stack, it inherits security and operability responsibilities closer to a local daemon than a simple plugin.

## Gaps & Unknowns

1. **Current end-to-end token ROI:** no fresh benchmark data on current `v12.2.0`.
2. **Security hardening roadmap:** open consolidated issues exist, but I did not find a published remediation plan with dates.
3. **Arbitrary file-write reachability (`#1934`):** the open issue remains plausible, but the current guardrails around all call paths were not fully proven end-to-end in this pass.

## Confidence Summary

| Confidence | What it covers | |------------|----------------| | **HIGH** | Current releases, repo scale, unauthenticated/weakly-protected worker surface, path-scope risk, Bash-centric Windows hook problem, issue consolidation status | | **MEDIUM** | Partial Windows fixes, mixed-license blast radius, queue-death severity on current code, token-overhead relevance today | | **LOW / UNVERIFIED** | Fresh real-world token ROI, exact practical blast radius of every open security ticket without runtime exploitation |

*Evaluation notes | Re-evaluated against current main, current releases, and current issues | 2026-04-17*
