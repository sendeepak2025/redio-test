@echo off
echo ========================================
echo Testing AI Services
echo ========================================
echo.

echo Testing MedSigLIP Health...
curl -X GET http://localhost:5001/health
echo.
echo.

echo Testing MedGemma Health...
curl -X GET http://localhost:5002/health
echo.
echo.

echo ========================================
echo Test Complete!
echo ========================================
pause
