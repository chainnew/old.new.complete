# Starting Without Database (Quick Test)

Your backend is **compiling successfully** but needs PostgreSQL. Here's how to test without database or set it up.

---

## ✅ Option 1: Test Frontend Only (No Database Needed)

The **document editor frontend** works independently and can use mock AI responses!

### Start Frontend

```bash
cd doco-new.old.new
npm run dev
```

Then open: **http://localhost:5173/#editor**

The editor will work with:
- ✅ Document upload (client-side)
- ✅ Text editing
- ✅ Mock AI responses
- ✅ Export to DOCX/PDF/LaTeX/HTML

---

## ✅ Option 2: Set Up PostgreSQL (Full Functionality)

To get the full backend working with database:

### 1. Install PostgreSQL

**macOS (with Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Or use Postgres.app:** https://postgresapp.com/

### 2. Create Database & User

```bash
# Create postgres user if it doesn't exist
createuser -s postgres

# Or create a different user
createuser -s matto

# Create database
createdb oldnew_dev
```

### 3. Update Backend .env

Edit `backend/.env` and change database settings:

```bash
# If using your user instead of postgres
DB_USER=matto
DB_PASSWORD=
DB_NAME=oldnew_dev

# Or keep postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=oldnew_dev
```

### 4. Run Database Migration

```bash
cd backend
psql -d oldnew_dev -f src/database/schema.sql
```

### 5. Restart Backend

The backend should already be running. If not:

```bash
cd backend
npm run dev
```

### 6. Test Backend

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-02T..."}
```

---

## 🎯 Recommended: Start Frontend Now

While you're setting up the database, **start the frontend** which works independently:

```bash
cd doco-new.old.new
npm run dev
```

Open **http://localhost:5173/#editor** and start editing documents!

---

## 📝 What Works Without Database

### Frontend Editor:
- ✅ Document upload
- ✅ Text editing (Monaco/TipTap)
- ✅ AI chat (mock responses)
- ✅ Export to multiple formats
- ✅ Undo/Redo
- ✅ Auto-save (local storage)

### What Needs Database:
- ❌ User authentication
- ❌ Saving documents to server
- ❌ Real Grok AI enhancement
- ❌ Document history
- ❌ OAuth sign-in

---

## 🚀 Quick Start (No Database)

```bash
# Just start the frontend
cd doco-new.old.new
npm run dev

# Open browser
open http://localhost:5173/#editor
```

Upload a document and start editing with the AI assistant!

---

##  Backend Status

Your backend **IS working** - it just needs PostgreSQL configured. The TypeScript compilation errors are resolved!

**Current status:**
- ✅ TypeScript compiles
- ✅ Server starts
- ❌ Database connection needed

See [TEST_INSTRUCTIONS.md](TEST_INSTRUCTIONS.md) for full testing guide once database is set up.
