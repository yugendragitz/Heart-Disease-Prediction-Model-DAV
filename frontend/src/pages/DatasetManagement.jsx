import React, { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Table,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import MetricCard from '../components/common/MetricCard';

export default function DatasetManagement() {
  const {
    datasets,
    selectedDatasetId,
    setSelectedDatasetId,
    datasetDetails,
    refreshDatasets,
    loadDatasetInfo,
    showNotification,
    setActiveTab
  } = useApp();

  const [loadingAction, setLoadingAction] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 8;

  const benchmarkPresets = [
    {
      id: 'uci_cleveland',
      name: 'UCI Cleveland Heart Disease',
      samples: 303,
      features: 13,
      description: 'Gold-standard clinical cohort from the Cleveland Clinic Foundation (Dr. Robert Detrano).',
      tag: 'Clinical Benchmark'
    },
    {
      id: 'kaggle_heart',
      name: 'Kaggle Extended Cohort',
      samples: 1025,
      features: 13,
      description: 'Expanded clinical demographic dataset curated for multicenter diagnostic benchmarking.',
      tag: 'Multicenter'
    },
    {
      id: 'cardiovascular_disease',
      name: 'Cardiovascular Risk Cohort',
      samples: 1200,
      features: 13,
      description: 'Community-scale cardiovascular screening cohort with balanced risk strata.',
      tag: 'Community Cohort'
    }
  ];

  const handleSelectBenchmark = async (benchmarkId) => {
    setLoadingAction(true);
    try {
      await api.loadBenchmarkDataset(benchmarkId);
      await refreshDatasets();
      setSelectedDatasetId(benchmarkId);
      await loadDatasetInfo(benchmarkId);
      showNotification(`Benchmark dataset loaded successfully!`, 'success');
    } catch (err) {
      showNotification(`Failed to load benchmark: ${err.message}`, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Only CSV files (.csv) are accepted.');
      return;
    }

    setUploadError(null);
    setLoadingAction(true);
    try {
      const res = await api.uploadDataset(file);
      await refreshDatasets();
      if (res.dataset_id) {
        setSelectedDatasetId(res.dataset_id);
        await loadDatasetInfo(res.dataset_id);
      }
      showNotification(`Dataset '${file.name}' uploaded and registered!`, 'success');
    } catch (err) {
      setUploadError(err.message);
      showNotification(`Upload failed: ${err.message}`, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredPreview = datasetDetails?.preview?.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const paginatedRows = filteredPreview.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-cyan-400" />
            Dataset Acquisition & Ingestion
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Load clinical heart disease benchmark cohorts or ingest custom patient CSV files for analysis.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('preprocessing')}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Sliders className="w-4 h-4" />
          <span>Proceed to Preprocessing</span>
        </button>
      </div>

      {/* Benchmark Cohort Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benchmarkPresets.map((preset) => {
          const isSelected = selectedDatasetId === preset.id;
          return (
            <div
              key={preset.id}
              className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {preset.tag}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base mt-1">{preset.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{preset.description}</p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
                  <span>{preset.samples} Samples</span>
                  <span>•</span>
                  <span>{preset.features} Clinical Features</span>
                </div>
              </div>

              <button
                onClick={() => handleSelectBenchmark(preset.id)}
                disabled={loadingAction || isSelected}
                className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 cursor-default'
                    : 'bg-slate-800 hover:bg-cyan-500 hover:text-white text-slate-200'
                }`}
              >
                {isSelected ? 'Currently Selected' : 'Load Benchmark'}
              </button>
            </div>
          );
        })}
      </div>

      {/* CSV Upload Dropzone */}
      <div className="glass-panel p-6 rounded-2xl border border-dashed border-slate-700/80 hover:border-cyan-500/40 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Upload Custom Clinical CSV Dataset</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Support for 13 standard clinical variables (age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target).
              </p>
              {uploadError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                </p>
              )}
            </div>
          </div>

          <label className="cursor-pointer shrink-0">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loadingAction}
            />
            <span className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors shadow-sm">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Browse CSV File</span>
            </span>
          </label>
        </div>
      </div>

      {/* Active Dataset Metric Summary */}
      {datasetDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Samples"
            value={datasetDetails.total_samples}
            subtitle="Clinical patient observations"
            icon={Table}
            color="cyan"
          />
          <MetricCard
            title="Attributes"
            value={datasetDetails.total_columns}
            subtitle="13 predictors + 1 outcome"
            icon={Database}
            color="purple"
          />
          <MetricCard
            title="Missing Values"
            value={datasetDetails.missing_count || 0}
            subtitle={datasetDetails.missing_count > 0 ? "Imputation required" : "Complete data matrix"}
            icon={AlertCircle}
            color={datasetDetails.missing_count > 0 ? "amber" : "emerald"}
          />
          <MetricCard
            title="Outcome Distribution"
            value={
              datasetDetails.target_distribution
                ? `${datasetDetails.target_distribution['1'] || 0} / ${datasetDetails.target_distribution['0'] || 0}`
                : "Balanced"
            }
            subtitle="Disease Present (1) / Absent (0)"
            icon={Activity}
            color="rose"
          />
        </div>
      )}

      {/* Interactive Data Preview Table */}
      {datasetDetails?.preview && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" /> Patient Micro-data Inspection
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displaying first records of active dataset: <span className="text-cyan-300 font-semibold">{datasetDetails.name}</span>
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter patient rows..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPreviewPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  {datasetDetails.columns.map((col) => (
                    <th key={col} className="px-3.5 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {paginatedRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {datasetDetails.columns.map((col) => {
                      const val = row[col];
                      const isTarget = col.toLowerCase() === 'target';
                      return (
                        <td key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                          {isTarget ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                val === 1 || val === '1'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {val === 1 || val === '1' ? '1 (Disease)' : '0 (Normal)'}
                            </span>
                          ) : (
                            val !== null && val !== undefined ? String(val) : <span className="text-amber-400">NaN</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>
              Showing {Math.min((previewPage - 1) * pageSize + 1, filteredPreview.length)} -{' '}
              {Math.min(previewPage * pageSize, filteredPreview.length)} of {filteredPreview.length} rows
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewPage((p) => Math.max(p - 1, 1))}
                disabled={previewPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-300">
                {previewPage} / {totalPages}
              </span>
              <button
                onClick={() => setPreviewPage((p) => Math.min(p + 1, totalPages))}
                disabled={previewPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema Profiling Table */}
      {datasetDetails?.schema && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Clinical Variable Dictionary & Schema Profiling
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3">Feature Name</th>
                  <th className="px-3.5 py-3">Data Type</th>
                  <th className="px-3.5 py-3">Missing Values</th>
                  <th className="px-3.5 py-3">Mean / Mode</th>
                  <th className="px-3.5 py-3">Min</th>
                  <th className="px-3.5 py-3">Max</th>
                  <th className="px-3.5 py-3">Clinical Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(datasetDetails.schema).map(([col, meta]) => (
                  <tr key={col} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-cyan-300 font-mono">{col}</td>
                    <td className="px-3.5 py-2.5 text-slate-400 font-mono">{meta.dtype}</td>
                    <td className="px-3.5 py-2.5">
                      {meta.missing > 0 ? (
                        <span className="text-amber-400 font-semibold">{meta.missing} ({meta.missing_pct}%)</span>
                      ) : (
                        <span className="text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono">{meta.mean !== undefined ? meta.mean.toFixed(2) : meta.mode}</td>
                    <td className="px-3.5 py-2.5 font-mono">{meta.min !== undefined ? meta.min : '-'}</td>
                    <td className="px-3.5 py-2.5 font-mono">{meta.max !== undefined ? meta.max : '-'}</td>
                    <td className="px-3.5 py-2.5 text-slate-400 max-w-xs">{meta.description || 'Clinical diagnostic measurement'}</td>
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
