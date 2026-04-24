---
title: OpenMythos — Research Notes
slug: open-mythos
date: 2026-04-23
workflow: evaluate
score: 8.25
verdict: CONDITIONAL
audience: technical decision-maker / AI researcher
tags: [recurrent-depth-transformer, inference-time-compute, pytorch, open-source, architecture]
source_url: https://github.com/kyegomez/OpenMythos
---

# OpenMythos — Research Notes

## Key Findings

### Finding 1: Recurrent-Depth Transformers are Peer-Reviewed Architecture
**Confidence:** HIGH | **Source Independence:** Independent (4 distinct papers)

**Core Claim:**
RDT is a legitimate architectural pattern with formal academic validation, not speculative framing. Multiple independent papers published March–April 2026 and July 2025 demonstrate:
- Stable recurrence over 20+ steps
- Compositional generalization on depth-8 and nesting-14+ tasks with >90% accuracy
- Decoupling of reasoning depth from parameter count

**Sources:**
- [Thinking Deeper, Not Longer: Depth-Recurrent Transformers for Compositional Generalization](https://arxiv.org/abs/2603.21676) (March 2026)
- [Latent Chain-of-Thought? Decoding the Depth-Recurrent Transformer](https://arxiv.org/abs/2507.02199) (July 2025)
- [Loop, Think, & Generalize: Implicit Reasoning in Recurrent-Depth Transformers](https://arxiv.org/abs/2604.07822) (April 2026)
- [Training Large Language Models to Reason in a Continuous Latent Space (COCONUT)](https://arxiv.org/abs/2412.06769) (December 2024, Meta FAIR — validates same direction via alternative mechanism)

**What This Means:**
RDT is not a fringe hypothesis; it's been rigorously tested in academic settings. Architecturally sound, with stability proofs and empirical validation on structured reasoning tasks. The pattern is generalizable to inference-time compute scaling in any domain.

**Caveats & Next Steps:**
- All validation is on sub-10B models; scaling to 70B+ is extrapolated, not empirically proven
- Stability proofs are mathematical; empirical validation at extreme scale is missing
- Transfers well to agent systems and multi-step reasoning tasks, but requires pilot testing on target workloads

**Material Decay:** Stable (5+ years) — foundational architecture unlikely to be superseded without new compute paradigm

---

### Finding 2: Parcae — 770M Looped Model Matches 1.3B Standard Transformer
**Confidence:** HIGH | **Caveat: Pre-Print Status** | **Source Independence:** Shared-root (same underlying paper + practitioner blogs)

**Core Claim:**
A 770M-parameter Parcae model (looped/RDT-based) achieves Core/Core-Extended benchmark score of 25.07, compared to 1.3B standard transformer at 22.42 on identical training data (FineWeb-Edu). Parameter-matched comparisons at 370M also show consistent gains (Parcae 20.00 vs. standard 17.46). Training stability was a critical blocker in prior looped model research; Parcae solved this via spectral norm constraints on injection parameters.

**Sources:**
- [Parcae: Scaling Laws For Stable Looped Language Models](https://arxiv.org/abs/2604.12946) (April 2026, arXiv pre-print)
- [Parcae: Doing More with Fewer Parameters using Stable Looped Models](https://sandyresearch.github.io/parcae/) (April 2026, Sandy Research practitioner blog)
- [Together AI Blog: Parcae](https://www.together.ai/blog/parcae) (April 2026)

**What This Means:**
For the first time, looped transformers achieve published efficiency gains without training divergence. This is the empirical anchor for the entire RDT parameter-efficiency narrative. However, it comes with material caveats.

**Must-Carry Caveats:**
- **Parcae is an arXiv pre-print (April 2026); peer review status is not yet documented.** Journal/conference acceptance is pending. This is normal in ML, but publication is not yet assured.
- Comparisons are on FineWeb-Edu (educational subset); generalization to other training corpora (general web, domain-specific data) is unvalidated.
- Largest model tested: 3B parameter Parcae; extrapolation to 70B+ is untested and speculative.
- Efficiency ratio (770M ≈ 1.3B) is specific to FineWeb-Edu and Parcae's Multi-Latent Attention. Do not generalize to all RDT variants or all training corpora.

**Next Steps:**
- Monitor ICLR/ICML/NeurIPS acceptance announcements (Q2–Q3 2026) — peer review would materially increase confidence
- Watch for community training runs on FineWeb-Edu that validate or contradict Parcae's results

**Material Decay:** Fast (peer review decision Q2–Q3 2026 will materially change confidence; early adopters will report real data within 6 months)

---

### Finding 3: Anthropic Has NOT Disclosed Claude Mythos Architecture
**Confidence:** HIGH (that disclosure hasn't happened) | LOW (that RDT is the actual architecture) | **Source Independence:** Independent (3 official channels)

**Core Claim:**
Across three official Anthropic channels (red.anthropic.com blog, Anthropic.com Glasswing page, AWS Bedrock model card), zero architectural disclosure on Claude Mythos. Official announcements focus entirely on cybersecurity capabilities (zero-day vulnerability discovery, code reasoning, logic verification) and Project Glasswing deployment (government/critical infrastructure access). No mention of recurrent depth, iterative computation, loop structures, or inference-time scaling.

**Sources:**
- [Claude Mythos Preview — red.anthropic.com](https://red.anthropic.com/2026/mythos-preview/) (April 2026, official)
- [Project Glasswing: Securing critical software for the AI era](https://www.anthropic.com/glasswing) (official)
- [Claude Mythos Preview — Amazon Bedrock Model Card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-mythos-preview.html) (AWS documentation)

**What This Means:**
The foundation of the OpenMythos hypothesis rests on an absence of information. Anthropic has not disclosed whether Mythos uses RDT, a different architecture, or something proprietary. This creates inference space but is not evidence for any particular architecture.

**Must-Carry Caveat:**
**Lack of disclosure does not imply RDT architecture. It is consistent with: (1) RDT being used, (2) a fundamentally different architecture, (3) planned later publication, or (4) intentional secrecy for competitive/security reasons (Glasswing is restricted to government partners).** This is a gap, not evidence.

**Next Steps:**
- Monitor Anthropic publications, ArXiv, and conference proceedings (ICLR/ICML 2026) for potential architecture disclosure
- Watch Mythos performance characteristics on public benchmarks (code reasoning, vulnerability discovery) for behavioral clues
- If Mythos architecture is disclosed and is NOT recurrent-depth, the core OpenMythos thesis collapses

**Material Decay:** Volatile (Anthropic disclosure is a single event that would reshape entire hypothesis; could happen within weeks or months)

---

### Finding 4: Empirical Evidence on Latent Reasoning in RDTs is Mixed and Contested
**Confidence:** MEDIUM | **Source Independence:** Single-source critical (flagged in quick-mode evaluation) | **Critical Caveat:** Generalization to OpenMythos/Parcae is not established

**Core Claim:**
While RDT architecture is validated, the mechanism by which RDTs improve reasoning is contested. Analysis of the Huginn RDT model found:
- No clear temporal separation or structured latent reasoning pathway across recurrence steps
- Sharp discontinuities in hidden state semantics across layers, not smooth refinement
- On GSM8K math problems: scaling recurrence depth (4 → 32 steps) improved accuracy only from 3.11% to 4.93%, far below explicit chain-of-thought (24.87%)

This does NOT refute RDT's parameter efficiency or that looping aids reasoning. It directly contradicts the popular narrative that RDTs learn interpretable step-by-step hidden state chains.

**Sources:**
- [Latent Chain-of-Thought? Decoding the Depth-Recurrent Transformer](https://arxiv.org/abs/2507.02199) (July 2025) — Huginn analysis section

**What This Means:**
RDTs may improve through iterative refinement and better optimization dynamics, not through interpretable latent chain-of-thought. This distinction affects:
- **Theoretical understanding:** RDTs are not mechanistically analogous to explicit chain-of-thought
- **Reproducibility:** Without clarity on the improvement mechanism, reproducing gains across variants (Huginn vs. Parcae vs. OpenMythos) becomes harder
- **Interpretability research:** Popular narratives about RDT reasoning need revision based on actual mechanism

**Must-Carry Caveats:**
- **Single-source finding in quick-mode evaluation:** No cross-brief or independent Investigator corroboration. Other mechanistic studies of RDTs do not exist in published literature (as of April 2026).
- Huginn is one trained RDT model; generalization to other RDT implementations is not established. Parcae and OpenMythos may have different latent reasoning characteristics.
- The finding argues against a popular narrative, not against RDT efficacy. RDTs do improve performance; the reasoning mechanism is what's unclear.

**Next Steps:**
- Monitor for mechanistic interpretability work on RDT hidden states (expected quarterly through 2026–2027)
- Watch for community feedback from OpenMythos/Parcae training runs on whether latent states show interpretable refinement
- This is a candidate for re-evaluation within 6 months as more evidence emerges

**Material Decay:** Fast (mechanistic interpretability is an active research area; new findings could appear quarterly)

---

### Finding 5: OpenMythos Has NO Trained Model Validation — Code-Only Release
**Confidence:** HIGH | **Source Independence:** Independent (GitHub source + media coverage)

**Core Claim:**
OpenMythos releases PyTorch code for RDT architecture and training scripts (including a 3B model configuration on FineWeb-Edu) but provides:
- No pre-trained weights for download
- No benchmark results from OpenMythos-trained models
- No downstream task evaluation
- 29 unit tests covering forward pass, stability, and generation—but these are architectural tests, not task evaluations

Performance claims in media materials ("770M matching 1.3B") are cited from Parcae, not validated on OpenMythos-trained models. Huginn is the only actually trained looped model with published results.

**Sources:**
- [OpenMythos GitHub Repository](https://github.com/kyegomez/OpenMythos)
- [MarkTechPost: Meet OpenMythos](https://www.marktechpost.com/2026/04/19/meet-openmythos-an-open-source-pytorch-reconstruction-of-claude-mythos-where-770m-parameters-match-a-1-3b-transformer/) (April 2026)

**What This Means:**
Code release is not model release. OpenMythos is correctly positioned as a reference implementation and training framework, not a pre-trained baseline. Adoption requires:
- Significant compute investment to train and evaluate on your own workloads
- Trust that the code reproduces Parcae's results (unvalidated by OpenMythos team)
- Willingness to pilot at small scale before production deployment

**Must-Carry Caveat:**
**All performance claims citing "770M ≈ 1.3B" are from Parcae (different project). OpenMythos code correctness and training stability are unvalidated by the team's own trained models.** This is not a weakness of OpenMythos per se—it is correctly framed as theoretical reconstruction—but adoption decisions cannot rely on pre-trained performance data.

**Next Steps:**
- Monitor GitHub for community training runs and reported results
- Watch for OpenMythos team release of trained baselines (would materially increase confidence)
- Expect 3–6 months before significant community-trained models appear

**Material Decay:** Fast (OpenMythos repository state is volatile; trained models could be released at any time, or community adoption could reveal major bugs)

---

### Finding 6: Inference-Time Compute Scaling Has Multiple Proven Approaches
**Confidence:** HIGH | **Source Independence:** Independent (three distinct companies/projects)

**Core Claim:**
OpenMythos's RDT approach is one of three established methods for scaling reasoning at inference time. Each has different trade-offs:

- **o1 approach (OpenAI):** Explicit chain-of-thought with reinforcement learning. Uses "reasoning tokens" for internal deliberation. Supports sequential (longer CoT) and parallel (multiple samples, pick best) scaling. Interpretable reasoning steps; high inference cost.

- **COCONUT approach (Meta FAIR):** Continuous latent reasoning without token generation. Hidden states feed back as embeddings. Breadth-first search in hidden space. Approximately 6× reduction in "thinking tokens" vs. explicit CoT on logical reasoning tasks.

- **RDT approach (Parcae/OpenMythos):** Iterative refinement of latent state through looped transformer blocks. Parameter-efficient (770M ≈ 1.3B). Requires training-time specialization. Loop overhead trade-off unclear at scale.

No single approach dominates across all tasks and model sizes.

**Sources:**
- [OpenAI: Learning to Reason with LLMs](https://openai.com/index/learning-to-reason-with-llms/)
- [Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314) (August 2024)
- [Training Large Language Models to Reason in a Continuous Latent Space](https://arxiv.org/abs/2412.06769) (December 2024, Meta FAIR)

**What This Means:**
RDT is not a universal solution. Selecting between o1, COCONUT, and RDT depends on:
- Task type (math/code/logic favor different approaches)
- Inference latency constraints (RDT has loop overhead; COCONUT has fewer tokens)
- Training budget (RDT requires specialization; o1 uses post-hoc RL)
- Interpretability needs (o1 is most interpretable; RDT mechanism is contested; COCONUT is latent)

**Caveats:**
- No published comparative benchmark exists across all three on identical tasks
- Effectiveness is highly task-dependent and model-size-dependent
- "6× thinking token reduction" (COCONUT) and latency improvements (RDT) are not directly comparable (different metrics)

**Next Steps:**
- Watch for unified benchmarks comparing inference scaling approaches (expected 2026)
- Expect shift in relative rankings as production systems accumulate real-world data

---

### Finding 7: Production Deployment Concerns for OpenMythos
**Confidence:** MEDIUM | **Source Independence:** Single-source critical (GitHub) + practitioner latency notes

**Core Claim:**
OpenMythos is research-stage code without production infrastructure. Key concerns:

1. **Inference endpoints:** No published inference serving code, batch processing framework, or deployment hardening
2. **Latency trade-offs:** RDT eliminates per-token overhead but adds per-loop iteration cost. Reported improvements (580 ms/token → 360 ms/token) vary by loop count and task; no systematic characterization at scale
3. **Memory footprint:** Does not grow with loop depth (advantage vs. explicit CoT), but KV cache depends on sequence length and attention mechanism (Parcae's Multi-Latent Attention reduces KV 10–20×). Trade-offs unclear at 70B+
4. **Training costs:** Substantial for larger models; no pre-trained 70B+ looped models published. Spectral norm constraints (Parcae innovation) add training complexity
5. **Documentation:** Research-oriented, not production-focused. Assumes ML researcher familiarity with PyTorch internals

**Sources:**
- [OpenMythos GitHub Repository](https://github.com/kyegomez/OpenMythos)
- [Scaling Test-Time Compute: How Recurrent Depth Transforms AI Reasoning](https://medium.com/@sahin.samia/scaling-test-time-compute-how-recurrent-depth-transforms-ai-reasoning-fa866fa968db)

**What This Means:**
OpenMythos is not deployment-ready for production systems without substantial engineering. Candidates for adoption should plan:
- Internal serving infrastructure development
- Pilot deployments on smaller models (3B–13B) first
- Real-world latency profiling before scaling
- Training cost modeling for your target scale

**Must-Carry Caveats:**
- **Inference latency (580ms → 360ms) lacks full context: loop count, sequence length, hardware, batch size not specified.** Real-world latency depends entirely on these factors. Do not use as deployment projection without profiling.
- **No production RDT systems exist at scale.** This is expected for April 2026 research code; it is not a deficiency of the architecture, but it means deployment hardening is a separate, substantial effort.
- Parsing "10–20× KV cache reduction" requires understanding Multi-Latent Attention trade-offs, which are not trivial.

**Next Steps:**
- Monitor for production deployments at Together AI, Replicate, or other inference platforms (expected 3–6 months)
- Track community infrastructure projects (vLLM support, TensorRT optimization) for RDT
- Expect deployment costs to drop significantly once production examples exist

**Material Decay:** Fast (infrastructure examples and tooling will appear within 6 months, materially changing deployment landscape)

---

### Finding 8: OpenMythos Marketing Claims Exceed Research Validation
**Confidence:** MEDIUM | **Source Independence:** Independent (media + GitHub, tension between frames)

**Core Claim:**
Media coverage frames OpenMythos as a "reverse-engineering" and "reconstruction" of Claude Mythos, suggesting a validated replica or close approximation. Example headlines: "22-Year-Old Reverse-Engineers and Open-Sources Mythos Architecture" (36kr.com, April 2026). Reality: OpenMythos is a hypothesis that Mythos *could be* RDT-based, grounded in research but unverified. The OpenMythos GitHub repository itself frames more cautiously ("community-driven theoretical reconstruction," "not affiliated with or endorsed by Anthropic"), but media aggregation and community marketing inflate certainty.

**Sources:**
- [eu.36kr.com: 22-Year-Old Reverse-Engineers and Open-Sources Mythos Architecture](https://eu.36kr.com/en/p/3774953856418309) (April 2026)
- [MarkTechPost: Meet OpenMythos](https://www.marktechpost.com/2026/04/19/meet-openmythos-an-open-source-pytorch-reconstruction-of-claude-mythos-where-770m-parameters-match-a-1-3b-transformer/)
- [OpenMythos GitHub Repository](https://github.com/kyegomez/OpenMythos)

**What This Means:**
This is a language and framing issue, not a technical deficiency. OpenMythos cannot be validated as a Mythos approximation because:
- Mythos is closed-source
- Mythos architecture is undisclosed
- No OpenMythos-trained models exist to compare

The gap between media framing ("reverse-engineering") and reality ("plausibility argument") affects adoption decisions. Teams treating OpenMythos as a Mythos proxy are building on unverified ground.

**Must-Carry Caveat:**
**"OpenMythos approximates Claude Mythos" is a hypothesis, not a fact.** Media framing does not validate it. Do not treat OpenMythos as a reverse-engineered replica; treat as an RDT reference implementation grounded in plausible architectural assumptions about Mythos.

**Next Steps:**
- If Anthropic publishes Mythos architecture and it matches RDT, media framing becomes accurate retroactively (but adoption decisions cannot wait for that)
- Expect continued media inflation of certainty; rely on official GitHub framing instead

---

## Confidence Summary

| Confidence | Count | Findings | |-----------|-------|----------| | HIGH | 4 | F1 (RDT architecture), F2 (Parcae efficiency), F3 (Mythos undisclosed), F5 (no trained models) | | MEDIUM | 4 | F4 (latent reasoning contested), F6 (multiple approaches), F7 (deployment research-stage), F8 (marketing exceeds validation) | | UNVERIFIED | 1 | "OpenMythos approximates Claude Mythos" (core hypothesis; stated in F3) |

**Overall Synthesis Confidence:** 7.2/10 (MEDIUM-HIGH)

---

## Invalidation Conditions

This research becomes materially invalid if:

1. **Anthropic publishes Mythos architecture and it is NOT recurrent-depth.** If Mythos uses mixture-of-experts, state-space models, standard scaling, or a fundamentally different approach, the core OpenMythos hypothesis collapses. Verdict downgrades to: "Architecture is unrelated to Mythos; use as generic RDT reference only."

2. **Community-trained OpenMythos models fail to replicate Parcae's efficiency gains.** If FineWeb-Edu training on OpenMythos shows 770M ≠ 1.3B performance, implementation divergence from Parcae specifications is likely. Efficiency claim downgrades to MEDIUM-LOW.

3. **70B+ RDT models show inference latency > 3× standard transformers.** If empirical measurement shows loop cost outweighs parameter reduction (e.g., 360ms/token for RDT vs. 100ms/token for standard at 70B), inference efficiency reverses. Verdict downgrades to: "Parameter-efficient at parameter-limited scales only; not viable for large models."

4. **Parcae fails peer review with significant reproducibility concerns.** If peer review identifies training data leakage, unstable training, or statistical insignificance, efficiency gains become unvalidated. Confidence on Finding 2 downgrades to UNVERIFIED.

5. **Mechanistic interpretability studies show RDTs learn fundamentally different reasoning strategies.** If evidence emerges that RDT latent states are qualitatively different from standard transformer hidden states beyond "lack of visible CoT," transferability assumptions may break. Verdict downgrades on reproducibility and cross-variant adoption.

---

## Staleness Watch

**Material Decay Rates:**

| Finding | Decay Class | Next Review Date | Watch For | |---------|-------------|------------------|-----------| | F1 (RDT architecture) | Stable (5+ years) | 2031-04-23 | New compute paradigm | | F2 (Parcae efficiency) | Fast (peer review Q2-Q3 2026) | 2026-06-23 | ICLR/ICML acceptance or rejection | | F3 (Mythos undisclosed) | Volatile (single event) | Weekly | Anthropic ArXiv, blogs, PRs | | F4 (latent reasoning) | Fast (mechanistic work quarterly) | 2026-07-23 | New interpretability papers | | F5 (no trained models) | Fast (any time) | 2026-06-23 | OpenMythos GitHub releases | | F6 (multiple approaches) | Fast (new methods monthly) | 2026-07-23 | ArXiv inference scaling papers | | F7 (deployment concerns) | Fast (infrastructure 3-6 months) | 2026-10-23 | Production deployments, vLLM support | | F8 (marketing claims) | Stable (media published; low update) | 2026-12-23 | GitHub changes, Anthropic endorsement |

---

**Evidence Ledger:** See `evidence.json` for source provenance, confidence justification, and invalidation thresholds on each finding.

**End of Research Notes**
