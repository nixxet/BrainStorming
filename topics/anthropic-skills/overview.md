---
title: Anthropic Agent Skills
tags: [research, evaluate]
created: 2026-04-06
status: complete
---

# Anthropic Agent Skills

## What It Is

Anthropic Agent Skills is an open standard (released December 2025) for packaging reusable instructions, workflows, and context that extend Claude and other AI agents with specialized capabilities. A skill is a folder containing a SKILL.md file (metadata + Markdown instructions) plus optional scripts, references, and assets. The format has been adopted by 26+ platforms including GitHub Copilot, OpenAI Codex, Google Gemini CLI, and Microsoft VS Code.

## Key Concepts

- **SKILL.md format:** Two required fields (name, description) + optional fields (license, compatibility, metadata, allowed-tools). Minimal spec, high ceiling for complexity.
- **Progressive Disclosure:** Metadata loaded at startup (~100 tokens); full instructions on activation (<5000 tokens); resources on demand. Architecture is context-efficient.
- **Complementary to MCP:** Skills are the "procedures layer" (how to approach tasks); MCP is the "capabilities layer" (what tools can do). Both are necessary.
- **Marketplace & Ecosystem:** Official anthropics/skills repo (107k stars), Vercel's skills.sh (700,000+ indexed skills), OpenClaw registry, and partner-built skills from Canva, Notion, Figma, Atlassian, Stripe.

## Context

- **Who uses this:** Developers building agents in Claude Code, vs Code extensions, API integrations, and other compatible platforms; enterprises provisioning standardized workflows
- **When:** Best for focused, narrowly-scoped tasks; less effective for elaborate multi-step workflows
- **Why:** Reduces friction for teaching agents specialized approaches; enables ecosystem of reusable workflows; provides alternative to prompt engineering for every new task

## Key Numbers / Stats

- **107k GitHub stars** (anthropics/skills, April 6, 2026) — [GitHub repo](https://github.com/anthropics/skills) — HIGH confidence
- **26+ platforms adopted** the open standard within 4 months — [agentskills.io spec](https://agentskills.io/specification) — HIGH confidence
- **700,000+ indexed skills** on Vercel's skills.sh marketplace — [skills.sh](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) — MEDIUM confidence (includes low-quality and duplicates)
- **97 million monthly MCP SDK downloads** (early 2026) — reflects strong developer interest in agent extensibility — MEDIUM confidence
- **26,000+ installs in first month** (skills.sh top skills) — [Vercel announcement](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) — MEDIUM confidence (early adoption cohort)

## Links

- [Official Specification — agentskills.io](https://agentskills.io/specification)
- [anthropics/skills GitHub Repository](https://github.com/anthropics/skills)
- [Claude API Docs — Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Claude Code Documentation — Skills](https://code.claude.com/docs/en/skills)
- [Skill-Creator Tool](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
- [Vercel skills.sh Marketplace](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem)
