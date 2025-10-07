# API Endpoints Reference

Base URL: `http://localhost:3000/api`

---

## 🏥 Health & Status

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T..."
}
```

---

## 🔐 Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"
}
```

---

## 🔑 OAuth Authentication

### Get Available OAuth Providers
```http
GET /api/auth/providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "google",
      "displayName": "Google",
      "authUrl": "/api/auth/google"
    },
    {
      "name": "github",
      "displayName": "GitHub",
      "authUrl": "/api/auth/github"
    },
    {
      "name": "apple",
      "displayName": "Apple",
      "authUrl": "/api/auth/apple"
    }
  ]
}
```

### Initiate OAuth Flow

**Google:**
```http
GET /api/auth/google
```

**GitHub:**
```http
GET /api/auth/github
```

**Apple:**
```http
GET /api/auth/apple
```

### OAuth Callbacks (handled automatically)
```http
GET /api/auth/google/callback
GET /api/auth/github/callback
POST /api/auth/apple/callback
```

---

## 📄 Document Operations

### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token> (optional)

file: <document.docx>
```

**Response:**
```json
{
  "documentId": "uuid",
  "filename": "document.docx",
  "size": 12345,
  "format": "docx",
  "message": "Document uploaded successfully"
}
```

**Supported formats:** DOCX, PDF, TXT, MD, HTML

### Classify Document
```http
POST /api/documents/:documentId/classify
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "classificationId": "uuid",
  "type": "resume",
  "confidence": 0.95,
  "subtype": "technical",
  "industry": "technology",
  "audience": "professional",
  "suggestedTone": "professional",
  "detectedLanguage": "en"
}
```

### Analyze Document
```http
POST /api/documents/:documentId/analyze
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "analysisId": "uuid",
  "readability_score": 75,
  "clarity_score": 82,
  "grammar_issues": 3,
  "sentence_complexity": "moderate",
  "avg_sentence_length": 18.5,
  "passive_voice_percentage": 12.3,
  "technical_level": "intermediate",
  "strengths": ["Clear structure", "Good vocabulary"],
  "weaknesses": ["Some run-on sentences"],
  "suggestions": ["Break down complex sentences", "Use active voice"]
}
```

### Enhance Document
```http
POST /api/documents/:documentId/enhance
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "level": "professional",
  "industry": "technology",
  "audience": "professionals",
  "tone": "professional",
  "specialInstructions": "Focus on technical accuracy"
}
```

**Enhancement Levels:**
- `quick` - Grammar & basic improvements (~$0.001-0.002)
- `professional` - + Tone & structure improvements (~$0.003-0.005)
- `premium` - Deep restructuring & optimization (~$0.006-0.015)

**Response:**
```json
{
  "enhancementId": "uuid",
  "enhancedText": "Enhanced document content...",
  "changes": [
    {
      "type": "grammar",
      "original": "They was working",
      "enhanced": "They were working",
      "reason": "Subject-verb agreement"
    }
  ],
  "summary": {
    "totalChanges": 15,
    "grammarFixes": 5,
    "clarityImprovements": 7,
    "structureChanges": 3
  },
  "cost": 0.0045,
  "tokensUsed": 1250
}
```

### Export Document
```http
GET /api/documents/:documentId/export?format=docx
Authorization: Bearer <token> (optional)
```

**Query Parameters:**
- `format` - Export format: `docx`, `pdf`, `latex`, `html`, `txt`

**Response:** Binary file download

### Get Document
```http
GET /api/documents/:documentId
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "id": "uuid",
  "original_filename": "document.docx",
  "original_text": "Original content...",
  "enhanced_text": "Enhanced content...",
  "document_type": "resume",
  "status": "enhanced",
  "created_at": "2025-10-02T..."
}
```

### List User Documents
```http
GET /api/documents
Authorization: Bearer <token> (required)
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "original_filename": "resume.docx",
      "document_type": "resume",
      "status": "enhanced",
      "created_at": "2025-10-02T..."
    }
  ],
  "total": 5
}
```

---

## 🤖 AI Services

### Stream Chat with AI
```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "messages": [
    {
      "role": "user",
      "content": "Make this document more professional"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

```
data: {"content":"I'll"}

data: {"content":" help"}

data: {"content":" you"}

data: [DONE]
```

### Get AI Suggestions
```http
POST /api/ai/suggestions
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "text": "Your document text here...",
  "context": "resume"
}
```

**Response:**
```json
{
  "suggestions": [
    "Break long sentences into shorter ones for better readability",
    "Use active voice instead of passive where possible",
    "Add more specific examples to support key points",
    "Consider reorganizing sections for better flow"
  ]
}
```

### Grammar Check
```http
POST /api/ai/grammar
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "text": "The team are working on the project."
}
```

**Response:**
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

## 📊 Usage Summary

### Endpoint Categories

**Total Endpoints:** 19

1. **Health** (1 endpoint)
   - Health check

2. **Authentication** (3 endpoints)
   - Register, Login, Get Profile

3. **OAuth** (7 endpoints)
   - Providers list
   - Google OAuth (2)
   - GitHub OAuth (2)
   - Apple OAuth (2)

4. **Documents** (7 endpoints)
   - Upload, Classify, Analyze, Enhance, Export, Get, List

5. **AI Services** (3 endpoints)
   - Chat stream, Suggestions, Grammar check

---

## 🔒 Authentication

Most endpoints support **optional authentication** using JWT tokens:

```http
Authorization: Bearer <your-jwt-token>
```

**Optional Auth Endpoints:**
- Document operations (upload, classify, analyze, enhance, export, get)
- AI services (chat, suggestions, grammar)

**Required Auth Endpoints:**
- Get profile
- List documents

**No Auth Required:**
- Health check
- Register/Login
- OAuth flows
- OAuth providers list

---

## 🚀 Quick Test Examples

### Test Backend Health
```bash
curl http://localhost:3000/api/health
```

### Upload a Document
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@resume.docx"
```

### Enhance Document (with auth)
```bash
curl -X POST http://localhost:3000/api/documents/<documentId>/enhance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "level": "professional",
    "tone": "professional"
  }'
```

### Chat with AI
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Help me improve this document"}
    ]
  }'
```

### Get OAuth Providers
```bash
curl http://localhost:3000/api/auth/providers
```

---

## 📝 Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (register)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔗 Frontend Integration

The frontend uses these endpoints through the API client in:

**File:** `doco-new.old.new/src/lib/api.ts`

**Key functions:**
- `authAPI.register()` - Register user
- `authAPI.login()` - Login
- `documentsAPI.upload()` - Upload document
- `documentsAPI.enhance()` - Enhance document
- `documentsAPI.exportDocument()` - Export document
- `grokAI.streamChat()` - AI chat (via `grok-ai-service.ts`)

---

## 📚 Related Documentation

- [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) - Frontend API usage
- [EDITOR_INTEGRATION.md](EDITOR_INTEGRATION.md) - Editor features
- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth configuration
- [backend/API_REFERENCE.md](backend/API_REFERENCE.md) - Detailed API docs

---

All endpoints are powered by **Grok AI** (grok-4-fast-reasoning-20251001) for intelligent document enhancement! 🚀
