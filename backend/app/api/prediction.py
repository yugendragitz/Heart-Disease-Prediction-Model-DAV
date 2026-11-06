import os
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.config import MODELS_DIR, PROCESSED_DIR
from app.database import log_prediction, get_prediction_history, get_model_results_for_dataset

router = APIRouter(prefix="/api/predict", tags=["prediction"])

class PredictRequest(BaseModel):
    dataset_id: str
    model_id: Optional[str] = None
    algorithm: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    patient_data: Optional[Dict[str, Any]] = None

@router.post("")
def make_prediction(req: PredictRequest):
    user_features = req.features or req.patient_data or {}
    
    pipeline_file = os.path.join(PROCESSED_DIR, f"{req.dataset_id}_pipeline.joblib")
    if not os.path.exists(pipeline_file):
        from app.api.preprocessing import preprocess_dataset, PreprocessRequest
        preprocess_dataset(PreprocessRequest(dataset_id=req.dataset_id))
        
    try:
        pipe = joblib.load(pipeline_file)
        feature_columns = pipe["feature_columns"]
        scaler = pipe.get("scaler")
        raw_means = pipe.get("raw_feature_means", {})
        
        # Identify model to use
        results = get_model_results_for_dataset(req.dataset_id)
        if not results:
            from app.api.models import train_models, TrainRequest
            train_models(TrainRequest(dataset_id=req.dataset_id))
            results = get_model_results_for_dataset(req.dataset_id)
            
        target_model_id = req.model_id
        if not target_model_id and req.algorithm and results:
            for r in results:
                if req.algorithm.lower().replace(" ", "").replace("_", "") in r["model_name"].lower().replace(" ", "").replace("_", ""):
                    target_model_id = r["model_id"]
                    break
        if not target_model_id and results:
            target_model_id = results[0]["model_id"]
            
        model_file = os.path.join(MODELS_DIR, f"{target_model_id}.joblib")
        if not os.path.exists(model_file):
            if results:
                target_model_id = results[0]["model_id"]
                model_file = os.path.join(MODELS_DIR, f"{target_model_id}.joblib")
            else:
                raise HTTPException(status_code=404, detail="No model artifact available.")
            
        model_artifact = joblib.load(model_file)
        clf = model_artifact["model"]
        model_name = model_artifact["name"]
        model_feature_names = model_artifact["feature_names"]
        
        # Build patient input DataFrame with default fallbacks for missing values
        input_data = {}
        for col in model_feature_names:
            if col in user_features and user_features[col] is not None and str(user_features[col]).strip() != "":
                try:
                    input_data[col] = float(user_features[col])
                except ValueError:
                    input_data[col] = str(user_features[col])
            else:
                input_data[col] = raw_means.get(col, 0.0)
                
        # Handle engineered features if present in model
        if "hr_reserve" in model_feature_names and "hr_reserve" not in req.features:
            age_val = float(input_data.get("age", 54))
            thalach_val = float(input_data.get("thalach", 150))
            input_data["hr_reserve"] = (220 - age_val) - thalach_val
            
        if "rate_pressure_index" in model_feature_names and "rate_pressure_index" not in req.features:
            trestbps_val = float(input_data.get("trestbps", 130))
            thalach_val = float(input_data.get("thalach", 150))
            input_data["rate_pressure_index"] = (trestbps_val * thalach_val) / 100.0
            
        if "chol_age_ratio" in model_feature_names and "chol_age_ratio" not in req.features:
            chol_val = float(input_data.get("chol", 240))
            age_val = float(input_data.get("age", 54))
            input_data["chol_age_ratio"] = chol_val / (age_val + 1e-5)
            
        df_input = pd.DataFrame([input_data])[model_feature_names]
        
        # Apply scaling if standard/minmax scaler was used
        if scaler is not None and set(model_feature_names) == set(scaler.feature_names_in_):
            df_scaled = pd.DataFrame(scaler.transform(df_input), columns=model_feature_names)
        else:
            df_scaled = df_input.copy()
            
        # Inference
        pred_class = int(clf.predict(df_scaled)[0])
        
        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(df_scaled)[0]
            prob_risk = float(probs[1]) if len(probs) > 1 else float(probs[0])
        else:
            prob_risk = 0.85 if pred_class == 1 else 0.15
            
        prob_percentage = round(prob_risk * 100, 1)
        
        # Clinical Risk Stratification
        if prob_percentage >= 65:
            risk_level = "High Predicted Risk"
            prediction_label = "Higher predicted risk"
        elif prob_percentage >= 35:
            risk_level = "Moderate Predicted Risk"
            prediction_label = "Moderate predicted risk"
        else:
            risk_level = "Low Predicted Risk"
            prediction_label = "Lower predicted risk"
            
        # Log to database
        pred_id = f"pred_{uuid.uuid4().hex[:10]}"
        log_prediction({
            "id": pred_id,
            "dataset_id": req.dataset_id,
            "model_id": target_model_id,
            "model_name": model_name,
            "input_features": user_features,
            "prediction_class": pred_class,
            "prediction_label": prediction_label,
            "probability": prob_percentage,
            "risk_level": risk_level
        })
        
        return {
            "prediction_id": pred_id,
            "dataset_id": req.dataset_id,
            "model_id": target_model_id,
            "model_name": model_name,
            "prediction_class": pred_class,
            "prediction_label": prediction_label,
            "probability_percentage": prob_percentage,
            "risk_level": risk_level,
            "disclaimer": "Academic & Research Decision Support: This system generates machine learning risk probabilities for educational evaluation and is not a medical diagnosis.",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/history")
def get_history(limit: int = 25):
    hist = get_prediction_history(limit=limit)
    return {"history": hist}
