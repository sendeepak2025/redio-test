import React, { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { SeriesSelector } from '../components/viewer/SeriesSelector'

// Test page to verify SeriesSelector works
export const TestSeriesSelector: React.FC = () => {
  const [selectedSeriesUID, setSelectedSeriesUID] = useState('series-1')

  const testSeries = [
    {
      seriesInstanceUID: 'series-1',
      seriesNumber: '1',
      seriesDescription: 'SCOUT',
      modality: 'CT',
      numberOfInstances: 2,
      instances: []
    },
    {
      seriesInstanceUID: 'series-2',
      seriesNumber: '2',
      seriesDescription: 'Pre Contrast Chest',
      modality: 'CT',
      numberOfInstances: 132,
      instances: []
    },
    {
      seriesInstanceUID: 'series-3',
      seriesNumber: '3',
      seriesDescription: 'lung',
      modality: 'CT',
      numberOfInstances: 132,
      instances: []
    }
  ]

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.900' }}>
      {/* Series Selector */}
      <SeriesSelector
        series={testSeries}
        selectedSeriesUID={selectedSeriesUID}
        onSeriesSelect={(uid) => {
          console.log('Selected series:', uid)
          setSelectedSeriesUID(uid)
        }}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4, color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Series Selector Test Page
        </Typography>

        <Typography variant="h6" sx={{ mt: 4 }}>
          Selected Series: {selectedSeriesUID}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" gutterBottom>
            Test Series Data:
          </Typography>
          <pre style={{ background: '#333', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(testSeries, null, 2)}
          </pre>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" gutterBottom>
            Quick Tests:
          </Typography>
          <Button
            variant="contained"
            onClick={() => setSelectedSeriesUID('series-2')}
            sx={{ mr: 2 }}
          >
            Select Series 2
          </Button>
          <Button
            variant="contained"
            onClick={() => setSelectedSeriesUID('series-3')}
          >
            Select Series 3
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.dark', borderRadius: 1 }}>
          <Typography variant="body2">
            ✅ If you can see the sidebar on the left with 3 series, SeriesSelector component is working!
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            ✅ Try clicking different series in the sidebar - the selected series UID should update above.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default TestSeriesSelector
