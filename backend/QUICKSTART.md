# Quick Start Guide

Get the Old.New backend running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed (`psql --version`)
- [ ] xAI API key from https://x.ai
- [ ] Redis (optional, recommended)

## Option 1: Automated Setup (Recommended)

```bash
cd backend
./scripts/setup.sh
```

This will:
1. Install dependencies
2. Create `.env` file
3. Setup database
4. Create necessary directories

Then:
1. Edit `.env` and add your `XAI_API_KEY`
2. Run `npm run dev`

## Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Required - Get from https://x.ai
XAI_API_KEY=your_xai_api_key_here

# Database
DB_NAME=oldnew_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Optional (defaults work)
PORT=3000
NODE_ENV=development
```

### 3. Setup Database

```bash
# Create database
createdb oldnew_dev

# Run migrations
psql -U postgres -d oldnew_dev -f src/database/schema.sql
```

### 4. Create Directories

```bash
mkdir -p uploads temp logs
```

### 5. Start Server

```bash
npm run dev
```

## Testing the API

### 1. Check Health
```bash
curl http://localhost:3000/api/health
```

### 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Save the `token` from the response.

### 3. Upload a Document

Create a test file:
```bash
echo "This is a test document. It has some text that needs improvement." > test.txt
```

Upload it:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```

Save the `documentId` from the response.

### 4. Enhance the Document

```bash
curl -X POST http://localhost:3000/api/documents/YOUR_DOC_ID/enhance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "quick"
  }'
```

### 5. Export to DOCX

```bash
curl -X GET "http://localhost:3000/api/documents/YOUR_DOC_ID/export?format=docx" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o enhanced.docx
```

### 6. Export to LaTeX

```bash
curl -X GET "http://localhost:3000/api/documents/YOUR_DOC_ID/export?format=latex&title=My%20Document" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o enhanced.tex
```

## Using Postman

1. Import `postman_collection.json`
2. Set `baseUrl` to `http://localhost:3000/api`
3. Run "Register" or "Login" (token auto-saved)
4. Upload a document
5. Run enhance/export endpoints

## Common Issues

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# If not running (macOS):
brew services start postgresql@14

# Ubuntu/Debian:
sudo systemctl start postgresql
```

### Port 3000 Already in Use
Change port in `.env`:
```bash
PORT=3001
```

### XAI API Error
- Verify your API key is correct
- Check you have API credits
- Test at https://api.x.ai

### Missing Dependencies
```bash
npm install
```

## Next Steps

1. **Build Frontend**: Connect your React/Vue/etc frontend to the API
2. **Explore API**: Check [README.md](README.md) for full API docs
3. **Customize**: Modify prompts in `src/services/` for your use case
4. **Deploy**: Follow deployment guide in README

## Development Tips

### Watch Logs
```bash
tail -f logs/app.log
```

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

### Database Queries
```bash
psql -U postgres -d oldnew_dev
```

Useful queries:
```sql
-- View recent documents
SELECT id, original_filename, document_type, status, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- Check API costs
SELECT DATE(created_at) as date,
       COUNT(*) as requests,
       SUM(cost) as total_cost
FROM api_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View enhancements
SELECT enhancement_level,
       AVG(cost) as avg_cost,
       AVG(tokens_used) as avg_tokens
FROM document_enhancements
GROUP BY enhancement_level;
```

## API Workflow

```
1. Register/Login → Get JWT token
2. Upload document → Get documentId
3. Classify document (optional)
4. Analyze document (optional)
5. Enhance document → Get enhanced text
6. Export to DOCX/LaTeX/HTML
```

## Support

- Full docs: [README.md](README.md)
- Database schema: [src/database/schema.sql](src/database/schema.sql)
- API routes: [src/routes/index.ts](src/routes/index.ts)

Happy coding! 🚀
