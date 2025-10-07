# Old.New Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend App                          │
│              (React/Vue/Angular - Your Code)                 │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express.js Server                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                     │  │
│  │  • CORS, Helmet (Security)                           │  │
│  │  • JWT Authentication                                 │  │
│  │  • Rate Limiting (Redis)                             │  │
│  │  • File Upload (Multer)                              │  │
│  │  • Error Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Controllers                                          │  │
│  │  • AuthController (register/login)                   │  │
│  │  • DocumentController (CRUD operations)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                            │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Document Processing                            │  │  │
│  │  │  • DocumentParser (DOCX/PDF/TXT/MD)            │  │  │
│  │  │  • DocumentClassifier (AI-powered)             │  │  │
│  │  │  • DocumentAnalyzer (readability/grammar)      │  │  │
│  │  │  • DocumentEnhancer (3-tier enhancement)       │  │  │
│  │  │  • DocumentFormatter (DOCX/LaTeX/HTML output)  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  LLM Abstraction Layer                         │  │  │
│  │  │  • LLMService (provider-agnostic)              │  │  │
│  │  │  • XAIAdapter (xAI Grok integration)           │  │  │
│  │  │  • Fallback support ready                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │     Redis    │    │   xAI Grok   │
│   Database   │    │    Cache     │    │   API (LLM)  │
│              │    │              │    │              │
│ • Users      │    │ • Rate limit │    │ • Classify   │
│ • Documents  │    │ • Sessions   │    │ • Analyze    │
│ • Analysis   │    │ • Cache      │    │ • Enhance    │
│ • Usage      │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

### Document Enhancement Workflow

```
1. Upload Document
   ┌─────────┐
   │ Client  │
   └────┬────┘
        │ POST /api/documents/upload (multipart/form-data)
        ▼
   ┌────────────┐
   │  Multer    │ ─── Validates file type & size
   │ Middleware │ ─── Saves to temp directory
   └────┬───────┘
        │
        ▼
   ┌──────────────────┐
   │ DocumentParser   │ ─── Extracts text from DOCX/PDF/TXT/MD
   │                  │ ─── OCR for scanned PDFs (Tesseract)
   │                  │ ─── Detects language (franc)
   │                  │ ─── Extracts structure (sections/paragraphs)
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │   PostgreSQL     │ ─── Saves document + metadata
   └────┬─────────────┘
        │
        ▼
   Response: { documentId, text, metadata }

2. Classify Document (Optional)
   ┌─────────┐
   │ Client  │
   └────┬────┘
        │ POST /api/documents/:id/classify
        ▼
   ┌─────────────────────┐
   │ DocumentClassifier  │ ─── Sends excerpt to LLM
   │                     │ ─── 14+ document types
   └────┬────────────────┘
        │
        ▼
   ┌─────────────┐
   │  LLMService │ ───┐
   └─────────────┘    │
        │              │
        ▼              │
   ┌─────────────┐    │
   │ XAIAdapter  │    │ Abstraction allows provider switching
   └────┬────────┘    │
        │              │
        ▼              │
   ┌─────────────┐    │
   │  xAI Grok   │ ◄──┘
   │     API     │
   └────┬────────┘
        │
        ▼
   Response: { type, confidence, industry, audience, tone }

3. Analyze Document (Optional)
   ┌─────────┐
   │ Client  │
   └────┬────┘
        │ POST /api/documents/:id/analyze
        ▼
   ┌──────────────────┐
   │ DocumentAnalyzer │ ─── Sends to LLM for analysis
   └────┬─────────────┘
        │
        ▼
   ┌──────────────┐
   │  LLMService  │ ─── Returns readability, clarity, grammar
   └────┬─────────┘     complexity, suggestions
        │
        ▼
   Response: { readabilityScore, clarityScore, strengths, weaknesses }

4. Enhance Document
   ┌─────────┐
   │ Client  │
   └────┬────┘
        │ POST /api/documents/:id/enhance
        │ { level: "professional", industry: "tech", tone: "formal" }
        ▼
   ┌───────────────────┐
   │ DocumentEnhancer  │ ─── Builds dynamic prompt
   │                   │ ─── Selects config (tokens, temp)
   │                   │ ─── Quick/Pro/Premium tier
   └────┬──────────────┘
        │
        ▼
   ┌──────────────┐
   │  LLMService  │ ─── Sends enhanced prompt to xAI
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  Track API   │ ─── Logs tokens used, cost
   │    Usage     │ ─── Stores in api_usage table
   └────┬─────────┘
        │
        ▼
   Response: {
     enhancedText,
     changes: [...],
     summary: { totalChanges, improvementScore },
     cost,
     tokensUsed
   }

5. Export Document
   ┌─────────┐
   │ Client  │
   └────┬────┘
        │ GET /api/documents/:id/export?format=docx
        ▼
   ┌────────────────────┐
   │ DocumentFormatter  │ ─── Generates DOCX (docx library)
   │                    │ ─── Generates LaTeX (custom formatter)
   │                    │ ─── Generates HTML (custom formatter)
   └────┬───────────────┘
        │
        ▼
   File download (DOCX/LaTeX/HTML/TXT)
```

## Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                        users                            │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ email (unique)                                          │
│ password_hash                                           │
│ first_name, last_name                                   │
│ role (user/admin)                                       │
│ created_at, updated_at                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 1:N
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     documents                           │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ user_id (fk → users)                                    │
│ original_filename                                       │
│ file_path, file_size, file_format                      │
│ original_text, enhanced_text                           │
│ document_type                                           │
│ status (uploaded/parsed/classified/enhanced)           │
│ metadata (jsonb) - word count, language, etc.          │
│ structure (jsonb) - sections, paragraphs               │
│ created_at, updated_at                                  │
└────┬─────────────────┬──────────────────┬──────────────┘
     │                 │                  │
     │ 1:N             │ 1:N              │ 1:N
     ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ document_    │  │ document_    │  │ document_        │
│ classifica-  │  │ analyses     │  │ enhancements     │
│ tions        │  │              │  │                  │
├──────────────┤  ├──────────────┤  ├──────────────────┤
│ type         │  │ readability  │  │ level            │
│ confidence   │  │ clarity      │  │ changes (jsonb)  │
│ industry     │  │ grammar      │  │ summary (jsonb)  │
│ audience     │  │ complexity   │  │ cost             │
│ tone         │  │ strengths    │  │ tokens_used      │
└──────────────┘  │ weaknesses   │  └────┬─────────────┘
                  │ suggestions  │       │
                  └──────────────┘       │ 1:N
                                         ▼
                                    ┌──────────────┐
                                    │ track_       │
                                    │ changes      │
                                    ├──────────────┤
                                    │ type         │
                                    │ original     │
                                    │ enhanced     │
                                    │ reason       │
                                    │ location     │
                                    └──────────────┘

┌─────────────────────────────────────────────────────────┐
│                      api_usage                          │
├─────────────────────────────────────────────────────────┤
│ user_id (fk → users)                                    │
│ document_id (fk → documents)                            │
│ provider (xai/openai)                                   │
│ model (grok-4-fast-reasoning-20251001)                  │
│ operation (classify/analyze/enhance)                    │
│ input_tokens, output_tokens, total_tokens              │
│ cost                                                     │
│ created_at                                              │
└─────────────────────────────────────────────────────────┘
```

## Service Architecture

### LLM Abstraction Layer

```
┌───────────────────────────────────────────────┐
│             LLMService (Facade)               │
│                                               │
│  + classify(text, options)                    │
│  + analyze(text, options)                     │
│  + enhance(text, options)                     │
│  + getCostEstimate()                          │
│                                               │
│  • Handles fallback logic                     │
│  • Provider-agnostic interface                │
└────────────────────┬──────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│  XAIAdapter   │         │ OpenAIAdapter │
│  (Primary)    │         │  (Fallback)   │
├───────────────┤         ├───────────────┤
│ • Grok API    │         │ • GPT API     │
│ • $0.20/M in  │         │ • $10/M in    │
│ • $0.50/M out │         │ • $30/M out   │
└───────────────┘         └───────────────┘

Both implement LLMAdapter interface:
  - classify()
  - analyze()
  - enhance()
  - calculateCost()
  - normalizeResponse()
```

### Document Processing Pipeline

```
Input File (DOCX/PDF/TXT/MD)
        │
        ▼
┌────────────────────────┐
│   DocumentParser       │
│                        │
│ DOCX → Mammoth.js      │
│ PDF → pdf-parse        │
│ PDF (scanned) → OCR    │
│ TXT/MD → fs.readFile   │
│                        │
│ • Language detection   │
│ • Structure extraction │
│ • Metadata generation  │
└────────┬───────────────┘
         │
         ▼
    ParsedDocument {
      text,
      metadata: {
        wordCount,
        pageCount,
        language,
        ...
      },
      structure: {
        sections,
        paragraphs
      }
    }
```

### Enhancement Pipeline

```
Original Text
     │
     ▼
┌─────────────────────────────────────┐
│      Build Dynamic Prompt            │
│                                      │
│ Base prompt + document type +        │
│ industry context + audience +        │
│ tone + special instructions          │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Select Enhancement Config       │
│                                      │
│ Quick: 3K tokens, temp 0.3           │
│ Professional: 5K tokens, temp 0.5    │
│ Premium: 8K tokens, temp 0.7         │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Send to LLM (xAI Grok)        │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Parse JSON Response            │
│                                      │
│ {                                    │
│   enhancedText,                      │
│   changes: [...],                    │
│   summary: {...}                     │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Track Changes & Cost            │
│                                      │
│ • Calculate cost from tokens         │
│ • Store in api_usage table           │
│ • Generate track changes HTML        │
└──────────────┬───────────────────────┘
               │
               ▼
         Enhanced Document
```

## Authentication Flow

```
1. Register
   Client → POST /api/auth/register
          { email, password, firstName, lastName }
          ↓
          Hash password (bcrypt)
          ↓
          Store in users table
          ↓
          Generate JWT token
          ↓
   Client ← { userId, email, token }

2. Login
   Client → POST /api/auth/login
          { email, password }
          ↓
          Verify password (bcrypt.compare)
          ↓
          Generate JWT token
          ↓
   Client ← { userId, email, token }

3. Authenticated Request
   Client → GET /api/documents
          Header: Authorization: Bearer <token>
          ↓
          JWT Middleware verifies token
          ↓
          Decode: { userId, email, role }
          ↓
          Attach to req.user
          ↓
          Controller accesses req.user.userId
```

## Rate Limiting

```
Request from Client (IP: 192.168.1.1)
        │
        ▼
┌─────────────────────────────┐
│   Rate Limiter Middleware   │
└────────────┬────────────────┘
             │
             ▼
    Get key: "rate_limit:192.168.1.1"
             │
             ▼
┌────────────────────────────────┐
│          Redis                 │
│                                │
│  INCR rate_limit:192.168.1.1   │
│  → Returns current count       │
│                                │
│  If first request:             │
│    EXPIRE key 900 (15 min)     │
└────────────┬───────────────────┘
             │
             ▼
    If count > limit (100):
      Return 429 Too Many Requests
    Else:
      Continue to route handler
```

## File Storage

```
uploads/          ← Final storage
  └── user-id/
      └── document-id/
          └── file.docx

temp/            ← Temporary during upload
  └── uuid-filename.docx

Processing:
1. Upload → Save to temp/
2. Parse → Extract text
3. Save to DB
4. Move to uploads/ (optional)
5. Delete temp file
```

## Error Handling

```
Request
   │
   ▼
Try {
   Middleware → Controller → Service
   │
   ▼
   Success Response
}
Catch (error) {
   │
   ▼
   Error Handler Middleware
   │
   ├─ Multer error → 413/400
   ├─ JWT error → 401/403
   ├─ Database error → 409/500
   ├─ LLM error → 500
   └─ Other → 500
   │
   ▼
   JSON Error Response {
     error: "message",
     ...(dev mode: stack trace)
   }
}
```

## Cost Tracking

```
Enhancement Request
        │
        ▼
┌─────────────────────────────┐
│   DocumentEnhancer          │
│   • Build prompt            │
│   • Call LLM                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   LLMService                │
│   • Track tokens            │
│   • Calculate cost          │
│   • Return response         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Store in api_usage        │
│                             │
│   user_id, document_id,     │
│   provider, model,          │
│   input_tokens,             │
│   output_tokens,            │
│   cost, created_at          │
└─────────────────────────────┘

Query costs:
SELECT
  DATE(created_at) as date,
  SUM(cost) as total_cost,
  COUNT(*) as requests
FROM api_usage
GROUP BY DATE(created_at);
```

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│              Load Balancer               │
│              (nginx/HAProxy)             │
└────────────────┬─────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│  Node.js      │  │  Node.js      │
│  Instance 1   │  │  Instance 2   │
│  (PM2)        │  │  (PM2)        │
└───────┬───────┘  └───────┬───────┘
        │                  │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │     Redis     │
│   (Primary)   │  │   (Cluster)   │
│               │  │               │
│  ┌─Replica─┐  │  └───────────────┘
│  └─────────┘  │
└───────────────┘
```

---

This architecture provides:
✅ Scalability - Stateless design, horizontal scaling
✅ Reliability - Database transactions, error handling
✅ Flexibility - Provider abstraction, multiple formats
✅ Cost Efficiency - Usage tracking, tier-based pricing
✅ Security - JWT auth, rate limiting, input validation
