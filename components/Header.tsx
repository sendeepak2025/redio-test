

import React from 'react';
import { Icon } from './Icon.tsx';

interface HeaderProps {
  onUploadClick: () => void;
  onPacsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick, onPacsClick }) => {
  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Icon icon="logo" className="h-8 w-8 text-brand-primary" />
            <h1 className="text-2xl font-bold text-text-primary">
              MedSight<span className="text-brand-secondary">AI</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onPacsClick}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-brand-primary bg-brand-light rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
            >
              <Icon icon="pacs" className="h-5 w-5" />
              <span>Connect to PACS</span>
            </button>
            <button
              onClick={onUploadClick}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-md hover:bg-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              <Icon icon="upload" className="h-5 w-5" />
              <span>Upload DICOM</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Icon icon="user" className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};