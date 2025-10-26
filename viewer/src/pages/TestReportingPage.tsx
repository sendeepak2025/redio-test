/**
 * Test Page for Super Unified Report Editor
 * Navigate to: /test-reporting
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Science as TestIcon,
  Description as ReportIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { SuperUnifiedReportEditor } from '../../components/reports';

const TestReportingPage: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [testMode, setTestMode] = useState<'basic' | 'ai' | 'edit'>('basic');
  
  // Test data
  const [studyUID, setStudyUID] = useState('1.2.840.113619.2.1.1.1');
  const [patientID, setPatientID] = useState('TEST001');
  const [patientName, setPatientName] = useState('Test Patient');
  const [modality, setModality] = useState('CT');
  const [analysisId, setAnalysisId] = useState('test_analysis_123');
  const [reportId, setReportId] = useState('');
  const [useAI, setUseAI] = useState(false);

  const handleStartTest = () => {
    setShowEditor(true);
  };

  const handleReset = () => {
    setShowEditor(false);
  };

  if (showEditor) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ p: 2, borderRadius: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              🧪 Testing: Super Unified Report Editor
            </Typography>
            <Button variant="outlined" onClick={handleReset}>
              Reset Test
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default', p: 2 }}>
          <SuperUnifiedReportEditor
            studyInstanceUID={studyUID}
            patientInfo={{
              patientID,
              patientName,
              modality
            }}
            analysisId={useAI ? analysisId : undefined}
            reportId={reportId || undefined}
            onReportCreated={(id) => {
              console.log('Report created:', id);
              alert(`Report created with ID: ${id}`);
            }}
            onReportSigned={() => {
              console.log('Report signed!');
              alert('Report signed successfully!');
            }}
            onClose={handleReset}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <TestIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Super Unified Report Editor - Test Page
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test the new unified reporting system with different scenarios
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Test Scenarios */}
        <Typography variant="h6" gutterBottom>
          Choose Test Scenario:
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: testMode === 'basic' ? 2 : 1,
                borderColor: testMode === 'basic' ? 'primary.main' : 'divider'
              }}
              onClick={() => {
                setTestMode('basic');
                setUseAI(false);
                setReportId('');
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📝 Basic Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new report from scratch. Choose template or use free-text.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: testMode === 'ai' ? 2 : 1,
                borderColor: testMode === 'ai' ? 'primary.main' : 'divider'
              }}
              onClick={() => {
                setTestMode('ai');
                setUseAI(true);
                setReportId('');
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🤖 AI-Assisted Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test with AI analysis. Fields will auto-populate (simulated).
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: testMode === 'edit' ? 2 : 1,
                borderColor: testMode === 'edit' ? 'primary.main' : 'divider'
              }}
              onClick={() => {
                setTestMode('edit');
                setUseAI(false);
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ✏️ Edit Existing Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Load and edit an existing report by ID.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Test Data Configuration */}
        <Typography variant="h6" gutterBottom>
          Test Data:
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Study Instance UID"
              value={studyUID}
              onChange={(e) => setStudyUID(e.target.value)}
              helperText="The study identifier"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Patient ID"
              value={patientID}
              onChange={(e) => setPatientID(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Modality"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              helperText="e.g., CT, MR, CR, DX, US"
            />
          </Grid>

          {testMode === 'ai' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Analysis ID"
                value={analysisId}
                onChange={(e) => setAnalysisId(e.target.value)}
                helperText="ID of the AI analysis (for AI-assisted mode)"
              />
            </Grid>
          )}

          {testMode === 'edit' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report ID"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                helperText="ID of existing report to edit"
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Test Features:</strong>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>✅ Template selection with 10+ pre-defined templates</li>
            <li>✅ Template recommendations based on modality</li>
            <li>✅ AI auto-populate (if analysis ID provided)</li>
            <li>✅ Voice dictation buttons (requires HTTPS or localhost)</li>
            <li>✅ Structured findings with severity levels</li>
            <li>✅ Measurements tracking</li>
            <li>✅ Quick findings library per template</li>
            <li>✅ Canvas & text signature options</li>
            <li>✅ 3-step workflow: Choose Template → Edit → Sign</li>
          </ul>
        </Alert>

        {/* Start Button */}
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<StartIcon />}
            onClick={handleStartTest}
            sx={{ px: 6, py: 1.5 }}
          >
            Start Test
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quick Tips */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            🎯 Quick Testing Tips:
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li><strong>Template Selection:</strong> Try selecting different templates - recommended ones (matching modality) are highlighted</li>
              <li><strong>Skip Template:</strong> Click "Skip - Use Basic Report" for free-text reporting</li>
              <li><strong>Voice Dictation:</strong> Click 🎤 button next to any field (needs microphone permission)</li>
              <li><strong>Quick Findings:</strong> If template selected, go to "Quick Findings" tab for one-click additions</li>
              <li><strong>Structured Findings:</strong> Use "Structured Findings" tab to add findings with severity</li>
              <li><strong>Signature:</strong> Try both canvas signature (draw) and text signature (type)</li>
              <li><strong>Save & Sign:</strong> Save draft first, then sign to finalize</li>
            </ol>
          </Typography>
        </Paper>

        {/* Documentation Links */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            📚 Documentation: /app/SUPER_UNIFIED_REPORTING_SYSTEM.md
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🗺️ Roadmap: /app/REPORTING_STREAMLINE_ROADMAP.md
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestReportingPage;
