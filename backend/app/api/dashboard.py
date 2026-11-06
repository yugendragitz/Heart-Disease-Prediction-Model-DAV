import os
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.database import get_dataset_by_id, get_model_results_for_dataset, list_all_datasets

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/{dataset_id}")
def get_dashboard_data(
    dataset_id: str,
    min_age: Optional[int] = Query(None),
    max_age: Optional[int] = Query(None),
    sex_filter: Optional[int] = Query(None),
    target_filter: Optional[int] = Query(None)
):
    ds = get_dataset_by_id(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    filepath = ds["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
        
    try:
        df = pd.read_csv(filepath)
        target_col = ds.get("target_column") or "target"
        if target_col not in df.columns:
            target_col = df.columns[-1]
            
        # Apply demographic filters if provided
        filtered_df = df.copy()
        if "age" in filtered_df.columns:
            if min_age is not None:
                filtered_df = filtered_df[filtered_df["age"] >= min_age]
            if max_age is not None:
                filtered_df = filtered_df[filtered_df["age"] <= max_age]
                
        if "sex" in filtered_df.columns and sex_filter is not None:
            filtered_df = filtered_df[filtered_df["sex"] == sex_filter]
        elif "gender" in filtered_df.columns and sex_filter is not None:
            filtered_df = filtered_df[filtered_df["gender"] == sex_filter]
            
        if target_filter is not None and target_col in filtered_df.columns:
            filtered_df = filtered_df[filtered_df[target_col] == target_filter]
            
        # Overall Summary KPIs
        all_datasets = list_all_datasets()
        models = get_model_results_for_dataset(dataset_id)
        
        best_model = models[0] if models else None
        
        kpis = {
            "total_datasets": len(all_datasets),
            "total_records": len(df),
            "filtered_records": len(filtered_df),
            "features_count": len(df.columns) - (1 if target_col in df.columns else 0),
            "models_trained": len(models),
            "best_model_name": best_model["model_name"] if best_model else "Not Trained Yet",
            "best_roc_auc": best_model["roc_auc"] if best_model else 0.0,
            "best_accuracy": best_model["accuracy"] if best_model else 0.0,
            "best_cv_score": best_model["cv_accuracy_mean"] if best_model else 0.0
        }
        
        # Target Distribution
        target_dist = []
        if target_col in filtered_df.columns:
            counts = filtered_df[target_col].value_counts().to_dict()
            target_dist = [
                {"name": "Lower Risk (0)", "value": int(counts.get(0, 0)), "color": "#10b981"},
                {"name": "Higher Risk (1)", "value": int(counts.get(1, 0)), "color": "#f43f5e"}
            ]
            
        # Demographic: Age Distribution (10-year brackets)
        age_brackets = []
        if "age" in filtered_df.columns:
            bins = [20, 35, 45, 55, 65, 75, 90]
            labels = ["20-34", "35-44", "45-54", "55-64", "65-74", "75+"]
            filtered_df["age_group"] = pd.cut(filtered_df["age"], bins=bins, labels=labels, right=False)
            grouped = filtered_df.groupby(["age_group", target_col], observed=False).size().unstack(fill_value=0)
            for lbl in labels:
                if lbl in grouped.index:
                    age_brackets.append({
                        "bracket": lbl,
                        "lower_risk": int(grouped.loc[lbl].get(0, 0)),
                        "higher_risk": int(grouped.loc[lbl].get(1, 0))
                    })
                    
        # Sex breakdown
        sex_dist = []
        sex_col = "sex" if "sex" in filtered_df.columns else ("gender" if "gender" in filtered_df.columns else None)
        if sex_col:
            sc = filtered_df[sex_col].value_counts().to_dict()
            sex_dist = [
                {"name": "Female", "value": int(sc.get(0, 0)), "color": "#ec4899"},
                {"name": "Male", "value": int(sc.get(1, 0)), "color": "#3b82f6"}
            ]
            
        # Clinical parameters histograms (Cholesterol, Blood Pressure, Heart Rate)
        def compute_dist(col_name, n_bins=8):
            if col_name not in filtered_df.columns:
                return []
            vals = filtered_df[col_name].dropna()
            if vals.empty:
                return []
            counts, bin_edges = np.histogram(vals, bins=n_bins)
            res = []
            for i in range(len(counts)):
                res.append({
                    "range": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}",
                    "count": int(counts[i])
                })
            return res
            
        chol_dist = compute_dist("chol") or compute_dist("cholesterol")
        bp_dist = compute_dist("trestbps") or compute_dist("ap_hi")
        hr_dist = compute_dist("thalach")
        
        # Chest Pain Type distribution
        cp_dist = []
        if "cp" in filtered_df.columns:
            cp_labels = {0: "Typical Angina", 1: "Atypical Angina", 2: "Non-Anginal", 3: "Asymptomatic"}
            c_counts = filtered_df["cp"].value_counts().to_dict()
            for k, v in c_counts.items():
                cp_dist.append({
                    "type": cp_labels.get(int(k), f"Type {k}"),
                    "count": int(v)
                })
                
        return {
            "dataset_id": dataset_id,
            "kpis": kpis,
            "target_distribution": target_dist,
            "age_distribution": age_brackets,
            "sex_distribution": sex_dist,
            "cholesterol_distribution": chol_dist,
            "blood_pressure_distribution": bp_dist,
            "max_heart_rate_distribution": hr_dist,
            "chest_pain_distribution": cp_dist,
            "filter_bounds": {
                "min_age": int(df["age"].min()) if "age" in df.columns else 20,
                "max_age": int(df["age"].max()) if "age" in df.columns else 80
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard aggregation error: {str(e)}")
