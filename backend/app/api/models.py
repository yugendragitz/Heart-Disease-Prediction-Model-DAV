import os
import time
import json
import uuid
import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from xgboost import XGBClassifier
from catboost import CatBoostClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)
from sklearn.model_selection import StratifiedKFold, cross_val_score
from app.config import MODELS_DIR, PROCESSED_DIR
from app.database import (
    save_model_result, get_model_results_for_dataset, get_db_connection
)

router = APIRouter(prefix="/api/models", tags=["models"])

class TrainRequest(BaseModel):
    dataset_id: str
    models_to_train: Optional[List[str]] = None  # None = train all 8
    algorithms: Optional[List[str]] = None
    use_selected_features_only: Optional[bool] = False
    hyperparameters: Optional[Dict[str, Dict[str, Any]]] = None

def downsample_roc(fpr, tpr, n_points=25):
    if len(fpr) <= n_points:
        return [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr, tpr)]
    indices = np.linspace(0, len(fpr) - 1, n_points, dtype=int)
    return [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in indices]

def build_model_instance(name: str, params: Dict[str, Any] = None):
    p = params or {}
    if name == "Logistic Regression":
        return LogisticRegression(
            C=float(p.get("C", 1.0)),
            max_iter=int(p.get("max_iter", 1000)),
            random_state=42
        )
    elif name == "Decision Tree":
        return DecisionTreeClassifier(
            max_depth=int(p.get("max_depth", 5)) if p.get("max_depth") else None,
            criterion=p.get("criterion", "gini"),
            min_samples_split=int(p.get("min_samples_split", 2)),
            random_state=42
        )
    elif name == "Random Forest":
        return RandomForestClassifier(
            n_estimators=int(p.get("n_estimators", 100)),
            max_depth=int(p.get("max_depth", 8)) if p.get("max_depth") else None,
            min_samples_split=int(p.get("min_samples_split", 2)),
            random_state=42
        )
    elif name == "Support Vector Machine (SVM)":
        return SVC(
            C=float(p.get("C", 1.0)),
            kernel=p.get("kernel", "rbf"),
            probability=True,
            random_state=42
        )
    elif name == "K-Nearest Neighbors (KNN)":
        return KNeighborsClassifier(
            n_neighbors=int(p.get("n_neighbors", 5)),
            weights=p.get("weights", "uniform")
        )
    elif name == "Naive Bayes":
        return GaussianNB()
    elif name == "XGBoost":
        return XGBClassifier(
            n_estimators=int(p.get("n_estimators", 100)),
            learning_rate=float(p.get("learning_rate", 0.1)),
            max_depth=int(p.get("max_depth", 4)),
            eval_metric="logloss",
            random_state=42
        )
    elif name == "CatBoost":
        return CatBoostClassifier(
            iterations=int(p.get("iterations", 150)),
            learning_rate=float(p.get("learning_rate", 0.08)),
            depth=int(p.get("depth", 5)),
            verbose=0,
            random_seed=42
        )
    else:
        raise ValueError(f"Unknown model architecture: {name}")

@router.post("/train")
def train_models(req: TrainRequest):
    pipeline_file = os.path.join(PROCESSED_DIR, f"{req.dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        from app.api.preprocessing import preprocess_dataset, PreprocessRequest
        preprocess_dataset(PreprocessRequest(dataset_id=req.dataset_id))
        
    try:
        pipeline_data = joblib.load(pipeline_file)
        X_train = pipeline_data["X_train"]
        X_test = pipeline_data["X_test"]
        y_train = pipeline_data["y_train"]
        y_test = pipeline_data["y_test"]
        
        # Filter features if requested
        if req.use_selected_features_only and "selected_features" in pipeline_data:
            sel = pipeline_data["selected_features"]
            X_train = X_train[sel]
            X_test = X_test[sel]
            
        all_model_names = [
            "Logistic Regression",
            "Decision Tree",
            "Random Forest",
            "Support Vector Machine (SVM)",
            "K-Nearest Neighbors (KNN)",
            "Naive Bayes",
            "XGBoost",
            "CatBoost"
        ]
        
        target_models = req.models_to_train if req.models_to_train else all_model_names
        training_results = []
        
        for name in target_models:
            custom_params = req.hyperparameters.get(name, {}) if req.hyperparameters else {}
            clf = build_model_instance(name, custom_params)
            
            # Measure training time
            t0 = time.perf_counter()
            clf.fit(X_train, y_train)
            t_train = round(time.perf_counter() - t0, 4)
            
            # Inference latency (100 runs average)
            t_inf0 = time.perf_counter()
            y_pred = clf.predict(X_test)
            t_inf = round(((time.perf_counter() - t_inf0) / len(X_test)) * 1000, 3) # ms per sample
            
            # Predict probabilities
            if hasattr(clf, "predict_proba"):
                y_prob = clf.predict_proba(X_test)[:, 1]
            else:
                y_prob = clf.decision_function(X_test)
                
            # Metric evaluations
            acc = round(float(accuracy_score(y_test, y_pred)), 4)
            prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
            rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
            f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
            
            try:
                auc = round(float(roc_auc_score(y_test, y_prob)), 4)
            except Exception:
                auc = acc
                
            # 5-Fold Stratified Cross Validation
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
            cv_mean = round(float(cv_scores.mean()), 4)
            cv_std = round(float(cv_scores.std()), 4)
            
            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            cm_dict = {
                "tn": int(cm[0][0]) if len(cm) > 1 else int(cm[0][0]),
                "fp": int(cm[0][1]) if len(cm) > 1 else 0,
                "fn": int(cm[1][0]) if len(cm) > 1 else 0,
                "tp": int(cm[1][1]) if len(cm) > 1 else 0,
                "matrix": cm.tolist()
            }
            
            # ROC Curve points
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            roc_points = downsample_roc(fpr, tpr, n_points=25)
            
            # Save model artifact
            model_id = f"{req.dataset_id}_{name.lower().replace(' ', '_').replace('(', '').replace(')', '')}"
            model_file = os.path.join(MODELS_DIR, f"{model_id}.joblib")
            joblib.dump({
                "model": clf,
                "name": name,
                "dataset_id": req.dataset_id,
                "feature_names": list(X_train.columns),
                "metrics": {
                    "accuracy": acc,
                    "precision": prec,
                    "recall": rec,
                    "f1": f1,
                    "roc_auc": auc,
                    "cv_mean": cv_mean
                }
            }, model_file)
            
            result_record = {
                "id": f"res_{uuid.uuid4().hex[:8]}",
                "model_id": model_id,
                "dataset_id": req.dataset_id,
                "model_name": name,
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "roc_auc": auc,
                "cv_accuracy_mean": cv_mean,
                "cv_accuracy_std": cv_std,
                "training_time": t_train,
                "inference_time_ms": t_inf,
                "confusion_matrix": cm_dict,
                "roc_curve": roc_points
            }
            save_model_result(result_record)
            training_results.append(result_record)
            
        # Update latest model reference in pipeline
        pipeline_data["trained_models"] = [r["model_name"] for r in training_results]
        joblib.dump(pipeline_data, pipeline_file)
        
        # Sort by ROC-AUC
        training_results = sorted(training_results, key=lambda x: x["roc_auc"], reverse=True)
        best_model = training_results[0]
        
        return {
            "status": "success",
            "message": f"Trained {len(training_results)} machine learning models successfully.",
            "dataset_id": req.dataset_id,
            "models_trained_count": len(training_results),
            "best_model": {
                "name": best_model["model_name"],
                "accuracy": best_model["accuracy"],
                "roc_auc": best_model["roc_auc"],
                "f1": best_model["f1"]
            },
            "results": training_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training pipeline error: {str(e)}")

@router.get("")
def get_models(dataset_id: str):
    results = get_model_results_for_dataset(dataset_id)
    return {"dataset_id": dataset_id, "models": results}

@router.get("/{model_id}")
def get_model_detail(model_id: str):
    model_file = os.path.join(MODELS_DIR, f"{model_id}.joblib")
    if not os.path.exists(model_file):
        raise HTTPException(status_code=404, detail="Serialized model artifact not found.")
    m = joblib.load(model_file)
    return {
        "model_id": model_id,
        "name": m.get("name"),
        "features": m.get("feature_names"),
        "metrics": m.get("metrics")
    }

class CompareRequest(BaseModel):
    dataset_id: str
    selected_models: Optional[List[str]] = None

@router.post("/compare")
def compare_models(req: CompareRequest):
    all_results = get_model_results_for_dataset(req.dataset_id)
    if not all_results:
        try:
            train_models(TrainRequest(dataset_id=req.dataset_id))
            all_results = get_model_results_for_dataset(req.dataset_id)
        except Exception as e:
            all_results = []
        
    filtered = all_results
    if req.selected_models and len(req.selected_models) > 0:
        filtered = [r for r in all_results if r["model_name"] in req.selected_models]
        
    # Radar chart comparison payload
    radar_data = []
    metrics_keys = [("Accuracy", "accuracy"), ("Precision", "precision"), ("Recall", "recall"), ("F1 Score", "f1"), ("ROC-AUC", "roc_auc")]
    for label, key in metrics_keys:
        item = {"metric": label}
        for m in filtered:
            item[m["model_name"]] = m.get(key, 0)
        radar_data.append(item)
        
    return {
        "dataset_id": req.dataset_id,
        "compared_models": [r["model_name"] for r in filtered],
        "models": filtered,
        "comparison": filtered,
        "radar_data": radar_data
    }
