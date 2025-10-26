import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Description as ReportIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import SignatureCanvas from './SignatureCanvas';

interface ReportEditorProps {
  analysisId?: string;
  reportId?: string;
  studyInstanceUID: string;
  patientInfo?: {
    patientID: string;
    patientName: string;
    modality: string;
  };
  onReportCreated?: (reportId: string) => void;
  onReportSigned?: () => void;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken') || 
         sessionStorage.getItem('accessToken') || 
         localStorage.getItem('token');
};

const ReportEditorMUI: React.FC<ReportEditorProps> = ({
  analysisId,
  reportId,
  studyInstanceUID,
  patientInfo,
  onReportCreated,
  onReportSigned
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form fields
  const [findingsText, setFindingsText] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [technique, setTechnique] = useState('');
  
  // Signature
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState('');

  useEffect(() => {
    if (reportId) {
      loadReport();
    } else if (analysisId) {
      createDraftFromAI();
    }
  }, [reportId, analysisId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const r = response.data.report;
        setReport(r);
        setFindingsText(r.findingsText || '');
        setImpression(r.impression || '');
        setRecommendations(r.recommendations || '');
        setClinicalHistory(r.clinicalHistory || '');
        setTechnique(r.technique || '');
      }
    } catch (err) {
      console.error('Error loading report:', err);
      alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const createDraftFromAI = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        alert('⚠️ Authentication required. Please login first.');
        setLoading(false);
        return;
      }

      let username = 'Radiologist';
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          username = user.username || user.name || 'Radiologist';
        }
      } catch (e) {
        console.warn('Could not parse user data');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/from-ai/${analysisId}`,
        {
          radiologistName: username,
          studyInstanceUID: studyInstanceUID,
          ...patientInfo
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const r = response.data.report;
        console.log('📄 Report received from backend:', r);
        console.log('📝 Findings text length:', r.findingsText?.length || 0);
        console.log('💡 Impression length:', r.impression?.length || 0);
        console.log('🔬 Technique length:', r.technique?.length || 0);
        
        setReport(r);
        setFindingsText(r.findingsText || '');
        setImpression(r.impression || '');
        setRecommendations(r.recommendations || '');
        setClinicalHistory(r.clinicalHistory || '');
        setTechnique(r.technique || '');

        if (onReportCreated) {
          onReportCreated(r.reportId);
        }
        
        console.log('✅ Report state updated successfully');
      }
    } catch (err: any) {
      console.error('Error creating draft:', err);
      alert(err.response?.data?.error || 'Failed to create draft report');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!report) return;
    
    try {
      setSaving(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        setSaving(false);
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${report.reportId}`,
        {
          findingsText,
          impression,
          recommendations,
          clinicalHistory,
          technique
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReport(response.data.report);
        alert('✅ Report saved successfully');
      }
    } catch (err: any) {
      console.error('Error saving report:', err);
      alert(err.response?.data?.error || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const signReport = async () => {
    if (!report) return;
    
    if (!signatureText && !signatureDataUrl) {
      alert('⚠️ Please provide a signature (text or draw)');
      return;
    }
    
    try {
      setSigning(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        setSigning(false);
        return;
      }

      const formData = new FormData();
      if (signatureText) {
        formData.append('signatureText', signatureText);
      }
      if (signatureDataUrl) {
        // Convert data URL to blob (without fetch to avoid CSP issues)
        const base64Data = signatureDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        formData.append('signature', blob, 'signature.png');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${report.reportId}/sign`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setReport(response.data.report);
        alert('✅ Report signed and finalized!');
        
        if (onReportSigned) {
          onReportSigned();
        }
      }
    } catch (err: any) {
      console.error('Error signing report:', err);
      alert(err.response?.data?.error || 'Failed to sign report');
    } finally {
      setSigning(false);
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setShowSignatureCanvas(false);
    alert('✅ Signature saved! Now click "Sign & Finalize"');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!report) {
    return (
      <Alert severity="info">
        No report loaded. Please try again.
      </Alert>
    );
  }

  const isFinal = report.reportStatus === 'final';

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReportIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Medical Report Editor
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Report ID: {report.reportId}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={report.reportStatus.toUpperCase()}
            color={isFinal ? 'success' : 'warning'}
            sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AssignmentIcon />} label="Report Content" />
          <Tab icon={<EditIcon />} label="Signature" disabled={isFinal} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Clinical History */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Clinical History
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                disabled={isFinal}
                placeholder="Enter patient's clinical history..."
                variant="outlined"
              />
            </CardContent>
          </Card>

          {/* Technique */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Technique
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                disabled={isFinal}
                placeholder="Enter imaging technique..."
                variant="outlined"
              />
            </CardContent>
          </Card>

          {/* Findings */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Findings *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={findingsText}
                onChange={(e) => setFindingsText(e.target.value)}
                disabled={isFinal}
                placeholder="Enter detailed findings..."
                variant="outlined"
                required
              />
            </CardContent>
          </Card>

          {/* Impression */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Impression *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                disabled={isFinal}
                placeholder="Enter impression/conclusion..."
                variant="outlined"
                required
              />
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Recommendations
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                disabled={isFinal}
                placeholder="Enter recommendations..."
                variant="outlined"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isFinal && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<SaveIcon />}
                onClick={saveReport}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={() => setActiveTab(1)}
              >
                Next: Add Signature →
              </Button>
            </Box>
          )}

          {isFinal && (
            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="h6">Report Finalized</Typography>
              This report has been signed and cannot be edited.
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 1 && !isFinal && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Digital Signature
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* Text Signature */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Option 1: Text Signature
                </Typography>
                <TextField
                  fullWidth
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="e.g., Dr. John Smith, MD"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Box>

              <Divider sx={{ my: 3 }}>
                <Chip label="OR" />
              </Divider>

              {/* Canvas Signature */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Option 2: Draw Signature
                </Typography>
                
                {!signatureDataUrl && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<EditIcon />}
                    onClick={() => setShowSignatureCanvas(true)}
                    fullWidth
                  >
                    Open Signature Canvas
                  </Button>
                )}

                {signatureDataUrl && (
                  <Box>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        display: 'inline-block',
                        border: '2px solid #4caf50'
                      }}
                    >
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        ✓ Signature Saved
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <img
                          src={signatureDataUrl}
                          alt="Signature"
                          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                        />
                      </Box>
                    </Paper>
                    <Button
                      size="small"
                      onClick={() => setSignatureDataUrl(null)}
                      sx={{ mt: 1 }}
                    >
                      Clear & Redraw
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Sign Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setActiveTab(0)}
                >
                  ← Back to Report
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={signReport}
                  disabled={signing || (!signatureText && !signatureDataUrl)}
                >
                  {signing ? 'Signing...' : 'Sign & Finalize Report'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Signature Canvas Dialog */}
      <Dialog
        open={showSignatureCanvas}
        onClose={() => setShowSignatureCanvas(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Draw Your Signature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <SignatureCanvas onSave={handleSignatureSave} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignatureCanvas(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportEditorMUI;
