import React from 'react';
import { ShieldAlert, Database, RefreshCw, Sparkles, BookOpen, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Topbar() {
  const {
    datasets,
    selectedDatasetId,
    setSelectedDatasetId,
    refreshDatasets,
    loadDatasetInfo,
    loading,
    notification,
    setActiveTab,
  } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 select-none">
      {/* Title & Research Tag */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
              Comparative Machine Learning Framework for Heart Disease Prediction
            </h2>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              DAV Specialization 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Data Analytics</span> • <span>Interactive Visualization</span> • <span>Dual XAI (SHAP + LIME)</span>
          </p>
        </div>
      </div>

      {/* Actions, Dataset Selector & Academic Disclaimer */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Research Disclaimer Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium" title="For research & clinical decision-support only. Not a medical diagnosis replacement.">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Academic Decision-Support Only</span>
          <span className="sm:hidden">Decision-Support</span>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <Database className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-2 py-0.5"
          >
            {datasets.map((d) => {
              const id = d.dataset_id || d.id;
              const count = d.rows ?? d.rows_count ?? d.total_samples ?? '';
              return (
                <option key={id} value={id} className="bg-slate-900 text-slate-200">
                  {d.name} {count !== '' ? `(${count} rows)` : ''}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => {
              refreshDatasets();
              if (selectedDatasetId) loadDatasetInfo(selectedDatasetId);
            }}
            disabled={loading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
            title="Refresh active dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Quick jump to prediction */}
        <button
          onClick={() => setActiveTab('prediction')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Patient Inference</span>
        </button>
      </div>

      {/* Floating or Top Alert Notification if available */}
      {notification && (
        <div className="absolute top-full left-0 right-0 px-6 py-2 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between shadow-xl z-50 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </header>
  );
}
