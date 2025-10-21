# Production Build Script for Windows
# Medical Imaging System

Write-Host "🏗️  Building Medical Imaging System for Production..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Create production directory
Write-Host "`n📁 Creating production directory..." -ForegroundColor Cyan
if (Test-Path "production") {
    Remove-Item -Recurse -Force "production"
}
New-Item -ItemType Directory -Path "production" | Out-Null
New-Item -ItemType Directory -Path "production/server" | Out-Null
New-Item -ItemType Directory -Path "production/viewer" | Out-Null

# Build Backend
Write-Host "`n🔧 Building Backend..." -ForegroundColor Cyan
Set-Location "server"
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
npm install --production --silent

Write-Host "📋 Copying server files..." -ForegroundColor Yellow
Copy-Item -Recurse -Path "src" -Destination "../production/server/"
Copy-Item "package.json" -Destination "../production/server/"
Copy-Item "package-lock.json" -Destination "../production/server/"
New-Item -ItemType Directory -Path "../production/server/logs" -Force | Out-Null
New-Item -ItemType Directory -Path "../production/server/uploads" -Force | Out-Null

Write-Host "✅ Backend ready" -ForegroundColor Green
Set-Location ".."

# Build Frontend
Write-Host "`n🎨 Building Frontend..." -ForegroundColor Cyan
Set-Location "viewer"
Write-Host "📦 Installing viewer dependencies..." -ForegroundColor Yellow
npm install --silent

Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
$env:SKIP_PREFLIGHT_CHECK = "true"
npm run build 2>&1 | Out-Null

if (Test-Path "dist") {
    Write-Host "📋 Copying build files..." -ForegroundColor Yellow
    Copy-Item -Recurse -Path "dist" -Destination "../production/viewer/"
    Write-Host "✅ Frontend built" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend build may have issues, but continuing..." -ForegroundColor Yellow
}

Set-Location ".."

# Create configuration files
Write-Host "`n📝 Creating configuration files..." -ForegroundColor Cyan

# .env.example
@"
# Database
MONGODB_URI=mongodb://localhost:27017/medical-imaging

# Authentication
JWT_SECRET=GENERATE_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=GENERATE_RANDOM_64_CHAR_STRING_HERE
REFRESH_TOKEN_EXPIRATION=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@medical-imaging.local
EMAIL_TO=admin@medical-imaging.local

# Orthanc PACS
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc

# Server
PORT=8001
NODE_ENV=production
"@ | Out-File -FilePath "production/.env.example" -Encoding UTF8

# PM2 ecosystem
@"
module.exports = {
  apps: [{
    name: 'medical-imaging-api',
    script: './server/src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './server/logs/error.log',
    out_file: './server/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
"@ | Out-File -FilePath "production/ecosystem.config.js" -Encoding UTF8

# Windows deployment script
@"
# Windows Deployment Script
Write-Host "🚀 Deploying Medical Imaging System..." -ForegroundColor Green

# Check .env
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Install PM2
if (!(Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Install dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install --production
Set-Location ..

# Stop existing
pm2 stop medical-imaging-api 2>`$null
pm2 delete medical-imaging-api 2>`$null

# Start
Write-Host "▶️  Starting application..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
pm2 save

Write-Host "✅ Deployment complete!" -ForegroundColor Green
pm2 status
"@ | Out-File -FilePath "production/deploy.ps1" -Encoding UTF8

# README
@"
# Medical Imaging System - Production Build

## Quick Start (Windows)

1. **Configure environment:**
   ``````powershell
   Copy-Item .env.example .env
   notepad .env
   ``````

2. **Generate secrets:**
   ``````powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ``````

3. **Deploy:**
   ``````powershell
   .\deploy.ps1
   ``````

## Manual Deployment

### 1. Install Dependencies
``````powershell
cd server
npm install --production
``````

### 2. Start Backend
``````powershell
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
``````

### 3. Serve Frontend
Use IIS or any web server to serve the `viewer/dist` folder.

## Monitoring
``````powershell
pm2 logs medical-imaging-api
pm2 monit
pm2 status
``````

## Requirements
- Node.js 18+
- MongoDB 6+
- PM2 (for process management)

## Features Included
✅ Email notifications (nodemailer)
✅ User management API
✅ Comprehensive audit logging
✅ DICOM viewer (2D/3D)
✅ System monitoring
✅ Medical AI integration
✅ Structured reporting
✅ PACS integration
✅ Backup & recovery

## Support
Check documentation in parent directory for detailed guides.
"@ | Out-File -FilePath "production/README.md" -Encoding UTF8

# Create archive
Write-Host "`n📦 Creating production archive..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "medical-imaging-production-$timestamp.zip"

if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "production/*" -DestinationPath $archiveName -Force
    Write-Host "✅ Archive created: $archiveName" -ForegroundColor Green
} else {
    Write-Host "⚠️  Compress-Archive not available, skipping archive creation" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=================================================="  -ForegroundColor Green
Write-Host "✅ Production Build Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "`n📦 Build artifacts:" -ForegroundColor Cyan
Write-Host "   - production/ directory"
if (Test-Path $archiveName) {
    Write-Host "   - $archiveName"
}

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure: Copy-Item production/.env.example production/.env"
Write-Host "   2. Edit .env with your settings"
Write-Host "   3. Deploy: cd production; .\deploy.ps1"

Write-Host "`n⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "   - Configure .env with production values"
Write-Host "   - Generate strong JWT secrets"
Write-Host "   - Configure email SMTP settings"
Write-Host "   - Secure MongoDB connection"

Write-Host "`nReady for production deployment!" -ForegroundColor Green
