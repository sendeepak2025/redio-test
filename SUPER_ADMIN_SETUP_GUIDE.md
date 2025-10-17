# 🔐 Super Admin Dashboard Setup Guide

## Overview

This guide covers the complete setup of the Super Admin Dashboard with:
- **Analytics Dashboard** - Real-time metrics and insights per hospital
- **Hospital Management** - Monitor all hospitals and their usage
- **Contact Request Management** - Handle demo requests and inquiries
- **Landing Page** - Public-facing page with contact forms
- **Usage Tracking** - Automatic metrics collection

---

## 🚀 Quick Start

### 1. Database Setup

The system uses MongoDB with these new collections:
- `usagemetrics` - Daily metrics per hospital
- `contactrequests` - Contact form submissions

No manual setup needed - collections are created automatically.

### 2. Create Super Admin User

```bash
# SSH into your server
ssh user@your-server

# Navigate to project
cd /path/to/medical-imaging-system/server

# Run Node.js script to create super admin
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-imaging');

async function createSuperAdmin() {
  const passwordHash = await bcrypt.hash('SuperAdmin123!', 10);
  
  const superAdmin = new User({
    username: 'superadmin',
    email: 'admin@yourdomain.com',
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    roles: ['system:admin', 'super_admin'],
    permissions: ['*'],
    isActive: true,
    isVerified: true
  });
  
  await superAdmin.save();
  console.log('Super admin created successfully!');
  console.log('Username: superadmin');
  console.log('Password: SuperAdmin123!');
  console.log('IMPORTANT: Change this password immediately after first login!');
  process.exit(0);
}

createSuperAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

### 3. Environment Variables

Add to your `.env` file:

```bash
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Super Admin Settings
ENABLE_PUBLIC_LANDING=true
ENABLE_CONTACT_FORM=true
```

### 4. Restart Server

```bash
# If using PM2
pm2 restart medical-imaging-server

# If using systemd
sudo systemctl restart medical-imaging

# If running directly
npm run start
```

---

## 📊 Features Overview

### 1. Super Admin Dashboard

**Access:** `https://yourdomain.com/superadmin`

**Features:**
- Overview cards showing total hospitals, users, studies
- Real-time activity feed
- Storage usage across all hospitals
- Today's activity metrics

**Tabs:**
1. **Overview** - Quick stats and recent activity
2. **Hospitals** - List of all hospitals with usage stats
3. **Contact Requests** - Manage demo requests and inquiries
4. **Analytics** - Charts and graphs of system-wide usage

### 2. Hospital Analytics

**Per Hospital Metrics:**
- Daily uploads, views, reports
- Active users count
- Storage usage
- Modality breakdown (CT, MR, XR, etc.)
- 30-day trends

**System-Wide Analytics:**
- Aggregate metrics across all hospitals
- Daily activity trends
- Modality distribution
- User engagement metrics

### 3. Contact Request Management

**Request Types:**
- `demo` - Demo requests
- `trial` - Trial account requests
- `contact` - General inquiries
- `support` - Support requests
- `partnership` - Partnership inquiries

**Request Statuses:**
- `new` - Just submitted
- `contacted` - Initial contact made
- `in_progress` - Actively working on it
- `converted` - Became a customer
- `closed` - Resolved/completed
- `spam` - Marked as spam

**Priority Levels:**
- `urgent` - Needs immediate attention
- `high` - Important
- `medium` - Normal priority
- `low` - Can wait

**Features:**
- View all requests in table format
- Filter by status, priority, type
- Add notes to requests
- Update status
- Track conversion to customers

### 4. Landing Page

**Access:** `https://yourdomain.com/landing`

**Features:**
- Hero section with key messaging
- Feature showcase (6 key features)
- Benefits list
- Call-to-action buttons
- Contact form dialog
- Demo request form dialog

**Forms Collect:**
- Name, email, phone
- Organization and position
- Estimated users and volume
- Current system
- Timeline
- Areas of interest
- Custom message

---

## 🔧 Configuration

### Enable Metrics Tracking

Metrics are automatically tracked when users interact with the system:

**Tracked Events:**
- Study uploads (with modality and size)
- Study views
- Report creation
- User logins
- AI requests
- Errors

**To enable automatic tracking**, add to `server/src/index.js`:

```javascript
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Add after authentication middleware
app.use(metricsMiddleware());
```

### Customize Landing Page

Edit `viewer/src/pages/LandingPage.tsx`:

```typescript
// Change hero text
<Typography variant="h2">
  Your Custom Title
</Typography>

// Modify features array
const features = [
  {
    icon: <YourIcon />,
    title: 'Your Feature',
    description: 'Your description'
  },
  // ... more features
];
```

### Email Notifications

When a contact request is submitted, you can send email notifications:

Edit `server/src/controllers/superAdminController.js`:

```javascript
exports.createContactRequest = async (req, res) => {
  // ... existing code ...
  
  // Add email notification
  const emailService = require('../services/email-service');
  await emailService.sendEmail(
    'admin@yourdomain.com',
    'New Contact Request',
    `New ${request.type} request from ${request.contactInfo.name}`
  );
  
  // ... rest of code ...
};
```

---

## 📈 Usage Examples

### View Hospital Performance

```javascript
// Get specific hospital analytics
GET /api/superadmin/analytics/hospital?hospitalId=hosp_abc123&startDate=2024-01-01&endDate=2024-01-31

// Response:
{
  "totalStudies": 1250,
  "totalViews": 3400,
  "totalReports": 890,
  "avgActiveUsers": "12.5",
  "modalityBreakdown": {
    "CT": 450,
    "MR": 320,
    "XR": 280,
    "US": 200
  },
  "dailyTrend": [
    { "date": "2024-01-01", "uploads": 45, "views": 120, "activeUsers": 15 },
    // ... more days
  ]
}
```

### Get All Hospitals

```javascript
// List all hospitals with stats
GET /api/superadmin/hospitals

// Response:
[
  {
    "hospitalId": "hosp_abc123",
    "name": "City Hospital",
    "status": "active",
    "subscription": {
      "plan": "professional",
      "currentStorage": 45.2,
      "maxStorage": 100
    },
    "userCount": 25,
    "last30Days": {
      "totalUploads": 450,
      "totalViews": 1200,
      "avgActiveUsers": 12.5
    }
  }
]
```

### Manage Contact Requests

```javascript
// Get all pending requests
GET /api/superadmin/contact-requests?status=new

// Update request status
PUT /api/superadmin/contact-requests/REQ-ABC123
{
  "status": "contacted",
  "priority": "high",
  "assignedTo": "user-id-here"
}

// Add note to request
POST /api/superadmin/contact-requests/REQ-ABC123/notes
{
  "note": "Called customer, scheduled demo for next week"
}
```

---

## 🔐 Security

### Access Control

Only users with these roles can access super admin features:
- `system:admin`
- `super_admin`

### API Protection

All super admin endpoints require:
1. Valid JWT token
2. Super admin role
3. Active account status

### Rate Limiting

Public endpoints (contact form) are rate-limited:
- 5 requests per 15 minutes per IP
- Prevents spam and abuse

### Data Privacy

- Contact requests include IP address for tracking
- PHI is never exposed in analytics
- All data is encrypted at rest

---

## 📱 Mobile Responsiveness

The landing page and dashboard are fully responsive:
- Mobile-first design
- Touch-friendly buttons
- Responsive tables
- Adaptive charts

---

## 🧪 Testing

### Test Contact Form

```bash
# Submit test contact request
curl -X POST https://yourdomain.com/api/public/contact-request \
  -H "Content-Type: application/json" \
  -d '{
    "type": "demo",
    "contactInfo": {
      "name": "Test User",
      "email": "test@example.com",
      "organization": "Test Hospital"
    },
    "details": {
      "message": "Interested in a demo"
    }
  }'
```

### Test Analytics

```bash
# Get dashboard stats
curl -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  https://yourdomain.com/api/superadmin/dashboard/stats

# Get system analytics
curl -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  https://yourdomain.com/api/superadmin/analytics/system?period=30
```

---

## 🎨 Customization

### Branding

Update colors in `viewer/src/index.css`:

```css
:root {
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
  --success-color: #4caf50;
}
```

### Logo

Replace logo in landing page:

```typescript
<LocalHospital sx={{ fontSize: 80, mb: 2 }} />
// Replace with:
<img src="/your-logo.png" alt="Logo" />
```

---

## 📊 Metrics Collection

### Automatic Tracking

Metrics are collected automatically for:

1. **Study Operations**
   - Upload (with modality, size)
   - View
   - Share

2. **User Activity**
   - Login
   - Active users per day
   - Unique users

3. **Reports**
   - Creation
   - Completion

4. **AI Usage**
   - Total requests
   - Success/failure rate

5. **Performance**
   - Error count
   - Load times

### Manual Tracking

You can manually track custom events:

```javascript
const { getMetricsTrackingService } = require('./services/metrics-tracking-service');
const metricsService = getMetricsTrackingService();

// Track custom event
await metricsService.trackStudyUpload('hosp_abc123', 'CT', 1024000);
await metricsService.trackStudyView('hosp_abc123', 'user-id');
await metricsService.trackReportCreation('hosp_abc123', 'user-id');
```

---

## 🚨 Troubleshooting

### Dashboard Not Loading

**Check:**
1. User has super admin role
2. JWT token is valid
3. Server is running
4. MongoDB is connected

```bash
# Check server logs
pm2 logs medical-imaging-server

# Check MongoDB connection
mongo
> use medical-imaging
> db.users.findOne({ roles: 'super_admin' })
```

### Metrics Not Updating

**Check:**
1. Metrics middleware is enabled
2. MongoDB has write permissions
3. Check for errors in logs

```bash
# Verify metrics collection
mongo
> use medical-imaging
> db.usagemetrics.find().limit(5)
```

### Contact Form Not Working

**Check:**
1. Public routes are enabled
2. Rate limiting not blocking
3. CORS configured correctly

```bash
# Test endpoint directly
curl -X POST http://localhost:5000/api/public/contact-request \
  -H "Content-Type: application/json" \
  -d '{"type":"contact","contactInfo":{"name":"Test","email":"test@test.com"},"details":{"message":"Test"}}'
```

---

## 📚 API Reference

### Super Admin Endpoints

```
GET    /api/superadmin/dashboard/stats          - Dashboard overview
GET    /api/superadmin/analytics/system         - System-wide analytics
GET    /api/superadmin/analytics/hospital       - Hospital-specific analytics
GET    /api/superadmin/hospitals                - List all hospitals
GET    /api/superadmin/contact-requests         - List contact requests
PUT    /api/superadmin/contact-requests/:id     - Update request
POST   /api/superadmin/contact-requests/:id/notes - Add note
```

### Public Endpoints

```
POST   /api/public/contact-request              - Submit contact form
```

---

## ✅ Checklist

### Initial Setup
- [ ] Create super admin user
- [ ] Configure environment variables
- [ ] Enable metrics middleware
- [ ] Test dashboard access
- [ ] Verify analytics data

### Landing Page
- [ ] Customize branding
- [ ] Update feature list
- [ ] Test contact form
- [ ] Test demo request form
- [ ] Configure email notifications

### Monitoring
- [ ] Set up alerts for new requests
- [ ] Monitor metrics collection
- [ ] Review hospital usage weekly
- [ ] Track conversion rates

---

## 🎉 You're Ready!

Your super admin dashboard is now configured with:

✅ **Real-time Analytics** - Monitor all hospitals and usage
✅ **Contact Management** - Handle inquiries and demo requests
✅ **Landing Page** - Public-facing marketing page
✅ **Automatic Metrics** - Track everything automatically
✅ **Hospital Insights** - Per-hospital performance data

**Next Steps:**
1. Login as super admin
2. Explore the dashboard
3. Customize the landing page
4. Set up email notifications
5. Monitor your first hospital!

