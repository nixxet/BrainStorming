---
title: HyperFrames — Research Notes
tags: [research, findings]
created: 2026-04-18
status: complete
---

# HyperFrames — Research Notes

## Strengths

### Architectural innovation (topic-native)

- **[HIGH]** HyperFrames' composition format is plain HTML with `data-*` attributes for timing, duration, track, and clip properties — no React, no DSL, no build step — [HyperFrames README](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md), [HyperFrames Prompting Guide](https://hyperframes.heygen.com/guides/prompting). This is a genuine architectural differentiator against Remotion (React/TSX required) and SaaS APIs (JSON template schemas).
- **[HIGH]** Time virtualization (patching `requestAnimationFrame`, `Date.now()`) as the technical approach to deterministic browser-to-video rendering is validated by two independent implementations — HyperFrames and Replit arrived at the same architecture independently — [Replit — browsers don't want to be cameras](https://blog.replit.com/browsers-dont-want-to-be-cameras), [HyperFrames README](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md).

### Licensing and governance

- **[HIGH]** Apache 2.0 license is confirmed with no hidden restrictions and no CLA requirement — [CONTRIBUTING.md](https://github.com/heygen-com/hyperframes/blob/main/CONTRIBUTING.md), GitHub API license field. This protects the current codebase against unilateral relicensing.

### Generalizable patterns

- **[HIGH]** Time virtualization for deterministic browser rendering is reusable by any team building similar renderers in any domain — [Replit blog](https://blog.replit.com/browsers-dont-want-to-be-cameras) provides a production reference.

### Ecosystem and commercial backing

- **[MEDIUM]** According to Sacra, HeyGen reports $95M ARR, $500M valuation, and has been profitable since Q2 2023 — [Sacra — HeyGen revenue](https://sacra.com/c/heygen/). This provides funding stability for continued HyperFrames investment, though it also implies a commercial upsell motive.

---

## Weaknesses

### Security findings (Critical and High)

- **[HIGH]** **Path traversal vulnerability (Critical).** The file server in `packages/engine/src/services/fileServer.ts` constructs filesystem paths from HTTP request paths using `join(projectDir, relativePath)` with no `realpath()` or directory boundary check. AI-generated compositions can read arbitrary host files — [HyperFrames fileServer.ts source](https://raw.githubusercontent.com/heygen-com/hyperframes/main/packages/engine/src/services/fileServer.ts), [HTML Injection to SSRF — Medium/@0x_xnum](https://medium.com/@0x_xnum/how-i-escalated-simple-html-injection-to-ssrf-via-pdf-rendering-682ea94b3194).
- **[HIGH]** **Unconditional `--no-sandbox` Puppeteer launch (Critical).** `packages/engine/src/services/browserManager.ts` unconditionally sets `--no-sandbox` and `--disable-setuid-sandbox`, disabling Chrome's process sandbox. HeyGen assumes Docker provides outer isolation, but README/quickstart do not require Docker — [HyperFrames browserManager.ts source](https://raw.githubusercontent.com/heygen-com/hyperframes/main/packages/engine/src/services/browserManager.ts), [Insecure Puppeteer Settings — Qwiet AI](https://qwiet.ai/vulnerability-fix-database/insecure-puppeteer-settings/), [Hacking Rendertron and Puppeteer — Medium/Gabor Matuz](https://medium.com/nerd-for-tech/hacking-puppeteer-what-to-expect-if-you-put-a-browser-on-the-internet-6c3dad0756db).
- **[HIGH]** **SSRF via AI-generated HTML compositions (High).** No network request interception is implemented. AI-generated compositions can make requests to internal network addresses (e.g., AWS EC2 metadata at 169.254.169.254, localhost, internal services). Compounds with the path traversal finding — file reads can be exfiltrated via outbound JavaScript — [HyperFrames source code](https://github.com/heygen-com/hyperframes), [HTML Injection to SSRF — Medium/@0x_xnum](https://medium.com/@0x_xnum/how-i-escalated-simple-html-injection-to-ssrf-via-pdf-rendering-682ea94b3194).
- **[MEDIUM]** **Absence of Content Security Policy in file server responses (Medium).** The HyperFrames file server sets no CSP headers on rendered HTML responses — rendered compositions have unrestricted script execution, unrestricted inline styles, and unrestricted resource loading from any origin. A default-deny CSP (e.g., `Content-Security-Policy: default-src 'none'; script-src 'self'`) would reduce the inline-script exploit surface as a defense-in-depth layer. Not a standalone vulnerability; partially mitigates F10 when combined with network isolation — source code analysis of file server responses.
- **[MEDIUM]** According to ZeroPath, multiple CVE databases, and the Ubuntu Security Notices (USN-7830-1 covering 2025 FFmpeg patches), HyperFrames uses system-installed FFmpeg without version pinning, exposing users with older installations to **CVE-2026-6385** (CVSS 6.5, heap out-of-bounds write, confirmed), **CVE-2026-30999** (heap buffer overflow in `av_bprint_finalize`, DoS, confirmed by Tenable), **CVE-2025-1373** (use-after-free in MOV parser, affects FFmpeg ≤7.1, SentinelOne-confirmed), plus seven memory-safety flaws found by ZeroPath AI research in 2025 — at least one (RFC4175 RTP integer overflow) has RCE potential. **Real-world severity is HIGH for users on unpatched systems** even though synthesis confidence remains MEDIUM (the specific CVE IDs CVE-2026-30998/30997 cited in earlier research could not be independently confirmed via WebSearch in the Security Reviewer pass) — [ZeroPath FFmpeg blog](https://zeropath.com/blog/autonomously-finding-7-ffmpeg-vulnerabilities-with-ai-2025), [CVE-2026-6385 — TheHackerWire](https://www.thehackerwire.com/vulnerability/CVE-2026-6385/), [FFmpeg Security Page](https://ffmpeg.org/security.html), [USN-7830-1 — Ubuntu Security Notices](https://ubuntu.com/security/notices/USN-7830-1), [OpenCVE FFmpeg](https://app.opencve.io/cve/?vendor=ffmpeg).

### Deterministic rendering broken by default

- **[HIGH]** Deterministic rendering is platform-conditional and broken by default in v0.4.4+. The `HeadlessExperimental.beginFrame` API was removed in Chromium 147; v0.4.4 changed the default to `forceScreenshot: true`. True determinism now requires explicit opt-in on Linux with a bundled `chrome-headless-shell` on Chromium below 147. macOS and Windows always use the non-deterministic screenshot mode — [HyperFrames Issue #294](https://github.com/heygen-com/hyperframes/issues/294), [Puppeteer Issue #11315](https://github.com/puppeteer/puppeteer/issues/11315).
- **[HIGH]** The screenshot fallback mode silently changes rendering semantics: it uses rAF-based timing rather than deterministic frame injection, producing inter-run variance from rAF scheduling, font loading, and external resource availability — [HyperFrames Issue #296](https://github.com/heygen-com/hyperframes/issues/296) (closed), [HyperFrames Issue #294](https://github.com/heygen-com/hyperframes/issues/294).

### Maturity and stability

- **[HIGH]** The repository was created 2026-03-10 and publicly launched approximately 2026-04-15 — a 5-week-old project with 3 human contributors, 2 of whom are HeyGen employees — [GitHub API](https://api.github.com/repos/heygen-com/hyperframes/contributors).
- **[HIGH]** v0.4.4 by semver convention signals unstable API. 21 open issues as of 2026-04-18 include installation failures (Issue #316), jerky preview (Issue #317), and asset path bugs (Issue #321). PR #328 exists with a workaround for the install failure — GitHub issue tracker.
- **[HIGH]** The README "production-ready" claim is not supported by evidence. It is contradicted by pre-1.0 semver, installation failures, broken-by-default determinism, two Critical (F8, F9) and two High (F10, F11) security findings (F11 is MEDIUM confidence and deferred to Security Reviewer; the count follows the synthesis's severity classification regardless of confidence rating), and no publicly documented external production deployments — [HyperFrames README](https://github.com/heygen-com/hyperframes), GitHub issue tracker, source code analysis.
- **[HIGH]** No independent rendering performance benchmarks exist. Neither researcher found public data on render time per minute, memory usage, or parallelization — both researchers searched; absence of data is confirmed — both research briefs.
- **[MEDIUM]** According to Issue #300 (first-party), the repository is ~554MB and causes `npx` skills add to time out at the 60-second clone step; Chromium is downloaded at install time (~300MB+) — [GitHub Issue #300](https://github.com/heygen-com/hyperframes/issues/300).
- **[MEDIUM]** No community discourse (HN, Reddit, Stack Overflow) was found as of 2026-04-18. Both researchers searched; the absence reflects insufficient adoption to generate external user criticism at this point.

### Claims verification

- **[MEDIUM]** The "AI-first" framing is partially marketing. Architecturally genuine (HTML-native, non-interactive CLI design) but overstated: no LLM API integration in the rendering engine, and no AI-generated HTML validation before unsandboxed rendering — source code inspection, README, CONTRIBUTING.md.
- **[UNVERIFIED]** ⚠️ **Unverified:** The README claims 50+ ready-to-use blocks and components, but these are served from an external HeyGen-hosted registry, not from the open-source repository. No independent count or quality review is possible without running the registry system — [HyperFrames README](https://github.com/heygen-com/hyperframes). Omitted from the verdict as non-load-bearing.

### Governance and lock-in risk

- **[MEDIUM]** HeyGen launched HyperFrames as part of a deliberate multi-channel developer ecosystem play (MCP server + Skills + Direct API + HyperFrames). The component registry is HeyGen-hosted — a potential lock-in vector even on an Apache 2.0 core — [Sacra — HeyGen revenue](https://sacra.com/c/heygen/), [HeyGen MCP server](https://www.heygen.com/model-context-protocol).

---

## Alternatives

### Remotion (closest framework analog)

- **[MEDIUM]** Remotion requires a React/TSX build pipeline, triggers a company license at 4+ employees or >$1M ARR, and reports **60K–170K weekly npm downloads depending on analytics source** — PkgPulse (March 2026) reports ~60K while ngram.com (early 2026) reports 169,900 for the same period; the two T2 sources diverge nearly 3x and neither exposes full methodology, so the range is given rather than a single figure (verify current data at [npmjs.com](https://www.npmjs.com/package/remotion)) — [Remotion license docs](https://www.remotion.dev/docs/license), [BuildPilot comparison 2026](https://trybuildpilot.com/363-remotion-vs-motion-canvas-vs-revideo-2026), [PkgPulse — Remotion vs Motion Canvas vs Revideo](https://www.pkgpulse.com/blog/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026), [ngram.com — Remotion's 150K Installs on skills.sh](https://www.ngram.com/blog/industry-news/remotion-skills-sh-ai-video-creation). Pricing has been revised upward at least once (a price increase announcement exists at `remotion.pro/price-increase`); verify current pricing at [remotion.dev/license](https://www.remotion.dev/docs/license) rather than relying on a static figure.
- **[HIGH]** Remotion launched native Claude Code agent skills in January 2026, narrowing HyperFrames' "AI-first" differentiator. The remaining gap is HyperFrames' HTML-native input vs. Remotion's required React pipeline — [Remotion Claude Code docs](https://www.remotion.dev/docs/ai/claude-code), [StartupHub.ai — Remotion AI Video](https://www.startuphub.ai/ai-news/general/2026/remotion-ai-video-makes-production-code-from-plain-prompts).
- **[MEDIUM]** According to ngram.com's early-2026 industry analysis, Remotion's Claude Code agent skill reached **150,000 installs in 8 weeks** on skills.sh after its January 2026 launch, making it the #1 skill in the video category and #5 most-installed overall (ahead of skills from Microsoft Azure and other platform companies). This is a distribution channel not captured in npm metrics and represents distinct agent-ecosystem adoption — *caveat: install count is a popularity signal; skills.sh has no formal quality review or retention metric, so the figure should not be read as a quality or retention signal* — [ngram.com — Remotion's 150K Installs on skills.sh](https://www.ngram.com/blog/industry-news/remotion-skills-sh-ai-video-creation).
- **[HIGH]** Remotion 5.0+ mandates telemetry reporting (`licenseKey`) for render-based company licenses. Environments with outbound telemetry restrictions should verify compliance at [remotion.dev/docs/license](https://www.remotion.dev/docs/license) before adopting. Enterprise license tier allows opt-out via monthly usage reports — [Remotion license docs](https://www.remotion.dev/docs/license).
- **[MEDIUM]** Remotion's HTML-in-Canvas API (experimental, Chromium-flag-gated as of v4.0.448) is under active development and could reduce HyperFrames' HTML-native differentiator if it exits experimental status and drops the React composition requirement. As of 2026-04-18 it still requires an explicit Chromium experimental flag and renders HTML within a React composition — so HyperFrames' HTML-native advantage stands, but the gap is directionally narrowing. Monitor at the 6-month re-evaluation — [remotion.dev/docs](https://www.remotion.dev/docs), Remotion v4.0.448+ changelog.
- **Choose Remotion when:** Production stability matters, React is already in the stack, team is <4 employees or under $1M ARR (so licensing is free), or agent skills maturity outweighs HTML-native simplicity.

### Intermediate open-source alternatives (Rendervid, Rendiv, OpenMontage)

- **[HIGH]** A set of 2025–2026 open-source agent-optimized video rendering tools exist as an intermediate tier between Remotion and HyperFrames. **Rendervid** (github.com/QualityUnit/rendervid) is a JSON-template-based engine with built-in MCP server integration, 11 purpose-built agent tools, and deployment to AWS Lambda / Azure Functions / Google Cloud Run / Docker — licensed under the **FlowHunt Attribution License (attribution required — footer link or README mention; commercial use is otherwise unrestricted at any scale)**, 21 GitHub stars as of 2026-04-18 (minimal adoption vs Remotion). **Rendiv** (github.com/thecodacus/rendiv) is React + TypeScript; licensed under **Apache 2.0** (confirmed by explicit LICENSE file and README statement "Apache License 2.0 © Rendiv Contributors" — the most permissive of the three intermediate options: commercial use unrestricted, no attribution required). **OpenMontage** (github.com/calesthio/OpenMontage) is React/Remotion-based, licensed under **GNU AGPLv3 — network-use copyleft: any hosted or SaaS deployment incorporating OpenMontage must open-source the entire application stack**; **[MEDIUM]** OpenMontage has **~800–2,600 stars as of 2026-04-18 (source counts vary — independent sources return 791–1,500 stars and 140–286 forks; the initial Challenger figure reported 2,600/488)**, representing emerging community traction significantly more established than Rendervid's 21 stars — [GitHub — QualityUnit/rendervid](https://github.com/QualityUnit/rendervid), [GitHub — thecodacus/rendiv](https://github.com/thecodacus/rendiv), [GitHub — calesthio/OpenMontage](https://github.com/calesthio/OpenMontage), [Rendervid — FlowHunt blog](https://www.flowhunt.io/blog/rendervid-free-remotion-alternative-ai-video-generation/).
- **[HIGH]** None of these intermediate entrants are HTML-native — they use JSON templates or React/TSX, so HyperFrames' HTML-native differentiator stands. Their security postures were not independently assessed — primary source (GitHub repository inspection).
- **Choose an intermediate open-source tool when:** Remotion's licensing friction (4+ employees or >$1M ARR) rules it out AND HyperFrames' security posture rules it out AND HTML-native input is not required. Licensing and adoption differ materially across the three options and must be matched to deployment model: **OpenMontage** has the strongest community signal (~800–2,600 stars; source counts vary — significantly more community traction than Rendervid's 21 stars) but its AGPLv3 network-use copyleft disqualifies it for closed-source hosted/SaaS deployments — choosing OpenMontage commits you to open-sourcing the entire application stack that incorporates it. **Rendervid** is permissive (FlowHunt attribution-only — footer link or README mention; commercial use otherwise unrestricted at any scale) and suitable for closed-source commercial use, but has minimal adoption (21 stars). **Rendiv** is Apache 2.0 — the most permissive of the three (commercial use unrestricted, no attribution required). None require SYS_ADMIN-capable infrastructure.

### SaaS API alternatives (Creatomate, Shotstack, Bannerbear, Plainly)

- **[MEDIUM]** According to current pricing pages, Creatomate starts at **$41/month (entry tier, 144 min of video at 720p)** as of 2026-04-18 — verify at [creatomate.com/pricing](https://creatomate.com/pricing). Shotstack is $0.20/minute on the subscribe tier, Bannerbear is $49/month for 1,000 credits, and Plainly Videos is $69/month for 50 render minutes. All are cloud-rendered and designed for template automation, not AI-agent composition workflows — [Creatomate pricing](https://creatomate.com/pricing), [G2 Creatomate pricing](https://www.g2.com/products/creatomate-creatomate/pricing), [Capterra Creatomate](https://www.capterra.com/p/268283/Creatomate/pricing/), plus prior T3 pricing sources for Shotstack/Bannerbear/Plainly.
- **Choose a SaaS API when:** Rendering must happen remotely, credit-based economics fit the workload, no agent-native composition is needed, or operational simplicity outweighs cost per minute.

### Do nothing / defer

- **Choose deferral when:** No active project requires programmatic video output; the risk/maturity tradeoff does not yet justify vendor evaluation or hands-on testing.

### Comparison table

| Option | Input format | Rendering | Licensing | Agent-native | Maturity | |--------|--------------|-----------|-----------|--------------|----------| | HyperFrames v0.4.4 | HTML + data-* attributes | Local (headless Chromium + FFmpeg) | Apache 2.0 (BDFL governance) | Yes (HTML-native) | Pre-1.0, 5 weeks old | | Remotion | React/TSX | Local or Remotion Lambda | Free <4 emp / <$1M ARR; paid company license otherwise (verify current pricing) | Yes (Claude Code skills added Jan 2026; 150K skills.sh installs in 8 weeks — popularity signal, no formal quality/retention metric) | Mature, 60K–170K weekly downloads (source-dependent) | | Rendervid | JSON template | Local / serverless (AWS Lambda, Azure Functions, Cloud Run, Docker) | FlowHunt Attribution License — attribution required (footer link or README mention); commercial use is otherwise unrestricted at any scale | Yes (ships MCP server + 11 agent tools) | Early-stage, 21 stars, minimal adoption, unassessed security | | Rendiv | React/TSX | Local | Apache 2.0 (most permissive of the three intermediate options — commercial use unrestricted, no attribution required) | Partial | Early-stage, unassessed security | | OpenMontage | React/TSX (Remotion-based) | Local | GNU AGPLv3 — network-use copyleft; hosted/SaaS deployment requires open-sourcing your application stack | Partial | Emerging community, ~800–2,600 stars (source counts vary; significantly more established than Rendervid's 21 stars), unassessed security | | Creatomate | JSON templates | Cloud | SaaS subscription (from $41/mo) | No | Mature | | Shotstack | JSON/Edit API | Cloud | Pay-per-minute ($0.20/min subscribe) | No | Mature | | Bannerbear | JSON templates | Cloud | SaaS subscription | No | Mature | | Plainly | AE-template-based | Cloud | SaaS subscription | No | Mature |

---

## Counterarguments & Risks

- **"HeyGen's brand recognition and $95M ARR should buy confidence."** Financial stability funds the project but does not substitute for pre-1.0 code maturity or patched security findings. The BDFL governance model also means HeyGen — not the community — controls roadmap direction [F16, F20, HIGH + MEDIUM].
- **"Docker provides the outer sandbox compensating for `--no-sandbox`."** True if Docker is used AND configured correctly. README and quickstart do not require Docker, and the Docker privilege requirements for a secure Puppeteer/Chromium deployment (`--cap-add=SYS_ADMIN` with a seccomp profile is the correct pattern; `--privileged` is the insecure workaround) are undocumented in HyperFrames as of 2026-04-18. Puppeteer's own troubleshooting documentation confirms `--cap-add=SYS_ADMIN` + seccomp as the production pattern.
- **"Determinism was Remotion's advantage too — it's an implementation detail."** Not accurate. HyperFrames marketed deterministic rendering as a core feature; v0.4.4 changed the default to non-deterministic screenshot mode without obvious user-facing messaging. The architectural intent is sound but implementation depends on an experimental API Chromium has deprecated [F7, HIGH].
- **"4,337 stars in 5 weeks means the market has validated this."** Stars are attention, not adoption. There is no community discourse (HN, Reddit, SO), no non-HeyGen contributors with merge rights, and no publicly documented production deployments [F5, F24, HIGH + MEDIUM].

## Gaps & Unknowns

- **Rendering performance benchmarks.** Without render time per minute, memory usage, and parallelization data, cost comparison against Remotion Lambda or SaaS API credits for at-scale workloads is impossible [F25, HIGH gap confirmed].
- **Docker container privilege requirements for HeyGen's intended deployment model.** HeyGen has not published a Docker configuration. Puppeteer's documented pattern is `--cap-add=SYS_ADMIN` with a seccomp profile; `--privileged` is insecure. Managed container platforms (GKE Autopilot, AWS Fargate, Fly.io) do not grant `SYS_ADMIN` — meaning HyperFrames' Docker-isolation path is unavailable on those runtimes.
- **Migration path for `HeadlessExperimental.beginFrame`.** The Puppeteer maintainer closed Issue #11315 as "not planned". Whether Chrome DevTools Protocol will introduce a stable replacement is unknown.
- **HeyGen's internal production use.** Whether HeyGen uses the published open-source build or a hardened proprietary fork is undisclosed.
- **Remotion weekly npm download count.** Two T2 sources (PkgPulse and ngram.com) report 60K–170K for the same period (PkgPulse March 2026 ~60K; ngram.com March 2026 169,900); neither exposes full methodology. Check [npmjs.com](https://www.npmjs.com/package/remotion) for current data.
- **Security postures of intermediate open-source alternatives (Rendervid, Rendiv, OpenMontage).** Not independently assessed; adoption ranges from minimal (Rendervid at 21 stars) to emerging (OpenMontage at ~800–2,600 stars), and external security review is sparse for all three.
- **Quality / retention signal for Remotion's skills.sh installs.** skills.sh publishes install counts but has no formal quality review or retention metric; the 150K figure is popularity only and cannot be read as a quality or retention signal.
- **Remotion HTML-in-Canvas API trajectory.** The API is experimental and Chromium-flag-gated as of v4.0.448, and still requires React composition. Whether and when it exits experimental status, drops the Chromium flag, and/or becomes usable outside a React composition is unknown — monitor at the 6-month re-evaluation at [remotion.dev/docs](https://www.remotion.dev/docs).

## Confidence Summary

- HIGH: 17 findings | MEDIUM: 10 findings | LOW: 0 | UNVERIFIED: 1 flagged (F14, "50+ components")

## Sources

- [HyperFrames README](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md)
- [HyperFrames Prompting Guide](https://hyperframes.heygen.com/guides/prompting)
- [HyperFrames CONTRIBUTING.md](https://github.com/heygen-com/hyperframes/blob/main/CONTRIBUTING.md)
- [HyperFrames fileServer.ts source](https://raw.githubusercontent.com/heygen-com/hyperframes/main/packages/engine/src/services/fileServer.ts)
- [HyperFrames browserManager.ts source](https://raw.githubusercontent.com/heygen-com/hyperframes/main/packages/engine/src/services/browserManager.ts)
- [HyperFrames Issue #294](https://github.com/heygen-com/hyperframes/issues/294)
- [HyperFrames Issue #296](https://github.com/heygen-com/hyperframes/issues/296)
- [HyperFrames Issue #300](https://github.com/heygen-com/hyperframes/issues/300)
- [GitHub API — heygen-com/hyperframes/contributors](https://api.github.com/repos/heygen-com/hyperframes/contributors)
- [Puppeteer Issue #11315](https://github.com/puppeteer/puppeteer/issues/11315)
- [Replit — browsers don't want to be cameras](https://blog.replit.com/browsers-dont-want-to-be-cameras)
- [HTML Injection to SSRF — Medium/@0x_xnum](https://medium.com/@0x_xnum/how-i-escalated-simple-html-injection-to-ssrf-via-pdf-rendering-682ea94b3194)
- [Insecure Puppeteer Settings — Qwiet AI](https://qwiet.ai/vulnerability-fix-database/insecure-puppeteer-settings/)
- [Hacking Rendertron and Puppeteer — Medium/Gabor Matuz](https://medium.com/nerd-for-tech/hacking-puppeteer-what-to-expect-if-you-put-a-browser-on-the-internet-6c3dad0756db)
- [ZeroPath FFmpeg blog](https://zeropath.com/blog/autonomously-finding-7-ffmpeg-vulnerabilities-with-ai-2025)
- [CVE-2026-6385 — TheHackerWire](https://www.thehackerwire.com/vulnerability/CVE-2026-6385/)
- [FFmpeg Security Page](https://ffmpeg.org/security.html)
- [USN-7830-1 — Ubuntu Security Notices](https://ubuntu.com/security/notices/USN-7830-1)
- [OpenCVE FFmpeg](https://app.opencve.io/cve/?vendor=ffmpeg)
- [Sacra — HeyGen revenue](https://sacra.com/c/heygen/)
- [HeyGen MCP server](https://www.heygen.com/model-context-protocol)
- [Remotion license docs](https://www.remotion.dev/docs/license)
- [Remotion Claude Code docs](https://www.remotion.dev/docs/ai/claude-code)
- [StartupHub.ai — Remotion AI Video](https://www.startuphub.ai/ai-news/general/2026/remotion-ai-video-makes-production-code-from-plain-prompts)
- [BuildPilot comparison 2026](https://trybuildpilot.com/363-remotion-vs-motion-canvas-vs-revideo-2026)
- [PkgPulse — Remotion vs Motion Canvas vs Revideo](https://www.pkgpulse.com/blog/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)
- [ngram.com — Remotion's 150K Installs on skills.sh](https://www.ngram.com/blog/industry-news/remotion-skills-sh-ai-video-creation)
- [GitHub — QualityUnit/rendervid](https://github.com/QualityUnit/rendervid)
- [GitHub — thecodacus/rendiv](https://github.com/thecodacus/rendiv)
- [GitHub — calesthio/OpenMontage](https://github.com/calesthio/OpenMontage)
- [Rendervid — FlowHunt blog](https://www.flowhunt.io/blog/rendervid-free-remotion-alternative-ai-video-generation/)
- [Creatomate pricing](https://creatomate.com/pricing)
- [G2 Creatomate pricing](https://www.g2.com/products/creatomate-creatomate/pricing)
- [Capterra Creatomate](https://www.capterra.com/p/268283/Creatomate/pricing/)
