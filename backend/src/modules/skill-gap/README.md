# Capacity Connect — AI Skill Gap Analyzer

The **AI Skill Gap Analyzer** is a production-grade, deterministic diagnostic and developmental guidance engine for the **Ministry of Earth Sciences (MoES)** and **India Meteorological Department (IMD)**.

---

## 🏛 Architectural Principles

1. **Strict Separation of Concerns**:
   - **Deterministic Algorithms**: Calculate all numerical skill gaps, 6-factor priority rankings, prerequisite DAG traversals, domain clusters, temporal trends, and multi-tier readiness scores.
   - **LLM Pedagogical Layer**: Acts strictly as a scientific explainer and learning path narrator. The LLM **NEVER** assigns scores, invents competencies, alters database state, or overrides readiness calculations.
2. **Deterministic Domain Fallback**:
   - In case of network failure, LLM timeout, or absent API keys, the system seamlessly generates high-fidelity, schema-validated MoES/IMD guidance with structured learning paths addressing root causes first.
3. **Zero PII Transmission**:
   - The AI prompt payload is completely anonymized. No learner names, emails, user IDs, or organization IDs are ever sent to external LLM providers.

---

## 📐 Mathematical Formulations

### 1. Raw Gap & Severity
$$\text{rawGap} = \max(0, \text{requiredLevel} - \text{currentLevel})$$
$$\text{gapSeverity} = \text{requiredLevel} > 0 \; ? \; \min\left(100, \max\left(0, \frac{\text{rawGap}}{\text{requiredLevel}} \times 100\right)\right) : 0$$

### 2. Gap Classifications
- `MISSING`: $\text{currentLevel} = 0 \land \text{requiredLevel} > 0$
- `WEAK`: $\text{rawGap} > 0 \land \text{evidenceCount} > 0 \land \text{confidenceScore} \ge 0.40$
- `AT_RISK`: $\text{rawGap} = 0 \land \text{forgettingRisk} \ge 0.65$ (retention degradation alert)
- `UNCERTAIN`: $\text{rawGap} > 0 \land (\text{evidenceCount} = 0 \lor \text{confidenceScore} < 0.40)$
- `MEETS_REQUIREMENT`: $\text{rawGap} = 0 \land \text{currentLevel} = \text{requiredLevel}$
- `EXCEEDS_REQUIREMENT`: $\text{currentLevel} > \text{requiredLevel}$

### 3. 6-Factor Gap Priority Formula
$$\text{BasePriority} = 0.35 \cdot \text{Sev} + 0.20 \cdot \text{Imp} + 0.15 \cdot \text{Dep} + 0.10 \cdot \text{Unc} + 0.10 \cdot \text{Fgt} + 0.10 \cdot \text{Err}$$

Multiplied by **Requirement Criticality**:
- **CORE**: $\times 1.25$
- **IMPORTANT**: $\times 1.10$
- **NORMAL**: $\times 1.00$
- **OPTIONAL**: $\times 0.80$

Final score clamped to $[0, 100]$:
- $\ge 75$: `CRITICAL`
- $\ge 50$: `HIGH`
- $\ge 25$: `MEDIUM`
- $< 25$: `LOW`

### 4. Multi-Tier Readiness & Hard CORE Gating
- **Overall Readiness**:
  $$\text{OverallReadiness} = \frac{\sum (\min(\text{required}_i, \text{current}_i) \times w_i)}{\sum (\text{required}_i \times w_i)} \times 100$$
- **Core Readiness**: Evaluated over competencies with `criticality === 'CORE'`.
- **Critical Readiness**: Evaluated over `CORE` + `IMPORTANT`.
- **Hard Gating Rules**:
  - If any `CORE` requirement has $\text{rawGap} > 0$, status **cannot** be `FULLY_READY` or `GENERALLY_READY`.
  - If core deficiencies $\ge 2$ or core readiness $< 50\%$, status is forced to `NOT_READY` (`canEnrollOrAdvance: false`).

---

## 🌐 API Reference

All endpoints are mounted under `/api/v1/skill-gaps` and require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Executes complete deterministic analysis and AI guidance |
| `GET` | `/` | Retrieves active open skill gaps for learner |
| `GET` | `/readiness` | Evaluates lightweight readiness metrics against a course/platform |
| `GET` | `/history` | Returns temporal history of analysis snapshots |
| `GET` | `/analysis/:id` | Returns a specific past analysis snapshot |
| `POST` | `/remediate` | Bridges directly to Adaptive Revision Engine for targeted remediation |

---

## 🧪 Testing

Pure algorithms and simulation suites:
```bash
npx jest src/modules/skill-gap/tests/
```
