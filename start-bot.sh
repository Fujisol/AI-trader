#!/bin/bash
echo "Starting AI Crypto Trading Bot..."
echo "====================================="

echo "Starting backend..."
npm start &
BACKEND_PID=$!

sleep 3

echo "Starting dashboard..."
cd dashboard && npm start &
DASHBOARD_PID=$!

echo ""
echo "Both services are starting..."
echo "Backend: http://localhost:8080"
echo "Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap 'kill $BACKEND_PID $DASHBOARD_PID; exit 0' INT
wait
