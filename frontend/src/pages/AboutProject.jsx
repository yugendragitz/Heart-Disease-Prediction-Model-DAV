import React from 'react';
import {
  Info,
  BookOpen,
  Award,
  Layers,
  Cpu,
  Eye,
  Activity,
  Code,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function AboutProject() {
  const syllabusUnits = [
    {
      unit: 'Unit 1',
      title: 'Data Ingestion & Clinical Data Cleaning',
      topics: [
        'Missing value imputation (Median, Mean, Mode, Listwise Deletion)',
        'Physiological outlier clipping (IQR 1.5× Winsorization, Z-score 3-sigma)',
        'Continuous feature scaling (StandardScaler, MinMaxScaler, RobustScaler)',
        'Stratified train/test splitting to preserve minority class ratios',
      ],
      icon: Layers,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      unit: 'Unit 2',
      title: 'Exploratory Data Analysis & Visualization',
      topics: [
        '12-step clinical research visualization suite',
        'Univariate and bivariate distribution histograms and density curves',
        'Pearson correlation matrix and target correlation ranking',
        'Dynamic demographic cohort filtering (Age, Sex, Diagnostic Outcome)',
      ],
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      unit: 'Unit 3',
      title: 'Feature Engineering & Multi-Method Selection',
      topics: [
        'Clinical ratio derivation: Rate-Pressure Product (RPP), Chol/Age, Stress Index',
        'Filter selection: Pearson correlation (|r|) and ANOVA F-statistic (SelectKBest)',
        'Information-theoretic selection: Mutual Information gain (non-linear)',
        'Wrapper selection: Recursive Feature Elimination (RFE) via Random Forest',
      ],
      icon: BookOpen,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      unit: 'Unit 4',
      title: 'Supervised Machine Learning & Evaluation',
      topics: [
        '8 ML Classifiers: Logistic Regression, Decision Tree, Random Forest, SVM, KNN, Naive Bayes, XGBoost, CatBoost',
        'Stratified 5-Fold Cross-Validation with fold variance estimation',
        'Comprehensive metrics: Accuracy, Precision, Recall, Specificity, F1-Score, ROC-AUC',
        'Multi-model ROC curve overlays and confusion matrix breakdowns',
      ],
      icon: Cpu,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      unit: 'Unit 5',
      title: 'Explainable Artificial Intelligence (XAI)',
      topics: [
        'SHAP (SHapley Additive exPlanations): TreeExplainer waterfall and local patient attributions',
        'Global feature importance based on mean |SHAP| values',
        'LIME (Local Interpretable Model-agnostic Explanations): Sparse linear surrogate decision rules',
        'Contrastive analysis explaining prediction drivers and protective factors',
      ],
      icon: Eye,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  const techStack = [
    { category: 'Machine Learning', items: 'scikit-learn 1.5, XGBoost, CatBoost, SHAP 0.46, LIME 0.2' },
    { category: 'Backend Architecture', items: 'FastAPI (Python 3.12), SQLite, pandas, numpy, joblib' },
    { category: 'Frontend Interface', items: 'React 19, Vite, Tailwind CSS, Lucide React' },
    { category: 'Data Visualization', items: 'Recharts (SVG Responsive Charts)' },
    { category: 'Dataset Benchmarks', items: 'UCI Cleveland, Kaggle Heart Disease, Cardiovascular Disease Cohort' },
  ];

  const citations = [
    {
      authors: 'Detrano, R., Janosi, A., Steinbrunn, W., et al. (1989)',
      title: 'International application of a new probability algorithm for the diagnosis of coronary artery disease',
      source: 'The American Journal of Cardiology, 64(5), 304-310.',
    },
    {
      authors: 'Lundberg, S. M., & Lee, S. I. (2017)',
      title: 'A unified approach to interpreting model predictions',
      source: 'Advances in Neural Information Processing Systems (NeurIPS), 30.',
    },
    {
      authors: 'Ribeiro, M. T., Singh, S., & Guestrin, C. (2016)',
      title: '"Why should I trust you?": Explaining the predictions of any classifier',
      source: 'ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD), 1135-1144.',
    },
    {
      authors: 'Chen, T., & Guestrin, C. (2016)',
      title: 'XGBoost: A scalable tree boosting system',
      source: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining.',
    },
    {
      authors: 'Prokhorenkova, L., Gusev, G., Vorobev, A., et al. (2018)',
      title: 'CatBoost: unbiased boosting with categorical features',
      source: 'Advances in Neural Information Processing Systems (NeurIPS), 31.',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum & Methodology Specification</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          About the Research Framework & Syllabus Alignment
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Comprehensive academic documentation outlining the university curriculum alignment, architectural specifications, and scientific bibliography.
        </p>
      </div>

      {/* Project Metadata Card */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-cyan-400" /> B.Tech Capstone Project Specification
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Title</span>
            <div className="text-xs font-bold text-white mt-1 leading-snug">
              Comparative Machine Learning Framework for Heart Disease Prediction
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Degree & Specialization</span>
            <div className="text-xs font-bold text-cyan-400 mt-1">
              B.Tech in Data Analytics & Visualization (DAV)
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Core Focus</span>
            <div className="text-xs font-bold text-purple-400 mt-1">
              Machine Learning Benchmarking & Dual XAI (SHAP + LIME)
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Application Type</span>
            <div className="text-xs font-bold text-emerald-400 mt-1">
              Educational & Clinical Decision-Support System
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Alignment Across 5 DAV Units */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Data Analytics & Visualization Syllabus Mapping
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrating exhaustive alignment with all 5 curriculum units of the DAV engineering specialization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syllabusUnits.map((u) => {
            const Icon = u.icon;
            return (
              <div
                key={u.unit}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {u.unit}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${u.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-xs mt-2.5 leading-snug">{u.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-400">
                    {u.topics.map((t, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Stack Architecture */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Code className="w-5 h-5" />
          <h3 className="font-bold text-white text-sm">Full-Stack Technology Stack & Architecture</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {techStack.map((tech) => (
            <div key={tech.category} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{tech.category}</span>
              <div className="text-xs font-mono font-semibold text-slate-200 mt-1">{tech.items}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Citations Bibliography */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-purple-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-bold text-white text-sm">Scientific Bibliography & Benchmark Citations</h3>
        </div>
        <div className="space-y-3 pt-1">
          {citations.map((c, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="font-bold text-slate-200">{c.authors}</span>:{' '}
              <span className="italic text-cyan-300">"{c.title}"</span>.{' '}
              <span className="text-slate-400">{c.source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
