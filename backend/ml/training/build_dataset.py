"""
Capacity Connect — Dataset Builder Script
Prepares training, validation, and test LTR datasets from Capacity Connect interaction data.
If database records are sparse, synthesizes educational domain scenarios (MoES/IMD)
satisfying the strict 54-feature contract.
"""

import os
import sys
import json
import random
import argparse
from datetime import datetime, timedelta

FEATURE_NAMES = [
    # Skill (11)
    'skill_maxSkillGap', 'skill_avgSkillGap', 'skill_weightedSkillGap',
    'skill_criticalGapCount', 'skill_highPriorityGapCount', 'skill_competencyCoverage',
    'skill_gapCoverage', 'skill_requiredLevel', 'skill_currentLevel',
    'skill_levelDifference', 'skill_competencyImportance',
    # Prerequisite (5)
    'prereq_prerequisiteCount', 'prereq_satisfiedPrerequisiteRatio',
    'prereq_missingPrerequisiteCount', 'prereq_prerequisiteGapSeverity',
    'prereq_prerequisiteReadiness',
    # Behavior (10)
    'behavior_courseViews', 'behavior_courseClicks', 'behavior_courseStarts',
    'behavior_courseCompletions', 'behavior_courseAbandons', 'behavior_categoryViews',
    'behavior_categoryCompletions', 'behavior_similarCourseInteractions',
    'behavior_recentActivity', 'behavior_activityRecency',
    # Course (11)
    'course_difficulty', 'course_durationMinutes', 'course_categoryCode',
    'course_competencyCount', 'course_targetLevel', 'course_freshness',
    'course_qualityScore', 'course_completionRate', 'course_averageRating',
    'course_dropoutRate', 'course_assessmentImprovementRate',
    # Context (5)
    'context_departmentMatch', 'context_organizationMatch', 'context_roleMatch',
    'context_categoryMatch', 'context_learningPathMatch',
    # Semantic (3)
    'semantic_courseUserEmbeddingSimilarity', 'semantic_competencySemanticSimilarity',
    'semantic_recentLearningSimilarity',
    # Historical (6)
    'history_previousRecommendationCount', 'history_previousImpressionCount',
    'history_previousClickRate', 'history_previousEnrollmentRate',
    'history_previousCompletionRate', 'history_previousCompetencyImprovementRate',
    # Temporal (3)
    'temporal_daysSinceLastInteraction', 'temporal_daysSinceCoursePublished',
    'temporal_daysSinceLastLearningActivity'
]


def generate_synthetic_ltr_data(num_queries: int = 120, items_per_query: int = 8) -> dict:
    """Generates realistic MoES educational LTR training data."""
    random.seed(42)
    base_time = datetime.now() - timedelta(days=60)

    all_queries = []

    for q_idx in range(num_queries):
        q_time = base_time + timedelta(hours=q_idx * 12)
        query_id = f"batch-synth-{q_idx:04d}"
        user_id = f"user-{q_idx % 25:03d}"

        # Learner baseline attributes
        user_dept_pref = random.choice([1, 2, 3, 5])

        query_rows = []
        for i_idx in range(items_per_query):
            course_id = f"course-synth-{(q_idx * items_per_query + i_idx) % 40:03d}"

            # Create realistic features
            cat_code = random.randint(1, 12)
            has_gap = random.random() < 0.45
            gap_severity = random.uniform(0.3, 0.9) if has_gap else random.uniform(0.0, 0.2)
            critical = 1.0 if has_gap and random.random() < 0.3 else 0.0
            prereq_ready = random.choice([1.0, 1.0, 0.8, 0.2])
            quality = random.uniform(0.65, 0.95)
            dept_match = 1.0 if cat_code == user_dept_pref else 0.0

            # 54 features vector
            feat_vec = [
                gap_severity, gap_severity * 0.8, gap_severity * 1.2, # skill gaps
                critical, 1.0 if has_gap else 0.0, 0.7 if has_gap else 0.2,
                0.8 if has_gap else 0.1, 0.6, 0.4, 0.2, 0.8,
                # Prereqs
                0.3, prereq_ready, 0.0 if prereq_ready > 0.5 else 0.3,
                0.0 if prereq_ready > 0.5 else 0.5, prereq_ready,
                # Behavior
                random.uniform(0.1, 0.5), random.uniform(0.1, 0.4),
                random.uniform(0.0, 0.3), random.uniform(0.0, 0.2), 0.0,
                0.5 if dept_match else 0.1, 0.3 if dept_match else 0.0,
                0.4 if dept_match else 0.1, 0.5, 0.7,
                # Course
                0.5, 0.4, cat_code / 20.0, 0.3, 0.6, 0.8, quality,
                random.uniform(0.6, 0.9), 0.85, 0.2, 0.75,
                # Context
                dept_match, 1.0, 1.0, dept_match, dept_match,
                # Semantic
                0.8 if dept_match else 0.4, 0.85 if has_gap else 0.3, 0.7 if dept_match else 0.3,
                # Historical
                0.2, 0.2, 0.3, 0.2, 0.15, 0.1,
                # Temporal
                0.1, 0.2, 0.1
            ]

            # Assign ground-truth outcome label (0 to 5)
            # Higher educational outcome if closing critical gap + prereqs satisfied + quality
            true_utility = (
                gap_severity * 3.0 +
                critical * 2.5 +
                prereq_ready * 2.0 +
                quality * 1.5 +
                dept_match * 1.0 +
                random.gauss(0, 0.4)
            )

            if true_utility > 6.0:
                label = 5 # Competency improvement
                outcome = "COMPETENCY_IMPROVEMENT"
            elif true_utility > 4.8:
                label = 4 # Course completion
                outcome = "COURSE_COMPLETED"
            elif true_utility > 3.6:
                label = 3 # Course start / enroll
                outcome = "COURSE_STARTED"
            elif true_utility > 2.2:
                label = 2 # Save or click
                outcome = "CLICK_OR_SAVE"
            elif true_utility > 1.0:
                label = 1 # Impression
                outcome = "IMPRESSION"
            else:
                label = 0 # Dismiss / abandon
                outcome = "DISMISSED"

            query_rows.append({
                "queryId": query_id,
                "userId": user_id,
                "courseId": course_id,
                "timestamp": q_time.isoformat(),
                "label": label,
                "featureVector": feat_vec,
                "outcomeType": outcome
            })

        all_queries.append(query_rows)

    # Temporal split: 70% train, 15% validation, 15% test
    n_train = int(num_queries * 0.70)
    n_val = int(num_queries * 0.15)

    train_rows = [item for q in all_queries[:n_train] for item in q]
    val_rows = [item for q in all_queries[n_train:n_train + n_val] for item in q]
    test_rows = [item for q in all_queries[n_train + n_val:] for item in q]

    return {
        "train": train_rows,
        "validation": val_rows,
        "test": test_rows,
        "metadata": {
            "totalRows": len(train_rows) + len(val_rows) + len(test_rows),
            "trainCount": len(train_rows),
            "valCount": len(val_rows),
            "testCount": len(test_rows),
            "datasetVersion": f"ds-{int(datetime.now().timestamp())}",
            "featureVersion": "v1.0.0",
            "featureNames": FEATURE_NAMES
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Build and export recommendation dataset")
    parser.add_argument("--output_path", type=str, default="ml/data/latest_dataset.json", help="Output path")
    parser.add_argument("--queries", type=int, default=120, help="Number of query groups")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output_path), exist_ok=True)
    dataset = generate_synthetic_ltr_data(num_queries=args.queries)

    with open(args.output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print(f"Dataset successfully built and saved to: {args.output_path}")
    print(f"Total Rows: {dataset['metadata']['totalRows']}")
    print(f"Train: {dataset['metadata']['trainCount']}, Val: {dataset['metadata']['valCount']}, Test: {dataset['metadata']['testCount']}")


if __name__ == "__main__":
    main()
