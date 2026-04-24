---
title: Harness Design — Notes
tags: [ai-engineering, multi-agent, harness, anthropic]
created: 2026-03-30
updated: 2026-04-06
---

# Notes

## Patterns Worth Stealing

- **Context resets vs. compaction** — Full context clear with summary handoff outperforms trying to compress existing context (validated by Opus 4.6 doing away with this trade-off)

## Task Categorization: When Harness Design Helps vs. Hurts

### Where Harness Design is High-ROI (Use It)

1. **Creative/Design Tasks** — Frontend design, UI/UX, visual systems, writing quality evaluation
   - Reason: Subjective evaluation criteria; self-confirmation bias is severe
   - Example: Anthropic's retro game and DAW builds
   - Expected improvement: 10-30% quality lift

2. **High-Stakes Code/Architecture** — System design, security-critical code, API contracts
   - Reason: Evaluator catches real bugs (FastAPI routing, API correctness)
   - Expected improvement: 10-20% bug detection vs. solo

3. **Multi-Day Tasks** — Long-running feature builds, complex feature development
   - Reason: Harness maintains coherence across 4-6+ hour sessions
   - Cost justification: 5-10x multiplier acceptable when output is high-stakes

4. **Complex Evaluation Criteria** — Tasks with explicit, measurable rubrics (design quality, originality, craft, functionality)
   - Reason: Evaluator can apply consistent criteria across iterations
   - Expected improvement: Consistency of output vs. variable solo quality

### Where Harness Design is Low-ROI (Avoid It)

1. **Sequential Reasoning Tasks** — Math, logic puzzles, step-by-step transformations
   - Reason: Multi-agent communication overhead degrades performance 39-70% (Google Research)
   - Cost: Not worth it; use solo agent
   - Example: "Solve these 5 differential equations"

2. **Routine, Low-Stakes Tasks** — Customer service, form-filling, data extraction
   - Reason: Output quality variation is acceptable; cost overhead not justified
   - Cost multiplier: 5-10x is too high for routine work

3. **Latency-Critical Tasks** — Real-time APIs, sub-minute response requirements
   - Reason: Harness overhead makes this impossible; 6-hour turnaround doesn't fit
   - Alternative: Solo agent or fine-tuned model

4. **Early-Stage Prototypes** — Research, exploration, proof-of-concept work
   - Reason: Engineering overhead is 2-4 weeks; exploration velocity suffers
   - Alternative: Solo agent + manual review in early phases

## Cost-Quality Trade-Offs (Updated April 2026)

| Approach | Cost/Hour | Output Quality | Engineering Effort | Production Reliability | |----------|-----------|---------------|--------------------|----------------------| | **Solo Agent** | $9-50 | Variable; breaks on complex tasks | Minimal | 10% (90% fail in production) | | **Harness Design** | $200-500 | 10-20% improvement; fewer bugs | 2-4 weeks | ~20% (70% fail in enterprise) | | **Fine-Tuning + RL** | $1K-10K | Depends on training data | 4-8 weeks | 30-50% (estimated) | | **Model Tiering** | $30-100 | Acceptable for routine; lower overall | 1-2 weeks | 15-25% |

**Key insight:** Harness design improves output quality, not production reliability. Production failures come from integration, edge cases, and deployment issues that harness design doesn't address.

## Model Evolution Impact: Harness Simplification

**Sonnet 4.5 era:**
- Context resets necessary (agents ran 1-2 hours, then coherence dropped)
- Full context compaction (summarize + replace) was required for long tasks
- Multi-agent overhead was essential for 4+ hour tasks

**Opus 4.6 era (Feb 2026):**
- Context resets optional (1M token context + automatic compaction)
- Automatic server-side summarization; no manual handoff needed
- Sprint decomposition optional; single continuous session possible
- Evaluators valuable only at capability edges, not routine QA

**Implication for practitioners:**
- Re-validate harness designs per new Claude release
- Harnesses built for Sonnet 4.5 may have dead-weight components in Opus 4.6
- Cost-benefit calculation changes with each model update

## Failure Modes & Limitations

### Multi-Agent Amplification
- Error amplification up to **17.2x** vs. single-agent baseline (UC Berkeley MAST)
- Unstructured multi-agent networks are fragile
- Format mismatches (YAML vs JSON) cascade into workflow failures
- Conflicting resource ownership causes silent failures

### Evaluator Limitations
- **Shallow testing:** QA agents don't explore edge cases deeply
- **Limited to interactive assessment:** Playwright MCP works for UI/UX; not applicable to API-only backends or performance testing
- **Domain knowledge gaps:** Evaluators miss security issues, performance antipatterns, or domain-specific problems
- **Overhead:** Every bug fixed requires re-running evaluation; iteration cycles are expensive

### Context Compaction Trade-Off
- **Preserves narrative:** 80-90% of token cost reclaimed
- **Loses nuance:** Context loss emerges on subsequent turns referencing pre-compaction decisions
- **Not lossless:** Codebase-specific context, architectural patterns, prior design decisions get summarized away

### Production Reliability
- **90% of agent projects fail within 30 min** of production deployment
- **73% of enterprise deployments fail within 1 year**
- Harness design is necessary (improves orchestration) but not sufficient (doesn't solve broader reliability crisis)
- Separate concern from output quality

## Emerging Alternatives Worth Monitoring

### AutoAgent Meta-Harness (April 2026)
- **Concept:** Meta-agent automatically optimizes harness code (system prompt, tool definitions, routing logic) overnight
- **Status:** Very new; only 1 case study published
- **Potential:** Sidesteps manual harness engineering; could democratize harness design
- **Risk:** Immature; likely needs human validation of generated harnesses

### Meta-Harness Framework (Stanford Research)
- **Concept:** Outer-loop system that searches harness code space to find optimal orchestration per task
- **Key innovation:** Rejects information compression; full context preservation
- **Status:** Research prototype; not production-ready
- **Potential:** Could provide principled harness design vs. current ad-hoc approaches

### Fine-Tuning + RL (AWS Production Patterns)
- **Concept:** Supervised Fine-Tuning + Reinforcement Learning (GRPO, DAPO, GSPO) to improve long-task coherence
- **Cost:** $1K-10K per model, 4-8 weeks
- **Advantage:** Creates stable artifact (trained model) vs. harness design (which drifts with model updates)
- **Trade-off:** Requires training data; slower iteration cycle

## Open Questions

1. **When does harness complexity become justified?** — Define clear criteria (e.g., "if solo output quality varies by >20% on multiple runs, consider a harness")

2. **How to make QA agents test deeper?** — Current guidance is "tune the prompt"; no principled approach to edge case discovery

3. **Can sprint contracts be auto-generated** from existing test suites or acceptance criteria instead of manual negotiation?

4. **How do harnesses port across model versions?** — Will a harness built for Opus 4.6 work with Opus 5.0? What breaks? How to version harnesses?

5. **Cost-benefit threshold:** What's the minimum output quality improvement that justifies 5-10x cost multiplier?

6. **Failure triage:** When a harness fails, how to diagnose: model issue vs. harness design issue vs. evaluator limitation?

7. **Cross-framework comparison:** How do Claude Agent SDK harnesses compare to LangGraph, CrewAI, AutoGen harnesses on the same task?

8. **Evaluator-generator coordination:** Can the generator learn from repeated evaluator feedback and improve without human-in-the-loop?

## Next Steps (Recommendations)


2. **Harness validation:** Create a decision tree for when to use harnesses vs. solo agents based on your specific task categories.

3. **Model upgrade cadence:** Plan to re-evaluate harness designs each time a new Claude release drops (currently: Opus 4.6 / Sonnet 4.6 in Feb 2026).

4. **Monitor alternatives:** AutoAgent meta-harness and fine-tuning approaches are emerging. Revisit in 6 months.

5. **Production reliability:** Recognize that harness design is orthogonal to deployment reliability. Plan separate infrastructure improvements for robustness (observability, error handling, graceful degradation).

---

*Last updated: 2026-04-06*
