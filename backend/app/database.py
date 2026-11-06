import os
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.config import DB_PATH, DB_DIR

def get_db_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            filepath TEXT NOT NULL,
            rows_count INTEGER,
            cols_count INTEGER,
            target_column TEXT DEFAULT 'target',
            is_benchmark INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            pipeline_path TEXT NOT NULL,
            hyperparameters TEXT,
            created_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_results (
            id TEXT PRIMARY KEY,
            model_id TEXT NOT NULL,
            dataset_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            accuracy REAL,
            precision REAL,
            recall REAL,
            f1 REAL,
            roc_auc REAL,
            cv_accuracy_mean REAL,
            cv_accuracy_std REAL,
            training_time REAL,
            inference_time_ms REAL,
            confusion_matrix TEXT,
            roc_curve TEXT,
            created_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            model_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            input_features TEXT NOT NULL,
            prediction_class INTEGER NOT NULL,
            prediction_label TEXT NOT NULL,
            probability REAL NOT NULL,
            risk_level TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS feature_importance (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            method TEXT NOT NULL,
            importance_scores TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_runs (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            status TEXT NOT NULL,
            models_trained_count INTEGER,
            best_model_name TEXT,
            best_roc_auc REAL,
            created_at TEXT NOT NULL
        )
        """)
        conn.commit()

def save_dataset_record(dataset_id: str, name: str, filepath: str, rows_count: int, cols_count: int, target_col: str = "target", is_benchmark: int = 0):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO datasets (id, name, filepath, rows_count, cols_count, target_column, is_benchmark, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (dataset_id, name, filepath, rows_count, cols_count, target_col, is_benchmark, datetime.now().isoformat()))
        conn.commit()

DATASET_ALIASES = {
    "uci_cleveland": "benchmark_uci",
    "cleveland": "benchmark_uci",
    "uci": "benchmark_uci",
    "kaggle": "benchmark_kaggle",
    "kaggle_heart": "benchmark_kaggle",
    "kaggle_heart_disease": "benchmark_kaggle",
    "cvd": "benchmark_cvd",
    "cardio": "benchmark_cvd",
    "cardiovascular": "benchmark_cvd",
    "cardiovascular_disease": "benchmark_cvd",
}

def _normalize_dataset_dict(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not d:
        return None
    res = dict(d)
    res["dataset_id"] = res.get("id")
    res["rows"] = res.get("rows_count", 0)
    res["cols"] = res.get("cols_count", 0)
    res["total_samples"] = res.get("rows_count", 0)
    return res

def list_all_datasets() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("SELECT * FROM datasets ORDER BY created_at DESC").fetchall()
        return [_normalize_dataset_dict(dict(r)) for r in rows]

def get_dataset_by_id(dataset_id: str) -> Optional[Dict[str, Any]]:
    target_id = DATASET_ALIASES.get(dataset_id, dataset_id)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("SELECT * FROM datasets WHERE id = ?", (target_id,)).fetchone()
        if not row and target_id != dataset_id:
            row = cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        return _normalize_dataset_dict(dict(row)) if row else None

def save_model_result(result_dict: Dict[str, Any]):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO model_results 
            (id, model_id, dataset_id, model_name, accuracy, precision, recall, f1, roc_auc, cv_accuracy_mean, cv_accuracy_std, training_time, inference_time_ms, confusion_matrix, roc_curve, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            result_dict['id'],
            result_dict['model_id'],
            result_dict['dataset_id'],
            result_dict['model_name'],
            result_dict.get('accuracy'),
            result_dict.get('precision'),
            result_dict.get('recall'),
            result_dict.get('f1'),
            result_dict.get('roc_auc'),
            result_dict.get('cv_accuracy_mean'),
            result_dict.get('cv_accuracy_std'),
            result_dict.get('training_time'),
            result_dict.get('inference_time_ms'),
            json.dumps(result_dict.get('confusion_matrix', {})),
            json.dumps(result_dict.get('roc_curve', {})),
            datetime.now().isoformat()
        ))
        conn.commit()

def get_model_results_for_dataset(dataset_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("SELECT * FROM model_results WHERE dataset_id = ? ORDER BY roc_auc DESC", (dataset_id,)).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            if d.get('confusion_matrix'):
                d['confusion_matrix'] = json.loads(d['confusion_matrix'])
            if d.get('roc_curve'):
                d['roc_curve'] = json.loads(d['roc_curve'])
            results.append(d)
        return results

def log_prediction(pred_dict: Dict[str, Any]):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (id, dataset_id, model_id, model_name, input_features, prediction_class, prediction_label, probability, risk_level, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pred_dict['id'],
            pred_dict['dataset_id'],
            pred_dict['model_id'],
            pred_dict['model_name'],
            json.dumps(pred_dict['input_features']),
            pred_dict['prediction_class'],
            pred_dict['prediction_label'],
            pred_dict['probability'],
            pred_dict['risk_level'],
            datetime.now().isoformat()
        ))
        conn.commit()

def get_prediction_history(limit: int = 50) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        res = []
        for r in rows:
            d = dict(r)
            d['input_features'] = json.loads(d['input_features'])
            res.append(d)
        return res
