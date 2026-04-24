---
title: jira-expert (Claude Code Jira Skill Pack)
tags: [research, jira, claude-code, skills, workflow-automation]
created: 2026-04-17
updated: 2026-04-17
status: complete
---

# jira-expert (Claude Code Jira Skill Pack)

## What It Is

`jira-expert` is a small public GitHub repository that packages a Jira workflow for Claude Code as a skill pack plus docs, templates, and installers. It is not a standalone Jira integration server or CLI. The practical shape is: install a skill into `~/.claude/skills/x-jira/`, add company-scoped data and policy files, then let Claude Code drive Jira through connected MCP tools.

## Key Concepts

- **Unified interface:** one `/x-jira` skill namespace with ten documented modes.
- **Agent-friendly contract:** `--json --quiet` output and `--fresh` cache bypass for other agents/skills.
- **Company-scoped data:** shared `people.yml`, `faq.yml`, and `categories.yml`, plus Jira-specific data under `data/jira/`.
- **SWR cache:** ticket and user data are cached with different TTLs instead of always hitting Jira live.
- **Triage subagent:** a separate `.claude/agents/jira-triage/agent.md` exists for multi-ticket investigations.
- **PII-aware intent:** the docs prefer an external `atlassian-redacted` MCP path before standard Atlassian fallback.

## Context

**Who it is for:**
- Teams already using Claude Code and Jira who want a reusable internal skill pattern.
- Builders who are comfortable editing policy files, data templates, and MCP setup.

**What it is not for:**
- Anyone expecting a turnkey Jira integration product.
- Teams that need a versioned release, license clarity, or verified public install path today.

**Why it matters:**
- It shows a strong pattern for wrapping issue-tracker workflows behind one skill.
- It also shows how quickly a promising prompt-pack stops short of production readiness when packaging details are missing.

## Key Numbers / Stats

- **Repo age:** Created on `2026-04-06`, so it was about 11 days old on `2026-04-17`. - [GitHub API repo metadata](https://api.github.com/repos/michaeltarleton/jira-expert) - **HIGH**
- **GitHub activity:** `0` stars, `0` forks, `0` open issues, `1` visible contributor, `0` tags, `0` releases on `2026-04-17`. - [GitHub API repo metadata](https://api.github.com/repos/michaeltarleton/jira-expert), [GitHub API tags](https://api.github.com/repos/michaeltarleton/jira-expert/tags), [GitHub API releases](https://api.github.com/repos/michaeltarleton/jira-expert/releases) - **HIGH**
- **Documented interface surface:** `10` modes (`find-user`, `get-ticket`, `create-ticket`, `search`, `edit-ticket`, `transition`, `comment`, `mentions`, `triage`, `help`). - [README.md](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/README.md), [Modes reference](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/docs/modes.md) - **HIGH**
- **Atlassian client mismatch:** repo docs use `https://mcp.atlassian.com/mcp`, while Atlassian's current support docs recommend `https://mcp.atlassian.com/v1/mcp`. - [Repo setup guide](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/docs/setup.md), [Atlassian getting started](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/) - **HIGH**

## Links & Resources

### Core

- [GitHub repo](https://github.com/michaeltarleton/jira-expert)
- [README.md](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/README.md)
- [Repo CLAUDE.md](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/CLAUDE.md)

### Setup and platform docs

- [Repo setup guide](https://raw.githubusercontent.com/michaeltarleton/jira-expert/master/docs/setup.md)
- [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- [Claude Code settings docs](https://code.claude.com/docs/en/settings)
- [Atlassian getting started](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/)
- [Atlassian IDE setup](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/setting-up-ides/)
