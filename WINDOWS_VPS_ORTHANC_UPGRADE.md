# Orthanc Upgrade Guide for Windows VPS/Cloud Server

## Overview
This guide is for upgrading Orthanc on a **Windows VPS** (Virtual Private Server) or Windows Cloud Server that you access remotely.

**Estimated Time**: 15-20 minutes  
**Downtime**: 5-10 minutes  
**Difficulty**: Easy

---

## Prerequisites

- Windows VPS IP address
- RDP (Remote Desktop) credentials
- Administrator access on the VPS
- Internet connection on VPS

---

## Step 1: Connect to Your Windows VPS

### Option A: Using Windows Remote Desktop

1. **On your local computer**, press `Win + R`
2. Type: `mstsc` and press Enter
3. Enter your VPS IP address (e.g., `203.0.113.45`)
4. Click **Connect**
5. Enter your username and password
6. Click **OK**

### Option B: Using Remote Desktop Connection App

1. Open **Remote Desktop Connection** from Start Menu
2. Enter **Computer**: `your-vps-ip-address`
3. Enter **Username**: `Administrator` (or your username)
4. Click **Connect**
5. Enter password when prompted

### Option C: From Mac/Linux

```bash
# Install Microsoft Remote Desktop from App Store (Mac)
# Or use rdesktop (Linux)
rdesktop -u Administrator your-vps-ip-address
```

---

## Step 2: Locate Your Current Orthanc Installation

Once connected to your VPS:

1. **Open File Explorer** (Win + E)
2. Check these common locations:
   - `C:\Orthanc`
   - `C:\Program Files\Orthanc`
   - `C:\Program Files (x86)\Orthanc`
   - `D:\Orthanc` (if using separate drive)

3. **Find these important folders/files**:
   ```
   Orthanc/
   ├── Orthanc.exe              ← Main executable
   ├── Configuration.json       ← Your settings (BACKUP THIS!)
   ├── OrthancStorage/          ← DICOM files (BACKUP THIS!)
   ├── OrthancDatabase/         ← Database (BACKUP THIS!)
   └── Plugins/                 ← Plugin DLL files
       ├── OrthancDicomWeb.dll
       └── OrthancWebViewer.dll
   ```

4. **Note the full path** (e.g., `C:\Orthanc`)

---

## Step 3: Check Current Orthanc Version

1. **Open Command Prompt** (Win + R, type `cmd`)
2. Navigate to Orthanc folder:
   ```cmd
   cd C:\Orthanc
   ```
3. Check version:
   ```cmd
   Orthanc.exe --version
   ```
4. **Or** open browser on VPS:
   - Go to: `http://69.62.70.102:8042`
   - Login (if required)
   - Check version in the interface

---

## Step 4: Stop Orthanc Service/Application

### If Orthanc is Running as Windows Service:

1. **Open Services**:
   - Press `Win + R`
   - Type: `services.msc`
   - Press Enter

2. **Find Orthanc Service**:
   - Scroll down to find "Orthanc" or "Orthanc Server"
   - Right-click on it
   - Select **Stop**
   - Wait until Status shows "Stopped"

### If Orthanc is Running as Application:

1. **Check System Tray** (bottom-right corner):
   - Look for Orthanc icon
   - Right-click → Exit

2. **Or use Task Manager**:
   - Press `Ctrl + Shift + Esc`
   - Find "Orthanc.exe" in Processes
   - Right-click → End Task

3. **Verify it's stopped**:
   - Open browser: `http://69.62.70.102:8042`
   - Should show "Can't reach this page"

---

## Step 5: Backup Your Data (CRITICAL!)

### Quick Backup Method:

1. **Open File Explorer**
2. Navigate to your Orthanc folder (e.g., `C:\Orthanc`)
3. **Right-click** on the Orthanc folder
4. Select **Copy**
5. Navigate to a backup location (e.g., `C:\Backups` or `D:\Backups`)
6. **Right-click** → **Paste**
7. Rename to: `Orthanc-Backup-2025-10-21` (use today's date)

### Detailed Backup (Recommended):

```cmd
# Open Command Prompt as Administrator
# Create backup directory
mkdir C:\Orthanc-Backups
mkdir C:\Orthanc-Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%

# Copy configuration
copy C:\Orthanc\Configuration.json C:\Orthanc-Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%\

# Copy database
xcopy C:\Orthanc\OrthancDatabase C:\Orthanc-Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%\OrthancDatabase\ /E /I /H

# Copy storage (DICOM files)
xcopy C:\Orthanc\OrthancStorage C:\Orthanc-Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%\OrthancStorage\ /E /I /H

echo Backup completed!
```

### What to Backup:
- ✅ `Configuration.json` - Your settings
- ✅ `OrthancStorage/` - All DICOM files
- ✅ `OrthancDatabase/` - Database files
- ✅ `Plugins/` - Plugin DLL files (optional)

---

## Step 6: Download New Orthanc Version

### On Your Windows VPS:

1. **Open Browser** (Chrome, Edge, Firefox)

2. **Download Orthanc**:
   - Go to: https://orthanc.uclouvain.be/downloads/windows-64/index.html
   - Click on latest version (e.g., `Orthanc-1.12.3-Win64.zip`)
   - Save to `C:\Downloads` or Desktop

3. **Download Plugins** (if you use them):
   
   **DICOMweb Plugin**:
   - Go to: https://orthanc.uclouvain.be/downloads/windows-64/orthanc-dicomweb/index.html
   - Download latest: `OrthancDicomWeb-1.17-Win64.zip`
   
   **Web Viewer Plugin**:
   - Go to: https://orthanc.uclouvain.be/downloads/windows-64/orthanc-webviewer/index.html
   - Download latest: `OrthancWebViewer-2.8-Win64.zip`

4. **Alternative - Direct Download Links**:
   ```
   Main: https://orthanc.uclouvain.be/downloads/windows-64/orthanc/Orthanc-1.12.3-Win64.zip
   DICOMweb: https://orthanc.uclouvain.be/downloads/windows-64/orthanc-dicomweb/OrthancDicomWeb-1.17-Win64.zip
   WebViewer: https://orthanc.uclouvain.be/downloads/windows-64/orthanc-webviewer/OrthancWebViewer-2.8-Win64.zip
   ```

---

## Step 7: Extract Downloaded Files

1. **Navigate to Downloads folder**
2. **Right-click** on `Orthanc-1.12.3-Win64.zip`
3. Select **Extract All...**
4. Choose extraction location (e.g., `C:\Temp\Orthanc-New`)
5. Click **Extract**

6. **Repeat for plugins**:
   - Extract `OrthancDicomWeb-1.17-Win64.zip`
   - Extract `OrthancWebViewer-2.8-Win64.zip`

---

## Step 8: Replace Old Files with New Ones

### Replace Main Executable:

1. **Navigate to extracted folder**: `C:\Temp\Orthanc-New`
2. **Copy** `Orthanc.exe`
3. **Navigate to** your installation: `C:\Orthanc`
4. **Paste and Replace** the old `Orthanc.exe`
   - If prompted, click **Replace**

### Replace Plugins:

1. **Navigate to** extracted plugin folders
2. **Copy** the `.dll` files:
   - `OrthancDicomWeb.dll`
   - `OrthancWebViewer.dll`
3. **Navigate to** `C:\Orthanc\Plugins`
4. **Paste and Replace** old plugin files

### Important Files to KEEP (Don't Replace):
- ❌ **DON'T replace** `Configuration.json`
- ❌ **DON'T replace** `OrthancStorage/` folder
- ❌ **DON'T replace** `OrthancDatabase/` folder

---

## Step 9: Update Configuration (Optional)

1. **Open** `Configuration.json` with Notepad:
   - Right-click → Open with → Notepad

2. **Check these settings**:
   ```json
   {
     "Name": "MyOrthanc",
     "HttpPort": 8042,
     "RemoteAccessAllowed": true,
     "AuthenticationEnabled": true,
     "RegisteredUsers": {
       "admin": "password"
     },
     "Plugins": [
       "C:\\Orthanc\\Plugins"
     ]
   }
   ```

3. **Save** if you made changes (Ctrl + S)

---

## Step 10: Start Orthanc

### If Running as Windows Service:

1. **Open Services** (`Win + R` → `services.msc`)
2. Find **Orthanc** service
3. Right-click → **Start**
4. Check Status shows "Running"

### If Running as Application:

1. **Navigate to** `C:\Orthanc`
2. **Double-click** `Orthanc.exe`
3. A console window should open
4. Wait for message: "Orthanc has started"

### Or Start from Command Prompt:

```cmd
cd C:\Orthanc
Orthanc.exe Configuration.json
```

---

## Step 11: Verify Upgrade

### Test 1: Check Version

1. **Open browser** on VPS
2. Go to: `http://69.62.70.102:8042`
3. Login with your credentials
4. Check version number in interface

### Test 2: Check API

1. **Open Command Prompt**
2. Run:
   ```cmd
   curl http://69.62.70.102:8042/system
   ```
3. Should show system info with new version

### Test 3: Check Plugins

1. In browser, go to: `http://69.62.70.102:8042/app/explorer.html`
2. Check if DICOMweb and Web Viewer are available
3. Or check: `http://69.62.70.102:8042/plugins`

### Test 4: Upload Test DICOM

1. Try uploading a DICOM file
2. Verify it appears in the interface
3. Try viewing it

---

## Step 12: Configure Windows Firewall (If Needed)

If you can't access Orthanc from outside the VPS:

1. **Open Windows Firewall**:
   - Control Panel → System and Security → Windows Defender Firewall
   - Click "Advanced settings"

2. **Add Inbound Rule**:
   - Click "Inbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP" → Specific local ports: `8042`
   - Select "Allow the connection"
   - Check all profiles (Domain, Private, Public)
   - Name: "Orthanc PACS Server"
   - Click Finish

3. **Test external access**:
   - From your local computer, open browser
   - Go to: `http://your-vps-ip:8042`

---

## Step 13: Configure as Windows Service (Optional)

To run Orthanc automatically on VPS startup:

### Using NSSM (Non-Sucking Service Manager):

1. **Download NSSM**:
   - Go to: https://nssm.cc/download
   - Download `nssm-2.24.zip`
   - Extract to `C:\nssm`

2. **Install Orthanc as Service**:
   ```cmd
   # Open Command Prompt as Administrator
   cd C:\nssm\win64
   
   # Install service
   nssm install Orthanc "C:\Orthanc\Orthanc.exe" "C:\Orthanc\Configuration.json"
   
   # Set service to start automatically
   nssm set Orthanc Start SERVICE_AUTO_START
   
   # Start the service
   nssm start Orthanc
   ```

3. **Verify Service**:
   - Open Services (`services.msc`)
   - Find "Orthanc"
   - Should show "Running" and "Automatic" startup type

---

## Troubleshooting

### Issue 1: "Orthanc.exe is not a valid Win32 application"

**Solution**: You downloaded 32-bit version on 64-bit Windows
- Download the correct version: `Orthanc-Win64.zip`

### Issue 2: "Port 8042 is already in use"

**Solution**: Another Orthanc instance is still running
```cmd
# Check what's using port 8042
netstat -ano | findstr :8042

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue 3: "Configuration file not found"

**Solution**: 
- Make sure `Configuration.json` is in the same folder as `Orthanc.exe`
- Or specify full path:
  ```cmd
  Orthanc.exe "C:\Orthanc\Configuration.json"
  ```

### Issue 4: "Cannot connect to database"

**Solution**: Database might be corrupted
```cmd
# Stop Orthanc
# Restore database from backup
xcopy C:\Orthanc-Backups\backup-20251021\OrthancDatabase C:\Orthanc\OrthancDatabase\ /E /I /H /Y
# Start Orthanc
```

### Issue 5: Plugins not loading

**Solution**: Check plugin path in Configuration.json
```json
{
  "Plugins": [
    "C:\\Orthanc\\Plugins"
  ]
}
```
Note: Use double backslashes `\\` in JSON

### Issue 6: Can't access from outside VPS

**Solutions**:
1. Check Windows Firewall (see Step 12)
2. Check VPS provider's firewall/security groups
3. Ensure `RemoteAccessAllowed: true` in config
4. Check if VPS has public IP address

---

## Rollback Procedure

If upgrade fails:

1. **Stop Orthanc**
2. **Delete new files**:
   ```cmd
   del C:\Orthanc\Orthanc.exe
   del C:\Orthanc\Plugins\*.dll
   ```
3. **Restore from backup**:
   ```cmd
   xcopy C:\Orthanc-Backups\backup-20251021\* C:\Orthanc\ /E /I /H /Y
   ```
4. **Start Orthanc**

---

## Automated Upgrade Script

Save this as `upgrade-orthanc.bat` on your VPS:

```batch
@echo off
echo ========================================
echo Orthanc Upgrade Script for Windows VPS
echo ========================================
echo.

:: Set variables
set ORTHANC_DIR=C:\Orthanc
set BACKUP_DIR=C:\Orthanc-Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
set DOWNLOAD_DIR=%TEMP%\orthanc-upgrade

:: Create backup
echo Creating backup...
mkdir "%BACKUP_DIR%"
xcopy "%ORTHANC_DIR%\Configuration.json" "%BACKUP_DIR%\" /Y
xcopy "%ORTHANC_DIR%\OrthancDatabase" "%BACKUP_DIR%\OrthancDatabase\" /E /I /H
xcopy "%ORTHANC_DIR%\OrthancStorage" "%BACKUP_DIR%\OrthancStorage\" /E /I /H
echo Backup completed: %BACKUP_DIR%
echo.

:: Stop Orthanc
echo Stopping Orthanc...
taskkill /IM Orthanc.exe /F 2>nul
timeout /t 3 /nobreak >nul
echo.

:: Download new version (requires curl or manual download)
echo Please download new Orthanc version manually and extract to:
echo %DOWNLOAD_DIR%
echo.
echo Press any key when ready...
pause >nul

:: Copy new files
echo Copying new files...
copy "%DOWNLOAD_DIR%\Orthanc.exe" "%ORTHANC_DIR%\" /Y
copy "%DOWNLOAD_DIR%\Plugins\*.dll" "%ORTHANC_DIR%\Plugins\" /Y
echo.

:: Start Orthanc
echo Starting Orthanc...
cd /d "%ORTHANC_DIR%"
start "" Orthanc.exe Configuration.json
timeout /t 5 /nobreak >nul
echo.

:: Verify
echo Verifying upgrade...
curl http://69.62.70.102:8042/system
echo.

echo ========================================
echo Upgrade completed!
echo Backup location: %BACKUP_DIR%
echo ========================================
pause
```

---

## Post-Upgrade Checklist

- [ ] Orthanc starts without errors
- [ ] Can access web interface at `http://69.62.70.102:8042`
- [ ] Can login with credentials
- [ ] Plugins are loaded (check `/plugins` endpoint)
- [ ] Can upload DICOM files
- [ ] Can view existing studies
- [ ] External access works (from your application)
- [ ] Windows Firewall allows connections
- [ ] Service starts automatically (if configured)

---

## Connecting Your Application

After upgrade, update your application's `.env`:

```env
ORTHANC_URL=http://your-vps-ip:8042
ORTHANC_USERNAME=admin
ORTHANC_PASSWORD=your-password
```

Test connection:
```bash
# From your local machine
curl http://your-vps-ip:8042/system
```

---

## Best Practices for Windows VPS

1. **Schedule Regular Backups**:
   - Use Windows Task Scheduler
   - Backup to separate drive or cloud storage

2. **Keep VPS Updated**:
   - Install Windows Updates regularly
   - Update Orthanc every 3-6 months

3. **Monitor Resources**:
   - Check CPU/RAM usage in Task Manager
   - Orthanc can use significant memory with large datasets

4. **Security**:
   - Use strong passwords
   - Enable HTTPS (use reverse proxy like IIS)
   - Restrict RDP access to specific IPs
   - Keep Windows Firewall enabled

5. **Disaster Recovery**:
   - Keep backups for at least 30 days
   - Test restore procedure periodically
   - Document your configuration

---

## Support Resources

- **Orthanc Book**: https://orthanc.uclouvain.be/book/
- **Windows Downloads**: https://orthanc.uclouvain.be/downloads/windows-64/
- **Forum**: https://discourse.orthanc-server.org/
- **GitHub Issues**: https://github.com/jodogne/Orthanc/issues

---

**Last Updated**: October 21, 2025  
**Tested On**: Windows Server 2019, Windows Server 2022, Windows 10/11 VPS
