# ✅ Pre-Deployment Security Checklist

**Application:** Medical Imaging PACS System  
**Date:** October 17, 2025  
**Deployment Target:** Production  

---

## 🚨 CRITICAL - Must Complete Before Deployment

### 1. JWT Secret Configuration

- [ ] **Generate strong JWT secret (256+ bits)**
  ```bash
  openssl rand -base64 32
  ```

- [ ] **Set JWT_SECRET in production environment**
  ```bash
  # Add to server/.env
  JWT_SECRET=<your_generated_secret>
  ```

- [ ] **Verify JWT_SECRET is set**
  ```bash
  cat server/.env | grep JWT_SECRET
  # Should NOT be empty or 'dev_secret'
  ```

- [ ] **Remove any dev_secret from production config**

### 2. Admin User Setup

- [ ] **Verify admin user seeding is enabled**
  ```bash
  grep -A 5 "seedAdmin" server/src/index.js
  # Should NOT be commented out
  ```

- [ ] **Test admin login after deployment**
  ```bash
  curl -X POST http://localhost:8001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```

- [ ] **Change default admin password immediately**
  - Login to admin panel
  - Navigate to profile settings
  - Update password to strong password

### 3. Environment Configuration

- [ ] **Set NODE_ENV to production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Enable authentication logging**
  ```bash
  ENABLE_AUTH_LOGGING=true
  ```

- [ ] **Verify MongoDB URI is secure**
  - Uses TLS/SSL
  - Strong password
  - IP whitelist configured

- [ ] **Verify Orthanc credentials are secure**
  - Not using default credentials
  - Strong password set

### 4. Authentication Testing

- [ ] **Test unauthenticated access is blocked**
  ```bash
  curl http://localhost:8001/api/dicom/studies
  # Expected: 401 Unauthorized
  ```

- [ ] **Test login endpoint works**
  ```bash
  curl -X POST http://localhost:8001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  # Expected: Token returned
  ```

- [ ] **Test authenticated access works**
  ```bash
  TOKEN="<token_from_login>"
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:8001/api/dicom/studies
  # Expected: Studies returned
  ```

- [ ] **Test invalid token is rejected**
  ```bash
  curl -H "Authorization: Bearer invalid_token" \
    http://localhost:8001/api/dicom/studies
  # Expected: 401 Invalid token
  ```

- [ ] **Test expired token is rejected**
  - Wait for token to expire
  - Attempt to use expired token
  - Expected: 401 Token expired

---

## 🔒 HIGH PRIORITY - Strongly Recommended

### 5. HTTPS/TLS Configuration

- [ ] **SSL/TLS certificates installed**
  ```bash
  ls -la /etc/nginx/certs/
  # Should show cert.pem and key.pem
  ```

- [ ] **Nginx configured for HTTPS**
  ```bash
  grep "listen 443" /etc/nginx/nginx.conf
  ```

- [ ] **HTTP to HTTPS redirect enabled**
  ```bash
  grep "return 301 https" /etc/nginx/nginx.conf
  ```

- [ ] **Test HTTPS connection**
  ```bash
  curl -I https://your-domain.com
  # Should return 200 OK
  ```

- [ ] **Verify certificate validity**
  ```bash
  openssl s_client -connect your-domain.com:443 -servername your-domain.com
  # Check expiration date
  ```

### 6. Database Security

- [ ] **MongoDB authentication enabled**
  ```bash
  # Check MongoDB config
  grep "security:" /etc/mongod.conf
  ```

- [ ] **MongoDB uses TLS/SSL**
  ```bash
  # For Atlas or remote MongoDB
  grep "tls=true" server/.env
  ```

- [ ] **Database user has minimal permissions**
  - Not using admin/root user
  - Only has access to dicomdb database

- [ ] **Database backups configured**
  ```bash
  # Verify backup script exists
  ls -la scripts/backup-*.sh
  ```

- [ ] **Test database backup/restore**
  ```bash
  # Run backup
  ./scripts/backup-database.sh
  
  # Verify backup file created
  ls -la backups/
  ```

### 7. Rate Limiting

- [ ] **Rate limiting enabled on auth endpoints**
  ```bash
  grep "rateLimit" server/src/routes/auth.js
  ```

- [ ] **Test rate limiting works**
  ```bash
  # Make 10 rapid login attempts
  for i in {1..10}; do
    curl -X POST http://localhost:8001/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"test","password":"test"}'
  done
  # Should get rate limit error after 5 attempts
  ```

### 8. Audit Logging

- [ ] **Audit logging enabled**
  ```bash
  grep "ENABLE_AUTH_LOGGING=true" server/.env
  ```

- [ ] **Audit log directory exists**
  ```bash
  ls -la server/logs/
  ```

- [ ] **Audit logs are being written**
  ```bash
  # Make authenticated request
  # Check logs
  tail -f server/logs/audit.log
  ```

- [ ] **Log rotation configured**
  ```bash
  # Check logrotate config
  cat /etc/logrotate.d/dicom-server
  ```

---

## ⚙️ MEDIUM PRIORITY - Important for Operations

### 9. Monitoring & Alerts

- [ ] **Health check endpoint accessible**
  ```bash
  curl http://localhost:8001/health
  ```

- [ ] **Prometheus metrics enabled**
  ```bash
  curl http://localhost:8001/metrics
  ```

- [ ] **Grafana dashboards configured**
  - Login to Grafana
  - Verify DICOM dashboards exist
  - Check data is flowing

- [ ] **Alert rules configured**
  ```bash
  cat server/config/prometheus-rules.yml
  ```

- [ ] **Alert notifications working**
  - Test Slack webhook (if configured)
  - Test PagerDuty integration (if configured)

### 10. Frontend Integration

- [ ] **Frontend updated to use authentication**
  ```typescript
  // Check viewer/src/services/ApiService.ts
  // Should have Authorization header interceptor
  ```

- [ ] **Login page functional**
  - Navigate to /login
  - Test login with admin credentials
  - Verify redirect to dashboard

- [ ] **Token storage implemented**
  ```typescript
  // Check localStorage or sessionStorage
  localStorage.getItem('authToken')
  ```

- [ ] **401 error handling implemented**
  ```typescript
  // Should redirect to login on 401
  ```

- [ ] **Token refresh implemented (if applicable)**

### 11. External Integrations

- [ ] **PACS integration tested with auth**
  ```bash
  # Test PACS upload with token
  curl -H "Authorization: Bearer $TOKEN" \
    -F "dicom=@test.dcm" \
    http://localhost:8001/api/pacs/upload
  ```

- [ ] **Orthanc webhook security configured**
  ```bash
  grep "WEBHOOK_SECRET" server/.env
  ```

- [ ] **Medical AI services accessible**
  ```bash
  curl http://localhost:5001/health  # MedSigLIP
  curl http://localhost:5002/health  # MedGemma
  ```

### 12. Documentation

- [ ] **API documentation updated**
  - All endpoints show authentication requirement
  - Example requests include Authorization header

- [ ] **User guide updated**
  - Login instructions
  - Password reset process
  - Troubleshooting guide

- [ ] **Operations runbook updated**
  - Deployment procedures
  - Rollback procedures
  - Incident response

- [ ] **Security documentation reviewed**
  - Authentication flow documented
  - Security architecture diagram
  - Compliance documentation

---

## 📋 OPTIONAL - Nice to Have

### 13. Advanced Security

- [ ] **Multi-factor authentication (MFA) enabled**
  - For admin users
  - For privileged operations

- [ ] **Session management implemented**
  - Active session tracking
  - Session timeout
  - Concurrent session limits

- [ ] **IP whitelisting configured**
  - For admin access
  - For API access

- [ ] **Security headers configured**
  ```bash
  curl -I http://localhost:8001 | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"
  ```

### 14. Performance

- [ ] **Load testing completed**
  ```bash
  # Using Apache JMeter or similar
  # Test with 100+ concurrent users
  ```

- [ ] **Response times acceptable**
  - Login: < 500ms
  - API calls: < 200ms
  - Frame retrieval: < 1s

- [ ] **Database indexes optimized**
  ```bash
  # Check MongoDB indexes
  mongo dicomdb --eval "db.studies.getIndexes()"
  ```

### 15. Compliance

- [ ] **HIPAA compliance audit completed**
  - Access controls verified
  - Audit logging verified
  - Encryption verified
  - Backup procedures verified

- [ ] **Security penetration testing completed**
  - No critical vulnerabilities
  - Medium/low vulnerabilities documented
  - Remediation plan for findings

- [ ] **Privacy policy updated**
  - Reflects authentication requirements
  - Describes data protection measures

- [ ] **Terms of service updated**
  - User responsibilities
  - Security requirements

---

## 🚀 Deployment Approval

### Sign-off Required

**Technical Lead:**
- [ ] All critical items completed
- [ ] All high priority items completed
- [ ] Testing completed successfully
- [ ] Documentation updated

**Security Team:**
- [ ] Security review completed
- [ ] No critical vulnerabilities
- [ ] Compliance requirements met
- [ ] Audit logging verified

**Operations Team:**
- [ ] Deployment plan reviewed
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] On-call schedule set

**Management:**
- [ ] Business impact assessed
- [ ] Stakeholders notified
- [ ] Go-live approval granted

---

## 📊 Deployment Readiness Score

Calculate your readiness score:

- **Critical (Must Have):** 4 sections × 25 points = 100 points
- **High Priority:** 4 sections × 15 points = 60 points
- **Medium Priority:** 4 sections × 10 points = 40 points
- **Optional:** 2 sections × 5 points = 10 points

**Total Possible:** 210 points

**Minimum Required for Production:** 160 points (76%)

**Your Score:** _____ / 210 points (____%)

### Scoring Guide

- **180+ points (86%+):** ✅ Ready for production
- **160-179 points (76-85%):** ⚠️ Ready with minor risks
- **140-159 points (67-75%):** ⚠️ Not recommended, significant gaps
- **< 140 points (< 67%):** ❌ Not ready for production

---

## 🎯 Final Checks

### Pre-Deployment (1 hour before)

- [ ] All checklist items completed
- [ ] Backup of current system created
- [ ] Rollback plan tested
- [ ] Team briefed on deployment
- [ ] Monitoring dashboards open
- [ ] On-call team notified

### During Deployment (15 minutes)

- [ ] Stop current services
- [ ] Deploy new code
- [ ] Update environment variables
- [ ] Start services
- [ ] Verify health checks pass
- [ ] Test authentication flow
- [ ] Monitor error logs

### Post-Deployment (1 hour after)

- [ ] All services running
- [ ] No critical errors in logs
- [ ] Authentication working
- [ ] Users can login
- [ ] API endpoints responding
- [ ] Monitoring shows normal metrics
- [ ] Stakeholders notified of success

---

## 📞 Emergency Contacts

**If issues occur during deployment:**

1. **Technical Lead:** [Name] - [Phone] - [Email]
2. **Security Team:** [Name] - [Phone] - [Email]
3. **Operations:** [Name] - [Phone] - [Email]
4. **Management:** [Name] - [Phone] - [Email]

**Escalation Path:**
1. Technical Lead (0-15 min)
2. Security Team (15-30 min)
3. Management (30+ min)

---

## 📚 Reference Documents

- [Security Fixes Summary](./SECURITY_FIXES_SUMMARY.md)
- [Authentication Security](./docs/AUTHENTICATION_SECURITY.md)
- [Migration Guide](./docs/SECURITY_MIGRATION_GUIDE.md)
- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)
- [Rollback Procedures](./docs/ROLLBACK.md)

---

**Checklist Completed By:** _________________  
**Date:** _________________  
**Signature:** _________________  

**Deployment Approved:** ☐ YES  ☐ NO  ☐ CONDITIONAL

**Conditions (if applicable):** _________________________________

---

**REMEMBER:** Security is not optional. Do not skip critical items.
