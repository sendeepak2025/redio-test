import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Alert,
  Paper,
  LinearProgress,
  Fade,
  Zoom,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
} from '@mui/material'
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Settings as SettingsIcon,
  GraphicEq as WaveIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'

interface VoiceDictationEnhancedProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  showTranscriptPreview?: boolean
  autoInsertPunctuation?: boolean
}

export const VoiceDictationEnhanced: React.FC<VoiceDictationEnhancedProps> = ({
  onTranscript,
  onError,
  disabled = false,
  showTranscriptPreview = true,
  autoInsertPunctuation = true,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [language, setLanguage] = useState('en-US')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([])
  const [confidence, setConfidence] = useState(0)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  
  const recognitionRef = useRef<any>(null)
  const sessionStartRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setIsSupported(false)
      onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      sessionStartRef.current = Date.now()
      setFinalTranscripts([])
      setWordCount(0)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const conf = event.results[i][0].confidence

        if (event.results[i].isFinal) {
          final += transcript + ' '
          maxConfidence = Math.max(maxConfidence, conf)
        } else {
          interim += transcript
        }
      }

      if (interim) {
        setInterimTranscript(interim)
      }

      if (final) {
        const processedText = autoInsertPunctuation ? processPunctuation(final.trim()) : final.trim()
        onTranscript(processedText)
        setFinalTranscripts(prev => [...prev, processedText].slice(-5)) // Keep last 5
        setInterimTranscript('')
        setConfidence(maxConfidence * 100)
        setWordCount(prev => prev + processedText.split(' ').length)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      if (event.error === 'no-speech') {
        // Don't stop on no-speech, just continue
        return
      } else if (event.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow microphone access.')
        setIsListening(false)
      } else if (event.error === 'aborted') {
        // Ignore aborted errors
        return
      } else {
        onError?.(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still listening and not paused
      if (isListening && !isPaused) {
        try {
          recognition.start()
        } catch (e) {
          console.error('Failed to restart recognition:', e)
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [language, onTranscript, onError, isListening, isPaused, autoInsertPunctuation])

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isListening && !isPaused) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isListening, isPaused])

  // Audio visualization
  useEffect(() => {
    if (isListening && !isPaused) {
      initAudioVisualization()
    } else {
      setVolumeLevel(0)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isListening, isPaused])

  const initAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      updateVolume()
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error)
    }
  }

  const updateVolume = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setVolumeLevel(Math.min(100, (average / 128) * 100))
    
    animationFrameRef.current = requestAnimationFrame(updateVolume)
  }

  const processPunctuation = (text: string): string => {
    let processed = text
    
    // Auto-capitalize first letter
    processed = processed.charAt(0).toUpperCase() + processed.slice(1)
    
    // Voice commands for punctuation
    processed = processed.replace(/\s+period\s*/gi, '. ')
    processed = processed.replace(/\s+comma\s*/gi, ', ')
    processed = processed.replace(/\s+question mark\s*/gi, '? ')
    processed = processed.replace(/\s+exclamation mark\s*/gi, '! ')
    processed = processed.replace(/\s+new line\s*/gi, '\n')
    processed = processed.replace(/\s+new paragraph\s*/gi, '\n\n')
    
    return processed
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setIsPaused(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  const togglePause = () => {
    if (!recognitionRef.current) return

    if (isPaused) {
      try {
        recognitionRef.current.start()
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to resume:', error)
      }
    } else {
      recognitionRef.current.stop()
      setIsPaused(true)
    }
  }

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleSettingsClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang
    }
    handleSettingsClose()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Speech recognition is not supported in this browser.
        </Typography>
        <Typography variant="caption">
          Please use Chrome, Edge, or Safari for voice dictation.
        </Typography>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Main Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Tooltip title={isListening ? 'Stop dictation' : 'Start dictation'}>
          <span>
            <IconButton
              onClick={toggleListening}
              disabled={disabled}
              color={isListening ? 'error' : 'default'}
              size="large"
              sx={{
                bgcolor: isListening ? 'error.light' : 'grey.200',
                '&:hover': {
                  bgcolor: isListening ? 'error.main' : 'grey.300',
                },
                transition: 'all 0.3s',
              }}
            >
              {isListening ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </span>
        </Tooltip>

        {isListening && (
          <Zoom in={isListening}>
            <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
              <IconButton
                onClick={togglePause}
                size="small"
                color={isPaused ? 'primary' : 'default'}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </IconButton>
            </Tooltip>
          </Zoom>
        )}

        <Tooltip title="Settings">
          <IconButton onClick={handleSettingsClick} size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {isListening && (
          <Fade in={isListening}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Chip
                icon={<WaveIcon />}
                label={isPaused ? 'Paused' : 'Listening...'}
                color={isPaused ? 'default' : 'error'}
                size="small"
                sx={{
                  animation: isPaused ? 'none' : 'pulse 1.5s infinite',
                }}
              />
              
              <Typography variant="caption" color="text.secondary">
                {formatDuration(sessionDuration)}
              </Typography>
              
              <Badge badgeContent={wordCount} color="primary" max={999}>
                <Typography variant="caption" color="text.secondary">
                  words
                </Typography>
              </Badge>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Volume Indicator */}
      {isListening && !isPaused && (
        <Fade in={isListening && !isPaused}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <WaveIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Audio Level
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={volumeLevel}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: volumeLevel > 70 ? 'success.main' : volumeLevel > 30 ? 'warning.main' : 'error.main',
                  transition: 'transform 0.1s linear',
                },
              }}
            />
          </Box>
        </Fade>
      )}

      {/* Real-time Transcript Preview */}
      {showTranscriptPreview && (isListening || finalTranscripts.length > 0) && (
        <Fade in={isListening || finalTranscripts.length > 0}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'grey.50',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Recent Transcripts
            </Typography>
            
            <List dense disablePadding>
              {finalTranscripts.map((transcript, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                  <CheckIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                  <ListItemText
                    primary={transcript}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.primary',
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {interimTranscript && (
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'primary.light',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    color: 'primary.dark',
                    animation: 'fadeIn 0.3s',
                  }}
                >
                  {interimTranscript}...
                </Typography>
              </Box>
            )}

            {confidence > 0 && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Confidence:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={confidence}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: confidence > 80 ? 'success.main' : confidence > 60 ? 'warning.main' : 'error.main',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(confidence)}%
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      )}

      {/* Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem disabled>
          <Typography variant="caption">Language</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleLanguageChange('en-US')} selected={language === 'en-US'}>
          🇺🇸 English (US)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('en-GB')} selected={language === 'en-GB'}>
          🇬🇧 English (UK)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('es-ES')} selected={language === 'es-ES'}>
          🇪🇸 Spanish
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr-FR')} selected={language === 'fr-FR'}>
          🇫🇷 French
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('de-DE')} selected={language === 'de-DE'}>
          🇩🇪 German
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('it-IT')} selected={language === 'it-IT'}>
          🇮🇹 Italian
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('pt-BR')} selected={language === 'pt-BR'}>
          🇧🇷 Portuguese (BR)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('zh-CN')} selected={language === 'zh-CN'}>
          🇨🇳 Chinese
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('ja-JP')} selected={language === 'ja-JP'}>
          🇯🇵 Japanese
        </MenuItem>
      </Menu>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  )
}

export default VoiceDictationEnhanced
