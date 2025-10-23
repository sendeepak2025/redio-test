import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Badge,
  Button
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ZoomIn as ZoomInIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface Detection {
  id: string;
  type: string;
  label: string;
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  recommendations: string[];
  measurements?: Record<string, string>;
  metadata: {
    detectedAt: Date;
    model: string;
    modality: string;
  };
}

interface AIDetectionOverlayProps {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  visible?: boolean;
  onDetectionClick?: (detection: Detection) => void;
  onToggleVisibility?: () => void;
}

const AIDetectionOverlay: React.FC<AIDetectionOverlayProps> = ({
  detections,
  imageWidth,
  imageHeight,
  visible = true,
  onDetectionClick,
  onToggleVisibility
}) => {
  const [selectedDetection, setSelectedDetection] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [expandedDetections, setExpandedDetections] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (!visible || !canvasRef.current || !detections.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Clear canvas
    ctx.clearRect(0, 0, imageWidth, imageHeight);

    // Draw each detection
    detections.forEach((detection) => {
      const isSelected = selectedDetection === detection.id;
      const bbox = detection.boundingBox;

      // Convert normalized coordinates to pixels
      const x = bbox.x * imageWidth;
      const y = bbox.y * imageHeight;
      const width = bbox.width * imageWidth;
      const height = bbox.height * imageHeight;

      // Set color based on severity
      const colors = {
        CRITICAL: '#f44336',
        HIGH: '#ff9800',
        MEDIUM: '#ffc107',
        LOW: '#4caf50'
      };
      const color = colors[detection.severity];

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      ctx.strokeRect(x, y, width, height);

      // Draw filled rectangle for selected
      if (isSelected) {
        ctx.fillStyle = `${color}20`;
        ctx.fillRect(x, y, width, height);
      }

      // Draw label if enabled
      if (showLabels) {
        const label = `${detection.label} (${(detection.confidence * 100).toFixed(0)}%)`;
        const padding = 4;
        const fontSize = 12;
        
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(label).width;
        
        // Background
        ctx.fillStyle = color;
        ctx.fillRect(x, y - fontSize - padding * 2, textWidth + padding * 2, fontSize + padding * 2);
        
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + padding, y - padding);
      }

      // Draw corner markers
      const markerSize = 10;
      ctx.fillStyle = color;
      // Top-left
      ctx.fillRect(x - 2, y - 2, markerSize, 2);
      ctx.fillRect(x - 2, y - 2, 2, markerSize);
      // Top-right
      ctx.fillRect(x + width - markerSize + 2, y - 2, markerSize, 2);
      ctx.fillRect(x + width, y - 2, 2, markerSize);
      // Bottom-left
      ctx.fillRect(x - 2, y + height, markerSize, 2);
      ctx.fillRect(x - 2, y + height - markerSize + 2, 2, markerSize);
      // Bottom-right
      ctx.fillRect(x + width - markerSize + 2, y + height, markerSize, 2);
      ctx.fillRect(x + width, y + height - markerSize + 2, 2, markerSize);
    });
  }, [detections, imageWidth, imageHeight, selectedDetection, showLabels, visible]);

  const handleDetectionClick = (detection: Detection) => {
    setSelectedDetection(detection.id === selectedDetection ? null : detection.id);
    onDetectionClick?.(detection);
  };

  const handleToggleExpand = (detectionId: string) => {
    setExpandedDetections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(detectionId)) {
        newSet.delete(detectionId);
      } else {
        newSet.add(detectionId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: Detection['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <ErrorIcon color="error" />;
      case 'HIGH':
        return <WarningIcon color="warning" />;
      case 'MEDIUM':
        return <InfoIcon color="info" />;
      case 'LOW':
        return <CheckCircleIcon color="success" />;
    }
  };

  const getSeverityColor = (severity: Detection['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
    }
  };

  if (!detections || detections.length === 0) {
    return null;
  }

  return (
    <>
      {/* Canvas overlay for bounding boxes */}
      {visible && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      )}

      {/* Detection panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 350,
          maxHeight: '80vh',
          overflow: 'auto',
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          zIndex: 1000
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 AI Detections
              <Badge badgeContent={detections.length} color="primary" />
            </Typography>
            <Box>
              <Tooltip title={showLabels ? 'Hide Labels' : 'Show Labels'}>
                <IconButton
                  size="small"
                  onClick={() => setShowLabels(!showLabels)}
                  sx={{ color: 'white' }}
                >
                  {showLabels ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </Tooltip>
              {onToggleVisibility && (
                <Tooltip title="Toggle Overlay">
                  <IconButton
                    size="small"
                    onClick={onToggleVisibility}
                    sx={{ color: 'white' }}
                  >
                    {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Summary */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {detections.filter(d => d.severity === 'CRITICAL').length > 0 && (
              <Chip
                size="small"
                icon={<ErrorIcon />}
                label={`${detections.filter(d => d.severity === 'CRITICAL').length} Critical`}
                color="error"
                variant="outlined"
              />
            )}
            {detections.filter(d => d.severity === 'HIGH').length > 0 && (
              <Chip
                size="small"
                icon={<WarningIcon />}
                label={`${detections.filter(d => d.severity === 'HIGH').length} High`}
                color="warning"
                variant="outlined"
              />
            )}
            <Chip
              size="small"
              label={`${detections.length} Total`}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </Box>
        </Box>

        {/* Detection list */}
        <List dense>
          {detections.map((detection) => {
            const isExpanded = expandedDetections.has(detection.id);
            const isSelected = selectedDetection === detection.id;

            return (
              <Box key={detection.id}>
                <ListItem
                  button
                  selected={isSelected}
                  onClick={() => handleDetectionClick(detection)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(25, 118, 210, 0.2)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getSeverityIcon(detection.severity)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {detection.label}
                        </Typography>
                        <Chip
                          size="small"
                          label={detection.severity}
                          color={getSeverityColor(detection.severity)}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {(detection.confidence * 100).toFixed(1)}%
                      </Typography>
                    }
                  />

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(detection.id);
                    }}
                    sx={{ color: 'white' }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItem>

                {/* Expanded details */}
                <Collapse in={isExpanded}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    {/* Description */}
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {detection.description}
                    </Typography>

                    {/* Measurements */}
                    {detection.measurements && Object.keys(detection.measurements).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Measurements:
                        </Typography>
                        {Object.entries(detection.measurements).map(([key, value]) => (
                          <Typography key={key} variant="caption" display="block">
                            • {key}: {value}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Recommendations */}
                    {detection.recommendations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Recommendations:
                        </Typography>
                        {detection.recommendations.map((rec, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Location */}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Location: ({(detection.boundingBox.x * 100).toFixed(0)}%, {(detection.boundingBox.y * 100).toFixed(0)}%)
                    </Typography>

                    {/* Zoom to detection */}
                    <Button
                      size="small"
                      startIcon={<ZoomInIcon />}
                      onClick={() => handleDetectionClick(detection)}
                      sx={{ mt: 1, color: 'white' }}
                    >
                      Focus on Detection
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Paper>
    </>
  );
};

export default AIDetectionOverlay;
