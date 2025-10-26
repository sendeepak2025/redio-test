import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Report {
  _id: string;
  reportId: string;
  reportDate: string;
  reportStatus: 'draft' | 'preliminary' | 'final' | 'amended' | 'cancelled';
  radiologistName: string;
  signedAt?: string;
  modality?: string;
  studyDescription?: string;
  version: number;
}

interface ReportHistoryTabProps {
  studyInstanceUID: string;
}

const ReportHistoryTab: React.FC<ReportHistoryTabProps> = ({ studyInstanceUID }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchReportHistory();
  }, [studyInstanceUID]);

  const fetchReportHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/study/${studyInstanceUID}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (err: any) {
      console.error('Error fetching report history:', err);
      setError(err.response?.data?.error || 'Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSelectedReport(response.data.report);
        setShowReportModal(true);
      }
    } catch (err: any) {
      console.error('Error viewing report:', err);
      alert('Failed to load report details');
    }
  };

  const downloadPDF = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${reportId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      preliminary: 'bg-blue-100 text-blue-800',
      final: 'bg-green-100 text-green-800',
      amended: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ {error}</p>
        <button 
          onClick={fetchReportHistory}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">📋 No reports found for this study</p>
        <p className="text-sm mt-2">Reports will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">📋 Report History</h3>
        <button 
          onClick={fetchReportHistory}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Radiologist</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(report.reportDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {report.radiologistName}
                  {report.signedAt && (
                    <div className="text-xs text-gray-500">
                      Signed: {new Date(report.signedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {report.modality || 'N/A'}
                  {report.studyDescription && (
                    <div className="text-xs text-gray-500">{report.studyDescription}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getStatusBadge(report.reportStatus)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  v{report.version}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewReport(report.reportId)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      title="View Report"
                    >
                      🔍 View
                    </button>
                    {report.reportStatus === 'final' && (
                      <button
                        onClick={() => downloadPDF(report.reportId)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                        title="Download PDF"
                      >
                        ⬇️ PDF
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">📄 Medical Report</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedReport.patientName}</div>
                    <div><span className="font-medium">ID:</span> {selectedReport.patientID}</div>
                    <div><span className="font-medium">Age:</span> {selectedReport.patientAge || 'N/A'}</div>
                    <div><span className="font-medium">Sex:</span> {selectedReport.patientSex || 'N/A'}</div>
                  </div>
                </div>

                {/* Study Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Study Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Modality:</span> {selectedReport.modality}</div>
                    <div><span className="font-medium">Date:</span> {selectedReport.studyDate || 'N/A'}</div>
                    <div className="col-span-2"><span className="font-medium">Description:</span> {selectedReport.studyDescription || 'N/A'}</div>
                  </div>
                </div>

                {/* Findings */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Findings</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.findingsText || 'No findings documented'}</p>
                </div>

                {/* Impression */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Impression</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.impression || 'No impression documented'}</p>
                </div>

                {/* Signature */}
                {selectedReport.reportStatus === 'final' && (
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-gray-700 mb-2">✍️ Digital Signature</h3>
                    <div className="text-sm">
                      <p><span className="font-medium">Signed by:</span> {selectedReport.radiologistName}</p>
                      {selectedReport.signedAt && (
                        <p><span className="font-medium">Date:</span> {new Date(selectedReport.signedAt).toLocaleString()}</p>
                      )}
                      {selectedReport.radiologistSignature && (
                        <p className="mt-2 italic">{selectedReport.radiologistSignature}</p>
                      )}
                      {selectedReport.radiologistSignatureUrl && (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}${selectedReport.radiologistSignatureUrl}`}
                          alt="Signature"
                          className="mt-2 max-w-xs border border-gray-300 rounded"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {selectedReport.reportStatus === 'final' && (
                  <button
                    onClick={() => downloadPDF(selectedReport.reportId)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    ⬇️ Download PDF
                  </button>
                )}
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistoryTab;
