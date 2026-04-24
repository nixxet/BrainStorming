---
title: Karpathy's Autoresearch
tags: [research, autonomous-ml, hyperparameter-optimization]
created: 2026-04-09
status: complete
---

# Karpathy's Autoresearch

## What It Is

Autoresearch is a 630-line Python tool that conducts autonomous hyperparameter tuning via a tight agent loop: propose code changes, train for a fixed 5-minute window, evaluate against a target metric, keep or discard the change, repeat. The system uses the Claude API exclusively to generate proposals and runs approximately 12 experiments per hour on a single GPU, enabling 100+ iterations overnight. It is intentionally minimalist—single file modification (train.py), single metric (validation bits-per-byte), single GPU, no parallelization.

## Key Concepts

- **Agent Loop:** Propose-train-evaluate-gate cycle. The Claude API generates code proposals; the training harness runs each proposal for exactly 5 minutes; evaluation compares the validation metric; a gate function commits or reverts the change.
- **program.md Interface:** All human control flows through a single Markdown file containing natural-language research directives. The agent reads this before each iteration; no code editing required.
- **Wall-Clock Time Budget:** Fixed 5-minute training window ensures consistent throughput (~12 experiments/hour) **within a single hardware platform**, but breaks cross-hardware reproducibility. Optimizations found on H100 degrade on RTX 4090 or Apple Silicon—platform-specific overfitting is fundamental, not a bug.
- **Evaluation Metric:** Uses vocab-size-independent metrics (bits-per-byte) for fair cross-experiment comparison, even with different tokenizer configurations.
- **Scope Constraint:** Modifies only one file (train.py) and optimizes a single metric. Not general-purpose research automation.
- **Incremental Discovery:** Finds hyperparameter adjustments and minor algorithmic tweaks, not novel architectures or breakthrough insights.
- **Metric Gate:** Strictly commits only improvements that increase the evaluation metric. Acts as a filter against degenerate changes.

## Context

- **Who uses this:** ML researchers optimizing training pipelines, engineers fine-tuning model hyperparameters, teams exploring parameter space on small models.
- **When:** Useful for rapid overnight hyperparameter search when you have a fast, deterministic evaluation metric and single-GPU constraints.
- **Why it matters:** Reduces manual trial-and-error; demonstrates that autonomous agents can reliably improve code within narrow, well-defined domains. Provides a template for autonomous optimization at the boundary of hyperparameter tuning and code generation.

## Key Numbers / Stats

- **66,000+ GitHub stars and 9,600+ forks** within weeks of release (March 7, 2026) — [GitHub karpathy/autoresearch](https://github.com/karpathy/autoresearch) — HIGH confidence
- **Shopify 53% Liquid parse+render speedup** in 2–3 days using autoresearch (93 commits from 120 experiments, 974 tests passing, zero regressions) — [GitHub Shopify/liquid PR #2056](https://github.com/Shopify/liquid/pull/2056) — HIGH confidence
- **2.82% improvement on nanochat** validation bits-per-byte (baseline 1.003 → 0.974) via hyperparameter tuning — [GitHub karpathy/autoresearch](https://github.com/karpathy/autoresearch) — HIGH confidence (factual), MEDIUM confidence (as generalization claim)
- **~12 experiments per hour** on single GPU; ~100+ overnight runs — [GitHub karpathy/autoresearch](https://github.com/karpathy/autoresearch) — HIGH confidence (nanochat + H100; larger models and consumer GPUs achieve 5–8/hour)
- **~$300 compute cost** for initial demo (13 H100s + 3 H200s for 8 hours) — [SkyPilot Blog: Scaling Autoresearch](https://blog.skypilot.co/scaling-autoresearch/) — HIGH confidence (per-run compute); LOW confidence (true amortized cost-per-useful-improvement estimated ~$10–50k)
- **50+ derivative projects** in ecosystem (forks for computer vision, reinforcement learning, scientific simulation) — [GitHub alvinreal/awesome-autoresearch](https://github.com/alvinreal/awesome-autoresearch) — HIGH confidence (ecosystem exists); LOW confidence (many forks exploratory, not production-validated)
- **Classical HPO methods outperform LLM agents** in constrained hyperparameter search spaces (Centaur, TPE, SMAC beat Karpathy Agent in nanochat benchmark) — [arXiv: Can LLMs Beat Classical Hyperparameter Optimization Algorithms?](https://arxiv.org/html/2603.24647) — MEDIUM confidence (single peer-reviewed study; needs replication)

## Links

- [Official Repository (GitHub)](https://github.com/karpathy/autoresearch)
- [SkyPilot Blog: Scaling Autoresearch](https://blog.skypilot.co/scaling-autoresearch/)
- [arXiv: Can LLMs Beat Classical Hyperparameter Optimization Algorithms?](https://arxiv.org/html/2603.24647)
- [arXiv: Why LLMs Aren't Scientists Yet](https://arxiv.org/html/2601.03315v1)
