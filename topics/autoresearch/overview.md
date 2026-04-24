---
title: Autoresearch (Karpathy Autonomous ML Framework)
tags: [research, evaluate, ml-optimization, agent-framework]
created: 2026-04-06
updated: 2026-04-06
status: complete
---

# Autoresearch — Karpathy Autonomous ML Framework

## What It Is

Autoresearch is a 630-line Python framework released by Andrej Karpathy (March 7, 2026 — about 1 month old) that enables AI agents to autonomously run iterative ML training experiments. The agent modifies a training script, runs a five-minute experiment, measures results against a single metric (validation bits-per-byte), commits if improved or resets if not, and repeats. It's agent-agnostic (works with Claude, Cursor, Windsurf) and demonstrates architectural elegance with early empirical results: 11% speed improvement (2.02 → 1.80 hours time-to-GPT-2-quality) from ~700 autonomous experiments. (See verdict section for confidence assessment.)

## Key Concepts

- **Five-minute time budget:** Every experiment runs for exactly 300 seconds, making throughput predictable (~12 experiments/hour, ~100/night)
- **Three-file separation:** `prepare.py` (data/eval, human-editable), `train.py` (model/optimizer/loop, agent-editable), `program.md` (instructions, human-editable)
- **Git-based tracking:** Successful experiments commit (become new baseline); failures reset instantly. Built-in, auditable experiment history
- **Single clear metric:** `val_bpb` (validation bits-per-byte, lower is better); no ambiguity about success/failure
- **Constrained autonomous loop:** Agent has fixed scope (one file), fixed budget (5 min), fixed metric, human steers via instruction file
- **Agent-agnostic design:** Framework contains no agent code; points any coding agent at `program.md` instruction file
- **Pattern generalizes:** Community adapted framework to GPU kernel optimization, test performance, bundle size, trading agents, genealogy research, and 10+ other domains

## Context

**Who uses it:**
- ML researchers and practitioners optimizing training pipelines on single GPUs
- Companies doing model tuning overnight (Shopify CEO reported 19% improvement on internal query model)
- Community adapting the pattern to non-ML optimization (any measurable metric)

**When:**
- When you need iterative optimization and can afford overnight compute
- When you want a human-steerable, reviewer-friendly automation loop

**Why it matters:**
- Shifts from manual hyperparameter tuning to autonomous agent-driven iteration
- Demonstrates constrained autonomy pattern replicable across domains
- Low cost (API: ~$0.01 per experiment; GPU: ~$3–5 per overnight run)

## Key Numbers / Stats

- **11% speed improvement:** Karpathy achieved 2.02 → 1.80 hours (time-to-GPT-2 quality) over 2 days / ~700 experiments — [VentureBeat](https://venturebeat.com/technology/andrej-karpathys-new-open-source-autoresearch-lets-you-run-hundreds-of-ai) — **MEDIUM** confidence (not peer-reviewed, not independently reproduced)

- **19% validation improvement:** Shopify CEO ran autoresearch on 0.8B query-expansion model, beat 1.6B hand-tuned baseline by 19% in 37 experiments (8 hours) — [Firethering](https://firethering.com/karpathy-autoresearch-ai-agent/) — **MEDIUM** confidence (methodology not published)

- **~700 experiments in 2 days:** Karpathy's demonstration run; discovered ~20 cumulative improvements — [Fortune](https://fortune.com/2026/03/17/andrej-karpathy-loop-autonomous-ai-agents-future/) — **MEDIUM** confidence

- **21,000+ GitHub stars in 1 week:** Viral adoption indicator — [GitHub](https://github.com/karpathy/autoresearch) — **HIGH** confidence

- **10+ major community forks:** macOS (MLX), Windows (RTX), GPU kernels (AutoKernel), distributed (autoresearch@home), browser (WebGPU) — [awesome-autoresearch](https://github.com/alvinreal/awesome-autoresearch) — **HIGH** confidence

- **~12 experiments/hour / ~100 overnight:** Fixed 300-second time budget — [DataCamp](https://www.datacamp.com/tutorial/guide-to-autoresearch) — **HIGH** confidence

- **API + GPU cost: ~$3–5 per 8-hour overnight run** (API: $0.01–$0.10 per experiment × ~100 experiments = $1–10/night; GPU: ~$3 for H100, varies by provider) — [Abhishek Gautam](https://www.abhs.in/blog/andrej-karpathy-autoresearch-autonomous-ai-ml-experiments-2026) — **MEDIUM** confidence (cost scaling not analyzed)

## Links & Resources

**Core:**
- [GitHub: karpathy/autoresearch](https://github.com/karpathy/autoresearch) — Official repository and implementation
- [DataCamp: A Guide to Autoresearch](https://www.datacamp.com/tutorial/guide-to-autoresearch) — Tutorial and mechanics explanation

**Deep Dives & Coverage:**
- [MarkTechPost: Technical Overview](https://www.marktechpost.com/2026/03/08/andrej-karpathy-open-sources-autoresearch-a-630-line-python-tool-letting-ai-agents-run-autonomous-ml-experiments-on-single-gpus/) — Technical breakdown
- [Karpathy X: Vision for Distributed Agents](https://x.com/karpathy/status/2030705271627284816) — Stated roadmap (SETI@home-style)
- [awesome-autoresearch: Community Ecosystem](https://github.com/alvinreal/awesome-autoresearch) — Forks, variants, and adaptations
