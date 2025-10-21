# Orthanc Upgrade Guide for VPS (Linux)

## Quick Reference

**Current Setup**: Orthanc PACS Server on Linux VPS
**Goal**: Upgrade Orthanc to latest version with plugins
**Downtime**: ~5-10 minutes

---

## Pre-Upgrade Checklist

### 1. Check Current Version
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Check Orthanc version
curl http://localhost:8042/system

# Or if authentication is enabled
curl -u username:password http://localhost:8042/system
```

### 2. Backup Everything
```bash
# Create backup directory
mkdir -p ~/orthanc-backup-$(date +%Y%m%d)
cd ~/orthanc-backup-$(date +%Y%m%d)

# Backup Orthanc configuration
sudo cp /etc/orthanc/orthanc.json ./orthanc.json.backup

# Backup database (if using SQLite)
sudo cp -r /var/lib/orthanc/db ./db-backup

# Backup DICOM storage
sudo cp -r /var/lib/orthanc/storage ./storage-backup

# Or create a compressed backup
sudo tar -czf orthanc-full-backup.tar.gz \
  /etc/orthanc/orthanc.json \
  /var/lib/orthanc/db \
  /var/lib/orthanc/storage

echo "Backup completed at: $(pwd)"
```

### 3. Note Current Settings
```bash
# Save current Orthanc port and credentials
grep -E "HttpPort|RemoteAccessAllowed|RegisteredUsers" /etc/orthanc/orthanc.json

# Check if Orthanc is running
sudo systemctl status orthanc
```

---

## Upgrade Methods

### Method 1: Using Package Manager (Recommended)

#### For Ubuntu/Debian

```bash
# Stop Orthanc service
sudo systemctl stop orthanc

# Update package list
sudo apt update

# Upgrade Orthanc
sudo apt upgrade orthanc orthanc-dicomweb orthanc-webviewer orthanc-postgresql

# Or install specific version
# sudo apt install orthanc=1.12.1+dfsg-1

# Verify installation
orthanc --version

# Start Orthanc
sudo systemctl start orthanc
sudo systemctl status orthanc
```

#### For CentOS/RHEL

```bash
# Stop Orthanc
sudo systemctl stop orthanc

# Update Orthanc
sudo yum update orthanc

# Or using dnf
sudo dnf update orthanc

# Start Orthanc
sudo systemctl start orthanc
```

---

### Method 2: Manual Installation (Latest Version)

#### Step 1: Download Latest Orthanc

```bash
# Create temporary directory
mkdir -p ~/orthanc-upgrade
cd ~/orthanc-upgrade

# Download latest Orthanc (check https://orthanc.uclouvain.be/downloads/linux-standard-base/index.html)
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc/1.12.3/Orthanc --output-document=Orthanc
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc/1.12.3/OrthancRecoverCompressedFile --output-document=OrthancRecoverCompressedFile

# Make executable
chmod +x Orthanc OrthancRecoverCompressedFile
```

#### Step 2: Download Plugins

```bash
# DICOMweb plugin
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc-dicomweb/1.17/libOrthancDicomWeb.so

# Web Viewer plugin
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc-webviewer/2.8/libOrthancWebViewer.so

# PostgreSQL plugin (if using PostgreSQL)
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc-postgresql/5.1/libOrthancPostgreSQLIndex.so
wget https://orthanc.uclouvain.be/downloads/linux-standard-base/orthanc-postgresql/5.1/libOrthancPostgreSQLStorage.so

# Make plugins executable
chmod +x *.so
```

#### Step 3: Stop Current Orthanc

```bash
# Stop the service
sudo systemctl stop orthanc

# Verify it's stopped
sudo systemctl status orthanc
```

#### Step 4: Replace Binaries

```bash
# Backup old binaries
sudo cp /usr/sbin/Orthanc /usr/sbin/Orthanc.old
sudo cp /usr/share/orthanc/plugins/*.so /usr/share/orthanc/plugins/backup/

# Install new Orthanc binary
sudo cp Orthanc /usr/sbin/Orthanc
sudo chown root:root /usr/sbin/Orthanc

# Install new plugins
sudo cp *.so /usr/share/orthanc/plugins/
sudo chown root:root /usr/share/orthanc/plugins/*.so
```

#### Step 5: Update Configuration (if needed)

```bash
# Edit configuration
sudo nano /etc/orthanc/orthanc.json

# Verify plugins are loaded
# Look for "Plugins" section:
{
  "Plugins" : [
    "/usr/share/orthanc/plugins"
  ]
}
```

#### Step 6: Start Orthanc

```bash
# Start service
sudo systemctl start orthanc

# Check status
sudo systemctl status orthanc

# Check logs
sudo journalctl -u orthanc -f
```

---

### Method 3: Docker Upgrade (If Using Docker)

```bash
# Stop current container
docker stop orthanc
docker rm orthanc

# Pull latest image
docker pull jodogne/orthanc-plugins:latest

# Run new container with same configuration
docker run -d \
  --name orthanc \
  -p 8042:8042 \
  -p 4242:4242 \
  -v /var/lib/orthanc/db:/var/lib/orthanc/db \
  -v /var/lib/orthanc/storage:/var/lib/orthanc/storage \
  -v /etc/orthanc/orthanc.json:/etc/orthanc/orthanc.json \
  --restart unless-stopped \
  jodogne/orthanc-plugins:latest

# Check logs
docker logs -f orthanc
```

---

## Post-Upgrade Verification

### 1. Check Orthanc is Running

```bash
# Check service status
sudo systemctl status orthanc

# Check if port is listening
sudo netstat -tulpn | grep 8042

# Or using ss
sudo ss -tulpn | grep 8042
```

### 2. Verify API Access

```bash
# Test system endpoint
curl http://localhost:8042/system

# With authentication
curl -u username:password http://localhost:8042/system

# Check version
curl http://localhost:8042/system | grep Version
```

### 3. Verify Plugins Loaded

```bash
# Check plugins endpoint
curl http://localhost:8042/plugins

# Should return list of loaded plugins:
# - "dicom-web"
# - "web-viewer"
# - etc.
```

### 4. Test DICOM Upload

```bash
# Test with a sample DICOM file
curl -X POST http://localhost:8042/instances \
  -H "Content-Type: application/dicom" \
  --data-binary @sample.dcm

# Or with authentication
curl -X POST http://localhost:8042/instances \
  -u username:password \
  -H "Content-Type: application/dicom" \
  --data-binary @sample.dcm
```

### 5. Check Your Application

```bash
# Test from your Node.js server
# Update .env if needed
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=your-username
ORTHANC_PASSWORD=your-password

# Restart your application
cd /path/to/your/app/server
pm2 restart dicom-server

# Check logs
pm2 logs dicom-server
```

---

## Troubleshooting

### Issue 1: Orthanc Won't Start

```bash
# Check logs
sudo journalctl -u orthanc -n 50

# Check configuration syntax
sudo orthanc /etc/orthanc/orthanc.json --check

# Check file permissions
ls -la /var/lib/orthanc/
sudo chown -R orthanc:orthanc /var/lib/orthanc/
```

### Issue 2: Plugins Not Loading

```bash
# Check plugin directory exists
ls -la /usr/share/orthanc/plugins/

# Verify plugin files
file /usr/share/orthanc/plugins/*.so

# Check configuration
grep -A 5 "Plugins" /etc/orthanc/orthanc.json

# Check logs for plugin errors
sudo journalctl -u orthanc | grep -i plugin
```

### Issue 3: Database Migration Issues

```bash
# If database format changed, Orthanc will auto-migrate
# Check logs during startup
sudo journalctl -u orthanc -f

# If migration fails, restore backup
sudo systemctl stop orthanc
sudo rm -rf /var/lib/orthanc/db
sudo cp -r ~/orthanc-backup-*/db-backup /var/lib/orthanc/db
sudo chown -R orthanc:orthanc /var/lib/orthanc/db
sudo systemctl start orthanc
```

### Issue 4: Port Already in Use

```bash
# Check what's using port 8042
sudo lsof -i :8042

# Kill the process if needed
sudo kill -9 <PID>

# Or change Orthanc port in config
sudo nano /etc/orthanc/orthanc.json
# Change "HttpPort" : 8042 to another port
```

### Issue 5: Connection Refused from Application

```bash
# Check firewall
sudo ufw status
sudo ufw allow 8042/tcp

# Or for iptables
sudo iptables -A INPUT -p tcp --dport 8042 -j ACCEPT
sudo iptables-save

# Check if RemoteAccessAllowed is true
grep "RemoteAccessAllowed" /etc/orthanc/orthanc.json
# Should be: "RemoteAccessAllowed" : true
```

---

## Rollback Procedure

If upgrade fails, rollback to previous version:

```bash
# Stop Orthanc
sudo systemctl stop orthanc

# Restore old binary
sudo cp /usr/sbin/Orthanc.old /usr/sbin/Orthanc

# Restore old plugins
sudo cp /usr/share/orthanc/plugins/backup/*.so /usr/share/orthanc/plugins/

# Restore configuration
sudo cp ~/orthanc-backup-*/orthanc.json.backup /etc/orthanc/orthanc.json

# Restore database (if needed)
sudo rm -rf /var/lib/orthanc/db
sudo cp -r ~/orthanc-backup-*/db-backup /var/lib/orthanc/db
sudo chown -R orthanc:orthanc /var/lib/orthanc/

# Start Orthanc
sudo systemctl start orthanc
sudo systemctl status orthanc
```

---

## Automated Upgrade Script

Save this as `upgrade-orthanc-vps.sh`:

```bash
#!/bin/bash

# Orthanc VPS Upgrade Script
# Usage: sudo ./upgrade-orthanc-vps.sh

set -e

echo "=== Orthanc Upgrade Script ==="
echo "Starting upgrade process..."

# Variables
BACKUP_DIR=~/orthanc-backup-$(date +%Y%m%d-%H%M%S)
ORTHANC_VERSION="1.12.3"

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
sudo cp /etc/orthanc/orthanc.json $BACKUP_DIR/
sudo cp -r /var/lib/orthanc/db $BACKUP_DIR/ 2>/dev/null || true
echo "Backup created at: $BACKUP_DIR"

# Stop Orthanc
echo "Stopping Orthanc..."
sudo systemctl stop orthanc

# Upgrade using package manager
echo "Upgrading Orthanc..."
if command -v apt &> /dev/null; then
    sudo apt update
    sudo apt upgrade -y orthanc orthanc-dicomweb orthanc-webviewer
elif command -v yum &> /dev/null; then
    sudo yum update -y orthanc
elif command -v dnf &> /dev/null; then
    sudo dnf update -y orthanc
else
    echo "Package manager not found. Please upgrade manually."
    exit 1
fi

# Start Orthanc
echo "Starting Orthanc..."
sudo systemctl start orthanc

# Wait for startup
sleep 5

# Verify
echo "Verifying upgrade..."
if sudo systemctl is-active --quiet orthanc; then
    echo "✅ Orthanc is running"
    curl -s http://localhost:8042/system | grep -o '"Version"[^,]*'
    echo "✅ Upgrade completed successfully!"
else
    echo "❌ Orthanc failed to start"
    echo "Restoring backup..."
    sudo systemctl stop orthanc
    sudo cp $BACKUP_DIR/orthanc.json /etc/orthanc/
    sudo systemctl start orthanc
    exit 1
fi

echo "Backup location: $BACKUP_DIR"
echo "Keep this backup for at least 7 days"
```

Make it executable and run:
```bash
chmod +x upgrade-orthanc-vps.sh
sudo ./upgrade-orthanc-vps.sh
```

---

## Best Practices

1. **Always backup before upgrading**
2. **Test in staging environment first** (if available)
3. **Schedule upgrades during low-traffic periods**
4. **Keep backups for at least 30 days**
5. **Document your specific configuration**
6. **Monitor logs after upgrade for 24 hours**
7. **Update your application's Orthanc client if API changes**

---

## Version-Specific Notes

### Upgrading from 1.9.x to 1.12.x
- Database format may change (auto-migrated)
- Some API endpoints deprecated
- New security features enabled by default

### Upgrading from 1.11.x to 1.12.x
- Minor changes, mostly compatible
- Check release notes: https://orthanc.uclouvain.be/hg/orthanc/file/Orthanc-1.12.3/NEWS

---

## Support Resources

- **Official Documentation**: https://orthanc.uclouvain.be/book/
- **Downloads**: https://orthanc.uclouvain.be/downloads/
- **Forum**: https://discourse.orthanc-server.org/
- **GitHub**: https://github.com/jodogne/Orthanc

---

**Last Updated**: October 21, 2025
**Tested On**: Ubuntu 20.04/22.04, CentOS 8, Debian 11
