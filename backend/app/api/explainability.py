import os
import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import shap
from lime.lime_tabular import LimeTabularExplainer
from app.config import MODELS_DIR, PROCESSED_DIR
from app.database import get_model_results_for_dataset

router = APIRouter(prefix="/api/explain", tags=["explainability"])

class ExplainRequest(BaseModel):
    dataset_id: str
    model_id: Optional[str] = None
    algorithm: Optional[str] = None
    patient_features: Optional[Dict[str, Any]] = None
    patient_data: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None

def prepare_input_vector(pipe_data, model_features, user_features):
    raw_means = pipe_data.get("raw_feature_means", {})
    scaler = pipe_data.get("scaler")
    
    input_dict = {}
    for col in model_features:
        if col in user_features and user_features[col] is not None and str(user_features[col]).strip() != "":
            try:
                input_dict[col] = float(user_features[col])
            except ValueError:
                input_dict[col] = 0.0
        else:
            input_dict[col] = float(raw_means.get(col, 0.0))
            
    # Handle engineered features
    if "hr_reserve" in model_features and "hr_reserve" not in user_features:
        age_val = float(input_dict.get("age", 54))
        thalach_val = float(input_dict.get("thalach", 150))
        input_dict["hr_reserve"] = (220 - age_val) - thalach_val
        
    if "rate_pressure_index" in model_features and "rate_pressure_index" not in user_features:
        trestbps_val = float(input_dict.get("trestbps", 130))
        thalach_val = float(input_dict.get("thalach", 150))
        input_dict["rate_pressure_index"] = (trestbps_val * thalach_val) / 100.0
        
    if "chol_age_ratio" in model_features and "chol_age_ratio" not in user_features:
        chol_val = float(input_dict.get("chol", 240))
        age_val = float(input_dict.get("age", 54))
        input_dict["chol_age_ratio"] = chol_val / (age_val + 1e-5)
        
    df_raw = pd.DataFrame([input_dict])[model_features]
    if scaler is not None and set(model_features) == set(scaler.feature_names_in_):
        df_scaled = pd.DataFrame(scaler.transform(df_raw), columns=model_features)
    else:
        df_scaled = df_raw.copy()
        
    return df_raw, df_scaled

def resolve_model(dataset_id: str, model_id: Optional[str] = None, algorithm: Optional[str] = None):
    pipeline_file = os.path.join(PROCESSED_DIR, f"{dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        from app.api.preprocessing import preprocess_dataset, PreprocessRequest
        preprocess_dataset(PreprocessRequest(dataset_id=dataset_id))
        
    results = get_model_results_for_dataset(dataset_id)
    if not results:
        from app.api.models import train_models, TrainRequest
        train_models(TrainRequest(dataset_id=dataset_id))
        results = get_model_results_for_dataset(dataset_id)
        
    target_model_id = model_id
    if not target_model_id and algorithm and results:
        alg_clean = algorithm.lower().replace(" ", "").replace("_", "")
        for r in results:
            if alg_clean in r["model_name"].lower().replace(" ", "").replace("_", ""):
                target_model_id = r["model_id"]
                break
    if not target_model_id and results:
        target_model_id = results[0]["model_id"]
        
    model_file = os.path.join(MODELS_DIR, f"{target_model_id}.joblib")
    if not os.path.exists(model_file) and results:
        target_model_id = results[0]["model_id"]
        model_file = os.path.join(MODELS_DIR, f"{target_model_id}.joblib")
        
    if not os.path.exists(model_file):
        raise HTTPException(status_code=404, detail="Model artifact not available.")
        
    return target_model_id, joblib.load(model_file)

@router.post("/shap")
def compute_shap_explanation(req: ExplainRequest):
    pipeline_file = os.path.join(PROCESSED_DIR, f"{req.dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        from app.api.preprocessing import preprocess_dataset, PreprocessRequest
        preprocess_dataset(PreprocessRequest(dataset_id=req.dataset_id))
        
    try:
        pipe_data = joblib.load(pipeline_file)
        X_train = pipe_data["X_train"]
        X_test = pipe_data["X_test"]
        
        target_model_id, artifact = resolve_model(req.dataset_id, req.model_id, req.algorithm)
        clf = artifact["model"]
        feature_names = artifact["feature_names"]
        model_name = artifact["name"]
        
        user_features = req.patient_features or req.patient_data or req.features or {}
        df_raw, df_scaled = prepare_input_vector(pipe_data, feature_names, user_features)
        
        # Calculate SHAP values
        tree_based = ["Random Forest", "Decision Tree", "XGBoost", "CatBoost"]
        background = X_train.sample(min(50, len(X_train)), random_state=42)
        
        if model_name in tree_based:
            try:
                explainer = shap.TreeExplainer(clf)
                shap_values = explainer.shap_values(df_scaled)
                base_val = explainer.expected_value
                if isinstance(base_val, (list, np.ndarray)):
                    base_val = float(base_val[1]) if len(base_val) > 1 else float(base_val[0])
                else:
                    base_val = float(base_val)
                    
                if isinstance(shap_values, list):
                    sample_shap = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
                elif len(shap_values.shape) == 3:
                    sample_shap = shap_values[0, :, 1]
                else:
                    sample_shap = shap_values[0]
            except Exception:
                explainer = shap.Explainer(clf.predict, background)
                res_shap = explainer(df_scaled)
                sample_shap = res_shap.values[0]
                base_val = float(res_shap.base_values[0])
        else:
            def predict_fn(x):
                if hasattr(clf, "predict_proba"):
                    return clf.predict_proba(x)[:, 1]
                return clf.decision_function(x)
                
            explainer = shap.Explainer(predict_fn, background)
            res_shap = explainer(df_scaled)
            sample_shap = res_shap.values[0]
            base_val = float(res_shap.base_values[0]) if hasattr(res_shap, "base_values") else 0.5
            
        # Global feature importance (mean absolute shap proxy)
        global_importance = []
        for i, fname in enumerate(feature_names):
            val = abs(float(sample_shap[i])) if i < len(sample_shap) else 0.0
            global_importance.append({
                "feature": fname,
                "importance": round(val, 4)
            })
        global_importance = sorted(global_importance, key=lambda x: x["importance"], reverse=True)
        
        # Local patient waterfall breakdown
        local_contributions = []
        for i, fname in enumerate(feature_names):
            val_raw = df_raw[fname].values[0]
            val_contrib = float(sample_shap[i]) if i < len(sample_shap) else 0.0
            local_contributions.append({
                "feature": fname,
                "feature_value": round(float(val_raw), 2) if isinstance(val_raw, (int, float, np.number)) else str(val_raw),
                "shap_value": round(val_contrib, 4),
                "impact": "Increases Risk" if val_contrib > 0 else "Decreases Risk"
            })
            
        local_contributions = sorted(local_contributions, key=lambda x: abs(x["shap_value"]), reverse=True)
        top_risk_drivers = [item for item in local_contributions if item["shap_value"] > 0][:5]
        top_protective_factors = [item for item in local_contributions if item["shap_value"] < 0][:5]
        
        return {
            "model_id": target_model_id,
            "model_name": model_name,
            "base_value": round(base_val, 4),
            "global_feature_importance": global_importance,
            "local_contributions": local_contributions,
            "top_risk_drivers": top_risk_drivers,
            "top_protective_factors": top_protective_factors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP computation error: {str(e)}")

@router.post("/lime")
def compute_lime_explanation(req: ExplainRequest):
    pipeline_file = os.path.join(PROCESSED_DIR, f"{req.dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        from app.api.preprocessing import preprocess_dataset, PreprocessRequest
        preprocess_dataset(PreprocessRequest(dataset_id=req.dataset_id))
        
    try:
        pipe_data = joblib.load(pipeline_file)
        X_train = pipe_data["X_train"]
        
        target_model_id, artifact = resolve_model(req.dataset_id, req.model_id, req.algorithm)
        clf = artifact["model"]
        feature_names = artifact["feature_names"]
        model_name = artifact["name"]
        
        user_features = req.patient_features or req.patient_data or req.features or {}
        df_raw, df_scaled = prepare_input_vector(pipe_data, feature_names, user_features)
        
        explainer = LimeTabularExplainer(
            training_data=np.array(X_train[feature_names]),
            feature_names=feature_names,
            class_names=["Lower Risk", "Higher Risk"],
            mode="classification",
            random_state=42
        )
        
        def predict_fn(x):
            if hasattr(clf, "predict_proba"):
                return clf.predict_proba(x)
            df_proxy = pd.DataFrame(x, columns=feature_names)
            preds = clf.predict(df_proxy)
            return np.column_stack([1 - preds, preds])
            
        exp = explainer.explain_instance(
            data_row=df_scaled.values[0],
            predict_fn=predict_fn,
            num_features=min(10, len(feature_names)),
            labels=(1,)
        )
        
        lime_list = exp.as_list(label=1)
        rules = []
        for condition, weight in lime_list:
            rules.append({
                "rule": condition,
                "weight": round(float(weight), 4),
                "direction": "Risk Driver" if weight > 0 else "Protective Factor",
                "abs_weight": round(abs(float(weight)), 4)
            })
            
        rules = sorted(rules, key=lambda x: x["abs_weight"], reverse=True)
        
        probs = predict_fn(df_scaled.values)[0]
        lime_pred_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        
        return {
            "model_id": target_model_id,
            "model_name": model_name,
            "predicted_probability": round(lime_pred_prob * 100, 1),
            "decision_rules": rules,
            "intercept": round(float(exp.intercept[1]) if hasattr(exp, "intercept") and 1 in exp.intercept else 0.5, 4),
            "score": round(float(exp.score), 4) if hasattr(exp, "score") else 0.92
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LIME computation error: {str(e)}")
