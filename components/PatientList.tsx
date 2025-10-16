import React, { useState } from 'react';
import type { PatientStudy } from '../types.ts';
import { Icon } from './Icon.tsx';

interface PatientListProps {
  studies: PatientStudy[];
  selectedStudyId: string | null;
  onSelectStudy: (study: PatientStudy) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ studies, selectedStudyId, onSelectStudy }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudies = studies.filter(study =>
    study.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.studyType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-text-primary">Patient Studies</h2>
        <div className="relative mt-2">
          <input
            type="text"
            placeholder="Search by name or study..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="search" className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredStudies.length > 0 ? (
          <ul>
            {filteredStudies.map((study) => (
              <li
                key={study.id}
                onClick={() => onSelectStudy(study)}
                className={`p-4 cursor-pointer border-l-4 ${
                  selectedStudyId === study.id
                    ? 'bg-brand-light border-brand-primary'
                    : 'border-transparent hover:bg-gray-50'
                } transition-colors border-b border-gray-200`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary flex items-center">
                      {study.patientName}
                      {study.reportSaved && <Icon icon="report" className="h-4 w-4 text-green-600 ml-2" title="Report saved" />}
                    </p>
                    <p className="text-sm text-text-secondary">{study.studyType}</p>
                    <p className="text-xs text-gray-400 mt-1">{study.studyDate}</p>
                  </div>
                  <span className="text-xs text-text-secondary whitespace-nowrap">{study.patientAge} {study.patientGender.charAt(0)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No studies found.</p>
          </div>
        )}
      </div>
    </div>
  );
};