# Follow-up Report System - Complete Guide

## Overview

The Follow-up Report System provides intelligent, automated follow-up tracking for medical imaging studies. It uses AI-powered analysis to detect clinical findings that require follow-up imaging and automatically generates recommendations with appropriate timeframes.

## Key Features

### 1. Intelligent Automation
- AI-Powered Analysis: Automatically analyzes radiology reports
- Clinical Rules Engine: 8+ pre-configured clinical rules
- Confidence Scoring: Each recommendation includes AI confidence
- Trigger Finding Extraction: Identifies specific findings

### 2. Comprehensive Tracking
- Status Management: pending, scheduled, completed, overdue
- Priority Levels: 5-level priority system (1-5)
- Type Classification: routine, urgent, critical, recommended, optional
- Multi-tenant Support: Hospital and department filtering

### 3. Smart Notifications
- Overdue Alerts: Automatic detection and notification
- Upcoming Reminders: Configurable reminders
- Multi-channel: Email, SMS, and system notifications

### 4. Rich Analytics
- Real-time Statistics: Total, pending, scheduled, completed, overdue
- Completion Rate: Track follow-up completion percentage
- Trend Analysis: Monitor follow-up patterns

## Clinical Rules

Pre-configured rules for common clinical scenarios:

1. Nodule Detection - 90 days, Priority 4, 85% confidence
2. Fracture Healing - 42 days, Priority 3, 90% confidence
3. Infection Monitoring - 14 days, Priority 4, 88% confidence
4. Tumor Surveillance - 60 days, Priority 5, 92% confidence
5. Post-Surgical - 30 days, Priority 3, 87% confidence
6. Aneurysm Monitoring - 90 days, Priority 5, 95% confidence
7. Pulmonary Embolism - 21 days, Priority 4, 90% confidence
8. Cardiac Abnormality - 60 days, Priority 4, 83% confidence

## Architecture

### Backend Components

1. Model: FollowUp.js
2. Service: followup-automation.js
3. Controller: followUpController.js
4. Routes: follow-ups.js

### Frontend Components

1. FollowUpPanel.tsx - Main management interface
2. AutoFollowUpButton.tsx - AI analysis trigger
3. ApiService.ts - API integration

## API Endpoints

### Follow-up Management


```
GET    /api/follow-ups              - Get all follow-ups (with filters)
GET    /api/follow-ups/:id          - Get single follow-up
POST   /api/follow-ups              - Create manual follow-up
PUT    /api/follow-ups/:id          - Update follow-up
DELETE /api/follow-ups/:id          - Delete follow-up
```

### Actions
```
POST   /api/follow-ups/:id/schedule - Schedule follow-up
POST   /api/follow-ups/:id/complete - Mark as completed
POST   /api/follow-ups/:id/notes    - Add note
```

### AI & Analytics
```
POST   /api/follow-ups/generate/:reportId       - Auto-generate from report
GET    /api/follow-ups/recommendations/:reportId - Get AI recommendations
GET    /api/follow-ups/overdue                   - Get overdue follow-ups
GET    /api/follow-ups/upcoming                  - Get upcoming follow-ups
GET    /api/follow-ups/statistics                - Get statistics
```

## Usage Examples

### 1. Auto-Generate Follow-up from Report

```javascript
// Analyze report and get recommendations
const recommendations = await ApiService.getFollowUpRecommendations(reportId);

// Generate follow-up automatically
const followUp = await ApiService.generateFollowUpFromReport(reportId);
```

### 2. Create Manual Follow-up

```javascript
const followUp = await ApiService.createFollowUp({
  patientId: '507f1f77bcf86cd799439011',
  studyId: '507f1f77bcf86cd799439012',
  type: 'routine',
  priority: 3,
  recommendedDate: '2025-12-01',
  reason: 'Follow-up chest X-ray for pneumonia resolution',
  modality: 'CR',
  bodyPart: 'CHEST'
});
```

### 3. Schedule Follow-up

```javascript
await ApiService.scheduleFollowUp(
  followUpId,
  '2025-12-01T10:00:00Z'
);
```

### 4. Complete Follow-up

```javascript
await ApiService.completeFollowUp(followUpId);
```

### 5. Get Overdue Follow-ups

```javascript
const overdue = await ApiService.getOverdueFollowUps();
```

### 6. Get Statistics

```javascript
const stats = await ApiService.getFollowUpStatistics();
// Returns: { total, pending, scheduled, completed, overdue, completionRate }
```

## Frontend Integration

### Using FollowUpPanel Component

```tsx
import FollowUpPanel from './components/followup/FollowUpPanel';

function App() {
  return <FollowUpPanel />;
}
```

### Using AutoFollowUpButton Component

```tsx
import AutoFollowUpButton from './components/followup/AutoFollowUpButton';

function ReportView({ reportId }) {
  return (
    <AutoFollowUpButton 
      reportId={reportId}
      onFollowUpCreated={(followUp) => {
        console.log('Follow-up created:', followUp);
      }}
    />
  );
}
```

## Data Model

### FollowUp Schema

```javascript
{
  patientId: ObjectId,           // Reference to Patient
  studyId: ObjectId,             // Reference to Study
  reportId: ObjectId,            // Reference to StructuredReport
  
  type: String,                  // routine, urgent, critical, recommended, optional
  priority: Number,              // 1-5 (5 = highest)
  
  recommendedDate: Date,         // When follow-up should occur
  scheduledDate: Date,           // When follow-up is scheduled
  completedDate: Date,           // When follow-up was completed
  
  reason: String,                // Clinical reason for follow-up
  findings: [String],            // Key findings requiring follow-up
  recommendations: [String],     // Clinical recommendations
  modality: String,              // Imaging modality
  bodyPart: String,              // Body part to image
  
  status: String,                // pending, scheduled, completed, overdue, cancelled
  
  autoGenerated: Boolean,        // Was this AI-generated?
  aiConfidence: Number,          // AI confidence score (0-1)
  triggerFindings: [String],     // Findings that triggered automation
  
  notifications: [{              // Notification history
    type: String,                // email, sms, system
    sentAt: Date,
    status: String
  }],
  
  assignedTo: ObjectId,          // Assigned user
  createdBy: ObjectId,           // Creator
  
  notes: [{                      // Follow-up notes
    text: String,
    createdBy: ObjectId,
    createdAt: Date
  }],
  
  metadata: {                    // Additional metadata
    originalStudyDate: Date,
    hospitalId: String,
    departmentId: String
  }
}
```

## Customization

### Adding New Clinical Rules

Edit `server/src/services/followup-automation.js`:

```javascript
this.rules.push({
  id: 'custom_rule',
  condition: (report) => this.hasKeyword(report, ['keyword1', 'keyword2']),
  priority: 4,
  type: 'urgent',
  daysUntilFollowUp: 30,
  reason: 'Custom follow-up reason',
  confidence: 0.85
});
```

### Customizing Notification Logic

Implement notification methods in `followup-automation.js`:

```javascript
async sendOverdueNotification(followUp) {
  // Custom email/SMS logic
  await emailService.send({
    to: followUp.patientId.email,
    subject: 'Follow-up Overdue',
    body: `Your follow-up for ${followUp.reason} is overdue.`
  });
}
```

## Security & Permissions

### Role-Based Access

- **Radiologist/Admin/Super Admin**: Full CRUD access
- **All Authenticated Users**: Read access
- **Hospital Filtering**: Automatic for non-super-admins

### Authentication Required

All endpoints require JWT authentication via Bearer token.

## Performance Considerations

### Indexes

The system includes optimized indexes:
- `{ status: 1, recommendedDate: 1 }`
- `{ patientId: 1, status: 1 }`
- `{ createdAt: -1 }`

### Pagination

List endpoints support pagination:
```javascript
const followUps = await ApiService.getFollowUps({
  page: 1,
  limit: 20,
  status: 'pending'
});
```

## Monitoring & Maintenance

### Scheduled Tasks

Implement cron jobs for:

1. Check overdue follow-ups (daily)
2. Send upcoming reminders (daily)
3. Generate statistics reports (weekly)

Example using node-cron:

```javascript
const cron = require('node-cron');
const followUpAutomation = require('./services/followup-automation');

// Check overdue daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  await followUpAutomation.checkOverdueFollowUps();
});

// Send reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  await followUpAutomation.sendUpcomingReminders(7);
});
```

## Testing

### Unit Tests

```javascript
describe('FollowUp Automation', () => {
  it('should detect nodule findings', async () => {
    const report = {
      findings: 'Small nodule in right upper lobe',
      impression: 'Recommend follow-up CT in 3 months'
    };
    
    const recommendations = await followUpAutomation.analyzeReport(report._id);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].ruleId).toBe('nodule_detection');
  });
});
```

### Integration Tests

```javascript
describe('FollowUp API', () => {
  it('should create follow-up from report', async () => {
    const response = await request(app)
      .post(`/api/follow-ups/generate/${reportId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    
    expect(response.body.data.autoGenerated).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **Follow-ups not generating automatically**
   - Check report content matches clinical rules
   - Verify AI confidence threshold
   - Review automation service logs

2. **Notifications not sending**
   - Verify notification service configuration
   - Check email/SMS credentials
   - Review notification logs

3. **Performance issues**
   - Ensure database indexes are created
   - Implement pagination for large datasets
   - Consider caching for statistics

## Future Enhancements

1. Machine Learning Integration
   - Train custom ML models on historical data
   - Improve confidence scoring
   - Personalized follow-up recommendations

2. Advanced Analytics
   - Predictive analytics for follow-up compliance
   - Risk stratification
   - Outcome tracking

3. Integration Features
   - EHR integration for automatic scheduling
   - Calendar sync (Google, Outlook)
   - Patient portal notifications

4. Enhanced Automation
   - Natural Language Processing for better finding extraction
   - Multi-language support
   - Voice-to-text for notes

## Support

For issues or questions:
- Review logs in `./logs/`
- Check database connection
- Verify authentication tokens
- Review API response errors

## License

Part of the Medical Imaging Platform - All Rights Reserved
