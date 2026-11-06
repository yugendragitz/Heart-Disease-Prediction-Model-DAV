import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  TrendingUp,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import MetricCard from '../components/common/MetricCard';

export default function ModelTraining() {
  const {
    selectedDatasetId,
    trainedModels,
    setTrainedModels,
    showNotification,
    setActiveTab,
  } = useApp();

  const allAlgorithms = [
    { id: 'logistic_regression', name: 'Logistic Regression', type: 'Linear Probabilistic', tag: 'Fast / Interpretable' },
    { id: 'decision_tree', name: 'Decision Tree (CART)', type: 'Tree-based Non-linear', tag: 'Rule-based' },
    { id: 'random_forest', name: 'Random Forest', type: 'Ensemble Bagging', tag: 'High Generalization' },
    { id: 'svm', name: 'Support Vector Machine (SVM)', type: 'Kernel Margin Classifier', tag: 'RBF Kernel' },
    { id: 'knn', name: 'K-Nearest Neighbors (KNN)', type: 'Instance-based Non-parametric', tag: 'Distance Metric' },
    { id: 'naive_bayes', name: 'Gaussian Naive Bayes', type: 'Probabilistic Bayes', tag: 'Conditional Prior' },
    { id: 'xgboost', name: 'XGBoost Classifier', type: 'Gradient Boosted Trees', tag: 'Regularized Boosting' },
    { id: 'catboost', name: 'CatBoost Classifier', type: 'Symmetric Tree Boosting', tag: 'State of the Art' },
  ];

  const [selectedAlgos, setSelectedAlgos] = useState(allAlgorithms.map((a) => a.id));
  const [cvFolds, setCvFolds] = useState(5);
  const [isTraining, setIsTraining] = useState(false);
  const [expandedModel, setExpandedModel] = useState(null);

  const toggleAlgo = (id) => {
    setSelectedAlgos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedAlgos(allAlgorithms.map((a) => a.id));
  };

  const deselectAll = () => {
    setSelectedAlgos([]);
  };

  const handleTrainModels = async () => {
    if (!selectedDatasetId) {
      showNotification('Please select or load a dataset first.', 'error');
      return;
    }
    if (selectedAlgos.length === 0) {
      showNotification('Please select at least one algorithm to train.', 'error');
      return;
    }

    setIsTraining(true);
    try {
      const payload = {
        dataset_id: selectedDatasetId,
        algorithms: selectedAlgos,
        cv_folds: parseInt(cvFolds, 10),
      };

      const res = await api.trainModels(payload);
      if (res && res.trained_models) {
        setTrainedModels(res.trained_models);
        showNotification(`Successfully trained ${res.trained_models.length} machine learning models!`, 'success');
      }
    } catch (err) {
      showNotification(`Model training failed: ${err.message}`, 'error');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-rose-400" />
            Supervised Machine Learning Training Suite (8 Algorithms)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Train and cross-validate linear, kernel, distance, probabilistic, ensemble, and gradient boosting classifiers under stratified k-fold folds.
          </p>
        </div>

        {trainedModels?.length > 0 && (
          <button
            onClick={() => setActiveTab('comparison')}
            className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <GitCompare className="w-4 h-4" />
            <span>Comparative Benchmarking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Configuration & Model Selection Panel */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Model Selection & Cross-Validation Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select target algorithms to benchmark on dataset: <span className="text-cyan-300 font-semibold">{selectedDatasetId}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={selectAll}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Select All (8)
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Algorithm Selection Checkboxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allAlgorithms.map((algo) => {
            const isSelected = selectedAlgos.includes(algo.id);
            return (
              <div
                key={algo.id}
                onClick={() => toggleAlgo(algo.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-900/30 border-slate-800/80 opacity-60 hover:opacity-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs text-white leading-tight">{algo.name}</div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-cyan-500 rounded mt-0.5 pointer-events-none"
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-400">{algo.type}</div>
                <div className="mt-1">
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {algo.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hyperparameter Bar: CV Folds + Execution */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Stratified Cross-Validation:
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[3, 5, 10].map((f) => (
                <button
                  key={f}
                  onClick={() => setCvFolds(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    cvFolds === f
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}-Fold
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              (Stratified to preserve class ratio across splits)
            </span>
          </div>

          <button
            onClick={handleTrainModels}
            disabled={isTraining || selectedAlgos.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
          >
            {isTraining ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Training {selectedAlgos.length} Classifiers & Running {cvFolds}-Fold CV...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Train {selectedAlgos.length} Selected Algorithms</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Trained Models Results Display */}
      {trainedModels?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Trained Model Registry ({trainedModels.length} Models Ready)
            </h2>
            <span className="text-xs text-slate-400">Click any model card to inspect fold scores & confusion matrix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainedModels.map((model) => {
              const isExpanded = expandedModel === model.algorithm;
              return (
                <div
                  key={model.algorithm}
                  className="glass-panel p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-all"
                >
                  <div
                    onClick={() => setExpandedModel(isExpanded ? null : model.algorithm)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{model.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          ROC-AUC: {(model.metrics?.roc_auc || 0).toFixed(4)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Accuracy: {((model.metrics?.accuracy || 0) * 100).toFixed(1)}%</span>
                        <span>•</span>
                        <span>F1: {(model.metrics?.f1 || 0).toFixed(3)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" /> {(model.training_time || 0).toFixed(3)}s
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">5-Fold CV Mean</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          {((model.cv_mean || 0) * 100).toFixed(1)}% (±{((model.cv_std || 0) * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <button className="p-1 text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick Metric Pills */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-center">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[9px] text-slate-500 uppercase">Precision</div>
                      <div className="text-xs font-bold text-white font-mono">{((model.metrics?.precision || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[9px] text-slate-500 uppercase">Recall</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">{((model.metrics?.recall || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[9px] text-slate-500 uppercase">Specificity</div>
                      <div className="text-xs font-bold text-cyan-400 font-mono">{((model.metrics?.specificity || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[9px] text-slate-500 uppercase">F1-Score</div>
                      <div className="text-xs font-bold text-purple-400 font-mono">{(model.metrics?.f1 || 0).toFixed(3)}</div>
                    </div>
                  </div>

                  {/* Expanded: 2x2 Confusion Matrix + CV Folds Scores */}
                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-slate-800 animate-fadeIn">
                      {/* Confusion Matrix */}
                      <div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Confusion Matrix (Test Evaluation Set)</span>
                          <span className="text-[10px] text-slate-500 lowercase">n = {(model.confusion_matrix?.tp || 0) + (model.confusion_matrix?.fp || 0) + (model.confusion_matrix?.tn || 0) + (model.confusion_matrix?.fn || 0)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase block">True Negative (TN)</span>
                            <span className="text-lg font-bold text-white font-mono">{model.confusion_matrix?.tn || 0}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Correctly Classified Normal</span>
                          </div>
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <span className="text-[10px] text-rose-400 font-semibold uppercase block">False Positive (FP)</span>
                            <span className="text-lg font-bold text-white font-mono">{model.confusion_matrix?.fp || 0}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Type I Diagnostic Error</span>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[10px] text-amber-400 font-semibold uppercase block">False Negative (FN)</span>
                            <span className="text-lg font-bold text-white font-mono">{model.confusion_matrix?.fn || 0}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Type II Clinical Miss</span>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase block">True Positive (TP)</span>
                            <span className="text-lg font-bold text-white font-mono">{model.confusion_matrix?.tp || 0}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Correctly Identified Disease</span>
                          </div>
                        </div>
                      </div>

                      {/* Stratified CV Folds breakdown */}
                      {model.cv_scores && (
                        <div>
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Cross-Validation Fold Accuracies ({cvFolds}-Fold)
                          </div>
                          <div className="flex items-center gap-1.5">
                            {model.cv_scores.map((score, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-center"
                              >
                                <div className="text-[9px] text-slate-500">Fold {fIdx + 1}</div>
                                <div className="text-xs font-bold text-cyan-300 font-mono">
                                  {(score * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
