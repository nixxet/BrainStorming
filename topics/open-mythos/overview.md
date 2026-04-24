---
title: OpenMythos — Recurrent-Depth Transformer Reference Implementation
slug: open-mythos
date: 2026-04-23
workflow: evaluate
score: 8.25
verdict: CONDITIONAL
audience: technical decision-maker / AI researcher
tags: [recurrent-depth-transformer, inference-time-compute, pytorch, open-source, architecture]
source_url: https://github.com/kyegomez/OpenMythos
---

# OpenMythos — Recurrent-Depth Transformer Reference Implementation

## What It Is

OpenMythos is a community-written PyTorch implementation of Recurrent-Depth Transformer (RDT) architectures. The project pairs this code with a **hypothesis** that Claude Mythos could be RDT-based, grounded in peer-reviewed research but not validated against the actual Mythos system. OpenMythos is reusable research code for studying inference-time compute scaling through iterative refinement of latent states.

## What It Is Often Confused With

Media framing (particularly from EU outlets in April 2026) describes OpenMythos as a "reverse-engineering" or "reconstruction" of Claude Mythos, implying a validated replica or close approximation. The OpenMythos GitHub repository itself is more cautious, labeling the project a "community-driven theoretical reconstruction" not affiliated with Anthropic. The confusion is driven by audience-side media aggregation, not project misrepresentation—but it matters for adoption decisions.

## Why the Distinction Matters

If OpenMythos is treated as a validated Mythos approximation, adoption decisions are built on unverified ground. Anthropic has disclosed nothing about Mythos's architecture; the RDT hypothesis is plausible but unconfirmed. If treated as an RDT reference implementation for studying parameter efficiency and inference scaling, it becomes a valid research tool. Conflating the two creates deployment and evaluation risk.

## Source Domain

- **Native context:** Machine learning research — specifically, efficient transformer architectures and inference-time compute scaling.
- **Why that context matters:** RDT's value proposition (parameter efficiency paired with latent reasoning capability) is domain-native. Claims about efficiency are validated within academic benchmarking contexts (FineWeb-Edu corpus, downstream task evaluation). Transferring to production systems requires validation against real-world workloads.

## Reusable Patterns

- **Decoupling reasoning depth from parameter count:** RDT architecture separates iterative reasoning steps (which improve accuracy) from model size. This generalizes to any inference task where latent reasoning improves performance (code generation, mathematical reasoning, multi-step problem-solving). Applicable to agent systems exploring multi-step deliberation without token explosion.
- **Parameter-efficiency benchmarking methodology:** Parcae's approach (parameter-matched training data, identical corpora, downstream task evaluation) is reusable for evaluating other efficiency techniques.
- **Inference-time compute scaling taxonomy:** The comparison of o1 (explicit chain-of-thought), COCONUT (continuous latent reasoning), and RDT (looped refinement) provides a reusable framework for selecting inference scaling approaches by trade-off profile.
- **Stability analysis for recurrent architectures:** Spectral norm constraints on injection parameters (Parcae innovation) transfer to other recurrent designs.

## Key Concepts

- **Recurrent-Depth Transformer (RDT):** A transformer architecture that loops latent states through transformer blocks, refining hidden representations over multiple steps without generating visible tokens. Contrasts with standard transformers (single pass) and explicit chain-of-thought models (token generation per reasoning step).
- **Parameter Efficiency:** RDT reduces model parameters by 40% at equivalent task performance compared to standard transformers (770M RDT ≈ 1.3B standard on FineWeb-Edu). Achieved through improved representation capacity via iterative refinement, not architectural tricks.
- **Inference-Time Compute Scaling:** Shifting computational load from training-time parameters to inference-time iteration. Three proven approaches: explicit chain-of-thought (o1), continuous latent reasoning (COCONUT), and recurrent refinement (RDT).
- **Latent Reasoning:** Hidden state evolution during RDT loops. Popular narratives claim RDTs learn interpretable step-by-step chains; evidence is contested (see Key Numbers below).
- **Multi-Latent Attention:** Parcae's innovation: attention mechanism that reduces KV cache 10–20× compared to standard attention, critical for memory efficiency in looped models.
- **Mythos Architecture Hypothesis:** OpenMythos's core claim: Claude Mythos uses RDT. Based on RDT's capability alignment with Mythos's published strengths (code reasoning, vulnerability discovery) but unverified by Anthropic disclosure.

## Context

- **Who uses RDT:** Machine learning researchers exploring efficient reasoning architectures; ML infrastructure teams evaluating inference scaling trade-offs.
- **When RDT is relevant:** Tasks requiring interpretable multi-step reasoning (math, code, logic puzzles); inference-latency-constrained deployments where parameter reduction offsets loop overhead; research settings where training compute budgets are available for recurrent specialization.
- **Why now:** April 2026 release cycle (Parcae, OpenMythos, COCONUT, and Huginn analysis all published within 2 weeks) indicates active research momentum. Claude Mythos's April 2026 release sparked community hypothesis work; research community is actively testing RDT at scale.

## Key Numbers and Stats

### Peer-Reviewed Architecture Validation
- **Finding:** RDT demonstrates stable recurrence over 20+ steps with compositional generalization on depth-8 and nesting-14+ tasks achieving >90% accuracy [Thinking Deeper, Not Longer: Depth-Recurrent Transformers for Compositional Generalization](https://arxiv.org/abs/2603.21676) (March 2026) — **HIGH confidence**
- **Implication:** RDT is not speculative architecture; it is a legitimate pattern with formal academic validation across multiple independent papers.

### Parameter-Efficiency Gains (Validated at 370M–3B Scale)
- **Finding:** 770M-parameter Parcae model achieves Core/Core-Extended benchmark score of 25.07 versus 1.3B standard transformer at 22.42 on identical training data (FineWeb-Edu) [Parcae: Scaling Laws For Stable Looped Language Models](https://arxiv.org/abs/2604.12946) (April 2026, arXiv) — **HIGH confidence** — **Caveat: pre-print status; peer review pending**
- **Parameter-matched comparison:** 370M Parcae = 20.00 vs. 370M standard transformer = 17.46 — **HIGH confidence** on this specific result
- **Implication:** 770M looped model matches or exceeds 1.3B standard performance. However, this claim is specific to FineWeb-Edu corpus and Parcae's Multi-Latent Attention; generalization to other training data or architectural variants is unvalidated.

### Latent Reasoning Evidence (Contested)
- **Finding:** Huginn RDT model analysis found no clear temporal separation or structured latent chain-of-thought pathway across recurrence steps. On GSM8K math: scaling depth 4→32 steps improved accuracy only from 3.11% to 4.93%, far below explicit chain-of-thought (24.87%) [Latent Chain-of-Thought? Decoding the Depth-Recurrent Transformer](https://arxiv.org/abs/2507.02199) (July 2025) — **MEDIUM confidence** — **Single-source critical analysis**
- **Implication:** RDTs improve performance, but the mechanism is not interpretable as step-by-step hidden state chains. Improvement may come from iterative refinement, better optimization dynamics, or other factors. This contradicts popular narratives.

### Inference Latency Trade-Offs
- **Finding:** Reported latency improvements on RDT models: 580 ms/token → 360 ms/token with early exit strategies [Scaling Test-Time Compute: How Recurrent Depth Transforms AI Reasoning](https://medium.com/@sahin.samia/scaling-test-time-compute-how-recurrent-depth-transforms-ai-reasoning-fa866fa968db) — **MEDIUM confidence** — **Caveats: no full context on loop counts, sequence length, or hardware; not validated at 70B+ scale**
- **Implication:** Loop overhead adds cost per iteration; KV cache reduction via Multi-Latent Attention (10–20×) offsets parameter reduction benefits—but trade-offs are task-dependent and scale-dependent.

### Mythos Architecture Disclosure Status
- **Finding:** Across three official Anthropic channels (red.anthropic.com, Anthropic.com Glasswing page, AWS Bedrock), zero architectural disclosure on Claude Mythos. Announcements focus on cybersecurity capabilities (zero-day discovery, code reasoning) and government deployment. No mention of recurrent depth, iterative computation, or loop structures. — **HIGH confidence that disclosure hasn't happened** — **LOW confidence that RDT is the actual architecture**
- **Implication:** Absence of disclosure creates inference space for OpenMythos hypothesis. It is consistent with RDT being used, a fundamentally different architecture, or planned future publication. This is a gap, not evidence for RDT.

### Code-Only Release Status
- **Finding:** OpenMythos provides PyTorch code and training scripts; no pre-trained weights for download, no benchmark results from OpenMythos-trained models, no downstream task validation. 29 unit tests cover architecture and generation; performance claims citing "770M matches 1.3B" are sourced from Parcae, not from OpenMythos-trained baselines — **HIGH confidence**
- **Implication:** OpenMythos is correctly framed as a "theoretical reconstruction" in the GitHub repository. Model validation requires community training runs (substantial compute investment on FineWeb-Edu).

## Confidence Summary

**Overall Synthesis Confidence:** 7.2/10 (MEDIUM-HIGH)

- **HIGH:** 4 findings (RDT architecture peer-reviewed, Parcae efficiency validated, Mythos undisclosed, no trained models)
- **MEDIUM:** 4 findings (latent reasoning contested, multiple inference scaling approaches, deployment research-stage, marketing exceeds validation)
- **UNVERIFIED:** 1 core claim ("OpenMythos approximates Claude Mythos")

Confidence is anchored upward by peer-reviewed architecture and validated efficiency gains. It is capped by the unverified Mythos approximation claim and contested reasoning mechanism.

## Links

- [OpenMythos GitHub Repository](https://github.com/kyegomez/OpenMythos)
- [Parcae: Scaling Laws For Stable Looped Language Models](https://arxiv.org/abs/2604.12946)
- [Thinking Deeper, Not Longer: Depth-Recurrent Transformers for Compositional Generalization](https://arxiv.org/abs/2603.21676)
- [Latent Chain-of-Thought? Decoding the Depth-Recurrent Transformer](https://arxiv.org/abs/2507.02199)
- [Loop, Think, & Generalize: Implicit Reasoning in Recurrent-Depth Transformers](https://arxiv.org/abs/2604.07822)
- [Training Large Language Models to Reason in a Continuous Latent Space (COCONUT)](https://arxiv.org/abs/2412.06769)
- [Claude Mythos Preview — red.anthropic.com](https://red.anthropic.com/2026/mythos-preview/)
- [Project Glasswing: Securing critical software for the AI era](https://www.anthropic.com/glasswing)
