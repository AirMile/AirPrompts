#!/bin/bash

# AirPrompts Frontend Startup Script

echo "⚡ Starting AirPrompts Frontend Development Server..."
echo "📁 Working directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the AirPrompts root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting frontend on http://localhost:5173"
npm run dev