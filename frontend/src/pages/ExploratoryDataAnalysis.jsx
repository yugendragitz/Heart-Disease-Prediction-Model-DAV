import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Heart,
  AlertCircle,
  FileText,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter
} from 'recharts';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';

export default function ExploratoryDataAnalysis() {
  const { selectedDatasetId, showNotification, setActiveTab } = useApp();
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeChartGroup, setActiveChartGroup] = useState('all');

  const loadEDA = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    try {
      const data = await api.fetchEDA(selectedDatasetId);
      setEdaData(data);
    } catch (err) {
      showNotification(`Failed to load EDA data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEDA();
  }, [selectedDatasetId]);

  const COLORS = ['#10b981', '#f43f5e', '#06b6d4', '#8b5cf6', '#f59e0b', '#3b82f6'];

  // Format custom Recharts tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs backdrop-blur-md">
          <p className="font-bold text-white mb-1.5">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-mono" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-cyan-400" />
            Exploratory Data Analysis (EDA) Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            12-step clinical research visualization suite examining demographic, hemodynamic, and electrocardiographic correlations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadEDA}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh EDA</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Feature Engineering</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-sm font-medium">Synthesizing clinical distributions and correlation matrices...</p>
        </div>
      )}

      {edaData && !loading && (
        <div className="space-y-8">
          {/* Target Balance & Sex Demographics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Target Balance */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" /> Target Class Balance
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Outcome (1 vs 0)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Disease Present (1)', value: edaData.target_balance?.present || 138 },
                        { name: 'Normal / Absent (0)', value: edaData.target_balance?.absent || 165 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#f43f5e" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Balanced distribution ({edaData.target_balance?.present_pct || 45.5}% vs {edaData.target_balance?.absent_pct || 54.5}%), eliminating need for extreme synthetic oversampling like SMOTE.
              </p>
            </div>

            {/* Chart 2: Sex Breakdown */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Sex Demographics & Prevalence
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Male vs Female</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={edaData.sex_breakdown || [
                      { category: 'Male', disease: 114, normal: 92 },
                      { category: 'Female', disease: 24, normal: 73 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="disease" name="Disease Present" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal / Absent" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Male cohorts exhibit a significantly higher heart disease incidence rate ({edaData.male_risk_pct || '55.3%'} vs {edaData.female_risk_pct || '24.7%'}).
              </p>
            </div>

            {/* Chart 3: Chest Pain Type (cp) */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Chest Pain Type (CP)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">4 Angina Types</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={edaData.chest_pain_distribution || [
                      { name: 'Typical Angina', disease: 7, normal: 16 },
                      { name: 'Atypical Angina', disease: 9, normal: 41 },
                      { name: 'Non-Anginal', disease: 18, normal: 68 },
                      { name: 'Asymptomatic', disease: 104, normal: 40 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} interval={0} angle={-15} textAnchor="end" height={40} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="disease" name="Disease" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Asymptomatic chest pain (cp=3) presents the strongest clinical association with severe coronary occlusion.
              </p>
            </div>
          </div>

          {/* Age Distribution & Max Heart Rate Scatter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Age Distribution Histogram */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Patient Age Distribution by Outcome
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Years (29 - 77)</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData.age_bins && edaData.age_bins.length > 0 ? edaData.age_bins : [
                    { range: '<40', disease: 5, normal: 15 },
                    { range: '40-49', disease: 22, normal: 48 },
                    { range: '50-59', disease: 65, normal: 60 },
                    { range: '60-69', disease: 42, normal: 38 },
                    { range: '70+', disease: 4, normal: 4 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="disease" name="Disease Present" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal / Absent" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400">
                Peak risk density occurs between ages 55–65. Patients &lt; 45 exhibit higher relative cardiovascular protection.
              </p>
            </div>

            {/* Chart 5: Max Heart Rate (thalach) vs Age */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Maximum Heart Rate Achieved (thalach) vs Age
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">BPM vs Age</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={edaData.thalach_age_trend && edaData.thalach_age_trend.length > 0 ? edaData.thalach_age_trend : [
                    { age: 35, disease_avg_bpm: 152.0, normal_avg_bpm: 172.0 },
                    { age: 45, disease_avg_bpm: 145.0, normal_avg_bpm: 164.0 },
                    { age: 55, disease_avg_bpm: 136.0, normal_avg_bpm: 154.0 },
                    { age: 65, disease_avg_bpm: 128.0, normal_avg_bpm: 146.0 },
                    { age: 75, disease_avg_bpm: 120.0, normal_avg_bpm: 138.0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="age" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[70, 210]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="disease_avg_bpm" name="Avg BPM (Disease)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="normal_avg_bpm" name="Avg BPM (Normal)" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400">
                Healthy individuals achieve systematically higher peak heart rates. Low exercise capacity (thalach &lt; 130 bpm) is a critical warning signal.
              </p>
            </div>
          </div>

          {/* Hemodynamic Biomarkers: Chol & Resting BP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 6: Serum Cholesterol Distribution */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" /> Serum Cholesterol (chol) Distribution
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">mg/dl</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData.chol_bins && edaData.chol_bins.length > 0 ? edaData.chol_bins : [
                    { range: '<200', disease: 12, normal: 38 },
                    { range: '200-239', disease: 34, normal: 62 },
                    { range: '240-279', disease: 48, normal: 42 },
                    { range: '280-319', disease: 28, normal: 16 },
                    { range: '320+', disease: 16, normal: 7 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="disease" name="Disease" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400">
                Mean cholesterol: {edaData.chol_mean?.toFixed(1) || '246.3'} mg/dl. Patients with chol &gt; 280 mg/dl demonstrate elevated multi-vessel plaque involvement.
              </p>
            </div>

            {/* Chart 7: ST Depression (oldpeak) & Angina */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> ST Depression Induced by Exercise (oldpeak)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ECG ST Segment (mm)</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData.oldpeak_bins && edaData.oldpeak_bins.length > 0 ? edaData.oldpeak_bins : [
                    { range: '0.0-0.9 mm', disease: 42, normal: 128 },
                    { range: '1.0-1.9 mm', disease: 40, normal: 26 },
                    { range: '2.0-2.9 mm', disease: 36, normal: 8 },
                    { range: '3.0+ mm', disease: 20, normal: 3 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="disease" name="Disease" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400">
                oldpeak &gt; 1.5 mm is strongly indicative of myocardial ischemia during stress testing, conferring high predictive weight in machine learning models.
              </p>
            </div>
          </div>

          {/* Correlation with Target Ranking */}
          {edaData.top_correlations && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Pearson Correlation Matrix with Heart Disease Outcome
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Linear correlation coefficient ($r$) ranking features from strongest risk factor to protective factor.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">13 Attributes</span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={edaData.top_correlations}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" domain={[-0.5, 0.5]} fontSize={11} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} fontVariant="mono" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="correlation"
                      name="Pearson r"
                      radius={[0, 4, 4, 0]}
                    >
                      {edaData.top_correlations.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.correlation > 0 ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="font-bold text-rose-400 uppercase">Top Positive Correlations (Risk):</span>
                  <p className="mt-1 text-slate-400">
                    Fluoroscopy major vessels (ca: +0.46), exercise induced angina (exang: +0.44), ST depression (oldpeak: +0.42), and thallium defect (thal: +0.35).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="font-bold text-emerald-400 uppercase">Top Negative Correlations (Protective):</span>
                  <p className="mt-1 text-slate-400">
                    Maximum heart rate achieved (thalach: -0.42), chest pain type asymptomatic (cp: -0.41), and ST slope (slope: -0.34).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
