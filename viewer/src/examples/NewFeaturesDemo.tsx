/**
 * Demo component showing how to use the new features:
 * 1. Voice Dictation
 * 2. Comparison Viewer
 * 3. Hanging Protocols
 */

import React, { useState } from 'react'
import {
    Box,
    Container,
    Paper,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Alert,
} from '@mui/material'
import { VoiceDictationEnhanced } from '../components/reporting/VoiceDictationEnhanced'
import { ComparisonViewer } from '../components/viewer/ComparisonViewer'
import { HangingProtocols } from '../components/viewer/HangingProtocols'

export const NewFeaturesDemo: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0)

    // Voice Dictation Demo State
    const [dictationText, setDictationText] = useState('')
    const [dictationError, setDictationError] = useState('')

    // Comparison Viewer Demo State
    const mockCurrentStudy = {
        studyInstanceUID: '1.2.840.113619.2.1.1',
        studyDate: '2024-01-15',
        studyDescription: 'CT Chest with Contrast',
        modality: 'CT',
        patientName: 'Demo Patient',
        seriesCount: 3,
    }

    const mockPriorStudies = [
        {
            studyInstanceUID: '1.2.840.113619.2.1.2',
            studyDate: '2023-06-10',
            studyDescription: 'CT Chest',
            modality: 'CT',
            patientName: 'Demo Patient',
            seriesCount: 2,
        },
        {
            studyInstanceUID: '1.2.840.113619.2.1.3',
            studyDate: '2022-12-05',
            studyDescription: 'CT Chest',
            modality: 'CT',
            patientName: 'Demo Patient',
            seriesCount: 2,
        },
    ]

    // Hanging Protocols Demo State
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null)

    const handleDictationTranscript = (text: string) => {
        setDictationText((prev) => prev + ' ' + text)
        setDictationError('')
    }

    const handleDictationError = (error: string) => {
        setDictationError(error)
    }

    const handleStudyLoad = (studyUID: string, position: 'left' | 'right') => {
        console.log(`Loading study ${studyUID} into ${position} viewport`)
        // In real implementation, load DICOM data here
    }

    const handleProtocolApply = (protocol: any) => {
        setSelectedProtocol(protocol)
        console.log('Applying hanging protocol:', protocol)
        // In real implementation, configure viewport layout here
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                New Features Demo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Demonstration of Voice Dictation, Comparison Viewer, and Hanging Protocols
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label="Voice Dictation" />
                    <Tab label="Comparison Viewer" />
                    <Tab label="Hanging Protocols" />
                </Tabs>
            </Paper>

            {/* Voice Dictation Demo */}
            {activeTab === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Voice Dictation Demo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Click the microphone button and start speaking. Your speech will be
                        transcribed in real-time.
                    </Typography>

                    {dictationError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {dictationError}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <VoiceDictationEnhanced
                            onTranscript={handleDictationTranscript}
                            onError={handleDictationError}
                            showTranscriptPreview={true}
                            autoInsertPunctuation={true}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        label="Transcribed Text"
                        value={dictationText}
                        onChange={(e) => setDictationText(e.target.value)}
                        placeholder="Start dictating to see text appear here..."
                    />

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setDictationText('')}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                navigator.clipboard.writeText(dictationText)
                                alert('Copied to clipboard!')
                            }}
                        >
                            Copy to Clipboard
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Comparison Viewer Demo */}
            {activeTab === 1 && (
                <Paper sx={{ p: 3, height: '80vh' }}>
                    <Typography variant="h6" gutterBottom>
                        Comparison Viewer Demo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Compare current study with prior studies side-by-side. Toggle sync
                        options to synchronize scrolling, window/level, and zoom.
                    </Typography>

                    <Box sx={{ height: 'calc(100% - 80px)' }}>
                        <ComparisonViewer
                            currentStudy={mockCurrentStudy}
                            availablePriorStudies={mockPriorStudies}
                            onStudyLoad={handleStudyLoad}
                            onClose={() => alert('Close comparison')}
                        />
                    </Box>
                </Paper>
            )}

            {/* Hanging Protocols Demo */}
            {activeTab === 2 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Hanging Protocols Demo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Select a hanging protocol to automatically arrange viewports based on
                        modality and body part. You can also create custom protocols.
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <HangingProtocols
                            currentModality="CT"
                            currentBodyPart="CHEST"
                            onProtocolApply={handleProtocolApply}
                        />
                    </Box>

                    {selectedProtocol && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">
                                Selected Protocol: {selectedProtocol.name}
                            </Typography>
                            <Typography variant="body2">
                                Layout: {selectedProtocol.layout.rows} rows ×{' '}
                                {selectedProtocol.layout.cols} columns
                            </Typography>
                            <Typography variant="body2">
                                Viewports: {selectedProtocol.viewports.length}
                            </Typography>
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: selectedProtocol
                                ? `repeat(${selectedProtocol.layout.cols}, 1fr)`
                                : 'repeat(2, 1fr)',
                            gridTemplateRows: selectedProtocol
                                ? `repeat(${selectedProtocol.layout.rows}, 300px)`
                                : 'repeat(2, 300px)',
                            gap: 1,
                            mt: 2,
                        }}
                    >
                        {selectedProtocol ? (
                            Array.from({
                                length:
                                    selectedProtocol.layout.rows * selectedProtocol.layout.cols,
                            }).map((_, index) => (
                                <Paper
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.900',
                                        color: 'white',
                                    }}
                                >
                                    <Typography>Viewport {index + 1}</Typography>
                                </Paper>
                            ))
                        ) : (
                            <>
                                <Paper
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.900',
                                        color: 'white',
                                    }}
                                >
                                    <Typography>Select a protocol</Typography>
                                </Paper>
                                <Paper
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.900',
                                        color: 'white',
                                    }}
                                >
                                    <Typography>to see layout</Typography>
                                </Paper>
                            </>
                        )}
                    </Box>
                </Paper>
            )}
        </Container>
    )
}

export default NewFeaturesDemo
