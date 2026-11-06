import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('benchmark_uci');
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [preprocessingState, setPreprocessingState] = useState(null);
  const [trainedModels, setTrainedModels] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Active patient data for cross-tab prediction to XAI flow
  const [activePatientData, setActivePatientData] = useState(null);
  const [lastPredictionResult, setLastPredictionResult] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshDatasets = async () => {
    try {
      const res = await api.fetchDatasets();
      if (res && res.datasets) {
        setDatasets(res.datasets);
        if (!selectedDatasetId && res.datasets.length > 0) {
          setSelectedDatasetId(res.datasets[0].dataset_id || res.datasets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  const loadDatasetInfo = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const details = await api.fetchDatasetDetails(id);
      setDatasetDetails(details);
      // Also fetch trained models for this dataset if any
      const modelsRes = await api.fetchModels(id).catch(() => ({ models: [] }));
      setTrainedModels(modelsRes.models || []);
    } catch (err) {
      console.error('Failed to load dataset details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetInfo(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  return (
    <AppContext.Provider
      value={{
        datasets,
        selectedDatasetId,
        setSelectedDatasetId,
        datasetDetails,
        setDatasetDetails,
        preprocessingState,
        setPreprocessingState,
        trainedModels,
        setTrainedModels,
        activeTab,
        setActiveTab,
        loading,
        setLoading,
        notification,
        showNotification,
        activePatientData,
        setActivePatientData,
        lastPredictionResult,
        setLastPredictionResult,
        refreshDatasets,
        loadDatasetInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
