@echo off
setlocal enabledelayedexpansion

echo ========================================
echo DICOM Connection Test
echo ========================================
echo.

REM Get server IP
set /p SERVER_IP="Enter your server IP address (or press Enter for localhost): "
if "%SERVER_IP%"=="" set SERVER_IP=localhost

echo.
echo Testing connection to: %SERVER_IP%
echo.

echo [1/5] Testing network connectivity...
ping -n 1 %SERVER_IP% >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Server is reachable
) else (
    echo ✗ Cannot reach server - check IP address and network
    goto :end
)

echo.
echo [2/5] Testing DICOM port (4242)...
powershell -Command "Test-NetConnection -ComputerName %SERVER_IP% -Port 4242 -InformationLevel Quiet" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ DICOM port 4242 is open
) else (
    echo ✗ DICOM port 4242 is not accessible
    echo   - Check if Orthanc is running
    echo   - Check firewall settings
)

echo.
echo [3/5] Testing HTTP port (8042)...
powershell -Command "Test-NetConnection -ComputerName %SERVER_IP% -Port 8042 -InformationLevel Quiet" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ HTTP port 8042 is open
) else (
    echo ✗ HTTP port 8042 is not accessible
)

echo.
echo [4/5] Testing Orthanc web interface...
curl -s -u orthanc:orthanc_secure_2024 http://%SERVER_IP%:8042/system >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Orthanc web interface is accessible
    echo.
    echo Orthanc System Info:
    curl -s -u orthanc:orthanc_secure_2024 http://%SERVER_IP%:8042/system
) else (
    echo ✗ Cannot access Orthanc web interface
    echo   - Check if Orthanc is running
    echo   - Check credentials
)

echo.
echo [5/5] DICOM Echo Test (C-ECHO)...
echo.
echo To test DICOM C-ECHO, you need DCMTK tools installed.
echo Download from: https://dicom.offis.de/dcmtk
echo.
echo Command to test:
echo   echoscu -aec ORTHANC_DEV_AE %SERVER_IP% 4242
echo.
echo To send a test DICOM file:
echo   storescu -aec ORTHANC_DEV_AE %SERVER_IP% 4242 yourfile.dcm
echo.

:end
echo ========================================
echo Test Complete
echo ========================================
echo.
echo Connection Details:
echo   AE Title: ORTHANC_DEV_AE
echo   IP: %SERVER_IP%
echo   DICOM Port: 4242
echo   HTTP Port: 8042
echo.
echo Web Interface:
echo   http://%SERVER_IP%:8042
echo   Username: orthanc
echo   Password: orthanc_secure_2024
echo.
pause
