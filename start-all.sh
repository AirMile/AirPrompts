#!/bin/bash

# AirPrompts Full Stack Startup Script

echo "🚀 Starting AirPrompts Full Stack Application..."
echo "📁 Working directory: $(pwd)"

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/server.js" ]; then
    echo "❌ Error: Required files not found. Make sure you're in the AirPrompts root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start backend server
echo "🌐 Starting backend server on http://localhost:3001..."
node server/server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:3001/api/templates > /dev/null 2>&1; then
    echo "⚠️  Backend might still be starting up..."
fi

# Start frontend development server
echo "⚡ Starting frontend development server on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "📊 Backend API: http://localhost:3001/api"
echo "🎨 Frontend App: http://localhost:5173"
echo ""
echo "💡 The app will automatically fall back to localStorage if the backend is unavailable."
echo "🔄 Use the Migration Wizard in the app to sync localStorage data to the database."
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for processes
wait