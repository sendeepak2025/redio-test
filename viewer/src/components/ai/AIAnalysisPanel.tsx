import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as AIIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import medicalAIService, { AIAnalysisResult } from '../../services/medicalAIService'

interface AIAnalysisPanelProps {
  studyInstanceUID: string
  frameIndex: number
  patientContext?: {
    age?: number
    sex?: string
    clinicalHistory?: string
    indication?: string
  }
  onReportGenerated?: (report: string) => void
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  studyInstanceUID,
  frameIndex,
  patientContext,
  onReportGenerated
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false)
  const [servicesAvailable, setServicesAvailable] = useState(false)
  const [checkingHealth, setCheckingHealth] = useState(true)

  // Check AI services health on mount
  useEffect(() => {
    checkServicesHealth()
  }, [])

  // Load existing analysis on mount
  useEffect(() => {
    loadExistingAnalysis()
  }, [studyInstanceUID])

  const checkServicesHealth = async () => {
    try {
      setCheckingHealth(true)
      const health = await medicalAIService.checkHealth()
      const available = health.services.medSigLIP.available || health.services.medGemma4B.available
      setServicesAvailable(available)
    } catch (err) {
      console.error('Health check failed:', err)
      setServicesAvailable(false)
    } finally {
      setCheckingHealth(false)
    }
  }

  const loadExistingAnalysis = async () => {
    try {
      const existingAnalysis = await medicalAIService.getStudyAnalysis(studyInstanceUID)
      if (existingAnalysis) {
        setAnalysis(existingAnalysis)
      }
    } catch (err) {
      console.error('Failed to load existing analysis:', err)
    }
  }

  const performAnalysis = async () => {
    console.log('🔘 performAnalysis called', { hasAcceptedDisclaimer, studyInstanceUID, frameIndex });

    // if (!hasAcceptedDisclaimer) {
    //   console.log('📋 Showing disclaimer dialog');
    //   setShowDisclaimerDialog(true)
    //   return
    // }

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Starting AI analysis...', { studyInstanceUID, frameIndex })

      const result = await medicalAIService.analyzeStudy(
        studyInstanceUID,
        frameIndex,
        patientContext
      )

      console.log('✅ AI analysis complete:', result)
      console.log('Result structure:', JSON.stringify(result, null, 2))

      // Check if result has the expected structure
      if (!result) {
        throw new Error('No result returned from AI service')
      }

      setAnalysis(result)

      // Notify parent if report was generated (with safe access)
      try {
        if (result?.analyses?.report && onReportGenerated) {
          const reportText = formatReportForExport(result.analyses.report)
          onReportGenerated(reportText)
        }
      } catch (reportErr) {
        console.warn('Failed to export report:', reportErr)
        // Don't fail the whole analysis if report export fails
      }
    } catch (err: any) {
      console.error('❌ AI analysis failed:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })

      const errorMessage = err.response?.data?.message || err.message || 'AI analysis failed. Please try again.'
      setError(errorMessage)

      // Show user-friendly error
      if (errorMessage.includes('Frame not found')) {
        setError('Unable to analyze: Study frames not loaded. Please make sure the study images are visible in the viewer first.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Demo analysis for testing (bypasses frame requirement)
  const performDemoAnalysis = () => {
    setLoading(true)
    setError(null)

    // Simulate API delay
    setTimeout(() => {
      const demoResult: AIAnalysisResult = {
        studyInstanceUID,
        modality: 'XR',
        timestamp: new Date().toISOString(),
        analyses: {
          classification: {
            classification: 'normal',
            confidence: 0.85,
            topPredictions: [
              { label: 'normal', confidence: 0.85 },
              { label: 'abnormal', confidence: 0.15 }
            ],
            processingTime: 0.2,
            model: 'MedSigLIP-0.4B (Demo)'
          },
          report: {
            findings: `TECHNIQUE:\nXR imaging was performed according to standard protocol.\n\nFINDINGS:\nThis is a demonstration report. The lungs are clear bilaterally without focal consolidation, pleural effusion, or pneumothorax. The cardiac silhouette is normal in size and contour.`,
            impression: 'No acute cardiopulmonary abnormality (Demo Mode).',
            recommendations: 'Clinical correlation recommended',
            keyFindings: ['Clear lungs', 'Normal cardiac silhouette'],
            criticalFindings: [],
            confidence: 0.80,
            requiresReview: true,
            generatedAt: new Date().toISOString(),
            model: 'MedGemma-4B (Demo)'
          }
        }
      }

      setAnalysis(demoResult)
      setLoading(false)
    }, 1500)
  }

  const formatReportForExport = (report: any): string => {
    return `
FINDINGS:
${report.findings}

IMPRESSION:
${report.impression}

RECOMMENDATIONS:
${report.recommendations}

KEY FINDINGS:
${report.keyFindings.map((f: string) => `• ${f}`).join('\n')}

${report.criticalFindings.length > 0 ? `
CRITICAL FINDINGS:
${report.criticalFindings.map((f: string) => `• ${f}`).join('\n')}
` : ''}

---
Generated by ${report.model} on ${new Date(report.generatedAt).toLocaleString()}
⚠️ This AI-generated report requires radiologist review and approval.
    `.trim()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleAcceptDisclaimer = () => {
    setHasAcceptedDisclaimer(true)
    setShowDisclaimerDialog(false)
    performAnalysis()
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Analyzing with AI models...
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This may take 10-30 seconds
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={performAnalysis}
          fullWidth
        >
          Retry Analysis
        </Button>
      </Box>
    )
  }

  if (!analysis) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info" icon={<AIIcon />} sx={{ mb: 2 }}>
          AI analysis not yet performed for this study.
        </Alert>

        {checkingHealth ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Checking AI services...</Typography>
          </Box>
        ) : !servicesAvailable ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Demo Mode Active
            </Typography>
            <Typography variant="caption">
              AI services (MedSigLIP & MedGemma) are not running. Click below to see demo analysis.
              To enable real AI, see AI-ANALYSIS-STATUS-AND-ACTIVATION.md
            </Typography>
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              AI Services Available
            </Typography>
            <Typography variant="caption">
              MedSigLIP and MedGemma are ready for analysis.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <Button
            variant="contained"
            startIcon={<AIIcon />}
            onClick={() => {
              console.log('🔘 Button clicked!');
              setHasAcceptedDisclaimer(true);
              performAnalysis();
            }}
            fullWidth
            color="primary"
            disabled={checkingHealth}
          >
            {servicesAvailable ? 'Run AI Analysis' : 'Run Demo AI Analysis'}
          </Button>

          {/* Quick demo button for testing */}
          <Button
            variant="outlined"
            size="small"
            onClick={performDemoAnalysis}
            fullWidth
            disabled={checkingHealth}
          >
            Quick Demo (No Frame Required)
          </Button>
        </Box>

        {!servicesAvailable && !checkingHealth && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Will show demonstration data (AI services not running)
          </Typography>
        )}
      </Box>
    )
  }

  // Check if we have a comprehensive report (new format)
  const hasComprehensiveReport = analysis && !analysis.analyses && analysis.sections;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Analysis</Typography>
          {(analysis as any).demoMode && (
            <Chip label="DEMO MODE" size="small" color="warning" />
          )}
        </Box>
        <Tooltip title="Refresh Analysis">
          <IconButton size="small" onClick={performAnalysis}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Show comprehensive report if available */}
      {hasComprehensiveReport && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            ✅ Comprehensive AI Report Generated!
          </Typography>
          <Typography variant="caption">
            View the complete report with detections below.
          </Typography>
        </Alert>
      )}

      {/* Service Status */}
      {!servicesAvailable && (
        <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Demo Mode - AI Services Not Running
          </Typography>
          <Typography variant="caption">
            This is demonstration data. To enable real AI analysis, start the AI services.
            See AI-ANALYSIS-STATUS-AND-ACTIVATION.md for instructions.
          </Typography>
        </Alert>
      )}
      {servicesAvailable && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            AI Services Active
          </Typography>
          <Typography variant="caption">
            Analysis powered by MedSigLIP and MedGemma AI models.
          </Typography>
        </Alert>
      )}

      {/* Warning Banner */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          Requires Radiologist Review
        </Typography>
        <Typography variant="caption">
          AI-generated results are not FDA-approved for clinical diagnosis
        </Typography>
      </Alert>

      {/* Classification Results */}
      {analysis?.analyses?.classification && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              🔍 Image Classification
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Chip
                label={analysis.analyses.classification.classification}
                color="primary"
                sx={{ mb: 1 }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Confidence
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analysis.analyses.classification.confidence * 100}
                  sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {(analysis.analyses.classification.confidence * 100).toFixed(1)}%
                </Typography>
              </Box>

              {analysis.analyses.classification.topPredictions?.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Top Predictions:
                  </Typography>
                  <List dense>
                    {analysis.analyses.classification.topPredictions.map((pred, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={pred.label}
                          secondary={`${(pred.confidence * 100).toFixed(1)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Model: {analysis.analyses.classification.model} •
                Processing: {analysis.analyses.classification.processingTime}ms
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Generated Report */}
      {analysis?.analyses?.report && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              📝 AI-Generated Report
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Findings */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  FINDINGS:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {analysis.analyses.report.findings}
                </Typography>
              </Paper>

              {/* Impression */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  IMPRESSION:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {analysis.analyses.report.impression}
                </Typography>
              </Paper>

              {/* Recommendations */}
              {analysis.analyses.report.recommendations && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    RECOMMENDATIONS:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {analysis.analyses.report.recommendations}
                  </Typography>
                </Paper>
              )}

              {/* Key Findings */}
              {analysis.analyses.report.keyFindings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Key Findings:
                  </Typography>
                  <List dense>
                    {analysis.analyses.report.keyFindings.map((finding, idx) => (
                      <ListItem key={idx}>
                        <CheckIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                        <ListItemText primary={finding} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Critical Findings */}
              {analysis.analyses.report.criticalFindings.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Critical Findings:
                  </Typography>
                  <List dense>
                    {analysis.analyses.report.criticalFindings.map((finding, idx) => (
                      <ListItem key={idx}>
                        <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                        <ListItemText primary={finding} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={() => copyToClipboard(formatReportForExport(analysis.analyses.report))}
                >
                  Copy Report
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const blob = new Blob([formatReportForExport(analysis.analyses.report!)], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `ai-report-${studyInstanceUID}.txt`
                    a.click()
                  }}
                >
                  Download
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Model: {analysis.analyses.report.model} •
                Generated: {new Date(analysis.analyses.report.generatedAt).toLocaleString()} •
                Confidence: {(analysis.analyses.report.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Comprehensive Report Viewer (New Format) */}
      {hasComprehensiveReport && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              ✅ AI Analysis Complete!
            </Typography>
            <Typography variant="caption">
              Report generated successfully. View details below.
            </Typography>
          </Alert>

          {/* Report Sections */}
          {analysis.sections && Object.entries(analysis.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <Accordion key={sectionName} defaultExpanded={sectionName === 'FINDINGS' || sectionName === 'IMPRESSION'}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{sectionName}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {sectionContent}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* AI Detections */}
          {analysis.detections && analysis.detections.detections && analysis.detections.detections.length > 0 && (
            <Accordion defaultExpanded sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  🎯 AI Detected Abnormalities ({analysis.detections.count})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {analysis.detections.detections.map((detection: any, idx: number) => (
                  <Paper key={idx} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {idx + 1}. {detection.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Confidence: {(detection.confidence * 100).toFixed(1)}% | Severity: {detection.severity}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {detection.description}
                    </Typography>
                    {detection.measurements && Object.keys(detection.measurements).length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Measurements:</strong> {Object.entries(detection.measurements).map(([k, v]: [string, any]) => `${k}: ${v}`).join(', ')}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const reportId = analysis.reportId;
                window.open(`/api/medical-ai/reports/${reportId}/pdf`, '_blank');
              }}
            >
              Download PDF Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const json = JSON.stringify(analysis, null, 2)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ai-report-${analysis.reportId || Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download JSON
            </Button>
          </Box>
        </Box>
      )}

      {/* Clinical Reasoning (if available) */}
      {analysis?.analyses?.clinicalReasoning && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              🧠 Clinical Reasoning
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Differential Diagnosis */}
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Differential Diagnosis:
              </Typography>
              <List dense>
                {analysis.analyses.clinicalReasoning.differentialDiagnosis.map((dx, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={`${idx + 1}. ${dx}`} />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Treatment Recommendations */}
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Treatment Recommendations:
              </Typography>
              <List dense>
                {analysis.analyses.clinicalReasoning.treatmentRecommendations.map((rec, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Model: {analysis.analyses.clinicalReasoning.model}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Disclaimer Dialog */}
      <Dialog
        open={showDisclaimerDialog}
        onClose={() => setShowDisclaimerDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 9999 }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            AI Analysis Disclaimer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Important Notice:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>AI-generated results are NOT FDA-approved for clinical diagnosis</li>
                <li>All results MUST be reviewed by a licensed radiologist</li>
                <li>AI analysis is for assistance only, not final diagnosis</li>
                <li>Clinical judgment should always take precedence</li>
              </ul>
            </Typography>
          </Alert>
          <Typography variant="body2">
            By proceeding, you acknowledge that you understand these limitations and will
            use AI results appropriately within your clinical workflow.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisclaimerDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAcceptDisclaimer} variant="contained" color="primary">
            I Understand, Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AIAnalysisPanel
