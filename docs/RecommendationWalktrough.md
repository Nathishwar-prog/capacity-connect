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

### 2. Algorithmic and End-to-End Simulation Tests
- **Revision Engine Test Suites**: `pure-algorithms.test.ts` (18 tests) & `simulations.test.ts` (9 tests).
- All 27 tests passed cleanly.

---

## Walkthrough: AI Skill Gap Analyzer

We have successfully designed, implemented, migrated, seeded, and verified the production-oriented **AI Skill Gap Analyzer** for the Capacity Connect enterprise learning platform (MoES / IMD domain) on branch `feature/ai-skill-gap-analyzer`.

---

## What Was Built

### 1. Database Schema Extensions (`backend/prisma/schema.prisma`)
- **`RequirementCriticality` Enum**: `CORE`, `IMPORTANT`, `NORMAL`, `OPTIONAL`.
- **`CourseCompetency` Extension**: Added `importance` (Float), `criticality` (RequirementCriticality), `weight` (Float), `updatedAt`.
- **`UserCompetency` Extension**: Added `competencyScore` (Float), `evidenceCount` (Int), `lastActivityAt`, `stability`, `retention`, `forgettingRisk`.
- **`SkillGap` Extension**: Added `courseId`, `gapSeverity`, `priorityScore`, `classification`, `gapType`, `rootCauseCompetencyId`, `reasonCodes`.
- **New Model `CompetencyPrerequisite`**: Enables direct competency-level DAG analysis and circular dependency protection.
- **New Model `SkillGapAlgorithmConfig`**: Dynamic, versioned algorithm parameters (`severityWeight`, `importanceWeight`, `dependencyWeight`, `coreMultiplier`, etc.).
- **New Models `SkillGapAnalysis` & `SkillGapAnalysisItem`**: Complete temporal diagnostic history tracking multi-tier readiness, gap severity, reason codes, contributing prerequisites, and trend progressions (`IMPROVING`, `STABLE`, `WORSENING`, `NEW`, `RESOLVED`).
- Applied to Neon PostgreSQL via `npx prisma db push` and generated Prisma client.

### 2. Pure Algorithmic Engine (`backend/src/modules/skill-gap/algorithms/`)
All diagnostic metrics, rankings, and readiness decisions are strictly deterministic:
- **`gap-calculation.algorithm.ts`**:
  $$\text{rawGap} = \max(0, \text{requiredLevel} - \text{currentLevel})$$
  $$\text{gapSeverity} = \frac{\text{rawGap}}{\text{requiredLevel}} \times 100$$
  Classifies gaps into `MISSING`, `WEAK`, `AT_RISK` (forgetting risk $\ge 0.65$), `UNCERTAIN` (confidence $< 0.40$), `MEETS_REQUIREMENT`, or `EXCEEDS_REQUIREMENT`.
- **`gap-priority.algorithm.ts`**:
  $$\text{Priority} = \left(0.35 \cdot \text{Sev} + 0.20 \cdot \text{Imp} + 0.15 \cdot \text{Dep} + 0.10 \cdot \text{Unc} + 0.10 \cdot \text{Fgt} + 0.10 \cdot \text{Err}\right) \times M_{\text{crit}}$$
  Multiplied by criticality (`CORE`: 1.25, `IMPORTANT`: 1.10, `NORMAL`: 1.00, `OPTIONAL`: 0.80).
- **`root-cause.algorithm.ts`**:
  Backwards DAG graph traversal detecting upstream unmastered prerequisites and assigning diagnostic reason codes (`PREREQUISITE_DEFICIENCY`, `CORE_REQUIREMENT_UNMET`, `HIGH_SEVERITY_GAP`, etc.).
- **`readiness.algorithm.ts`**:
  Computes Overall Readiness, Core Readiness, and Critical Readiness. Enforces hard gating rules where unmet `CORE` requirements prevent `FULLY_READY` / `GENERALLY_READY` status and can lock advancement (`NOT_READY`).
- **`gap-clustering.algorithm.ts`**:
  Clusters related gaps by competency domain/category and ranks clusters by average priority.
- **`trend.algorithm.ts`**:
  Determines temporal trend trajectory against historical snapshots (`IMPROVING`, `STABLE`, `WORSENING`, `NEW`, `RESOLVED`).

### 3. Services, Repository, and Controller (`backend/src/modules/skill-gap/`)
- **`repositories/skill-gap.repository.ts`**: Queries course requirements, aggregates multi-source evidence, reads competency DAGs, and persists snapshot histories.
- **`services/evidence-aggregation.service.ts`**: Synthesizes evidence from `UserCompetency`, `UserTopicCompetency`, `UserTopicError`, and `LearningEvent`.
- **`services/root-cause.service.ts`**: Coordinates graph traversal and downstream impact summaries.
- **`services/readiness.service.ts`**: Evaluates multi-tier readiness and gating blockers.
- **`services/skill-gap-analysis.service.ts`**: Master orchestrator running the full pipeline and persisting results.
- **`services/revision-integration.service.ts`**: Bridges detected gaps directly to the Adaptive Revision Engine for one-click remediation.
- **`controllers/skill-gap.controller.ts` & `routes/skill-gap.routes.ts`**: Clean Express endpoints mounted under `/api/v1/skill-gaps` with RBAC and Zod validation.

### 4. AI Guidance Layer with Resilient MoES Fallback (`backend/src/modules/skill-gap/ai/`)
- **`skill-gap-schema.ts`**: Strict Zod validation schema for executive summary, readiness evaluation, key findings, and ordered learning paths.
- **`skill-gap-prompt.ts`**: Anonymized prompt builder enforcing zero PII transmission.
- **`skill-gap-analyzer.ts`**: Resilient client invoking LLM providers when configured, with high-fidelity deterministic MoES/IMD scientific fallback.

### 5. Curriculum Seed (`backend/prisma/seed.ts`)
- Seeded `SkillGapAlgorithmConfig` (`v1.0.0`).
- Seeded `CompetencyPrerequisite` graph edges connecting Synoptic Meteorology, NWP Modeling, Radar Meteorology, Satellite Meteorology, Instrumentation, and Ocean Sciences.

---

## Verification & Test Results

### 1. TypeScript Strict Typecheck
```bash
$ npm run typecheck
> enterprise-backend@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0 (Zero errors across entire project)
```

### 2. Algorithmic and End-to-End Simulation Tests
```bash
$ npx jest src/modules/skill-gap/tests/ src/modules/revision/tests/
PASS src/modules/revision/tests/pure-algorithms.test.ts (18 tests)
PASS src/modules/skill-gap/tests/pure-algorithms.test.ts (10 tests)
PASS src/modules/revision/tests/simulations.test.ts (9 tests)
PASS src/modules/skill-gap/tests/simulations.test.ts (7 tests)

Test Suites: 4 passed, 4 total
Tests:       44 passed, 44 total
Snapshots:   0 total

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

---

# Walkthrough: Intelligent Recommendation Engine

We have designed, implemented, migrated, seeded, and verified the production-oriented **Intelligent Recommendation Engine** for Capacity Connect (MoES / IMD domain) on branch `feature/intelligent-recommendation-engine`.

---

## What Was Built

### 1. Database & Prisma Schema Extensions (`backend/prisma/schema.prisma`)
- **Enums**: `RecommendationEventType` (`IMPRESSION`, `VIEW`, `CLICK`, `SAVE`, `DISMISS`, `START`, `ENROLL`, `COMPLETE`, `ABANDON`, `SHARE`) and `RecommendationFeedbackType` (`NOT_RELEVANT`, `ALREADY_KNOW_THIS`, `TOO_DIFFICULT`, `TOO_EASY`, `NOT_NOW`, `WRONG_TOPIC`, `INTERESTING`).
- **`Recommendation` Model**: Extended with `batchId`, `rankPosition`, `algorithmVersion`, `surface`, `candidateSource`, `reasonCodes`, `featureSnapshot`, and timestamps (`shownAt`, `clickedAt`, `actedAt`).
- **`RecommendationBatch` Model**: Persists recommendation query sessions per user and surface.
- **`RecommendationEvent` Model**: Records granular interaction events for attribution and metric computation.
- **`RecommendationFeedback` Model**: Stores explicit learner feedback for suppression and tuning.
- **`RecommendationAlgorithmConfig` Model**: Configures dynamic weights, MMR lambda, exploration ratios, and diversity caps.
- Applied schema updates to Neon PostgreSQL using `npx prisma db push` and generated Prisma Client v5.22.0.

### 2. Pure Algorithmic Engine (`backend/src/modules/recommendation/algorithms/`)
- **`skill-relevance.algorithm.ts`**: Calculates gap severity, level coverage, and criticality multipliers (`CORE` 1.25, `IMPORTANT` 1.10, `NORMAL` 1.0, `OPTIONAL` 0.80).
- **`content-similarity.algorithm.ts`**: Semantic category, topic, and keyword match normalized to $[0, 100]$.
- **`behavioral-affinity.algorithm.ts`**: Interaction weighting with exponential 30-day half-life decay and dismissal penalty.
- **`collaborative.algorithm.ts`**: Peer Jaccard similarity across completed courses; cold-start safe (returns 0 without fabrication).
- **`quality.algorithm.ts`**: Bayesian-dampened ratings (prior $m=4.0, C=5$), completion rates, assessment gains, and low dropout.
- **`freshness.algorithm.ts`**: Publication and update recency with 180-day half-life and 50.0 evergreen floor.
- **`contextual.algorithm.ts`**: Continuation prerequisite match, active view, and departmental alignment.
- **`diversity.algorithm.ts`**: Maximal Marginal Relevance (MMR) re-ranker ($\lambda \cdot \text{Rel} - (1 - \lambda) \cdot \text{Sim}$) with category and trainer caps (max 2).
- **`exploration.algorithm.ts`**: Injects 10–20% novel skill-adjacent courses tagged with `EXPLORATION_HORIZON`.

### 3. Multi-Source Candidate Generators (`backend/src/modules/recommendation/candidate-generators/`)
- `SkillGapCandidateGenerator`: Matches active open skill gaps with courses covering deficient competencies.
- `ContinuationCandidateGenerator`: Suggests active in-progress courses to resume, and newly unlocked downstream courses.
- `ContextualCandidateGenerator`: Contextual candidates for surface, active course views, and departmental focus.
- `ContentCandidateGenerator`: Content similarity matches based on courses completed with high scores.
- `BehavioralCandidateGenerator`: Ingests recent clicks/saves and struggling assessment topics.
- `PopularityCandidateGenerator`: Trending courses with highest completion volume and rate.
- `ExplorationCandidateGenerator`: Emerging domain courses outside the learner's habitual categories.
- `CollaborativeCandidateGenerator`: Collaborative filtering from peer completion histories.

### 4. Services & Ranking Layer (`backend/src/modules/recommendation/services/` & `ranking/`)
- **`EligibilityService`**: Non-negotiable hard filtering: published status, mandatory prerequisites, already completed courses, and 30-day negative feedback suppression.
- **`RecommendationFeatureBuilder`**: Gathers database evidence and extracts all 9 normalized signals.
- **`WeightedLinearRanker`**: Linear combination ranker with normalized feature weights summing to 1.0.
- **`CandidateService`**: Orchestrates and deduplicates candidates across all 8 generators.
- **`RankingService`**: Coordinates feature extraction, ranking, MMR diversity, and exploration.
- **`RecommendationEventService`**: Ingests interaction events and updates timestamps.
- **`RecommendationFeedbackService`**: Records explicit feedback and updates recommendation status.
- **`RecommendationOutcomeService`**: Measures educational efficacy, CTR, enrollment rate, completion rate, and competency gains.
- **`RecommendationService`**: Master coordinator producing typed batches, saving them to PostgreSQL, and calling the explainer.

### 5. AI Pedagogical Explanation Layer (`backend/src/modules/recommendation/ai/`)
- **`recommendation.schema.ts`**: Zod schema for structured pedagogical output.
- **`recommendation-prompt.ts`**: Zero-PII prompt builder enforcing scientific rigor and ground-truth adherence.
- **`recommendation-explainer.ts`**: OpenAI client integration with high-fidelity deterministic MoES/IMD scientific fallback.

### 6. Controller, Validator & REST Routes
- Endpoints mounted at `/api/v1/recommendations`:
  - `GET /api/v1/recommendations`: Personalized recommendation feed.
  - `GET /api/v1/recommendations/latest`: Latest generated batch.
  - `POST /api/v1/recommendations/events`: Granular event tracking.
  - `POST /api/v1/recommendations/events/impressions`: Batch impression tracking.
  - `POST /api/v1/recommendations/feedback`: Explicit negative/positive feedback.
  - `GET /api/v1/recommendations/metrics`: Admin/trainer outcome metrics.

---

## Verification & Test Results

### 1. TypeScript Strict Typecheck
```bash
$ npm run typecheck
> enterprise-backend@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0 (Zero errors across entire project)
```

### 2. Comprehensive Test Suite
```bash
$ npx jest src/modules/recommendation/tests/
PASS src/modules/recommendation/tests/simulations.test.ts
PASS src/modules/recommendation/tests/algorithms.test.ts

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        8.258 s
```

### 3. All 10 Simulation Scenarios Validated:
| Scenario | Operational Scenario | Behavior Validated | Result |
| :--- | :--- | :--- | :--- |
| **A** | Critical Skill Gap in Doppler Radar | Radar course ranked #1 with `CLOSES_CRITICAL_GAP` | **Passed** |
| **B** | Active In-Progress Course | Resumption prioritized with `CONTINUES_LEARNING_PATH` | **Passed** |
| **C** | Completed NWP Prerequisite | Downstream course unlocked with `PREREQUISITE_COMPLETED` | **Passed** |
| **D** | Cold-Start Learner | Returns 0 collaborative score safely; foundational courses guide discovery | **Passed** |
| **E** | Senior Forecaster | Difficulty alignment elevates advanced courses | **Passed** |
| **F** | Remedial Assessment Struggles | Behavioral generator elevates remediation modules | **Passed** |
| **G** | Departmental Shift | Satellite courses elevated upon departmental alignment | **Passed** |
| **H** | Filter-Bubble Prevention | Exploration injects novel ocean state forecasting module | **Passed** |
| **I** | MMR Diversity Re-Ranking | Max 2 courses per category hard constraint enforced | **Passed** |
| **J** | Negative Feedback Suppression | Explicitly excluded dismissed/irrelevant courses | **Passed** |

