# Walkthrough: Adaptive Competency-Based Revision Engine

We have successfully designed, implemented, migrated, seeded, and verified the production-oriented **Adaptive Competency-Based Revision Engine** for the Capacity Connect enterprise learning platform (MoES / IMD domain).

---

## What Was Built

### 1. Pure Algorithmic Core (`backend/src/modules/revision/algorithms/`)
All selection, scoring, weighting, and sequencing logic is strictly deterministic and mathematical:
- **`competency.algorithm.ts`**:
  $$P = 0.55 \cdot \text{accuracy} + 0.15 \cdot \text{speedScore} + 0.10 \cdot \text{hintScore} + 0.10 \cdot \text{confidenceSelfScore} + 0.10 \cdot \text{independenceScore}$$
  $$\alpha = \text{clamp}\left(0.10, 0.30, \frac{0.30}{1.0 + 0.12 \cdot N}\right) \times w_{\text{diff}}$$
- **`confidence.algorithm.ts`**: Sample size scaling, variance penalty, time decay, and diagnostic requirement flagging ($< 0.40$).
- **`memory.algorithm.ts`**:
  $$R = \exp\left(-\frac{\Delta t}{S}\right), \quad F = 1 - R$$
  Stability $S$ expands on recall ($\ge 0.70$) and contracts on failure ($< 0.50$).
- **`error-analysis.algorithm.ts`**: Repeated error mapping ($0 \to 0, 1 \to 20, 2 \to 45, 3 \to 70, 4+ \to 95$) with consecutive success dampening.
- **`dependency.algorithm.ts`**: Curriculum DAG validation, cycle detection, downstream impact calculation with depth discount factor ($1.0, 0.5, 0.25...$), and recursive root weakness discovery.
- **`group-priority.algorithm.ts`**:
  $$GP = 0.40 \cdot GW + 0.20 \cdot GF + 0.15 \cdot GI + 0.15 \cdot GD + 0.10 \cdot GU$$
- **`topic-priority.algorithm.ts`**:
  $$TP = 0.35 \cdot W + 0.18 \cdot F + 0.12 \cdot I + 0.12 \cdot D + 0.10 \cdot E + 0.08 \cdot U + 0.05 \cdot R$$
- **`session-optimizer.algorithm.ts`**: Mode selection (`RECOVERY`, `REBUILD`, `STRENGTHEN`, `RETRIEVE`, `MAINTAIN_CHALLENGE`) and sequence ordering:
  $$\text{ROOT\_PREREQUISITE} \longrightarrow \text{PRIMARY\_WEAKNESS} \longrightarrow \text{RELATED\_WEAKNESS} \longrightarrow \text{TARGETED\_PRACTICE} \longrightarrow \text{RETRIEVAL\_VERIFICATION}$$

### 2. Services, Repository, and Controller (`backend/src/modules/revision/`)
- **`repositories/revision.repository.ts`**: Type-safe Prisma queries and mutations for sessions, items, outcomes, topic competencies, group competencies, and events.
- **`services/learning-event.service.ts`**: Ingestion of learner interactions, updating competency, confidence, memory stability, and parent group health.
- **`services/group-analysis.service.ts`**: Curriculum-wide group ranking and focus group selection.
- **`services/revision-plan.service.ts`**: Master session orchestrator generating coherent sessions with root prerequisite resolution.
- **`services/revision-outcome.service.ts`**: Practice submission recording and session lifecycle management.
- **`services/explanation.service.ts`**: Transparent audit trail explaining *why* the group and topics were chosen.
- **`controllers/revision.controller.ts` & `routes/revision.routes.ts`**: Mounted at `/api/v1/revision`.

### 3. LLM Content Generation with Resilient Fallback (`backend/src/modules/revision/llm/`)
- **`revision.schema.ts`**: Strict Zod schema for structured output (`conceptIntro`, `coreRuleRecap`, `commonTrapAvoided`, `meteorologicalExamples`, `practiceQuestions`, `retrievalCheck`, `quickSummary`).
- **`revision-prompt.ts`**: Anonymized prompt builder enforcing MoES/IMD scientific realism with zero PII.
- **`revision-generator.ts`**: Resilient generator with deterministic domain fallback for Doppler Radar, Satellite Meteorology, and Numerical Weather Prediction.

### 4. Curriculum Seed (`backend/prisma/seed.ts`)
- Seeded official MoES/IMD Competency Groups:
  - *Atmospheric Dynamics & Thermodynamic Diagnostics*
  - *Doppler Weather Radar (DWR) Operations & Velocity Analysis*
  - *Satellite Remote Sensing & Tropical Cyclone Tracking*
- Seeded Topics and Strict DAG Prerequisites (`ATM_HYDRO` $\to$ `ATM_LAPSE` $\to$ `ATM_INSTAB`, `RAD_REFL` $\to$ `RAD_DOPP` $\to$ `RAD_MESO`, `SAT_RAD` $\to$ `SAT_IR` $\to$ `SAT_CYCLONE`).
- Seeded active algorithm configuration and sample learner profile for Jane Doe demonstrating root prerequisite recovery on radar velocity dealiasing.

---

## Verification & Test Results

### 1. TypeScript Strict Typecheck
```bash
$ npm run typecheck
> enterprise-backend@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0 (Zero errors)
```

### 2. Algorithmic Unit Tests and 10 Simulation Scenarios
```bash
$ npx jest src/modules/revision/tests/
PASS src/modules/revision/tests/simulations.test.ts
PASS src/modules/revision/tests/pure-algorithms.test.ts

Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        3.915 s
```

### 3. Verified Scenarios:
| Scenario | Behavior Validated | Result |
|---|---|---|
| **1. Beginner with gaps** | Schedules root prerequisite (`RAD_REFL`) before advanced topics | **Passed** |
| **2. Intermediate lapse** | Low retrievability ($R < 0.10$) elevates priority despite past score | **Passed** |
| **3. Advanced error** | High error count ($3+$) flags severity ($70$) without wiping base mastery | **Passed** |
| **4. Erratic variance** | Erratic scores penalize confidence and flag diagnostic check | **Passed** |
| **5. Fast guesser** | Fast response with zero accuracy produces low performance ($0.40$) | **Passed** |
| **6. Methodical learner**| High accuracy with moderate speed produces high performance ($0.92$) | **Passed** |
| **7. Hint dependent** | Reliance on hints discounts performance by $\ge 0.20$ | **Passed** |
| **8. Overconfident** | 0% score with high confidence adapts via bounded learning rate $\alpha$ | **Passed** |
| **9. Long absence** | 90-day lapse sets maximum urgency ($100$) and near-zero retention | **Passed** |
| **10. Multi-domain** | Chooses single weakest group (`Radar Meteorology`) rather than scattered topics | **Passed** |

---

## Artifacts Created
- Module Directory: `backend/src/modules/revision/`
- Documentation: `docs/adaptive-revision-engine.md` and `backend/src/modules/revision/README.md`
- Active Git Branch: `feature/adaptive-revision-engine`
