# Capacity Connect — Intelligent Recommendation Engine

## Executive Architecture & Implementation Reference
**Domain**: Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)  
**Status**: Production-Ready  
**Version**: `v1.0.0`

---

## 1. System Overview

The **Intelligent Recommendation Engine** is an enterprise-grade, multi-stage recommendation system custom-designed for the Capacity Connect LMS. It draws upon foundational recommendation architectures (candidate generation, hard filtering, multi-signal ranking, diversity re-ranking, exploration, feedback loops, and educational outcome attribution) while strictly respecting pedagogical progression and scientific domain prerequisites.

### Core Architectural Principle: Deterministic Algorithms vs. LLM Narrator
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DETERMINISTIC PIPELINE                            │
│                                                                             │
│  [Candidate Generators (8x)] ──► [Hard Eligibility Filters]                 │
│                                           │                                 │
│                                           ▼                                 │
│     [Controlled Exploration] ◄── [MMR Diversity Re-Ranker] ◄── [9-Feature   │
│                 │                                             Ranker]       │
└─────────────────┼───────────────────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      QUALITATIVE LLM NARRATOR LAYER                         │
│                                                                             │
│  • Consumes deterministically ranked list and ground-truth reasonCodes       │
│  • Generates pedagogical headlines, whyRecommended, and study advice        │
│  • Zero-PII payload; CANNOT alter ranking, scores, or eligibility            │
│  • Resilient deterministic MoES/IMD scientific fallback                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Stage Pipeline Breakdown

### Stage 1: Multi-Source Candidate Generation
Eight specialized candidate generators extract potential learning opportunities:
1. **Skill-Gap Generator (`SKILL_GAP`)**: Queries active learner skill gaps (`SkillGap` / `UserCompetency`) and matches courses providing the deficient competencies (`CourseCompetency`). Assigns `CLOSES_CRITICAL_GAP` and `CLOSES_SKILL_GAP`.
2. **Continuation Generator (`CONTINUATION`)**: Detects active in-progress enrollments (`progressPercentage > 0`) to encourage resumption, and identifies newly unlocked downstream courses whose prerequisites were recently fulfilled (`CoursePrerequisite`). Assigns `CONTINUES_LEARNING_PATH` and `PREREQUISITE_COMPLETED`.
3. **Contextual Generator (`CONTEXTUAL`)**: Adjusts candidates according to the active surface (`DASHBOARD`, `COURSE_PAGE`, `ASSESSMENT_RESULT`, `SKILL_PROFILE`), active course viewing sessions, and departmental mission alignment (`DEPARTMENT_FOCUS`).
4. **Content Similarity Generator (`CONTENT_SIMILARITY`)**: Uses tokenization and overlap scoring across category and topics against courses the learner previously completed with distinction (`SIMILAR_TO_COMPLETED`).
5. **Behavioral Generator (`BEHAVIORAL`)**: Captures recent recommendation interaction signals (saves, clicks) and struggling topics from recent assessment errors (`RECENTLY_SAVED`, `FREQUENTLY_VIEWED_TOPIC`).
6. **Popularity & Trending Generator (`POPULARITY`)**: Computes completion volume and rates within the learner's department and institute using Bayesian dampening (`TRENDING_IN_DEPARTMENT`, `HIGH_COMPLETION_RATE`).
7. **Controlled Exploration Generator (`EXPLORATION`)**: Identifies high-quality courses outside the learner's familiar categories to foster serendipity in emerging disciplines (AI/ML in NWP, Satellite assimilation, Ocean modeling).
8. **Collaborative Filtering Generator (`COLLABORATIVE`)**: Computes peer Jaccard similarity across completed course vectors. Completely cold-start safe (returns 0 without fabrication when history is absent).

### Stage 2: Hard Eligibility Filtering
Enforces non-negotiable educational boundaries prior to ranking:
- **Published Status**: Rejects all `DRAFT`, `PENDING_APPROVAL`, or `ARCHIVED` courses.
- **Mandatory Prerequisites**: Verifies the learner has completed all prerequisites in `CoursePrerequisite`. Rejects courses with unmet prerequisites as immediate suggestions.
- **Consumption Check**: Rejects courses already `COMPLETED` by the learner.
- **Explicit Negative Feedback Suppression**: Automatically filters out courses dismissed or marked `NOT_RELEVANT` or `ALREADY_KNOW_THIS` in the last 30 days.

### Stage 3: Multi-Signal Ranking
Normalizes 9 independent features to $[0, 100]$:
$$Score(c) = \sum_{i=1}^9 w_i \cdot Feature_i(c), \quad \sum w_i = 1.0$$
- $w_{\text{skillRelevance}} = 0.25$: Gap severity, level coverage, and criticality multipliers (`CORE` 1.25, `IMPORTANT` 1.10, `NORMAL` 1.0, `OPTIONAL` 0.80).
- $w_{\text{contentSimilarity}} = 0.15$: Category, topic, and keyword match.
- $w_{\text{behavioralAffinity}} = 0.10$: Exponential decay ($\tau = 30$ days) over interaction history.
- $w_{\text{collaborative}} = 0.10$: Jaccard peer similarity over completed courses.
- $w_{\text{quality}} = 0.15$: Bayesian-dampened rating ($m=4.0, C=5$), completion rate, and retention.
- $w_{\text{freshness}} = 0.05$: Recency decay ($\tau = 180$ days) with an evergreen floor of 50.0.
- $w_{\text{contextual}} = 0.10$: Surface and departmental focus.
- $w_{\text{difficultyAlignment}} = 0.05$: Matches learner competency level to course difficulty.
- $w_{\text{historicalSuccess}} = 0.05$: Departmental completion success rate.

### Stage 4: Diversity Re-Ranking (MMR) & Controlled Exploration
- **Maximal Marginal Relevance (MMR)**:
  $$\text{MMR\_Score}(c) = \lambda \cdot \text{Relevance}(c) - (1 - \lambda) \cdot \max_{s \in \text{Selected}} \text{Similarity}(c, s)$$
  Default $\lambda = 0.70$. Hard constraints enforce a maximum of 2 courses from the same category and 2 courses from the same trainer.
- **Controlled Exploration**:
  Reserves 10–20% of slots (default 15%) for novel, skill-adjacent courses tagged with `EXPLORATION_HORIZON`.

### Stage 5: Educational Outcome Attribution
Tracks full interaction-to-competency lifecycles:
$$\text{Recommendation} \longrightarrow \text{Impression} \longrightarrow \text{Click} \longrightarrow \text{Enrollment} \longrightarrow \text{Completion} \longrightarrow \text{Competency Gain}$$
Metrics computed include Click-Through Rate (CTR), Enrollment Rate, Completion Rate, and Average Competency Score Gains.

---

## 3. Database Schema Models

The recommendation system is supported by dedicated Neon PostgreSQL models:
- `Recommendation`: Individual recommendation record with score, rankPosition, candidateSource, reasonCodes, featureSnapshot, and timestamps (`shownAt`, `clickedAt`, `actedAt`).
- `RecommendationBatch`: Stores recommendation generation batches per user and surface.
- `RecommendationEvent`: Tracks granular learner interaction events (`IMPRESSION`, `VIEW`, `CLICK`, `SAVE`, `DISMISS`, `START`, `ENROLL`, `COMPLETE`, `ABANDON`, `SHARE`).
- `RecommendationFeedback`: Captures explicit user feedback (`NOT_RELEVANT`, `ALREADY_KNOW_THIS`, `TOO_DIFFICULT`, `TOO_EASY`, `NOT_NOW`, `WRONG_TOPIC`, `INTERESTING`).
- `RecommendationAlgorithmConfig`: Dynamic database configuration of feature weights, $\lambda$, exploration ratios, and diversity constraints.
- `UserRecommendationProfile`: Stores learner category and topic preferences.
- `CourseRecommendationProfile`: Caches course quality, freshness, and engagement scores.

---

## 4. REST API Reference

All endpoints are mounted at `/api/v1/recommendations` and require JWT authentication:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/recommendations` | Generates a fresh personalized recommendation batch. |
| `GET` | `/api/v1/recommendations/latest` | Retrieves the most recent recommendation batch for the user. |
| `POST` | `/api/v1/recommendations/events` | Ingests granular interaction events (`CLICK`, `SAVE`, `DISMISS`, etc.). |
| `POST` | `/api/v1/recommendations/events/impressions` | Batch-tracks impressions when recommendations become visible. |
| `POST` | `/api/v1/recommendations/feedback` | Submits explicit learner feedback for a recommended course. |
| `GET` | `/api/v1/recommendations/metrics` | Retrieves aggregate educational outcome metrics (admin/trainer). |

---

## 5. Verification & Test Coverage

### Automated Test Suite:
- **`algorithms.test.ts`** (15 unit tests): Validates all 9 pure algorithms, MMR diversity constraints, and exploration candidate injection in isolation.
- **`simulations.test.ts`** (10 simulation tests): Executes the 10 Synthetic Simulation Scenarios (Scenarios A through J):
  - **Scenario A**: Critical Skill Gap in Doppler Weather Radar $\to$ Ranked #1 with `CLOSES_CRITICAL_GAP`.
  - **Scenario B**: Active In-Progress Course $\to$ Prioritized with `CONTINUES_LEARNING_PATH`.
  - **Scenario C**: Unlocked Prerequisite Course $\to$ Recommended with `PREREQUISITE_COMPLETED`.
  - **Scenario D**: Cold-Start Learner $\to$ Zero collaborative signal without fabrication; foundational courses guide discovery.
  - **Scenario E**: Senior Forecaster $\to$ Difficulty alignment elevates advanced courses.
  - **Scenario F**: Remedial Assessment Struggles $\to$ Behavioral generator elevates remediation modules.
  - **Scenario G**: Departmental Shift $\to$ Elevates courses aligned with the destination division.
  - **Scenario H**: Filter-Bubble Prevention $\to$ Injects novel ocean state forecasting module with `EXPLORATION_HORIZON`.
  - **Scenario I**: MMR Diversity Cap $\to$ Enforces max 2 courses per category constraint.
  - **Scenario J**: Negative Feedback Suppression $\to$ Explicitly excluded dismissed/irrelevant courses.

**Result**: 25/25 recommendation tests passing, 0 type errors (`tsc --noEmit`).
