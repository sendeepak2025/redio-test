/**
 * Auto Analysis Popup
 * Automatically triggers analysis and shows download options
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  Download,
  Refresh,
  Description
} from '@mui/icons-material';
import { autoAnalysisService, SliceAnalysis } from '../../services/AutoAnalysisService';
import { UnifiedReportEditor } from '../reports';

interface AutoAnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  studyInstanceUID: string;
  seriesInstanceUID?: string;
  slices: number[];
  mode: 'single' | 'all';
}

export const AutoAnalysisPopup: React.FC<AutoAnalysisPopupProps> = ({
  open,
  onClose,
  studyInstanceUID,
  seriesInstanceUID,
  slices,
  mode
}) => {
  const [analyses, setAnalyses] = useState<Map<number, SliceAnalysis>>(new Map());
  const [consolidatedReportReady, setConsolidatedReportReady] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    backend: boolean;
    aiServices: { medsiglip: boolean; medgemma: boolean };
    message: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  
  // Report Editor state
  const [showReportEditor, setShowReportEditor] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Check backend health before starting analysis
  useEffect(() => {
    if (open) {
      const checkHealth = async () => {
        setIsCheckingHealth(true);
        const health = await autoAnalysisService.checkHealth();
        setHealthStatus(health);
        setIsCheckingHealth(false);

        if (!health.backend) {
          console.error('❌ Backend not available');
        } else if (!health.aiServices.medsiglip || !health.aiServices.medgemma) {
          console.warn('⚠️ Some AI services unavailable');
        }
      };
      checkHealth();
    }
  }, [open]);

  // Auto-trigger analysis when popup opens and health check passes
  useEffect(() => {
    if (open && slices.length > 0 && healthStatus?.backend && !isCheckingHealth) {
      console.log('🚀 Auto-triggering analysis...');

      // Clear previous analyses
      autoAnalysisService.clear();

      // Start analysis
      autoAnalysisService.autoAnalyze({
        studyInstanceUID,
        seriesInstanceUID,
        slices,
        mode
      });

      // Subscribe to updates
      const unsubscribe = autoAnalysisService.subscribe(setAnalyses);
      return unsubscribe;
    }
  }, [open, studyInstanceUID, seriesInstanceUID, slices, mode, healthStatus, isCheckingHealth]);

  // Check if consolidated report can be generated
  useEffect(() => {
    if (mode === 'all' && autoAnalysisService.areAllComplete()) {
      setConsolidatedReportReady(true);
    }
  }, [analyses, mode]);

  const handleDownloadSliceReport = async (sliceIndex: number) => {
    try {
      await autoAnalysisService.downloadSliceReport(sliceIndex);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report');
    }
  };

  const handleDownloadConsolidatedReport = async () => {
    try {
      setIsGeneratingReport(true);
      const report = await autoAnalysisService.generateConsolidatedReport(
        studyInstanceUID,
        slices
      );
      await autoAnalysisService.downloadConsolidatedReport(report);
    } catch (error) {
      console.error('Consolidated report failed:', error);
      alert('Failed to generate consolidated report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleRetry = async (sliceIndex: number) => {
    await autoAnalysisService.retryAnalysis(
      studyInstanceUID,
      seriesInstanceUID,
      sliceIndex
    );
  };

  const getStatusIcon = (status: SliceAnalysis['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'analyzing':
        return <HourglassEmpty color="primary" />;
      default:
        return <HourglassEmpty color="disabled" />;
    }
  };

  const getStatusText = (analysis: SliceAnalysis) => {
    switch (analysis.status) {
      case 'complete':
        return 'Complete';
      case 'failed':
        return `Failed: ${analysis.error}`;
      case 'analyzing':
        return `Analyzing... ${analysis.progress}%`;
      default:
        return 'Pending';
    }
  };

  const completionPercentage = autoAnalysisService.getCompletionPercentage();
  const allComplete = autoAnalysisService.areAllComplete();

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            AI Analysis {mode === 'all' ? '- All Slices' : '- Single Slice'}
          </Typography>
          <Chip
            label={`${completionPercentage}% Complete`}
            color={allComplete ? 'success' : 'primary'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Health Status */}
        {isCheckingHealth && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Checking backend and AI services...
          </Alert>
        )}

        {!isCheckingHealth && healthStatus && !healthStatus.backend && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Backend not available. Please ensure the server is running on port 8001.
          </Alert>
        )}

        {!isCheckingHealth && healthStatus && healthStatus.backend && 
         (!healthStatus.aiServices.medsiglip || !healthStatus.aiServices.medgemma) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Some AI services unavailable. Analysis may be limited.
            {!healthStatus.aiServices.medsiglip && ' MedSigLIP: Offline.'}
            {!healthStatus.aiServices.medgemma && ' MedGemma: Offline.'}
          </Alert>
        )}

        {/* Overall Progress */}
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Overall Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
            {Array.from(analyses.values()).filter(a => a.status === 'complete').length} of {analyses.size} slices analyzed
          </Typography>
        </Box>

        {/* Consolidated Report Option */}
        {mode === 'all' && consolidatedReportReady && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<Download />}
                onClick={handleDownloadConsolidatedReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? 'Generating...' : 'Download Consolidated Report'}
              </Button>
            }
          >
            All slices analyzed! Consolidated report available.
          </Alert>
        )}

        {/* Slice-by-Slice Status */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Slice Analysis Status:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
            {Array.from(analyses.entries()).map(([sliceIndex, analysis]) => (
              <Chip
                key={sliceIndex}
                label={sliceIndex}
                size="small"
                color={
                  analysis.status === 'complete' ? 'success' :
                  analysis.status === 'failed' ? 'error' :
                  analysis.status === 'analyzing' ? 'primary' : 'default'
                }
                icon={getStatusIcon(analysis.status)}
                onClick={analysis.status === 'complete' ? () => handleDownloadSliceReport(sliceIndex) : undefined}
                onDelete={analysis.status === 'failed' ? () => handleRetry(sliceIndex) : undefined}
                deleteIcon={analysis.status === 'failed' ? <Refresh /> : undefined}
                sx={{
                  cursor: analysis.status === 'complete' ? 'pointer' : 'default',
                  '&:hover': analysis.status === 'complete' ? {
                    backgroundColor: 'success.dark'
                  } : {}
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Detailed Status List */}
        <Typography variant="subtitle2" gutterBottom>
          Detailed Status
        </Typography>
        <List dense>
          {Array.from(analyses.entries()).map(([sliceIndex, analysis]) => (
            <ListItem
              key={sliceIndex}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: analysis.status === 'complete' ? 'success.50' : 'background.paper'
              }}
              secondaryAction={
                <Box display="flex" gap={1}>
                  {analysis.status === 'complete' && (
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleDownloadSliceReport(sliceIndex)}
                      title="Download Report"
                    >
                      <Download />
                    </IconButton>
                  )}
                  {analysis.status === 'failed' && (
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRetry(sliceIndex)}
                      title="Retry"
                    >
                      <Refresh />
                    </IconButton>
                  )}
                </Box>
              }
            >
              <ListItemIcon>
                {getStatusIcon(analysis.status)}
              </ListItemIcon>
              <ListItemText
                primary={`Slice ${sliceIndex}`}
                secondary={getStatusText(analysis)}
              />
              {analysis.status === 'analyzing' && (
                <Box sx={{ width: '100px', mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.progress}
                  />
                </Box>
              )}
            </ListItem>
          ))}
        </List>

        {/* Help Text */}
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            <Description fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Reports are automatically generated and saved. Click download to get PDF.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!allComplete}>
          {allComplete ? 'Close' : 'Cancel'}
        </Button>
        
        {/* Create Medical Report Button - Shows when analysis is complete */}
        {allComplete && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Description />}
            onClick={() => {
              // Get the first analysis ID for report creation
              const firstAnalysis = Array.from(analyses.values())[0];
              if (firstAnalysis?.analysisId) {
                setCurrentAnalysisId(firstAnalysis.analysisId);
                setShowReportEditor(true);
                console.log('📝 Opening Report Editor with Analysis ID:', firstAnalysis.analysisId);
              } else {
                alert('⚠️ Analysis ID not found. Please try again.');
              }
            }}
            sx={{ mr: 1 }}
          >
            📝 Create Medical Report
          </Button>
        )}
        
        {mode === 'all' && allComplete && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadConsolidatedReport}
            disabled={isGeneratingReport}
          >
            Download All
          </Button>
        )}
      </DialogActions>
    </Dialog>
    
    {/* Report Editor Dialog */}
    {showReportEditor && (
    <Dialog
      open={showReportEditor}
      onClose={() => setShowReportEditor(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Description color="primary" />
          <Typography variant="h6">Create Medical Report</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ AI Analysis Complete! Creating report from analysis findings.
        </Alert>
        
        <UnifiedReportEditor
          analysisId={currentAnalysisId || undefined}
          studyInstanceUID={studyInstanceUID}
          patientInfo={{
            patientID: 'P' + Date.now().toString().slice(-6),
            patientName: 'Patient Name',
            modality: 'CT'
          }}
          onReportCreated={(reportId) => {
            console.log('✅ Report created:', reportId);
          }}
          onReportSigned={() => {
            console.log('✅ Report signed and finalized!');
            alert('✅ Report signed and finalized!\n\nYou can now view it in Report History.');
            setShowReportEditor(false);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowReportEditor(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
    )}
  </>
  );
};
