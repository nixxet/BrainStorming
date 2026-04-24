---
title: Claude How To — Research Notes
tags: [research, findings]
created: 2026-04-10
status: complete
---

# Claude How To — Research Notes

## Key Findings

### Scope & Learning Design

- **[HIGH]** `claude-howto` covers the major practical Claude Code feature areas: slash commands, memory, checkpoints, skills, hooks, MCP, subagents, advanced features, plugins, and CLI usage. — [GitHub repo](https://github.com/luongnv89/claude-howto), [LEARNING-ROADMAP.md](https://github.com/luongnv89/claude-howto/blob/main/LEARNING-ROADMAP.md)
- **[HIGH]** The repository is structured as a curriculum rather than just a snippet dump: roadmap, feature catalog, quick reference, and numbered modules create a guided learning path. — [README](https://github.com/luongnv89/claude-howto/blob/main/README.md), [CATALOG.md](https://github.com/luongnv89/claude-howto/blob/main/CATALOG.md)
- **[HIGH]** The example-first format gives the repo real onboarding and pattern-mining value. — [README](https://github.com/luongnv89/claude-howto/blob/main/README.md)

### Community & Maintenance

- **[HIGH]** The repo has strong adoption signals for a documentation/tutorial project: 24.6k stars, 2.9k forks, 6 open issues, and 17 open pull requests as of April 10, 2026. — [GitHub repo](https://github.com/luongnv89/claude-howto), [Issues](https://github.com/luongnv89/claude-howto/issues), [Pull requests](https://github.com/luongnv89/claude-howto/pulls)
- **[MEDIUM]** Recent issue and PR activity supports the claim that the project is active. — [Issues](https://github.com/luongnv89/claude-howto/issues), [Pull requests](https://github.com/luongnv89/claude-howto/pulls)
- **[MEDIUM]** The README claim that the repo is synced with every Claude Code release and compatible with Claude Code 2.1+ is plausible but not independently verified across all modules. — [README FAQ](https://github.com/luongnv89/claude-howto/blob/main/README.md)

### Security & Contributor Discipline

- **[HIGH]** The repository has a stronger-than-average documented security posture for a tutorial repo, including disclosure timelines, secure-example guidance, and suggested local security scans. — [SECURITY.md](https://github.com/luongnv89/claude-howto/blob/main/SECURITY.md)
- **[HIGH]** The repo’s own CLAUDE.md frames the project as a tutorial rather than a reusable library, which is a healthy expectation-setting signal. — [CLAUDE.md](https://github.com/luongnv89/claude-howto/blob/main/CLAUDE.md)

## Counterarguments & Risks

### Operational Risks

- **[MEDIUM-HIGH]** The copy-paste orientation creates operational risk: users may import commands, hooks, skills, or MCP patterns without checking them against local standards and permissions. — [README](https://github.com/luongnv89/claude-howto/blob/main/README.md), [SECURITY.md](https://github.com/luongnv89/claude-howto/blob/main/SECURITY.md)
- **[MEDIUM]** The repo is shell-first, which reduces immediate usability for Windows-first users unless they translate commands. — [README](https://github.com/luongnv89/claude-howto/blob/main/README.md), [Claude Code Overview](https://code.claude.com/docs/en/overview)
- **[MEDIUM]** Internal documentation gaps still occur. Open issue `#43` and PR `#62` around the code-review skill show that even polished teaching repos can have broken references. — [Issues](https://github.com/luongnv89/claude-howto/issues), [Pull requests](https://github.com/luongnv89/claude-howto/pulls)

## Alternatives

- **Official Claude Code docs** — Best when you need product-truth behavior, installation details, or current workflow syntax. — [Overview](https://code.claude.com/docs/en/overview), [Common Workflows](https://code.claude.com/docs/en/common-workflows)
- **`claude-howto`** — Best when you need a structured learning path, examples, and `.claude/` patterns. — [GitHub repo](https://github.com/luongnv89/claude-howto)

## Gaps & Unknowns

- No full compatibility matrix was found for repo examples across current Claude Code versions/models.
- No Windows-native walkthrough was verified in this pass.
- No audit was performed on bundled commands, hooks, skills, or plugin examples.
- No direct comparison yet against other major community guide repos.

## Confidence Summary

- **HIGH:** 7 findings
- **MEDIUM:** 4 findings
- **MEDIUM-HIGH:** 1 finding
- **LOW:** 0 findings
- **UNVERIFIED:** 1 finding
