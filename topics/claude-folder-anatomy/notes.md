---
title: "Anatomy of the .claude Folder — Research Notes"
tags: ["Claude Code", "configuration", "tools", "research-notes"]
created: "2026-03-23"
updated: "2026-04-06"
---

# Anatomy of the .claude Folder — Notes

## Actionable Patterns (Worth Trying)

### 1. Path-Scoped Rules — Use With Caution
**Original Recommendation:** Split large CLAUDE.md files into `.claude/rules/` with path globs to reduce prompt bloat.

**Updated 2026-04-06:** Feature is documented but has 5+ known GitHub bugs:
- Rules load globally, ignoring `paths:` frontmatter
- Rules don't auto-load when reading/writing matching files
- YAML syntax issues with glob patterns
- Multiple path patterns only affect one of them
- Only works in primary working directory (breaks in multi-directory projects)

**Current Status:** ✗ Not recommended for critical workflows

**Workaround:** Use undocumented `globs:` field instead of `paths:`:
```yaml
---
globs: ["src/api/**/*.ts"]
---
Your rule here...
```
(Less tested than paths:, but some community reports of success)

**Better alternative:** Keep one large CLAUDE.md or split rules into separate projects rather than betting on path-scoped loading.

---

### 2. Subagent Model Pinning for Cost Optimization
**Pattern:** Use `.claude/agents/haiku-reader.md` to pin Haiku model for read-only exploration tasks.

```yaml
---
model: haiku
tools: [Read, Glob, Grep]
---
You are a research assistant...
```

**Status:** ✓ Works as documented

**Benefit:** Haiku is cheaper than Sonnet/Opus; restricting tools to read-only (Read, Glob, Grep) prevents dangerous actions.

**Caveat:** No published benchmarks quantify cost savings. Feature works, savings are real, but magnitude is unquantified.

**Actionability:** Adopt for multi-project workflows where specialized read-only agents could handle research tasks.

---

### 3. Skills Descriptions Need Directive Language
**Original Claim:** Skills auto-invoke when "context matches frontmatter description."

**Updated 2026-04-06:** Real-world auto-invocation rate is ~50% baseline.

**Empirical Data (650 trials, 2026):**
- Base: 50% activation
- With good CLAUDE.md context: ~65% activation (still fails 35% of the time)
- With directive language: 100% activation

**Directive Language Examples:**
- ❌ Poor: `description: Skill to update session notes`
- ✓ Good: `description: ALWAYS use this skill to update session notes; do not write notes directly`
- ✓ Better: `description: ALWAYS invoke this skill before ending the session to log findings`

**Actionability:** If auto-invocation is critical to your workflow, rewrite skill descriptions as imperatives with explicit "ALWAYS invoke" language.

---

### 4. CLAUDE.md 200-Line Guideline (Not a Hard Limit)
**Original Claim:** "Beyond ~200 lines, instruction adherence drops."

**Updated 2026-04-06:** No hard technical cutoff, but continuous degradation is real.

**Mechanism:** 
- Claude Code's own system prompt uses ~50 instructions
- CLAUDE.md shares context window with actual code
- Rules beyond ~150-200 lines compete with code for attention
- Model's instruction-following reliability plateau is 150-200 discrete instructions
- Beyond that, every new rule dilutes compliance of every existing rule equally

**Real-World Evidence:**
- April 2026: Anthropic noted users hitting rate limits faster than expected
- Users report writing 200+ lines of rules that Claude then ignores
- "CLAUDE.md is a wish list, not a contract" — experienced users

**Actionability:** 
- Audit CLAUDE.md for obsolete rules; remove unused patterns
- Keep essential rules high in the file (recency bias helps)
- Split into separate projects if you need 300+ lines of rules
- Don't try to stuff everything into one CLAUDE.md

---

### 5. Hooks for Security Policy Enforcement
**Status:** ✓ Works well, undersold in original article

**Pattern — PreToolUse Blocking:**
```
.claude/settings.json:
{
  "hooks": {
    "onPreToolUse": {
      "match": {"tool": "Edit", "path": "**/middleware/**"},
      "handler": "./hooks/check-auth-middleware.sh"
    }
  }
}

handler script:
#!/bin/bash
# Block edits to critical files
echo "Blocking edit to protected middleware"
exit 2  # exit 2 = BLOCK
```

**Pattern — PostToolUse Cleanup:**
```
"onPostToolUse": {
  "match": {"tool": "Write"},
  "handler": "./hooks/format-on-write.sh"
}
# Auto-format files after Claude writes them
```

**Actionability:** Consider PreToolUse hooks for multi-team setups where you need to prevent edits to production-critical files.

---

### 6. Desktop Extensions (.mcpb) — New in Early 2026
**Status:** ✓ New, simplifies MCP distribution

MCP servers can now be bundled as `.mcpb` (Model Context Protocol Bundles):
- Pre-configured, ready to install
- Double-click to install (no JSON editing required)
- Available in Claude Desktop
- Reduces friction for distributing custom tools

**Actionability:** If distributing MCP-based tools internally, consider bundling as .mcpb files for end users.

---

## What the March 2026 Article Missed

### 1. Path-Scoped Rules Have Implementation Gaps
The article presented path-scoped rules as a straightforward best practice for modularity. GitHub issues filed in March-April 2026 show multiple bugs preventing reliable functionality. The feature is **documented but broken**.

**GitHub Issues (Unfixed):**
- [#16299: Rules load globally regardless of paths:](https://github.com/anthropics/claude-code/issues/16299)
- [#16853: Rules don't auto-load when reading/writing matching files](https://github.com/anthropics/claude-code/issues/16853)
- [#13905: Invalid YAML syntax in paths: frontmatter](https://github.com/anthropics/claude-code/issues/13905)
- [#25562: Path matching only works in primary working directory](https://github.com/anthropics/claude-code/issues/25562)
- [#26868: Multiple paths arrays only affect one pattern](https://github.com/anthropics/claude-code/issues/26868)

**Confidence:** HIGH — all documented in official GitHub issues

---

### 2. Skills Auto-Invocation Failure Rate (~50%)
The article implied skills reliably auto-invoke. Recent empirical data shows:
- ~50% baseline activation rate (effectively a coin flip)
- Improves to ~65% with good CLAUDE.md context
- Reaches 100% with directive language

**Source:** [How to Make Claude Code Skills Actually Activate (650 Trials)](https://medium.com/@ivan.seleznov1/why-claude-code-skills-dont-activate-and-how-to-fix-it-86f679409af1)

**Confidence:** HIGH — statistically validated across 650 trials

---

### 3. April 2026 Rate Limit Incident
Users hitting API rate limits faster than expected. Root cause analysis points partly to:
- Large CLAUDE.md files competing for token budget
- Over-customized skill configurations
- Skills loading/unloading repeatedly due to low activation rate

**Source:** [Anthropic admits Claude Code users hitting usage limits way faster than expected](https://www.devclass.com/ai-ml/2026/04/01/anthropic-admits-claude-code-users-hitting-usage-limits-way-faster-than-expected-5213575)

**Confidence:** HIGH — public statement from Anthropic

---

### 4. Hooks Are More Powerful Than Mentioned
Original article mentioned hooks in passing. In practice, PreToolUse hooks enable:
- Security policy enforcement (block edits to protected files)
- Validation (ensure deployment checks pass before running commands)
- Audit logging (record all tool uses with context)

**Confidence:** HIGH — official docs + community validation

---

### 5. Worktree Adoption Patterns Unclear
No data on how many teams use worktree sessions or what patterns work best. Feature exists and is documented, but real-world usage is largely anecdotal.

**Confidence:** LOW — observational only

---

## Honest Assessment

### What's Accurate
- ✓ CLAUDE.md as primary config file
- ✓ Two-level folder structure (project + global)
- ✓ Skills vs. commands distinction
- ✓ Shell embedding in commands/skills works
- ✓ Subagents with model pinning works
- ✓ MCP integration works
- ✓ Hooks work as documented
- ✓ Memory system works

### What's Incomplete
- ⚠ Path-scoped rules — documented but unreliable
- ⚠ Skills auto-invocation — works but with ~50% baseline failure
- ⚠ CLAUDE.md 200-line limit — heuristic, not hard limit
- ⚠ Hooks — works but undersold in original article

### What's Missing
- ✗ Path-scoped rules bugs not mentioned
- ✗ Skills auto-invocation failure rate not quantified
- ✗ CLAUDE.md degradation mechanism not explained
- ✗ April 2026 rate limit context missing
- ✗ Desktop Extensions (.mcpb) not covered (new in early 2026)
- ✗ Security considerations (secrets management, network isolation)

---

## Confidence Ratings

| Topic | Confidence | Evidence | Notes | |-------|-----------|----------|-------| | CLAUDE.md effectiveness | HIGH | Official docs + widespread adoption | Works but has 200-line practical guideline | | Path-scoped rules reliability | LOW | 5 GitHub bugs, unfixed | Feature is broken; avoid for critical workflows | | Skills auto-invocation | MEDIUM | 650-trial empirical study | Works but 50% baseline, improvable with tuning | | Subagent model pinning | HIGH | Official docs + community validation | Works as documented; cost savings unquantified | | MCP integration | HIGH | Official docs + growing adoption | Works; Desktop Extensions new in 2026 | | Hooks | HIGH | Official docs + user reports | Works as documented; powerful but undersold | | Worktree support | HIGH | Official docs + guides | Works as documented; adoption patterns unclear | | Memory system | HIGH | Official docs + user reports | Works as documented |

---

## Research Gaps & Future Investigation

1. **Desktop Extensions distribution:** How are .mcpb files created and signed? Distribution model unclear
2. **Optimal CLAUDE.md structure:** No consensus on rule categorization or organization
3. **Globs vs. paths:** Undocumented `globs:` field reportedly works better; needs formal testing
4. **Multi-level CLAUDE.md priority:** Unclear precedence rules when multiple files exist in hierarchy
5. **Skills activation optimization:** Systematic study of which description patterns achieve highest activation
6. **Cost benchmarks:** Quantify savings from subagent model pinning across different task types
7. **Auto-memory value:** Does MEMORY.md actually reduce tokens or just add convenience?

---

## Verdict Preparation

**Evidence for Recommendation:**
- Core features (CLAUDE.md, agents, MCP, hooks, memory) are mature and working
- Path-scoped rules and skills auto-invocation have documented limitations that users should know about
- Article is good reference but needs significant caveats for mid-2026

**Actionability:**
- CLAUDE.md structure useful for teams
- Subagents with model pinning worth adopting for cost optimization
- Avoid relying on path-scoped rules; keep large CLAUDE.md or split projects
- If skills auto-invocation matters, use directive language

**Audience Impact:**
- Intermediate Claude Code users: Already know CLAUDE.md; interested in optimization
- Teams: Need guidance on shared config structure
- Tool developers: Considering MCP; Desktop Extensions are significant for distribution
