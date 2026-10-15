---
name: research
title: Topic Research Skill
created: 2026-04-03
purpose: Answer a research question fast from the live web by default, with an opt-in switch to escalate to the full auditable pipeline.
description: Research a topic. FAST by default (single live-web pass + link verification, ~1-2 min, answered in chat). Add --deep to run the full multi-agent pipeline that publishes an audited topic dossier.
argument-hint: "[topic or question]  (append --deep for the full pipeline)"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Agent, TodoWrite, WebSearch, WebFetch, Bash
---

**Topic / question:** $ARGUMENTS

## Mode switch (decide first)

Scan the topic text for a depth switch token: `--deep`, `--deepthinking`, `--depth`, or a leading `deep:`.

- **Switch present** -> run the **DEEP PATH** (full multi-agent pipeline). Strip the switch token from the topic before using it.
- **No switch (DEFAULT)** -> run the **FAST PATH** below.

FAST is the default on purpose: most research questions want a fast, factual, well-linked answer -- not a 15-minute audited dossier. Escalate to DEEP only when the user asks for depth, or when the answer will be published or consumed downstream and needs full provenance + adversarial challenge.

---

## FAST PATH (default) -- live-web, no agent chain

Run entirely in the main loop. Do NOT spawn subagents, do NOT invoke the Director, do NOT create `_pipeline/` state or manifests. The goal: **fast, factual, no pre-training slop, no ghost links.**

1. **Decompose** the question into 3-6 facets (the distinct things you must know to answer well). Do this silently.
2. **Search live** -- issue **4-8 `WebSearch` calls in parallel** (one message, multiple tool uses): one per facet, plus an evidence/benchmark angle and a contrarian/"honest limitations" angle. Bias queries to the last 6-12 months for fast-moving topics. Do NOT answer from memory/pre-training; the live web is the source of truth.
3. **Fetch** the 1-3 most authoritative results with `WebFetch` when a snippet is insufficient (prefer primary sources / official docs / benchmark orgs over SEO/content-farm blogs). Only fetch what you'll actually cite.
4. **Write the answer in chat** -- tight and scannable:
   - Lead with the **bottom line** (the direct answer).
   - Use the **confidence ladder**: state strong multi-source facts plainly; attribute single-source claims ("According to X..."); flag weak/practitioner-blog claims as such ("practitioner-reported, not benchmark-confirmed"); never present a guess as fact. If sources conflict, say so and cite both.
   - **Only cite URLs you actually retrieved this run.** Never fabricate or reconstruct a link from memory. No ghost links.
   - Be honest about what you could NOT verify in one pass -- say "couldn't confirm X" rather than papering over it.
   - No filler, no "in today's world", no hype. The user explicitly rejects slop.
5. **Anti-ghost-link gate (mandatory).** Collect every URL you cite and run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/check-links.js" <url1> <url2> ...
   ```
   Any link reported `DEAD` must be **removed or replaced** before you finalize -- do not present a dead citation. (If a fetch is TLS-blocked by a corporate proxy, note it as a tool limitation; don't claim the source is fake.)
6. **Persist only if asked.** By default the answer lives in chat. If the user says "save this" / "make it a topic", write a lightweight `topics/{slug}/notes.md` (frontmatter + findings + verified links) -- do NOT spin up the full pipeline for that.

Typical cost: ~6 searches + 1-2 fetches + 1 link check, ~1-2 minutes, zero subagents.

---

## DEEP PATH (`--deep`) -- full audited pipeline

Read the Director agent definition from `${CLAUDE_PLUGIN_ROOT}/pipeline/agents/director.md`. The plugin is installed at `${CLAUDE_PLUGIN_ROOT}`. Wherever the Director spec (or any agent spec it loads) says `{PLUGIN_ROOT}`, use that path. Research output goes under the current working directory. Then execute the **full research pipeline** for the topic (switch token removed):

**Workflow:** research

Follow the Director's pipeline phases in order: Intake -> Parallel Research -> Analysis -> Writing -> Critic Gate (incl. Step 4.0 semantic claim-support gate) -> Security Review (if applicable) -> Testing -> Adversarial Challenge -> Publishing -> Delivery. The Director still classifies internal effort (quick/standard/deep) per its Phase 0 rules, but `--deep` guarantees the full multi-agent audited path runs and publishes topic files. The Adversarial Challenge (Phase 6.5) is non-skippable.

Default interpretation rules (both paths):

- Research the topic truthfully in its native domain.
- Extract reusable patterns, transferable risks, and capability-level value using a vertical-agnostic lens.
- Evaluate relevance to current and future projects without assuming the topic's source audience is your intended audience.
- Treat safety, security, privacy, abuse potential, access control, and misuse surfaces as operational concerns, not morality defaults.

DEEP output lands in `topics/{topic-slug}/` with `overview.md`, `notes.md`, and `verdict.md`. The `index.md` updates on completion.
