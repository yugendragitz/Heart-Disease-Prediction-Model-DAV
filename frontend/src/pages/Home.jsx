import React from 'react';
import {
  Activity,
  Database,
  Sliders,
  BarChart2,
  Layers,
  Cpu,
  GitCompare,
  Stethoscope,
  Eye,
  PieChart,
  Award,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/common/MetricCard';

export default function Home() {
  const { setActiveTab, selectedDatasetId, datasetDetails, trainedModels } = useApp();

  const pipelineStages = [
    {
      step: '01',
      id: 'datasets',
      title: 'Data Ingestion',
      desc: 'Benchmark dataset integration (UCI Cleveland, Kaggle, CVD) and schema profiling.',
      icon: Database,
      color: 'cyan',
    },
    {
      step: '02',
      id: 'preprocessing',
      title: 'Preprocessing',
      desc: 'Median/mode imputation, IQR outlier trimming, categorical encoding, and scaling.',
      icon: Sliders,
      color: 'purple',
    },
    {
      step: '03',
      id: 'eda',
      title: 'Exploratory EDA',
      desc: '12-step statistical analytics covering clinical distributions, correlations, and demographics.',
      icon: BarChart2,
      color: 'emerald',
    },
    {
      step: '04',
      id: 'features',
      title: 'Feature Engineering',
      desc: 'Domain ratios (RPP, Chol/Age) and 4 selection methods (Correlation, MI, ANOVA, RFE).',
      icon: Layers,
      color: 'amber',
    },
    {
      step: '05',
      id: 'training',
      title: 'Model Training',
      desc: '8 ML algorithms evaluated with 5-fold stratified cross-validation and hyperparameter tuning.',
      icon: Cpu,
      color: 'rose',
    },
    {
      step: '06',
      id: 'comparison',
      title: 'Model Comparison',
      desc: 'Rigorous benchmark table, multi-model ROC curve overlays, and sensitivity analysis.',
      icon: GitCompare,
      color: 'cyan',
    },
    {
      step: '07',
      id: 'prediction',
      title: 'Patient Risk Scoring',
      desc: 'Clinical risk stratification index with preset profiles and confidence scoring.',
      icon: Stethoscope,
      color: 'purple',
    },
    {
      step: '08',
      id: 'xai',
      title: 'Explainable AI',
      desc: 'Dual XAI framework using TreeSHAP waterfall attributions and LIME decision rules.',
      icon: Eye,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic B.Tech Capstone Project • DAV Specialization</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Comparative Machine Learning Framework for <span className="gradient-text-cyan">Heart Disease Prediction</span>
          </h1>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            An end-to-end data analytics, machine learning, and explainable artificial intelligence (XAI) platform.
            Systematically preprocesses clinical datasets, trains 8 supervised learning algorithms under 5-fold cross-validation,
            conducts comparative diagnostic benchmarking, and explains patient-level risk predictions via SHAP and LIME.
          </p>

          {/* Academic / Research Disclaimer Card */}
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300 mr-1.5">Academic Decision-Support System:</span>
              This framework is engineered strictly as an educational and clinical decision-support research prototype.
              Predictions are categorized using risk probability indexes (e.g. Higher/Lower predicted risk) and do not constitute certified medical diagnosis.
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('prediction')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Interactive Risk Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-xs border border-slate-700 transition-all hover:scale-[1.02]"
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Model Benchmark Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('xai')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-xs border border-slate-700 transition-all hover:scale-[1.02]"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Explainable AI Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Machine Learning Models"
          value="8 Algorithms"
          subtitle="LR, DT, RF, SVM, KNN, NB, XGB, CatBoost"
          icon={Cpu}
          color="cyan"
          trend="5-Fold CV"
        />
        <MetricCard
          title="Explainable AI Engines"
          value="SHAP + LIME"
          subtitle="TreeSHAP waterfall & local decision rules"
          icon={Eye}
          color="purple"
          trend="Dual XAI"
        />
        <MetricCard
          title="Peak Model ROC-AUC"
          value="0.9172"
          subtitle="CatBoost Classifier on Cleveland cohort"
          icon={TrendingUp}
          color="emerald"
          trend="+0.07 vs baseline"
        />
        <MetricCard
          title="Standard Benchmarks"
          value="3 Cohorts"
          subtitle="UCI Cleveland, Kaggle, CVD (2,500+ samples)"
          icon={Database}
          color="amber"
          trend="Validated"
        />
      </div>

      {/* Interactive 8-Stage Research Pipeline Flowchart */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" /> Research & Analytics Pipeline Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Click on any stage below to jump directly into that interactive module.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
            End-to-End DAV Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                onClick={() => setActiveTab(stage.id)}
                className="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-950/30 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">
                    STAGE {stage.step}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors mb-1.5 flex items-center justify-between">
                  {stage.title}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cyan-400" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Research Highlights & Key Findings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Top ML Algorithms</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Across 5-fold stratified cross-validation on the Cleveland dataset, CatBoost (ROC-AUC 0.917), Logistic Regression (0.916), and Naive Bayes (0.912) demonstrated superior predictive discrimination.
          </p>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Highest sensitivity: Random Forest & CatBoost (Recall &gt; 86%)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Fastest convergence: Logistic Regression (0.008s)</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-purple-400">
            <Eye className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">XAI Clinical Concordance</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            SHAP and LIME identified 4 dominant clinical features driving cardiovascular risk: fluoroscopy major vessels (ca), chest pain type (cp), maximum heart rate (thalach), and ST depression (oldpeak).
          </p>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Reversible defect (thal=2) increases log-odds by +0.74</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Preserved thalach (&gt;160 bpm) acts as a protective biomarker</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Academic Deliverables</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Satisfies all components of the Data Analytics & Visualization syllabus: ETL, descriptive/inferential stats, correlation matrices, dimensionality selection, supervised classification, and explainability.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('results')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Full Research Synthesis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
