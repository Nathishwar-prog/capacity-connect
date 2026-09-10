"""
Capacity Connect — Learning-to-Rank Offline Evaluator
Computes NDCG@K (K=3, 5, 10), MAP@10, MRR, Precision@K, Recall@K on test split.
Compares Booster ML Ranker against the deterministic BaselineRanker.
"""

import os
import sys
import json
import argparse
from typing import Dict, List, Tuple, Any
import numpy as np


def evaluate_node(node: Dict[str, Any], features: np.ndarray) -> float:
    if "leaf_value" in node:
        return float(node["leaf_value"])

    feat_idx = node.get("split_feature", 0)
    val = features[feat_idx]
    threshold = node.get("threshold", 0.0)

    if val <= threshold:
        return evaluate_node(node["left_child"], features)
    else:
        return evaluate_node(node["right_child"], features)


def predict_booster(booster: Dict[str, Any], features: np.ndarray) -> float:
    total = 0.0
    for tree in booster.get("tree_info", []):
        total += evaluate_node(tree["tree_structure"], features)
    return total


def dcg_at_k(r: List[int], k: int) -> float:
    r = np.asarray(r, dtype=float)[:k]
    if r.size == 0:
        return 0.0
    return float(np.sum((np.power(2, r) - 1.0) / np.log2(np.arange(2, r.size + 2))))


def ndcg_at_k(r: List[int], k: int) -> float:
    dcg_val = dcg_at_k(r, k)
    ideal_r = sorted(r, reverse=True)
    idcg_val = dcg_at_k(ideal_r, k)
    if idcg_val == 0.0:
        return 1.0 if dcg_val == 0.0 else 0.0
    return float(dcg_val / idcg_val)


def precision_at_k(r: List[int], k: int, threshold: int = 3) -> float:
    r_k = r[:k]
    if not r_k:
        return 0.0
    relevant = sum(1 for val in r_k if val >= threshold)
    return float(relevant / len(r_k))


def recall_at_k(r: List[int], k: int, threshold: int = 3) -> float:
    total_relevant = sum(1 for val in r if val >= threshold)
    if total_relevant == 0:
        return 1.0
    r_k = r[:k]
    relevant_in_k = sum(1 for val in r_k if val >= threshold)
    return float(relevant_in_k / total_relevant)


def average_precision_at_k(r: List[int], k: int, threshold: int = 3) -> float:
    r_k = r[:k]
    score = 0.0
    num_hits = 0
    for i, val in enumerate(r_k):
        if val >= threshold:
            num_hits += 1
            score += num_hits / (i + 1.0)
    total_relevant = sum(1 for val in r if val >= threshold)
    if total_relevant == 0:
        return 1.0
    return float(score / min(total_relevant, k))


def reciprocal_rank(r: List[int], threshold: int = 3) -> float:
    for i, val in enumerate(r):
        if val >= threshold:
            return float(1.0 / (i + 1.0))
    return 0.0


def evaluate_ranking(
    dataset_path: str,
    model_json_path: str = "ml/models/active_model.json",
    output_path: str = "ml/models/evaluation_results.json"
) -> Dict[str, Any]:
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_rows = data.get("test", [])
    if not test_rows:
        print("Warning: Test split empty, evaluating on validation split.")
        test_rows = data.get("validation", [])

    # Group test items by queryId
    groups_map: Dict[str, List[Dict[str, Any]]] = {}
    for r in test_rows:
        qid = r["queryId"]
        if qid not in groups_map:
            groups_map[qid] = []
        groups_map[qid].append(r)

    # Load model JSON
    if not os.path.exists(model_json_path):
        raise FileNotFoundError(f"Model artifact not found: {model_json_path}")

    with open(model_json_path, "r", encoding="utf-8") as f:
        booster = json.load(f)

    ml_ndcg3_list, ml_ndcg5_list, ml_ndcg10_list = [], [], []
    ml_map10_list, ml_mrr_list = [], []
    ml_prec5_list, ml_rec5_list = [], []

    base_ndcg10_list = []

    for qid, qrows in groups_map.items():
        if len(qrows) < 2:
            continue

        X_q = np.array([item["featureVector"] for item in qrows], dtype=np.float32)
        y_q = [item["label"] for item in qrows]

        # ML Predictions using Booster JSON
        ml_scores = [predict_booster(booster, x) for x in X_q]
        ml_sorted_indices = np.argsort(-np.array(ml_scores))
        ml_ranked_labels = [y_q[idx] for idx in ml_sorted_indices]

        # Baseline Ranker: heuristic based on skill gap (feat 0, 2) and quality (feat 26)
        base_scores = X_q[:, 0] * 0.4 + X_q[:, 2] * 0.3 + X_q[:, 26] * 0.3
        base_sorted_indices = np.argsort(-base_scores)
        base_ranked_labels = [y_q[idx] for idx in base_sorted_indices]

        # Compute Metrics
        ml_ndcg3_list.append(ndcg_at_k(ml_ranked_labels, 3))
        ml_ndcg5_list.append(ndcg_at_k(ml_ranked_labels, 5))
        ml_ndcg10_list.append(ndcg_at_k(ml_ranked_labels, 10))
        ml_map10_list.append(average_precision_at_k(ml_ranked_labels, 10))
        ml_mrr_list.append(reciprocal_rank(ml_ranked_labels))
        ml_prec5_list.append(precision_at_k(ml_ranked_labels, 5))
        ml_rec5_list.append(recall_at_k(ml_ranked_labels, 5))

        base_ndcg10_list.append(ndcg_at_k(base_ranked_labels, 10))

    avg_ml_ndcg10 = float(np.mean(ml_ndcg10_list)) if ml_ndcg10_list else 0.0
    avg_base_ndcg10 = float(np.mean(base_ndcg10_list)) if base_ndcg10_list else 0.0
    improvement = ((avg_ml_ndcg10 - avg_base_ndcg10) / max(0.001, avg_base_ndcg10)) * 100.0

    metrics = {
        "evaluationDate": data.get("metadata", {}).get("datasetVersion", "test"),
        "totalEvaluatedQueries": len(ml_ndcg10_list),
        "ndcgAt3": round(float(np.mean(ml_ndcg3_list)), 4),
        "ndcgAt5": round(float(np.mean(ml_ndcg5_list)), 4),
        "ndcgAt10": round(avg_ml_ndcg10, 4),
        "mapAt10": round(float(np.mean(ml_map10_list)), 4),
        "mrr": round(float(np.mean(ml_mrr_list)), 4),
        "precisionAt5": round(float(np.mean(ml_prec5_list)), 4),
        "recallAt5": round(float(np.mean(ml_rec5_list)), 4),
        "baselineComparison": {
            "baselineNdcgAt10": round(avg_base_ndcg10, 4),
            "mlNdcgAt10": round(avg_ml_ndcg10, 4),
            "improvementPercentage": round(improvement, 2),
        },
    }

    print("\n=======================================================")
    print("         OFFLINE RECOMMENDATION EVALUATION RESULTS     ")
    print("=======================================================")
    print(f"Evaluated Query Groups : {metrics['totalEvaluatedQueries']}")
    print(f"NDCG@3                 : {metrics['ndcgAt3']:.4f}")
    print(f"NDCG@5                 : {metrics['ndcgAt5']:.4f}")
    print(f"NDCG@10                : {metrics['ndcgAt10']:.4f}")
    print(f"MAP@10                 : {metrics['mapAt10']:.4f}")
    print(f"MRR                    : {metrics['mrr']:.4f}")
    print(f"Precision@5            : {metrics['precisionAt5']:.4f}")
    print(f"Recall@5               : {metrics['recallAt5']:.4f}")
    print(f"Baseline NDCG@10       : {metrics['baselineComparison']['baselineNdcgAt10']:.4f}")
    print(f"ML Improvement vs Base : {metrics['baselineComparison']['improvementPercentage']:+.2f}%")
    print("=======================================================\n")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Booster Model on Test Split")
    parser.add_argument("--dataset_path", type=str, default="ml/data/latest_dataset.json", help="Path to dataset JSON")
    parser.add_argument("--model_path", type=str, default="ml/models/active_model.json", help="Path to model JSON")
    parser.add_argument("--output_path", type=str, default="ml/models/evaluation_results.json", help="Output metrics path")
    args = parser.parse_args()

    evaluate_ranking(
        dataset_path=args.dataset_path,
        model_json_path=args.model_path,
        output_path=args.output_path,
    )
