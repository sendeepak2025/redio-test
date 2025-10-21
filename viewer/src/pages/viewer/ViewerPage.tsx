import React, { useState, useEffect } from 'react'
import {
  Box,
  Alert,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Stack,
  Fade,
  Slide,
  alpha,
  useTheme,
  ButtonBase,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Layers,
  ViewInAr,
  Psychology,
  ImageSearch,
  Description,
  Fullscreen,
  FullscreenExit,
  Share,
  Download,
  ZoomIn,
  ZoomOut,
  RotateRight,
  Contrast,
  Brightness7,
  Settings,
  Close,
  GridOn,
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { MedicalImageViewer } from '../../components/viewer/MedicalImageViewer'
import Cornerstone3DViewer from '../../components/viewer/Cornerstone3DViewer'
import { VolumeViewer3D } from '../../components/viewer/VolumeViewer3D'
import { ReportingInterface } from '../../components/reporting/ReportingInterface'
import EnhancedReportingInterface from '../../components/reporting/EnhancedReportingInterface'
import { PatientContextPanel } from '../../components/worklist/PatientContextPanel'
import AIAnalysisPanel from '../../components/ai/AIAnalysisPanel'
import SimilarImagesPanel from '../../components/ai/SimilarImagesPanel'
import ApiService from '../../services/ApiService'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`viewer-tabpanel-${index}`}
      aria-labelledby={`viewer-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  )
}

const ViewerPage: React.FC = () => {
  const theme = useTheme()
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>()
  console.log(studyInstanceUID)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studyData, setStudyData] = useState<any>({
    studyInstanceUID: '',
    studyDate: '',
    studyTime: '',
    patientName: '',
    patientID: '',
    modality: '',
    studyDescription: '',
    series: [{
      seriesInstanceUID: '',
      seriesNumber: 1,
      modality: '',
      seriesDescription: '',
      numberOfInstances: 96,
      instances: [{
        sopInstanceUID: '',
        instanceNumber: 1
      }]
    }]
  })
  const [patientContext, setPatientContext] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [viewerType, setViewerType] = useState<'legacy' | 'cornerstone3d' | '3d'>('legacy')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState<any>(null)

  // Load study data from DICOM API
  useEffect(() => {
    const loadStudyData = async () => {
      if(!studyInstanceUID) return
      try {
        setIsLoading(true)
        setError(null)
        
        // Use provided studyInstanceUID or default to real DICOM file
        const currentStudyUID = studyInstanceUID 
        
        console.log('Loading study data for:', currentStudyUID)
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API call timeout')), 5000)
        })
        
        try {
          // Fetch study details from DICOM API with timeout
          const result = await Promise.race([
            ApiService.getStudyMetadata(currentStudyUID),
            timeoutPromise
          ])
          
          console.log('Study data loaded successfully:', result)
          setStudyData(result?.data)
          
          // Skip FHIR loading for now to avoid errors
          console.log('Skipping FHIR patient context loading')
          setPatientContext(null)
          
        } catch (apiErr) {
          console.warn('API call failed or timed out, using fallback data:', apiErr)
          throw apiErr // Re-throw to trigger fallback below
        }
        
      } catch (err) {
        console.error('Error loading study data, using fallback:', err)
        setError(null) // Clear error since we're using fallback
        
        // Fallback to demo data for development
        const fallbackData = {
          studyInstanceUID: studyInstanceUID || '1.3.12.2.1107.5.4.3.123456789012345.19950922.121803.6',
          studyDate: '19950922',
          studyTime: '121803',
          patientName: 'Rubo^DEMO',
          patientID: 'DEMO001',
          modality: 'XA',
          studyDescription: 'X-Ray Angiography Study',
          series: [
            {
              seriesInstanceUID: '1.3.12.2.1107.5.4.3.123456789012345.19950922.121803.8',
              seriesNumber: 1,
              modality: 'XA',
              seriesDescription: 'Angiography Series',
              numberOfInstances: 96,
              instances: [
                {
                  sopInstanceUID: '1.3.12.2.1107.5.4.3.321890.19960124.162922.29.0',
                  instanceNumber: 1
                }
              ]
            }
          ]
        }
        
        console.log('Using fallback demo data:', fallbackData)
        setStudyData(fallbackData)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudyData()
  }, [studyInstanceUID])

  useEffect(() => {
    if (studyData?.series?.[0]) {
      setSelectedSeries(studyData.series[0])
    }
  }, [studyData])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (isLoading || !studyInstanceUID) {
    return (
      <>
        <Helmet>
          <title>Loading Viewer - Medical Imaging Viewer</title>
        </Helmet>
        
        <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#000',
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '3px solid',
                borderColor: `${alpha(theme.palette.primary.main, 0.3)}`,
                borderTopColor: theme.palette.primary.main,
                animation: 'spin 1s linear infinite',
                mx: 'auto',
                mb: 2,
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 300 }}>
              Loading Study...
            </Typography>
          </Box>
        </Box>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Error - Medical Imaging Viewer</title>
        </Helmet>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: '#000',
        }}>
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Error Loading Study
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Paper>
        </Box>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{`Viewer - ${studyData?.studyDescription || 'Medical Study'}`}</title>
      </Helmet>
      
      <Box sx={{ 
        height: '100vh', 
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modern Header */}
        <Fade in={showToolbar}>
          <Box
            sx={{
              position: 'relative',
              zIndex: 1000,
              backdropFilter: 'blur(20px)',
              bgcolor: alpha('#000', 0.8),
              borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {/* Left Section */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title="Back to Dashboard">
                  <IconButton
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      color: 'white',
                      bgcolor: alpha('#fff', 0.1),
                      '&:hover': { bgcolor: alpha('#fff', 0.2) },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <ArrowBack fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Box>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                    {studyData?.patientName?.replace('^', ', ') || 'Unknown Patient'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      ID: {studyData?.patientID || 'N/A'}
                    </Typography>
                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: alpha('#fff', 0.4) }} />
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      {studyData?.studyDate ? 
                        new Date(studyData.studyDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toLocaleDateString() 
                        : 'N/A'
                      }
                    </Typography>
                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: alpha('#fff', 0.4) }} />
                    <Chip 
                      label={studyData?.modality || 'Unknown'} 
                      size="small" 
                      sx={{ 
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.light,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>

              {/* Center Section - View Mode Selector */}
              <Stack direction="row" spacing={0.5} sx={{
                bgcolor: alpha('#fff', 0.05),
                borderRadius: 2,
                p: 0.5,
              }}>
                <Tooltip title="2D Stack View">
                  <ButtonBase
                    onClick={() => setViewerType('legacy')}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      color: viewerType === 'legacy' ? 'white' : alpha('#fff', 0.6),
                      bgcolor: viewerType === 'legacy' ? alpha(theme.palette.primary.main, 0.3) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: viewerType === 'legacy' ? alpha(theme.palette.primary.main, 0.4) : alpha('#fff', 0.1),
                        color: 'white',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Layers fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        2D Stack
                      </Typography>
                    </Stack>
                  </ButtonBase>
                </Tooltip>
                
                <Tooltip title="Cornerstone View">
                  <ButtonBase
                    onClick={() => setViewerType('cornerstone3d')}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      color: viewerType === 'cornerstone3d' ? 'white' : alpha('#fff', 0.6),
                      bgcolor: viewerType === 'cornerstone3d' ? alpha(theme.palette.primary.main, 0.3) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: viewerType === 'cornerstone3d' ? alpha(theme.palette.primary.main, 0.4) : alpha('#fff', 0.1),
                        color: 'white',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GridOn fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Cornerstone
                      </Typography>
                    </Stack>
                  </ButtonBase>
                </Tooltip>
                
                <Tooltip title="3D Volume View">
                  <ButtonBase
                    onClick={() => setViewerType('3d')}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      color: viewerType === '3d' ? 'white' : alpha('#fff', 0.6),
                      bgcolor: viewerType === '3d' ? alpha(theme.palette.primary.main, 0.3) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: viewerType === '3d' ? alpha(theme.palette.primary.main, 0.4) : alpha('#fff', 0.1),
                        color: 'white',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ViewInAr fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        3D Volume
                      </Typography>
                    </Stack>
                  </ButtonBase>
                </Tooltip>
              </Stack>

              {/* Right Section - Actions */}
              <Stack direction="row" spacing={1}>
                <Tooltip title="Share Study">
                  <IconButton
                    sx={{
                      color: alpha('#fff', 0.6),
                      bgcolor: alpha('#fff', 0.05),
                      '&:hover': { bgcolor: alpha('#fff', 0.1), color: 'white' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Share fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Download">
                  <IconButton
                    sx={{
                      color: alpha('#fff', 0.6),
                      bgcolor: alpha('#fff', 0.05),
                      '&:hover': { bgcolor: alpha('#fff', 0.1), color: 'white' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                  <IconButton
                    onClick={toggleFullscreen}
                    sx={{
                      color: alpha('#fff', 0.6),
                      bgcolor: alpha('#fff', 0.05),
                      '&:hover': { bgcolor: alpha('#fff', 0.1), color: 'white' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Box>
        </Fade>

        {/* Main Content Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Viewer Area with Tabs */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Modern Tab Navigation */}
            <Box sx={{ 
              borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
              bgcolor: alpha('#000', 0.5),
              backdropFilter: 'blur(10px)',
            }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: alpha('#fff', 0.6),
                    textTransform: 'none',
                    fontWeight: 600,
                    '&.Mui-selected': {
                      color: 'white',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: theme.palette.primary.main,
                  },
                }}
              >
                <Tab label="Image Viewer" />
                <Tab label="AI Analysis" />
                <Tab label="Similar Cases" />
                <Tab label="Structured Reporting" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              <TabPanel value={activeTab} index={0}>
                {studyData ? (
                  viewerType === '3d' ? (
                    <VolumeViewer3D
                      studyInstanceUID={studyData.studyInstanceUID}
                      frameUrls={Array.from(
                        { length: studyData.series?.[0]?.numberOfInstances || 1 },
                        (_, i) => `/api/dicom/studies/${studyData.studyInstanceUID}/frames/${i}`
                      )}
                      totalFrames={studyData.series?.[0]?.numberOfInstances || 1}
                    />
                  ) : viewerType === 'cornerstone3d' ? (
                    <Cornerstone3DViewer
                      studyInstanceUID={studyData.studyInstanceUID}
                      seriesInstanceUID={studyData.series?.[0]?.seriesInstanceUID}
                      sopInstanceUIDs={studyData.series?.[0]?.instances?.map((instance: any) => instance.sopInstanceUID) || []}
                      dicomWebBaseUrl="/api/dicom"
                      mode="stack"
                    />
                  ) : (
                    <MedicalImageViewer
                      studyInstanceUID={studyData.studyInstanceUID}
                      seriesInstanceUID={studyData.series?.[0]?.seriesInstanceUID || 'default-series'}
                      sopInstanceUIDs={studyData.series?.[0]?.instances?.map((instance: any) => instance.sopInstanceUID) || []}
                      isLoading={isLoading}
                      error={error || undefined}
                    />
                  )
                ) : (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.900'
                  }}>
                    <Typography variant="h6" color="grey.400">
                      No study data available
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {studyData ? (
                  <AIAnalysisPanel
                    studyInstanceUID={studyData.studyInstanceUID}
                    frameIndex={0}
                    patientContext={{
                      age: studyData.patientAge,
                      sex: studyData.patientSex,
                      clinicalHistory: studyData.clinicalHistory,
                      indication: studyData.indication
                    }}
                  />
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" color="text.secondary">
                      No study data available for AI analysis
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {studyData ? (
                  <SimilarImagesPanel
                    studyInstanceUID={studyData.studyInstanceUID}
                    frameIndex={0}
                    topK={5}
                  />
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" color="text.secondary">
                      No study data available for similarity search
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {studyData ? (
                  <EnhancedReportingInterface
                    studyInstanceUID={studyData.studyInstanceUID}
                    patientId={studyData.patientID}
                    onReportFinalized={(report) => {
                      console.log('Report finalized:', report)
                      // Could show success message or navigate
                    }}
                  />
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" color="text.secondary">
                      No study data available for reporting
                    </Typography>
                  </Box>
                )}
              </TabPanel>
              
              {/* Floating Toolbar - Only show on Image Viewer tab */}
              {activeTab === 0 && (
                <Fade in={showToolbar}>
                  <Paper
                    sx={{
                      position: 'absolute',
                      bottom: 24,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backdropFilter: 'blur(20px)',
                      bgcolor: alpha('#000', 0.7),
                      border: `1px solid ${alpha('#fff', 0.1)}`,
                      borderRadius: 3,
                      px: 2,
                      py: 1,
                      display: 'flex',
                      gap: 1,
                      zIndex: 100,
                    }}
                  >
                    <Tooltip title="Zoom In">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <ZoomIn fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <ZoomOut fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#fff', 0.2), mx: 0.5 }} />
                    <Tooltip title="Rotate">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <RotateRight fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Contrast">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <Contrast fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Brightness">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <Brightness7 fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#fff', 0.2), mx: 0.5 }} />
                    <Tooltip title="Settings">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <Settings fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Box>

          {/* Series Thumbnails Strip */}
          {studyData?.series && studyData.series.length > 1 && (
            <Fade in={showToolbar}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backdropFilter: 'blur(20px)',
                  bgcolor: alpha('#000', 0.7),
                  border: `1px solid ${alpha('#fff', 0.1)}`,
                  borderRadius: 2,
                  p: 1,
                  maxHeight: '60vh',
                  overflow: 'auto',
                  zIndex: 100,
                  '&::-webkit-scrollbar': {
                    width: 4,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha('#fff', 0.3),
                    borderRadius: 2,
                  },
                }}
              >
                <Stack spacing={1}>
                  {studyData.series.map((series: any) => (
                    <Tooltip key={series.seriesInstanceUID} title={series.seriesDescription} placement="right">
                      <ButtonBase
                        onClick={() => setSelectedSeries(series)}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1.5,
                          border: `2px solid ${
                            selectedSeries?.seriesInstanceUID === series.seriesInstanceUID
                              ? theme.palette.primary.main
                              : alpha('#fff', 0.2)
                          }`,
                          bgcolor: alpha('#fff', 0.05),
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': {
                            border: `2px solid ${theme.palette.primary.light}`,
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexDirection: 'column',
                          p: 1,
                        }}>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                            #{series.seriesNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: alpha('#fff', 0.6), fontSize: '0.65rem' }}>
                            {series.numberOfInstances} img
                          </Typography>
                        </Box>
                      </ButtonBase>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>
    </>
  )
}

export default ViewerPage