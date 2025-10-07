# API Reference

Complete reference for all Old.New backend endpoints.

**Base URL:** `http://localhost:3000/api`

## Table of Contents
- [Authentication](#authentication)
- [Documents](#documents)
- [System](#system)
- [Error Codes](#error-codes)

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

---

### Get Profile

Get current user profile.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Documents

### Upload Document

Upload a document for processing.

**Endpoint:** `POST /documents/upload`

**Headers:**
```
Authorization: Bearer {token}  (optional)
Content-Type: multipart/form-data
```

**Request:**
- **file** (required): File to upload
  - Supported formats: DOCX, PDF, TXT, MD
  - Max size: 10MB (configurable)

**Response:** `200 OK`
```json
{
  "documentId": "a3bb189e-8bf9-3888-9912-ace4e6543002",
  "text": "This is the extracted text from the document...",
  "metadata": {
    "pageCount": 3,
    "wordCount": 542,
    "characterCount": 3241,
    "format": "pdf",
    "hasImages": false,
    "hasTables": true,
    "isScanned": false,
    "ocrApplied": false,
    "detectedLanguage": "en",
    "languageConfidence": 0.98,
    "languages": ["en"]
  },
  "structure": {
    "sections": ["Introduction", "Methods", "Results", "Conclusion"],
    "paragraphs": ["...", "...", "..."]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

---

### Classify Document

Classify document type using AI.

**Endpoint:** `POST /documents/:documentId/classify`

**Headers:**
```
Authorization: Bearer {token}  (optional)
```

**Response:** `200 OK`
```json
{
  "type": "business_proposal",
  "confidence": 0.95,
  "subtype": "sales proposal",
  "industry": "technology",
  "audience": "C-suite executives",
  "suggestedTone": "professional",
  "detectedLanguage": "en",
  "multilingualNote": null
}
```

**Document Types:**
- `resume` / `cover_letter`
- `business_proposal` / `business_plan`
- `research_paper` / `thesis`
- `technical_report` / `whitepaper`
- `blog_post` / `marketing_copy`
- `email` / `case_study`
- `grant_proposal` / `essay`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/classify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Analyze Document

Analyze document quality and readability.

**Endpoint:** `POST /documents/:documentId/analyze`

**Headers:**
```
Authorization: Bearer {token}  (optional)
```

**Response:** `200 OK`
```json
{
  "readabilityScore": 75,
  "clarityScore": 80,
  "grammarIssues": 12,
  "sentenceComplexity": "moderate",
  "avgSentenceLength": 18.5,
  "passiveVoicePercentage": 15.2,
  "technicalLevel": "intermediate",
  "strengths": [
    "Clear structure with logical flow",
    "Effective use of data and examples",
    "Professional tone maintained throughout"
  ],
  "weaknesses": [
    "Some passive voice constructions",
    "Occasional run-on sentences",
    "Repetitive phrasing in sections 2-3"
  ],
  "suggestions": [
    "Break up sentences longer than 25 words",
    "Convert passive voice to active voice",
    "Vary sentence structure for better flow",
    "Remove redundant phrases",
    "Strengthen concluding paragraph"
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Enhance Document

Enhance document using AI.

**Endpoint:** `POST /documents/:documentId/enhance`

**Headers:**
```
Authorization: Bearer {token}  (optional)
Content-Type: application/json
```

**Request:**
```json
{
  "level": "professional",
  "industry": "technology",
  "audience": "investors",
  "tone": "professional",
  "specialInstructions": "Focus on ROI metrics and data-driven insights"
}
```

**Parameters:**
- **level** (required): `quick` | `professional` | `premium`
- **industry** (optional): Industry context (e.g., "technology", "healthcare", "finance")
- **audience** (optional): Target audience (e.g., "investors", "executives", "students")
- **tone** (optional): Desired tone (e.g., "professional", "casual", "academic")
- **specialInstructions** (optional): Additional instructions

**Enhancement Levels:**

| Level | Price | Tokens | Temp | Features |
|-------|-------|--------|------|----------|
| Quick | $5 | ~3K | 0.3 | Grammar, spelling, basic improvements |
| Professional | $15 | ~5K | 0.5 | + Tone, structure, industry terms |
| Premium | $30 | ~8K | 0.7 | + Deep restructure, strategic insights |

**Response:** `200 OK`
```json
{
  "enhancementId": "b4cc289f-9cg0-4999-0023-bdf5f7654113",
  "originalText": "This is the original document text...",
  "enhancedText": "This is the improved and enhanced document text...",
  "changes": [
    {
      "type": "grammar",
      "original": "They was going",
      "enhanced": "They were going",
      "reason": "Subject-verb agreement correction",
      "location": { "start": 150, "end": 165 }
    },
    {
      "type": "style",
      "original": "in order to achieve",
      "enhanced": "to achieve",
      "reason": "Removed wordiness for clarity",
      "location": { "start": 420, "end": 439 }
    }
  ],
  "summary": {
    "totalChanges": 47,
    "improvementScore": 68
  },
  "cost": 0.00234,
  "tokensUsed": 4500
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/enhance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "professional",
    "industry": "technology",
    "audience": "investors",
    "tone": "professional"
  }'
```

---

### Export Document

Export document in various formats.

**Endpoint:** `GET /documents/:documentId/export`

**Headers:**
```
Authorization: Bearer {token}  (optional)
```

**Query Parameters:**
- **format** (required): `docx` | `latex` | `html` | `txt`
- **title** (optional): Document title
- **author** (optional): Author name

**Response:** File download

**Content-Type by Format:**
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- LaTeX: `application/x-latex`
- HTML: `text/html`
- TXT: `text/plain`

**cURL Examples:**

Export as DOCX:
```bash
curl -X GET "http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/export?format=docx&title=My%20Document&author=John%20Doe" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o document.docx
```

Export as LaTeX:
```bash
curl -X GET "http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/export?format=latex&title=Research%20Paper" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o document.tex
```

Export as HTML:
```bash
curl -X GET "http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002/export?format=html" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o document.html
```

---

### Get Document

Get document details.

**Endpoint:** `GET /documents/:documentId`

**Headers:**
```
Authorization: Bearer {token}  (optional)
```

**Response:** `200 OK`
```json
{
  "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_filename": "business_proposal.pdf",
  "file_path": "/uploads/...",
  "file_size": 245678,
  "file_format": "pdf",
  "original_text": "...",
  "enhanced_text": "...",
  "document_type": "business_proposal",
  "status": "enhanced",
  "metadata": { ... },
  "structure": { ... },
  "classification_type": "business_proposal",
  "confidence": 0.95,
  "suggested_tone": "professional",
  "readability_score": 75,
  "clarity_score": 80,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:35:00Z"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/documents/a3bb189e-8bf9-3888-9912-ace4e6543002 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### List Documents

List user's documents.

**Endpoint:** `GET /documents`

**Headers:**
```
Authorization: Bearer {token}  (required)
```

**Query Parameters:**
- **limit** (optional, default: 20): Number of documents to return
- **offset** (optional, default: 0): Offset for pagination

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
      "original_filename": "business_proposal.pdf",
      "document_type": "business_proposal",
      "status": "enhanced",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:35:00Z"
    },
    {
      "id": "c5dd309g-0dh1-5000-1134-ceg6g8765224",
      "original_filename": "resume.docx",
      "document_type": "resume",
      "status": "classified",
      "created_at": "2025-01-14T15:20:00Z",
      "updated_at": "2025-01-14T15:22:00Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/documents?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## System

### Health Check

Check API health status.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.123Z"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/health
```

---

## Error Codes

### Standard Error Response

All errors return JSON with the following format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Document not found |
| 409 | Conflict | Email already exists |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Responses

**Invalid credentials:**
```json
{
  "error": "Invalid credentials"
}
```

**Token expired:**
```json
{
  "error": "Token expired"
}
```

**File too large:**
```json
{
  "error": "File size exceeds maximum limit"
}
```

**Rate limit exceeded:**
```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 900
}
```

**Document not found:**
```json
{
  "error": "Document not found"
}
```

**Invalid file type:**
```json
{
  "error": "Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed."
}
```

---

## Rate Limiting

Default rate limits:
- **100 requests per 15 minutes** per IP address
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining

When limit exceeded:
- Returns `429 Too Many Requests`
- Includes `retryAfter` in response (seconds)

---

## Authentication

Most endpoints support **optional authentication**:
- **With token**: Request is associated with user account
- **Without token**: Request is anonymous (limited features)

Required authentication:
- `GET /auth/profile`
- `GET /documents` (list)

To authenticate, include JWT token in header:
```
Authorization: Bearer {token}
```

Token expires in 7 days (configurable via `JWT_EXPIRES_IN`).

---

## Cost Information

Enhancement costs (approximate):

| Level | Tokens | Cost Range |
|-------|--------|------------|
| Quick | 2K-3K | $0.001-0.002 |
| Professional | 4K-7K | $0.003-0.005 |
| Premium | 8K-15K | $0.006-0.015 |

**Pricing:**
- xAI Grok: $0.20 per 1M input tokens, $0.50 per 1M output tokens

Track costs via `api_usage` table or response `cost` field.

---

## Examples

### Complete Workflow

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.token')

# 2. Upload document
DOC_ID=$(curl -s -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  | jq -r '.documentId')

# 3. Classify
curl -X POST http://localhost:3000/api/documents/$DOC_ID/classify \
  -H "Authorization: Bearer $TOKEN"

# 4. Analyze
curl -X POST http://localhost:3000/api/documents/$DOC_ID/analyze \
  -H "Authorization: Bearer $TOKEN"

# 5. Enhance
curl -X POST http://localhost:3000/api/documents/$DOC_ID/enhance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level":"professional"}'

# 6. Export
curl "http://localhost:3000/api/documents/$DOC_ID/export?format=docx" \
  -H "Authorization: Bearer $TOKEN" \
  -o enhanced.docx
```

---

For more examples, see:
- `examples/complete-workflow.js` - Full Node.js example
- `postman_collection.json` - Postman collection
- `QUICKSTART.md` - Quick start guide
