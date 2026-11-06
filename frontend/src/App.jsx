import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Page Imports
import Home from './pages/Home';
import AboutProject from './pages/AboutProject';
import DatasetManagement from './pages/DatasetManagement';
import DataPreprocessing from './pages/DataPreprocessing';
import ExploratoryDataAnalysis from './pages/ExploratoryDataAnalysis';
import FeatureEngineering from './pages/FeatureEngineering';
import ModelTraining from './pages/ModelTraining';
import ModelComparison from './pages/ModelComparison';
import Prediction from './pages/Prediction';
import ExplainableAI from './pages/ExplainableAI';
import VisualizationDashboard from './pages/VisualizationDashboard';
import ResearchResults from './pages/ResearchResults';

function AppContent() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'about':
        return <AboutProject />;
      case 'datasets':
        return <DatasetManagement />;
      case 'preprocessing':
        return <DataPreprocessing />;
      case 'eda':
        return <ExploratoryDataAnalysis />;
      case 'features':
        return <FeatureEngineering />;
      case 'training':
        return <ModelTraining />;
      case 'comparison':
        return <ModelComparison />;
      case 'prediction':
        return <Prediction />;
      case 'xai':
        return <ExplainableAI />;
      case 'dashboard':
        return <VisualizationDashboard />;
      case 'results':
        return <ResearchResults />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Topbar />

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        {/* Academic Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/60 px-6 py-4 text-center text-xs text-slate-500 select-none">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              B.Tech Data Analytics & Visualization (DAV) Capstone Project • Comparative Machine Learning Framework
            </p>
            <p className="text-[11px] text-slate-600">
              Academic Decision-Support Prototype • Educational Use Only
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
