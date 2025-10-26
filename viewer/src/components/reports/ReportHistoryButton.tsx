import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Tooltip } from '@mui/material';
import { Assignment as ReportIcon } from '@mui/icons-material';
import ReportHistoryTab from './ReportHistoryTab';

interface ReportHistoryButtonProps {
  studyInstanceUID: string;
}

/**
 * Simple button to open Report History
 * Add this to your Medical Viewer toolbar
 */
const ReportHistoryButton: React.FC<ReportHistoryButtonProps> = ({ studyInstanceUID }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="📋 Report History">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            color: '#00ff41',
            '&:hover': { backgroundColor: 'rgba(0, 255, 65, 0.1)' }
          }}
        >
          <ReportIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#00ff41'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>
          📋 Report History
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <ReportHistoryTab studyInstanceUID={studyInstanceUID} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportHistoryButton;
