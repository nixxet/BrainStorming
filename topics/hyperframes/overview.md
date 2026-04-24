---
title: HyperFrames
tags: [research, evaluate]
created: 2026-04-18
status: complete
---

# HyperFrames

## What It Is


## Source Domain

- **Native context:** Developer tooling for programmatic video composition, sitting in the framework quadrant alongside Remotion. The native buyer is a developer or AI-agent builder who wants local-rendered MP4 output with deterministic frames from HTML input.
- **Why that context matters:** HyperFrames' design decisions (unsandboxed browser defaults, HTML openness, local file server) assume the renderer is embedded inside a trusted developer pipeline — not a multi-tenant service and not exposed to untrusted user input. Those assumptions break the moment AI-generated HTML of any provenance is passed through.

## Generalizable Value

- **Cross-vertical relevance:** Time virtualization (patching `requestAnimationFrame`, `Date.now()`) as a pattern for deterministic browser-to-video rendering is independently validated by Replit's production implementation, and is reusable by any team building similar renderers in any domain.

## Key Concepts

- **HTML-as-composition-format:** Plain HTML files with `data-*` attributes for timing/duration/clips; no React, no DSL, no build step.
- **Programmatic video rendering:** Code-based composition → MP4, distinct from generative AI video (Sora, Kling) and SaaS template APIs (Creatomate, Shotstack).
- **`HeadlessExperimental.beginFrame`:** The Chrome DevTools Protocol API that enabled deterministic frame-by-frame capture; removed in Chromium 147.
- **Screenshot fallback mode:** Non-deterministic rendering path using rAF-based timing; the default in v0.4.4+ because of the Chromium API removal.
- **Frame Adapter pattern:** Architectural seam that decouples composition format from animation runtime (GSAP, Lottie, CSS animations, Three.js).

## Context

- Used by AI agents or developers who need local-rendered MP4 output from HTML compositions without a React build pipeline.
- Introduced 2026-04-15 as part of HeyGen's multi-channel developer strategy (MCP server + Skills integration + HyperFrames), with an upsell path through a HeyGen-hosted component registry.
- Closest framework analog is Remotion (React-required, company-licensed); SaaS API alternatives (Creatomate, Shotstack, Bannerbear, Plainly) are cloud-rendered and credit-billed.
- Not a replacement for generative AI video tools — HyperFrames composes and renders; it does not synthesize footage.

## Key Numbers / Stats

- 4,337 GitHub stars, 306 forks as of 2026-04-18 — [GitHub API — heygen-com/hyperframes/contributors](https://api.github.com/repos/heygen-com/hyperframes/contributors) — **[HIGH]**
- v0.4.4, repository age 5 weeks (created 2026-03-10, launched ~2026-04-15) — [GitHub API](https://api.github.com/repos/heygen-com/hyperframes/contributors) — **[HIGH]**
- 21 open issues at launch, including installation failures (Issue #316), jerky preview (Issue #317), asset path bugs (Issue #321) — GitHub issue tracker — **[HIGH]**
- Repository size ~554MB; Chromium ~300MB+ additional at install — GitHub Issue #300 — **[MEDIUM]**
- Remotion comparison point: **60K–170K weekly npm downloads** depending on analytics source (PkgPulse reports ~60K, ngram.com reports 169,900 for the same period) vs. HyperFrames' 5-week presence — [BuildPilot comparison 2026](https://trybuildpilot.com/363-remotion-vs-motion-canvas-vs-revideo-2026), [PkgPulse](https://www.pkgpulse.com/blog/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026), [ngram.com](https://www.ngram.com/blog/industry-news/remotion-skills-sh-ai-video-creation) — **[MEDIUM]** (sources diverge ~3x)
- Remotion Claude Code agent skill: **150,000 installs in 8 weeks** on skills.sh after January 2026 launch, #1 in the video category, #5 most-installed overall — a distribution channel not captured in npm metrics (install count is a popularity signal; skills.sh has no formal quality review or retention metric) — [ngram.com](https://www.ngram.com/blog/industry-news/remotion-skills-sh-ai-video-creation) — **[MEDIUM]**
- HeyGen financials: $95M ARR, $500M valuation, profitable since Q2 2023 — [Sacra — HeyGen revenue](https://sacra.com/c/heygen/) — **[MEDIUM]**

## Evaluation Scorecard

| Dimension | Assessment | Confidence | |-----------|-----------|:----------:| | Deterministic rendering (current reality) | Broken by default in v0.4.4+; platform-conditional opt-in | HIGH | | Security posture | Two Critical (F8, F9) + two High (F10, F11 MEDIUM-confidence) unresolved | HIGH | | Maturity / stability | Pre-1.0, 5 weeks old, pre-production | HIGH | | Licensing | Apache 2.0, BDFL governance | HIGH | | Competitive position vs. Remotion | Narrowed after Remotion's Jan 2026 agent skills launch | HIGH | | Performance | No independent benchmarks published | HIGH (gap confirmed) | | **Overall verdict** | **Conditional do-not-recommend for production** | HIGH |

## Links

- [HyperFrames repository](https://github.com/heygen-com/hyperframes)
- [HyperFrames website](https://hyperframes.heygen.com)
- [HyperFrames README](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md)
- [HyperFrames Issue #294 — HeadlessExperimental.beginFrame removal](https://github.com/heygen-com/hyperframes/issues/294)
- [Puppeteer Issue #11315 — Chromium 147 API removal](https://github.com/puppeteer/puppeteer/issues/11315)
- [Replit — browsers don't want to be cameras](https://blog.replit.com/browsers-dont-want-to-be-cameras)
- [Remotion Claude Code docs](https://www.remotion.dev/docs/ai/claude-code)
