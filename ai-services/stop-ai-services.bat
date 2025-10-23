@echo off
echo Stopping AI Services...

REM Kill Python processes running on ports 5001 and 5002
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do (
    echo Stopping MedSigLIP (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5002" ^| find "LISTENING"') do (
    echo Stopping MedGemma (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

echo.
echo AI Services stopped.
pause
