import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';

interface ComprehensiveAIReportViewerProps {
  report: any;
  onExport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

/**
 * Comprehensive AI Report Viewer
 * Displays complete structured AI analysis reports with all sections
 */
const ComprehensiveAIReportViewer: React.FC<ComprehensiveAIReportViewerProps> = ({
  report,
  onExport,
  onPrint,
  onShare
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['FINDINGS', 'IMPRESSION']);

  if (!report) {
    return (
      <Alert severity="info">
        <AlertTitle>No Report Available</AlertTitle>
        Run AI analysis to generate a comprehensive report.
      </Alert>
    );
  }

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  
const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Report Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              AI-Assisted Radiology Report
            </Typography>
            <Box>
              <Tooltip title="Export Report">
                <IconButton onClick={onExport} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Report">
                <IconButton onClick={onPrint} size="small">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Report">
                <IconButton onClick={onShare} size="small">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Report ID:</strong> {report.reportId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Study UID:</strong> {report.studyInstanceUID}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Modality:</strong> {report.modality}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Frame:</strong> {report.frameIndex}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={report.aiStatus.status.toUpperCase()}
                  color={report.aiStatus.status === 'complete' ? 'success' : 'warning'}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {report.metadata.demoMode && (
                  <Chip label="DEMO MODE" color="info" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI Status Alert */}
      <Alert severity={report.aiStatus.status === 'complete' ? 'success' : 'warning'} sx={{ mb: 2 }}>
        <AlertTitle>{report.aiStatus.message}</AlertTitle>
        {report.aiStatus.servicesUsed.length > 0 && (
          <Typography variant="body2">
            Models Used: {report.aiStatus.servicesUsed.join(', ')}
          </Typography>
        )}
      </Alert>

      {/* Critical Findings Alert */}
      {report.criticalFindings && report.criticalFindings.length > 0 && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Critical Findings Detected</AlertTitle>
          {report.criticalFindings.map((finding: any, idx: number) => (
            <Typography key={idx} variant="body2">
              • {finding.finding || finding} {finding.confidence && `(Confidence: ${(finding.confidence * 100).toFixed(1)}%)`}
            </Typography>
          ))}
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            ⚠️ Immediate radiologist review required
          </Typography>
        </Alert>
      )}

      {/* Patient Information */}
      <Accordion expanded={expandedSections.includes('PATIENT')} onChange={() => handleSectionToggle('PATIENT')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Patient Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Patient ID</Typography>
              <Typography variant="body1">{report.patientInfo.patientID}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Patient Name</Typography>
              <Typography variant="body1">{report.patientInfo.patientName}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="body1">{report.patientInfo.age}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Sex</Typography>
              <Typography variant="body1">{report.patientInfo.sex}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Indication</Typography>
              <Typography variant="body1">{report.patientInfo.indication}</Typography>
            </Grid>
            {report.patientInfo.clinicalHistory && report.patientInfo.clinicalHistory !== 'Not provided' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Clinical History</Typography>
                <Typography variant="body1">{report.patientInfo.clinicalHistory}</Typography>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Image Snapshot */}
      {report.imageSnapshot && (
        <Accordion expanded={expandedSections.includes('IMAGE')} onChange={() => handleSectionToggle('IMAGE')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Analyzed Image (Frame {report.imageSnapshot.frameIndex})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`data:image/${report.imageSnapshot.format};base64,${report.imageSnapshot.data}`}
                alt={`Frame ${report.imageSnapshot.frameIndex}`}
                style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #ccc' }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Captured: {new Date(report.imageSnapshot.capturedAt).toLocaleString()}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Report Sections */}
      {report.sections && Object.entries(report.sections).map(([sectionName, sectionContent]: [string, any]) => (
        <Accordion
          key={sectionName}
          expanded={expandedSections.includes(sectionName)}
          onChange={() => handleSectionToggle(sectionName)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{sectionName}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body1"
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                lineHeight: 1.8
              }}
            >
              {sectionContent}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Key Findings Table */}
      {report.keyFindings && report.keyFindings.length > 0 && (
        <Accordion expanded={expandedSections.includes('KEY_FINDINGS')} onChange={() => handleSectionToggle('KEY_FINDINGS')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Key Findings Summary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Finding</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Confidence</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.keyFindings.map((finding: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{finding.finding}</TableCell>
                      <TableCell>{finding.category}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={finding.confidence * 100}
                            color={getConfidenceColor(finding.confidence)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">
                            {(finding.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={finding.severity.toUpperCase()}
                          color={getSeverityColor(finding.severity) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* AI Detections */}
      {report.detections && report.detections.detections && report.detections.detections.length > 0 && (
        <Accordion expanded={expandedSections.includes('DETECTIONS')} onChange={() => handleSectionToggle('DETECTIONS')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              AI Detected Abnormalities
              <Chip
                label={`${report.detections.count} Found`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
              {report.detections.criticalCount > 0 && (
                <Chip
                  label={`${report.detections.criticalCount} Critical`}
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Finding</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Confidence</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.detections.detections.map((detection: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {detection.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {detection.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          ({(detection.boundingBox.x * 100).toFixed(0)}%, {(detection.boundingBox.y * 100).toFixed(0)}%)
                        </Typography>
                        {detection.measurements && Object.keys(detection.measurements).length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {Object.entries(detection.measurements).map(([key, value]: [string, any]) => (
                              <Typography key={key} variant="caption" display="block">
                                {key}: {value}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={detection.confidence * 100}
                            color={getConfidenceColor(detection.confidence)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">
                            {(detection.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={detection.severity}
                          color={getSeverityColor(detection.severity) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Detection recommendations */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detection-Based Recommendations:
              </Typography>
              {report.detections.detections
                .filter((d: any) => d.recommendations && d.recommendations.length > 0)
                .map((detection: any, idx: number) => (
                  <Alert
                    key={idx}
                    severity={detection.severity === 'CRITICAL' ? 'error' : detection.severity === 'HIGH' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                  >
                    <AlertTitle>{detection.label}</AlertTitle>
                    {detection.recommendations.map((rec: string, recIdx: number) => (
                      <Typography key={recIdx} variant="body2">
                        • {rec}
                      </Typography>
                    ))}
                  </Alert>
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* AI Classification Results */}
      {report.classification && (
        <Accordion expanded={expandedSections.includes('CLASSIFICATION')} onChange={() => handleSectionToggle('CLASSIFICATION')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">AI Classification Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Top Prediction</Typography>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h6">{report.classification.topPrediction.label}</Typography>
                <Typography variant="body2">
                  Confidence: {(report.classification.topPrediction.confidence * 100).toFixed(1)}%
                </Typography>
              </Card>
            </Box>

            {report.classification.allPredictions.length > 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>All Predictions</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Rank</strong></TableCell>
                        <TableCell><strong>Classification</strong></TableCell>
                        <TableCell><strong>Confidence</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.classification.allPredictions.map((pred: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{pred.label}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pred.confidence * 100}
                                color={getConfidenceColor(pred.confidence)}
                                sx={{ width: 100, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="body2">
                                {(pred.confidence * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Model: {report.classification.model} | Processing Time: {report.classification.processingTime}ms
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Accordion expanded={expandedSections.includes('RECOMMENDATIONS')} onChange={() => handleSectionToggle('RECOMMENDATIONS')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Clinical Recommendations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {report.recommendations.map((rec: any, idx: number) => (
              <Alert
                key={idx}
                severity={rec.priority === 'urgent' ? 'error' : rec.priority === 'high' ? 'warning' : 'info'}
                icon={rec.priority === 'urgent' ? <WarningIcon /> : <InfoIcon />}
                sx={{ mb: 1 }}
              >
                <AlertTitle>{rec.recommendation}</AlertTitle>
                <Typography variant="body2">{rec.reason}</Typography>
              </Alert>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Quality Metrics */}
      <Accordion expanded={expandedSections.includes('QUALITY')} onChange={() => handleSectionToggle('QUALITY')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Quality Metrics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Overall Confidence</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={report.qualityMetrics.overallConfidence * 100}
                  color={getConfidenceColor(report.qualityMetrics.overallConfidence)}
                  sx={{ flex: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" fontWeight="bold">
                  {(report.qualityMetrics.overallConfidence * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Image Quality</Typography>
              <Chip
                label={report.qualityMetrics.imageQuality.toUpperCase()}
                color={report.qualityMetrics.imageQuality === 'excellent' ? 'success' : 'default'}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Report Completeness</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={report.qualityMetrics.completeness * 100}
                  color="primary"
                  sx={{ flex: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" fontWeight="bold">
                  {(report.qualityMetrics.completeness * 100).toFixed(0)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Reliability Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={report.qualityMetrics.reliability * 100}
                  color="secondary"
                  sx={{ flex: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" fontWeight="bold">
                  {(report.qualityMetrics.reliability * 100).toFixed(0)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Disclaimer */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
        <AlertTitle>Important Disclaimer</AlertTitle>
        <Typography variant="body2">
          This report is generated by AI-assisted analysis and is intended for use as a clinical decision support tool only.
          All findings must be verified by a qualified radiologist. AI systems are assistive tools and should not replace
          clinical judgment or professional medical expertise.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={<CheckCircleIcon />}
            label="Radiologist Review Required"
            color="error"
            size="small"
          />
        </Box>
      </Alert>

      {/* Metadata Footer */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Report Metadata:</strong> Generated at {new Date(report.generatedAt).toLocaleString()} |
          Processing Time: {report.metadata.processingTime}ms |
          Models: {report.metadata.aiModelsUsed.join(', ') || 'None'} |
          Requires Review: {report.metadata.requiresRadiologistReview ? 'Yes' : 'No'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ComprehensiveAIReportViewer;
