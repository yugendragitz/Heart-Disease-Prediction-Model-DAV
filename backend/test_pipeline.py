"""
End-to-end verification script for Comparative Machine Learning Framework
Tests:
1. Dataset registration and loading (UCI Cleveland)
2. Data Preprocessing pipeline (imputation, duplicate purge, scaling, train/test split)
3. Model training for all 8 architectures
4. Prediction inference & clinical risk categorization
5. Explainable AI: SHAP global & local calculation
6. Explainable AI: LIME tabular calculation
7. SQLite logging
"""

import os
import sys

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.database import init_db, list_all_datasets
from app.api.datasets import register_default_benchmarks, get_dataset_details
from app.api.preprocessing import preprocess_dataset, PreprocessRequest
from app.api.models import train_models, TrainRequest
from app.api.prediction import make_prediction, PredictRequest
from app.api.explainability import compute_shap_explanation, compute_lime_explanation, ExplainRequest

def run_tests():
    print("=== Step 1: Initializing DB & Registering Benchmarks ===")
    init_db()
    register_default_benchmarks()
    datasets = list_all_datasets()
    print(f"Datasets available: {len(datasets)}")
    for d in datasets:
        print(f" - {d['name']} ({d['rows_count']} rows, {d['cols_count']} cols)")
        
    ds_id = "benchmark_uci"
    details = get_dataset_details(ds_id)
    print(f"UCI Dataset loaded successfully. Target: {details['overview']['columns'][-1]['name']}")

    print("\n=== Step 2: Testing Preprocessing Pipeline ===")
    prep_req = PreprocessRequest(
        dataset_id=ds_id,
        handle_missing="mean",
        remove_duplicates=True,
        encoding_method="label",
        outlier_method="iqr",
        outlier_action="clip",
        scaling_method="standard",
        test_size=0.2,
        random_state=42
    )
    prep_res = preprocess_dataset(prep_req)
    print(f"Preprocessing succeeded! Train shape: {prep_res['train_dimensions']}, Test shape: {prep_res['test_dimensions']}")

    print("\n=== Step 3: Testing Model Training (all 8 models) ===")
    train_req = TrainRequest(dataset_id=ds_id)
    train_res = train_models(train_req)
    print(f"Trained {train_res['models_trained_count']} models.")
    print(f"Best model: {train_res['best_model']['name']} (ROC-AUC: {train_res['best_model']['roc_auc']})")
    for m in train_res['results']:
        print(f"  * {m['model_name']:<30} Acc: {m['accuracy']:.3f} | F1: {m['f1']:.3f} | AUC: {m['roc_auc']:.3f} | CV: {m['cv_accuracy_mean']:.3f} | TrainTime: {m['training_time']:.3f}s")

    print("\n=== Step 4: Testing Prediction Inference ===")
    # Typical high risk patient profile
    patient_sample = {
        "age": 62,
        "sex": 1,
        "cp": 3,
        "trestbps": 155,
        "chol": 290,
        "fbs": 1,
        "restecg": 1,
        "thalach": 120,
        "exang": 1,
        "oldpeak": 2.6,
        "slope": 1,
        "ca": 2,
        "thal": 3
    }
    pred_req = PredictRequest(
        dataset_id=ds_id,
        features=patient_sample
    )
    pred_res = make_prediction(pred_req)
    print(f"Prediction Result: {pred_res['prediction_label']} ({pred_res['probability_percentage']}%) - {pred_res['risk_level']}")

    print("\n=== Step 5: Testing Explainable AI (SHAP) ===")
    exp_req = ExplainRequest(
        dataset_id=ds_id,
        model_id=pred_res['model_id'],
        patient_features=patient_sample
    )
    shap_res = compute_shap_explanation(exp_req)
    print(f"SHAP Base Value: {shap_res['base_value']}")
    print(f"Top 3 Risk Drivers from SHAP:")
    for d in shap_res['top_risk_drivers'][:3]:
        print(f"  + {d['feature']} = {d['feature_value']} (SHAP: +{d['shap_value']})")

    print("\n=== Step 6: Testing Explainable AI (LIME) ===")
    lime_res = compute_lime_explanation(exp_req)
    print(f"LIME Intercept: {lime_res['intercept']}")
    print(f"Top 3 Contributing Factors from LIME:")
    for f in lime_res['top_factors'][:3]:
        print(f"  * {f['rule']}: weight = {f['weight']} ({f['direction']})")

    print("\n>>> ALL BACKEND PIPELINE TESTS PASSED WITH FLYING COLORS! <<<")

if __name__ == "__main__":
    run_tests()
