import React, { useState } from 'react';
import { Icon } from './Icon.tsx';
import { Spinner } from './Spinner.tsx';

interface PacsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (details: { url: string; port: string; ourAeTitle: string; theirAeTitle: string }) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'error';

export const PacsConnectionModal: React.FC<PacsConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('pacs.example.com');
  const [port, setPort] = useState('11112');
  const [ourAeTitle, setOurAeTitle] = useState('MEDSIGHTAI');
  const [theirAeTitle, setTheirAeTitle] = useState('PACS_SERVER');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('connecting');
    setErrorMessage('');

    // Simulate network delay
    setTimeout(() => {
      // Simulate a random success/failure for demonstration
      if (Math.random() > 0.2) { // 80% success rate
        onConnect({ url, port, ourAeTitle, theirAeTitle });
      } else {
        setStatus('error');
        setErrorMessage('Connection failed. Please check details and try again.');
      }
    }, 1500);
  };

  const handleClose = () => {
    if (status === 'connecting') return;
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const renderButtonContent = () => {
    if (status === 'connecting') {
      return (
        <>
          <Spinner size="sm" />
          <span>Connecting...</span>
        </>
      );
    }
    return 'Connect to PACS';
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      onClick={handleClose}
    >
      <div
        className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-text-primary">PACS Connection</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <Icon icon="close" className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="pacs-url" className="block text-sm font-medium text-text-secondary">
                URL / IP Address
              </label>
              <input
                type="text"
                id="pacs-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="pacs-port" className="block text-sm font-medium text-text-secondary">
                Port
              </label>
              <input
                type="number"
                id="pacs-port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="our-ae-title" className="block text-sm font-medium text-text-secondary">
                Our AE Title
              </label>
              <input
                type="text"
                id="our-ae-title"
                value={ourAeTitle}
                onChange={(e) => setOurAeTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="their-ae-title" className="block text-sm font-medium text-text-secondary">
                Their AE Title
              </label>
              <input
                type="text"
                id="their-ae-title"
                value={theirAeTitle}
                onChange={(e) => setTheirAeTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                required
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>
          <div className="flex items-center justify-end p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'connecting'}
              className="inline-flex justify-center items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-md shadow-sm hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {renderButtonContent()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};