@echo off
echo Starting AI Crypto Trading Bot...
echo =====================================

echo Starting backend...
start "AI Trading Bot Backend" cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo Starting dashboard...
start "AI Trading Bot Dashboard" cmd /k "cd dashboard && npm start"

echo.
echo Both services are starting...
echo Backend: http://localhost:8080
echo Dashboard: http://localhost:3000
echo.
echo Check the command windows for any errors.
pause
