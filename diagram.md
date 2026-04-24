# BrainStorming — Architecture Diagram

Multi-phase research pipeline: skill invocation → 11-phase Director-orchestrated pipeline → published topic files, gated at 8.0/10 quality before publication.

---

## Pipeline Flowchart

```mermaid
flowchart TD
    USER[/Skill Invoked\nresearch · quick · compare · evaluate · recommend/]

    subgraph P0["Phase 0 — Intake & Classification"]
        DIR(Director\nParse · Classify · Slug\nRelated-Topics Lookup · Mode · Framing Gate · state.json)
    end

    subgraph P1["Phase 1 — Parallel Research"]
        RES(Researcher\nLandscape Brief)
        INV(Investigator\nAdversarial Brief)
        GAPQ{Critical\nGaps?}
        GF(Gap-Fill\nTargeted Search)
        BRIEFS[(landscape.md\ndeep-dive.md)]
        RES --> GAPQ
        INV --> GAPQ
        GAPQ -->|yes — Phase 1b| GF --> BRIEFS
        GAPQ -->|no| BRIEFS
    end

    subgraph P2["Phase 2 — Analysis"]
        ANA(Analyzer\nCross-Reference · Confidence Ratings)
        SYNTH[(verified-synthesis.md\nevidence.json)]
        ANA --> SYNTH
    end

    subgraph P34["Phase 3–4 — Draft & Quality Gate"]
        WRI(Writer\nDraft overview · notes · verdict)
        DRAFTS[(draft-overview\ndraft-notes · draft-verdict)]
        CRI(Critic\n8-Dimension Rubric)
        CGATE{Verdict?}
        WRI --> DRAFTS --> CRI --> CGATE
        CGATE -->|"REVISE 6.0–7.9\nmax 3 cycles"| WRI
    end

    SECQ{Security\nRequired?}

    subgraph P56["Phase 5–6 — Security Review + Stress Test (parallel when both required)"]
        SR(Security Reviewer\nAudit Risks · Compliance)
        SGATE{Security\nVerdict?}
        SBLOCK[/BLOCK — Halt\nReport to User/]
        TST(Tester\n≥ 12 Real-World Scenarios)
        TGATE{Tester\nVerdict?}
        SR --> SGATE
        SGATE -->|BLOCK| SBLOCK
        TST --> TGATE
    end

    subgraph P65["Phase 6.5 — Adversarial Challenge"]
        CHL(Challenger\nMin 8 Search Queries)
        CHGATE{Verdict?}
        CHL --> CHGATE
    end

    subgraph P78["Phase 7–8 — Publish & Deliver"]
        PUB(Publisher\nFinalize · Style · Index Update)
        OUT[(overview.md · notes.md\nverdict.md · index.md)]
        DONE[/Delivery\ntopics/slug · Verdict · Score · Confidence/]
        PUB --> OUT --> DONE
    end

    USER --> DIR
    DIR --> RES & INV
    BRIEFS --> ANA
    SYNTH --> WRI
    CGATE -->|"REWRITE < 6.0"| ANA
    CGATE -->|"PASS ≥ 8.0"| SECQ
    SECQ -->|"yes — parallel spawn"| SR & TST
    SECQ -->|no| TST
    SGATE -->|FLAG — revise| WRI
    SGATE -->|PASS| TGATE
    TGATE -->|FAIL — revise| WRI
    TGATE -->|"PASS / COND"| CHL
    CHGATE -->|"STANDS / NOTED"| PUB
    CHGATE -->|WEAKENED — qualify claims| WRI
    CHGATE -->|SUSTAINED — new evidence| ANA
```

---

## Cross-Analyze Workflow

Separate from the research pipeline — no web research. Synthesizes patterns across all existing topic files and writes to `topics/_cross/`.

```mermaid
flowchart TD
    subgraph CA["Cross-Analyze Workflow"]
        CAU[/cross-analyze theme/]
        CAD(Director\nDispatch Cross-Analyzer)
        CAR(Cross-Analyzer\nRead evidence.json first\nthen verdict.md · notes.md)
        CAO[(topics/_cross/\nlandscape · deep-dive\nverified-synthesis · scorecard)]
        CAU --> CAD --> CAR --> CAO
    end
```

---

## Agent Handoff — Happy Path

Standard research run showing the turn-by-turn sequence (no revisions, no security block).

```mermaid
sequenceDiagram
    participant U  as User
    participant D  as Director
    participant RE as Researcher
    participant IN as Investigator
    participant AN as Analyzer
    participant WR as Writer
    participant CR as Critic
    participant SR as Security Reviewer
    participant TE as Tester
    participant CH as Challenger
    participant PB as Publisher

    U->>D: /research [topic]
    par Phase 1 — parallel spawn
        D->>RE: landscape research
        D->>IN: adversarial deep-dive
    end
    RE-->>D: landscape.md
    IN-->>D: deep-dive.md
    note over D: Phase 1b — gap assessment (skip if minor)
    D->>AN: Phase 2 — analyze + synthesize
    AN-->>D: verified-synthesis.md + evidence.json
    D->>WR: Phase 3 — draft
    WR-->>D: draft-overview · notes · verdict
    D->>CR: Phase 4 — quality gate
    CR-->>D: scorecard.md  PASS ≥ 8.0
    opt Phase 5 — security required
        D->>SR: audit recommendations
        SR-->>D: security-review.md  PASS
    end
    D->>TE: Phase 6 — stress test
    TE-->>D: stress-test.md  PASS / COND
    D->>CH: Phase 6.5 — adversarial challenge
    CH-->>D: challenge.md  STANDS
    D->>PB: Phase 7 — publish
    PB-->>D: overview.md · notes.md · verdict.md
    D-->>U: topics/slug/ — verdict · score · confidence
```
