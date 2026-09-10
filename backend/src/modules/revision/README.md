# Adaptive Competency-Based Revision Engine

A production-grade, mathematically grounded revision engine for the Capacity Connect (Ministry of Earth Sciences / India Meteorological Department) enterprise learning platform.

## Architectural Philosophy

Unlike naive "lowest score revision" features, this engine:
1. **Deterministically Identifies the Learner's Weakest Competency Group**: Focuses revision energy on a coherent domain (e.g. *Doppler Weather Radar Operations*) to prevent scattered context switching.
2. **Diagnoses Root Prerequisite Weaknesses via Curriculum DAG**: If a learner is struggling with *Nyquist Velocity Dealiasing*, the engine traces back to ensure foundational *Radar Reflectivity Factor (Z-R)* principles are remediated first.
3. **Applies Multi-Factor Topic Ranking**: Combines 7 objective signals ($W, F, I, D, E, U, R$) using pure mathematical algorithms.
4. **Pedagogical Sequence Structuring**:
   $$\text{Root Prerequisite} \longrightarrow \text{Primary Weakness} \longrightarrow \text{Related Topic} \longrightarrow \text{Targeted Practice} \longrightarrow \text{Retrieval Verification}$$
5. **Separation of Concerns for LLMs**: The algorithmic core deterministically decides *what*, *why*, *when*, and in what *sequence* topics are revised. The LLM is used **only** for educational content generation (concept recap, operational Indian subcontinent examples, practice questions with hints, and retrieval checks).

---

## Pure Mathematical Formulations

### 1. Multi-Component Performance Formula
$$P = 0.55 \cdot \text{acc} + 0.15 \cdot \text{speed} + 0.10 \cdot \text{hint} + 0.10 \cdot \text{conf} + 0.10 \cdot \text{indep}$$
- All components normalized to $[0.0, 1.0]$.
- Resulting event performance $P \in [0.0, 1.0]$.

### 2. Bounded Adaptive Learning Rate
$$\alpha = \text{clamp}\left(0.10, 0.30, \frac{0.30}{1.0 + 0.12 \cdot N}\right) \times w_{\text{diff}}$$
- Allows quick initial score convergence while guaranteeing stability as sample size $N$ matures.

### 3. Exponential Memory Decay & Stability Expansion
$$R = \exp\left(-\frac{\Delta t}{S}\right), \quad F = 1 - R$$
- $S_{\text{new}} = S \cdot (1 + 1.2 \cdot P \cdot \min(2, 1 + \Delta t / S))$ for successful recall ($P \ge 0.70$).
- $S_{\text{new}} = \max(0.5, S \cdot 0.5)$ for failed recall ($P < 0.50$).

### 4. Group Priority Formulation
$$GP = 0.40 \cdot GW + 0.20 \cdot GF + 0.15 \cdot GI + 0.15 \cdot GD + 0.10 \cdot GU$$
- $GW$: Group Weakness $(100 - \bar{S})$
- $GF$: Group Forgetting Risk $(1 - \bar{R}) \cdot 100$
- $GI$: Structural Importance Weight $(\bar{I} / 5) \cdot 100$
- $GD$: Downstream DAG Impact Score
- $GU$: Urgency $(\Delta t \times 3.5)$

### 5. 7-Factor Topic Priority Formula
$$TP = 0.35 \cdot W + 0.18 \cdot F + 0.12 \cdot I + 0.12 \cdot D + 0.10 \cdot E + 0.08 \cdot U + 0.05 \cdot R$$

---

## API Endpoints

All endpoints are mounted at `/api/v1/revision`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/revision/sessions/generate` | Generates a new group-coherent adaptive revision session. |
| `GET` | `/api/v1/revision/sessions/:sessionId` | Retrieves a revision session with educational content snapshots. |
| `GET` | `/api/v1/revision/sessions/latest/current` | Retrieves the learner's most recent revision session. |
| `GET` | `/api/v1/revision/groups/analysis` | Returns deterministic ranking of all competency groups. |
| `POST` | `/api/v1/revision/sessions/outcomes` | Records practice/retrieval verification item completion. |
| `POST` | `/api/v1/revision/events` | Ingests generic learning events (quizzes, simulations, diagnostics). |
| `GET` | `/api/v1/revision/profile` | Retrieves learner's competency, retention, and error profile. |

---

## Test Coverage

- **Algorithmic Unit Tests**: `backend/src/modules/revision/tests/pure-algorithms.test.ts`
- **10 Simulation Scenarios**: `backend/src/modules/revision/tests/simulations.test.ts`
  1. Beginner with foundational gaps (root prerequisite prioritized)
  2. Intermediate learner who forgot earlier topics (high forgetting factor)
  3. Advanced learner making repeated specific errors (high error severity)
  4. Erratic learner with high score variance (diagnostic verification required)
  5. Fast guesser (high speed penalized by zero accuracy)
  6. Slow methodical learner (high accuracy rewards score)
  7. Hint-dependent learner (dampened independence score)
  8. Overconfident learner (bounded recalibration)
  9. Long absence learner (exponential forgetting decay & maximum urgency)
  10. Multi-domain learner with scattered weaknesses (selects single weakest group)
