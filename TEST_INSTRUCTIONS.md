# Testing Your Old.New Platform

## ✅ Backend is Running!

The backend has successfully compiled and is now running on **http://localhost:3000**

---

## 🚀 Quick Test

### 1. Test Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-02T..."}
```

### 2. Start Frontend

Open a new terminal:

```bash
cd doco-new.old.new
npm run dev
```

The frontend will start on **http://localhost:5173**

### 3. Access the Editor

Navigate to: **http://localhost:5173/#editor**

---

## 🎯 What to Test

### Document Upload & Enhancement

1. **Open Editor**: Go to http://localhost:5173/#editor

2. **Upload a Document**:
   - Drag & drop a file (DOCX, PDF, TXT, MD, HTML)
   - Or click to browse

3. **Chat with Doco**:
   - Type: "Make this more professional"
   - Type: "Check for grammar errors"
   - Type: "Analyze this document"

4. **Use Quick Actions**:
   - Click **✨ Quick Polish**
   - Click **📊 Analyze**
   - Click **🎯 Enhance**

5. **Export**:
   - Click Export → DOCX/PDF/LaTeX/HTML/TXT

---

## 📝 Sample Commands to Try

### In the AI Chat:

```
"Enhance this document"
"Make it more professional"
"Check for grammar errors"
"Organize this better"
"What's the readability score?"
"Add an introduction section"
"Make the tone more formal"
"Fix any spelling mistakes"
```

---

## 🔧 API Endpoints to Test

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Upload Document
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@your-document.docx"
```

### Get OAuth Providers
```bash
curl http://localhost:3000/api/auth/providers
```

---

## 🎨 Features Integrated

### ✅ Document Editor
- Split-panel interface (chat + editor)
- Monaco code editor
- TipTap rich text editor
- Real-time preview
- Drag & drop upload
- Auto-save

### ✅ AI Chat (Grok)
- Streaming responses
- Document context awareness
- Grammar checking
- Enhancement suggestions
- Document analysis

### ✅ Enhancement Levels
- **Quick** - Grammar & basics (free)
- **Professional** - + Tone & structure
- **Premium** - Deep restructure

### ✅ Export Formats
- DOCX (Microsoft Word)
- PDF
- LaTeX
- HTML
- TXT

### ✅ OAuth Support
- Google Sign-In
- GitHub Sign-In
- Apple Sign-In (requires setup)

---

## 🐛 If Something Doesn't Work

### Backend Won't Start
```bash
# Check PostgreSQL is running
psql --version

# Check the .env file exists
cat backend/.env

# Try reinstalling dependencies
cd backend
rm -rf node_modules
npm install
npm run dev
```

### Frontend Won't Start
```bash
cd doco-new.old.new
rm -rf node_modules
npm install
npm run dev
```

### AI Chat Not Responding

1. Check backend is running: `curl http://localhost:3000/api/health`
2. Check `.env` has XAI_API_KEY configured
3. Check browser console for errors (F12)

### Document Upload Fails

1. Supported formats: DOCX, PDF, TXT, MD, HTML
2. Max file size: 10MB
3. Check backend logs for errors

---

## 📊 Database Setup (If Needed)

If you want to test with full database functionality:

```bash
# Create PostgreSQL database
createdb oldnew_dev

# Run migrations
cd backend
psql -d oldnew_dev -f src/database/schema.sql

# Or use the migration script
npm run migrate
```

---

## 🎯 Next Steps

1. **Test Document Enhancement**:
   - Upload a resume
   - Ask Doco to enhance it
   - Export as DOCX

2. **Test OAuth** (if configured):
   - Click OAuth button in navbar
   - Sign in with Google/GitHub
   - Test authenticated features

3. **Customize**:
   - Edit AI prompts in `grok-ai-service.ts`
   - Adjust enhancement levels
   - Modify UI theme

---

## 📚 Documentation

- [EDITOR_INTEGRATION.md](EDITOR_INTEGRATION.md) - Complete editor guide
- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth configuration
- [OAUTH_QUICKSTART.md](OAUTH_QUICKSTART.md) - 5-minute OAuth setup
- [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) - API integration
- [API_REFERENCE.md](backend/API_REFERENCE.md) - Full API docs

---

## 🎉 Your Platform is Ready!

**Backend**: ✅ Running on http://localhost:3000
**Frontend**: Start with `npm run dev` in doco-new.old.new/
**Editor**: Access at http://localhost:5173/#editor

Upload a document and start enhancing with AI! 🚀
