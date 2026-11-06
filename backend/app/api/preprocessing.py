import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from scipy import stats
from app.config import PROCESSED_DIR
from app.database import get_dataset_by_id

router = APIRouter(prefix="/api/preprocess", tags=["preprocessing"])

class PreprocessRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = "target"
    handle_missing: Optional[str] = "median"  # "none", "mean", "median", "mode", "ffill", "drop"
    imputation_method: Optional[str] = None
    remove_duplicates: Optional[bool] = True
    encoding_method: Optional[str] = "label"  # "none", "label", "onehot"
    outlier_method: Optional[str] = "iqr"  # "none", "iqr", "zscore"
    outlier_action: Optional[str] = "clip"  # "clip", "drop", "flag"
    scaling_method: Optional[str] = "standard"  # "none", "standard", "minmax", "robust"
    test_size: Optional[float] = 0.2
    random_state: Optional[int] = 42
    stratify: Optional[bool] = True

@router.post("")
def preprocess_dataset(req: PreprocessRequest):
    ds = get_dataset_by_id(req.dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    filepath = ds["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")
        
    try:
        df_raw = pd.read_csv(filepath)
        initial_shape = df_raw.shape
        
        target_col = req.target_column or ds.get("target_column") or "target"
        if target_col not in df_raw.columns:
            # Fallback to last column if target column name not found
            target_col = df_raw.columns[-1]
            
        df = df_raw.copy()
        
        # 1. Duplicate detection and optional removal
        initial_duplicates = int(df.duplicated().sum())
        if req.remove_duplicates and initial_duplicates > 0:
            df = df.drop_duplicates().reset_index(drop=True)
            
        # 2. Missing Value Imputation
        missing_method = req.imputation_method or req.handle_missing or "median"
        missing_counts_before = df.isnull().sum().to_dict()
        if missing_method != "none":
            for col in df.columns:
                if df[col].isnull().sum() > 0:
                    if missing_method == "drop":
                        df = df.dropna().reset_index(drop=True)
                        break
                    elif missing_method == "ffill":
                        df[col] = df[col].ffill().bfill()
                    elif pd.api.types.is_numeric_dtype(df[col]):
                        if missing_method == "mean":
                            df[col] = df[col].fillna(df[col].mean())
                        elif missing_method == "median":
                            df[col] = df[col].fillna(df[col].median())
                        elif missing_method == "mode":
                            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)
                    else:
                        df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
                        
        # 3. Outlier Analysis & Handling
        numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != target_col]
        outlier_counts = {}
        for col in numeric_cols:
            if req.outlier_method == "iqr":
                q25, q75 = df[col].quantile(0.25), df[col].quantile(0.75)
                iqr = q75 - q25
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                mask = (df[col] < lower_bound) | (df[col] > upper_bound)
                outlier_counts[col] = int(mask.sum())
                if req.outlier_action == "clip":
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                elif req.outlier_action == "drop" and mask.sum() > 0:
                    df = df[~mask].reset_index(drop=True)
            elif req.outlier_method == "zscore":
                z_scores = np.abs(stats.zscore(df[col].dropna()))
                mask = z_scores > 3.0
                outlier_counts[col] = int(mask.sum())
                if req.outlier_action == "drop" and mask.sum() > 0:
                    df = df[~mask].reset_index(drop=True)
                    
        # 4. Categorical Encoding
        encoders = {}
        categorical_cols = [c for c in df.columns if c != target_col and not pd.api.types.is_numeric_dtype(df[c])]
        if req.encoding_method == "label":
            for col in categorical_cols:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                encoders[col] = {
                    "type": "label",
                    "classes": le.classes_.tolist()
                }
        elif req.encoding_method == "onehot" and len(categorical_cols) > 0:
            df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
            
        # Ensure target is binary integer
        df[target_col] = df[target_col].astype(int)
        
        # 5. Feature matrix X and Target vector y
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # 6. Train/Test Split
        stratify_col = y if (req.stratify and y.nunique() > 1 and y.value_counts().min() > 1) else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=req.test_size,
            random_state=req.random_state,
            stratify=stratify_col
        )
        
        # 7. Scaling
        scaler = None
        scaled_features = list(X.columns)
        if req.scaling_method == "standard":
            scaler = StandardScaler()
            X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X.columns, index=X_train.index)
            X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns, index=X_test.index)
        elif req.scaling_method == "minmax":
            scaler = MinMaxScaler()
            X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X.columns, index=X_train.index)
            X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns, index=X_test.index)
        elif req.scaling_method == "robust":
            scaler = RobustScaler()
            X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X.columns, index=X_train.index)
            X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns, index=X_test.index)
        else:
            X_train_scaled = X_train.copy()
            X_test_scaled = X_test.copy()
            
        # Save preprocessed pipeline state
        pipeline_file = os.path.join(PROCESSED_DIR, f"{req.dataset_id}_pipeline.joblib")
        pipeline_data = {
            "dataset_id": req.dataset_id,
            "target_column": target_col,
            "feature_columns": list(X.columns),
            "encoders": encoders,
            "scaler": scaler,
            "scaling_method": req.scaling_method,
            "X_train": X_train_scaled,
            "X_test": X_test_scaled,
            "y_train": y_train,
            "y_test": y_test,
            "raw_feature_means": X.mean().to_dict(),
            "raw_feature_stds": X.std().to_dict(),
        }
        joblib.dump(pipeline_data, pipeline_file)
        
        # Sample preview of processed data
        processed_preview = df.head(10).replace({np.nan: None}).to_dict(orient="records")
        
        return {
            "status": "success",
            "message": "Preprocessing completed successfully.",
            "initial_shape": initial_shape,
            "final_shape": df.shape,
            "removed_duplicates": initial_duplicates if req.remove_duplicates else 0,
            "outliers_detected": outlier_counts,
            "features_count": len(X.columns),
            "feature_names": list(X.columns),
            "target_column": target_col,
            "target_distribution": y.value_counts().to_dict(),
            "train_dimensions": {
                "rows": len(X_train),
                "features": len(X.columns)
            },
            "test_dimensions": {
                "rows": len(X_test),
                "features": len(X.columns)
            },
            "preview": processed_preview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")
