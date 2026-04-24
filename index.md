# BrainStorming — Topic Index

| Topic | Status | Verdict |
|-------|--------|---------|
| [Agent Frameworks 2026](topics/agent-frameworks-2026/) | Unknown | Do not overweight framework choice in agent architecture decisions. Framework differentiation is real but secondary. |
| [Andrej Karpathy Claude Skills](topics/andrej-karpathy-claude-skills/) | Unknown | Conditional recommendation: Use as a thinking framework and team philosophy, NOT as a guaranteed control mechanism. |
| [Anthropic Skills](topics/anthropic-skills/) | Unknown | Conditional: Yes for focused workflows; No for complex orchestration. The technology is mature and the standard is stable, but operational and security challenges require careful deployment planning. |
| [Atlassian Forge Sentiment](topics/atlassian-forge-sentiment/) | Unknown | Do not adopt `atlassian-forge-sentiment` as a current Jira app. Use it only as a reference sketch for in-issue sentiment triage, then rebuild the idea on modern Forge primitives. |
| [Autoresearch](topics/autoresearch/) | Unknown | Do not adopt autoresearch directly as a general-purpose ML optimization tool. Production claims are not yet validated. |
| [Claude Code Roadmap Leak](topics/claude-code-roadmap-leak/) | Unknown | Do not bet on KAIROS shipping in 2026, and do not plan project timelines around leaked flags. The leak is real and well-documented (SecurityWeek), but Anthropic has provided no official explanation of... |
| [Claude Folder Anatomy](topics/claude-folder-anatomy/) | Unknown | Useful reference article, but dated. The March 2026 analysis was accurate for the time but missed critical reliability issues that surfaced in the following two weeks (April 2026 rate limit incident, ... |
| [Claude Howto](topics/claude-howto/) | Unknown | We recommend it because the repository has broad feature coverage [HIGH], a real curriculum structure [HIGH], and clear pattern-mining value for commands, memory, skills, hooks, MCP, and subagent work... |
| [Claude Mem](topics/claude-mem/) | Unknown | SKIP by default. CONDITIONAL only for isolated solo experimentation. |
| [Codebase Memory](topics/codebase-memory/) | Unknown | CONDITIONAL ADOPT |
| [Deepagents](topics/deepagents/) | Unknown | CONDITIONAL ADOPT for autonomous, planning-heavy agents. |
| [Deeptutor](topics/deeptutor/) | Unknown | CONDITIONAL REUSE — Recommend architectural patterns for reuse in document-grounded agents, RAG pipelines, and persistent-agent systems. |
| [Dspy](topics/dspy/) | Unknown | For projects with labeled data and clear metrics: Viable and worth testing.   For teams without labeled data: Not recommended until you can collect examples. |
| [Fathom Mcp](topics/fathom-mcp/) | Unknown | CONDITIONAL RECOMMENDATION |
| [Fathom Simple Mcp](topics/fathom-simple-mcp/) | Unknown | Fathom-Simple-MCP is well-engineered for solo developers and internal prototyping, but fundamentally unsuitable for production multi-user, compliance-sensitive, or high-volume deployment scenarios. |
| [Generic Agent](topics/generic-agent/) | Unknown | Use GenericAgent for single-agent local system automation research and isolated personal automation; do not position it as a general-purpose production framework competitor to LangGraph/CrewAI. |
| [Harness Design Long Running Apps](topics/harness-design-long-running-apps/) | Unknown | Use harness design if and only if: |
| [Hermes Agent](topics/hermes-agent/) | Unknown | ## What To Actually Do |
| [Hyperframes](topics/hyperframes/) | Unknown | Verdict: CONDITIONAL DO-NOT-RECOMMEND for production agent workflows. Conditional recommend for experimental/sandbox use with explicit prerequisites. Watch-list for 6-month re-evaluation. |
| [Jcodemunch Mcp](topics/jcodemunch-mcp/) | Unknown | Conditional recommendation. jCodeMunch is suitable for organizations that: 1. Have keyword-discoverable codebases where symbol-level lookup is the primary navigation pattern 2. |
| [Jira Expert](topics/jira-expert/) | Unknown | Use `jira-expert` as a reference implementation or internal starter kit for a Claude Code Jira skill, not as a turnkey, production-ready Jira integration. |
| [Jira Issue Assign](topics/jira-issue-assign/) | Unknown | Do not adopt `jira-issue-assign` as a current Jira automation baseline. Keep it only as a historical reference for the idea of learning assignee patterns from closed tickets. |
| [Jira Js](topics/jira-js/) | Unknown | Conditional recommend. For TypeScript/Node.js projects that need programmatic Jira Cloud access, adopt jira. |
| [Karpathy Autoresearch](topics/karpathy-autoresearch/) | Unknown | Use autoresearch for narrow, single-GPU hyperparameter tuning tasks with well-understood search spaces, fast deterministic evaluation metrics, and platform-specific constraints. |
| [Langchain](topics/langchain/) | Unknown | Qualified adopt for stateful multi-step agents (via LangGraph); conditional adopt for broad-integration glue (via LangChain core); avoid for simple single-step inference. |
| [Langgraph](topics/langgraph/) | Unknown | Adopt when you need custom durable multi-step agent orchestration with explicit state, interrupts, replay, or subgraphs. Skip for simple chat and tool loops unless those controls are already required. |
| [Markitdown](topics/markitdown/) | Unknown | Adopt MarkItDown as the default choice for multi-format document ingestion into LLM/RAG pipelines when structure preservation is non-critical. |
| [Mattpocock Skills](topics/mattpocock-skills/) | Unknown | Skills are useful for narrow, repeatable workflows but introduce reliability and cost risks that require safeguards in production. |
| [Mcp Atlassian](topics/mcp-atlassian/) | Unknown | Adopt `mcp-atlassian` when you want a self-hostable Atlassian MCP server and you are willing to own credentials, deployment, and upgrade hygiene. |
| [Memsearch](topics/memsearch/) | Unknown | Memsearch is suitable for prototyping and low-scale deployments (< 5M vectors, single-threaded search). Issue #80 (concurrent access lock) was resolved in v0.1. |
| [Multica](topics/multica/) | Unknown | CONDITIONAL RECOMMEND for exploration; DEFER production — Multica is a promising early-stage platform entering a high-growth market (1,445% YoY surge, $8. |
| [Obra Superpowers](topics/obra-superpowers/) | Unknown | CONDITIONAL ADOPT — Claude Code + complex production feature development — ONLY under all three pre-requisites below. |
| [Open Mythos](topics/open-mythos/) | Unknown | ADOPT (Conditional) for research on inference scaling; PROCEED to production pilots ONLY IF: - [Prerequisite A] Community-trained OpenMythos on FineWeb-Edu validates the 770M ≈ 1. |
| [Openai Agents Python](topics/openai-agents-python/) | Unknown | Conditional pass. Based on moderate evidence, we recommend `openai-agents-python` when a project clearly needs SDK-managed orchestration, tools, handoffs, sessions, and tracing, because official docs ... |
| [Openclaude](topics/openclaude/) | Unknown | UNCHANGED: We do not recommend OpenClaude for production agentic workflows or team deployments. OpenClaude is technically viable as a minimal fork of Claude Code with strong adoption momentum (17. |
| [Openscreen](topics/openscreen/) | Unknown | Conditional recommendation — suitable for specific use cases only, NOT a general replacement for Screen Studio. |
| [Paperclip](topics/paperclip/) | Unknown | Prototype and validate at 5+ agent scale. Not production-ready for enterprise workloads (50+ agents, multi-month runs). |
| [Prompt Master](topics/prompt-master/) | Unknown | Do not install Prompt Master as a required or primary prompt engineering tool. Instead, extract and reference the reference material (SKILL. |
| [Public Apis](topics/public-apis/) | Unknown | Rationale: Public-APIs is useful for exploratory research and understanding API categories, but faces credibility crises that disqualify it for production use: |
| [Uv](topics/uv/) | Unknown | CONDITIONALLY RECOMMEND for new Python projects on macOS and Linux. Strong adoption metrics (83k stars, 124M downloads), real speed gains (3–5x cold install—vendor-sourced but verified), PEP complianc... |
| [Vercel Skills Cli](topics/vercel-skills-cli/) | Unknown | Recommendation: ADOPT for personal/team use; DEFER for enterprise production until gaps close. |
| [Web Search Mcp](topics/web-search-mcp/) | Unknown | Suitable for low-stakes prototyping only. Unsuitable for production without substantial hardening. |
