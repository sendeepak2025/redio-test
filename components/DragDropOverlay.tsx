import React from 'react';
import { Icon } from './Icon.tsx';

interface DragDropOverlayProps {
  isVisible: boolean;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isVisible, onDragLeave, onDragOver, onDrop }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="fixed inset-0 bg-blue-100 bg-opacity-90 z-[100] flex items-center justify-center border-4 border-dashed border-brand-secondary transition-opacity"
    >
      <div className="text-center text-brand-primary pointer-events-none">
        <Icon icon="upload" className="h-24 w-24 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Drop DICOM File Here</h2>
        <p className="text-lg mt-2">to upload and view the study</p>
      </div>
    </div>
  );
};