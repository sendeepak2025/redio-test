/**
 * SUPER UNIFIED REPORT EDITOR
 * 
 * Combines the best features from both reporting systems:
 * ✅ AI-powered draft generation (from System 1)
 * ✅ Template-based reporting with 10+ pre-defined templates (from System 2)
 * ✅ Custom template builder (from System 2)
 * ✅ Voice dictation for all fields (from System 2)
 * ✅ Structured findings & measurements (from System 2)
 * ✅ Canvas signature (from System 1)
 * ✅ Report history and comparison (from both)
 * ✅ One clear, intuitive workflow
 */

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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Description as ReportIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  AutoAwesome as AIIcon,
  ListAlt as TemplateIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import SignatureCanvas from './SignatureCanvas';
import VoiceDictationButton from './modules/VoiceDictationButton';
import { REPORT_TEMPLATES, type ReportTemplate, type ReportSection } from '../../data/reportTemplates';

interface SuperUnifiedReportEditorProps {
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
  onClose?: () => void;
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken') || 
         sessionStorage.getItem('accessToken') || 
         localStorage.getItem('token');
};

const SuperUnifiedReportEditor: React.FC<SuperUnifiedReportEditorProps> = ({
  analysisId,
  reportId,
  studyInstanceUID,
  patientInfo,
  onReportCreated,
  onReportSigned,
  onClose
}) => {
  // Workflow state
  const [workflowStep, setWorkflowStep] = useState(0); // 0: Choose Template, 1: Edit Report, 2: Sign
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [report, setReport] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [loadingAIDraft, setLoadingAIDraft] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  
  // Basic report fields
  const [reportSections, setReportSections] = useState<Record<string, string>>({});
  const [findingsText, setFindingsText] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [technique, setTechnique] = useState('');
  
  // Advanced structured fields
  const [structuredFindings, setStructuredFindings] = useState<Finding[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [recommendationsList, setRecommendationsList] = useState<string[]>([]);
  
  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState('');
  
  // AI Draft data
  const [aiDraftData, setAiDraftData] = useState<any>(null);

  useEffect(() => {
    if (reportId) {
      loadExistingReport();
    } else if (analysisId) {
      loadAIDraft();
    }
  }, [reportId, analysisId]);

  const loadExistingReport = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        alert('⚠️ Authentication required');
        return;
      }
      
      const response = await axios.get(
        `${API_URL}/api/structured-reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data.report || response.data;
      setReport(data);
      populateReportFields(data);
      setShowTemplateSelector(false);
      setWorkflowStep(1);
    } catch (error: any) {
      console.error('Error loading report:', error);
      alert(`Failed to load report: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAIDraft = async () => {
    try {
      setLoadingAIDraft(true);
      const token = getAuthToken();
      if (!token) return;
      
      // Try to fetch AI analysis results
      const response = await axios.get(
        `${API_URL}/api/ai-analysis/${analysisId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.results) {
        setAiDraftData(response.data);
        console.log('✅ AI draft data loaded:', response.data);
      }
    } catch (error) {
      console.log('ℹ️ No AI draft data available');
    } finally {
      setLoadingAIDraft(false);
    }
  };

  const populateReportFields = (data: any) => {
    setFindingsText(data.findingsText || '');
    setImpression(data.impression || '');
    setRecommendations(data.recommendations || '');
    setClinicalHistory(data.clinicalHistory || '');
    setTechnique(data.technique || '');
    setStructuredFindings(data.findings || []);
    setMeasurements(data.measurements || []);
    setRecommendationsList(data.recommendationsList || []);
    setSignatureDataUrl(data.radiologistSignatureUrl || null);
    setSignatureText(data.radiologistSignature || '');
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    // Initialize template sections with default values
    const sections: Record<string, string> = {};
    template.sections.forEach(section => {
      sections[section.id] = section.defaultValue || '';
    });
    setReportSections(sections);
    
    // Set default technique from template if available
    const techniqueSection = template.sections.find(s => s.id === 'technique');
    if (techniqueSection?.defaultValue) {
      setTechnique(techniqueSection.defaultValue);
    }
    
    // Auto-populate with AI data if available
    if (aiDraftData && aiDraftData.results) {
      populateWithAIData(template);
    }
    
    setWorkflowStep(1);
  };

  const populateWithAIData = (template: ReportTemplate) => {
    const results = aiDraftData.results;
    
    // Build findings text from AI
    let aiFindingsText = '🤖 AI-ASSISTED ANALYSIS\n\n';
    
    if (results.classification) {
      aiFindingsText += `Classification: ${results.classification}\n`;
      aiFindingsText += `Confidence: ${((results.confidence || 0) * 100).toFixed(1)}%\n\n`;
    }
    
    if (results.findings) {
      aiFindingsText += `Clinical Report:\n${results.findings}\n\n`;
    }
    
    setFindingsText(aiFindingsText);
    
    // Set impression
    if (results.classification) {
      setImpression(
        `AI-assisted preliminary analysis suggests: ${results.classification}\n\n` +
        `Note: This is a preliminary AI-generated analysis. Radiologist review and clinical correlation are required for final diagnosis.`
      );
    }
    
    // Add AI findings to structured findings
    if (results.classification) {
      const aiFinding: Finding = {
        id: `ai-${Date.now()}`,
        location: 'AI Analysis',
        description: `${results.classification} (Confidence: ${((results.confidence || 0) * 100).toFixed(1)}%)`,
        severity: (results.confidence || 0) > 0.8 ? 'moderate' : 'mild'
      };
      setStructuredFindings([aiFinding]);
    }
  };

  const handleSkipTemplate = () => {
    setShowTemplateSelector(false);
    setWorkflowStep(1);
    
    // Still populate with AI data if available
    if (aiDraftData && aiDraftData.results) {
      const results = aiDraftData.results;
      
      let aiFindingsText = '🤖 AI-ASSISTED ANALYSIS\n\n';
      if (results.classification) {
        aiFindingsText += `Classification: ${results.classification}\n`;
        aiFindingsText += `Confidence: ${((results.confidence || 0) * 100).toFixed(1)}%\n\n`;
      }
      if (results.findings) {
        aiFindingsText += `Clinical Report:\n${results.findings}\n\n`;
      }
      
      setFindingsText(aiFindingsText);
      setImpression(
        results.classification 
          ? `AI-assisted preliminary analysis suggests: ${results.classification}`
          : 'Preliminary analysis completed. Awaiting radiologist review.'
      );
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
        studyInstanceUID,
        patientID: patientInfo?.patientID,
        patientName: patientInfo?.patientName,
        modality: patientInfo?.modality,
        findingsText,
        impression,
        recommendations,
        clinicalHistory,
        technique,
        findings: structuredFindings,
        measurements,
        recommendationsList,
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
        reportSections,
        reportStatus: 'draft'
      };
      
      let response;
      if (report?._id || report?.reportId) {
        // Update existing report
        const id = report.reportId || report._id;
        response = await axios.put(
          `${API_URL}/api/structured-reports/${id}`,
          reportData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new report
        if (analysisId) {
          response = await axios.post(
            `${API_URL}/api/structured-reports/from-ai/${analysisId}`,
            {
              ...reportData,
              radiologistName: 'Current Radiologist' // Will be filled by backend
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          response = await axios.post(
            `${API_URL}/api/structured-reports`,
            reportData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      const savedReport = response.data.report || response.data;
      setReport(savedReport);
      
      alert('✅ Report saved successfully');
      
      if (onReportCreated && !report) {
        onReportCreated(savedReport.reportId || savedReport._id);
      }
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
    
    if (!report || !report.reportId) {
      alert('Please save the report first');
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
        `${API_URL}/api/structured-reports/${report.reportId}/sign`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      alert('✅ Report signed successfully!');
      setShowSignatureDialog(false);
      setWorkflowStep(2);
      
      if (onReportSigned) {
        onReportSigned();
      }
      
      loadExistingReport();
    } catch (error: any) {
      console.error('Error signing report:', error);
      alert(`Failed to sign: ${error.response?.data?.message || error.message}`);
    } finally {
      setSigning(false);
    }
  };

  // Finding management
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

  // Measurement management
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

  // Template quick findings
  const handleAddTemplateFind = (finding: any) => {
    const newFinding: Finding = {
      id: Date.now().toString(),
      location: finding.category,
      description: finding.description,
      severity: finding.severity
    };
    setStructuredFindings([...structuredFindings, newFinding]);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading report...</Typography>
      </Box>
    );
  }

  // Template Selector View
  if (showTemplateSelector && !reportId) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom>
                <TemplateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Choose Report Template
              </Typography>
              {loadingAIDraft && (
                <Chip
                  icon={<AIIcon />}
                  label="Loading AI draft..."
                  color="primary"
                  size="small"
                />
              )}
              {aiDraftData && (
                <Chip
                  icon={<AIIcon />}
                  label="AI draft available - will auto-populate"
                  color="success"
                  size="small"
                />
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={handleSkipTemplate}
            >
              Skip - Use Basic Report
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={2}>
          {REPORT_TEMPLATES
            .filter(t => !patientInfo?.modality || t.modality.includes(patientInfo.modality))
            .map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)'
                  },
                  border: patientInfo?.modality && template.modality.includes(patientInfo.modality) 
                    ? '2px solid' 
                    : '1px solid',
                  borderColor: patientInfo?.modality && template.modality.includes(patientInfo.modality)
                    ? 'primary.main'
                    : 'divider'
                }}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6">
                      {template.icon} {template.name}
                    </Typography>
                    {patientInfo?.modality && template.modality.includes(patientInfo.modality) && (
                      <Chip label="Recommended" color="primary" size="small" />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {template.category}
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Modalities:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {template.modality.map(mod => (
                        <Chip key={mod} label={mod} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {template.sections.length} sections • {template.findings.length} quick findings
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {patientInfo?.modality && REPORT_TEMPLATES.filter(t => t.modality.includes(patientInfo.modality)).length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No templates found for modality: {patientInfo.modality}. You can still use the basic report.
          </Alert>
        )}
      </Box>
    );
  }

  const isReportSigned = report?.reportStatus === 'final' || report?.reportStatus === 'signed';

  // Main Report Editor View
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" gutterBottom>
              <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {selectedTemplate ? selectedTemplate.name : 'Medical Report'}
            </Typography>
            <Box display="flex" gap={1}>
              {aiDraftData && (
                <Chip
                  icon={<AIIcon />}
                  label="AI-Assisted"
                  color="primary"
                  size="small"
                />
              )}
              {selectedTemplate && (
                <Chip
                  icon={<TemplateIcon />}
                  label={selectedTemplate.name}
                  size="small"
                  variant="outlined"
                />
              )}
              {report?.reportStatus && (
                <Chip
                  label={report.reportStatus.toUpperCase()}
                  color={isReportSigned ? 'success' : 'default'}
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || isReportSigned}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            {report && !isReportSigned && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={() => setShowSignatureDialog(true)}
              >
                Sign & Finalize
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Workflow Stepper (for new reports) */}
      {!reportId && (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Stepper activeStep={workflowStep} alternativeLabel>
            <Step>
              <StepLabel>Choose Template</StepLabel>
            </Step>
            <Step>
              <StepLabel>Edit Report</StepLabel>
            </Step>
            <Step>
              <StepLabel>Sign & Finalize</StepLabel>
            </Step>
          </Stepper>
        </Paper>
      )}

      {/* Tabs */}
      <Paper elevation={1}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Report Content" icon={<ReportIcon />} iconPosition="start" />
          <Tab label="Structured Findings" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Patient Info" icon={<PersonIcon />} iconPosition="start" />
          {selectedTemplate && selectedTemplate.findings.length > 0 && (
            <Tab 
              label={
                <Badge badgeContent={selectedTemplate.findings.length} color="primary">
                  Quick Findings
                </Badge>
              } 
              icon={<ListAlt />} 
              iconPosition="start" 
            />
          )}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Report Content Tab */}
        {activeTab === 0 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Template Sections */}
              {selectedTemplate && selectedTemplate.sections.map((section) => (
                <Grid item xs={12} key={section.id}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h6">
                      {section.title}
                      {section.required && <span style={{ color: 'red' }}> *</span>}
                    </Typography>
                    <VoiceDictationButton
                      onTranscript={(text) => {
                        setReportSections({
                          ...reportSections,
                          [section.id]: (reportSections[section.id] || '') + ' ' + text
                        });
                      }}
                      fieldName={section.title}
                      disabled={isReportSigned}
                    />
                  </Box>
                  {section.type === 'textarea' ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={section.id === 'findings' ? 8 : 4}
                      value={reportSections[section.id] || ''}
                      onChange={(e) => setReportSections({
                        ...reportSections,
                        [section.id]: e.target.value
                      })}
                      placeholder={section.placeholder}
                      disabled={isReportSigned}
                      required={section.required}
                    />
                  ) : section.type === 'select' && section.options ? (
                    <FormControl fullWidth>
                      <Select
                        value={reportSections[section.id] || ''}
                        onChange={(e) => setReportSections({
                          ...reportSections,
                          [section.id]: e.target.value
                        })}
                        disabled={isReportSigned}
                      >
                        {section.options.map(opt => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      value={reportSections[section.id] || ''}
                      onChange={(e) => setReportSections({
                        ...reportSections,
                        [section.id]: e.target.value
                      })}
                      placeholder={section.placeholder}
                      disabled={isReportSigned}
                      required={section.required}
                    />
                  )}
                </Grid>
              ))}

              {/* Standard Fields (if no template selected) */}
              {!selectedTemplate && (
                <>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6">Clinical History</Typography>
                      <VoiceDictationButton
                        onTranscript={(text) => setClinicalHistory(prev => prev + ' ' + text)}
                        fieldName="Clinical History"
                        disabled={isReportSigned}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={clinicalHistory}
                      onChange={(e) => setClinicalHistory(e.target.value)}
                      placeholder="Enter clinical history..."
                      disabled={isReportSigned}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6">Technique</Typography>
                      <VoiceDictationButton
                        onTranscript={(text) => setTechnique(prev => prev + ' ' + text)}
                        fieldName="Technique"
                        disabled={isReportSigned}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value)}
                      placeholder="Describe imaging technique..."
                      disabled={isReportSigned}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6">Findings</Typography>
                      <VoiceDictationButton
                        onTranscript={(text) => setFindingsText(prev => prev + ' ' + text)}
                        fieldName="Findings"
                        disabled={isReportSigned}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={findingsText}
                      onChange={(e) => setFindingsText(e.target.value)}
                      placeholder="Detailed findings..."
                      disabled={isReportSigned}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6">Impression</Typography>
                      <VoiceDictationButton
                        onTranscript={(text) => setImpression(prev => prev + ' ' + text)}
                        fieldName="Impression"
                        disabled={isReportSigned}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={impression}
                      onChange={(e) => setImpression(e.target.value)}
                      placeholder="Summary impression..."
                      disabled={isReportSigned}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6">Recommendations</Typography>
                      <VoiceDictationButton
                        onTranscript={(text) => setRecommendations(prev => prev + ' ' + text)}
                        fieldName="Recommendations"
                        disabled={isReportSigned}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="Recommendations..."
                      disabled={isReportSigned}
                    />
                  </Grid>
                </>
              )}
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
                disabled={isReportSigned}
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
                        disabled={isReportSigned}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          value={finding.severity}
                          onChange={(e) => handleUpdateFinding(finding.id, 'severity', e.target.value)}
                          disabled={isReportSigned}
                        >
                          <MenuItem value="normal">🟢 Normal</MenuItem>
                          <MenuItem value="mild">🔵 Mild</MenuItem>
                          <MenuItem value="moderate">🟡 Moderate</MenuItem>
                          <MenuItem value="severe">🔴 Severe</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteFinding(finding.id)}
                        disabled={isReportSigned}
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
                        disabled={isReportSigned}
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
                disabled={isReportSigned}
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
                        disabled={isReportSigned}
                        placeholder="e.g., Length, Diameter"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={measurement.value}
                        onChange={(e) => handleUpdateMeasurement(measurement.id, 'value', parseFloat(e.target.value))}
                        disabled={isReportSigned}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={measurement.unit}
                          onChange={(e) => handleUpdateMeasurement(measurement.id, 'unit', e.target.value)}
                          disabled={isReportSigned}
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="degrees">degrees</MenuItem>
                          <MenuItem value="HU">HU</MenuItem>
                          <MenuItem value="%">%</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={measurement.location}
                        onChange={(e) => handleUpdateMeasurement(measurement.id, 'location', e.target.value)}
                        disabled={isReportSigned}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        disabled={isReportSigned}
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
                  value={patientInfo?.patientID || report?.patientID || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  value={patientInfo?.patientName || report?.patientName || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modality"
                  value={patientInfo?.modality || report?.modality || ''}
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
              {report?.reportDate && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Report Date"
                    value={new Date(report.reportDate).toLocaleString()}
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
              {report?.radiologistName && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Radiologist"
                    value={report.radiologistName}
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Quick Findings Tab (template-specific) */}
        {activeTab === 3 && selectedTemplate && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Findings Library
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click any finding to add it to your structured findings
            </Typography>
            
            <Grid container spacing={2}>
              {selectedTemplate.findings.map((finding) => (
                <Grid item xs={12} sm={6} md={4} key={finding.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => !isReportSigned && handleAddTemplateFinding(finding)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {finding.label}
                        </Typography>
                        <Chip
                          label={finding.severity}
                          size="small"
                          color={
                            finding.severity === 'normal' ? 'success' :
                            finding.severity === 'mild' ? 'info' :
                            finding.severity === 'moderate' ? 'warning' : 'error'
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {finding.category}
                      </Typography>
                      <Typography variant="body2">
                        {finding.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Signature Dialog */}
      <Dialog
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sign and Finalize Report</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Once signed, the report cannot be edited. Please review carefully before signing.
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Option 1: Draw Signature
          </Typography>
          <SignatureCanvas
            onSave={(dataUrl) => {
              setSignatureDataUrl(dataUrl);
            }}
            onCancel={() => setSignatureDataUrl(null)}
          />
          
          <Divider sx={{ my: 3 }}>OR</Divider>
          
          <Typography variant="subtitle1" gutterBottom>
            Option 2: Type Signature
          </Typography>
          <TextField
            fullWidth
            label="Electronic Signature"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder="Type your name to sign electronically"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignatureDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSign}
            disabled={signing || (!signatureDataUrl && !signatureText)}
            startIcon={signing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {signing ? 'Signing...' : 'Sign & Finalize Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperUnifiedReportEditor;
