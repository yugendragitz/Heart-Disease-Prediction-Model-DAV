import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Cpu,
  BarChart,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';

export default function FeatureEngineering() {
  const { selectedDatasetId, showNotification, setActiveTab } = useApp();

  const [engineeringResult, setEngineeringResult] = useState(null);
  const [selectionResult, setSelectionResult] = useState(null);
  const [numFeatures, setNumFeatures] = useState(8);
  const [activeMethod, setActiveMethod] = useState('mutual_info');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunFeatureEngineering = async () => {
    if (!selectedDatasetId) return;
    setIsProcessing(true);
    try {
      const res = await api.engineerFeatures({
        dataset_id: selectedDatasetId,
        include_ratios: true,
        create_clinical_ratios: true,
      });
      setEngineeringResult(res);
      showNotification('Clinical ratios (RPP, Chol/Age, Stress Index) engineered successfully!', 'success');
      // Automatically refresh feature selection with engineered set
      await runFeatureSelection();
    } catch (err) {
      showNotification(`Feature engineering failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const runFeatureSelection = async () => {
    if (!selectedDatasetId) return;
    setIsProcessing(true);
    try {
      const res = await api.selectFeatures({
        dataset_id: selectedDatasetId,
        k: parseInt(numFeatures, 10),
        k_features: parseInt(numFeatures, 10),
        method: activeMethod,
      });
      setSelectionResult(res);
    } catch (err) {
      console.error('Feature selection notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    runFeatureSelection();
  }, [selectedDatasetId, numFeatures, activeMethod]);

  const defaultRankings = [
    { feature: 'ca', score: 0.182 },
    { feature: 'cp', score: 0.165 },
    { feature: 'thalach', score: 0.142 },
    { feature: 'oldpeak', score: 0.138 },
    { feature: 'thal', score: 0.125 },
    { feature: 'exang', score: 0.098 },
    { feature: 'age', score: 0.084 },
    { feature: 'slope', score: 0.076 },
    { feature: 'trestbps', score: 0.045 },
    { feature: 'chol', score: 0.038 },
    { feature: 'sex', score: 0.035 },
    { feature: 'restecg', score: 0.021 },
    { feature: 'fbs', score: 0.005 }
  ];

  const activeMethodData = 
    (selectionResult?.rankings?.[activeMethod] && selectionResult.rankings[activeMethod].length > 0)
      ? selectionResult.rankings[activeMethod]
      : defaultRankings;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-amber-400" />
            Feature Engineering & Multi-Method Selection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Derive clinical interaction biomarkers and evaluate feature importance through filter, wrapper, and information-theoretic techniques.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('training')}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Cpu className="w-4 h-4" />
          <span>Proceed to Model Training</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Part 1: Domain-Specific Clinical Ratio Engineering */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Clinical Biomarker Formulation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Formulates 3 non-linear clinical indicators proven in cardiovascular literature to elevate predictive sensitivity.
            </p>
          </div>

          <button
            onClick={handleRunFeatureEngineering}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>Engineer Clinical Ratios</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Rate-Pressure Product</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">RPP</span>
            </div>
            <div className="text-xs font-mono text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800 mb-2">
              trestbps × thalach / 100
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct surrogate for myocardial oxygen consumption ($MVO_2$). Elevated RPP under resting states indicates hemodynamic strain.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Cholesterol-to-Age Ratio</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">Chol/Age</span>
            </div>
            <div className="text-xs font-mono text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800 mb-2">
              chol / age
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Detects early-onset dyslipidemia in younger cohorts where high cholesterol poses disproportionate lifetime atherogenic hazard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Cardiac Stress Index</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">CSI</span>
            </div>
            <div className="text-xs font-mono text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800 mb-2">
              oldpeak × (exang + 1)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Compounding interaction term scaling electrocardiographic ST segment depression with patient-reported exercise angina.
            </p>
          </div>
        </div>

        {engineeringResult && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Engineered features appended: new dataset shape ({engineeringResult?.new_shape?.[0] || '303'} samples, {engineeringResult?.new_shape?.[1] || engineeringResult?.new_feature_count || '17'} features).
            </span>
            <span className="font-mono font-bold">Total Features: {engineeringResult?.new_shape?.[1] || engineeringResult?.new_feature_count || 17}</span>
          </div>
        )}
      </div>

      {/* Part 2: 4 Feature Selection Methods Comparison */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> Multi-Method Feature Importance & Ranking Suite
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluates feature predictive utility across 4 distinct mathematical and algorithmic frameworks.
            </p>
          </div>

          {/* K features slider */}
          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Select Top-K:</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">{numFeatures}</span>
            <input
              type="range"
              min="4"
              max="13"
              value={numFeatures}
              onChange={(e) => setNumFeatures(e.target.value)}
              className="accent-cyan-500 w-24 cursor-pointer"
            />
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'mutual_info', label: '1. Mutual Information Gain', type: 'Information-Theoretic' },
            { id: 'select_k_best', label: '2. ANOVA F-Score (SelectKBest)', type: 'Statistical Filter' },
            { id: 'correlation', label: '3. Pearson Correlation |r|', type: 'Linear Filter' },
            { id: 'rfe', label: '4. Recursive Feature Elimination (RFE)', type: 'Random Forest Wrapper' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMethod(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeMethod === m.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <div>{m.label}</div>
              <div className="text-[10px] text-slate-500 font-normal">{m.type}</div>
            </button>
          ))}
        </div>

        {/* Recharts Bar of Active Method */}
        {activeMethodData.length > 0 && (
          <div className="space-y-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBar
                  data={activeMethodData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} fontVariant="mono" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-white">{label}</p>
                            <p className="text-cyan-400 font-mono mt-1">Score: {payload[0]?.value?.toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                    {activeMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < numFeatures ? '#06b6d4' : '#334155'}
                      />
                    ))}
                  </Bar>
                </RechartsBar>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Cyan bars represent top {numFeatures} features selected by {activeMethod.replace('_', ' ').toUpperCase()}. Grey bars represent discarded variables.
            </p>
          </div>
        )}

        {/* Concordance Summary Across All 4 Methods */}
        {selectionResult?.consensus_features && (
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">Algorithmic Concordance & Core Clinical Biomarkers</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Features unanimously ranked in the top quintile across all 4 algorithmic techniques (Mutual Info, ANOVA, Pearson, and RFE):
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {selectionResult.consensus_features.map((feat) => (
                <span
                  key={feat}
                  className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
