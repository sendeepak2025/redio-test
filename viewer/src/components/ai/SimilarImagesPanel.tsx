import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import medicalAIService, { SimilarImage } from '../../services/medicalAIService'
import { useNavigate } from 'react-router-dom'

interface SimilarImagesPanelProps {
  studyInstanceUID: string
  frameIndex: number
  topK?: number
}

export const SimilarImagesPanel: React.FC<SimilarImagesPanelProps> = ({
  studyInstanceUID,
  frameIndex,
  topK = 5
}) => {
  const navigate = useNavigate()
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const findSimilar = async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await medicalAIService.findSimilarImages(
        studyInstanceUID,
        frameIndex,
        topK
      )
      setSimilarImages(results)
    } catch (err: any) {
      console.error('Similar image search failed:', err)
      setError(err.response?.data?.message || 'Failed to find similar images')
    } finally {
      setLoading(false)
    }
  }

  const viewStudy = (studyUID: string) => {
    navigate(`/viewer/${studyUID}`)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Searching for similar images...
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
          startIcon={<SearchIcon />}
          onClick={findSimilar}
          fullWidth
        >
          Retry Search
        </Button>
      </Box>
    )
  }

  if (similarImages.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info" icon={<SearchIcon />} sx={{ mb: 2 }}>
          Find similar cases using AI-powered image similarity search.
        </Alert>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={findSimilar}
          fullWidth
          color="primary"
        >
          Find Similar Images
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Uses MedSigLIP embeddings for semantic similarity
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Similar Cases</Typography>
        <Button
          size="small"
          startIcon={<SearchIcon />}
          onClick={findSimilar}
        >
          Refresh
        </Button>
      </Box>

      {/* Results Grid */}
      <Grid container spacing={2}>
        {similarImages.map((image, idx) => (
          <Grid item xs={12} sm={6} key={idx}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={`/api/dicom/studies/${image.studyInstanceUID}/frames/${image.frameIndex}`}
                alt={`Similar case ${idx + 1}`}
                sx={{ objectFit: 'contain', bgcolor: 'black' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Chip
                    label={`${(image.similarity * 100).toFixed(1)}% match`}
                    size="small"
                    color={image.similarity > 0.8 ? 'success' : 'primary'}
                  />
                  <Chip
                    label={image.modality}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {image.patientInfo && (
                  <Typography variant="caption" color="text.secondary">
                    {image.patientInfo.age && `Age: ${image.patientInfo.age} • `}
                    {image.patientInfo.sex && `Sex: ${image.patientInfo.sex}`}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => viewStudy(image.studyInstanceUID)}
                >
                  View Study
                </Button>
                <Tooltip title="Study UID">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Showing top {similarImages.length} similar cases based on MedSigLIP embeddings
      </Typography>
    </Box>
  )
}

export default SimilarImagesPanel
