import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCcw,
  Zap,
  Activity,
  Heart,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';

export default function Prediction() {
  const {
    selectedDatasetId,
    trainedModels,
    setActivePatientData,
    lastPredictionResult,
    setLastPredictionResult,
    showNotification,
    setActiveTab,
  } = useApp();

  const [selectedModel, setSelectedModel] = useState('catboost');
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default patient form state
  const [formData, setFormData] = useState({
    age: 58,
    sex: 1,
    cp: 2,
    trestbps: 140,
    chol: 245,
    fbs: 0,
    restecg: 1,
    thalach: 140,
    exang: 1,
    oldpeak: 2.2,
    slope: 1,
    ca: 1,
    thal: 2,
  });

  const clinicalPresets = [
    {
      label: 'Low Risk Profile',
      desc: 'Young adult, normal ECG, high exercise capacity',
      data: {
        age: 38,
        sex: 0,
        cp: 1,
        trestbps: 115,
        chol: 180,
        fbs: 0,
        restecg: 0,
        thalach: 175,
        exang: 0,
        oldpeak: 0.2,
        slope: 0,
        ca: 0,
        thal: 0,
      },
      tagColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    {
      label: 'Moderate Risk Profile',
      desc: 'Middle-aged, borderline cholesterol, mild chest distress',
      data: {
        age: 52,
        sex: 1,
        cp: 2,
        trestbps: 135,
        chol: 240,
        fbs: 0,
        restecg: 1,
        thalach: 148,
        exang: 0,
        oldpeak: 1.2,
        slope: 1,
        ca: 0,
        thal: 1,
      },
      tagColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    },
    {
      label: 'Higher Risk Profile',
      desc: 'Elderly, severe ST depression, fluoroscopy vessel occlusion',
      data: {
        age: 64,
        sex: 1,
        cp: 3,
        trestbps: 160,
        chol: 285,
        fbs: 1,
        restecg: 2,
        thalach: 120,
        exang: 1,
        oldpeak: 2.8,
        slope: 2,
        ca: 2,
        thal: 2,
      },
      tagColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10'
    },
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.fetchPredictionHistory();
      if (res && res.history) {
        setPredictionHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const payload = {
        dataset_id: selectedDatasetId,
        algorithm: selectedModel,
        patient_data: formData,
      };

      const res = await api.makePrediction(payload);
      setLastPredictionResult(res);
      setActivePatientData(formData);
      showNotification('Prediction generated and recorded in audit log!', 'success');
      fetchHistory();
    } catch (err) {
      showNotification(`Prediction failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExplainWithXAI = () => {
    setActivePatientData(formData);
    setActiveTab('xai');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-cyan-400" />
            Patient Clinical Risk Stratification & Inference
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Input standardized hemodynamic, clinical, and electrocardiographic parameters to compute probabilistic risk indices.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <Cpu className="w-4 h-4 text-cyan-400 ml-1.5" />
          <span className="text-xs text-slate-400 font-medium">Inference Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-900 text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2"
          >
            {trainedModels?.length > 0 ? (
              trainedModels.map((m) => (
                <option key={m.algorithm} value={m.algorithm}>
                  {m.name} (AUC: {(m.metrics?.roc_auc || 0).toFixed(2)})
                </option>
              ))
            ) : (
              <>
                <option value="catboost">CatBoost Classifier</option>
                <option value="logistic_regression">Logistic Regression</option>
                <option value="random_forest">Random Forest</option>
                <option value="xgboost">XGBoost</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Preset Profiles Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {clinicalPresets.map((preset) => (
          <div
            key={preset.label}
            onClick={() => {
              setFormData(preset.data);
              showNotification(`Loaded ${preset.label}`, 'info');
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${preset.tagColor} bg-slate-900/60`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>{preset.label}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Quick Load
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{preset.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Form on Left, Risk Output Gauge on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clinical Variables Form */}
        <div className="lg:col-span-2 glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Clinical Diagnostic Input Parameters
            </h2>
            <span className="text-xs font-mono text-slate-400">13 Attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Age (Years)</label>
              <input
                type="number"
                min="20"
                max="90"
                value={formData.age}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Sex */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Biological Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => handleInputChange('sex', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>Male (1)</option>
                <option value={0}>Female (0)</option>
              </select>
            </div>

            {/* Chest Pain Type (cp) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Chest Pain Type (CP)</label>
              <select
                value={formData.cp}
                onChange={(e) => handleInputChange('cp', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Typical Angina (0)</option>
                <option value={1}>Atypical Angina (1)</option>
                <option value={2}>Non-anginal Pain (2)</option>
                <option value={3}>Asymptomatic (3)</option>
              </select>
            </div>

            {/* Resting Blood Pressure (trestbps) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Resting BP (mm Hg)</label>
              <input
                type="number"
                min="80"
                max="220"
                value={formData.trestbps}
                onChange={(e) => handleInputChange('trestbps', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Serum Cholesterol (chol) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Cholesterol (mg/dl)</label>
              <input
                type="number"
                min="100"
                max="600"
                value={formData.chol}
                onChange={(e) => handleInputChange('chol', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Fasting Blood Sugar (fbs) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Fasting Blood Sugar &gt; 120</label>
              <select
                value={formData.fbs}
                onChange={(e) => handleInputChange('fbs', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>No (&le; 120 mg/dl)</option>
                <option value={1}>Yes (&gt; 120 mg/dl)</option>
              </select>
            </div>

            {/* Resting ECG (restecg) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Resting ECG</label>
              <select
                value={formData.restecg}
                onChange={(e) => handleInputChange('restecg', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Normal (0)</option>
                <option value={1}>ST-T Wave Abnormality (1)</option>
                <option value={2}>LV Hypertrophy (2)</option>
              </select>
            </div>

            {/* Max Heart Rate (thalach) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Max Heart Rate (thalach)</label>
              <input
                type="number"
                min="60"
                max="220"
                value={formData.thalach}
                onChange={(e) => handleInputChange('thalach', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Exercise Angina (exang) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Exercise Induced Angina</label>
              <select
                value={formData.exang}
                onChange={(e) => handleInputChange('exang', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>No (0)</option>
                <option value={1}>Yes (1)</option>
              </select>
            </div>

            {/* ST Depression (oldpeak) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">ST Depression (oldpeak)</label>
              <input
                type="number"
                step="0.1"
                min="0.0"
                max="7.0"
                value={formData.oldpeak}
                onChange={(e) => handleInputChange('oldpeak', parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Slope */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Slope of Peak ST</label>
              <select
                value={formData.slope}
                onChange={(e) => handleInputChange('slope', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Upsloping (0)</option>
                <option value={1}>Flat (1)</option>
                <option value={2}>Downsloping (2)</option>
              </select>
            </div>

            {/* Number of Major Vessels (ca) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Fluoroscopy Vessels (ca)</label>
              <select
                value={formData.ca}
                onChange={(e) => handleInputChange('ca', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>0 Vessels</option>
                <option value={1}>1 Vessel</option>
                <option value={2}>2 Vessels</option>
                <option value={3}>3 Vessels</option>
              </select>
            </div>

            {/* Thalassemia (thal) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Thalassemia (thal)</label>
              <select
                value={formData.thal}
                onChange={(e) => handleInputChange('thal', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Normal (0)</option>
                <option value={1}>Fixed Defect (1)</option>
                <option value={2}>Reversable Defect (2)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Computing Multi-Model Risk Stratification...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compute Patient Risk Probability</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Risk Probability Output & Gauge Card */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-6 border-slate-800 flex flex-col justify-between">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" /> Diagnostic Assessment
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Algorithm: {selectedModel}</span>
            </div>

            {lastPredictionResult ? (
              <div className="space-y-6 text-center">
                {/* Circular Risk Index Display */}
                <div className="relative inline-flex items-center justify-center mx-auto">
                  <div
                    className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl ${
                      lastPredictionResult.risk_category?.includes('Higher')
                        ? 'border-rose-500/80 bg-rose-500/10 shadow-rose-950/50'
                        : lastPredictionResult.risk_category?.includes('Moderate')
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-amber-950/50'
                        : 'border-emerald-500/80 bg-emerald-500/10 shadow-emerald-950/50'
                    }`}
                  >
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {(lastPredictionResult.probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Risk Index</span>
                  </div>
                </div>

                {/* Risk Stratum Badge */}
                <div>
                  <div
                    className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      lastPredictionResult.risk_category?.includes('Higher')
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : lastPredictionResult.risk_category?.includes('Moderate')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {lastPredictionResult.risk_category}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 px-2">
                    {lastPredictionResult.recommendation || 'Clinical risk probability index derived from trained supervised classifier.'}
                  </p>
                </div>

                {/* XAI CTA */}
                <div className="pt-2">
                  <button
                    onClick={handleExplainWithXAI}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Explain Prediction with XAI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Stethoscope className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                <p className="text-xs leading-relaxed max-w-xs mx-auto">
                  Configure patient parameters or select a clinical preset above, then click 'Compute Patient Risk Probability'.
                </p>
              </div>
            )}

            {/* Non-diagnostic Disclaimer */}
            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-amber-300/80 flex items-start gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Academic research output. Probability indicates statistical classification likelihood, not clinical diagnosis.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SQLite Prediction Audit History Table */}
      {predictionHistory.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> Patient Assessment Audit Log (SQLite Logged)
            </h3>
            <span className="text-xs text-slate-400 font-mono">{predictionHistory.length} Recorded Queries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3">Timestamp</th>
                  <th className="px-3.5 py-3">Algorithm</th>
                  <th className="px-3.5 py-3">Patient Age / Sex</th>
                  <th className="px-3.5 py-3">Probability Index</th>
                  <th className="px-3.5 py-3">Risk Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {predictionHistory.slice(0, 5).map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-3.5 py-2.5 text-slate-400">{entry.timestamp || 'Just now'}</td>
                    <td className="px-3.5 py-2.5 font-bold text-white font-sans">{entry.algorithm}</td>
                    <td className="px-3.5 py-2.5">
                      {entry.patient_data?.age}y / {entry.patient_data?.sex === 1 ? 'Male' : 'Female'}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-cyan-300">
                      {((entry.probability || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.risk_category?.includes('Higher')
                            ? 'bg-rose-500/20 text-rose-300'
                            : entry.risk_category?.includes('Moderate')
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {entry.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
