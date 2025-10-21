import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Assessment as CheckIcon
} from '@mui/icons-material'

const PriorAuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [authorizations, setAuthorizations] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAuth, setSelectedAuth] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    patientID: '',
    patientName: '',
    procedureCode: '',
    procedureDescription: '',
    modality: 'CT',
    bodyPart: '',
    diagnosis: '',
    clinicalIndication: '',
    urgency: 'routine',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  })

  useEffect(() => {
    fetchAuthorizations()
    fetchStats()
  }, [activeTab])

  const fetchAuthorizations = async () => {
    setLoading(true)
    try {
      const statusMap = ['', 'pending', 'in_review', 'approved', 'denied']
      const status = statusMap[activeTab]
      
      const response = await fetch(`/api/prior-auth${status ? `?status=${status}` : ''}`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setAuthorizations(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch authorizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/prior-auth/stats/dashboard', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'denied': return 'error'
      case 'pending': return 'warning'
      case 'in_review': return 'info'
      default: return 'default'
    }
  }

  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/prior-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          diagnosis: formData.diagnosis.split(',').map(d => d.trim()).filter(Boolean)
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`✅ Authorization ${data.automation.autoApproved ? 'Auto-Approved' : 'Created'}\n\nAuth #: ${data.data.authorizationNumber}\nConfidence: ${data.automation.confidence}%`)
        setShowCreateDialog(false)
        fetchAuthorizations()
        fetchStats()
        // Reset form
        setFormData({
          patientID: '',
          patientName: '',
          procedureCode: '',
          procedureDescription: '',
          modality: 'CT',
          bodyPart: '',
          diagnosis: '',
          clinicalIndication: '',
          urgency: 'routine',
          insuranceProvider: '',
          insurancePolicyNumber: ''
        })
      } else {
        alert('Failed to create authorization: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating authorization:', error)
      alert('Failed to create authorization')
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 3, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            🏥 Prior Authorization
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => { fetchAuthorizations(); fetchStats(); }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              New Request
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        {stats && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="caption">Total</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                  <Typography variant="caption">Pending</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">{stats.approved}</Typography>
                  <Typography variant="caption">Approved</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="error.main">{stats.denied}</Typography>
                  <Typography variant="caption">Denied</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="info.main">{stats.inReview}</Typography>
                  <Typography variant="caption">In Review</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.autoApprovalRate}%</Typography>
                  <Typography variant="caption">Auto-Approved</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label={<Badge badgeContent={stats?.total} color="default">All</Badge>} />
          <Tab label={<Badge badgeContent={stats?.pending} color="warning">Pending</Badge>} />
          <Tab label={<Badge badgeContent={stats?.inReview} color="info">In Review</Badge>} />
          <Tab label={<Badge badgeContent={stats?.approved} color="success">Approved</Badge>} />
          <Tab label={<Badge badgeContent={stats?.denied} color="error">Denied</Badge>} />
        </Tabs>
      </Paper>

      {/* Table */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Auth #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Procedure</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authorizations.map((auth) => (
                <TableRow key={auth._id} hover>
                  <TableCell>{auth.authorizationNumber}</TableCell>
                  <TableCell>{auth.patientName}</TableCell>
                  <TableCell>
                    {auth.procedureDescription}
                    <br />
                    <Typography variant="caption">{auth.modality} - {auth.bodyPart}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={auth.status} size="small" color={getStatusColor(auth.status)} />
                  </TableCell>
                  <TableCell>
                    {auth.automatedChecks && (
                      <Typography variant="body2">
                        {Object.values(auth.automatedChecks).filter((c: any) => c.passed).length}/4 checks passed
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{new Date(auth.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedAuth(auth)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Prior Authorization Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Patient ID"
                value={formData.patientID}
                onChange={(e) => setFormData({ ...formData, patientID: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Patient Name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Procedure Code (CPT)"
                value={formData.procedureCode}
                onChange={(e) => setFormData({ ...formData, procedureCode: e.target.value })}
                placeholder="e.g., 70450"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Procedure Description"
                value={formData.procedureDescription}
                onChange={(e) => setFormData({ ...formData, procedureDescription: e.target.value })}
                placeholder="e.g., CT Head without contrast"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Modality"
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="CT">CT</option>
                <option value="MR">MR</option>
                <option value="XR">X-Ray</option>
                <option value="US">Ultrasound</option>
                <option value="NM">Nuclear Medicine</option>
                <option value="PT">PET</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Body Part"
                value={formData.bodyPart}
                onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                placeholder="e.g., Head"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
                <option value="emergency">Emergency</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis Codes (ICD-10)"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g., G43.909, R51"
                helperText="Comma-separated ICD-10 codes"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Clinical Indication"
                value={formData.clinicalIndication}
                onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
                placeholder="Describe the clinical reason for this procedure..."
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Insurance Provider"
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                placeholder="e.g., Blue Cross"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Number"
                value={formData.insurancePolicyNumber}
                onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                placeholder="Insurance policy number"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateRequest}
            disabled={!formData.patientID || !formData.procedureCode || !formData.diagnosis}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PriorAuthPage
