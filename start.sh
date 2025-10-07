#!/bin/bash

# Old.New - AI Document Enhancement Platform
# Startup script for all services

echo "🚀 Starting Old.New - AI Document Enhancement Platform"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env not found${NC}"
fi

if [ ! -f "doco-new-editor.old.new/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: doco-new-editor.old.new/.env not found${NC}"
fi

echo -e "${BLUE}Starting Backend API (Port 3000)...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

echo -e "${BLUE}Starting Editor App (Port 5173)...${NC}"
cd doco-new-editor.old.new
npm run dev > ../logs/editor.log 2>&1 &
EDITOR_PID=$!
cd ..

sleep 2

echo -e "${BLUE}Starting Upload App (Port 5174)...${NC}"
cd doco-new.old.new
PORT=5174 npm run dev > ../logs/upload.log 2>&1 &
UPLOAD_PID=$!
cd ..

sleep 2

echo -e "${BLUE}Starting Visual Editor (Port 5175)...${NC}"
cd doco-visual-editor.old.new
npm run dev > ../logs/visual-editor.log 2>&1 &
VISUAL_PID=$!
cd ..

sleep 3

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📱 Application URLs:"
echo "   📤 Upload:        http://localhost:5174"
echo "   ✏️  LaTeX Editor:  http://localhost:5173"
echo "   🎨 Visual Editor: http://localhost:5175"
echo "   🔌 Backend:       http://localhost:3000"
echo ""
echo "📊 Process IDs:"
echo "   Backend:       $BACKEND_PID"
echo "   LaTeX Editor:  $EDITOR_PID"
echo "   Upload:        $UPLOAD_PID"
echo "   Visual Editor: $VISUAL_PID"
echo ""
echo "📝 Logs are being written to:"
echo "   backend:       logs/backend.log"
echo "   latex-editor:  logs/editor.log"
echo "   upload:        logs/upload.log"
echo "   visual-editor: logs/visual-editor.log"
echo ""
echo "To stop all services, run: ./stop.sh"
echo ""
echo -e "${GREEN}🎉 Ready! Open http://localhost:5174 to start uploading documents!${NC}"
