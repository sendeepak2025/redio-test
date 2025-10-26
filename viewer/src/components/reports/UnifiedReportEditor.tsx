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
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Description as ReportIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AIIcon,
  Template as TemplateIcon
} from '@mui/icons-material';
import SignatureCanvas from './SignatureCanvas';
import VoiceDictationButton from './modules/VoiceDictationButton';

interface UnifiedReportEditorProps {
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

interface Finding {
  id: string;
  location: string;
  description: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
}

interface Measurement {
  id: string;
  type: string;
  value: number;
  unit: string;
  location: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken') || 
         sessionStorage.getItem('accessToken') || 
         localStorage.getItem('token');
};

const UnifiedReportEditor: React.FC<UnifiedReportEditorProps> = ({
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
  
  // Basic fields
  const [findingsText, setFindingsText] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [technique, setTechnique] = useState('');
  
  // Advanced structured fields
  const [structuredFindings, setStructuredFindings] = useState<Finding[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [recommendationsList, setRecommendationsList] = useState<string[]>([]);
  
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
        return;
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data;
      setReport(data);
      setFindingsText(data.findings || '');
      setImpression(data.impression || '');
      setRecommendations(data.recommendations || '');
      setClinicalHistory(data.clinicalHistory || '');
      setTechnique(data.technique || '');
      setStructuredFindings(data.structuredFindings || []);
      setMeasurements(data.measurements || []);
      setRecommendationsList(data.recommendationsList || []);
      setSignatureDataUrl(data.signature?.imageUrl || null);
      setSignatureText(data.signature?.text || '');
    } catch (error: any) {
      console.error('Error loading report:', error);
      alert(`Failed to load report: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createDraftFromAI = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        return;
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/create-from-analysis`,
        {
          analysisId,
          studyInstanceUID,
          patientInfo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data;
      setReport(data);
      setFindingsText(data.findings || '');
      setImpression(data.impression || '');
      setRecommendations(data.recommendations || '');
      setClinicalHistory(data.clinicalHistory || '');
      setTechnique(data.technique || '');
      
      if (onReportCreated) {
        onReportCreated(data._id);
      }
    } catch (error: any) {
      console.error('Error creating draft:', error);
      alert(`Failed to create draft: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        return;
      }
      
      const reportData = {
        findings: findingsText,
        impression,
        recommendations,
        clinicalHistory,
        technique,
        structuredFindings,
        measurements,
        recommendationsList
      };
      
      const url = report?._id
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${report._id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports`;
      
      const method = report?._id ? 'put' : 'post';
      
      const response = await axios[method](
        url,
        { ...reportData, studyInstanceUID, patientInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReport(response.data);
      alert('✅ Report saved successfully');
    } catch (error: any) {
      console.error('Error saving report:', error);
      alert(`Failed to save: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!signatureDataUrl && !signatureText) {
      alert('Please provide a signature');
      return;
    }
    
    try {
      setSigning(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        return;
      }
      
      const formData = new FormData();
      if (signatureDataUrl) {
        const blob = await fetch(signatureDataUrl).then(r => r.blob());
        formData.append('signature', blob, 'signature.png');
      }
      if (signatureText) {
        formData.append('signatureText', signatureText);
      }
      
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/reports/${report._id}/sign`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      alert('✅ Report signed successfully');
      setShowSignatureCanvas(false);
      if (onReportSigned) {
        onReportSigned();
      }
      loadReport();
    } catch (error: any) {
      console.error('Error signing report:', error);
      alert(`Failed to sign: ${error.response?.data?.message || error.message}`);
    } finally {
      setSigning(false);
    }
  };

  // Structured findings management
  const handleAddFinding = () => {
    const newFinding: Finding = {
      id: Date.now().toString(),
      location: '',
      description: '',
      severity: 'normal'
    };
    setStructuredFindings([...structuredFindings, newFinding]);
  };

  const handleUpdateFinding = (id: string, field: keyof Finding, value: any) => {
    setStructuredFindings(structuredFindings.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleDeleteFinding = (id: string) => {
    setStructuredFindings(structuredFindings.filter(f => f.id !== id));
  };

  // Measurements management
  const handleAddMeasurement = () => {
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      type: '',
      value: 0,
      unit: 'mm',
      location: ''
    };
    setMeasurements([...measurements, newMeasurement]);
  };

  const handleUpdateMeasurement = (id: string, field: keyof Measurement, value: any) => {
    setMeasurements(measurements.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(measurements.filter(m => m.id !== id));
  };

  // Recommendations management
  const handleAddRecommendation = () => {
    if (newRecommendation.trim()) {
      setRecommendationsList([...recommendationsList, newRecommendation.trim()]);
      setNewRecommendation('');
    }
  };

  const handleDeleteRecommendation = (index: number) => {
    setRecommendationsList(recommendationsList.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" gutterBottom>
              <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Medical Report Editor
            </Typography>
            {report?.aiGenerated && (
              <Chip
                icon={<AIIcon />}
                label="AI-Generated Draft"
                color="primary"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {report?.status && (
              <Chip
                label={report.status.toUpperCase()}
                color={report.status === 'signed' ? 'success' : 'default'}
                size="small"
              />
            )}
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || report?.status === 'signed'}
              sx={{ mr: 1 }}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            {report && report.status !== 'signed' && (
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() => setShowSignatureCanvas(true)}
                disabled={!report}
              >
                Sign Report
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={1}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Basic Report" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Structured Findings" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Patient Info" icon={<PersonIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ mt: 2 }}>
        {/* Basic Report Tab */}
        {activeTab === 0 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6">Clinical History</Typography>
                  <VoiceDictationButton
                    onTranscript={(text) => setClinicalHistory(prev => prev + ' ' + text)}
                    fieldName="Clinical History"
                    disabled={report?.status === 'signed'}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={clinicalHistory}
                  onChange={(e) => setClinicalHistory(e.target.value)}
                  placeholder="Enter clinical history and indication for study..."
                  disabled={report?.status === 'signed'}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6">Technique</Typography>
                  <VoiceDictationButton
                    onTranscript={(text) => setTechnique(prev => prev + ' ' + text)}
                    fieldName="Technique"
                    disabled={report?.status === 'signed'}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                  placeholder="Describe imaging technique and parameters..."
                  disabled={report?.status === 'signed'}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6">Findings</Typography>
                  <VoiceDictationButton
                    onTranscript={(text) => setFindingsText(prev => prev + ' ' + text)}
                    fieldName="Findings"
                    disabled={report?.status === 'signed'}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={findingsText}
                  onChange={(e) => setFindingsText(e.target.value)}
                  placeholder="Detailed findings from image analysis..."
                  disabled={report?.status === 'signed'}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6">Impression</Typography>
                  <VoiceDictationButton
                    onTranscript={(text) => setImpression(prev => prev + ' ' + text)}
                    fieldName="Impression"
                    disabled={report?.status === 'signed'}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Summary impression and diagnosis..."
                  disabled={report?.status === 'signed'}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    placeholder="Add recommendation..."
                    disabled={report?.status === 'signed'}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRecommendation()}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddRecommendation}
                    disabled={report?.status === 'signed'}
                  >
                    Add
                  </Button>
                </Box>
                <List>
                  {recommendationsList.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`${index + 1}. ${rec}`} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteRecommendation(index)}
                          disabled={report?.status === 'signed'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Or enter recommendations as free text..."
                  disabled={report?.status === 'signed'}
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Structured Findings Tab */}
        {activeTab === 1 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Structured Findings</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddFinding}
                disabled={report?.status === 'signed'}
              >
                Add Finding
              </Button>
            </Box>

            {structuredFindings.map((finding) => (
              <Card key={finding.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={finding.location}
                        onChange={(e) => handleUpdateFinding(finding.id, 'location', e.target.value)}
                        disabled={report?.status === 'signed'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          value={finding.severity}
                          onChange={(e) => handleUpdateFinding(finding.id, 'severity', e.target.value)}
                          disabled={report?.status === 'signed'}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="mild">Mild</MenuItem>
                          <MenuItem value="moderate">Moderate</MenuItem>
                          <MenuItem value="severe">Severe</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteFinding(finding.id)}
                        disabled={report?.status === 'signed'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={finding.description}
                        onChange={(e) => handleUpdateFinding(finding.id, 'description', e.target.value)}
                        disabled={report?.status === 'signed'}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Measurements</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMeasurement}
                disabled={report?.status === 'signed'}
              >
                Add Measurement
              </Button>
            </Box>

            {measurements.map((measurement) => (
              <Card key={measurement.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Type"
                        value={measurement.type}
                        onChange={(e) => handleUpdateMeasurement(measurement.id, 'type', e.target.value)}
                        disabled={report?.status === 'signed'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={measurement.value}
                        onChange={(e) => handleUpdateMeasurement(measurement.id, 'value', parseFloat(e.target.value))}
                        disabled={report?.status === 'signed'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={measurement.unit}
                          onChange={(e) => handleUpdateMeasurement(measurement.id, 'unit', e.target.value)}
                          disabled={report?.status === 'signed'}
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="degrees">degrees</MenuItem>
                          <MenuItem value="HU">HU</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={measurement.location}
                        onChange={(e) => handleUpdateMeasurement(measurement.id, 'location', e.target.value)}
                        disabled={report?.status === 'signed'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        disabled={report?.status === 'signed'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        )}

        {/* Patient Info Tab */}
        {activeTab === 2 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Patient Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Patient ID"
                  value={patientInfo?.patientID || report?.patientInfo?.patientID || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  value={patientInfo?.patientName || report?.patientInfo?.patientName || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modality"
                  value={patientInfo?.modality || report?.patientInfo?.modality || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Study Instance UID"
                  value={studyInstanceUID}
                  disabled
                />
              </Grid>
              {report?.createdAt && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Created At"
                    value={new Date(report.createdAt).toLocaleString()}
                    disabled
                  />
                </Grid>
              )}
              {report?.signedAt && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Signed At"
                    value={new Date(report.signedAt).toLocaleString()}
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Signature Dialog */}
      <Dialog
        open={showSignatureCanvas}
        onClose={() => setShowSignatureCanvas(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sign Report</DialogTitle>
        <DialogContent>
          <SignatureCanvas
            onSave={(dataUrl) => {
              setSignatureDataUrl(dataUrl);
              setShowSignatureCanvas(false);
              handleSign();
            }}
            onCancel={() => setShowSignatureCanvas(false)}
          />
          <Divider sx={{ my: 2 }}>OR</Divider>
          <TextField
            fullWidth
            label="Type Signature"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder="Type your name to sign electronically"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignatureCanvas(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSign}
            disabled={signing || (!signatureDataUrl && !signatureText)}
          >
            {signing ? 'Signing...' : 'Sign Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedReportEditor;
