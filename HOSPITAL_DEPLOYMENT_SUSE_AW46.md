# 🏥 Hospital Deployment Guide
## SUSE Linux 11 + GE AW Server 4.6 Integration

**Target Environment:**
- **OS**: SUSE Linux Enterprise Server 11 (SLES 11)
- **Existing System**: GE Healthcare AW Server 4.6
- **Purpose**: Integrate modern DICOM viewer with existing hospital PACS

---

## 📋 Table of Contents

1. [Prerequisites & System Requirements](#prerequisites)
2. [Architecture Overview](#architecture)
3. [Installation Steps](#installation)
4. [AW Server 4.6 Integration](#aw-integration)
5. [Network Configuration](#network)
6. [Security & Firewall](#security)
7. [Testing & Validation](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## 🔧 Prerequisites & System Requirements {#prerequisites}

### Current Hospital Setup
```
┌─────────────────────────────────────────────┐
│   GE AW Server 4.6 (SUSE Linux 11)         │
│   - DICOM Storage (PACS)                    │
│   - Modality Worklist (MWL)                 │
│   - Query/Retrieve (C-FIND/C-MOVE)          │
│   - IP: 192.168.1.100 (example)             │
│   - AE Title: AW_SERVER                     │
│   - Port: 104 (DICOM)                       │
└─────────────────────────────────────────────┘
```

### New Server Requirements

**Option A: Separate Server (Recommended)**
- **OS**: Ubuntu 22.04 LTS or RHEL 8/9
- **CPU**: 8+ cores
- **RAM**: 32GB minimum
- **Storage**: 500GB SSD (OS + App) + 2-4TB HDD (DICOM storage)
- **Network**: 1Gbps connection to hospital network

**Option B: Same SUSE 11 Server (Not Recommended)**
- Risk of breaking existing AW Server
- SUSE 11 is EOL (End of Life - 2019)
- Limited package support

### Software Requirements
```bash
# Required packages
- Node.js 18.x or 20.x
- MongoDB 6.x or 7.x
- Docker & Docker Compose
- Orthanc DICOM Server
- Nginx (reverse proxy)
- PM2 (process manager)
```

---

## 🏗️ Architecture Overview {#architecture}

### Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Hospital Network                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐         ┌────────────────────┐    │
│  │  GE AW Server 4.6   │◄───────►│  New DICOM Viewer  │    │
│  │  (SUSE Linux 11)    │  DICOM  │  (Ubuntu 22.04)    │    │
│  │                     │  C-MOVE │                    │    │
│  │  - PACS Storage     │         │  - Orthanc PACS    │    │
│  │  - AE: AW_SERVER    │         │  - Node.js Backend │    │
│  │  - Port: 104        │         │  - React Frontend  │    │
│  │  - IP: 192.168.1.100│         │  - MongoDB         │    │
│  └─────────────────────┘         │  - IP: 192.168.1.200│   │
│           │                      └────────────────────┘    │
│           │                               │                │
│           │                               │                │
│  ┌────────▼──────────┐         ┌─────────▼──────────┐     │
│  │  Modalities       │         │  Radiologist       │     │
│  │  (CT/MRI/X-Ray)   │         │  Workstations      │     │
│  │  - Send to both   │         │  - Access via      │     │
│  │    AW & Orthanc   │         │    Web Browser     │     │
│  └───────────────────┘         └────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Modality → AW Server (existing workflow)
2. AW Server → Orthanc (DICOM C-STORE forward)
3. Orthanc → MongoDB (metadata indexing)
4. User → Web Browser → Your Viewer
5. Viewer → Orthanc → Retrieve images
```

---

## 📦 Installation Steps {#installation}

### Step 1: Prepare New Server

**DO NOT install on SUSE 11 with AW Server!**

```bash
# On NEW Ubuntu 22.04 server
# SSH into the new server
ssh admin@192.168.1.200

# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl wget git vim net-tools
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
mongosh --eval "db.version()"
```

### Step 4: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### Step 5: Install Orthanc DICOM Server

```bash
# Create Orthanc directory
sudo mkdir -p /opt/orthanc
cd /opt/orthanc

# Create Orthanc configuration
sudo tee orthanc.json > /dev/null <<'EOF'
{
  "Name": "Hospital-Orthanc",
  "HttpPort": 8042,
  "DicomPort": 4242,
  "DicomAet": "ORTHANC",
  
  "RemoteAccessAllowed": true,
  "AuthenticationEnabled": true,
  "RegisteredUsers": {
    "orthanc": "orthanc123"
  },
  
  "DicomModalities": {
    "AW_SERVER": {
      "AET": "AW_SERVER",
      "Host": "192.168.1.100",
      "Port": 104,
      "Manufacturer": "Generic"
    }
  },
  
  "DicomWeb": {
    "Enable": true,
    "Root": "/dicom-web/",
    "EnableWado": true,
    "WadoRoot": "/wado",
    "Ssl": false,
    "QidoCaseSensitive": false
  },
  
  "StorageDirectory": "/var/lib/orthanc/db",
  "IndexDirectory": "/var/lib/orthanc/db",
  
  "MaximumStorageSize": 0,
  "MaximumPatientCount": 0,
  
  "LuaScripts": [],
  "Plugins": []
}
EOF

# Create Docker Compose file
sudo tee docker-compose.yml > /dev/null <<'EOF'
version: '3.8'

services:
  orthanc:
    image: orthancteam/orthanc:latest
    container_name: hospital-orthanc
    restart: unless-stopped
    ports:
      - "8042:8042"  # HTTP/REST API
      - "4242:4242"  # DICOM protocol
    volumes:
      - ./orthanc.json:/etc/orthanc/orthanc.json:ro
      - orthanc-data:/var/lib/orthanc/db
    environment:
      - ORTHANC_NAME=Hospital-Orthanc
      - ORTHANC_USERNAME=orthanc
      - ORTHANC_PASSWORD=orthanc123
    networks:
      - hospital-network

volumes:
  orthanc-data:
    driver: local

networks:
  hospital-network:
    driver: bridge
EOF

# Start Orthanc
sudo docker compose up -d

# Verify Orthanc is running
curl http://localhost:8042/system
```

### Step 6: Deploy Your Application

```bash
# Create application directory
sudo mkdir -p /opt/dicom-viewer
cd /opt/dicom-viewer

# Clone or copy your application
# Option A: From Git
git clone <your-repo-url> .

# Option B: Copy from Windows machine
# Use WinSCP or rsync to transfer files

# Install dependencies
cd server
npm install --production

cd ../viewer
npm install
npm run build

# Go back to root
cd /opt/dicom-viewer
```

### Step 7: Configure Environment Variables

```bash
# Create production environment file
cd /opt/dicom-viewer/server
sudo tee .env > /dev/null <<'EOF'
# Environment
NODE_ENV=production

# Server Configuration
PORT=8001
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hospital_dicom

# JWT Secret (CHANGE THIS!)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_256_BIT_STRING

# Orthanc Configuration
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc123

# Medical AI (Disabled initially)
MEDSIGCLIP_ENABLED=false
MEDGEMMA_4B_ENABLED=false
MEDGEMMA_27B_ENABLED=false

# Security
ENABLE_AUTH_LOGGING=true
CORS_ORIGIN=http://192.168.1.200

# Storage
UPLOAD_DIR=/opt/dicom-viewer/uploads
TEMP_DIR=/opt/dicom-viewer/temp
EOF

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/CHANGE_THIS_TO_RANDOM_256_BIT_STRING/$JWT_SECRET/" .env

# Create required directories
sudo mkdir -p /opt/dicom-viewer/uploads
sudo mkdir -p /opt/dicom-viewer/temp
sudo chown -R $USER:$USER /opt/dicom-viewer
```

### Step 8: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /opt/dicom-viewer
tee ecosystem.config.js > /dev/null <<'EOF'
module.exports = {
  apps: [{
    name: 'dicom-viewer-backend',
    script: './server/src/index.js',
    cwd: '/opt/dicom-viewer',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: '/var/log/dicom-viewer/error.log',
    out_file: '/var/log/dicom-viewer/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/dicom-viewer
sudo chown -R $USER:$USER /var/log/dicom-viewer

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (will be something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Verify application is running
pm2 status
pm2 logs dicom-viewer-backend --lines 50
```

### Step 9: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/dicom-viewer > /dev/null <<'EOF'
# Upstream backend
upstream backend {
    server 127.0.0.1:8001;
    keepalive 64;
}

# HTTP Server
server {
    listen 80;
    server_name 192.168.1.200;  # Change to your server IP or hostname
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client max body size (for DICOM uploads)
    client_max_body_size 2G;
    client_body_timeout 300s;
    
    # Frontend (React build)
    location / {
        root /opt/dicom-viewer/viewer/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large DICOM files
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Orthanc DICOM Server (proxy)
    location /orthanc/ {
        proxy_pass http://127.0.0.1:8042/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Basic auth passthrough
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/dicom-viewer /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

---

## 🔗 AW Server 4.6 Integration {#aw-integration}

### Configure AW Server to Forward DICOM to Orthanc

**On AW Server 4.6 (SUSE Linux 11):**

```bash
# SSH into AW Server
ssh root@192.168.1.100

# Backup AW Server configuration
cp /usr/g/service/aw/config/dicom.cfg /usr/g/service/aw/config/dicom.cfg.backup

# Add Orthanc as a DICOM destination
# Edit the configuration file
vi /usr/g/service/aw/config/dicom.cfg
```

**Add this configuration:**

```ini
# Orthanc DICOM Node
[ORTHANC]
AETitle = ORTHANC
Hostname = 192.168.1.200
Port = 4242
Description = Modern DICOM Viewer
Enabled = Yes
AutoRoute = Yes
```

**Restart AW DICOM Service:**

```bash
# Stop AW services
/etc/init.d/aw stop

# Wait 10 seconds
sleep 10

# Start AW services
/etc/init.d/aw start

# Verify services are running
ps aux | grep aw
netstat -tulpn | grep 104
```

### Test DICOM Connection

**From New Server (Ubuntu):**

```bash
# Install DICOM tools
sudo apt install -y dcmtk

# Test DICOM echo to AW Server
echoscu -aec AW_SERVER 192.168.1.100 104

# Expected output: "Association Accepted"

# Test DICOM echo to Orthanc
echoscu -aec ORTHANC 192.168.1.200 4242

# Expected output: "Association Accepted"
```

**From AW Server:**

```bash
# Test connection to Orthanc
/usr/g/service/aw/bin/echoscu -aec ORTHANC 192.168.1.200 4242
```

### Configure Auto-Forward from AW to Orthanc

**Option A: Using AW Server Auto-Routing**

```bash
# On AW Server, edit auto-routing rules
vi /usr/g/service/aw/config/autoroute.cfg
```

Add:
```ini
# Auto-forward all studies to Orthanc
[RULE_ORTHANC]
Enabled = Yes
Destination = ORTHANC
Modality = *
StudyDescription = *
Priority = Medium
```

**Option B: Using Orthanc Query/Retrieve**

```bash
# On new server, create a script to pull studies from AW
tee /opt/dicom-viewer/scripts/sync-from-aw.sh > /dev/null <<'EOF'
#!/bin/bash

# Query AW Server for studies from last 24 hours
curl -X POST http://localhost:8042/modalities/AW_SERVER/query \
  -H "Content-Type: application/json" \
  -u orthanc:orthanc123 \
  -d '{
    "Level": "Study",
    "Query": {
      "StudyDate": "'$(date -d '1 day ago' +%Y%m%d)'-'$(date +%Y%m%d)'"
    }
  }'

# Retrieve all matching studies
curl -X POST http://localhost:8042/modalities/AW_SERVER/move \
  -H "Content-Type: application/json" \
  -u orthanc:orthanc123 \
  -d '{
    "Level": "Study",
    "TargetAet": "ORTHANC"
  }'
EOF

chmod +x /opt/dicom-viewer/scripts/sync-from-aw.sh

# Add to crontab (run every hour)
(crontab -l 2>/dev/null; echo "0 * * * * /opt/dicom-viewer/scripts/sync-from-aw.sh >> /var/log/dicom-sync.log 2>&1") | crontab -
```

---

## 🌐 Network Configuration {#network}

### Firewall Rules

```bash
# On new server (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (future)
sudo ufw allow 4242/tcp  # DICOM (from hospital network only)
sudo ufw allow 8042/tcp  # Orthanc (from hospital network only)

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
```

### Network Testing

```bash
# Test connectivity from workstation
ping 192.168.1.200

# Test HTTP access
curl http://192.168.1.200/health

# Test API
curl http://192.168.1.200/api/health

# Test Orthanc
curl http://192.168.1.200/orthanc/system -u orthanc:orthanc123
```

---

## 🔒 Security & Firewall {#security}

### Secure MongoDB

```bash
# Enable MongoDB authentication
sudo mongosh

use admin
db.createUser({
  user: "dicomadmin",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

use hospital_dicom
db.createUser({
  user: "dicomapp",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [ { role: "readWrite", db: "hospital_dicom" } ]
})

exit

# Edit MongoDB config
sudo vi /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

```bash
# Restart MongoDB
sudo systemctl restart mongod

# Update .env file with new credentials
cd /opt/dicom-viewer/server
vi .env
# Change: MONGODB_URI=mongodb://dicomapp:PASSWORD@localhost:27017/hospital_dicom

# Restart application
pm2 restart all
```

### SSL/TLS Configuration (Optional but Recommended)

```bash
# Install certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (if you have a domain name)
sudo certbot --nginx -d your-domain.com

# Or use self-signed certificate for internal use
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/dicom-viewer.key \
  -out /etc/ssl/certs/dicom-viewer.crt

# Update Nginx config for HTTPS
# (Configuration provided in separate section if needed)
```

---

## ✅ Testing & Validation {#testing}

### System Health Checks

```bash
# Create health check script
tee /opt/dicom-viewer/scripts/health-check.sh > /dev/null <<'EOF'
#!/bin/bash

echo "=== DICOM Viewer Health Check ==="
echo ""

# Check MongoDB
echo "1. MongoDB:"
systemctl is-active mongod && echo "✓ Running" || echo "✗ Not running"

# Check Orthanc
echo "2. Orthanc:"
docker ps | grep orthanc && echo "✓ Running" || echo "✗ Not running"

# Check Backend
echo "3. Backend (PM2):"
pm2 list | grep dicom-viewer-backend && echo "✓ Running" || echo "✗ Not running"

# Check Nginx
echo "4. Nginx:"
systemctl is-active nginx && echo "✓ Running" || echo "✗ Not running"

# Check API
echo "5. API Health:"
curl -s http://localhost:8001/api/health | grep -q "healthy" && echo "✓ Healthy" || echo "✗ Unhealthy"

# Check Orthanc API
echo "6. Orthanc API:"
curl -s -u orthanc:orthanc123 http://localhost:8042/system | grep -q "Version" && echo "✓ Healthy" || echo "✗ Unhealthy"

# Check DICOM connectivity to AW Server
echo "7. DICOM Connection to AW Server:"
echoscu -aec AW_SERVER 192.168.1.100 104 2>&1 | grep -q "Accepted" && echo "✓ Connected" || echo "✗ Not connected"

echo ""
echo "=== End Health Check ==="
EOF

chmod +x /opt/dicom-viewer/scripts/health-check.sh

# Run health check
/opt/dicom-viewer/scripts/health-check.sh
```

### Send Test DICOM Study

```bash
# From a workstation with DICOM files
storescu -aec ORTHANC 192.168.1.200 4242 /path/to/dicom/files/*.dcm

# Or from AW Server
/usr/g/service/aw/bin/storescu -aec ORTHANC 192.168.1.200 4242 /path/to/study/*
```

### Access Web Interface

```
1. Open browser: http://192.168.1.200
2. Login with default credentials (if configured)
3. Check if studies appear
4. Test viewer functionality
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Common Issues

**1. Cannot connect to AW Server**

```bash
# Check network connectivity
ping 192.168.1.100

# Check if AW DICOM port is open
telnet 192.168.1.100 104

# Check AW Server logs
ssh root@192.168.1.100
tail -f /usr/g/service/aw/log/dicom.log
```

**2. Orthanc not receiving studies**

```bash
# Check Orthanc logs
docker logs hospital-orthanc -f

# Test DICOM echo
echoscu -aec ORTHANC 192.168.1.200 4242

# Check firewall
sudo ufw status
sudo iptables -L -n
```

**3. Backend not starting**

```bash
# Check PM2 logs
pm2 logs dicom-viewer-backend

# Check MongoDB connection
mongosh mongodb://localhost:27017/hospital_dicom

# Check environment variables
cd /opt/dicom-viewer/server
cat .env

# Restart backend
pm2 restart all
```

**4. Frontend not loading**

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if build exists
ls -la /opt/dicom-viewer/viewer/dist

# Rebuild frontend
cd /opt/dicom-viewer/viewer
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

**5. DICOM images not displaying**

```bash
# Check Orthanc storage
curl -u orthanc:orthanc123 http://localhost:8042/statistics

# Check if studies exist
curl -u orthanc:orthanc123 http://localhost:8042/studies

# Check browser console for errors
# Open browser DevTools (F12) and check Console tab
```

### Log Locations

```bash
# Application logs
/var/log/dicom-viewer/error.log
/var/log/dicom-viewer/out.log

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# MongoDB logs
/var/log/mongodb/mongod.log

# Orthanc logs
docker logs hospital-orthanc

# PM2 logs
pm2 logs
```

---

## 🔄 Maintenance {#maintenance}

### Daily Tasks

```bash
# Check system health
/opt/dicom-viewer/scripts/health-check.sh

# Check disk space
df -h

# Check logs for errors
pm2 logs --lines 100 --err
```

### Weekly Tasks

```bash
# Backup MongoDB
mongodump --out /backup/mongodb/$(date +%Y%m%d)

# Backup Orthanc data
docker exec hospital-orthanc tar czf /tmp/orthanc-backup.tar.gz /var/lib/orthanc/db
docker cp hospital-orthanc:/tmp/orthanc-backup.tar.gz /backup/orthanc/orthanc-$(date +%Y%m%d).tar.gz

# Clean old logs
find /var/log/dicom-viewer -name "*.log" -mtime +30 -delete

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### Monthly Tasks

```bash
# Review security logs
sudo grep -i "failed\|error" /var/log/auth.log

# Check for application updates
cd /opt/dicom-viewer
git fetch
git status

# Optimize MongoDB
mongosh
use hospital_dicom
db.runCommand({ compact: 'studies' })
db.runCommand({ compact: 'series' })
exit

# Review disk usage
du -sh /var/lib/orthanc/db
du -sh /opt/dicom-viewer
```

### Backup Script

```bash
# Create automated backup script
sudo tee /opt/dicom-viewer/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash

BACKUP_DIR="/backup/dicom-viewer"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup Orthanc
echo "Backing up Orthanc..."
docker exec hospital-orthanc tar czf /tmp/orthanc-backup.tar.gz /var/lib/orthanc/db
docker cp hospital-orthanc:/tmp/orthanc-backup.tar.gz $BACKUP_DIR/orthanc_$DATE.tar.gz

# Backup application config
echo "Backing up application config..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz /opt/dicom-viewer/server/.env /opt/orthanc/orthanc.json

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/dicom-viewer/scripts/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/dicom-viewer/scripts/backup.sh >> /var/log/dicom-backup.log 2>&1") | crontab -
```

---

## 📞 Support & Next Steps

### Verification Checklist

- [ ] New server installed and configured
- [ ] Orthanc running and accessible
- [ ] MongoDB running with authentication
- [ ] Backend application running via PM2
- [ ] Nginx serving frontend and proxying API
- [ ] DICOM connection to AW Server verified
- [ ] Test study sent and viewable
- [ ] Backups configured and tested
- [ ] Monitoring and health checks in place

### Next Steps

1. **User Training**: Train radiologists on new interface
2. **Gradual Rollout**: Start with one department
3. **Monitor Performance**: Watch logs and metrics
4. **Gather Feedback**: Collect user feedback
5. **Add AI**: Once stable, consider adding AI features

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Contact**: Your IT Department

