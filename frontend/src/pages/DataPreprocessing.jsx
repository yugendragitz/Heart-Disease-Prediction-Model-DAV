import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  BarChart,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import MetricCard from '../components/common/MetricCard';

export default function DataPreprocessing() {
  const {
    selectedDatasetId,
    datasetDetails,
    preprocessingState,
    setPreprocessingState,
    showNotification,
    setActiveTab
  } = useApp();

  const [imputationMethod, setImputationMethod] = useState('median');
  const [outlierMethod, setOutlierMethod] = useState('iqr');
  const [scalingMethod, setScalingMethod] = useState('standard');
  const [testSize, setTestSize] = useState(0.20);
  const [randomState, setRandomState] = useState(42);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunPreprocessing = async () => {
    if (!selectedDatasetId) {
      showNotification('Please select or load a dataset first.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        dataset_id: selectedDatasetId,
        imputation_method: imputationMethod,
        outlier_method: outlierMethod,
        scaling_method: scalingMethod,
        test_size: parseFloat(testSize),
        random_state: parseInt(randomState, 10),
      };

      const result = await api.runPreprocessing(payload);
      setPreprocessingState(result);
      showNotification('Preprocessing pipeline completed successfully!', 'success');
    } catch (err) {
      showNotification(`Preprocessing failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-purple-400" />
            Data Preprocessing & Transformation Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Systematically cleans clinical nulls, clips physiological outliers, scales continuous biomarkers, and performs stratified splitting.
          </p>
        </div>

        {preprocessingState && (
          <button
            onClick={() => setActiveTab('eda')}
            className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Proceed to Exploratory EDA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Pipeline Configuration Panel */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Pipeline Hyperparameters & Clinical Transforms
          </h2>
          <span className="text-xs text-slate-400 font-medium">Dataset: {selectedDatasetId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Missing Value Imputation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Missing Value Imputation
            </label>
            <select
              value={imputationMethod}
              onChange={(e) => setImputationMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="median">Median Imputation (Robust to Clinical Skew)</option>
              <option value="mean">Mean Imputation (Standard Normal)</option>
              <option value="mode">Mode Imputation (Most Frequent)</option>
              <option value="drop">Listwise Deletion (Drop Rows with Nulls)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              UCI Cleveland contains missing values in 'ca' and 'thal' requiring rigorous clinical imputation.
            </p>
          </div>

          {/* Outlier Handling */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Outlier Handling Technique
            </label>
            <select
              value={outlierMethod}
              onChange={(e) => setOutlierMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="iqr">IQR Clipping (1.5 × IQR Winsorization)</option>
              <option value="zscore">Z-Score 3-Sigma Filter (|z| &gt; 3.0)</option>
              <option value="none">Retain Raw Values (No Outlier Clipping)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Caps extreme physiological values (e.g. chol &gt; 500 mg/dl, trestbps &gt; 200 mm Hg) without losing records.
            </p>
          </div>

          {/* Feature Scaling Method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Feature Scaling & Normalization
            </label>
            <select
              value={scalingMethod}
              onChange={(e) => setScalingMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="standard">StandardScaler (Zero-Mean, Unit Variance)</option>
              <option value="minmax">MinMaxScaler (Range [0.0, 1.0])</option>
              <option value="robust">RobustScaler (Median & Interquartile Range)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Essential for distance-based and gradient classifiers (SVM, KNN, Logistic Regression).
            </p>
          </div>

          {/* Train/Test Split Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Stratified Train/Test Split
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {Math.round((1 - testSize) * 100)}% / {Math.round(testSize * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>90/10</span>
              <span>80/20 (Default)</span>
              <span>70/30</span>
              <span>60/40</span>
            </div>
          </div>

          {/* Random State Seed */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Random State Seed (Reproducibility)
            </label>
            <input
              type="number"
              value={randomState}
              onChange={(e) => setRandomState(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Enforces reproducible pseudo-random partitioning across academic evaluations.
            </p>
          </div>

          {/* Execution CTA */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleRunPreprocessing}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Processing Transformations...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Preprocessing Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preprocessing Transformation Results */}
      {preprocessingState && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Training Samples"
              value={preprocessingState.train_shape?.[0] || 0}
              subtitle={`${preprocessingState.train_shape?.[1] || 13} scaled features`}
              icon={CheckCircle2}
              color="emerald"
              trend="Stratified"
            />
            <MetricCard
              title="Testing Samples"
              value={preprocessingState.test_shape?.[0] || 0}
              subtitle={`Hold-out evaluation set`}
              icon={Layers}
              color="cyan"
              trend={`${Math.round(testSize * 100)}%`}
            />
            <MetricCard
              title="Missing Values Resolved"
              value={preprocessingState.imputation_count || 0}
              subtitle={`Method: ${imputationMethod}`}
              icon={ShieldCheck}
              color="purple"
            />
            <MetricCard
              title="Outliers Clipped"
              value={preprocessingState.outliers_clipped || 0}
              subtitle={`Technique: ${outlierMethod.toUpperCase()}`}
              icon={TrendingDown}
              color="amber"
            />
          </div>

          {/* Preprocessed Sample Preview */}
          {preprocessingState.preview_processed && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Transformed Feature Matrix Preview (Standardized)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Continuous attributes are normalized ($z = (x - \mu)/\sigma$); categorical variables encoded.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Ready for Model Training
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      {Object.keys(preprocessingState.preview_processed[0] || {}).map((col) => (
                        <th key={col} className="px-3 py-2.5 font-mono">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {preprocessingState.preview_processed.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-3 py-2 whitespace-nowrap">
                            {typeof v === 'number' ? v.toFixed(3) : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
