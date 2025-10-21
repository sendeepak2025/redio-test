#!/bin/bash

# Production Build Script for Medical Imaging System
# This script builds both frontend and backend for production deployment

set -e  # Exit on error

echo "🏗️  Building Medical Imaging System for Production..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"

# Create production directory
echo ""
echo "📁 Creating production directory..."
mkdir -p production
mkdir -p production/server
mkdir -p production/viewer

# Build Backend
echo ""
echo "🔧 Building Backend..."
echo "------------------------"

cd server

# Install dependencies
echo "📦 Installing server dependencies..."
npm install --production

# Copy server files
echo "📋 Copying server files..."
cp -r src ../production/server/
cp package.json ../production/server/
cp package-lock.json ../production/server/
cp -r node_modules ../production/server/

# Create logs directory
mkdir -p ../production/server/logs
mkdir -p ../production/server/uploads

echo -e "${GREEN}✅ Backend build complete${NC}"

cd ..

# Build Frontend
echo ""
echo "🎨 Building Frontend..."
echo "------------------------"

cd viewer

# Install dependencies
echo "📦 Installing viewer dependencies..."
npm install

# Build production bundle
echo "🔨 Building production bundle..."
npm run build

# Copy build files
echo "📋 Copying build files..."
cp -r dist ../production/viewer/
cp package.json ../production/viewer/

echo -e "${GREEN}✅ Frontend build complete${NC}"

cd ..

# Create environment template
echo ""
echo "📝 Creating environment template..."
cat > production/.env.example << 'EOF'
# Database
MONGODB_URI=mongodb://localhost:27017/medical-imaging
MONGODB_TEST_URI=mongodb://localhost:27017/medical-imaging-test

# Authentication
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
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

# AI Services (Optional)
MEDSIGCLIP_API_URL=http://localhost:5000
MEDGEMMA_API_URL=http://localhost:5001

# Notifications (Optional)
SLACK_WEBHOOK_URL=
PAGERDUTY_INTEGRATION_KEY=

# Server
PORT=8001
NODE_ENV=production
EOF

# Create PM2 ecosystem file
echo ""
echo "📝 Creating PM2 configuration..."
cat > production/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'medical-imaging-api',
    script: './server/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './server/logs/error.log',
    out_file: './server/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
EOF

# Create nginx configuration
echo ""
echo "📝 Creating nginx configuration..."
cat > production/nginx.conf << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        root /var/www/medical-imaging/viewer/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large DICOM uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Auth endpoints
    location /auth {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8001;
        access_log off;
    }

    # Max upload size for DICOM files
    client_max_body_size 500M;
}
EOF

# Create deployment script
echo ""
echo "📝 Creating deployment script..."
cat > production/deploy.sh << 'EOF'
#!/bin/bash

# Deployment script for Medical Imaging System

set -e

echo "🚀 Deploying Medical Imaging System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing application
echo "🛑 Stopping existing application..."
pm2 stop medical-imaging-api || true
pm2 delete medical-imaging-api || true

# Start application with PM2
echo "▶️  Starting application..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo pm2 startup

# Copy nginx configuration
echo "📋 Setting up nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/medical-imaging
sudo ln -sf /etc/nginx/sites-available/medical-imaging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Copy frontend files
echo "📁 Copying frontend files..."
sudo mkdir -p /var/www/medical-imaging
sudo cp -r viewer/dist /var/www/medical-imaging/viewer/

echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 Next steps:"
echo "1. Configure SSL: sudo certbot --nginx -d yourdomain.com"
echo "2. Check logs: pm2 logs medical-imaging-api"
echo "3. Monitor: pm2 monit"
EOF

chmod +x production/deploy.sh

# Create README
echo ""
echo "📝 Creating deployment README..."
cat > production/README.md << 'EOF'
# Medical Imaging System - Production Build

This directory contains the production-ready build of the Medical Imaging System.

## Contents

- `server/` - Backend API (Node.js/Express)
- `viewer/` - Frontend application (React build)
- `ecosystem.config.js` - PM2 configuration
- `nginx.conf` - Nginx configuration
- `.env.example` - Environment variables template
- `deploy.sh` - Deployment script

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Nginx
- PM2 (will be installed by deploy script)
- SSL certificate (Let's Encrypt recommended)

## Quick Start

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

2. **Generate Secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh
   ```

4. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Manual Deployment

### 1. Install Dependencies

```bash
cd server
npm install --production
```

### 2. Start Backend

```bash
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

### 3. Configure Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/medical-imaging
sudo ln -s /etc/nginx/sites-available/medical-imaging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Deploy Frontend

```bash
sudo mkdir -p /var/www/medical-imaging
sudo cp -r viewer/dist /var/www/medical-imaging/viewer/
```

## Monitoring

```bash
# View logs
pm2 logs medical-imaging-api

# Monitor resources
pm2 monit

# Check status
pm2 status

# Restart
pm2 restart medical-imaging-api
```

## Backup

```bash
# Backup database
mongodump --out=/backup/mongodb/$(date +%Y%m%d)

# Backup application
tar -czf medical-imaging-backup-$(date +%Y%m%d).tar.gz /var/www/medical-imaging
```

## Troubleshooting

### Application won't start
```bash
pm2 logs medical-imaging-api --lines 100
```

### Database connection issues
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('ping')"
```

### Nginx issues
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## Support

For issues, check the documentation or contact support.
EOF

# Create package info
echo ""
echo "📝 Creating package info..."
cat > production/package-info.json << EOF
{
  "name": "medical-imaging-system",
  "version": "1.0.0",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "components": {
    "backend": "Node.js/Express API",
    "frontend": "React 18 SPA",
    "database": "MongoDB",
    "pacs": "Orthanc"
  },
  "features": [
    "DICOM Viewer (2D/3D)",
    "User Management",
    "RBAC Security",
    "Email Notifications",
    "Audit Logging",
    "System Monitoring",
    "Medical AI Integration",
    "Structured Reporting",
    "PACS Integration",
    "Backup & Recovery"
  ]
}
EOF

# Create archive
echo ""
echo "📦 Creating production archive..."
cd production
tar -czf ../medical-imaging-production-$(date +%Y%m%d-%H%M%S).tar.gz .
cd ..

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Production Build Complete!"
echo -e "==================================================${NC}"
echo ""
echo "📦 Build artifacts:"
echo "   - production/ directory"
echo "   - medical-imaging-production-*.tar.gz"
echo ""
echo "📝 Next steps:"
echo "   1. Copy production archive to your server"
echo "   2. Extract: tar -xzf medical-imaging-production-*.tar.gz"
echo "   3. Configure: cp .env.example .env && nano .env"
echo "   4. Deploy: ./deploy.sh"
echo ""
echo "📚 Documentation:"
echo "   - production/README.md"
echo "   - PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "   - CRITICAL_FIXES_IMPLEMENTED.md"
echo ""
echo -e "${YELLOW}⚠️  Remember to:"
echo "   - Configure .env with production values"
echo "   - Generate strong JWT secrets"
echo "   - Setup SSL certificates"
echo "   - Configure email SMTP"
echo -e "   - Secure MongoDB${NC}"
echo ""
echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
