import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { getAllTemplates, ReportTemplate, deleteCustomTemplate } from '../../data/reportTemplates'
import TemplateBuilder from './TemplateBuilder'
import StructuredReporting from './StructuredReporting'

interface EnhancedReportingInterfaceProps {
  studyInstanceUID: string
  patientId: string
  onReportFinalized?: (report: any) => void
}

const EnhancedReportingInterface: React.FC<EnhancedReportingInterfaceProps> = ({
  studyInstanceUID,
  patientId,
  onReportFinalized
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
  const [showReportEditor, setShowReportEditor] = useState(false)
  const [templates, setTemplates] = useState(getAllTemplates())

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setShowReportEditor(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      deleteCustomTemplate(templateId)
      setTemplates(getAllTemplates())
    }
  }

  const handleTemplateSaved = () => {
    setTemplates(getAllTemplates())
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal': return 'success'
      case 'mild': return 'info'
      case 'moderate': return 'warning'
      case 'severe': return 'error'
      default: return 'default'
    }
  }

  if (showReportEditor && selectedTemplate) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedTemplate.icon} {selectedTemplate.name}
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setShowReportEditor(false)
              setSelectedTemplate(null)
            }}
          >
            Back to Templates
          </Button>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <StructuredReporting
            studyData={{
              studyInstanceUID,
              patientID: patientId,
              patientName: 'Patient',
              studyDate: new Date().toISOString().split('T')[0],
              modality: selectedTemplate.modality[0] || 'OT',
              studyDescription: selectedTemplate.name
            }}
            measurements={[]}
            annotations={[]}
            onSave={(report) => {
              console.log('Report saved:', report)
              onReportFinalized?.(report)
            }}
            template={selectedTemplate}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📋 Report Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a template to start creating your report
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowTemplateBuilder(true)}
          size="large"
        >
          Create Custom Template
        </Button>
      </Box>

      {/* Template Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h3" component="div">
                    {template.icon}
                  </Typography>
                  {'isCustom' in template && template.isCustom && (
                    <Chip label="Custom" size="small" color="secondary" />
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.category}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {template.modality.map((mod) => (
                    <Chip key={mod} label={mod} size="small" variant="outlined" />
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary">
                  {template.sections.length} sections • {template.findings.length} findings
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleTemplateSelect(template)}
                >
                  Use Template
                </Button>
                {'isCustom' in template && template.isCustom && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Builder Dialog */}
      <TemplateBuilder
        open={showTemplateBuilder}
        onClose={() => setShowTemplateBuilder(false)}
        onSave={handleTemplateSaved}
      />
    </Box>
  )
}

export default EnhancedReportingInterface
