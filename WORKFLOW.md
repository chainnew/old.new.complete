# Old.New - AI Document Enhancement Workflow

## 🚀 Quick Start

The document enhancement workflow is **fully automated** and ready to use!

### Start the Platform
```bash
./start.sh
```

This launches:
- **Upload App** (localhost:5174) - Where users drop their documents
- **Editor App** (localhost:5173) - AI-powered editing environment
- **Backend API** (localhost:3000) - Document processing engine

## 📋 Complete Workflow

### 1. **Upload Document** (localhost:5174)
   - User visits the upload screen
   - Drags & drops a resume/document (PDF, DOCX, TXT)
   - Backend extracts text and metadata
   - Document is stored with unique ID
   - User is **auto-redirected** to the editor

### 2. **AI Auto-Enhancement** (localhost:5173)
   **This happens automatically!**

   When the editor loads:
   ```
   ✅ Document text loaded from localStorage
   ✅ AI enhancement triggered immediately
   ✅ Grok-4-fast-reasoning polishes the content
   ✅ LaTeX code generated automatically
   ✅ Code tab activated to show LaTeX
   ```

   The AI performs:
   - Grammar & spelling corrections
   - Clarity improvements
   - Stronger action verbs
   - Professional tone adjustments
   - Structure optimization
   - LaTeX formatting

### 3. **Live Chat Enhancement**
   Users can further refine with:
   - "Make this more technical"
   - "Add bullet points to the experience section"
   - "Convert to a cover letter"
   - "Generate a PDF"

## 🎯 Key Features Implemented

### ✨ Auto-Enhancement Flow
```typescript
// In doco-new-editor.old.new/src/App.tsx
useEffect(() => {
  // Load document from localStorage (transferred from upload app)
  const documentText = localStorage.getItem('currentDocumentText');
  const documentTitle = localStorage.getItem('currentDocumentTitle');

  // Auto-trigger AI enhancement
  setTimeout(() => {
    handleAutoEnhance(documentText, documentTitle);
  }, 800);
}, []);
```

### 🔄 Document Transfer
```typescript
// In doco-new.old.new/src/components/UploadScreen.tsx
// After successful upload:
localStorage.setItem('currentDocumentId', documentId);
localStorage.setItem('currentDocumentText', text);
localStorage.setItem('currentDocumentTitle', file.name);

// Redirect to editor
window.location.href = 'http://localhost:5173';
```

### 🤖 AI Polish & LaTeX Generation
```typescript
const handleAutoEnhance = async (text: string, title?: string) => {
  // Step 1: Polish content with Grok-4-fast-reasoning
  const polishedText = await aiService.streamChat([{
    role: 'user',
    content: 'Polish and enhance this document...'
  }]);

  setContent(polishedText);

  // Step 2: Generate LaTeX
  const latexCode = await latexGenerator.generateLatex(polishedText, 'resume');
  setMarkdown(latexCode);

  // Switch to code tab to show LaTeX
  setActiveTab('code');
};
```

## 🔧 Configuration

### API Keys (.env files)

**doco-new-editor.old.new/.env:**
```env
VITE_XAI_API_KEY=YOUR_XAI_KEY_HERE
VITE_XAI_API_ENDPOINT=https://api.x.ai/v1/chat/completions
VITE_XAI_MODEL=grok-4-fast-reasoning
```

**backend/.env:**
```env
XAI_API_KEY=YOUR_XAI_KEY_HERE
DATABASE_URL=postgresql://...
```

## 📊 Architecture

```
┌─────────────────┐
│  Upload Screen  │  (localhost:5174)
│  doco-new      │
└────────┬────────┘
         │ 1. Drop file
         │ 2. Extract text via backend API
         │ 3. Store in localStorage
         │ 4. Redirect to editor
         ↓
┌─────────────────┐
│  Editor App     │  (localhost:5173)
│  doco-new-editor│
└────────┬────────┘
         │ 5. Load document from localStorage
         │ 6. Auto-trigger AI enhancement
         │ 7. Stream polished content
         │ 8. Generate LaTeX
         │ 9. Show in code tab
         ↓
┌─────────────────┐
│   Backend API   │  (localhost:3000)
│   Node.js +     │
│   xAI Grok API  │
└─────────────────┘
```

## 🎨 User Experience

1. **Upload** (5 seconds)
   - User drops a resume PDF
   - Backend extracts text
   - Page redirects to editor

2. **Auto-Enhancement** (10-15 seconds)
   - Editor loads document
   - AI chat shows progress:
     - "🚀 Starting AI enhancement..."
     - "📝 Step 1: Polishing content..."
     - "✅ Content polished successfully!"
     - "🎨 Step 2: Converting to LaTeX..."
     - "✨ All done! Your document is enhanced!"
   - Code tab shows beautiful LaTeX formatting

3. **Export** (Instant)
   - User clicks "Export PDF"
   - LaTeX compiles to professional PDF
   - Download starts

## 🐛 Troubleshooting

### Editor doesn't auto-enhance
```bash
# Check if API key is loaded
# Open browser console on localhost:5173
# Look for: "✅ API key loaded from environment"
```

### Upload redirect fails
```bash
# Make sure editor is running on port 5173
lsof -i :5173
```

### Backend errors
```bash
# Check backend logs
tail -f logs/backend.log
```

## 🚢 Deployment

The system is **turnkey ready** for deployment:

### Option 1: Vercel + Heroku
- Frontend (Upload + Editor): Vercel
- Backend: Heroku with Postgres

### Option 2: Railway
- All-in-one deployment
- Auto-scaling included

### Option 3: DigitalOcean Apps
- Managed containers
- Built-in database

## 📝 Next Steps

Enhancements to consider:
- [ ] WebSocket for real-time collaboration
- [ ] PDF preview before download
- [ ] Multiple LaTeX templates
- [ ] Version history with undo/redo
- [ ] User authentication
- [ ] Document library
- [ ] Team sharing

## 🎯 Testing

To test the complete workflow:
1. `./start.sh` to launch all services
2. Open http://localhost:5174
3. Drop a sample resume (PDF/DOCX)
4. Watch it auto-redirect and enhance
5. See polished LaTeX in code tab
6. Export to PDF

**Sample Test Document:** A basic resume in TXT format works great!

---

**Built with ❤️ using xAI Grok-4-fast-reasoning**
