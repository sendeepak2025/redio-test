# 🚀 Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Critical Fixes (COMPLETED)
- [x] Email notifications implemented
- [x] User management API created
- [x] Comprehensive audit logging integrated
- [x] Dependencies installed (`nodemailer`)

### 📋 Configuration

#### 1. Environment Variables
Create/update `.env` file:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/medical-imaging
MONGODB_TEST_URI=mongodb://localhost:27017/medical-imaging-test

# Authentication
JWT_SECRET=<generate-strong-secret-key>
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=<generate-strong-secret-key>
REFRESH_TOKEN_EXPIRATION=7d

# Email Configuration (REQUIRED)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@medical-imaging.local
EMAIL_TO=admin@medical-imaging.local

# Orthanc PACS
ORTHANC_URL=http://69.62.70.102:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc

# AI Services (Optional)
MEDSIGCLIP_API_URL=http://localhost:5000
MEDGEMMA_API_URL=http://localhost:5001

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-key

# Server
PORT=8001
NODE_ENV=production
```

#### 2. Generate Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. Create Required Directories
```bash
mkdir -p server/logs
mkdir -p server/uploads
mkdir -p server/backups
```

### 🔒 Security Checklist

- [ ] Strong JWT secrets configured
- [ ] HTTPS/TLS certificates installed
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] MongoDB authentication enabled
- [ ] Orthanc credentials secured
- [ ] Email credentials secured (use app passwords)
- [ ] Firewall rules configured
- [ ] Backup encryption keys stored securely

### 🗄️ Database Setup

- [ ] MongoDB installed and running
- [ ] Database indexes created
- [ ] Initial admin user created
- [ ] Database backup configured
- [ ] Connection pooling configured

### 📧 Email Setup

#### Gmail Setup:
1. Enable 2-factor authentication
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use app password in SMTP_PASSWORD

#### SendGrid Setup:
1. Create SendGrid account
2. Generate API key
3. Verify sender domain
4. Use API key as SMTP_PASSWORD

#### AWS SES Setup:
1. Verify email/domain in SES
2. Create SMTP credentials
3. Move out of sandbox mode
4. Configure SMTP settings

### 🧪 Testing Checklist

#### Email Testing:
```bash
# Test email service
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/api/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

#### User Management Testing:
```bash
# Create test user
curl -X POST https://apiradio.varnaamedicalbillingsolutions.com/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@example.com",
    "password":"test123",
    "firstName":"Test",
    "lastName":"User",
    "roles":["staff"]
  }'

# List users
curl https://apiradio.varnaamedicalbillingsolutions.com/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Audit Logging Testing:
```bash
# Check audit log exists
ls -la server/logs/audit.log

# View recent audit entries
tail -f server/logs/audit.log
```

### 🔍 Monitoring Setup

- [ ] System monitoring dashboard accessible
- [ ] Alert notifications configured
- [ ] Log rotation configured
- [ ] Disk space monitoring active
- [ ] Database performance monitoring
- [ ] API response time tracking
- [ ] Error tracking (Sentry/similar)

### 📊 Performance Optimization

- [ ] Database indexes optimized
- [ ] Image caching configured
- [ ] CDN configured (if applicable)
- [ ] Gzip compression enabled
- [ ] Static asset optimization
- [ ] Connection pooling tuned

### 🔄 Backup & Recovery

- [ ] Automated backups configured
- [ ] Backup retention policy set (30 days)
- [ ] Backup encryption enabled
- [ ] Disaster recovery plan documented
- [ ] Backup restoration tested
- [ ] Off-site backup storage configured

### 📝 Documentation

- [ ] API documentation updated
- [ ] User manual created
- [ ] Admin guide created
- [ ] Troubleshooting guide created
- [ ] Runbooks for common issues
- [ ] Contact information documented

### 👥 User Setup

- [ ] Admin users created
- [ ] Radiologist accounts created
- [ ] Technician accounts created
- [ ] Roles and permissions verified
- [ ] User training completed
- [ ] Support contact established

---

## Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
# Follow: https://docs.mongodb.com/manual/installation/

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd medical-imaging-system

# Install dependencies
cd server && npm install
cd ../viewer && npm install

# Build frontend
cd viewer
npm run build

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

### 3. Start Services

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Start Orthanc
docker run -d --name orthanc \
  -p 8042:8042 \
  -v orthanc-db:/var/lib/orthanc/db \
  jodogne/orthanc

# Start backend with PM2
cd server
pm2 start src/index.js --name medical-imaging-api
pm2 save
pm2 startup

# Serve frontend with nginx
sudo cp nginx.conf /etc/nginx/sites-available/medical-imaging
sudo ln -s /etc/nginx/sites-available/medical-imaging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Verify Deployment

```bash
# Check services
pm2 status
sudo systemctl status mongod
sudo systemctl status nginx
docker ps

# Check logs
pm2 logs medical-imaging-api
tail -f server/logs/audit.log
tail -f /var/log/nginx/access.log

# Test endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/monitoring/system-health
```

---

## Post-Deployment Checklist

### Immediate (Day 1)

- [ ] All services running
- [ ] SSL certificates valid
- [ ] Email notifications working
- [ ] User login working
- [ ] DICOM upload working
- [ ] 3D viewer working
- [ ] Audit logs being written
- [ ] Monitoring dashboard accessible
- [ ] Backup job ran successfully

### Week 1

- [ ] Monitor error logs daily
- [ ] Check disk space
- [ ] Verify backup integrity
- [ ] Review audit logs
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Security scan completed

### Month 1

- [ ] Review system performance
- [ ] Optimize slow queries
- [ ] Update documentation
- [ ] Plan feature enhancements
- [ ] Review user access logs
- [ ] Compliance audit
- [ ] Disaster recovery drill

---

## Rollback Plan

If issues occur:

1. **Stop services:**
   ```bash
   pm2 stop medical-imaging-api
   sudo systemctl stop nginx
   ```

2. **Restore database:**
   ```bash
   mongorestore --drop /path/to/backup
   ```

3. **Revert code:**
   ```bash
   git checkout <previous-stable-tag>
   npm install
   pm2 restart medical-imaging-api
   ```

4. **Verify:**
   ```bash
   curl https://apiradio.varnaamedicalbillingsolutions.com/health
   ```

---

## Support Contacts

- **System Administrator:** admin@yourdomain.com
- **Technical Support:** support@yourdomain.com
- **Emergency Contact:** +1-XXX-XXX-XXXX
- **Vendor Support:** (if applicable)

---

## Compliance Checklist

### HIPAA Compliance

- [ ] Access controls implemented (RBAC)
- [ ] Audit logging complete
- [ ] Encryption at rest (backups)
- [ ] Encryption in transit (HTTPS)
- [ ] User authentication (JWT)
- [ ] Session management
- [ ] PHI de-identification available
- [ ] Data backup and recovery
- [ ] Business Associate Agreements signed
- [ ] Security risk assessment completed
- [ ] Incident response plan documented
- [ ] Staff training completed

### Data Protection

- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy enforced
- [ ] Right to erasure implemented
- [ ] Data portability available
- [ ] Privacy policy published
- [ ] Consent management
- [ ] Data breach notification plan

---

## Success Criteria

✅ **System is production-ready when:**

1. All services running without errors
2. Email notifications delivering successfully
3. Users can login and access studies
4. DICOM uploads working
5. 3D viewer functional
6. Audit logs being written
7. Backups running automatically
8. Monitoring alerts configured
9. SSL certificates valid
10. Documentation complete

---

## Emergency Procedures

### System Down
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Restart: `pm2 restart medical-imaging-api`
4. If persists, check MongoDB: `sudo systemctl status mongod`

### Database Issues
1. Check MongoDB logs: `sudo journalctl -u mongod`
2. Check disk space: `df -h`
3. Restart MongoDB: `sudo systemctl restart mongod`
4. Restore from backup if corrupted

### Email Not Sending
1. Test SMTP connection
2. Check credentials in .env
3. Verify email service logs
4. Check spam folder
5. Try alternative SMTP provider

---

## 🎉 You're Ready!

Once all items are checked, your Medical Imaging System is production-ready and HIPAA-compliant!

**Questions?** Review the documentation or contact support.

**Good luck with your deployment! 🚀**
