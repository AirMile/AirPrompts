#!/bin/bash

# Stable development server with auto-restart
echo "🔄 Starting stable development server with file watching..."

while true; do
    echo "🚀 Starting Vite server..."
    
    # Start vite in foreground, capture PID
    npm run dev:client &
    VITE_PID=$!
    
    # Wait for it to start
    sleep 3
    
    echo "✅ Vite running on PID $VITE_PID - http://localhost:5173/"
    echo "🔍 Monitoring for crashes... Press Ctrl+C to stop"
    
    # Monitor if vite is still running
    while kill -0 $VITE_PID 2>/dev/null; do
        sleep 5
    done
    
    echo "💥 Vite crashed! Auto-restarting in 2 seconds..."
    sleep 2
done