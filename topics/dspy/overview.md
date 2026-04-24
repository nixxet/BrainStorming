---
title: DSPy
tags: [framework, optimization, llm-programming]
created: 2026-04-06
status: complete
---

# DSPy — Programming Language Models

## What It Is

DSPy is Stanford NLP's framework for *programming* language models rather than prompting them. You declare input/output specs (signatures) and define success metrics; DSPy's optimizers automatically synthesize and refine prompts and few-shot examples to maximize your metric. It shifts the paradigm from "write a prompt" to "define what good looks like and let the system optimize toward it."

**Latest version:** 3.1.3 (Feb 2026)  
**License:** MIT  
**Language:** Python only (TypeScript alternative: [Ax](#links))

## Key Concepts

- **Signatures:** Declarative input/output specifications. Define types, field descriptions, and constraints; DSPy generates optimized prompts automatically.
  
- **Modules:** Composable LLM strategies — `Predict` (single call), `ChainOfThought` (reasoning), `ReAct` (agent-style), `ProgramOfThought` (code generation).

- **Teleprompter Optimizers:** Algorithms that tune prompts and select few-shot examples automatically:
  - `BootstrapFewShot` — ~10-50 LLM calls, $0.50-2 cost
  - `MIPROv2` — 40+ trials, $5-50 cost, deeper optimization
  - `GEPA` — Reflective prompt evolution
  - `SIMBA` — New in 3.x

- **Teacher-Student Pattern:** Optimize with an expensive model (Opus), deploy with a cheap model (Haiku). Achieves 50-60% cost reduction by distilling expensive reasoning into optimized prompts for cheap inference.

- **Multi-modal and Reasoning:** 3.x supports native images, audio, and reasoning models (Claude, o1) via `dspy.Reasoning`.

## Context

- **When to use:** You have labeled examples (10-500+), clear success metrics, and structured tasks (classification, extraction, generation). Best fit: classification pipelines, document processing, entity extraction, customer support automation.
  
- **When NOT to use:** Open-ended generation, creative writing, or when you lack labeled data or clear metrics. Also poor fit if you need JavaScript/TypeScript and cannot run a Python sidecar.

- **Typical workflow:** (1) Define signature, (2) Run BootstrapFewShot on labeled data (10-50 calls, $0.50-2), (3) Deploy optimized program in production, (4) Monitor and iterate.

## Key Numbers & Stats

- **GitHub:** ~33K stars, ~395 contributors ([GitHub](https://github.com/stanfordnlp/dspy)) — **HIGH** confidence
- **PyPI:** ~160K monthly downloads ([PyPI](https://pypi.org/project/dspy/)) — **HIGH** confidence
- **Performance gains:** +21% accuracy (GPT-4o-mini 66%→87%) ([Arxiv](https://arxiv.org/html/2412.15298v1)) — **HIGH** confidence
- **Optimization cost:** $2-5 for 500 examples with BootstrapFewShot ([Source](https://dspy.ai/api/optimizers/BootstrapFewShot/)) — **HIGH** confidence
- **Cost reduction (teacher-student):** 50-60% vs. Sonnet-only baseline ([Pricing Analysis](https://panelsai.com/claude-api-pricing/)) — **HIGH** confidence (not literal 50x; actual is ~19x model price ratio)
- **Framework overhead:** 3.53ms (lowest vs LangChain ~10ms, LlamaIndex ~6ms) ([Comparison](https://deeplp.com/f/langchain-llamaindex-and-dspy-%E2%80%93-a-comparison)) — **HIGH** confidence

## Links

- [Official DSPy Docs](https://dspy.ai/)
- [GitHub Repository](https://github.com/stanfordnlp/dspy)
- [DSPy Roadmap](https://dspy.ai/roadmap/)
- [Deployment Guide](https://dspy.ai/tutorials/deployment/)
- [Optimization Overview](https://dspy.ai/learn/optimization/overview/)
- **TypeScript Alternative:** [Ax Framework](https://github.com/ax-llm/ax) — "pretty much official DSPy for TypeScript"
