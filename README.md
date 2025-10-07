# Old.New - AI-Powered Document Enhancement Platform

A complete backend API for enhancing documents using xAI Grok. Upload documents, get AI-powered analysis, classification, and enhancement with export to multiple formats.

## 🎯 What's Built

✅ **Complete Backend API** - Production-ready REST API with TypeScript
✅ **Document Processing** - DOCX, PDF, TXT, MD support with OCR
✅ **AI Enhancement** - 3-tier system (Quick/Professional/Premium)
✅ **Multiple Exports** - DOCX, LaTeX, HTML, TXT output
✅ **Authentication** - JWT-based user management
✅ **Database** - PostgreSQL with complete schema
✅ **Caching & Rate Limiting** - Redis integration
✅ **Cost Tracking** - Token usage and cost monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- xAI API key from [x.ai](https://x.ai)
- Redis (optional)

### Setup (2 minutes)

```bash
cd backend

# Automated setup
./scripts/setup.sh

# Start server
npm run dev
```

Server runs at http://localhost:3000 🎉

### Test It

```bash
# Run complete workflow example
node examples/complete-workflow.js

# Check examples/output/ for results
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[GETTING_STARTED.md](GETTING_STARTED.md)** | ⭐ Start here - Complete setup guide |
| **[backend/README.md](backend/README.md)** | Full backend documentation |
| **[backend/QUICKSTART.md](backend/QUICKSTART.md)** | Quick start guide |
| **[BACKEND_SUMMARY.md](BACKEND_SUMMARY.md)** | Implementation summary |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture diagrams |
| **[backend/API_REFERENCE.md](backend/API_REFERENCE.md)** | Complete API reference |

## 🔌 API Overview

### Authentication
```bash
POST /api/auth/register  # Register user
POST /api/auth/login     # Login user
GET  /api/auth/profile   # Get profile
```

### Documents
```bash
POST /api/documents/upload           # Upload document
POST /api/documents/:id/classify     # Classify type
POST /api/documents/:id/analyze      # Analyze quality
POST /api/documents/:id/enhance      # AI enhancement
GET  /api/documents/:id/export       # Export (DOCX/LaTeX/HTML)
GET  /api/documents/:id              # Get details
GET  /api/documents                  # List documents
```

## 💡 Enhancement Tiers

| Tier | Price | Features | Cost |
|------|-------|----------|------|
| **Quick** | $5 | Grammar, spelling, basic fixes | ~$0.001-0.002 |
| **Professional** | $15 | + Tone, structure, industry terms | ~$0.003-0.005 |
| **Premium** | $30 | + Deep restructure, insights | ~$0.006-0.015 |

## 🧪 Testing

### Option 1: Example Script
```bash
node examples/complete-workflow.js
```

### Option 2: Postman
Import `backend/postman_collection.json`

### Option 3: cURL
```bash
# Upload
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.pdf"

# Enhance
curl -X POST http://localhost:3000/api/documents/DOC_ID/enhance \
  -H "Content-Type: application/json" \
  -d '{"level":"professional"}'

# Export to LaTeX
curl "http://localhost:3000/api/documents/DOC_ID/export?format=latex" \
  -o enhanced.tex
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/        # Business logic
│   │   ├── llm/        # AI abstraction
│   │   ├── document/   # Processing
│   │   └── output/     # Formatters
│   ├── database/       # PostgreSQL
│   ├── middleware/     # Auth, upload, etc.
│   └── routes/         # API routes
├── examples/           # Working examples
├── scripts/           # Setup scripts
└── postman_collection.json
```

## 🛠️ Technology Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Cache:** Redis
- **AI:** xAI Grok (provider-agnostic design)
- **Auth:** JWT
- **Parsing:** Mammoth (DOCX), pdf-parse (PDF), Tesseract (OCR)
- **Output:** docx library (DOCX), custom LaTeX/HTML

## 🎯 Features

### Document Processing
- ✅ Upload DOCX, PDF, TXT, MD files
- ✅ OCR for scanned PDFs
- ✅ Language detection (12+ languages)
- ✅ Structure extraction

### AI Analysis
- ✅ Document classification (14+ types)
- ✅ Readability & clarity scoring
- ✅ Grammar analysis
- ✅ Complexity assessment

### Enhancement
- ✅ 3-tier enhancement system
- ✅ Industry-specific optimization
- ✅ Audience-targeted adjustments
- ✅ Track changes

### Export
- ✅ DOCX (Microsoft Word)
- ✅ LaTeX (publication-ready)
- ✅ HTML (web-ready)
- ✅ TXT (plain text)

## 🔐 Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- File upload restrictions
- SQL injection protection (parameterized queries)

## 📊 Monitoring

```bash
# Watch logs
tail -f backend/logs/app.log

# Debug mode
LOG_LEVEL=debug npm run dev

# Database costs
psql -d oldnew_dev -c "
SELECT DATE(created_at), SUM(cost), COUNT(*)
FROM api_usage
GROUP BY DATE(created_at);
"
```

## 🚀 Deployment

```bash
# Build
cd backend
npm run build

# Production
NODE_ENV=production npm start

# PM2 (recommended)
npm install -g pm2
pm2 start dist/server.js --name oldnew-api
```

## 🔧 Configuration

Key environment variables:

```bash
# Required
XAI_API_KEY=your_xai_api_key
DB_PASSWORD=your_password
JWT_SECRET=your_secret

# Optional (defaults provided)
PORT=3000
NODE_ENV=development
```

See `backend/.env.example` for all options.

## 📈 What You Can Build

With this backend, create:

1. **Document Enhancement SaaS**
2. **Resume Polish Service**
3. **Academic Paper Improver**
4. **Business Proposal Generator**
5. **Content Optimization Platform**
6. **Writing Assistant**

## 🎨 Frontend Integration

```javascript
// Example: Upload and enhance
async function enhanceDocument(file) {
  // Upload
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });
  const { documentId } = await uploadRes.json();

  // Enhance
  const enhanceRes = await fetch(`/api/documents/${documentId}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'professional' })
  });
  const { enhancedText, changes, cost } = await enhanceRes.json();

  return { enhancedText, changes, cost };
}
```

## 🐛 Troubleshooting

### Database Issues
```bash
# Check PostgreSQL
pg_isready

# Verify connection
psql -d oldnew_dev -c "\dt"
```

### XAI API Issues
- Verify API key in `.env`
- Check credits at https://x.ai

### Setup Verification
```bash
cd backend
./test-setup.sh
```

## 📞 Support

- **Setup Guide:** [GETTING_STARTED.md](GETTING_STARTED.md)
- **API Docs:** [backend/API_REFERENCE.md](backend/API_REFERENCE.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Logs:** `backend/logs/app.log`

## 🎉 Next Steps

1. **Read:** [GETTING_STARTED.md](GETTING_STARTED.md)
2. **Setup:** Run `./scripts/setup.sh`
3. **Test:** Run `node examples/complete-workflow.js`
4. **Build:** Connect your frontend
5. **Deploy:** Follow deployment guide

## 📝 License

MIT

---

**Built with ❤️ using xAI Grok, Node.js, TypeScript & PostgreSQL**

Ready to enhance documents with AI! 🚀
