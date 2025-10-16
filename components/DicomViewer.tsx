
import React, { useEffect, useRef, useState } from 'react';
import type { PatientStudy } from '../types.ts';
import { Icon } from './Icon.tsx';
import { Spinner } from './Spinner.tsx';

declare const dwv: any;

interface DicomViewerProps {
  study: PatientStudy | null;
  onDicomDataLoaded: (studyId: string, data: Partial<PatientStudy>) => void;
}

type Tool = 'Scroll' | 'ZoomAndPan' | 'WindowLevel';
type WlPreset = 'auto' | 'brain' | 'abdomen' | 'bone' | 'lung';

const PRESETS: Record<WlPreset, { name: string; wl: [number, number] | null }> = {
  auto: { name: 'Auto', wl: null },
  brain: { name: 'Brain', wl: [40, 80] },
  abdomen: { name: 'Abdomen', wl: [60, 400] },
  bone: { name: 'Bone', wl: [300, 1500] },
  lung: { name: 'Lung', wl: [-400, 1500] },
};

const TOOL_MAP: Record<Tool, string> = {
    Scroll: 'Scroll',
    ZoomAndPan: 'ZoomAndPan',
    WindowLevel: 'WindowLevel',
};

export const DicomViewer: React.FC<DicomViewerProps> = ({ study, onDicomDataLoaded }) => {
  const dwvApp = useRef<any>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('Scroll');
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(0);

  useEffect(() => {
    if (!viewerContainerRef.current) return;

    const containerId = 'dwv-viewer-container';
    viewerContainerRef.current.id = containerId;

    const app = new dwv.App();
    app.init({
      containerDivId: containerId,
      tools: ['Scroll', 'ZoomAndPan', 'WindowLevel'],
      fitToWindow: true,
      gui: [], // Disable default gui to build our own
      skipGetImage: true,
    });

    app.addEventListener('loadstart', () => {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
    });
    app.addEventListener('loadprogress', (event: any) => {
      setLoadingProgress(event.loaded / event.total);
    });
    app.addEventListener('load', () => {
      setIsLoading(false);
      const meta = app.getPatientInfo();
      const patientName = meta.PatientName?.value || '';
      const patientAgeStr = meta.PatientAge?.value;
      const patientAge = patientAgeStr ? parseInt(patientAgeStr.replace(/[^0-9]/g, ''), 10) : 0;
      const patientGender = meta.PatientSex?.value === 'M' ? 'Male' : meta.PatientSex?.value === 'F' ? 'Female' : 'Other';
      const studyType = meta.StudyDescription?.value || 'Unknown Study';
      
      if (study?.id) {
          onDicomDataLoaded(study.id, { patientName, patientAge, patientGender, studyType });
      }

      setTotalSlices(app.getImage()?.getGeometry()?.getSize()?.getNumberOfSlices() || 0);
      setCurrentSlice(app.getImage()?.getGeometry()?.getSliceIndex() || 0);
    });
    app.addEventListener('loadend', () => {
      setIsLoading(false);
    });
    app.addEventListener('error', (event: any) => {
      setIsLoading(false);
      setError(`Failed to load DICOM file. Please ensure it's a valid file. (${event.error?.name || 'Error'})`);
      console.error(event.error);
    });
    app.addEventListener('slicechange', (event: any) => {
        setCurrentSlice(event.index);
    });

    dwvApp.current = app;
    setActiveTool('Scroll');

    return () => {
      app.destroy();
    };
  }, []); 

  useEffect(() => {
    if (dwvApp.current && study) {
      setError(null);
      const data = study.dicomFile ? [study.dicomFile] : [study.dicomImageUrl];
      dwvApp.current.loadURLs(data);
    } else if (dwvApp.current) {
      dwvApp.current.reset();
      setError(null);
    }
  }, [study]);

  useEffect(() => {
    if (dwvApp.current) {
        dwvApp.current.setTool(TOOL_MAP[activeTool]);
    }
  }, [activeTool]);

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
  };

  const handleWlPresetChange = (presetKey: WlPreset) => {
      if (dwvApp.current?.getImage()) {
          const preset = PRESETS[presetKey];
          if(preset.wl) {
            dwvApp.current.setWindowLevel(preset.wl[0], preset.wl[1]);
          } else {
            dwvApp.current.getActiveLayer().setWindowLevelPreset('auto-full');
          }
      }
  };

  const resetViewer = () => {
    if (dwvApp.current?.getImage()) {
      dwvApp.current.resetDisplay();
    }
  };
  
  const renderToolbar = () => (
    <div className="bg-gray-100 p-2 rounded-t-lg border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center space-x-1">
        {(['Scroll', 'ZoomAndPan', 'WindowLevel'] as Tool[]).map(tool => (
            <button key={tool} onClick={() => handleToolChange(tool)} className={`p-2 rounded-md ${activeTool === tool ? 'bg-brand-secondary text-white' : 'hover:bg-gray-200'}`} aria-pressed={activeTool === tool}>
                <Icon icon={tool === 'ZoomAndPan' ? 'pan' : tool === 'WindowLevel' ? 'window-level' : 'scroll'} className="h-5 w-5" title={tool} />
            </button>
        ))}
        <button onClick={resetViewer} className="p-2 rounded-md hover:bg-gray-200">
            <Icon icon="reset" className="h-5 w-5" title="Reset View" />
        </button>
      </div>
       <div className="flex items-center space-x-2">
            <label htmlFor="wl-presets" className="text-xs text-text-secondary sr-only">Window/Level Presets</label>
            <select id="wl-presets" onChange={(e) => handleWlPresetChange(e.target.value as WlPreset)} className="text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-brand-secondary">
                {Object.keys(PRESETS).map(key => (
                    <option key={key} value={key}>{PRESETS[key as WlPreset].name}</option>
                ))}
            </select>
       </div>
    </div>
  );

  return (
    <div className="bg-surface rounded-lg shadow-lg h-full flex flex-col">
      {renderToolbar()}
      <div className="flex-grow relative bg-black rounded-b-lg overflow-hidden">
        {study ? (
          <>
            <div ref={viewerContainerRef} className="w-full h-full"></div>
            {(isLoading || error) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isLoading && <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <Spinner text={`Loading... ${Math.round(loadingProgress * 100)}%`} />
                </div>}
                {error && <div className="absolute inset-0 bg-red-100 text-red-800 flex items-center justify-center p-4 text-center">
                    <p>{error}</p>
                </div>}
              </div>
            )}
            {totalSlices > 1 && !isLoading && !error && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    Slice: {currentSlice + 1} / {totalSlices}
                </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center text-gray-400 p-4">
            <p>Select a study to view the DICOM image.</p>
          </div>
        )}
      </div>
    </div>
  );
};
