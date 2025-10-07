#!/bin/bash

# Old.New - Stop all services

echo "🛑 Stopping Old.New services..."

# Kill processes on specific ports
echo "Stopping Backend (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "Stopping Editor (port 5173)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Stopping Upload (port 5174)..."
lsof -ti:5174 | xargs kill -9 2>/dev/null

echo "✅ All services stopped!"
