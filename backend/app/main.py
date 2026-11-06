import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api.datasets import router as datasets_router, register_default_benchmarks
from app.api.preprocessing import router as preprocessing_router
from app.api.eda import router as eda_router
from app.api.features import router as features_router
from app.api.models import router as models_router
from app.api.prediction import router as prediction_router
from app.api.explainability import router as explainability_router
from app.api.dashboard import router as dashboard_router
from app.api.results import router as results_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure system directories
    for folder in ["data", "data/benchmarks", "data/uploads", "data/processed", "models", "outputs"]:
        os.makedirs(os.path.join(BASE_DIR, folder), exist_ok=True)
        
    init_db()
    register_default_benchmarks()
    yield

app = FastAPI(
    title="Comparative Machine Learning Framework for Heart Disease Prediction",
    description="Academic Research Decision-Support System for B.Tech DAV Specialization",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(datasets_router)
app.include_router(preprocessing_router)
app.include_router(eda_router)
app.include_router(features_router)
app.include_router(models_router)
app.include_router(prediction_router)
app.include_router(explainability_router)
app.include_router(dashboard_router)
app.include_router(results_router)

@app.get("/")
def root():
    return {
        "system": "Comparative Machine Learning Framework for Heart Disease Prediction",
        "role": "Academic Research Decision Support System",
        "status": "Online",
        "docs": "/docs",
        "disclaimer": "For educational & research evaluation purposes only. Not a clinical diagnosis tool."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "heart-disease-analytics-backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)

