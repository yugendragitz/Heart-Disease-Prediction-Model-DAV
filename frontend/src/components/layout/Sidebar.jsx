import React from 'react';
import {
  Activity,
  Database,
  Sliders,
  BarChart2,
  Cpu,
  Layers,
  GitCompare,
  Stethoscope,
  Eye,
  PieChart,
  Award,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const { activeTab, setActiveTab, selectedDatasetId, datasetDetails, trainedModels } = useApp();

  const navGroups = [
    {
      label: 'RESEARCH OVERVIEW',
      items: [
        { id: 'home', label: 'Project Overview', icon: Activity, badge: 'Home' },
        { id: 'about', label: 'Syllabus & Details', icon: Info },
      ],
    },
    {
      label: 'DATA PIPELINE',
      items: [
        { id: 'datasets', label: 'Dataset Management', icon: Database, badge: datasetDetails ? `${datasetDetails.total_samples}` : null },
        { id: 'preprocessing', label: 'Data Preprocessing', icon: Sliders },
        { id: 'eda', label: 'Exploratory EDA', icon: BarChart2 },
        { id: 'features', label: 'Feature Engineering', icon: Layers },
      ],
    },
    {
      label: 'MACHINE LEARNING',
      items: [
        { id: 'training', label: 'Model Training (8 ML)', icon: Cpu, badge: trainedModels?.length ? `${trainedModels.length}/8` : 'Ready' },
        { id: 'comparison', label: 'Model Comparison', icon: GitCompare },
      ],
    },
    {
      label: 'CLINICAL INFERENCE & XAI',
      items: [
        { id: 'prediction', label: 'Patient Risk Prediction', icon: Stethoscope },
        { id: 'xai', label: 'Explainable AI (SHAP & LIME)', icon: Eye, badge: 'XAI' },
      ],
    },
    {
      label: 'ANALYTICS & SYNTHESIS',
      items: [
        { id: 'dashboard', label: 'Interactive Dashboard', icon: PieChart },
        { id: 'results', label: 'Academic Results & Report', icon: Award },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3.5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
            CardioPredict <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">DAV</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">B.Tech ML & XAI Framework</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Dataset & Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-cyan-400" /> Active Dataset
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="font-semibold text-white truncate capitalize">
            {selectedDatasetId ? selectedDatasetId.replace('_', ' ') : 'None'}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>{datasetDetails ? `${datasetDetails.total_samples} samples` : 'Ready'}</span>
            <span className="text-cyan-400 font-medium">
              {trainedModels.length > 0 ? `${trainedModels.length} models trained` : '0 models'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
