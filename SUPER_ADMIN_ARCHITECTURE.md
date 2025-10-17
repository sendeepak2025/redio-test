# 🏗️ Super Admin System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC USERS                              │
│                                                                   │
│  Landing Page (/landing)                                         │
│  - View features                                                 │
│  - Submit contact form                                           │
│  - Request demo                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/public/contact-request
                         │ (Rate Limited: 5 per 15 min)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Public Routes (No Auth)                                  │  │
│  │  - POST /api/public/contact-request                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ContactRequest Model                                     │  │
│  │  - Save to MongoDB                                        │  │
│  │  - Generate request ID                                    │  │
│  │  - Log IP address                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN USER                              │
│                                                                   │
│  Login (/login)                                                  │
│  - Username: superadmin                                          │
│  - Roles: system:admin, super_admin                             │
│                                                                   │
│  Dashboard (/superadmin)                                         │
│  - Overview Tab                                                  │
│  - Hospitals Tab                                                 │
│  - Contact Requests Tab                                          │
│  - Analytics Tab                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ JWT Token + Super Admin Role
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth Middleware                                          │  │
│  │  - Verify JWT token                                       │  │
│  │  - Check super admin role                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Super Admin Routes                                       │  │
│  │  - GET  /api/superadmin/dashboard/stats                  │  │
│  │  - GET  /api/superadmin/hospitals                        │  │
│  │  - GET  /api/superadmin/contact-requests                 │  │
│  │  - PUT  /api/superadmin/contact-requests/:id             │  │
│  │  - POST /api/superadmin/contact-requests/:id/notes       │  │
│  │  - GET  /api/superadmin/analytics/system                 │  │
│  │  - GET  /api/superadmin/analytics/hospital               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Super Admin Controller                                   │  │
│  │  - getDashboardStats()                                    │  │
│  │  - getHospitalsList()                                     │  │
│  │  - getContactRequests()                                   │  │
│  │  - updateContactRequest()                                 │  │
│  │  - addRequestNote()                                       │  │
│  │  - getSystemAnalytics()                                   │  │
│  │  - getHospitalAnalytics()                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   hospitals  │  │    users     │  │contactrequests│          │
│  │              │  │              │  │              │          │
│  │ - hospitalId │  │ - username   │  │ - requestId  │          │
│  │ - name       │  │ - roles      │  │ - type       │          │
│  │ - status     │  │ - permissions│  │ - status     │          │
│  │ - subscription│  │ - isActive   │  │ - priority   │          │
│  │ - statistics │  │              │  │ - contactInfo│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ usagemetrics │  │   studies    │                             │
│  │              │  │              │                             │
│  │ - hospitalId │  │ - studyUID   │                             │
│  │ - date       │  │ - patientID  │                             │
│  │ - studies    │  │ - modality   │                             │
│  │ - users      │  │              │                             │
│  │ - storage    │  │              │                             │
│  │ - modality   │  │              │                             │
│  │ - aiUsage    │  │              │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Contact Request Flow

```
User on Landing Page
        │
        │ Fills out form
        │ (name, email, org, message)
        ▼
    Click Submit
        │
        │ POST /api/public/contact-request
        │ Rate Limited (5 per 15 min)
        ▼
  Backend Server
        │
        │ Validate data
        │ Generate request ID
        │ Log IP address
        ▼
  Save to MongoDB
  (contactrequests collection)
        │
        │ Status: "new"
        │ Priority: "medium"
        ▼
  Return success
        │
        ▼
  User sees confirmation
  "Request submitted successfully!"
        │
        │
        ▼
Super Admin Dashboard
        │
        │ Sees new request
        │ in Contact Requests tab
        ▼
  Reviews request
        │
        │ Updates status: "contacted"
        │ Adds note: "Called customer"
        ▼
  Follows up
        │
        │ Updates status: "in_progress"
        │ Adds note: "Demo scheduled"
        ▼
  Converts or Closes
        │
        ├─► "converted" → Links to hospital
        └─► "closed" → Marks as resolved
```

### 2. Metrics Tracking Flow

```
User Action
(upload study, view study, create report)
        │
        ▼
  Metrics Middleware
        │
        │ Intercepts request
        │ Identifies action type
        ▼
  Metrics Tracking Service
        │
        │ Get or create daily metrics
        │ for hospital + today's date
        ▼
  Update Metrics
        │
        ├─► Study uploaded → increment studies.uploaded
        ├─► Study viewed → increment studies.viewed
        ├─► Report created → increment studies.reported
        ├─► User login → increment users.totalLogins
        └─► AI request → increment aiUsage.totalRequests
        │
        ▼
  Save to MongoDB
  (usagemetrics collection)
        │
        │ Cached for 5 minutes
        │ to reduce DB writes
        ▼
  Available in Dashboard
        │
        │ Super admin views analytics
        │ Charts and graphs updated
        ▼
  Real-time insights
```

### 3. Hospital Analytics Flow

```
Super Admin
        │
        │ Selects hospital
        │ Chooses date range
        ▼
  GET /api/superadmin/analytics/hospital
  ?hospitalId=hosp_123&startDate=2024-01-01
        │
        ▼
  Backend Controller
        │
        │ Query usagemetrics collection
        │ Filter by hospitalId and date range
        ▼
  Aggregate Data
        │
        ├─► Total uploads, views, reports
        ├─► Average active users
        ├─► Modality breakdown
        └─► Daily trend data
        │
        ▼
  Return JSON
        │
        ▼
  Dashboard Charts
        │
        ├─► Line chart: Daily trend
        ├─► Pie chart: Modality distribution
        └─► Cards: Summary stats
```

---

## Component Architecture

### Frontend (React)

```
App.tsx
  │
  ├─► /landing → LandingPage.tsx
  │              │
  │              ├─► Hero Section
  │              ├─► Features Grid
  │              ├─► Benefits List
  │              ├─► CTA Section
  │              ├─► Contact Dialog
  │              └─► Demo Dialog
  │
  ├─► /login → LoginPage.tsx
  │
  └─► /superadmin → SuperAdminDashboard.tsx
                     │
                     ├─► Overview Tab
                     │   ├─► Stats Cards
                     │   ├─► Storage Progress
                     │   └─► Activity Feed
                     │
                     ├─► Hospitals Tab
                     │   └─► Hospital Table
                     │       ├─► Name, Status
                     │       ├─► Plan, Users
                     │       ├─► Storage
                     │       └─► 30-day Activity
                     │
                     ├─► Contact Requests Tab
                     │   └─► Requests Table
                     │       ├─► Request ID, Type
                     │       ├─► Contact Info
                     │       ├─► Status, Priority
                     │       └─► Actions
                     │
                     └─► Analytics Tab
                         ├─► Line Chart (Daily Trend)
                         ├─► Pie Chart (Modality)
                         └─► Bar Chart (Comparison)
```

### Backend (Node.js/Express)

```
server/src/
  │
  ├─► models/
  │   ├─► ContactRequest.js
  │   ├─► UsageMetrics.js
  │   ├─► Hospital.js
  │   └─► User.js
  │
  ├─► controllers/
  │   └─► superAdminController.js
  │       ├─► getDashboardStats()
  │       ├─► getHospitalsList()
  │       ├─► getContactRequests()
  │       ├─► updateContactRequest()
  │       ├─► addRequestNote()
  │       ├─► getSystemAnalytics()
  │       └─► getHospitalAnalytics()
  │
  ├─► routes/
  │   ├─► superadmin.js (protected)
  │   └─► public.js (no auth)
  │
  ├─► services/
  │   └─► metrics-tracking-service.js
  │       ├─► trackStudyUpload()
  │       ├─► trackStudyView()
  │       ├─► trackReportCreation()
  │       ├─► trackUserLogin()
  │       └─► trackAIRequest()
  │
  └─► middleware/
      ├─► authMiddleware.js
      ├─► metricsMiddleware.js
      └─► rateLimitMiddleware.js
```

---

## Database Schema Relationships

```
┌──────────────┐
│   Hospital   │
│              │
│ hospitalId ◄─┼─────────┐
│ name         │         │
│ status       │         │
│ subscription │         │
└──────────────┘         │
                         │
                         │ Foreign Key
                         │
┌──────────────┐         │
│     User     │         │
│              │         │
│ username     │         │
│ roles        │         │
│ hospitalId ──┼─────────┘
└──────────────┘
        │
        │ Foreign Key
        │
        ▼
┌──────────────┐
│UsageMetrics  │
│              │
│ hospitalId ──┼─────────┐
│ date         │         │
│ studies      │         │
│ users        │         │
│ storage      │         │
│ modality     │         │
└──────────────┘         │
                         │
                         │
┌──────────────┐         │
│ContactRequest│         │
│              │         │
│ requestId    │         │
│ type         │         │
│ status       │         │
│ contactInfo  │         │
│ convertedTo ─┼─────────┘
│ HospitalId   │
└──────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: Network                      │
│  - HTTPS/TLS encryption                                  │
│  - Firewall rules                                        │
│  - DDoS protection                                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Layer 2: Rate Limiting                   │
│  - Public endpoints: 5 req/15 min                        │
│  - API endpoints: 100 req/15 min                         │
│  - IP-based tracking                                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Layer 3: Authentication                   │
│  - JWT token validation                                  │
│  - Token expiration (24 hours)                           │
│  - Refresh token rotation                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Layer 4: Authorization                    │
│  - Role-based access control (RBAC)                      │
│  - Super admin role required                             │
│  - Permission checking                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Layer 5: Data Access                    │
│  - Hospital isolation                                    │
│  - Query filtering by hospitalId                         │
│  - No PHI in analytics                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Layer 6: Audit                         │
│  - All actions logged                                    │
│  - IP address tracking                                   │
│  - Timestamp recording                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Load Balancer                          │
│                   (AWS ALB / Nginx)                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Web Server                             │
│                   (Node.js/Express)                      │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   Backend    │  │   Frontend   │                     │
│  │   API        │  │   React App  │                     │
│  │   Port 5000  │  │   Port 3000  │                     │
│  └──────────────┘  └──────────────┘                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   MongoDB                                │
│                   (Database)                             │
│                                                           │
│  Collections:                                            │
│  - users                                                 │
│  - hospitals                                             │
│  - contactrequests                                       │
│  - usagemetrics                                          │
│  - studies                                               │
└─────────────────────────────────────────────────────────┘
```

---

## Metrics Collection Pipeline

```
User Action
    │
    ▼
┌─────────────────┐
│ Metrics         │
│ Middleware      │
│ (Intercepts)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Identify        │
│ Action Type     │
│ - Upload        │
│ - View          │
│ - Report        │
│ - Login         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Metrics         │
│ Tracking        │
│ Service         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get/Create      │
│ Daily Metrics   │
│ (Cached)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update          │
│ Counters        │
│ - Increment     │
│ - Add to array  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to         │
│ MongoDB         │
│ (Batched)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Available in    │
│ Dashboard       │
│ (Real-time)     │
└─────────────────┘
```

---

## Technology Stack

```
Frontend:
  ├─► React 18
  ├─► TypeScript
  ├─► Material-UI (MUI)
  ├─► Chart.js
  ├─► Axios
  └─► React Router

Backend:
  ├─► Node.js
  ├─► Express.js
  ├─► MongoDB (Mongoose)
  ├─► JWT (jsonwebtoken)
  ├─► bcrypt
  └─► express-rate-limit

Database:
  └─► MongoDB
      ├─► users
      ├─► hospitals
      ├─► contactrequests
      ├─► usagemetrics
      └─► studies

Infrastructure:
  ├─► AWS EC2 (or similar)
  ├─► MongoDB Atlas (or self-hosted)
  ├─► Nginx (reverse proxy)
  └─► PM2 (process manager)
```

---

This architecture provides a scalable, secure, and maintainable super admin system for monitoring and managing multiple hospitals in your medical imaging platform.

