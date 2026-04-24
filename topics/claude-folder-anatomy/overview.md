---
title: "Anatomy of the .claude Folder"
tags: ["Claude Code", "configuration", "tools", "dev-tools"]
created: "2026-03-23"
updated: "2026-04-06"
status: "evaluated"
---

# Anatomy of the .claude Folder — Overview

**Primary Source:** [Anatomy of the .claude Folder - Daily Dose of Data Science](https://blog.dailydoseofds.com/p/anatomy-of-the-claude-folder)  
**Original Published:** 2026-03-23 | **Re-evaluated:** 2026-04-06

A comprehensive breakdown of the `.claude/` folder at project and global levels — how Claude Code organizes configuration, rules, skills, agents, and more.

## Structure

```
Project Level: .claude/
├── CLAUDE.md                    — Primary instruction file (team rules, ~200 lines effective)
├── settings.json / settings.local.json — Permissions (allowlist/denylist of tools)
├── .mcp.json                    — MCP server configuration
├── rules/                       — Modular instructions (path-scoped, with known bugs)
│   ├── {name}.md               — Rules with frontmatter: paths: [], globs: []
├── commands/                    — Custom slash commands (explicit /invoke required)
│   └── {name}.md               — Commands with shell embedding support
├── skills/                      — Reusable workflows (auto-invoke potential, ~50% baseline)
│   └── {name}/SKILL.md         — Skill with frontmatter: description, disable-model-invocation
├── agents/                      — Subagent personas (model pinning + tool restriction)
│   └── {name}.md               — Agent definition with model: and tools: fields
├── hooks/                       — Pre/post-action automation (PreToolUse, PostToolUse)
└── worktrees/                   — Isolated feature branches (stored locally)

Global Level: ~/.claude/
├── CLAUDE.md / settings.json    — Personal defaults (user overrides)
├── projects/{project}/
│   ├── memory/MEMORY.md         — Auto-accumulated project knowledge
│   └── memory/{topic}.md        — Structured memory topics
└── ...
```

## Core Components

### CLAUDE.md (Primary Config)
**Status:** ✓ Works well  
**Best Practice:** Keep under ~200 lines (instruction-following degrades beyond this)

The most important file in the system. Loaded automatically at session start and defines all project rules. Multiple CLAUDE.md files can exist in a folder hierarchy (folder-level, project-level, user-level, global-level) with precedence rules.

**Limitation:** Beyond ~150-200 lines, rules begin competing with code in the context window, degrading compliance. This is not a hard technical limit but an empirical heuristic. Anthropic recommends staying under 200 lines.

### Settings & Permissions
**Status:** ✓ Works well

`settings.json` controls tool permissions via allowlist (tools: []) or denylist (disallowedTools: []). Unlisted tools prompt for confirmation. Tool restrictions are hard system-level constraints, not prompt-based.

**Limitation:** Ask-per-action prompt flow is annoying in interactive use. Deny lists are insufficient for headless/CI agents (Bash access enables circumvention).

### Path-Scoped Rules
**Status:** ✗ Known bugs, unreliable  
**Recommendation:** Avoid for critical workflows

`.claude/rules/` files with YAML frontmatter `paths: ["src/api/**/*.ts"]` should limit rule loading to matching files. Documented as a best practice for modularity.

**Reality:** 5+ GitHub bugs (unfixed as of April 2026) prevent path-scoped rules from working reliably:
- Rules load globally, ignoring paths: pattern
- Rules don't auto-load when reading/writing matching files
- YAML syntax issues with glob patterns
- Workaround: Use undocumented `globs:` field instead of `paths:`

**Actionability:** Don't rely on path-scoped rules for critical workflows. Keep large CLAUDE.md or split into separate projects.

### Custom Commands & Skills
**Status:** ✓ Both work well (skills have caveats)

**Commands** (`.claude/commands/`) require explicit `/command-name` invocation.

**Skills** (`.claude/skills/{name}/SKILL.md`) can auto-invoke based on context via frontmatter `description` + `disable-model-invocation` / `user-invocable` fields.

**Limitation — Skills Auto-Invocation:** Empirical study (650 trials, 2026) shows ~50% baseline auto-invocation rate. Improves to ~65% with good CLAUDE.md context, reaches 100% with directive language ("ALWAYS invoke…"). Feature works but requires optimization.

### Subagents (Agents Folder)
**Status:** ✓ Works well

`.claude/agents/` define subagent personas with:
- `model:` field — pin to haiku (cheap, read-only), sonnet, opus, or inherit from parent
- `tools:` field — allowlist of tools available to subagent
- `disallowedTools:` field — denylist approach

Tool restrictions are hard system constraints, enabling cost optimization for specialized tasks.

### MCP Integration
**Status:** ✓ Works well, improving

MCP servers configured via:
- `.mcp.json` (project-level)
- `~/.claude.json` (machine-level)
- `claude mcp add` (CLI management)

**New (Early 2026):** Claude Desktop now supports Desktop Extensions (.mcpb files) — pre-configured MCP bundles that install with a double-click, eliminating JSON editing.

### Hooks (Pre/Post-Action Automation)
**Status:** ✓ Works well, undersold

Configure in `settings.json` to run shell scripts:
- **PreToolUse:** Before Claude performs an action (validation, blocking)
- **PostToolUse:** After action completes (cleanup, logging)

Handlers can enforce security policy (block edits to production files) and automate cleanup (format code, run tests).

### Worktrees
**Status:** ✓ Works well

Use `--worktree` flag to create isolated feature branches:
```
claude --worktree feature-auth
# Creates: .claude/worktrees/feature-auth/ with new branch
```

Sessions are stored per directory at `~/.claude/projects/`; worktrees get isolated storage. `/resume` picker shows worktree sessions from the same repo.

### Auto-Memory System
**Status:** ✓ Works well

Dynamic knowledge base at `~/.claude/projects/{project}/memory/MEMORY.md` accumulates project insights without user intervention — build commands, debugging notes, architecture patterns, style preferences.

## What This Is Good For

- **Team coordination:** CLAUDE.md defines shared rules; .claude folder committed to git ensures consistency
- **Specialized agents:** Subagents with model pinning (haiku for cheap read-only tasks) reduce API cost
- **Security automation:** PreToolUse hooks can block dangerous operations; PostToolUse hooks can enforce cleanup
- **Multi-project memory:** Global memory at ~/.claude/projects/ persists insights across sessions
- **Parallelizing work:** Worktrees enable isolated feature branches with separate Claude sessions

## What This Is NOT Good For

- **Complex rule routing:** Path-scoped rules have bugs; don't rely on them for critical workflows
- **Reliable auto-invocation:** Skills have ~50% baseline failure rate; use explicit /invoke for important tasks
- **Large instruction sets:** CLAUDE.md beyond 200 lines degrades compliance; split into separate projects instead
- **Secrets management:** agents with Bash access can exfiltrate unless network firewall rules restrict connectivity

## Key Changes Since March 2026

1. **Desktop Extensions (.mcpb)** — New in early 2026, simplifies MCP distribution
2. **Rate limit incident (April 2026)** — Anthropic noted users hitting limits faster than expected; large CLAUDE.md and over-customized configs are partly to blame
3. **Path-scoped rules bugs documented** — Feature is unreliable; 5+ GitHub issues remain unfixed
4. **Skills auto-invocation baseline quantified** — 650-trial study (2026) confirms ~50% activation rate

## Quick Reference

| Feature | Status | Limit / Caveat | |---------|--------|----------------| | CLAUDE.md | ✓ | ~200 lines before degradation | | Settings/Permissions | ✓ | Ask-per-action prompt flow is slow | | Path-scoped rules | ✗ | Unreliable, 5+ GitHub bugs | | Commands | ✓ | Manual /invoke required | | Skills | ⚠ | ~50% auto-invoke rate (improvable) | | Subagents | ✓ | Works as documented | | MCP | ✓ | Desktop Extensions now available | | Hooks | ✓ | PreToolUse/PostToolUse powerful | | Worktrees | ✓ | Works as documented | | Memory | ✓ | Works as documented |
