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

echo "📦 Installing frontend dependencies..."
cd frontend || exit 1
npm install --silent

# echo "🔧 Building frontend..."
# npm run build --silent

echo "🌐 Starting API server on port 3000..."
cd ..
./app.js --api &
API_PID=$!

echo "🎨 Starting React frontend on port 3001..."
cd frontend || exit 1
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🔗 Web Interface: http://localhost:3001"
echo "🔗 API Endpoint: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep the script running
wait
