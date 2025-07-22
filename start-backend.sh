#!/bin/bash

# AirPrompts Backend Startup Script

echo "🚀 Starting AirPrompts Backend Server..."
echo "📁 Working directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: server/server.js not found. Make sure you're in the AirPrompts root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting server on http://localhost:3001"
node server/server.js