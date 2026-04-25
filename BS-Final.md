# BrainStorming Final Technical Review and Strategic Plan

## 1. Executive Summary

BrainStorming is a local Claude Code research pipeline and Markdown knowledge base for evaluating tools, frameworks, libraries, and technical ideas before adoption. It is not a conventional web application: there is no frontend, backend API, authentication layer, database, or deployed service in the repository. The product surface is a command-driven research workflow using `.claude/skills`, `.claude/agents`, topic folders, and Node.js utility scripts.

The project has a strong conceptual foundation. It defines explicit research phases, adversarial review, security review triggers, quality scoring, citation checking, staleness checks, topic validation, archiving, and benchmark reporting. The best part of the system is its workflow design: it treats research as a gated pipeline rather than a loose note-taking process.

The main risks are operational rather than runtime application risks. The repository currently lacks CI, automated tests, a lockfile, dependency audit readiness, schema validation, release hygiene, and enforceable publication controls. The most important concrete finding is state drift in `topics/markitdown/_pipeline/state.json`: generated artifacts indicate completed critic, security, stress-test, and evidence phases, while state metadata still records many phases as pending or zeroed. This undermines benchmark accuracy, resumption reliability, and leadership trust in the pipeline metrics.

The highest-value next steps are to add CI for all validators, fix state/schema drift, harden public-release hygiene around `_pipeline/` artifacts, add a real test suite for scripts, create a lockfile and Node version policy, improve citation and staleness tooling, and make the product easier to operate through a documented command lifecycle.

## 2. Review Scope and Methodology

Reviewed the project from the repository root at `C:\ClaudeProjects\BrainStorming`.

Scope included:

- Root files: `README.md`, `CLAUDE.md`, `package.json`, `config.json`, `.gitignore`, `.claudeignore`, `index.md`, `archived-topics.md`, `diagram.md`.
- Claude workflow definitions in `.claude/agents/` and `.claude/skills/`.
- Utility scripts in `scripts/`.
- Published topic content under `topics/`.
- Pipeline artifacts under `topics/*/_pipeline/`.
- Generated reports under `topics/_meta/` after running report scripts.
- Security-sensitive patterns, secret-like strings, ignored files, generated artifacts, and network-touching scripts.

No frontend, backend routes, database schema, migrations, container files, infrastructure-as-code, or CI/CD workflows were found.

### Commands Run

| Command | Purpose | Result |
|---|---|---|
| `Get-ChildItem -Force` | Inspect project root | Passed |
| `rg --files -g '!node_modules' -g '!dist' -g '!build' -g '!coverage' -g '!vendor'` | Inventory tracked project files | Passed |
| `git status --short` | Check working tree before/after review | Passed; generated reports are now untracked |
| `Get-Content -Raw package.json` | Inspect scripts and package metadata | Passed |
| `Get-Content -Raw README.md` | Review project documentation | Passed |
| `Get-Content -Raw CLAUDE.md` | Review Claude operating instructions | Passed |
| `Get-Content -Raw config.json` | Review configuration | Passed |
| `Get-Content -Raw .gitignore` | Review source-control hygiene | Passed |
| `Get-ChildItem -Recurse -Force .claude` | Inspect agent and skill assets | Passed |
| `rg -n "TODO|FIXME|...|secret|token|..."` | Search security-sensitive and maintenance markers | Passed; no verified secrets found, but security-related content exists in research files |
| `npm run topic-validate:all` | Validate published topic structure | Passed: all 2 topics passed |
| `npm run validate-pipeline-state` | Validate pipeline state metadata | Failed functionally: 1 of 2 topics has 20 state issues |
| `npm run regenerate-index-dry` | Dry-run index rebuild | Passed; revealed regenerated labels differ from hand-authored index |
| `npm audit --audit-level=moderate` | Dependency audit | Failed: no lockfile exists |
| `npm run check-staleness -- --json` | Staleness check | Exited 0 but did not output JSON and skipped both topics despite `created` frontmatter |
| `npm run pipeline-preflight -- markitdown --mode evaluate --json` | Preflight existing topic | Warning/failure exit; reported prior run and 20 state integrity issues |
| `npm run verify-citations:all` | Verify published topic URLs | Failed: `markitdown` had 22 OK, 1 DEAD, 41 ERROR; `markitdown-codex-version` had 33 OK |
| `node --check` over all `scripts/*.js` | Syntax-check scripts | Passed |
| `npm run bench-report` | Generate pipeline benchmark report | Passed; wrote `topics/_meta/bench-report-2026-04-25.md` |
| `npm run archive-topic:list -- --json` | Check archived topics | Passed; no archived topics |
| `trufflehog filesystem . --only-verified --no-update` | Attempt verified secret scan | Not run: `trufflehog` not installed |

Limitations:

- I did not install new tools or dependencies.
- I did not run destructive commands or repair state with `--write`.
- Citation checks depend on network behavior, site blocking, TLS/proxy behavior, and remote availability.
- This review assesses the repository as provided, not private history or external deployment environments.

## 3. Application Overview

BrainStorming appears to solve the problem of repeatable, evidence-backed technical research. It helps a user evaluate technical tools or ideas and publish a topic dossier with:

- `overview.md`: what the topic is, context, concepts, and sources.
- `notes.md`: evidence-backed findings, caveats, confidence, and gaps.
- `verdict.md`: recommendation, risks, alternatives, next steps, and quality score.

Primary users are likely technical leaders, architects, senior engineers, AI/RAG builders, and product or platform teams that need defensible adoption recommendations before choosing libraries, frameworks, vendors, or implementation approaches.

The workflow supports `/research`, `/quick`, `/compare`, `/evaluate`, `/recommend`, and `/cross-analyze` through `.claude/skills/*.md` and the Director agent at `.claude/agents/director.md`.

## 4. Project Structure and Architecture

The repository is organized around content, orchestration instructions, and local automation:

| Area | Evidence / Location | Purpose |
|---|---|---|
| Root docs | `README.md`, `CLAUDE.md`, `diagram.md` | Public explanation, operating rules, pipeline diagrams |
| Package manifest | `package.json` | Node script entry points; no dependencies declared |
| Configuration | `config.json` | Contains only `max_run_budget_usd` |
| Claude agents | `.claude/agents/*.md` | Role definitions for Director, Researcher, Investigator, Analyzer, Writer, Critic, Security Reviewer, Tester, Challenger, Publisher |
| Claude skills | `.claude/skills/*/SKILL.md` | Entry-point dispatch instructions for workflows |
| Utility scripts | `scripts/*.js` | Topic scaffolding, validation, citation checking, staleness, benchmarking, archiving |
| Published topics | `topics/{slug}/overview.md`, `notes.md`, `verdict.md` | Public knowledge-base output |
| Pipeline artifacts | `topics/{slug}/_pipeline/*` | State, evidence, drafts, scorecards, stress tests, citation checks |
| Indexes | `index.md`, `archived-topics.md`, `topics/index.md` | Topic registry |

Architecture pattern:

- Local filesystem is the database.
- Markdown files are both product output and source of truth for published knowledge.
- JSON state files under `_pipeline/` are intended to be the resumable workflow source of truth.
- Node.js scripts provide validation and reporting.
- Claude agent prompt files define most application behavior.

There are no API routes, auth flows, database models, migrations, frontend components, or deployment manifests in the repository.

## 5. Technical Strengths

- Strong pipeline design: `.claude/agents/director.md` defines intake, research, gap-fill, analysis, writing, critic gate, security review, stress testing, adversarial challenge, publishing, and delivery.
- Clear role separation across agents: researcher, investigator, analyzer, writer, critic, security reviewer, tester, challenger, publisher.
- Evidence mindset is built in: `README.md` and `CLAUDE.md` require confidence ratings and source-backed claims.
- Security review is first-class: `.claude/agents/security-reviewer.md` includes severity calibration, CVE/advisory checks, compliance prompts, and PASS/FLAG/BLOCK criteria.
- Utility scripts cover real operational needs: `topic-validate.js`, `validate-pipeline-state.js`, `verify-citations.js`, `check-staleness.js`, `bench-report.js`, `archive-topic.js`, and `topic-init.js`.
- Manual smoke tests exist in `scripts/smoke-tests.md`, covering sparse evidence, security review, rewrite paths, comparison workflow, and resumption.
- No runtime dependencies are currently declared, reducing immediate npm supply-chain exposure.
- Topic content uses a consistent three-file contract.

## 6. Key Risks and Gaps

| Risk | Evidence | Why It Matters |
|---|---|---|
| Pipeline state drift | `npm run validate-pipeline-state` found 20 issues for `topics/markitdown/_pipeline/state.json` | Breaks resumption, metrics, benchmark reports, and leadership confidence |
| Public-release hygiene mismatch | `README.md` says pipeline audit artifacts are omitted, but `topics/*/_pipeline/` exists in repo | May expose user requests, private context, drafts, audit detail, or sensitive metadata |
| No CI/CD | No `.github/`, workflow files, or equivalent CI config found | Validators and citation checks depend on manual execution |
| No automated test suite | Only `scripts/smoke-tests.md`; no `test` script in `package.json` | Script regressions can ship silently |
| No lockfile | `npm audit` failed with ENOLOCK | Reproducibility and audit automation are blocked |
| Staleness script bug | `npm run check-staleness -- --json` skipped topics that contain `created` frontmatter and ignored JSON output mode | Staleness governance is unreliable |
| Citation reliability gap | `verify-citations:all` failed for `markitdown`: 1 dead URL and 41 errors | Published research may rot or use verifier-hostile sources |
| Tooling is parser-fragile | Multiple custom frontmatter/table parsers in `scripts/*.js` | CRLF, quoting, YAML arrays, and table formatting can break behavior |
| Product discoverability is limited | README lists workflows but no end-to-end quickstart with examples and expected outputs | New users may not know how to operate or recover the pipeline |

## 7. Security Review

No hardcoded production credentials, API keys, private key material, `.env` files, certificate files, Docker secrets, or cloud credentials were verified in the repository using pattern searches. `trufflehog` was not installed, so verified secret scanning could not be completed.

| Severity | Finding | Evidence / Location | Impact | Recommendation |
|---|---|---|---|---|
| Critical | No critical exploitable application vulnerability verified | No running service, auth layer, database, or API surface exists in repo | Runtime exploitability is limited because this is a local content pipeline | Continue treating this as local tooling until a service layer exists |
| High | Public artifact leakage risk from committed `_pipeline/` directories | `README.md` says public edition omits pipeline audit artifacts; repo contains `topics/markitdown/_pipeline/` and `topics/markitdown-codex-version/_pipeline/` | User requests, drafts, internal reasoning, cost/token data, and adversarial findings may be exposed in public mirrors | Decide whether `_pipeline/` is public product data or private audit data; if private, add `topics/*/_pipeline/` to `.gitignore` and publish sanitized exports |
| High | Secret scanning is documented but not enforced | `README.md` recommends `trufflehog`; command was unavailable locally; no CI exists | Secrets or private identifiers can be published by mistake | Add CI secret scanning with TruffleHog or Gitleaks and fail releases on verified findings |
| High | Agent/source prompt-injection risk is not explicitly controlled | Agents use WebSearch/WebFetch and consume untrusted web content; `.claude/agents/*` grant Write access in several roles | Malicious source text could influence generated reports, state files, or published recommendations | Add a prompt-injection policy to Researcher/Investigator/Analyzer; treat source instructions as data; require source-content quarantine language |
| Medium | Citation checker can make arbitrary outbound HTTP/HTTPS requests from topic content | `scripts/verify-citations.js` extracts URLs and follows redirects | If malicious topic content is added, running citation checks inside a corporate network could probe internal or sensitive endpoints via redirects | Add private-IP, localhost, link-local, and internal-domain denylist after DNS resolution; cap redirects; log final host |
| Medium | No lockfile blocks audit and reproducible installs | `npm audit --audit-level=moderate` failed with ENOLOCK; no `package-lock.json` | Future dependencies cannot be reliably audited or reproduced | Commit a lockfile and add `npm ci` plus `npm audit` to CI |
| Medium | `package.json` sets `"private": false` | `package.json` | Accidental npm publication is possible if package metadata grows | Set `"private": true` unless this is intentionally published as an npm package |
| Medium | State files store raw user request text | `topics/*/_pipeline/state.json` contains `user_request` | May retain private URLs, customer names, internal context, or sensitive prompts | Add redaction/sanitization before public export; document retention policy |
| Low | `pipeline-preflight.js` uses `execSync` with string command construction | `scripts/pipeline-preflight.js` builds a command string in `runValidateState` | Current slug validation reduces exploitability, but the pattern is brittle | Replace with `spawnSync(process.execPath, [scriptPath, ...args])` |
| Low | Ignore files do not cover common sensitive outputs | `.gitignore` lacks `.env*`, `*.pem`, `*.key`, `*.p12`, generated `_meta/`, and `_pipeline/` if private | Accidental sensitive file commits are easier | Expand `.gitignore` based on intended publication model |
| Informational | No auth, authorization, CSRF, CORS, session, or database security review applies | No web server, API routes, database, or frontend found | These concerns become relevant only if BrainStorming becomes a service | Reassess if a web UI, API, or shared service is added |

## 8. Code Quality and Maintainability Review

The scripts are readable and narrowly scoped, but they rely heavily on custom parsing and filesystem conventions.

Positive observations:

- Scripts use simple Node standard-library APIs and avoid unnecessary dependencies.
- Most scripts have help output and explicit exit codes.
- `topic-validate.js` and `validate-pipeline-state.js` encode useful domain checks.
- `verify-citations.js` has clear separation between URL extraction, checking, and reporting.
- `topic-init.js` validates slugs before writing.

Maintainability concerns:

- Frontmatter parsing is duplicated across `regenerate-index.js`, `topic-validate.js`, and `check-staleness.js`.
- Table parsing is duplicated or custom in `archive-topic.js` and `bench-diff.js`.
- `check-staleness.js` declares `outputJson` but does not emit JSON; the observed command printed Markdown.
- `check-staleness.js` appears CRLF-sensitive because it skipped topics with visible `created` frontmatter.
- `bench-report.js` can classify `markitdown` as incomplete even when published artifacts exist, because it trusts stale state fields.
- Several scripts write generated output by default (`bench-report.js`, `verify-citations.js`) without a dry-run flag.
- There is no shared schema for `state.json`, `evidence.json`, frontmatter, or benchmark reports.
- There is no formatter, linter, or type checker.

Recommended engineering direction:

- Create a shared `scripts/lib/` for frontmatter, topic discovery, state loading, Markdown tables, and safe path handling.
- Add JSON Schema or Zod-style validation for `state.json` and `evidence.json`.
- Add unit tests around every script behavior that can mutate files.
- Normalize line endings and make parsers CRLF-safe.
- Separate read-only checks from report-generating commands.

## 9. Testing and Quality Assurance Review

Current state:

- `node --check` passes for all JavaScript scripts.
- `npm run topic-validate:all` passes.
- `npm run validate-pipeline-state` detects real drift.
- `scripts/smoke-tests.md` defines useful manual regression scenarios.
- There is no automated test runner, no `npm test`, no fixtures, and no CI.

Testing gaps:

- No unit tests for argument parsing, slug validation, frontmatter parsing, Markdown table parsing, or state repair.
- No snapshot tests for generated reports.
- No test fixtures for CRLF vs LF Markdown.
- No tests for malformed `state.json` or `evidence.json`.
- No tests for citation redirects, timeouts, auth-gated URLs, or private network blocking.
- No regression test that asserts `check-staleness --json` actually returns JSON.

Recommended test strategy:

- Add `node:test` or Vitest tests for all scripts.
- Add fixture topics under `scripts/test-fixtures/`.
- Add golden snapshots for index, staleness, citation, and benchmark output.
- Add CI matrix on Windows and Linux because this repo is likely edited on Windows but may be published or automated on Linux.
- Treat `validate-pipeline-state`, `topic-validate:all`, syntax checks, secret scanning, and selected unit tests as required pre-merge checks.

## 10. Performance and Scalability Review

The current synchronous filesystem approach is acceptable for 2 topics and likely fine for dozens. Scaling concerns appear around hundreds or thousands of topics.

Risks:

- `verify-citations.js` checks URLs serially, which will be slow for large topic sets.
- Citation checking has no cache, so repeated runs recheck the same URLs.
- Citation checking writes JSON into each topic, increasing repository churn.
- `bench-report.js`, `check-staleness.js`, and validators scan all topic directories synchronously.
- Regex-based Markdown parsing can become slow and fragile as files grow.
- Large `_pipeline/` folders increase repository size quickly; current file count is already 131 files and about 5 MB for only 2 topics.

Recommendations:

- Add bounded concurrency and retry policy to citation checking.
- Cache URL results by URL and date under `topics/_meta/`.
- Add `--read-only`, `--write`, and `--output` flags consistently.
- Move private/heavy pipeline artifacts out of the public repo or compress/archive them.
- Add a machine-readable topic manifest to avoid repeated filesystem inference.

## 11. DevOps, Configuration, and Deployment Review

Current state:

- No CI workflow found.
- No Dockerfile or infrastructure files found.
- No Node version file found (`.nvmrc`, `.node-version`, or `engines` in `package.json`).
- No package lockfile found.
- No deployment target is defined.
- `config.json` only contains `max_run_budget_usd`.
- `.gitignore` excludes temp files, Claude sessions, `topics/_tmp/`, `node_modules/`, and OS artifacts.
- `.claudeignore` excludes `_archive/`, `_sentinal-report/`, and `CERTS/`.

Operational concerns:

- The repo depends on manual execution discipline.
- Generated artifacts are not clearly separated from source artifacts.
- Public/private export boundaries are not enforced.
- No release checklist exists beyond README guidance.
- No automated secret scanning or dependency audit exists.

Recommended baseline:

- Add GitHub Actions or equivalent CI.
- Add `package-lock.json`.
- Add `engines.node` and a `.nvmrc`.
- Add `npm test`, `npm run lint`, and `npm run validate`.
- Add `npm run preflight:all` that runs syntax checks, topic validation, state validation, staleness, and optional citations.
- Add a release/export script that copies only approved public files into a clean output directory.

## 12. Product, UX, and Interaction Review

Product positioning:

BrainStorming is a research operating system for technical decisions. Its differentiation is the explicit combination of source gathering, adversarial critique, security review, stress testing, evidence scoring, and publication.

Primary user journeys:

- Start a new topic through `/research`, `/evaluate`, `/compare`, or `/recommend`.
- Generate topic outputs in `topics/{slug}/`.
- Validate structure and state.
- Verify citations and staleness.
- Publish or archive topics.
- Cross-analyze patterns across prior research.

UX strengths:

- Workflow commands are easy to understand.
- The topic output contract is simple.
- The README provides a useful high-level mental model.
- Manual smoke tests show the intended failure modes.

UX gaps:

- No one-page "happy path" quickstart with exact commands and expected files.
- No recovery guide for state drift, failed citations, or partial runs.
- Duplicate/similar topics (`markitdown` and `markitdown-codex-version`) can confuse readers.
- `index.md` is useful but minimal; it does not show confidence, last checked date, citation health, or staleness.
- Error states are mostly terminal output, not persisted in an operator-friendly dashboard.
- There is no product analytics layer because this is local tooling, but operational metrics can still be tracked in benchmark reports.

Suggested metrics:

- Topics created per month.
- Percentage of topics passing validation.
- Citation health: OK/error/dead rate by topic.
- State drift count.
- Average quality score.
- Revision cycles per topic.
- Security review trigger rate.
- Topics stale or approaching stale threshold.
- Time from topic creation to publication.

## 13. Prioritized Recommendations

| Priority | Recommendation | Area | Effort | Impact | Rationale |
|---|---|---|---|---|---|
| P0: Immediate / blocking | Repair `topics/markitdown/_pipeline/state.json` or re-run the pipeline cleanly | Data integrity | Small | High | Current state drift breaks benchmark and resumption reliability |
| P0: Immediate / blocking | Decide and enforce public/private handling for `_pipeline/` artifacts | Security | Medium | High | Current repo conflicts with README public-edition promise |
| P0: Immediate / blocking | Add CI validation for syntax, topic structure, state integrity, and secret scanning | DevOps | Medium | High | Prevents known failures from recurring silently |
| P1: High priority | Add lockfile and Node version policy | Supply chain | Small | Medium | Enables `npm audit`, reproducible installs, and CI stability |
| P1: High priority | Fix `check-staleness.js` frontmatter parsing and `--json` behavior | Quality | Small | High | Current staleness governance is not trustworthy |
| P1: High priority | Add unit tests for scripts with fixtures | QA | Medium | High | Protects the core automation layer |
| P1: High priority | Harden `verify-citations.js` against private-network URL checks and redirects | Security | Medium | Medium | Reduces SSRF-like risk during local validation |
| P1: High priority | Add release/export script for sanitized public output | Security/Product | Medium | High | Makes public sharing safer and repeatable |
| P2: Medium priority | Consolidate parsing helpers into `scripts/lib/` | Maintainability | Medium | Medium | Reduces duplicated fragile parsing |
| P2: Medium priority | Add JSON schemas for `state.json` and `evidence.json` | Architecture | Medium | High | Creates enforceable contracts across agents and scripts |
| P2: Medium priority | Improve citation checker with concurrency, cache, and clearer error classification | Performance | Medium | Medium | Makes citation checks faster and less noisy |
| P2: Medium priority | Expand `index.md` with score, freshness, citation status, and workflow | Product | Small | Medium | Improves discoverability and stakeholder scanning |
| P3: Future improvement | Build a local static dashboard from topic metadata | Product/UX | Large | Medium | Makes the knowledge base easier to browse |
| P3: Future improvement | Add import/export packaging for public mirrors | Operations | Medium | Medium | Supports sanitized distribution |
| P3: Future improvement | Add optional semantic claim verification workflow | Research quality | Large | High | Moves beyond URL reachability toward claim support validation |

## 14. 30/60/90-Day Improvement Plan

### First 30 Days

- Repair or regenerate `topics/markitdown/_pipeline/state.json`.
- Fix `check-staleness.js` so CRLF frontmatter parses and `--json` returns JSON.
- Add `package-lock.json`, `.nvmrc`, and `engines.node`.
- Set `"private": true` in `package.json` unless npm publication is intended.
- Add `.gitignore` entries for `.env*`, key/cert files, and generated reports.
- Decide whether `_pipeline/` is public or private; update README and ignore/export behavior accordingly.
- Add a basic CI workflow for `node --check`, `topic-validate:all`, `validate-pipeline-state`, and secret scanning.
- Fix the dead `github.com/microsoft/markitdown/blob/main/pyproject.toml` citation in `topics/markitdown`.

### Days 31-60

- Add unit tests for all scripts using fixtures.
- Create shared parser utilities under `scripts/lib/`.
- Add schema validation for state and evidence files.
- Add safe process invocation in `pipeline-preflight.js`.
- Add private-network protections and bounded concurrency to `verify-citations.js`.
- Add a release/export script that produces a sanitized public folder.
- Add operator docs: start topic, resume topic, validate, publish, archive, recover.

### Days 61-90

- Build a richer topic index or static dashboard.
- Add citation cache and historical citation health metrics.
- Add benchmark trend reports and `bench-diff` CI artifacts.
- Add product metrics to topic metadata.
- Add optional semantic citation/claim verification.
- Formalize governance: review cadence, stale thresholds, release checklist, and ownership.

## 15. Suggested Engineering Backlog

### Title: Repair MarkItDown Pipeline State

Description: Bring `topics/markitdown/_pipeline/state.json` into alignment with scorecard, security review, stress test, evidence, and published files.

Priority: P0

Acceptance criteria:

- `npm run validate-pipeline-state` reports 0 issues.
- `npm run bench-report` classifies both current topics accurately.
- Updated state preserves existing evidence and does not delete artifacts.

### Title: Define Public Export Boundary

Description: Decide whether `_pipeline/` artifacts are public or private and implement an export flow.

Priority: P0

Acceptance criteria:

- README accurately describes what is public.
- Export command produces a clean public directory.
- Private artifacts are excluded or explicitly sanitized.
- CI checks fail if forbidden private paths appear in public export.

### Title: Add CI Baseline

Description: Add a workflow that runs syntax checks, validators, dependency audit, and secret scan.

Priority: P0

Acceptance criteria:

- CI runs on pull request and main branch.
- CI runs `node --check` for all scripts.
- CI runs `npm run topic-validate:all`.
- CI runs `npm run validate-pipeline-state`.
- CI runs a verified secret scanner.

### Title: Add Lockfile and Runtime Policy

Description: Commit lockfile and Node version metadata.

Priority: P1

Acceptance criteria:

- `package-lock.json` exists.
- `npm ci` works.
- `npm audit` runs.
- `package.json` declares supported Node version.

### Title: Fix Staleness Script

Description: Make `check-staleness.js` parse LF and CRLF frontmatter and honor `--json`.

Priority: P1

Acceptance criteria:

- Current topics are not skipped when `created` exists.
- `--json` emits parseable JSON only.
- Unit tests cover LF and CRLF Markdown.

### Title: Harden Citation Checker

Description: Add private-network protections, concurrency, caching, and clearer error reporting to `verify-citations.js`.

Priority: P1

Acceptance criteria:

- Blocks localhost, link-local, private IP ranges, and redirects to those ranges.
- Supports `--dry-run`, `--write`, and `--cache`.
- Reports DNS, TLS, HTTP, timeout, and blocked-host categories distinctly.
- Tests cover redirects and blocked targets.

### Title: Add Script Test Suite

Description: Add automated tests for topic init, validation, archive/restore, index generation, staleness, and citation extraction.

Priority: P1

Acceptance criteria:

- `npm test` exists and passes.
- Tests run on Windows and Linux.
- Fixtures include malformed state, CRLF files, missing frontmatter, and duplicate table rows.

### Title: Add State and Evidence Schemas

Description: Create schema files for `_pipeline/state.json` and `_pipeline/evidence.json`.

Priority: P2

Acceptance criteria:

- Validator reports schema errors clearly.
- Existing valid topic passes.
- Drift between schema and benchmark assumptions is documented.

### Title: Improve Topic Index

Description: Enrich `index.md` or generate a dashboard-style index.

Priority: P2

Acceptance criteria:

- Shows status, score, last researched date, citation health, staleness state, and workflow.
- Generated deterministically.
- Manual summaries can be preserved or regenerated from structured metadata.

## 16. Product Research Recommendations

Recommended user questions:

- Who is the primary user: solo researcher, engineering lead, security reviewer, or product team?
- What decision does a topic verdict need to support: adoption, rejection, comparison, purchase, or architecture?
- How much evidence is enough for leadership confidence?
- Which artifacts should be public versus private?
- How often do users revisit old topics?
- What failure is most painful: stale research, unsupported claims, broken citations, or unclear recommendations?
- Should BrainStorming remain local-first or become a shared team knowledge base?

Recommended analytics/events for a future dashboard:

- `topic_created`
- `workflow_started`
- `workflow_completed`
- `quality_gate_failed`
- `security_review_triggered`
- `security_finding_created`
- `citation_check_completed`
- `citation_dead_link_found`
- `state_drift_detected`
- `topic_marked_stale`
- `topic_archived`
- `topic_restored`

Recommended experiments:

- Compare current three-file topic format against an executive one-page format.
- Add "decision card" summaries to `index.md` and measure whether readers open fewer files.
- Test a guided topic creation wizard against current command-only workflow.
- Test a dashboard view for citation health and stale topics.
- Compare fast `/quick` mode outcomes against full `/research` mode on the same topic.

## 17. Final Assessment

BrainStorming is a promising local research pipeline with unusually strong process design for evidence-backed technical evaluation. Its architecture is appropriate for a Markdown-first, Claude-assisted knowledge base, and the agent role definitions show thoughtful coverage of research quality, security review, adversarial challenge, stress testing, and publication.

It is not yet operationally mature enough to treat as a leadership-grade system of record without additional controls. The immediate blockers are state integrity, public/private artifact boundaries, missing CI, missing tests, missing lockfile, and known script defects. These are fixable. The right next move is not a rewrite; it is hardening the existing pipeline so the excellent research workflow has reliable engineering rails underneath it.

With 30 days of focused engineering work, BrainStorming can become a dependable internal decision-support tool. With 60-90 days, it can become a polished, auditable research platform suitable for team use and sanitized public publishing.
