---
title: "Anatomy of the .claude Folder — Verdict"
tags: ["Claude Code", "configuration", "tools", "recommendation"]
created: "2026-03-23"
updated: "2026-04-06"
confidence: "HIGH (core features), MEDIUM (reliability caveats)"
---

# Anatomy of the .claude Folder — Verdict

**Original Article:** [Daily Dose of Data Science, 2026-03-23](https://blog.dailydoseofds.com/p/anatomy-of-the-claude-folder)  
**Re-evaluation:** 2026-04-06

## Bottom Line

**Useful reference article, but dated.** The March 2026 analysis was accurate for the time but missed critical reliability issues that surfaced in the following two weeks (April 2026 rate limit incident, path-scoped rules bugs, skills auto-invocation quantified). Update your mental model with the caveats below before adopting specific patterns.

---

## Recommendation by Use Case

| Use Case | Status | Action | Caveat | |----------|--------|--------|--------| | Team instruction file (CLAUDE.md) | ✓ Recommended | Use it; commit to git | Keep under ~200 lines or split into projects | | Path-scoped rules for modularity | ✗ Not recommended | Avoid for critical workflows | Feature has 5+ GitHub bugs; use large CLAUDE.md instead | | Subagents with model pinning | ✓ Recommended | Adopt for cost optimization | Pin haiku to read-only tasks; savings unquantified but real | | MPC integration | ✓ Recommended | Use it | New: Desktop Extensions (.mcpb) available for distribution | | Hooks for automation | ✓ Recommended | Use PreToolUse/PostToolUse | Especially powerful for security policy and cleanup | | Skills with auto-invocation | ⚠ Use with caution | Write directive descriptions | ~50% baseline; improves to 65-100% with tuning | | Worktrees for parallel work | ✓ Recommended | Use for multi-feature development | Works; adoption patterns unclear | | Memory system | ✓ Recommended | Use for long-lived projects | Auto-memory reduces manual note-taking |

---

## What to Adopt Immediately

### 1. Structured CLAUDE.md (Teams)
**Effort:** Low | **ROI:** High

```markdown
# Project Name — Rules

## Development
- Use TypeScript, no any types
- Run tests before commit

## Security
- Never commit .env files
- Block edits to src/auth/* via hooks

## Tools
- Prefer native Node APIs over packages
```

Commit to git. Shared with team. Simple but effective.

---

### 2. Subagent Model Pinning (Cost Optimization)
**Effort:** Medium | **ROI:** Medium

Create `.claude/agents/researcher.md`:
```yaml
---
model: haiku
tools: [Read, Glob, Grep, WebSearch]
---
# Researcher Agent

You are a research specialist with read-only tools.
Your job is to find information and report back.
```

Use it for specialized agents that don't need expensive models.

---

### 3. PreToolUse Hooks for Security (Teams)
**Effort:** Medium | **ROI:** High (for security-sensitive projects)

Block edits to protected files:
```
.claude/settings.json:
{
  "hooks": {
    "onPreToolUse": {
      "match": {"tool": "Edit", "path": "**/auth/**"},
      "handler": "./hooks/check-auth-files.sh"
    }
  }
}
```

Prevents accidental modifications to critical code.

---

## What to Avoid (Updated April 2026)

### 1. Path-Scoped Rules for Critical Workflows
**Status:** ✗ Broken, 5 GitHub bugs unfixed

Don't assume path-scoped rules will work. The feature is:
- Documented as a best practice
- Implemented with bugs
- Unreliable in production

**Alternative:** Keep one large CLAUDE.md or split into separate projects/repos.

---

### 2. Relying on Skills Auto-Invocation Without Tuning
**Status:** ⚠ ~50% baseline failure rate

Don't expect skills to auto-invoke reliably without optimization.

**Fix:** Write skill descriptions as imperatives:
- ❌ `description: Skill to update process notes`
- ✓ `description: ALWAYS use this skill to log process notes; do not write notes directly`

With directive language, activation reaches 100%.

---

### 3. Bloated CLAUDE.md
**Status:** ⚠ Degrades compliance beyond 200 lines

Don't assume more rules = better compliance. Evidence from April 2026:
- Large CLAUDE.md files contributed to rate limit exhaustion
- Rules beyond ~200 lines degrade compliance
- "CLAUDE.md is a wish list, not a contract"

**Fix:** Audit quarterly. Remove obsolete rules. Keep essential rules high in file.

---

## Key Changes Since March 2026

| Change | Date | Impact | Action | |--------|------|--------|--------| | Rate limit incident | April 2026 | Large configs contribute to token exhaustion | Audit and trim CLAUDE.md/skills | | Skills activation study published | 2026 | Baseline ~50%, improvable to 100% | Rewrite skill descriptions with directives | | Path-scoped rules bugs documented | March-April 2026 | Feature is unreliable | Avoid; use large CLAUDE.md instead | | Desktop Extensions (.mcpb) released | Early 2026 | Simplifies MCP distribution | Adopt for tool distribution |

---

## Risk Assessment

| Risk | Likelihood | Severity | Mitigation | |------|-----------|----------|-----------| | Path-scoped rules don't work (critical workflow breaks) | HIGH | HIGH | Don't use path-scoped rules; keep large CLAUDE.md | | Skills don't auto-invoke (workflow requires manual /invoke) | MEDIUM | MEDIUM | Write directive descriptions; test before relying | | CLAUDE.md bloat causes rate limit issues | MEDIUM | MEDIUM | Audit quarterly; remove obsolete rules | | Multiple CLAUDE.md hierarchy causes confusion | LOW | LOW | Document precedence; prefer one per project | | Hooks fail silently | LOW | MEDIUM | Test hooks before deployment |

---

## Next Steps for Adopters

### If You're Starting Fresh

1. **Create project CLAUDE.md** with team standards (~150 lines max)
2. **Commit to git** so team shares it
3. **Add PreToolUse hooks** for security policy (if multi-person team)
4. **Consider subagents** for expensive workflows (e.g., research, analysis)
5. **Skip path-scoped rules** unless you want to experiment (document expectations)
6. **Use skills for reusable workflows,** but write directive descriptions

### If You Have Existing Configuration

1. **Audit CLAUDE.md** — remove obsolete rules; keep under 200 lines
2. **Test skills** — check auto-invocation rates; rewrite descriptions if <70% activation
3. **Review path-scoped rules** — consider migrating to large CLAUDE.md or undocumented `globs:` workaround
4. **Add hooks** — PreToolUse for security, PostToolUse for cleanup
5. **Enable auto-memory** — set up MEMORY.md for long-lived projects

---

## Confidence & Evidence

| Finding | Confidence | Evidence | Last Updated | |---------|-----------|----------|--------------| | CLAUDE.md is primary config file | HIGH | Official docs + widespread adoption | Ongoing | | ~200-line practical limit exists | MEDIUM | Community consensus + April 2026 rate limit incident | 2026-04-06 | | Path-scoped rules are broken | HIGH | 5 GitHub issues, unfixed | 2026-04-06 | | Skills have ~50% auto-invoke baseline | HIGH | 650-trial empirical study | 2026 | | Subagent model pinning saves cost | HIGH | Official feature; cost savings unquantified | Ongoing | | Hooks work as documented | HIGH | Official docs + user reports | Ongoing | | Desktop Extensions simplify MCP setup | HIGH | New Anthropic feature | 2026-04 |

---

## Final Verdict

**Grade:** B+ (was B in March, upgraded with caveats)

The article remains a good reference for understanding the structure of the .claude folder. However, the advice has important caveats as of April 2026:

1. ✓ Use CLAUDE.md for team rules (but keep it trim)
2. ✓ Use subagents for cost optimization
3. ✓ Use hooks for automation and security
4. ✗ Don't bet on path-scoped rules
5. ⚠ Don't assume skills auto-invoke; tune descriptions

Bookmark the article but update your mental model with the reliability caveats in this verdict. The core structure is sound, but the implementation has known gaps.

---

## Useful Related Resources

- [How to Make Claude Code Skills Actually Activate (650 Trials)](https://medium.com/@ivan.seleznov1/why-claude-code-skills-dont-activate-and-how-to-fix-it-86f679409af1) — Empirical skills data
- [Claude Code: Part 10 - Common Issues and Quick Fixes](https://www.letanure.dev/blog/2025-08-08--claude-code-part-10-power-user-cli-scripting) — Troubleshooting guide
- [Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — Best practices

---

## Research Quality

Scored 8.2/10 against the R&R quality rubric (8-dimension, 8.0 = PASS threshold).

| Dimension | Score | Weight | |-----------|-------|--------| | Evidence Quality | 8/10 | 20% | | Actionability | 8/10 | 20% | | Accuracy | 9/10 | 15% | | Completeness | 8/10 | 15% | | Objectivity | 9/10 | 10% | | Clarity | 8/10 | 10% | | Risk Awareness | 8/10 | 5% | | Conciseness | 8/10 | 5% |

