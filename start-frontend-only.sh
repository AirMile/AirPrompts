#!/bin/bash

# AirPrompts Frontend Only Startup Script
echo "🎨 Starting AirPrompts Frontend Development Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the AirPrompts root directory."
    exit 1
fi

# Kill any existing processes
echo "🛑 Stopping any existing servers..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Wait a moment
sleep 2

# Start frontend server in background with logging
echo "⚡ Starting Vite development server..."
npm run dev:client > /tmp/vite.log 2>&1 &
VITE_PID=$!

# Wait for startup
sleep 4

# Check if it started successfully
if curl -s http://localhost:5173/ > /dev/null; then
    echo "✅ Frontend server is running!"
    echo "🎨 Frontend App: http://localhost:5173/"
    echo ""
    echo "💡 Server is running in background (PID: $VITE_PID)"
    echo "📋 To stop: pkill -f vite"
    echo "📄 Logs: tail -f /tmp/vite.log"
    echo ""
    echo "🚀 Ready to develop! Open http://localhost:5173/ in your browser."
else
    echo "❌ Failed to start server. Check logs:"
    cat /tmp/vite.log
fi