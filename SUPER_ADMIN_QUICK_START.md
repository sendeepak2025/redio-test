# 🚀 Super Admin Dashboard - Quick Start

## What's New?

You now have a complete super admin system with:

1. **📊 Super Admin Dashboard** - Monitor all hospitals, users, and system activity
2. **📈 Analytics & Metrics** - Real-time usage tracking per hospital and machine
3. **🌐 Landing Page** - Public-facing page with contact forms
4. **📧 Contact Request Management** - Handle demo requests and inquiries
5. **🔍 Troubleshooting Tools** - See what's working at each hospital

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run Setup Script

```bash
cd /path/to/medical-imaging-system
node scripts/setup-superadmin.js
```

This will:
- Create your super admin user
- Optionally create sample data for testing
- Verify everything is configured

### Step 2: Login

1. Go to `https://yourdomain.com/login`
2. Login with your super admin credentials
3. Navigate to `https://yourdomain.com/superadmin`

### Step 3: Explore

**Dashboard Tabs:**
- **Overview** - Quick stats and recent activity
- **Hospitals** - All hospitals with usage metrics
- **Contact Requests** - Demo requests and inquiries
- **Analytics** - Charts and trends

---

## 🎯 Key Features

### 1. Hospital Monitoring

**See for each hospital:**
- Total users and active users
- Studies uploaded/viewed (last 30 days)
- Storage usage
- Subscription plan and status
- Machine/modality usage (CT, MR, XR, etc.)

**Example:**
```
Hospital A:
  - 25 users (12 active today)
  - 450 studies uploaded (last 30 days)
  - 1,200 studies viewed
  - 45.2 GB / 100 GB storage used
  - Modalities: CT (45%), MR (30%), XR (25%)
```

### 2. Usage Analytics

**Track:**
- Daily uploads and views
- Active users per day
- Modality distribution
- AI usage statistics
- Performance metrics

**Charts:**
- Line chart: Daily activity trend
- Pie chart: Modality distribution
- Bar chart: Hospital comparison

### 3. Contact Request Management

**Handle:**
- Demo requests
- Trial account requests
- General inquiries
- Support requests

**Features:**
- View all requests in table
- Filter by status/priority
- Add notes to requests
- Update status (new → contacted → converted)
- Track conversion to customers

### 4. Landing Page

**Public page at:** `https://yourdomain.com/landing`

**Includes:**
- Hero section with key features
- Feature showcase
- Benefits list
- Contact form
- Demo request form

**Forms collect:**
- Contact information
- Organization details
- Estimated users and volume
- Timeline and budget
- Areas of interest

---

## 📊 Dashboard Overview

### Overview Cards

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Hospitals     │   Total Users   │  Total Studies  │ Pending Requests│
│       15        │       342       │     45,230      │        8        │
│   12 active     │  28 active today│  45 today       │  needs attention│
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

Storage Usage: ████████░░░░░░░░░░ 450 GB / 1000 GB (45%)
```

### Recent Activity Feed

```
🏥 New hospital registered: City Medical Center
📧 New demo request from General Hospital
👤 User login: dr.smith@hospital-a.com
📊 Study uploaded: CT Chest (Hospital B)
```

---

## 🔍 Troubleshooting Features

### Per Hospital Diagnostics

**Check:**
- Last upload time
- Bridge agent status (online/offline)
- Storage availability
- User activity
- Error count

**Example:**
```
Hospital A Status:
  ✅ Bridge Agent: Online (last seen 2 min ago)
  ✅ Storage: 45% used (55 GB available)
  ✅ Users: 12 active today
  ⚠️  Last upload: 3 hours ago
  ❌ Errors: 3 in last 24 hours
```

### System-Wide Health

**Monitor:**
- Total system uptime
- Database connection status
- Storage across all hospitals
- Active users system-wide
- Error rates

---

## 📧 Contact Request Workflow

### 1. Request Submitted

User fills out form on landing page → Request created with status "new"

### 2. Review Request

Super admin sees request in dashboard → Views details, contact info, requirements

### 3. Contact Customer

Super admin updates status to "contacted" → Adds note: "Called customer, scheduled demo"

### 4. Follow Up

Super admin updates status to "in_progress" → Adds note: "Demo completed, sending proposal"

### 5. Convert or Close

- **Converted:** Customer becomes a hospital → Link request to hospital ID
- **Closed:** Not interested or resolved → Mark as closed

---

## 🎨 Customization

### Change Landing Page Content

Edit `viewer/src/pages/LandingPage.tsx`:

```typescript
// Change title
<Typography variant="h2">
  Your Custom Title Here
</Typography>

// Change features
const features = [
  {
    icon: <YourIcon />,
    title: 'Your Feature',
    description: 'Your description'
  }
];
```

### Add Custom Metrics

Edit `server/src/services/metrics-tracking-service.js`:

```javascript
async trackCustomEvent(hospitalId, eventType, data) {
  const metrics = await this.getOrCreateDailyMetrics(hospitalId, new Date());
  // Add your custom tracking logic
  await metrics.save();
}
```

---

## 🔐 Security

### Access Control

Only users with these roles can access super admin:
- `system:admin`
- `super_admin`

### Rate Limiting

Contact form is rate-limited:
- 5 requests per 15 minutes per IP
- Prevents spam

### Data Privacy

- No PHI in analytics
- IP addresses logged for security
- All data encrypted at rest

---

## 📱 Mobile Access

Dashboard is fully responsive:
- Works on tablets and phones
- Touch-friendly interface
- Responsive tables and charts

---

## 🚨 Common Issues

### "Access Denied" on Dashboard

**Solution:** Verify user has super admin role

```bash
# Check user roles
mongo
> use medical-imaging
> db.users.findOne({ username: 'superadmin' })
```

### Metrics Not Showing

**Solution:** Enable metrics middleware

Add to `server/src/index.js`:
```javascript
const metricsMiddleware = require('./middleware/metricsMiddleware');
app.use(metricsMiddleware());
```

### Contact Form Not Working

**Solution:** Check public routes are enabled

Verify in `server/src/routes/index.js`:
```javascript
router.use('/api/public', publicRoutes);
```

---

## 📚 API Endpoints

### Super Admin (Requires Auth)

```
GET  /api/superadmin/dashboard/stats       - Dashboard overview
GET  /api/superadmin/hospitals             - List all hospitals
GET  /api/superadmin/contact-requests      - List contact requests
GET  /api/superadmin/analytics/system      - System analytics
GET  /api/superadmin/analytics/hospital    - Hospital analytics
PUT  /api/superadmin/contact-requests/:id  - Update request
POST /api/superadmin/contact-requests/:id/notes - Add note
```

### Public (No Auth)

```
POST /api/public/contact-request           - Submit contact form
```

---

## 📖 Full Documentation

For complete details, see:
- `SUPER_ADMIN_SETUP_GUIDE.md` - Complete setup guide
- `MULTI_SITE_SETUP_GUIDE.md` - Multi-hospital setup
- `MAJOR_GAPS_ANALYSIS.md` - System capabilities

---

## ✅ Quick Checklist

### Initial Setup
- [ ] Run `node scripts/setup-superadmin.js`
- [ ] Login as super admin
- [ ] Verify dashboard loads
- [ ] Check sample data (if created)

### Configuration
- [ ] Customize landing page
- [ ] Set up email notifications
- [ ] Enable metrics middleware
- [ ] Configure SMTP settings

### Testing
- [ ] Submit test contact request
- [ ] View hospital analytics
- [ ] Check metrics are tracking
- [ ] Test mobile responsiveness

### Production
- [ ] Change super admin password
- [ ] Remove sample data
- [ ] Set up monitoring alerts
- [ ] Train staff on dashboard

---

## 🎉 You're Ready!

Your super admin dashboard is now set up with:

✅ Real-time monitoring of all hospitals
✅ Usage analytics and metrics tracking
✅ Contact request management
✅ Public landing page
✅ Troubleshooting tools

**Next Steps:**
1. Explore the dashboard
2. Customize the landing page
3. Set up email notifications
4. Monitor your hospitals!

**Questions?** Check the full guide: `SUPER_ADMIN_SETUP_GUIDE.md`

