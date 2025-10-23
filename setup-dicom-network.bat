@echo off
echo ========================================
echo DICOM Network Setup for Windows
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [1/4] Configuring Windows Firewall...
echo.

REM Allow Orthanc DICOM port (4242)
netsh advfirewall firewall delete rule name="Orthanc DICOM Port" >nul 2>&1
netsh advfirewall firewall add rule name="Orthanc DICOM Port" dir=in action=allow protocol=TCP localport=4242
if %errorLevel% equ 0 (
    echo ✓ DICOM Port 4242 allowed
) else (
    echo ✗ Failed to configure DICOM port
)

REM Allow Orthanc HTTP port (8042)
netsh advfirewall firewall delete rule name="Orthanc HTTP Port" >nul 2>&1
netsh advfirewall firewall add rule name="Orthanc HTTP Port" dir=in action=allow protocol=TCP localport=8042
if %errorLevel% equ 0 (
    echo ✓ HTTP Port 8042 allowed
) else (
    echo ✗ Failed to configure HTTP port
)

REM Allow Node.js backend port (8001)
netsh advfirewall firewall delete rule name="Node Backend Port" >nul 2>&1
netsh advfirewall firewall add rule name="Node Backend Port" dir=in action=allow protocol=TCP localport=8001
if %errorLevel% equ 0 (
    echo ✓ Backend Port 8001 allowed
) else (
    echo ✗ Failed to configure backend port
)

REM Allow React viewer port (5173)
netsh advfirewall firewall delete rule name="React Viewer Port" >nul 2>&1
netsh advfirewall firewall add rule name="React Viewer Port" dir=in action=allow protocol=TCP localport=5173
if %errorLevel% equ 0 (
    echo ✓ Viewer Port 5173 allowed
) else (
    echo ✗ Failed to configure viewer port
)

echo.
echo [2/4] Getting network information...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Your Server IP: !IP!
)

echo.
echo [3/4] Testing ports...
echo.

REM Test if ports are listening
netstat -an | findstr :4242 >nul
if %errorLevel% equ 0 (
    echo ✓ Port 4242 is listening
) else (
    echo ⚠ Port 4242 is not listening - Orthanc may not be running
)

netstat -an | findstr :8042 >nul
if %errorLevel% equ 0 (
    echo ✓ Port 8042 is listening
) else (
    echo ⚠ Port 8042 is not listening - Orthanc may not be running
)

netstat -an | findstr :8001 >nul
if %errorLevel% equ 0 (
    echo ✓ Port 8001 is listening
) else (
    echo ⚠ Port 8001 is not listening - Backend may not be running
)

echo.
echo [4/4] Configuration Summary
echo.
echo ========================================
echo   DICOM CONNECTION DETAILS
echo ========================================
echo AE Title:    ORTHANC_DEV_AE
echo DICOM Port:  4242
echo HTTP Port:   8042
echo Backend:     8001
echo Viewer:      5173
echo ========================================
echo.
echo Configure your modality/workstation with:
echo   Destination AE: ORTHANC_DEV_AE
echo   IP Address: [Your Server IP from above]
echo   Port: 4242
echo.
echo Test connection with:
echo   echoscu -aec ORTHANC_DEV_AE [YOUR_IP] 4242
echo.
echo Web Interface:
echo   http://[YOUR_IP]:8042
echo   Username: orthanc
echo   Password: orthanc_secure_2024
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
pause
