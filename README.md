# Heart Disease Prediction & Clinical Decision Support System

An end-to-end Data Analytics & Visualization (DAV) clinical decision support platform and machine learning suite for coronary artery disease risk assessment, interactive cohort analysis, and explainable AI.

---

## 🌟 Key Features

- **Unit 1: Data Ingestion & Clinical Data Preprocessing**
  - Missing value imputation (Median, Mean, Mode, Listwise Deletion)
  - Physiological outlier clipping (IQR 1.5× Winsorization, Z-score 3-sigma)
  - Continuous feature scaling (StandardScaler, MinMaxScaler, RobustScaler)
  - Stratified train/test splitting to preserve clinical minority class ratios

- **Unit 2: Exploratory Data Analysis & Visualization (EDA)**
  - 12-step clinical research visualization suite
  - Univariate and bivariate distribution histograms and density curves
  - Pearson correlation matrix and target correlation rankings
  - Dynamic demographic cohort filtering (Age, Sex, Diagnostic Outcome)

- **Unit 3: Feature Engineering & Selection**
  - Clinical ratio derivation: Rate-Pressure Product (RPP), Chol/Age, Stress Index
  - Filter selection: Pearson correlation (|r|) and ANOVA F-statistic (SelectKBest)
  - Information-theoretic selection: Mutual Information gain
  - Wrapper selection: Recursive Feature Elimination (RFE) via Random Forest

- **Unit 4: Supervised Machine Learning & Evaluation**
  - 8 Classifiers: Logistic Regression, Decision Tree, Random Forest, SVM, KNN, Naive Bayes, XGBoost, CatBoost
  - Stratified 5-Fold Cross-Validation with fold variance estimation
  - Comprehensive clinical metrics: Accuracy, Precision, Recall, Specificity, F1-Score, ROC-AUC
  - Multi-model ROC curve overlays and confusion matrix breakdowns

- **Unit 5: Explainable Artificial Intelligence (XAI)**
  - SHAP (SHapley Additive exPlanations): TreeExplainer waterfall & patient attributions
  - Global feature importance based on mean |SHAP| values
  - LIME (Local Interpretable Model-agnostic Explanations): Sparse linear surrogate decision rules
  - Patient risk factor breakdown & protective factor identification

---

## 🛠️ Tech Stack

- **Machine Learning**: `scikit-learn`, `xgboost`, `catboost`, `shap`, `lime`
- **Backend**: `FastAPI` (Python), `SQLite`, `pandas`, `numpy`, `joblib`
- **Frontend**: `React 19`, `Vite`, `Tailwind CSS`, `Lucide React`
- **Visualizations**: `Recharts` (Responsive SVG charts)
- **Datasets**: UCI Cleveland Clinic Heart Disease dataset & Kaggle Heart Disease benchmarks

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/yugendragitz/Heart-Disease-Prediction-Model-DAV.git
cd Heart-Disease-Prediction-Model-DAV

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide

This project is architected for seamless cloud deployment:
- **Backend API**: Hosted on **Render** (FastAPI Python Web Service)
- **Frontend App**: Hosted on **Vercel** (React + Vite SPA)

### Step 1: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `yugendragitz/Heart-Disease-Prediction-Model-DAV`.
3. Configure the service settings:
   - **Name**: `heart-disease-prediction-api` (or your choice)
   - **Language / Runtime**: `Python`
   - **Region**: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable:
   - `PYTHON_VERSION`: `3.11.9`
5. Click **Deploy Web Service**.
6. Once deployed, copy your Render public URL (e.g., `https://heart-disease-prediction-api.onrender.com`).
   - You can test it by visiting: `https://heart-disease-prediction-api.onrender.com/api/health`

*(Note: Render Blueprint is also included via `render.yaml` for automatic 1-click configuration).*

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your GitHub repository: `yugendragitz/Heart-Disease-Prediction-Model-DAV`.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<YOUR-RENDER-API-URL>.onrender.com` *(e.g., `https://heart-disease-prediction-api.onrender.com`)*
5. Click **Deploy**.
6. Done! Your application will be live at `https://<your-project>.vercel.app`.

---

## 📜 Citations & References
- Detrano, R., Janosi, A., Steinbrunn, W., et al. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease*. The American Journal of Cardiology.
- Lundberg, S. M., & Lee, S. I. (2017). *A unified approach to interpreting model predictions*. NeurIPS.
- Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). *"Why Should I Trust You?": Explaining the Predictions of Any Classifier*. ACM SIGKDD.

