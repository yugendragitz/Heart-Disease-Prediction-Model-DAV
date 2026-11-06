import React, { useState, useEffect } from 'react';
import {
  PieChart as DashboardIcon,
  Filter,
  RefreshCw,
  Activity,
  Heart,
  TrendingUp,
  Sliders,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import MetricCard from '../components/common/MetricCard';

export default function VisualizationDashboard() {
  const { selectedDatasetId, showNotification } = useApp();

  const [minAge, setMinAge] = useState(25);
  const [maxAge, setMaxAge] = useState(75);
  const [sexFilter, setSexFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    try {
      const res = await api.fetchDashboardData(selectedDatasetId, {
        min_age: minAge,
        max_age: maxAge,
        sex_filter: sexFilter,
        target_filter: targetFilter,
      });
      setDashboardData(res);
    } catch (err) {
      showNotification(`Failed to load dashboard data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDatasetId, minAge, maxAge, sexFilter, targetFilter]);

  const resetFilters = () => {
    setMinAge(25);
    setMaxAge(75);
    setSexFilter('');
    setTargetFilter('');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <DashboardIcon className="w-7 h-7 text-cyan-400" />
            Interactive Clinical Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic demographic and hemodynamic exploration with multi-attribute filtering and live cross-sectional cohort views.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          <span>Cohort Segmentation Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Age Range Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Age Range:</span>
              <span className="font-mono font-bold text-cyan-400">{minAge} - {maxAge} yrs</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="25"
                max="50"
                value={minAge}
                onChange={(e) => setMinAge(parseInt(e.target.value, 10))}
                className="w-1/2 accent-cyan-500 cursor-pointer"
              />
              <input
                type="range"
                min="51"
                max="80"
                value={maxAge}
                onChange={(e) => setMaxAge(parseInt(e.target.value, 10))}
                className="w-1/2 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Sex Filter */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 block">Biological Sex:</label>
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Cohorts (Both)</option>
              <option value="1">Male Only</option>
              <option value="0">Female Only</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 block">Diagnostic Status:</label>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Outcomes</option>
              <option value="1">Disease Present (1)</option>
              <option value="0">Normal / Absent (0)</option>
            </select>
          </div>

          {/* Filter Status Count */}
          <div className="flex flex-col justify-end">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">Cohort Size:</span>
              <span className="font-mono font-bold text-cyan-300">
                {dashboardData?.total_filtered || 0} Patients
              </span>
            </div>
          </div>
        </div>
      </div>

      {dashboardData && (
        <div className="space-y-8">
          {/* Summary Metric Cards for Filtered Cohort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Cohort Disease Rate"
              value={`${(dashboardData.prevalence_rate * 100).toFixed(1)}%`}
              subtitle={`${dashboardData.disease_count || 0} with heart disease`}
              icon={Heart}
              color="rose"
            />
            <MetricCard
              title="Mean Age"
              value={`${dashboardData.mean_age?.toFixed(1) || 0} yrs`}
              subtitle={`Span: ${minAge} to ${maxAge} years`}
              icon={Users}
              color="cyan"
            />
            <MetricCard
              title="Mean Resting BP"
              value={`${dashboardData.mean_trestbps?.toFixed(1) || 0} mmHg`}
              subtitle="Systolic blood pressure"
              icon={Activity}
              color="purple"
            />
            <MetricCard
              title="Mean Max HR"
              value={`${dashboardData.mean_thalach?.toFixed(1) || 0} bpm`}
              subtitle="Peak stress test heart rate"
              icon={TrendingUp}
              color="emerald"
            />
          </div>

          {/* Charts: Age vs Max HR Scatter & Blood Pressure vs Cholesterol Scatter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age vs Max HR */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Patient Age vs Peak Heart Rate (thalach)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Cardiovascular Capacity</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="age" name="Age" unit="y" stroke="#64748b" fontSize={11} domain={[25, 80]} />
                    <YAxis type="number" dataKey="thalach" name="Max HR" unit=" bpm" stroke="#64748b" fontSize={11} domain={[70, 210]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-white">Age: {data.age} yrs</p>
                              <p className="text-cyan-400 font-mono">Max HR: {data.thalach} bpm</p>
                              <p className={data.target === 1 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                {data.target === 1 ? 'Heart Disease: Present' : 'Normal / Absent'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      name="Patients"
                      data={dashboardData.age_vs_thalach || []}
                    >
                      {(dashboardData.age_vs_thalach || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.target === 1 ? '#f43f5e' : '#10b981'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                <span className="text-rose-400 font-bold mr-3">● Red: Disease Present</span>
                <span className="text-emerald-400 font-bold">● Green: Normal / Absent</span>
              </p>
            </div>

            {/* Resting BP vs Cholesterol */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Resting Blood Pressure vs Serum Cholesterol
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Hemodynamics</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="trestbps" name="Resting BP" unit=" mmHg" stroke="#64748b" fontSize={11} domain={[90, 200]} />
                    <YAxis type="number" dataKey="chol" name="Cholesterol" unit=" mg/dl" stroke="#64748b" fontSize={11} domain={[120, 450]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-white">BP: {data.trestbps} mmHg</p>
                              <p className="text-purple-400 font-mono">Chol: {data.chol} mg/dl</p>
                              <p className={data.target === 1 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                {data.target === 1 ? 'Heart Disease: Present' : 'Normal / Absent'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      name="Hemodynamics"
                      data={dashboardData.chol_vs_trestbps || []}
                    >
                      {(dashboardData.chol_vs_trestbps || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.target === 1 ? '#f43f5e' : '#10b981'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Patients with dual hypertension (&gt;140 mmHg) and dyslipidemia (&gt;250 mg/dl) present concentrated disease clustering.
              </p>
            </div>
          </div>

          {/* Age Bracket Risk Distribution */}
          {dashboardData.age_bracket_risk && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" /> Heart Disease Prevalence Across Age Cohorts
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Stratified Risk Analysis</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.age_bracket_risk}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="bracket" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-white mb-1">{label}</p>
                              <p className="text-rose-400 font-mono">Disease Present: {payload[0]?.value}</p>
                              <p className="text-emerald-400 font-mono">Normal: {payload[1]?.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="disease" name="Disease Present" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="normal" name="Normal / Absent" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
