# Unified Report Editor - Developer Quick Reference

## Import

```typescript
import { UnifiedReportEditor } from '@/components/reports';
```

## Basic Usage

### Create from AI Analysis
```typescript
<UnifiedReportEditor
  analysisId="analysis_123"
  studyInstanceUID="1.2.840.113619.2.55.3.123456789"
  patientInfo={{
    patientID: "PAT001",
    patientName: "John Doe",
    modality: "CT"
  }}
  onReportCreated={(reportId) => {
    console.log('Report created:', reportId);
  }}
  onReportSigned={() => {
    console.log('Report signed');
  }}
/>
```

### Edit Existing Report
```typescript
<UnifiedReportEditor
  reportId="report_456"
  studyInstanceUID="1.2.840.113619.2.55.3.123456789"
  onReportSigned={() => {
    console.log('Report signed');
  }}
/>
```

## Props Interface

```typescript
interface UnifiedReportEditorProps {
  // Either analysisId (for new) or reportId (for existing)
  analysisId?: string;
  reportId?: string;
  
  // Required
  studyInstanceUID: string;
  
  // Optional patient info
  patientInfo?: {
    patientID: string;
    patientName: string;
    modality: string;
  };
  
  // Callbacks
  onReportCreated?: (reportId: string) => void;
  onReportSigned?: () => void;
}
```

## Data Structures

### Finding
```typescript
interface Finding {
  id: string;
  location: string;
  description: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
}
```

### Measurement
```typescript
interface Measurement {
  id: string;
  type: string;
  value: number;
  unit: 'mm' | 'cm' | 'degrees' | 'HU';
  location: string;
}
```

## API Endpoints

### Create from AI Analysis
```typescript
POST /api/reports/create-from-analysis
Headers: { Authorization: 'Bearer <token>' }
Body: {
  analysisId: string;
  studyInstanceUID: string;
  patientInfo: {
    patientID: string;
    patientName: string;
    modality: string;
  };
}
Response: Report object
```

### Get Report
```typescript
GET /api/reports/:id
Headers: { Authorization: 'Bearer <token>' }
Response: Report object
```

### Update Report
```typescript
PUT /api/reports/:id
Headers: { Authorization: 'Bearer <token>' }
Body: {
  findings?: string;
  impression?: string;
  recommendations?: string;
  clinicalHistory?: string;
  technique?: string;
  structuredFindings?: Finding[];
  measurements?: Measurement[];
  recommendationsList?: string[];
}
Response: Updated report object
```

### Sign Report
```typescript
POST /api/reports/:id/sign
Headers: { 
  Authorization: 'Bearer <token>',
  Content-Type: 'multipart/form-data'
}
Body: FormData {
  signature?: File (PNG image);
  signatureText?: string;
}
Response: Signed report object
```

## State Management

### Internal State
```typescript
// Report data
const [report, setReport] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [signing, setSigning] = useState(false);

// UI state
const [activeTab, setActiveTab] = useState(0);
const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);

// Form fields
const [findingsText, setFindingsText] = useState('');
const [impression, setImpression] = useState('');
const [recommendations, setRecommendations] = useState('');
const [clinicalHistory, setClinicalHistory] = useState('');
const [technique, setTechnique] = useState('');

// Structured data
const [structuredFindings, setStructuredFindings] = useState<Finding[]>([]);
const [measurements, setMeasurements] = useState<Measurement[]>([]);
const [recommendationsList, setRecommendationsList] = useState<string[]>([]);

// Signature
const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
const [signatureText, setSignatureText] = useState('');
```

## Authentication

```typescript
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken') || 
         sessionStorage.getItem('accessToken') || 
         localStorage.getItem('token');
};
```

## Common Patterns

### Loading Report on Mount
```typescript
useEffect(() => {
  if (reportId) {
    loadReport();
  } else if (analysisId) {
    createDraftFromAI();
  }
}, [reportId, analysisId]);
```

### Handling Save
```typescript
const handleSave = async () => {
  try {
    setSaving(true);
    const token = getAuthToken();
    
    const reportData = {
      findings: findingsText,
      impression,
      recommendations,
      clinicalHistory,
      technique,
      structuredFindings,
      measurements,
      recommendationsList
    };
    
    const url = report?._id
      ? `${API_URL}/api/reports/${report._id}`
      : `${API_URL}/api/reports`;
    
    const method = report?._id ? 'put' : 'post';
    
    const response = await axios[method](url, reportData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setReport(response.data);
    alert('✅ Report saved');
  } catch (error) {
    console.error('Error saving:', error);
    alert('Failed to save');
  } finally {
    setSaving(false);
  }
};
```

### Handling Signature
```typescript
const handleSign = async () => {
  if (!signatureDataUrl && !signatureText) {
    alert('Please provide a signature');
    return;
  }
  
  try {
    setSigning(true);
    const token = getAuthToken();
    
    const formData = new FormData();
    if (signatureDataUrl) {
      const blob = await fetch(signatureDataUrl).then(r => r.blob());
      formData.append('signature', blob, 'signature.png');
    }
    if (signatureText) {
      formData.append('signatureText', signatureText);
    }
    
    await axios.post(
      `${API_URL}/api/reports/${report._id}/sign`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    alert('✅ Report signed');
    if (onReportSigned) onReportSigned();
    loadReport();
  } catch (error) {
    console.error('Error signing:', error);
    alert('Failed to sign');
  } finally {
    setSigning(false);
  }
};
```

## Styling

### Material-UI Theme
```typescript
import { Box, Paper, Typography, TextField, Button } from '@mui/material';

// Standard spacing
sx={{ p: 2, mb: 2 }}  // padding: 16px, margin-bottom: 16px

// Grid layout
<Grid container spacing={3}>
  <Grid item xs={12} sm={6}>
    {/* Content */}
  </Grid>
</Grid>
```

### Status Colors
```typescript
// Severity colors
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'normal': return 'success';
    case 'mild': return 'info';
    case 'moderate': return 'warning';
    case 'severe': return 'error';
    default: return 'default';
  }
};

// Status chips
<Chip
  label={report.status.toUpperCase()}
  color={report.status === 'signed' ? 'success' : 'default'}
  size="small"
/>
```

## Error Handling

```typescript
try {
  // API call
} catch (error: any) {
  console.error('Error:', error);
  alert(`Failed: ${error.response?.data?.message || error.message}`);
} finally {
  setLoading(false);
}
```

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import UnifiedReportEditor from './UnifiedReportEditor';

test('renders report editor', () => {
  render(
    <UnifiedReportEditor
      studyInstanceUID="1.2.3.4.5"
      patientInfo={{
        patientID: "TEST001",
        patientName: "Test Patient",
        modality: "CT"
      }}
    />
  );
  
  expect(screen.getByText('Medical Report Editor')).toBeInTheDocument();
});

test('switches tabs', () => {
  render(<UnifiedReportEditor studyInstanceUID="1.2.3.4.5" />);
  
  const structuredTab = screen.getByText('Structured Findings');
  fireEvent.click(structuredTab);
  
  expect(screen.getByText('Add Finding')).toBeInTheDocument();
});
```

### Integration Test Example
```typescript
test('creates report from AI analysis', async () => {
  const mockOnReportCreated = jest.fn();
  
  render(
    <UnifiedReportEditor
      analysisId="analysis_123"
      studyInstanceUID="1.2.3.4.5"
      onReportCreated={mockOnReportCreated}
    />
  );
  
  await waitFor(() => {
    expect(mockOnReportCreated).toHaveBeenCalledWith(expect.any(String));
  });
});
```

## Performance Optimization

### Memoization
```typescript
import { useMemo, useCallback } from 'react';

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### Lazy Loading
```typescript
const SignatureCanvas = lazy(() => import('./SignatureCanvas'));

<Suspense fallback={<CircularProgress />}>
  <SignatureCanvas />
</Suspense>
```

## Debugging

### Console Logging
```typescript
console.log('📝 Opening Report Editor with Analysis ID:', analysisId);
console.log('✅ Report created:', reportId);
console.log('❌ Error:', error);
```

### React DevTools
- Check component props
- Inspect state values
- Monitor re-renders

### Network Tab
- Check API requests
- Verify auth headers
- Inspect response data

## Common Issues

### Issue: "Authentication required"
```typescript
// Solution: Check token
const token = getAuthToken();
if (!token) {
  alert('⚠️ Authentication required');
  return;
}
```

### Issue: Report not loading
```typescript
// Solution: Check reportId/analysisId
useEffect(() => {
  if (reportId) {
    console.log('Loading report:', reportId);
    loadReport();
  } else if (analysisId) {
    console.log('Creating from analysis:', analysisId);
    createDraftFromAI();
  } else {
    console.warn('No reportId or analysisId provided');
  }
}, [reportId, analysisId]);
```

### Issue: Signature not saving
```typescript
// Solution: Check FormData
const formData = new FormData();
if (signatureDataUrl) {
  const blob = await fetch(signatureDataUrl).then(r => r.blob());
  formData.append('signature', blob, 'signature.png');
  console.log('Signature blob size:', blob.size);
}
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8001
```

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
```

## Dependencies

```json
{
  "@mui/material": "^5.x",
  "@mui/icons-material": "^5.x",
  "axios": "^1.x",
  "react": "^18.x"
}
```

## File Structure

```
viewer/src/components/reports/
├── UnifiedReportEditor.tsx    # Main component
├── SignatureCanvas.tsx         # Signature drawing
├── ReportHistoryTab.tsx        # History viewer
├── ReportHistoryButton.tsx     # Quick access
└── index.ts                    # Exports
```

## Related Components

```typescript
// Signature canvas
import SignatureCanvas from './SignatureCanvas';

// Report history
import { ReportHistoryTab, ReportHistoryButton } from '@/components/reports';

// AI analysis
import { AutoAnalysisPopup } from '@/components/ai';
```

## Best Practices

1. **Always check authentication** before API calls
2. **Handle errors gracefully** with user-friendly messages
3. **Validate data** before saving
4. **Use TypeScript** for type safety
5. **Follow Material-UI** design patterns
6. **Test thoroughly** with real data
7. **Document changes** in code comments
8. **Keep state minimal** and derived when possible
9. **Use callbacks** for parent communication
10. **Maintain backward compatibility** when updating

## Quick Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

**Need more help?** Check the full documentation or contact the development team.
