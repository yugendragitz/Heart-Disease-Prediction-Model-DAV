import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Trophy,
  Award,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';

export default function ModelComparison() {
  const { selectedDatasetId, trainedModels, setTrainedModels, setActiveTab, showNotification } = useApp();
  const [sortField, setSortField] = useState('roc_auc');
  const [sortAsc, setSortAsc] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComparison = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    try {
      const res = await api.compareModels({ dataset_id: selectedDatasetId });
      if (res && res.comparison) {
        setComparisonData(res.comparison);
      } else if (trainedModels?.length > 0) {
        // Fallback to trainedModels formatted
        const formatted = trainedModels.map((m) => ({
          algorithm: m.algorithm,
          name: m.name,
          accuracy: m.metrics?.accuracy || 0,
          precision: m.metrics?.precision || 0,
          recall: m.metrics?.recall || 0,
          specificity: m.metrics?.specificity || 0,
          f1: m.metrics?.f1 || 0,
          roc_auc: m.metrics?.roc_auc || 0,
          cv_mean: m.cv_mean || 0,
          cv_std: m.cv_std || 0,
          training_time: m.training_time || 0,
          roc_curve: m.roc_curve || null,
        }));
        setComparisonData(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedDatasetId, trainedModels]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = [...comparisonData].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const bestRocAuc = comparisonData.length > 0 ? [...comparisonData].sort((a, b) => b.roc_auc - a.roc_auc)[0] : null;
  const bestRecall = comparisonData.length > 0 ? [...comparisonData].sort((a, b) => b.recall - a.recall)[0] : null;
  const fastest = comparisonData.length > 0 ? [...comparisonData].sort((a, b) => a.training_time - b.training_time)[0] : null;

  // Multi-model ROC Curve formatting
  // Create unified FPR grid [0.0, 0.1, 0.2, 0.3, ..., 1.0] for plotting multiple ROC curves
  const rocPlotData = [];
  for (let step = 0; step <= 10; step++) {
    const fprVal = step / 10;
    const point = { fpr: fprVal, diagonal: fprVal };
    comparisonData.forEach((m) => {
      // Find closest TPR for this FPR in model's roc_curve
      if (m.roc_curve && m.roc_curve.fpr && m.roc_curve.tpr) {
        let bestTpr = 0;
        for (let i = 0; i < m.roc_curve.fpr.length; i++) {
          if (m.roc_curve.fpr[i] <= fprVal) {
            bestTpr = Math.max(bestTpr, m.roc_curve.tpr[i]);
          }
        }
        point[m.algorithm] = Number(bestTpr.toFixed(3));
      } else {
        // Approximate theoretical curve using AUC
        const auc = m.roc_auc || 0.8;
        const estTpr = Math.min(1.0, Math.pow(fprVal, 1 / (auc * 3)));
        point[m.algorithm] = Number(estTpr.toFixed(3));
      }
    });
    rocPlotData.push(point);
  }

  const MODEL_COLORS = {
    logistic_regression: '#06b6d4',
    decision_tree: '#eab308',
    random_forest: '#10b981',
    svm: '#8b5cf6',
    knn: '#ec4899',
    naive_bayes: '#3b82f6',
    xgboost: '#f97316',
    catboost: '#f43f5e',
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GitCompare className="w-7 h-7 text-cyan-400" />
            Comparative Machine Learning Model Benchmarking
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rigorous cross-algorithmic performance evaluation across diagnostic accuracy, clinical sensitivity, ROC-AUC, and latency.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('prediction')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Deploy in Patient Inference</span>
          </button>
        </div>
      </div>

      {comparisonData.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl space-y-4">
          <Cpu className="w-12 h-12 text-cyan-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Models Trained Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Train the 8 supervised learning algorithms under the Model Training tab to generate the full comparative benchmark matrix.
          </p>
          <button
            onClick={() => setActiveTab('training')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-semibold text-xs hover:bg-cyan-400 transition-colors inline-flex items-center gap-2"
          >
            <span>Go to Model Training</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Performance Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestRocAuc && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/30 flex items-center space-x-4 shadow-lg shadow-cyan-950/30">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    Highest ROC-AUC (Discrimination)
                  </span>
                  <div className="text-lg font-extrabold text-white mt-0.5">{bestRocAuc.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    AUC: <span className="text-cyan-300 font-bold">{bestRocAuc.roc_auc.toFixed(4)}</span> • Acc: {(bestRocAuc.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {bestRecall && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 flex items-center space-x-4 shadow-lg shadow-emerald-950/30">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Highest Clinical Sensitivity (Recall)
                  </span>
                  <div className="text-lg font-extrabold text-white mt-0.5">{bestRecall.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Recall: <span className="text-emerald-300 font-bold">{(bestRecall.recall * 100).toFixed(1)}%</span> (Minimal false negatives)
                  </div>
                </div>
              </div>
            )}

            {fastest && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 flex items-center space-x-4 shadow-lg shadow-purple-950/30">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                    Fastest Execution Latency
                  </span>
                  <div className="text-lg font-extrabold text-white mt-0.5">{fastest.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Training Time: <span className="text-purple-300 font-bold">{fastest.training_time.toFixed(4)}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Comparative Benchmark Table */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" /> Academic Performance Matrix (8 Classifiers)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click column headers to sort by specific evaluation metric.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Sorted by: <span className="text-cyan-400 font-bold uppercase">{sortField.replace('_', ' ')}</span> ({sortAsc ? 'Asc' : 'Desc'})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-3.5 py-3">Algorithm</th>
                    <th
                      onClick={() => handleSort('accuracy')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Accuracy</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('precision')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Precision</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('recall')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Recall (Sensitivity)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('specificity')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Specificity</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('f1')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>F1-Score</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('roc_auc')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1 text-cyan-400">
                        <span>ROC-AUC</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('cv_mean')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>5-Fold CV Mean</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('training_time')}
                      className="px-3.5 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Time (s)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {sortedData.map((row, idx) => {
                    const isTop = idx === 0 && sortField === 'roc_auc';
                    return (
                      <tr
                        key={row.algorithm}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isTop ? 'bg-cyan-500/5' : ''
                        }`}
                      >
                        <td className="px-3.5 py-3 font-bold text-white font-sans flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: MODEL_COLORS[row.algorithm] || '#06b6d4' }}
                          ></span>
                          <span>{row.name}</span>
                          {isTop && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold uppercase">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">{((row.accuracy || 0) * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3">{((row.precision || 0) * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 font-semibold text-emerald-400">{((row.recall || 0) * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3">{((row.specificity || 0) * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 font-semibold text-purple-400">{(row.f1 || 0).toFixed(3)}</td>
                        <td className="px-3.5 py-3 font-bold text-cyan-300 text-sm">{(row.roc_auc || 0).toFixed(4)}</td>
                        <td className="px-3.5 py-3">
                          {((row.cv_mean || 0) * 100).toFixed(1)}% <span className="text-slate-500 text-[10px]">±{((row.cv_std || 0) * 100).toFixed(1)}%</span>
                        </td>
                        <td className="px-3.5 py-3 text-slate-400">{(row.training_time || 0).toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Benchmark Charts: Multi-Metric Bar & Multi-Model ROC Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-Metric Bar Chart */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Multi-Metric Performance Overview
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Accuracy vs Recall vs ROC-AUC</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData.map((m) => ({
                      name: m.name.split(' ')[0], // short name
                      Accuracy: Number((m.accuracy * 100).toFixed(1)),
                      Recall: Number((m.recall * 100).toFixed(1)),
                      ROCAUC: Number((m.roc_auc * 100).toFixed(1)),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[60, 100]} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-white mb-1">{label}</p>
                              {payload.map((entry, idx) => (
                                <p key={idx} style={{ color: entry.color }} className="font-mono">
                                  {entry.name}: {entry.value}%
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Accuracy" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Recall" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ROCAUC" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-Model ROC Curves Overlay */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" /> Multi-Model ROC Curves Overlay
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">TPR vs FPR</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocPlotData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="fpr" stroke="#64748b" fontSize={11} label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 1]} label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs max-h-48 overflow-y-auto">
                              <p className="font-bold text-white">FPR: {label}</p>
                              {payload.filter((p) => p.dataKey !== 'diagonal').map((entry, idx) => (
                                <p key={idx} style={{ color: entry.color }} className="font-mono text-[11px]">
                                  {entry.name}: {entry.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="diagonal" name="Chance (0.5)" stroke="#475569" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    {comparisonData.slice(0, 5).map((m) => (
                      <Line
                        key={m.algorithm}
                        type="monotone"
                        dataKey={m.algorithm}
                        name={`${m.name.split(' ')[0]} (${m.roc_auc.toFixed(2)})`}
                        stroke={MODEL_COLORS[m.algorithm] || '#06b6d4'}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
