---
title: Vercel Skills CLI — Universal Agent Skills Manager
tags: [agent-skills, package-management, distribution, tools, 2026]
created: 2026-04-06
status: Draft
confidence: HIGH
---

# Vercel Skills CLI — Universal Agent Skills Manager

## Overview

**Repo:** https://github.com/vercel-labs/skills  
**Site:** https://skills.sh  
**License:** Open source | **Stars:** 13.1k | **Language:** TypeScript  
**Created:** 2026-01-14 | **Last updated:** 2026-03-30

An open-source CLI tool and skill marketplace for discovering, installing, and managing **Agent Skills** across 40+ coding agents. Built by Vercel Labs. Implements the agentskills.io standard (Anthropic's open specification).

Think of it as **npm for agent skills** — a universal package manager that lets you `npx skills add owner/repo` to install reusable task instructions and capabilities into Claude Code, Cursor, GitHub Copilot, and dozens of other agents.

## What It Solves

Agent Skills are modular, reusable instructions that teach an agent (like Claude Code) how to perform specialized tasks — from writing tests to configuring databases. Prior to a standard marketplace, developers had to:

1. Find skills by browsing GitHub manually
2. Clone or copy skill files into agent-specific directories
3. Manage versions and updates manually

**Vercel Skills CLI eliminates this friction.** It's a discovery interface + installer that works across the entire agent ecosystem.

## Key Facts

### Marketplace Scale
- **83,627 skills** indexed on skills.sh (as of February 2026)
- **8M+ total installs** tracked across all skill + agent combinations
- **40+ agent platforms** supported: Claude Code, Cursor, Cline, GitHub Copilot, OpenHands, Roo Code, Codex, Continue, Windsurf, Gemini CLI, and others

### Top Skills by Install Count
1. **find-skills** (784.9k installs) — meta-skill that teaches agents to discover and install other skills
2. **vercel-react-best-practices** (263.2k)
3. **frontend-design** (221.5k)

### Major Contributors
Vercel, Microsoft, Anthropic, Google, Supabase, and community developers.

## How It Works

### Installation Scope
- **Global:** `npx skills add owner/repo -g` — available in all projects
- **Project:** `npx skills add owner/repo` — stored in `./[agent]/skills/`, committed to repo
- **Storage:** Symlinks by default (copies as fallback) — enables instant updates without reinstall

### Core Commands
```bash
npx skills add vercel-labs/agent-skills      # Install from a GitHub repo
npx skills add owner/repo --agent claude     # Filter by agent
npx skills list                              # Show installed skills
npx skills find [query]                      # Interactive search (fzf-style)
npx skills remove [skill]                    # Uninstall
npx skills check                             # Check for updates
npx skills update                            # Update installed skills
npx skills init [name]                       # Create new skill template
```

### Discovery
- **Web directory:** skills.sh with search, filtering, trending/hot views
- **"Official" tab:** Verified skills from major contributors
- **"Audits" section:** Security review results for each skill
- **Non-interactive mode:** `-y` flag for CI/CD pipelines
- **Telemetry control:** Respects `DO_NOT_TRACK` and `DISABLE_TELEMETRY` env vars

## Security: Automated Audits (February 2026)

Vercel launched **automated security audits** for skills.sh in response to the January 2026 ClawHub malware incident (341+ malicious skills). Working with Snyk, Gen Digital, and Socket:

- Each skill submission triggers independent security scans
- Audit results appear publicly on each skill's detail page
- Malicious skills are automatically hidden from leaderboard/search
- Direct navigation to a flagged skill shows a warning before installation
- As of skills@1.4.0, audit results display before installation

**Caveat:** Automated audits apply to new submissions and periodic rescans. Legacy skills in the index may not be fully audited.

## How It Differs From Anthropic's Repo

| Aspect | Anthropic `anthropics/skills` | Vercel `vercel-labs/skills` | |--------|---|---| | **Focus** | First-party skill implementations | CLI tool + marketplace/directory | | **Content** | 17 curated skills | 83k+ community skills indexed | | **Scope** | Claude-specific | 40+ agents (Claude Code, Cursor, Copilot, etc.) | | **Distribution** | `/plugins` in Claude Code UI | `npx skills add owner/repo` CLI |

**Relationship:** Complementary, not competing. Both implement agentskills.io standard.

## Ecosystem Context

### Agent Skills Standard (December 2025)
Anthropic published Agent Skills as an open standard at agentskills.io, enabling any platform to implement the same format. Adopted by 26+ platforms including Microsoft, GitHub, Cursor, VS Code, and Figma. This is the foundation that makes a cross-agent marketplace like skills.sh possible.

### Competing Marketplaces
Three major skill distribution platforms emerged simultaneously in Q1 2026:

| Platform | Size | Model | CLI | Status | |----------|------|-------|-----|--------| | **skills.sh** | 83.6k | Marketplace + CLI | `npx skills` | Active, audited | | **SkillsMP** | 71k | Indexed directory | None (ZIP download) | Active | | **ClawHub** | 3.2k (peak) | Curated marketplace | Yes | **Shutdown (malware)** |

### Market Drivers
- **Agentic AI market:** $11.79B projected for 2026
- **Enterprise adoption:** Gartner forecasts 40% of enterprises embedding task-specific agents by 2026 (up from <5% in 2025)
- **Developer adoption:** 62% of organizations experimenting with AI agents; 23% scaling in at least one function

## Strengths

- **Universal reach:** One publish, 40+ agents can install
- **Low friction:** `npx skills add` just works; no setup needed
- **Growing ecosystem:** 83k+ skills, major contributors (Vercel, Microsoft, Google, Supabase)
- **Web discovery:** skills.sh for searching, filtering, trending, and audits
- **Spec-compliant:** Uses agentskills.io standard
- **Security audits:** Automated scanning via Snyk, Gen Digital, Socket (launched Feb 2026)

## Limitations

### Critical Gaps (as of April 2026)

1. **Update mechanism is broken**
   - `npx skills update` fails silently on macOS and other platforms
   - Project-scoped installations cannot be updated
   - No lock file restore command (`npx skills ci` equivalent)
   - Blocks CI/CD pipelines and reproducible builds

2. **No private registry support**
   - Cannot install from private GitHub repos
   - Requested in Issue #381; no official support or ETA
   - Blocks enterprise adoption for internal skill libraries

3. **No dynamic skill discovery**
   - When you install all skills from a repo, only existing skills are tracked
   - New skills added to the repo are not discovered on update

### Ecosystem-Level Risks

- **High flaws rate:** Snyk audit (Feb 2026) found 36% of 3,984 sampled skills contain at least one security flaw; 13.4% critical
- **Audit coverage gaps:** Automated audits apply to new submissions; legacy skills may not be fully audited
- **Asymmetric risk:** Installing a random skill has ~13% chance of critical flaw, but top-installed skills likely have better coverage

### Operational Differences from npm

- No semver pinning at the skill level (skills are Git-based, not versioned packages)
- No built-in dependency resolution (each skill pulls its own dependencies)
- No private registry equivalent (request open in #381)

## Relevant Projects

| Project | Fit | Context | |---------|-----|---------| | **Claude Code skill-builder** | High | Should generate skills that work with `npx skills add`; test with `npx skills init` |

## Bottom Line

This is the **distribution layer for Agent Skills**. If you want your skills to reach beyond local use, or if you want to discover and install skills others have built, this is the path. First-mover advantage in the space (CLI + marketplace), backed by Vercel and integrated with major agent platforms. But production adoption is blocked by three gaps: unreliable updates, missing private registry support, and lingering ecosystem security concerns.
