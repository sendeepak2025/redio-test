
import React, { useState, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { PatientList } from './components/PatientList.tsx';
import { DicomViewer } from './components/DicomViewer.tsx';
import { ReportingPanel } from './components/ReportingPanel.tsx';
import { PacsConnectionModal } from './components/PacsConnectionModal.tsx';
import { DragDropOverlay } from './components/DragDropOverlay.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

import { MOCK_STUDIES } from './constants.ts';
import type { PatientStudy } from './types.ts';
import { generateReportWithMedGemma } from './services/geminiService.ts';

function App() {
  const [studies, setStudies] = useState<PatientStudy[]>(MOCK_STUDIES);
  // Set the first study as selected by default to provide an immediate view.
  const [selectedStudy, setSelectedStudy] = useState<PatientStudy | null>(MOCK_STUDIES[0] || null);
  // Initialize report text based on the default selected study.
  const [reportText, setReportText] = useState(MOCK_STUDIES[0]?.reportSaved ? 'This report has been saved.' : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPacsModalOpen, setIsPacsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectStudy = (study: PatientStudy) => {
    setSelectedStudy(study);
    setReportText(study.reportSaved ? 'This report has been saved.' : ''); // Clear or load saved report
  };

  const handleGenerateReport = async (providerNotes: string) => {
    if (!selectedStudy) return;
    setIsGenerating(true);
    setReportText('');
    try {
      const generatedReport = await generateReportWithMedGemma(selectedStudy, providerNotes);
      setReportText(generatedReport);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setReportText("An error occurred while generating the report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = () => {
    if (!selectedStudy) return;
    // In a real app, this would save to a backend. Here, we'll just update the local state.
    const updatedStudies = studies.map(s => 
      s.id === selectedStudy.id ? { ...s, reportSaved: true } : s
    );
    setStudies(updatedStudies);
    // Also update the selected study object itself if it's being displayed.
    setSelectedStudy(prev => prev ? { ...prev, reportSaved: true } : null);
    alert("Report saved successfully!");
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFiles([file]);
    }
    // Reset file input value to allow re-uploading the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleFiles = (files: File[] | FileList) => {
    const file = Array.from(files)[0];
    if (!file) return;

    // Create a new study object for the uploaded file with placeholder data
    const newStudy: PatientStudy = {
      id: `uploaded-${Date.now()}`,
      // Use filename (without extension) as a temporary patient name
      patientName: file.name.replace(/\.[^/.]+$/, ""), 
      patientAge: 0, // Placeholder, will be updated after DICOM parsing
      patientGender: 'Other', // Placeholder
      studyType: 'Uploaded DICOM', // Placeholder
      studyDate: new Date().toISOString().split('T')[0],
      dicomImageUrl: '', // No URL for local files
      dicomFile: file,
      reportSaved: false,
    };

    setStudies(prevStudies => [newStudy, ...prevStudies]);
    handleSelectStudy(newStudy); // Automatically select the new study
  };
  
  // This handler receives the real data parsed from the DICOM file and updates the state
  const handleDicomDataLoaded = (studyId: string, loadedData: Partial<PatientStudy>) => {
    const update = (s: PatientStudy) => ({
        ...s,
        ...loadedData,
        // Keep the filename as a fallback if the DICOM tag is empty
        patientName: loadedData.patientName || s.patientName,
    });

    setStudies(prevStudies => prevStudies.map(s => s.id === studyId ? update(s) : s));
    setSelectedStudy(prev => (prev && prev.id === studyId ? update(prev) : prev));
  };
  
  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-background" onDragEnter={handleDragEnter}>
      <Header onUploadClick={handleUploadClick} onPacsClick={() => setIsPacsModalOpen(true)} />

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-3 h-full min-h-0">
          <ErrorBoundary>
            <PatientList studies={studies} selectedStudyId={selectedStudy?.id || null} onSelectStudy={handleSelectStudy} />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-5 h-full min-h-0">
          <ErrorBoundary>
            <DicomViewer study={selectedStudy} onDicomDataLoaded={handleDicomDataLoaded} />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-4 h-full min-h-0">
          <ErrorBoundary>
            <ReportingPanel 
              study={selectedStudy} 
              reportText={reportText}
              onReportTextChange={setReportText}
              onGenerateReport={handleGenerateReport}
              onSaveReport={handleSaveReport}
              isGenerating={isGenerating}
            />
          </ErrorBoundary>
        </div>
      </main>

      <PacsConnectionModal 
        isOpen={isPacsModalOpen}
        onClose={() => setIsPacsModalOpen(false)}
        onConnect={(details) => {
          console.log("Connecting to PACS with:", details);
          // Here you would implement actual PACS logic
          alert("Connection successful (simulated)!");
          setIsPacsModalOpen(false);
        }}
      />
      
      <DragDropOverlay 
        isVisible={isDragging}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".dcm, application/dicom"
      />
    </div>
  );
}

export default App;
