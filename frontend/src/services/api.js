// API client service connecting React frontend to FastAPI backend

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function fetchDatasetDetails(datasetId) {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}`);
  if (!res.ok) throw new Error('Failed to fetch dataset details');
  return res.json();
}

export async function loadBenchmarkDataset(benchmarkId) {
  const res = await fetch(`${API_BASE}/datasets/load-benchmark?benchmark_id=${benchmarkId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load benchmark dataset');
  return res.json();
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Dataset upload failed');
  }
  return res.json();
}

export async function runPreprocessing(params) {
  const res = await fetch(`${API_BASE}/preprocess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Preprocessing failed');
  }
  return res.json();
}

export async function fetchEDA(datasetId) {
  const res = await fetch(`${API_BASE}/eda/${datasetId}`);
  if (!res.ok) throw new Error('Failed to fetch EDA data');
  return res.json();
}

export async function engineerFeatures(params) {
  const res = await fetch(`${API_BASE}/features/engineer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Feature engineering failed');
  }
  return res.json();
}

export async function selectFeatures(params) {
  const res = await fetch(`${API_BASE}/features/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Feature selection failed');
  }
  return res.json();
}

export async function trainModels(params) {
  const res = await fetch(`${API_BASE}/models/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Model training failed');
  }
  return res.json();
}

export async function fetchModels(datasetId) {
  const res = await fetch(`${API_BASE}/models?dataset_id=${datasetId}`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function compareModels(params) {
  const res = await fetch(`${API_BASE}/models/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Model comparison failed');
  }
  return res.json();
}

export async function makePrediction(params) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function fetchPredictionHistory() {
  const res = await fetch(`${API_BASE}/predict/history`);
  if (!res.ok) throw new Error('Failed to fetch prediction history');
  return res.json();
}

export async function fetchSHAP(params) {
  const res = await fetch(`${API_BASE}/explain/shap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'SHAP computation failed');
  }
  return res.json();
}

export async function fetchLIME(params) {
  const res = await fetch(`${API_BASE}/explain/lime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'LIME computation failed');
  }
  return res.json();
}

export async function fetchDashboardData(datasetId, filters = {}) {
  const query = new URLSearchParams();
  if (filters.min_age !== undefined && filters.min_age !== '') query.append('min_age', filters.min_age);
  if (filters.max_age !== undefined && filters.max_age !== '') query.append('max_age', filters.max_age);
  if (filters.sex_filter !== undefined && filters.sex_filter !== '') query.append('sex_filter', filters.sex_filter);
  if (filters.target_filter !== undefined && filters.target_filter !== '') query.append('target_filter', filters.target_filter);

  const res = await fetch(`${API_BASE}/dashboard/${datasetId}?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchResearchResults(datasetId) {
  const res = await fetch(`${API_BASE}/results/${datasetId}`);
  if (!res.ok) throw new Error('Failed to fetch research results');
  return res.json();
}
