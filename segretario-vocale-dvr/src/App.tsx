import React, { useState, useCallback } from 'react';

import type { ReportData } from './types';
import { Header } from './components/Header';
import { DictationControl } from './components/DictationControl';
import { ReportDisplay } from './components/ReportDisplay';
import { processTranscript } from './services/geminiService';
import { useVoiceToText } from './hooks/useVoiceToText';

const App: React.FC = () => {
  const [report, setReport] = useState<ReportData>({
    workplaces: [],
    assets: [],
    workerGroups: [],
    activities: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAndSetReport = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const newReportData = await processTranscript(transcript);

      setReport(prevReport => {
        // Simple merging logic: avoids duplicates by name
        const mergeByName = (arr1: any[], arr2: any[]) => {
          const combined = [...arr1];
          const names = new Set(arr1.map(item => item.name || item.locationName));
          arr2.forEach(item => {
            if (!names.has(item.name || item.locationName)) {
              combined.push(item);
            }
          });
          return combined;
        };
        
        // For activities, we just append them to keep the history of findings
        const mergedActivities = [...prevReport.activities, ...(newReportData.activities || [])];
        
        // For workplaces, we need to ensure 'photos' property is preserved
        const newWorkplacesWithPhotos = (newReportData.workplaces || []).map(wp => ({ ...wp, photos: [] }));

        return {
          workplaces: mergeByName(prevReport.workplaces, newWorkplacesWithPhotos),
          assets: mergeByName(prevReport.assets, newReportData.assets || []),
          workerGroups: mergeByName(prevReport.workerGroups, newReportData.workerGroups || []),
          activities: mergedActivities,
        };
      });

    } catch (e) {
      console.error(e);
      setError('Errore durante l\'elaborazione della trascrizione. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const { isRecording, startRecording, stopRecording, interimTranscript } = useVoiceToText({onTranscriptReady: processAndSetReport});

  const handleAddPhoto = (locationName: string, photoData: string) => {
    setReport(prevReport => ({
      ...prevReport,
      workplaces: prevReport.workplaces.map(location =>
        location.locationName === locationName
          ? { ...location, photos: [...location.photos, photoData] }
          : location
      ),
    }));
  };
  
  const handleClearReport = () => {
    setReport({
      workplaces: [],
      assets: [],
      workerGroups: [],
      activities: [],
    });
  };
  
  const hasData = report.workplaces.length > 0 || report.assets.length > 0 || report.workerGroups.length > 0 || report.activities.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <DictationControl
            isRecording={isRecording}
            isProcessing={isProcessing}
            startRecording={startRecording}
            stopRecording={stopRecording}
            interimTranscript={interimTranscript}
          />

          {error && <div className="mt-4 p-3 bg-red-800/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

          <ReportDisplay 
            report={report} 
            hasData={hasData}
            onAddPhoto={handleAddPhoto} 
            onClearReport={handleClearReport}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-slate-500">
        <p>Segretario Vocale DVR &copy; 2024. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
