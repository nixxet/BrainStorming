---
title: mcp-atlassian
tags: [research, jira, confluence, atlassian, mcp]
created: 2026-04-19
updated: 2026-04-19
status: complete
---

# mcp-atlassian

## What It Is

`mcp-atlassian` is a full-featured open-source MCP server for Jira and Confluence. It supports Atlassian Cloud and Server/Data Center, multiple transports, multiple authentication modes, and a broad tool surface for search, read, write, transition, attachment, service-desk, agile, metrics, and Confluence operations.

## Key Concepts

- **MCP server, not prompt pack:** exposes Jira and Confluence operations as tools for MCP-compatible clients.
- **Multi-transport deployment:** supports `stdio`, `sse`, and `streamable-http`.
- **Cloud and Server/DC support:** bridges differences in auth, content format, and API behavior.
- **Remote-friendly auth:** includes API token, PAT, OAuth 2.0, BYOT, and OAuth proxy + DCR flows.
- **Operational packaging:** ships docs, tests, Docker, Helm, CI, and release automation.

## Context

**Who it is for:**
- Teams that want agent access to Jira and Confluence from Claude Desktop, Cursor, Copilot-adjacent stacks, or remote MCP clients.
- Builders willing to self-host or own credentials and deployment posture.

**What it is not for:**
- Teams that need an official Atlassian-supported MCP server binary they control entirely through Atlassian.
- Users who want zero-config deployment without understanding auth and permissions.

**Why it matters:**
- It is the strongest self-hostable Atlassian MCP option in this three-repo cluster.
- It closes much of the gap between raw Jira REST calls and a usable agent interface.

## Key Numbers / Stats

- **Repo activity on 2026-04-19:** `4,970` stars, `1,115` forks, `261` open issues, MIT licensed, public homepage/docs, pushed on `2026-04-10`. - [GitHub API repo metadata](https://api.github.com/repos/sooperset/mcp-atlassian) - **HIGH**
- **Latest release:** `v0.21.1`, published on `2026-04-10`, specifically fixing a fresh-install startup crash and adding new features. - [GitHub latest release](https://api.github.com/repos/sooperset/mcp-atlassian/releases/latest) - **HIGH**
- **Package metadata:** current PyPI release is `0.21.1`, requires Python `>=3.10`. - [PyPI JSON](https://pypi.org/pypi/mcp-atlassian/json), [pyproject.toml](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/pyproject.toml) - **HIGH**
- **Tool surface:** README documents `72` tools total; source code documents `21` named toolsets and a pending default-toolset behavior change in `v0.22.0`. - [README.md](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/README.md), [toolsets.py](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/src/mcp_atlassian/utils/toolsets.py) - **HIGH**

## Links & Resources

### Core

- [GitHub repo](https://github.com/sooperset/mcp-atlassian)
- [README.md](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/README.md)
- [pyproject.toml](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/pyproject.toml)
- [SECURITY.md](https://raw.githubusercontent.com/sooperset/mcp-atlassian/main/SECURITY.md)

### Docs

- [Installation](https://mcp-atlassian.soomiles.com/docs/installation)
- [Authentication](https://mcp-atlassian.soomiles.com/docs/authentication)
- [HTTP Transport](https://mcp-atlassian.soomiles.com/docs/http-transport)
- [Compatibility](https://mcp-atlassian.soomiles.com/docs/compatibility)
- [Tools Reference](https://mcp-atlassian.soomiles.com/docs/tools-reference)

### Atlassian references

- [Atlassian Rovo MCP getting started](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/)
- [Atlassian Rovo MCP supported tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)
- [Add an external MCP server from Atlassian Administration](https://support.atlassian.com/organization-administration/docs/add-an-external-mcp-server-from-atlassian-administration/)
