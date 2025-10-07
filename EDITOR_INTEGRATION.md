# Document Editor Integration Guide

The document editor has been successfully integrated into the Old.New platform! Users can now edit and modify documents with AI assistance from Grok.

## 🎉 What's Been Integrated

### Frontend Components
- ✅ Full document editor with split-panel interface
- ✅ AI chat panel with Doco avatar
- ✅ Monaco code editor for document editing
- ✅ TipTap rich text editor
- ✅ Real-time document preview
- ✅ Drag & drop file upload
- ✅ Auto-save functionality
- ✅ Keyboard shortcuts
- ✅ Export to DOCX, PDF, LaTeX, HTML, TXT

### Backend Integration
- ✅ Grok AI streaming chat endpoint
- ✅ Document enhancement via backend API
- ✅ AI suggestions and grammar checking
- ✅ Document analysis integration

### Features
- ✅ **AI Chat**: Talk to Doco about your document
- ✅ **Smart Enhancement**: Quick/Pro/Premium levels
- ✅ **Grammar Check**: Real-time error detection
- ✅ **Document Analysis**: Readability & quality scores
- ✅ **Multi-format Support**: DOCX, PDF, TXT, MD, HTML
- ✅ **Undo/Redo**: Full editing history
- ✅ **Auto-save**: Never lose your work

---

## 🚀 How to Access the Editor

### Option 1: Direct Link
Navigate to: `http://localhost:5173/#editor`

### Option 2: Navbar
Click **"Editor"** in the top navigation bar

### Option 3: From Upload Flow
After uploading a document, it will open in the editor

---

## 📁 File Structure

### Frontend Files Added

```
doco-new.old.new/src/
├── components/
│   ├── DocumentEditor.tsx          # Main editor component
│   ├── chat/                       # AI chat components
│   │   ├── ChatPanel.tsx
│   │   ├── ChatInput.tsx
│   │   ├── DocoAvatar.tsx
│   │   ├── MessageBubble.tsx
│   │   └── QuickActions.tsx
│   ├── editor/                     # Document editing
│   │   ├── EditorContainer.tsx
│   │   ├── DocumentView.tsx
│   │   ├── CodeView.tsx
│   │   └── TabBar.tsx
│   └── toolbar/                    # Editor toolbars
│       ├── GlobalToolbar.tsx
│       ├── ContextualToolbar.tsx
│       ├── ChatToolbar.tsx
│       └── StatusBar.tsx
├── stores/
│   ├── documentStore.ts            # Document state
│   └── chatStore.ts                # Chat state
├── hooks/
│   ├── useAutoSave.ts
│   └── useKeyboardShortcuts.ts
└── lib/
    ├── grok-ai-service.ts          # Grok AI integration
    ├── document-parser.ts          # File parsing
    ├── export-utils.ts             # Export functionality
    └── storage.ts                  # Local storage
```

### Backend Files Added

```
backend/src/
└── controllers/
    └── aiController.ts             # AI chat endpoints
```

---

## 🔌 API Endpoints

### Chat with AI
```http
POST /api/ai/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Help me improve this document" }
  ]
}
```

Response: Server-Sent Events (SSE) stream

### Get Suggestions
```http
POST /api/ai/suggestions
Content-Type: application/json

{
  "text": "Your document text...",
  "context": "resume"
}
```

Response:
```json
{
  "suggestions": [
    "Break long sentences into shorter ones",
    "Use active voice instead of passive",
    "Add more specific examples"
  ]
}
```

### Grammar Check
```http
POST /api/ai/grammar
Content-Type: application/json

{
  "text": "Your document text..."
}
```

Response:
```json
{
  "errors": [
    {
      "error": "Subject-verb disagreement",
      "suggestion": "Change 'are' to 'is'",
      "location": "The team are working..."
    }
  ],
  "count": 1
}
```

---

## 💬 AI Chat Features

### Built-in Commands

Users can ask Doco to:

1. **Enhance Document**
   - "Enhance this document"
   - "Make it more professional"
   - "Improve the clarity"

2. **Grammar & Spelling**
   - "Check for grammar errors"
   - "Fix spelling mistakes"

3. **Structure & Organization**
   - "Organize this better"
   - "Add sections"
   - "Improve structure"

4. **Tone & Style**
   - "Make it more formal"
   - "Use simpler language"
   - "Adjust the tone"

5. **Analysis**
   - "Analyze this document"
   - "What's the readability score?"

### Quick Actions

Pre-built buttons for common tasks:
- ✨ Quick Polish
- 📊 Analyze
- 🎯 Enhance
- 📝 Grammar Check

---

## ⚙️ Configuration

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (.env)

Already configured with:
- Grok AI integration
- Document processing
- Enhancement endpoints

---

## 🎨 Customization

### Adjust Enhancement Levels

Edit `DocumentEditor.tsx`:

```typescript
const limits = {
  quick: 5,      // Free tier
  pro: 20,       // Pro tier
  premium: 100   // Premium tier
};
```

### Modify AI Prompts

Edit `grok-ai-service.ts`:

```typescript
const systemPrompt = `You are Doco, a helpful AI assistant...`;
```

### Change Editor Theme

Edit `EditorContainer.tsx` for Monaco theme or `DocumentView.tsx` for TipTap styling.

---

## 🔧 Keyboard Shortcuts

- **Ctrl/Cmd + S** - Save document
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Shift + Z** - Redo
- **Ctrl/Cmd + E** - Enhance document
- **Ctrl/Cmd + /** - Toggle chat focus

---

## 🚀 Usage Examples

### Basic Document Editing

1. Click **"Editor"** in navbar
2. Upload a document or start typing
3. Chat with Doco: *"Make this more professional"*
4. Review AI suggestions
5. Export as DOCX, PDF, or LaTeX

### Enhancement Workflow

1. Upload document
2. Click **"Quick Polish"** for instant enhancement
3. Or use toolbar: **Enhance → Pro** for deeper improvements
4. Review track changes in chat
5. Export final version

### AI-Assisted Writing

1. Start new document
2. Type your draft
3. Ask Doco: *"Help me structure this as a business proposal"*
4. Apply suggestions
5. Ask: *"Make the tone more formal"*
6. Finalize and export

---

## 🐛 Troubleshooting

### Editor doesn't load
- Check that all dependencies are installed: `npm install`
- Verify frontend is running: `npm run dev`

### AI chat not working
- Check backend is running
- Verify `VITE_API_BASE_URL` in `.env`
- Check browser console for errors

### Document upload fails
- Supported formats: DOCX, PDF, TXT, MD, HTML
- Max file size: 10MB
- Check backend file upload limits

### Export not working
- Check browser pop-up blocker
- Verify document has content
- Try different export format

---

## 📊 State Management

### Document Store (Zustand)

```typescript
import { useDocumentStore } from './stores/documentStore';

const {
  document,      // Current document
  setContent,    // Update content
  saveStatus     // 'saved' | 'saving' | 'unsaved'
} = useDocumentStore();
```

### Chat Store (Zustand)

```typescript
import { useChatStore } from './stores/chatStore';

const {
  messages,          // Chat history
  addMessage,        // Add new message
  docoState,         // 'idle' | 'thinking' | 'enhancing'
  setDocoState       // Update Doco state
} = useChatStore();
```

---

## 🎯 Next Steps

1. **Test the Editor**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd doco-new.old.new
   npm run dev
   ```

2. **Navigate to Editor**
   - Open: http://localhost:5173/#editor
   - Upload a document
   - Chat with Doco!

3. **Customize**
   - Adjust AI prompts
   - Change enhancement levels
   - Modify UI theme

4. **Deploy**
   - Update API URLs for production
   - Configure OAuth for user accounts
   - Set up proper file storage

---

## 🔗 Related Documentation

- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth configuration
- [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) - API integration
- [API_REFERENCE.md](backend/API_REFERENCE.md) - Complete API docs
- [QUICKSTART.md](backend/QUICKSTART.md) - Backend setup

---

## 🎉 You're All Set!

The document editor is now fully integrated with your Old.New platform. Users can:

✅ Upload documents
✅ Edit with AI assistance
✅ Chat with Doco about improvements
✅ Export to multiple formats
✅ Track changes and get suggestions

Navigate to `#editor` and start editing! 🚀
