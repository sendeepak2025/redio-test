@echo off
echo ========================================
echo Starting AI Services
echo ========================================
echo.

echo Starting MedSigLIP on port 5001...
start "MedSigLIP" cmd /k "python medsigclip_server.py"

timeout /t 2 /nobreak >nul

echo Starting MedGemma on port 5002...
start "MedGemma" cmd /k "python medgemma_server.py"

echo.
echo ========================================
echo AI Services Started!
echo ========================================
echo.
echo MedSigLIP: http://localhost:5001
echo MedGemma:  http://localhost:5002
echo.
echo Press any key to check health...
pause >nul

echo.
echo Checking services...
curl http://localhost:5001/health
echo.
curl http://localhost:5002/health
echo.
echo.
echo Done! Keep these windows open.
pause
