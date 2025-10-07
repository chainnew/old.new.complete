# 🚀 START HERE

Welcome to the Old.New backend! This is your **5-minute quick start guide**.

## What You Have

A complete, production-ready backend API for AI-powered document enhancement:
- ✅ Upload documents (DOCX, PDF, TXT, MD)
- ✅ AI analysis & classification
- ✅ 3-tier enhancement (Quick/Pro/Premium)
- ✅ Export to DOCX, LaTeX, HTML, TXT
- ✅ Full authentication & database
- ✅ Complete documentation

## Quick Start (5 Minutes)

### Step 1: Prerequisites

Make sure you have:
- ✅ Node.js 18+ ([download](https://nodejs.org))
- ✅ PostgreSQL 14+ ([download](https://www.postgresql.org/download/))
- ✅ xAI API key ([get it here](https://x.ai))
- ⚠️ Redis (optional but recommended)

### Step 2: Setup

```bash
cd backend

# Automated setup (easiest)
./scripts/setup.sh

# Or manual setup
npm install
cp .env.example .env
# Edit .env with your XAI_API_KEY
createdb oldnew_dev
psql -d oldnew_dev -f src/database/schema.sql
```

### Step 3: Configure

Edit `backend/.env`:
```bash
XAI_API_KEY=your_xai_api_key_here  # ← Add your key!
DB_PASSWORD=postgres                # ← Your PostgreSQL password
```

### Step 4: Verify Setup

```bash
./test-setup.sh
```

This checks everything is configured correctly.

### Step 5: Start Server

```bash
npm run dev
```

✅ Server running at http://localhost:3000

### Step 6: Test It!

```bash
# Run complete workflow example
node examples/complete-workflow.js

# Check examples/output/ for results!
```

🎉 **Done!** You just enhanced a document with AI.

## What Just Happened?

The example script:
1. ✅ Registered a user
2. ✅ Uploaded a document
3. ✅ Classified it (identified type)
4. ✅ Analyzed it (readability, grammar)
5. ✅ Enhanced it (AI improvements)
6. ✅ Exported to DOCX, LaTeX, HTML, TXT

Check `backend/examples/output/` to see the results!

## Next Steps

### Option 1: Try the API Yourself

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"test123"}'

# Upload a document
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@yourfile.pdf"

# Enhance it
curl -X POST http://localhost:3000/api/documents/DOC_ID/enhance \
  -H "Content-Type: application/json" \
  -d '{"level":"professional"}'
```

### Option 2: Use Postman

1. Import `backend/postman_collection.json`
2. Set `baseUrl` to `http://localhost:3000/api`
3. Run the requests!

### Option 3: Build Your Frontend

The backend is ready for your frontend! See:
- **API Docs:** [backend/API_REFERENCE.md](backend/API_REFERENCE.md)
- **Examples:** [GETTING_STARTED.md](GETTING_STARTED.md#frontend-integration)

## 📚 Documentation

| What You Need | Where to Look |
|---------------|---------------|
| **Complete setup guide** | [GETTING_STARTED.md](GETTING_STARTED.md) |
| **All API endpoints** | [backend/API_REFERENCE.md](backend/API_REFERENCE.md) |
| **System architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Full backend docs** | [backend/README.md](backend/README.md) |
| **Find anything** | [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) |
| **What was built** | [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) |

## 🔌 API Endpoints

### Authentication
```bash
POST /api/auth/register  # Register user
POST /api/auth/login     # Login user
```

### Documents
```bash
POST /api/documents/upload           # Upload document
POST /api/documents/:id/classify     # Classify type
POST /api/documents/:id/analyze      # Analyze quality
POST /api/documents/:id/enhance      # AI enhancement
GET  /api/documents/:id/export       # Export (DOCX/LaTeX/HTML)
```

## 💰 Enhancement Tiers

| Tier | Features | Cost |
|------|----------|------|
| **Quick** | Grammar, spelling, basics | ~$0.001 |
| **Professional** | + Tone, structure, industry terms | ~$0.004 |
| **Premium** | + Deep restructure, insights | ~$0.010 |

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
pg_isready  # Check PostgreSQL is running
```

### "XAI API Error"
- Check your API key in `.env`
- Verify you have credits at https://x.ai

### "Port 3000 already in use"
Change in `.env`: `PORT=3001`

### Still stuck?
```bash
./test-setup.sh  # Run diagnostics
tail -f logs/app.log  # Check logs
```

## 🎯 What You Can Build

With this backend, you can create:

1. **Document Enhancement SaaS** - Upload, enhance, export
2. **Resume Polish Service** - Professional resume improvement
3. **Academic Paper Improver** - LaTeX-ready enhancement
4. **Business Proposal Generator** - Industry-specific optimization
5. **Content Writing Assistant** - Real-time suggestions
6. **Whatever you imagine!** - The API is complete

## 🚀 Deploy to Production

When ready to deploy:

```bash
# Build
npm run build

# Run with PM2
npm install -g pm2
pm2 start dist/server.js --name oldnew-api
```

See [backend/README.md#deployment](backend/README.md#deployment) for full guide.

## 📊 Monitor Costs

```bash
# Database costs query
psql -d oldnew_dev -c "
SELECT DATE(created_at), SUM(cost), COUNT(*)
FROM api_usage
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
"
```

## ✅ Checklist

- [ ] Installed Node.js, PostgreSQL, Redis
- [ ] Got xAI API key from x.ai
- [ ] Ran `./scripts/setup.sh`
- [ ] Added `XAI_API_KEY` to `.env`
- [ ] Ran `./test-setup.sh` (all green ✅)
- [ ] Started server: `npm run dev`
- [ ] Tested: `node examples/complete-workflow.js`
- [ ] Checked `examples/output/` folder
- [ ] Ready to build frontend! 🎉

## 🎉 You're Done!

Your backend is running and ready. Now build your frontend and launch your app!

---

**Need help?** → [GETTING_STARTED.md](GETTING_STARTED.md)

**API reference?** → [backend/API_REFERENCE.md](backend/API_REFERENCE.md)

**Architecture?** → [ARCHITECTURE.md](ARCHITECTURE.md)

**Lost?** → [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

**Happy coding! 🚀**
