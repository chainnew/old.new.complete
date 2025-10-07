# Getting Started with Old.New Backend

Welcome! This guide will get you up and running with the Old.New document enhancement backend in minutes.

## 📋 What You're Getting

A complete, production-ready REST API backend that:
- 📄 Accepts document uploads (DOCX, PDF, TXT, MD)
- 🤖 Uses xAI Grok to enhance documents
- 📊 Provides analysis and classification
- 📤 Exports to DOCX, LaTeX, HTML, TXT
- 🔐 Includes authentication and user management
- 💾 Uses PostgreSQL database
- ⚡ Redis caching and rate limiting

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites

Install these if you don't have them:
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download) (optional but recommended)
- xAI API key from [x.ai](https://x.ai)

### Step 2: Setup

```bash
cd backend

# Automated setup (recommended)
./scripts/setup.sh

# OR manual setup
npm install
cp .env.example .env
# Edit .env with your XAI_API_KEY
createdb oldnew_dev
psql -d oldnew_dev -f src/database/schema.sql
mkdir -p uploads temp logs
```

### Step 3: Configure

Edit `.env`:
```bash
XAI_API_KEY=your_xai_api_key_here  # Required!
DB_PASSWORD=your_password           # Required!
```

### Step 4: Verify Setup

```bash
./test-setup.sh
```

This checks all dependencies and configuration.

### Step 5: Start Server

```bash
npm run dev
```

Server runs at http://localhost:3000 🎉

## 🧪 Test the API

### Option 1: Use the Example Script

```bash
node examples/complete-workflow.js
```

This runs a full workflow:
1. Register/Login
2. Upload document
3. Classify & analyze
4. Enhance
5. Export to all formats

Check `examples/output/` for results!

### Option 2: Use Postman

1. Import `postman_collection.json`
2. Set baseUrl to `http://localhost:3000/api`
3. Run the requests

### Option 3: Use cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Save the token from response, then upload
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@yourfile.docx"

# Enhance document
curl -X POST http://localhost:3000/api/documents/DOC_ID/enhance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level":"professional"}'

# Export to LaTeX
curl "http://localhost:3000/api/documents/DOC_ID/export?format=latex" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o enhanced.tex
```

## 📚 Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/documents/upload` | POST | Upload document |
| `/api/documents/:id/classify` | POST | Classify document |
| `/api/documents/:id/analyze` | POST | Analyze document |
| `/api/documents/:id/enhance` | POST | Enhance document |
| `/api/documents/:id/export` | GET | Export document |
| `/api/health` | GET | Health check |

## 🎯 Enhancement Levels

Choose enhancement tier when enhancing:

### Quick ($5 tier)
```json
{"level": "quick"}
```
- Grammar & spelling fixes
- Basic improvements
- ~$0.001-0.002 per document

### Professional ($15 tier)
```json
{
  "level": "professional",
  "industry": "technology",
  "audience": "investors",
  "tone": "professional"
}
```
- All Quick features
- Tone adjustment
- Industry terminology
- ~$0.003-0.005 per document

### Premium ($30 tier)
```json
{
  "level": "premium",
  "industry": "finance",
  "tone": "formal",
  "specialInstructions": "Focus on ROI metrics"
}
```
- All Professional features
- Deep restructuring
- Strategic insights
- ~$0.006-0.015 per document

## 📁 Project Files

```
backend/
├── README.md                    # Full documentation
├── QUICKSTART.md               # Quick start guide
├── GETTING_STARTED.md          # This file
├── BACKEND_SUMMARY.md          # Complete summary
├── postman_collection.json     # Postman tests
├── test-setup.sh              # Setup verification
├── scripts/setup.sh           # Automated setup
├── examples/complete-workflow.js # Working example
└── src/                       # Source code
```

## 🔧 Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production build
npm run lint     # Check code quality
```

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# macOS: Start PostgreSQL
brew services start postgresql

# Linux: Start PostgreSQL
sudo systemctl start postgresql
```

### "XAI API Error"
- Verify your `XAI_API_KEY` in `.env`
- Check you have API credits at https://x.ai
- Ensure API key has no extra spaces

### "Port 3000 already in use"
Change port in `.env`:
```bash
PORT=3001
```

### "Redis connection failed"
Redis is optional. The app continues without it, but:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Or skip Redis
# App works fine without it
```

## 📖 Next Steps

### 1. Read the Documentation
- [README.md](backend/README.md) - Complete API documentation
- [QUICKSTART.md](backend/QUICKSTART.md) - Detailed quick start
- [BACKEND_SUMMARY.md](BACKEND_SUMMARY.md) - Implementation summary

### 2. Explore the Code
- `src/services/document/` - Document processing
- `src/services/llm/` - AI integration
- `src/controllers/` - API endpoints
- `src/database/schema.sql` - Database structure

### 3. Build Your Frontend
Connect your React/Vue/Angular frontend to these endpoints:

```javascript
// Example: Enhance a document
const enhance = async (documentId, level) => {
  const response = await fetch(`/api/documents/${documentId}/enhance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ level })
  });
  return await response.json();
};
```

### 4. Deploy to Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Set up SSL/TLS
- Configure reverse proxy (nginx)
- Use PM2 for process management

## 💡 Tips

1. **Monitor Costs**: Check `api_usage` table for token usage
2. **Watch Logs**: `tail -f logs/app.log`
3. **Debug Mode**: `LOG_LEVEL=debug npm run dev`
4. **Database Queries**: Use `psql -d oldnew_dev` for direct access

## 📊 What Can You Build?

With this backend, build:
- 📝 Resume enhancement service
- 📄 Academic paper polisher
- 💼 Business proposal generator
- ✍️ Content optimization platform
- 🎓 Essay improvement tool
- 📧 Email writing assistant

## 🎉 You're Ready!

The backend is complete and ready for your frontend. Start building your app!

### Useful Commands

```bash
# Verify everything works
./test-setup.sh

# Start dev server
npm run dev

# Run example workflow
node examples/complete-workflow.js

# Watch logs
tail -f logs/app.log

# Access database
psql -d oldnew_dev
```

## 🆘 Need Help?

1. Check logs: `logs/app.log`
2. Verify setup: `./test-setup.sh`
3. Review docs: `README.md`
4. Test API: Import `postman_collection.json`

---

**Happy Coding! 🚀**

Built with xAI Grok, Node.js, TypeScript & PostgreSQL
