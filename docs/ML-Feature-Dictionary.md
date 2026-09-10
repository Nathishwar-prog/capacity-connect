# Capacity Connect — ML Feature Dictionary (Version: v1.0.0)
**Production Learning-to-Rank Recommendation Engine**
*Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)*

---

## 1. Overview & Version Contract

Every candidate course evaluated for a given learner is encoded into a **54-dimensional deterministic feature vector**.
All features undergo strict deterministic preprocessing and normalization into bounded scales $[0, 1]$ before being fed to the **LightGBM / Tree Booster MLRanker** and the **BaselineRanker**.

- **Feature Version**: `v1.0.0`
- **Total Features**: 54
- **Normalized Scale**: $[0.0, 1.0]$
- **Deterministic**: Yes (Zero random numbers; zero future outcome leakage)

---

## 2. Feature Definitions & Group Catalog

### Group A: Skill & Competency Gap Features (Indices 0–10)
Directly captures the learner's developmental needs against the course target competencies.

| Index | Feature Name | Description | Raw Range | Normalization Formula | Educational Objective |
|---|---|---|---|---|---|
| 0 | `skill_maxSkillGap` | Highest competency gap level addressed by course | $0 - 5$ | $\text{clamp}(val / 5.0, 0, 1)$ | Prioritize high-gap needs |
| 1 | `skill_avgSkillGap` | Mean gap level across all course competencies | $0 - 5$ | $\text{clamp}(val / 5.0, 0, 1)$ | Overall skill fit |
| 2 | `skill_weightedSkillGap` | Importance-weighted gap score with core multiplier | $0 - 10$ | $\text{clamp}(val / 10.0, 0, 1)$ | Mission-critical weighting |
| 3 | `skill_criticalGapCount` | Number of open `CRITICAL` gaps closed by course | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Core MoES operational safety |
| 4 | `skill_highPriorityGapCount` | Number of open `HIGH` priority gaps closed | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | High-priority progression |
| 5 | `skill_competencyCoverage` | Ratio of course competencies addressing open gaps | $0.0 - 1.0$ | Identity clamp $[0, 1]$ | Course focus efficiency |
| 6 | `skill_gapCoverage` | Fraction of total user gaps addressed by this single course | $0.0 - 1.0$ | Identity clamp $[0, 1]$ | Breadth of skill coverage |
| 7 | `skill_requiredLevel` | Mean competency level required by the course | $1 - 5$ | $\text{clamp}(val / 5.0, 0, 1)$ | Absolute difficulty index |
| 8 | `skill_currentLevel` | Mean current competency level of learner in mapped skills | $0 - 5$ | $\text{clamp}(val / 5.0, 0, 1)$ | Learner baseline |
| 9 | `skill_levelDifference` | Level leap ($L_{\text{required}} - L_{\text{current}}$) | $-5 - +5$ | $\text{clamp}((val + 5.0) / 10.0, 0, 1)$ | Difficulty fit; prevents cognitive overload |
| 10 | `skill_competencyImportance` | Average importance weight of target competencies | $0.0 - 1.0$ | Identity clamp $[0, 1]$ | Core vs Elective priority |

---

### Group B: Prerequisite Safety Features (Indices 11–15)
Protects learners from attempting advanced numerical or instrumentation courses without prerequisite foundations.

| Index | Feature Name | Description | Raw Range | Normalization Formula | Educational Objective |
|---|---|---|---|---|---|
| 11 | `prereq_prerequisiteCount` | Total prerequisites defined for the course | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Dependency complexity |
| 12 | `prereq_satisfiedPrerequisiteRatio` | Fraction of prerequisites completed by learner | $0.0 - 1.0$ | Identity clamp $[0, 1]$ | Prerequisite safety gate |
| 13 | `prereq_missingPrerequisiteCount` | Count of unfulfilled mandatory prerequisites | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Risk indicator |
| 14 | `prereq_prerequisiteGapSeverity` | Severity penalty if foundational courses missing | $0.0 - 1.0$ | $\text{missing} / \max(1, \text{total})$ | Safety down-ranking signal |
| 15 | `prereq_prerequisiteReadiness` | Composite readiness score | $0.0 - 1.0$ | Identity clamp $[0, 1]$ | Readiness thresholding |

---

### Group C: Behavioral Affinity Features (Indices 16–25)
Measures learner engagement patterns with exponential half-life time decay ($\lambda = 0.05/\text{day}$).

| Index | Feature Name | Description | Raw Range | Normalization Formula | Time Decay Applied |
|---|---|---|---|---|---|
| 16 | `behavior_courseViews` | Historic impressions/views of this course | $0 - \infty$ | $\log(1 + val) / \log(1 + 50)$ | None |
| 17 | `behavior_courseClicks` | User clicks on this course card | $0 - \infty$ | $\log(1 + val) / \log(1 + 30)$ | Yes |
| 18 | `behavior_courseStarts` | Number of times learner launched modules | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Yes |
| 19 | `behavior_courseCompletions` | Completions of this or prerequisite modules | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Yes |
| 20 | `behavior_courseAbandons` | Drops or dismissals of related material | $0 - \infty$ | $\log(1 + val) / \log(1 + 10)$ | Negative weighting |
| 21 | `behavior_categoryViews` | Activity in this scientific discipline (e.g. NWP) | $0 - \infty$ | $\log(1 + val) / \log(1 + 100)$ | Yes |
| 22 | `behavior_categoryCompletions` | Completed courses in same scientific domain | $0 - \infty$ | $\log(1 + val) / \log(1 + 20)$ | Yes |
| 23 | `behavior_similarCourseInteractions` | Peer or related course touchpoints | $0 - \infty$ | $\log(1 + val) / \log(1 + 50)$ | Yes |
| 24 | `behavior_recentActivity` | Total platform activities over last 30 days | $0 - \infty$ | $\log(1 + val) / \log(1 + 100)$ | Yes |
| 25 | `behavior_activityRecency` | Exponential recency score | $0.0 - 1.0$ | $\exp(-0.05 \times \Delta t_{\text{days}})$ | Direct exponential decay |

---

### Group D: Course Quality & Freshness Features (Indices 26–36)
Quality signals dampened by Bayesian minimum evidence thresholds.

| Index | Feature Name | Description | Raw Range | Normalization Formula |
|---|---|---|---|---|
| 26 | `course_difficulty` | Encoded course difficulty (BEGINNER: 1 to EXPERT: 4) | $1 - 4$ | $\text{clamp}(val / 4.0, 0, 1)$ |
| 27 | `course_durationMinutes` | Estimated duration in minutes | $0 - 1200$ | $\log(1 + val) / \log(1 + 1200)$ |
| 28 | `course_categoryCode` | Discrete domain encoding (NWP=1, Radar=2, etc.) | $1 - 12$ | $\text{clamp}(val / 20.0, 0, 1)$ |
| 29 | `course_competencyCount` | Number of distinct competencies taught | $0 - \infty$ | $\log(1 + val) / \log(1 + 15)$ |
| 30 | `course_targetLevel` | Target mastery level | $1 - 5$ | $\text{clamp}(val / 5.0, 0, 1)$ |
| 31 | `course_freshness` | Half-life decay from publication date | $0.0 - 1.0$ | $\exp(-0.01 \times \Delta t_{\text{published}})$ |
| 32 | `course_qualityScore` | Bayesian blended rating & completion score | $0 - 100$ | $\text{clamp}(val / 100.0, 0, 1)$ |
| 33 | `course_completionRate` | Historical course completion percentage | $0.0 - 1.0$ | Identity clamp $[0, 1]$ |
| 34 | `course_averageRating` | Mean feedback rating from verified learners | $1.0 - 5.0$ | $\text{clamp}((val - 1.0) / 4.0, 0, 1)$ |
| 35 | `course_dropoutRate` | Proportion of learners dropping out | $0.0 - 1.0$ | Identity clamp $[0, 1]$ |
| 36 | `course_assessmentImprovementRate` | Historical score increase in post-course assessments | $0.0 - 1.0$ | Identity clamp $[0, 1]$ |

---

### Group E: Organizational Context Features (Indices 37–41)
Matches learner institutional affiliations.

| Index | Feature Name | Description | Values |
|---|---|---|---|
| 37 | `context_departmentMatch` | 1 if course aligns with user's IMD/MoES department | $\{0.0, 1.0\}$ |
| 38 | `context_organizationMatch` | 1 if course belongs to same organization | $\{0.0, 1.0\}$ |
| 39 | `context_roleMatch` | 1 if content matches trainee developmental track | $\{0.0, 1.0\}$ |
| 40 | `context_categoryMatch` | 1 if learner has previous activity in this category | $\{0.0, 1.0\}$ |
| 41 | `context_learningPathMatch` | 1 if course continues active milestone sequence | $\{0.0, 1.0\}$ |

---

### Group F: Semantic Similarity Features (Indices 42–44)
Domain-specific semantic alignment across topics and competency clusters.

| Index | Feature Name | Description | Range |
|---|---|---|---|
| 42 | `semantic_courseUserEmbeddingSimilarity` | Cosine similarity between course vector and learner profile | $[0.0, 1.0]$ |
| 43 | `semantic_competencySemanticSimilarity` | Semantic alignment of course objectives to learner gaps | $[0.0, 1.0]$ |
| 44 | `semantic_recentLearningSimilarity` | Similarity to topics studied in the last 14 days | $[0.0, 1.0]$ |

---

### Group G: Historical Telemetry Features (Indices 45–50)
Learner's historic responsiveness to recommendations.

| Index | Feature Name | Description | Normalization |
|---|---|---|---|
| 45 | `history_previousRecommendationCount` | Times this course was previously recommended | $\log(1 + val) / \log(1 + 50)$ |
| 46 | `history_previousImpressionCount` | Total impressions recorded | $\log(1 + val) / \log(1 + 50)$ |
| 47 | `history_previousClickRate` | Clicks / Impressions for this learner | $\text{clamp}(val, 0, 1)$ |
| 48 | `history_previousEnrollmentRate` | Enrollments / Recommendations | $\text{clamp}(val, 0, 1)$ |
| 49 | `history_previousCompletionRate` | Completions / Enrollments | $\text{clamp}(val, 0, 1)$ |
| 50 | `history_previousCompetencyImprovementRate` | Verified competency gains following recommendation | $\text{clamp}(val, 0, 1)$ |

---

### Group H: Temporal Features (Indices 51–53)
Controls fatigue and prevents repetition.

| Index | Feature Name | Description | Normalization |
|---|---|---|---|
| 51 | `temporal_daysSinceLastInteraction` | Days since learner interacted with this course | $\text{clamp}(val / 180.0, 0, 1)$ |
| 52 | `temporal_daysSinceCoursePublished` | Days elapsed since course publication | $\text{clamp}(val / 365.0, 0, 1)$ |
| 53 | `temporal_daysSinceLastLearningActivity` | Days since user last completed any learning event | $\text{clamp}(val / 180.0, 0, 1)$ |
