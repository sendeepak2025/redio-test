

import React, { useState } from 'react';
import type { PatientStudy } from '../types.ts';
import { Icon } from './Icon.tsx';
import { Spinner } from './Spinner.tsx';

interface ReportingPanelProps {
  study: PatientStudy | null;
  reportText: string;
  onReportTextChange: (text: string) => void;
  onGenerateReport: (providerNotes: string) => Promise<void>;
  onSaveReport: () => void;
  isGenerating: boolean;
}

export const ReportingPanel: React.FC<ReportingPanelProps> = ({
  study,
  reportText,
  onReportTextChange,
  onGenerateReport,
  onSaveReport,
  isGenerating,
}) => {
  const [providerNotes, setProviderNotes] = useState('');

  return (
    <div className="bg-surface rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-text-primary">Reporting</h2>
      </div>
      {study ? (
        <div className="flex flex-col flex-grow p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="font-bold text-text-primary">{study.patientName}</h3>
            <p className="text-sm text-text-secondary">
              {study.patientAge}yo {study.patientGender} | {study.studyType} | {study.studyDate}
            </p>
          </div>
          
          <div className="flex-grow flex flex-col space-y-2">
            <label htmlFor="report" className="text-sm font-medium text-text-secondary">
              Radiology Report
            </label>
            <textarea
              id="report"
              value={reportText}
              onChange={(e) => onReportTextChange(e.target.value)}
              placeholder="Enter your findings here or use MedGemma to generate a draft."
              className="w-full flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
              rows={15}
            />
          </div>
          
          <div className="bg-blue-50 border-l-4 border-brand-secondary p-3 rounded-r-lg">
             <label htmlFor="providerNotes" className="text-sm font-medium text-text-secondary mb-1 block">
               MedGemma Assistant Notes
             </label>
             <textarea
                id="providerNotes"
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
                placeholder="Add any key observations for the AI..."
                className="w-full p-2 border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-secondary resize-none"
                rows={2}
             />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={() => onGenerateReport(providerNotes)}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Icon icon="ai" className="h-5 w-5" />
                  <span>Generate with MedGemma</span>
                </>
              )}
            </button>
            <button
              onClick={onSaveReport}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-brand-primary bg-brand-light rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
            >
              <Icon icon="save" className="h-5 w-5" />
              <span>Save Report</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-center text-gray-500 p-4">
          <p>Select a patient study to begin reporting.</p>
        </div>
      )}
    </div>
  );
};