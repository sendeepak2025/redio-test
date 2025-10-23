@echo off
echo Restarting AI Services...

REM Kill existing Python processes for AI services
taskkill /F /FI "WINDOWTITLE eq MedSigLIP*" 2>nul
taskkill /F /FI "WINDOWTITLE eq MedGemma*" 2>nul

timeout /t 2 /nobreak >nul

REM Start MedSigLIP (port 5001)
start "MedSigLIP Server" python medsigclip_server.py

timeout /t 2 /nobreak >nul

REM Start MedGemma (port 5002)
start "MedGemma Server" python medgemma_server.py

echo.
echo ✅ AI Services restarted!
echo    - MedSigLIP: http://localhost:5001
echo    - MedGemma: http://localhost:5002
echo.
pause
