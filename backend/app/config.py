import os

APP_DIR = os.path.dirname(os.path.abspath(__file__)) # .../backend/app
BACKEND_DIR = os.path.dirname(APP_DIR)               # .../backend
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)          # .../dav project SP

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DB_DIR = DATA_DIR
BENCHMARKS_DIR = os.path.join(DATA_DIR, "benchmarks")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
OUTPUTS_DIR = os.path.join(PROJECT_ROOT, "outputs")
DB_PATH = os.path.join(DATA_DIR, "heart_disease.db")

for d in [DATA_DIR, BENCHMARKS_DIR, UPLOADS_DIR, PROCESSED_DIR, MODELS_DIR, OUTPUTS_DIR]:
    os.makedirs(d, exist_ok=True)
