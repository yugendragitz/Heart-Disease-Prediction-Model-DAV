import os
import uuid
import pandas as pd
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List
from app.config import BENCHMARKS_DIR, UPLOADS_DIR
from app.database import save_dataset_record, list_all_datasets, get_dataset_by_id

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

def compute_dataset_overview(df: pd.DataFrame) -> Dict[str, Any]:
    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    duplicates_count = int(df.duplicated().sum())
    missing_count = int(df.isnull().sum().sum())
    
    columns_info = []
    for col in df.columns:
        col_series = df[col]
        n_missing = int(col_series.isnull().sum())
        n_unique = int(col_series.nunique())
        dtype_str = str(col_series.dtype)
        
        col_min = float(col_series.min()) if pd.api.types.is_numeric_dtype(col_series) and not col_series.empty else None
        col_max = float(col_series.max()) if pd.api.types.is_numeric_dtype(col_series) and not col_series.empty else None
        col_mean = round(float(col_series.mean()), 2) if pd.api.types.is_numeric_dtype(col_series) and not col_series.empty else None
        
        columns_info.append({
            "name": col,
            "data_type": dtype_str,
            "missing_values": n_missing,
            "missing_percentage": round((n_missing / len(df)) * 100, 2) if len(df) > 0 else 0,
            "unique_values": n_unique,
            "min": col_min,
            "max": col_max,
            "mean": col_mean
        })
        
    return {
        "rows_count": len(df),
        "cols_count": len(df.columns),
        "memory_mb": memory_mb,
        "duplicates_count": duplicates_count,
        "duplicates_percentage": round((duplicates_count / len(df)) * 100, 2) if len(df) > 0 else 0,
        "total_missing_values": missing_count,
        "columns": columns_info
    }

def register_default_benchmarks():
    benchmarks = [
        ("benchmark_uci", "UCI Heart Disease (Cleveland)", os.path.join(BENCHMARKS_DIR, "uci_heart_disease.csv"), "target"),
        ("benchmark_kaggle", "Kaggle Heart Disease Dataset", os.path.join(BENCHMARKS_DIR, "kaggle_heart_disease.csv"), "target"),
        ("benchmark_cvd", "Cardiovascular Disease Dataset", os.path.join(BENCHMARKS_DIR, "cardiovascular_disease.csv"), "target"),
    ]
    for b_id, b_name, b_path, b_target in benchmarks:
        if os.path.exists(b_path):
            try:
                df = pd.read_csv(b_path)
                save_dataset_record(
                    dataset_id=b_id,
                    name=b_name,
                    filepath=b_path,
                    rows_count=len(df),
                    cols_count=len(df.columns),
                    target_col=b_target,
                    is_benchmark=1
                )
            except Exception as e:
                print(f"Error registering benchmark {b_name}: {e}")

@router.get("")
def get_datasets():
    register_default_benchmarks()
    raw = list_all_datasets()
    normalized = []
    for d in raw:
        item = dict(d)
        item["dataset_id"] = d.get("id")
        item["rows"] = d.get("rows_count", 0)
        item["rows_count"] = d.get("rows_count", 0)
        item["cols"] = d.get("cols_count", 0)
        item["cols_count"] = d.get("cols_count", 0)
        item["total_samples"] = d.get("rows_count", 0)
        normalized.append(item)
    return {"datasets": normalized}

@router.post("/load-benchmark")
def load_benchmark(benchmark_id: str):
    register_default_benchmarks()
    ds = get_dataset_by_id(benchmark_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Benchmark dataset not found.")
    return {"status": "success", "dataset": ds}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are supported.")
        
    dataset_id = f"custom_{uuid.uuid4().hex[:8]}"
    clean_filename = f"{dataset_id}_{file.filename}"
    save_path = os.path.join(UPLOADS_DIR, clean_filename)
    
    try:
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)
            
        df = pd.read_csv(save_path)
        if df.empty or len(df) < 10:
            os.remove(save_path)
            raise HTTPException(status_code=400, detail="Uploaded dataset has insufficient rows (minimum 10 rows required).")
            
        target_candidates = ["target", "cardio", "heart_disease", "condition", "num", "output", "class"]
        detected_target = next((c for c in target_candidates if c in df.columns), df.columns[-1])
        
        save_dataset_record(
            dataset_id=dataset_id,
            name=file.filename.replace(".csv", ""),
            filepath=save_path,
            rows_count=len(df),
            cols_count=len(df.columns),
            target_col=detected_target,
            is_benchmark=0
        )
        
        overview = compute_dataset_overview(df)
        return {
            "status": "success",
            "message": "Dataset uploaded and parsed successfully.",
            "dataset_id": dataset_id,
            "detected_target": detected_target,
            "overview": overview
        }
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")

@router.get("/{dataset_id}")
def get_dataset_details(dataset_id: str):
    register_default_benchmarks()
    ds = get_dataset_by_id(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    filepath = ds["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")
        
    try:
        df = pd.read_csv(filepath)
        overview = compute_dataset_overview(df)
        
        preview_df = df.head(50).replace({np.nan: None})
        preview_data = preview_df.to_dict(orient="records")
        
        return {
            "dataset": ds,
            "overview": overview,
            "preview": preview_data,
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading dataset: {str(e)}")
