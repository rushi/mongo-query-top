#!/bin/bash

# MongoDB Query Top - Quick Start Script

echo "🚀 Starting MongoDB Query Top with Web UI"
echo ""

# Check if we're in the right directory
if [ ! -f "app.js" ]; then
    echo "❌ Error: app.js not found. Please run this script from the mongo-query-top directory."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found."
    exit 1
fi

PORT_API=${PORT_API:-3000}
PORT_FRONTEND=${PORT_FRONTEND:-3001}
API_BASE_URL="${API_BASE_URL:-http://localhost:${PORT_API}}"

echo "Starting API server on port ${PORT_API}..."
./app.js --api --port="${PORT_API}" "$@" &
API_PID=$!

echo "Starting React frontend on port ${PORT_FRONTEND} in 5s..."
cd frontend || exit 1
sleep 5  # Give some time for the API to start
npm run dev -- -p "${PORT_FRONTEND}" &
FRONTEND_PID=$!

echo ""
echo "🔗 Web Interface: http://localhost:${PORT_FRONTEND}"
echo "🔗 API Endpoint: http://localhost:${PORT_API}/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep the script running
wait
