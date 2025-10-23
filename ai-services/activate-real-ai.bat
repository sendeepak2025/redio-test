@echo off
echo ========================================
echo Activating REAL AI Mode
echo ========================================
echo.

echo This will switch from DEMO mode to REAL AI mode
echo using Hugging Face's free inference API.
echo.
echo Requirements:
echo - Internet connection
echo - Python requests library
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo [1/3] Installing required packages...
pip install requests pillow numpy scikit-image

echo.
echo [2/3] Setting environment variables...
set AI_MODE=real
echo AI_MODE=real

echo.
echo [3/3] Restarting AI services...

echo.
echo Stopping old services...
taskkill /F /FI "WINDOWTITLE eq *MedSigLIP*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *MedGemma*" 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting REAL AI services...
start "MedSigLIP Real AI" cmd /k "set AI_MODE=real && python medsigclip_server.py"

timeout /t 2 /nobreak >nul

start "MedGemma Real AI" cmd /k "set AI_MODE=real && python medgemma_server.py"

echo.
echo ========================================
echo ✅ REAL AI MODE ACTIVATED!
echo ========================================
echo.
echo Services running:
echo - MedSigLIP (Classification): http://localhost:5001
echo - MedGemma (Reports): http://localhost:5002
echo.
echo Mode: REAL AI (using Hugging Face API)
echo.
echo Note: First request may take 20-30 seconds
echo as the model loads on Hugging Face servers.
echo.
echo To verify: curl http://localhost:5001/health
echo.
pause
