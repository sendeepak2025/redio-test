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
} from '@mui/material'
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'

interface VoiceDictationProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export const VoiceDictation: React.FC<VoiceDictationProps> = ({
  onTranscript,
  onError,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [language, setLanguage] = useState('en-US')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
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

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (interim) {
        setInterimTranscript(interim)
      }

      if (final) {
        onTranscript(final.trim())
        setInterimTranscript('')
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      if (event.error === 'no-speech') {
        onError?.('No speech detected. Please try again.')
      } else if (event.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow microphone access.')
      } else {
        onError?.(`Speech recognition error: ${event.error}`)
      }
      
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, onTranscript, onError])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
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

  if (!isSupported) {
    return (
      <Tooltip title="Speech recognition not supported">
        <span>
          <IconButton disabled size="small">
            <MicOffIcon />
          </IconButton>
        </span>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={isListening ? 'Stop dictation' : 'Start dictation'}>
        <IconButton
          onClick={toggleListening}
          disabled={disabled}
          color={isListening ? 'error' : 'default'}
          size="small"
        >
          {isListening ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Dictation settings">
        <IconButton onClick={handleSettingsClick} size="small">
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {isListening && (
        <Chip
          label="Listening..."
          color="error"
          size="small"
          sx={{ animation: 'pulse 1.5s infinite' }}
        />
      )}

      {interimTranscript && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {interimTranscript}
        </Typography>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem disabled>
          <Typography variant="caption">Select Language</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('en-US')} selected={language === 'en-US'}>
          English (US)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('en-GB')} selected={language === 'en-GB'}>
          English (UK)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('es-ES')} selected={language === 'es-ES'}>
          Spanish
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr-FR')} selected={language === 'fr-FR'}>
          French
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('de-DE')} selected={language === 'de-DE'}>
          German
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('it-IT')} selected={language === 'it-IT'}>
          Italian
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('pt-BR')} selected={language === 'pt-BR'}>
          Portuguese (BR)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('zh-CN')} selected={language === 'zh-CN'}>
          Chinese (Simplified)
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('ja-JP')} selected={language === 'ja-JP'}>
          Japanese
        </MenuItem>
      </Menu>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  )
}

export default VoiceDictation
