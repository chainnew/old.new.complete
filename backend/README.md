# Old.New Backend API

AI-powered document enhancement platform backend built with Node.js, TypeScript, PostgreSQL, and xAI Grok.

## Features

- 📄 **Document Processing**: Upload and parse DOCX, PDF, TXT, MD files
- 🤖 **AI-Powered Enhancement**: Three tiers (Quick, Professional, Premium)
- 🔍 **Document Analysis**: Readability, clarity, grammar analysis
- 📊 **Classification**: Automatic document type detection
- 📤 **Export Formats**: DOCX, LaTeX, HTML, TXT
- 🔐 **Authentication**: JWT-based auth with role management
- 💾 **Database**: PostgreSQL with full schema
- ⚡ **Caching**: Redis for rate limiting and caching
- 📝 **Logging**: Winston-based comprehensive logging

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+ (optional but recommended)
- xAI API key (get from https://x.ai)

## Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Required
XAI_API_KEY=your_xai_api_key_here
DB_PASSWORD=your_postgres_password

# Optional (defaults provided)
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

Create PostgreSQL database:

```bash
createdb oldnew_dev
```

Run migrations:

```bash
psql -U postgres -d oldnew_dev -f src/database/schema.sql
```

### 4. Start Redis (Optional)

```bash
# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis
```

### 5. Run Development Server

```bash
npm run dev
```

Server will start at http://localhost:3000

### 6. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### Register
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

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response includes JWT token - use in subsequent requests:
```http
Authorization: Bearer <token>
```

### Documents

#### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token> (optional)

file: <document.docx|pdf|txt|md>
```

Response:
```json
{
  "documentId": "uuid",
  "text": "extracted text...",
  "metadata": {
    "wordCount": 1500,
    "pageCount": 5,
    "detectedLanguage": "en",
    ...
  }
}
```

#### Classify Document
```http
POST /api/documents/:documentId/classify
Authorization: Bearer <token> (optional)
```

Response:
```json
{
  "type": "business_proposal",
  "confidence": 0.95,
  "industry": "technology",
  "suggestedTone": "professional"
}
```

#### Analyze Document
```http
POST /api/documents/:documentId/analyze
Authorization: Bearer <token> (optional)
```

Response:
```json
{
  "readabilityScore": 75,
  "clarityScore": 80,
  "grammarIssues": 12,
  "sentenceComplexity": "moderate",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}
```

#### Enhance Document
```http
POST /api/documents/:documentId/enhance
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "level": "professional",
  "industry": "technology",
  "audience": "investors",
  "tone": "professional",
  "specialInstructions": "Focus on ROI"
}
```

Enhancement levels:
- `quick`: $5 tier - Grammar, spelling, basic improvements
- `professional`: $15 tier - All Quick + tone, structure, terminology
- `premium`: $30 tier - All Professional + deep restructuring, insights

Response:
```json
{
  "enhancementId": "uuid",
  "enhancedText": "improved document...",
  "changes": [...],
  "summary": {
    "totalChanges": 47,
    "improvementScore": 68
  },
  "cost": 0.00234,
  "tokensUsed": 4500
}
```

#### Export Document
```http
GET /api/documents/:documentId/export?format=docx&title=My%20Document&author=John%20Doe
Authorization: Bearer <token> (optional)
```

Formats: `docx`, `latex`, `html`, `txt`

Downloads file directly.

#### Get Document Details
```http
GET /api/documents/:documentId
Authorization: Bearer <token> (optional)
```

#### List User Documents
```http
GET /api/documents?limit=20&offset=0
Authorization: Bearer <token> (required)
```

## Architecture

### Services

- **DocumentParser**: Handles DOCX, PDF, TXT, MD parsing with OCR support
- **DocumentClassifier**: AI-powered document type detection
- **DocumentAnalyzer**: Readability and quality analysis
- **DocumentEnhancer**: Three-tier enhancement system
- **DocumentFormatter**: Export to DOCX, LaTeX, HTML
- **LLMService**: Abstraction layer for AI providers (xAI Grok)

### Database Schema

- **users**: User accounts and authentication
- **documents**: Uploaded and processed documents
- **document_classifications**: AI classification results
- **document_analyses**: Analysis results
- **document_enhancements**: Enhancement history
- **track_changes**: Individual change tracking
- **api_usage**: Cost and usage tracking
- **feedback**: User feedback (optional)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment (development/production) |
| PORT | No | 3000 | Server port |
| DB_HOST | No | localhost | PostgreSQL host |
| DB_PORT | No | 5432 | PostgreSQL port |
| DB_NAME | Yes | - | Database name |
| DB_USER | Yes | - | Database user |
| DB_PASSWORD | Yes | - | Database password |
| REDIS_HOST | No | localhost | Redis host |
| REDIS_PORT | No | 6379 | Redis port |
| JWT_SECRET | Yes | - | JWT signing secret |
| XAI_API_KEY | Yes | - | xAI API key |
| XAI_MODEL | No | grok-4-fast-reasoning-20251001 | Grok model version |
| MAX_FILE_SIZE_MB | No | 10 | Max upload file size |

### Rate Limiting

Default: 100 requests per 15 minutes per IP
Configure in `.env`:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection & schema
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── document/    # Document processing
│   │   ├── llm/         # AI service abstraction
│   │   └── output/      # Output formatters
│   ├── utils/           # Utilities (logger, redis)
│   └── server.ts        # Entry point
├── uploads/             # Uploaded files
├── temp/                # Temporary files
├── logs/                # Application logs
└── package.json
```

### Scripts

```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start            # Run production build
npm run lint         # Run ESLint
npm test             # Run tests
```

## Testing

### Manual Testing with cURL

Upload a document:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.docx"
```

Enhance document:
```bash
curl -X POST http://localhost:3000/api/documents/DOC_ID/enhance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level":"professional","tone":"professional"}'
```

Export to LaTeX:
```bash
curl -X GET "http://localhost:3000/api/documents/DOC_ID/export?format=latex&title=My%20Document" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o document.tex
```

## Deployment

### Docker (Coming Soon)

```bash
docker-compose up -d
```

### Manual Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Build: `npm run build`
4. Start: `npm start`
5. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name oldnew-api
   ```

## Cost Optimization

The platform tracks token usage and costs:

- Quick: ~2-3K tokens (~$0.001-0.002)
- Professional: ~4-7K tokens (~$0.003-0.005)
- Premium: ~8-15K tokens (~$0.006-0.015)

xAI Grok pricing: $0.20/M input + $0.50/M output tokens

Monitor costs in `api_usage` table:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost
FROM api_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Troubleshooting

### Database connection fails
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l | grep oldnew`

### Redis connection fails
- Redis is optional; app continues without it
- Check Redis: `redis-cli ping` (should return PONG)

### File upload fails
- Check `MAX_FILE_SIZE_MB` in `.env`
- Verify `uploads/` and `temp/` directories exist
- Check disk space

### AI enhancement fails
- Verify `XAI_API_KEY` is set correctly
- Check xAI API status
- Review logs in `logs/app.log`

## License

MIT

## Support

For issues and questions:
- Check logs: `tail -f logs/app.log`
- Database health: `GET /api/health`
- Enable debug logging: `LOG_LEVEL=debug`
