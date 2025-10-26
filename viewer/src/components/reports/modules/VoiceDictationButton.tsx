import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  Popover,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { voiceDictationService } from '../../../services/voiceDictationService';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  fieldName?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  fieldName = 'field',
  disabled = false,
  size = 'small'
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showError, setShowError] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceDictation({
    language: voiceDictationService.getLanguage(),
    continuous: true,
    interimResults: true,
    onTranscript: (text) => {
      // Process with medical vocabulary
      const processed = voiceDictationService.processTranscript(text);
      onTranscript(processed);
    },
    onError: (errorMsg) => {
      console.error('Voice dictation error:', errorMsg);
      setShowError(true);
    }
  });

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isSupported) {
      setShowError(true);
      return;
    }

    if (isListening) {
      stopListening();
      setAnchorEl(null);
    } else {
      startListening();
      setAnchorEl(event.currentTarget);
      setShowError(false);
      resetTranscript();
    }
  };

  // Close popover when stopped
  useEffect(() => {
    if (!isListening && anchorEl) {
      const timer = setTimeout(() => {
        setAnchorEl(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isListening, anchorEl]);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip
        title={
          !isSupported
            ? 'Voice dictation not supported in this browser'
            : isListening
            ? 'Click to stop recording'
            : 'Click to start voice dictation'
        }
      >
        <span>
          <IconButton
            onClick={handleClick}
            disabled={disabled || !isSupported}
            size={size}
            color={isListening ? 'error' : 'default'}
            sx={{
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 1
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 0.8
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 1
                }
              }
            }}
          >
            {isListening ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </span>
      </Tooltip>

      {/* Recording Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: 300,
            maxWidth: 400
          }
        }}
      >
        <Box>
          {isListening ? (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CircularProgress size={20} color="error" />
                <Typography variant="subtitle2" color="error">
                  Recording...
                </Typography>
                <Chip
                  label="Listening"
                  color="error"
                  size="small"
                  icon={<MicIcon />}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Speak clearly into your microphone
              </Typography>

              {interimTranscript && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    minHeight: 60
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    {interimTranscript}
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                💡 Say "period", "comma", "new line" for punctuation
              </Typography>
            </>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="success.main">
                ✓ Recording stopped
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Error Alert */}
      {showError && error && (
        <Popover
          open={showError}
          anchorEl={anchorEl}
          onClose={() => setShowError(false)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            onClose={() => setShowError(false)}
            sx={{ maxWidth: 400 }}
          >
            <Typography variant="body2">{error}</Typography>
            {error.includes('not allowed') && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Please allow microphone access in your browser settings
              </Typography>
            )}
          </Alert>
        </Popover>
      )}
    </>
  );
};

export default VoiceDictationButton;
