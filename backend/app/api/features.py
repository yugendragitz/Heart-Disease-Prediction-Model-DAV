import os
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from sklearn.feature_selection import mutual_info_classif, SelectKBest, f_classif, RFE
from sklearn.linear_model import LogisticRegression
from app.config import PROCESSED_DIR
from app.database import get_dataset_by_id
from app.api.preprocessing import preprocess_dataset, PreprocessRequest

router = APIRouter(prefix="/api/features", tags=["features"])

class EngineerRequest(BaseModel):
    dataset_id: str
    create_clinical_ratios: Optional[bool] = True
    include_ratios: Optional[bool] = None
    apply_log_transform: Optional[bool] = False
    interaction_terms: Optional[bool] = False

class SelectionRequest(BaseModel):
    dataset_id: str
    method: Optional[str] = "mutual_info"  # "correlation", "mutual_info", "select_k_best", "rfe"
    k_features: Optional[int] = 8
    k: Optional[int] = None

def ensure_pipeline_exists(dataset_id: str):
    pipeline_file = os.path.join(PROCESSED_DIR, f"{dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        req = PreprocessRequest(
            dataset_id=dataset_id,
            handle_missing="median",
            outlier_method="iqr",
            scaling_method="standard"
        )
        preprocess_dataset(req)
    return os.path.join(PROCESSED_DIR, f"{dataset_id}_pipeline.joblib")

@router.post("/engineer")
def engineer_features(req: EngineerRequest):
    pipeline_file = ensure_pipeline_exists(req.dataset_id)
        
    try:
        data = joblib.load(pipeline_file)
        X_train = data["X_train"].copy()
        X_test = data["X_test"].copy()
        
        initial_features = list(X_train.columns)
        new_features_added = []
        
        create_ratios = req.create_clinical_ratios if req.include_ratios is None else req.include_ratios
        
        # 1. Clinical Ratios & Domain-Specific Indices
        if create_ratios:
            # Heart rate reserve & cardiac workload for UCI / Kaggle datasets
            if "age" in X_train.columns and "thalach" in X_train.columns:
                X_train["hr_reserve"] = (220 - X_train["age"]) - X_train["thalach"]
                X_test["hr_reserve"] = (220 - X_test["age"]) - X_test["thalach"]
                new_features_added.append("hr_reserve")
                
            if "trestbps" in X_train.columns and "thalach" in X_train.columns:
                # Rate-Pressure Product / Double Product index
                X_train["rate_pressure_index"] = (X_train["trestbps"] * X_train["thalach"]) / 100.0
                X_test["rate_pressure_index"] = (X_test["trestbps"] * X_test["thalach"]) / 100.0
                new_features_added.append("rate_pressure_index")
                
            if "chol" in X_train.columns and "age" in X_train.columns:
                # Cholesterol-to-Age risk ratio
                X_train["chol_age_ratio"] = X_train["chol"] / (X_train["age"] + 1e-5)
                X_test["chol_age_ratio"] = X_test["chol"] / (X_test["age"] + 1e-5)
                new_features_added.append("chol_age_ratio")
                
            # Cardiac Stress Index (oldpeak * (exang + 1))
            if "oldpeak" in X_train.columns and "exang" in X_train.columns:
                X_train["cardiac_stress_index"] = X_train["oldpeak"] * (X_train["exang"] + 1.0)
                X_test["cardiac_stress_index"] = X_test["oldpeak"] * (X_test["exang"] + 1.0)
                new_features_added.append("cardiac_stress_index")
                
            # For CVD dataset (height/weight/ap_hi/ap_lo)
            if "weight" in X_train.columns and "height" in X_train.columns:
                X_train["bmi"] = X_train["weight"] / ((X_train["height"] / 100.0) ** 2)
                X_test["bmi"] = X_test["weight"] / ((X_test["height"] / 100.0) ** 2)
                new_features_added.append("bmi")
                
            if "ap_hi" in X_train.columns and "ap_lo" in X_train.columns:
                X_train["map_pressure"] = (2 * X_train["ap_lo"] + X_train["ap_hi"]) / 3.0
                X_test["map_pressure"] = (2 * X_test["ap_lo"] + X_test["ap_hi"]) / 3.0
                new_features_added.append("map_pressure")
                
        if req.apply_log_transform:
            for col in ["chol", "oldpeak", "trestbps", "weight"]:
                if col in X_train.columns:
                    log_col = f"log_{col}"
                    X_train[log_col] = np.log1p(np.maximum(0, X_train[col]))
                    X_test[log_col] = np.log1p(np.maximum(0, X_test[col]))
                    new_features_added.append(log_col)
                    
        # Update pipeline data
        data["X_train"] = X_train
        data["X_test"] = X_test
        data["feature_columns"] = list(X_train.columns)
        joblib.dump(data, pipeline_file)
        
        return {
            "status": "success",
            "message": f"Feature engineering complete. Added {len(new_features_added)} new features.",
            "initial_feature_count": len(initial_features),
            "new_feature_count": len(X_train.columns),
            "new_shape": [len(X_train), len(X_train.columns)],
            "initial_shape": [len(X_train), len(initial_features)],
            "added_features": new_features_added,
            "all_features": list(X_train.columns),
            "sample_engineered": X_train.head(5).round(3).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature engineering error: {str(e)}")

@router.post("/select")
def select_features(req: SelectionRequest):
    pipeline_file = ensure_pipeline_exists(req.dataset_id)
        
    try:
        data = joblib.load(pipeline_file)
        X_train = data["X_train"]
        y_train = data["y_train"]
        feature_names = list(X_train.columns)
        
        k_val = req.k if req.k is not None else (req.k_features or 8)
        k = max(1, min(k_val, len(feature_names)))
        
        # 1. Correlation-based selection (|r|)
        corr_scores = {}
        for col in feature_names:
            c = abs(np.corrcoef(X_train[col], y_train)[0, 1])
            corr_scores[col] = 0.0 if np.isnan(c) else float(c)
            
        corr_ranked = [
            {"feature": col, "score": round(corr_scores[col], 4)}
            for col in sorted(feature_names, key=lambda f: corr_scores[f], reverse=True)
        ]
            
        # 2. Mutual Information Gain
        mi = mutual_info_classif(X_train, y_train, random_state=42)
        mi_scores = {col: float(mi[i]) for i, col in enumerate(feature_names)}
        mi_ranked = [
            {"feature": col, "score": round(mi_scores[col], 4)}
            for col in sorted(feature_names, key=lambda f: mi_scores[f], reverse=True)
        ]
        
        # 3. SelectKBest (ANOVA F-value)
        f_selector = SelectKBest(f_classif, k="all")
        f_selector.fit(X_train, y_train)
        f_scores_arr = np.nan_to_num(f_selector.scores_, 0.0)
        f_scores = {col: float(f_scores_arr[i]) for i, col in enumerate(feature_names)}
        f_ranked = [
            {"feature": col, "score": round(f_scores[col], 2)}
            for col in sorted(feature_names, key=lambda f: f_scores[f], reverse=True)
        ]
        
        # 4. RFE with Logistic Regression
        rfe_model = LogisticRegression(max_iter=1000, random_state=42)
        rfe = RFE(estimator=rfe_model, n_features_to_select=k)
        rfe.fit(X_train, y_train)
        # Convert ranking to score (higher score = better rank, rank 1 gets highest)
        max_rank = max(rfe.ranking_)
        rfe_scores = {col: float(max_rank - rfe.ranking_[i] + 1) for i, col in enumerate(feature_names)}
        rfe_ranked = [
            {"feature": col, "score": round(rfe_scores[col], 2), "rank": int(rfe.ranking_[i])}
            for i, col in enumerate(feature_names)
        ]
        rfe_ranked = sorted(rfe_ranked, key=lambda x: x["score"], reverse=True)
        
        # Consensus: features appearing in the top 50% across all 4 methods
        top_half_n = max(3, len(feature_names) // 2)
        top_corr = set([r["feature"] for r in corr_ranked[:top_half_n]])
        top_mi = set([r["feature"] for r in mi_ranked[:top_half_n]])
        top_f = set([r["feature"] for r in f_ranked[:top_half_n]])
        top_rfe = set([r["feature"] for r in rfe_ranked[:top_half_n]])
        
        consensus = list(top_corr.intersection(top_mi).intersection(top_f).intersection(top_rfe))
        if not consensus:
            # Fallback to intersection of top 3 methods
            consensus = list((top_corr & top_mi) | (top_mi & top_f))
        if not consensus:
            consensus = [r["feature"] for r in mi_ranked[:4]]
            
        rankings_dict = {
            "mutual_info": mi_ranked,
            "select_k_best": f_ranked,
            "correlation": corr_ranked,
            "rfe": rfe_ranked
        }
        
        chosen_method = req.method if req.method in rankings_dict else "mutual_info"
        selected_features = [item["feature"] for item in rankings_dict[chosen_method][:k]]
        
        # Save active feature selection into pipeline
        data["selected_features"] = selected_features
        joblib.dump(data, pipeline_file)
        
        return {
            "status": "success",
            "method_used": chosen_method,
            "k_selected": k,
            "total_features": len(feature_names),
            "selected_features": selected_features,
            "rankings": rankings_dict,
            "consensus_features": consensus
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature selection error: {str(e)}")
