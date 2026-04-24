---
title: mattpocock/skills
tags: [research, landscape]
created: 2026-04-13
status: complete
---

# mattpocock/skills

## What It Is


## Key Concepts

- **Agent Skills:** A portable, composable standard for packaging domain knowledge and workflows as reusable instructions that agents load on-demand.
- **SKILL.md Format:** Markdown files with YAML frontmatter (name, description, trigger rules) and procedural instructions. Progressive disclosure: metadata loads at startup (~100 tokens), full instructions load only when triggered.
- **Trigger Mechanism:** Skills activate when a user request matches the description in the frontmatter. Triggering is automatic for compatible agents.
- **Design It Twice Philosophy:** Exemplified by design-an-interface skill—generates multiple radically different design approaches in parallel, then compares them.
- **Portable and Cross-Platform:** SKILL.md is an open standard adopted by OpenAI, GitHub Copilot, Cursor, Atlassian, Figma, and others.
- **Tessl Registry:** Package manager and discovery hub for 2,000+ evaluated skills with security scanning and versioning.

## Context

- **Community Traction:** The grill-me skill went viral in early 2026, directly driving GitHub stars from 9k to 10.8k in one month.
- **Ecosystem Signal:** Rapid adoption by major platforms (OpenAI, GitHub, Microsoft, Cursor, Atlassian) within 4 months of the open standard release suggests industry-wide validation.
- **Teaching Resource:** mattpocock/skills serve as exemplary baselines for teams standardizing workflows around Agent Skills best practices.

## Key Numbers / Stats

- **10.8k GitHub stars** (as of April 2026, up from 9k in March 2026) — [Star History](https://www.star-history.com/mattpocock/skills) — **HIGH** confidence
- **17+ developer workflow skills** spanning planning, development, and tooling domains — [GitHub README](https://github.com/mattpocock/skills) — **HIGH** confidence
- **Viral grill-me skill** (early 2026) achieved broad utility outside coding; drove 1.8k star growth in one month — [X post](https://x.com/mattpocockuk/status/2036076132924100760) — **HIGH** confidence
- **4-month adoption curve:** Agent Skills standard (Dec 2025) now adopted by OpenAI, GitHub Copilot, Cursor, Atlassian, Figma, and 40+ other platforms — [The New Stack](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/) — **HIGH** confidence
- **2,000+ skills in Tessl registry** with Snyk security scanning and lifecycle management — [Tessl Platform](https://tessl.io/) — **MEDIUM** confidence
- **26.4% of public skills** lack proper routing descriptions, defeating progressive disclosure efficiency — [SkillReducer peer-reviewed study](https://arxiv.org/html/2603.29919) — **MEDIUM** confidence

## Links

- **Official Repository:** [github.com/mattpocock/skills](https://github.com/mattpocock/skills)
- **Tessl Registry:** [tessl.io — mattpocock/skills](https://tessl.io/registry/skills/github/mattpocock/skills)
- **Anthropic Official:** [Agent Skills Documentation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- **Agent Skills Blog Post:** [Equipping Agents for the Real World with Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills)
