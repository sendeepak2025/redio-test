import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Divider,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { ReportTemplate, ReportSection, FindingTemplate, saveCustomTemplate } from '../../data/reportTemplates'

interface TemplateBuilderProps {
  open: boolean
  onClose: () => void
  onSave: (template: ReportTemplate) => void
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ open, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState('')
  const [modality, setModality] = useState<string[]>([])
  const [icon, setIcon] = useState('📄')
  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: 'indication',
      title: 'Clinical Indication',
      placeholder: 'Enter clinical indication...',
      required: true,
      type: 'textarea'
    }
  ])
  const [findings, setFindings] = useState<FindingTemplate[]>([])

  const addSection = () => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      placeholder: 'Enter text...',
      required: false,
      type: 'textarea'
    }
    setSections([...sections, newSection])
  }

  const updateSection = (index: number, field: keyof ReportSection, value: any) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const addFinding = () => {
    const newFinding: FindingTemplate = {
      id: `finding-${Date.now()}`,
      label: 'New Finding',
      category: 'General',
      severity: 'normal',
      description: ''
    }
    setFindings([...findings, newFinding])
  }

  const updateFinding = (index: number, field: keyof FindingTemplate, value: any) => {
    const updated = [...findings]
    updated[index] = { ...updated[index], [field]: value }
    setFindings(updated)
  }

  const removeFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const template: ReportTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      category,
      modality,
      icon,
      sections,
      findings
    }

    saveCustomTemplate({
      ...template,
      createdBy: 'User'
    })

    onSave(template)
    handleClose()
  }

  const handleClose = () => {
    setTemplateName('')
    setCategory('')
    setModality([])
    setIcon('📄')
    setSections([{
      id: 'indication',
      title: 'Clinical Indication',
      placeholder: 'Enter clinical indication...',
      required: true,
      type: 'textarea'
    }])
    setFindings([])
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Create Custom Report Template</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Basic Info */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Template Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Icon (Emoji)"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Modality</InputLabel>
                  <Select
                    multiple
                    value={modality}
                    onChange={(e) => setModality(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {['CR', 'DX', 'CT', 'MR', 'US', 'XA', 'RF', 'MG', 'PT', 'NM'].map((mod) => (
                      <MenuItem key={mod} value={mod}>{mod}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Sections */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Report Sections
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addSection} size="small">
                Add Section
              </Button>
            </Box>

            {sections.map((section, index) => (
              <Paper key={section.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Section Title"
                      value={section.title}
                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={section.type}
                        onChange={(e) => updateSection(index, 'type', e.target.value)}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="textarea">Textarea</MenuItem>
                        <MenuItem value="select">Select</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Placeholder"
                      value={section.placeholder}
                      onChange={(e) => updateSection(index, 'placeholder', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton onClick={() => removeSection(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Paper>

          {/* Findings */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Common Findings
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addFinding} size="small">
                Add Finding
              </Button>
            </Box>

            {findings.map((finding, index) => (
              <Paper key={finding.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Finding Label"
                      value={finding.label}
                      onChange={(e) => updateFinding(index, 'label', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Category"
                      value={finding.category}
                      onChange={(e) => updateFinding(index, 'category', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={finding.severity}
                        onChange={(e) => updateFinding(index, 'severity', e.target.value)}
                      >
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="mild">Mild</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="severe">Severe</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={finding.description}
                      onChange={(e) => updateFinding(index, 'description', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton onClick={() => removeFinding(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!templateName || !category || sections.length === 0}
        >
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TemplateBuilder
