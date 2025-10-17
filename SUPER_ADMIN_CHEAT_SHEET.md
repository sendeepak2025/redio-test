# 🎯 Super Admin Cheat Sheet

Quick reference for common tasks.

---

## 🚀 Setup

```bash
# Quick setup
node scripts/setup-superadmin.js

# Manual super admin creation
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/src/models/User');
mongoose.connect(process.env.MONGODB_URI);
(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  await new User({
    username: 'superadmin',
    email: 'admin@domain.com',
    passwordHash: hash,
    firstName: 'Super',
    lastName: 'Admin',
    roles: ['system:admin', 'super_admin'],
    permissions: ['*'],
    isActive: true,
    isVerified: true
  }).save();
  console.log('Created!');
  process.exit(0);
})();
"
```

---

## 🌐 URLs

```
Landing Page:     https://yourdomain.com/landing
Login:            https://yourdomain.com/login
Super Admin:      https://yourdomain.com/superadmin
```

---

## 📊 API Endpoints

### Super Admin (Auth Required)

```bash
# Dashboard stats
GET /api/superadmin/dashboard/stats

# All hospitals
GET /api/superadmin/hospitals

# Contact requests
GET /api/superadmin/contact-requests?status=new&priority=high

# Update request
PUT /api/superadmin/contact-requests/:id
Body: { "status": "contacted", "priority": "high" }

# Add note
POST /api/superadmin/contact-requests/:id/notes
Body: { "note": "Called customer" }

# System analytics
GET /api/superadmin/analytics/system?period=30

# Hospital analytics
GET /api/superadmin/analytics/hospital?hospitalId=hosp_123&startDate=2024-01-01
```

### Public (No Auth)

```bash
# Submit contact request
POST /api/public/contact-request
Body: {
  "type": "demo",
  "contactInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "organization": "Hospital A"
  },
  "details": {
    "message": "Interested in demo"
  }
}
```

---

## 🧪 Testing

```bash
# Test contact form
curl -X POST http://localhost:5000/api/public/contact-request \
  -H "Content-Type: application/json" \
  -d '{"type":"demo","contactInfo":{"name":"Test","email":"test@test.com","organization":"Test Org"},"details":{"message":"Test message"}}'

# Test dashboard (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/superadmin/dashboard/stats

# Test analytics
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/superadmin/analytics/system?period=7
```

---

## 🔍 Database Queries

```javascript
// MongoDB shell

// Find super admin
db.users.findOne({ roles: 'super_admin' })

// List all hospitals
db.hospitals.find({}, { name: 1, status: 1, 'subscription.plan': 1 })

// Recent contact requests
db.contactrequests.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10)

// Today's metrics
db.usagemetrics.find({ 
  date: { $gte: new Date(new Date().setHours(0,0,0,0)) } 
})

// Hospital usage summary
db.usagemetrics.aggregate([
  { $match: { hospitalId: 'hosp_123' } },
  { $group: {
    _id: null,
    totalUploads: { $sum: '$studies.uploaded' },
    totalViews: { $sum: '$studies.viewed' }
  }}
])
```

---

## 🔧 Common Tasks

### Add Super Admin Role to Existing User

```javascript
// MongoDB
db.users.updateOne(
  { username: 'existing_user' },
  { 
    $addToSet: { roles: { $each: ['system:admin', 'super_admin'] } },
    $set: { permissions: ['*'] }
  }
)
```

### Reset Super Admin Password

```javascript
// Node.js
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('NewPassword123!', 10);

// MongoDB
db.users.updateOne(
  { username: 'superadmin' },
  { $set: { passwordHash: hash } }
)
```

### Delete Sample Data

```javascript
// MongoDB
db.hospitals.deleteMany({ hospitalId: /^hosp_sample_/ })
db.contactrequests.deleteMany({ 'contactInfo.email': /example\.com$/ })
db.usagemetrics.deleteMany({ hospitalId: /^hosp_sample_/ })
```

### Manually Track Metrics

```javascript
// Node.js
const { getMetricsTrackingService } = require('./services/metrics-tracking-service');
const service = getMetricsTrackingService();

await service.trackStudyUpload('hosp_123', 'CT', 1024000);
await service.trackStudyView('hosp_123', 'user-id');
await service.trackReportCreation('hosp_123', 'user-id');
await service.trackAIRequest('hosp_123', true);
```

---

## 🚨 Troubleshooting

### Dashboard Not Loading

```bash
# Check user role
mongo
> db.users.findOne({ username: 'superadmin' }, { roles: 1 })

# Check server logs
pm2 logs medical-imaging-server

# Restart server
pm2 restart medical-imaging-server
```

### Metrics Not Tracking

```bash
# Verify middleware is enabled
# Check server/src/index.js for:
# app.use(metricsMiddleware());

# Check recent metrics
mongo
> db.usagemetrics.find().sort({ createdAt: -1 }).limit(5)
```

### Contact Form 429 Error

```bash
# Rate limit hit - wait 15 minutes or clear:
# Restart server to reset rate limits
pm2 restart medical-imaging-server
```

---

## 📈 Metrics Tracking

### What's Tracked Automatically

- ✅ Study uploads (modality, size)
- ✅ Study views
- ✅ Report creation
- ✅ User logins
- ✅ AI requests
- ✅ Errors

### Enable Tracking

Add to `server/src/index.js`:

```javascript
const metricsMiddleware = require('./middleware/metricsMiddleware');
app.use(metricsMiddleware());
```

---

## 🎨 Quick Customization

### Landing Page Title

```typescript
// viewer/src/pages/LandingPage.tsx
<Typography variant="h2">
  Your Custom Title
</Typography>
```

### Dashboard Colors

```typescript
// viewer/src/pages/superadmin/SuperAdminDashboard.tsx
<Card sx={{ bgcolor: 'primary.main' }}>
```

### Add Custom Feature

```typescript
// viewer/src/pages/LandingPage.tsx
const features = [
  ...features,
  {
    icon: <YourIcon />,
    title: 'New Feature',
    description: 'Description here'
  }
];
```

---

## 📧 Email Notifications

### Configure SMTP

```bash
# .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### Send Email on New Request

```javascript
// server/src/controllers/superAdminController.js
const emailService = require('../services/email-service');
await emailService.sendEmail(
  'admin@yourdomain.com',
  'New Contact Request',
  `New ${request.type} request from ${request.contactInfo.name}`
);
```

---

## 🔐 Security Checklist

- [ ] Change default super admin password
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Review access logs weekly

---

## 📱 Mobile Testing

```bash
# Test responsive design
# Chrome DevTools > Toggle Device Toolbar
# Test on: iPhone, iPad, Android

# Or use ngrok for real device testing
ngrok http 5000
# Access from mobile: https://xxxxx.ngrok.io/landing
```

---

## 🎯 Quick Commands

```bash
# Start server
pm2 start server/src/index.js --name medical-imaging-server

# View logs
pm2 logs medical-imaging-server

# Restart
pm2 restart medical-imaging-server

# Stop
pm2 stop medical-imaging-server

# MongoDB shell
mongo
> use medical-imaging
> show collections

# Check disk space
df -h

# Check memory
free -m

# Check processes
pm2 status
```

---

## 📚 Documentation

- **Full Guide:** `SUPER_ADMIN_SETUP_GUIDE.md`
- **Quick Start:** `SUPER_ADMIN_QUICK_START.md`
- **Implementation:** `SUPER_ADMIN_IMPLEMENTATION_SUMMARY.md`
- **This File:** `SUPER_ADMIN_CHEAT_SHEET.md`

---

## 🆘 Support

### Check Logs

```bash
pm2 logs medical-imaging-server --lines 100
```

### Check Database

```bash
mongo
> use medical-imaging
> db.users.countDocuments()
> db.hospitals.countDocuments()
> db.contactrequests.countDocuments()
> db.usagemetrics.countDocuments()
```

### Verify Configuration

```bash
# Check environment variables
cat .env | grep -E "MONGODB_URI|SMTP_"

# Check routes are loaded
curl http://localhost:5000/api/superadmin/dashboard/stats
# Should return 401 (unauthorized) if working
```

---

## ✅ Quick Checklist

- [ ] Super admin user created
- [ ] Can login successfully
- [ ] Dashboard loads at /superadmin
- [ ] Landing page loads at /landing
- [ ] Contact form works
- [ ] Metrics are tracking
- [ ] Email configured (optional)
- [ ] Customized branding
- [ ] Tested on mobile
- [ ] Documentation reviewed

---

**Need Help?** Check the full guides or contact support.

