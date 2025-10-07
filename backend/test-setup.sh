#!/bin/bash

# Old.New Backend Setup Verification Script

echo "🔍 Old.New Backend Setup Verification"
echo "====================================="
echo ""

FAILED=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo "✅ $VERSION"
else
    echo "❌ Not found"
    FAILED=1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo "✅ v$VERSION"
else
    echo "❌ Not found"
    FAILED=1
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    VERSION=$(psql --version | awk '{print $3}')
    echo "✅ v$VERSION"
else
    echo "❌ Not found"
    FAILED=1
fi

# Check Redis (optional)
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        VERSION=$(redis-cli --version | awk '{print $2}')
        echo "✅ $VERSION (running)"
    else
        echo "⚠️  Installed but not running"
    fi
else
    echo "⚠️  Not found (optional)"
fi

echo ""

# Check .env file
echo -n "Checking .env file... "
if [ -f .env ]; then
    echo "✅ Found"

    # Check for required variables
    echo "  Checking required environment variables:"

    if grep -q "XAI_API_KEY=your_xai_api_key_here" .env || ! grep -q "XAI_API_KEY=" .env; then
        echo "    ❌ XAI_API_KEY not configured"
        FAILED=1
    else
        echo "    ✅ XAI_API_KEY configured"
    fi

    if grep -q "DB_PASSWORD=" .env; then
        echo "    ✅ DB_PASSWORD configured"
    else
        echo "    ❌ DB_PASSWORD not configured"
        FAILED=1
    fi

    if grep -q "JWT_SECRET=" .env; then
        echo "    ✅ JWT_SECRET configured"
    else
        echo "    ⚠️  JWT_SECRET using default (change in production)"
    fi
else
    echo "❌ Not found"
    echo "  Run: cp .env.example .env"
    FAILED=1
fi

echo ""

# Check node_modules
echo -n "Checking dependencies... "
if [ -d node_modules ]; then
    echo "✅ Installed"
else
    echo "❌ Not installed"
    echo "  Run: npm install"
    FAILED=1
fi

echo ""

# Check directories
echo "Checking directories:"
for dir in uploads temp logs; do
    echo -n "  $dir/... "
    if [ -d $dir ]; then
        echo "✅"
    else
        echo "❌ (will be created on startup)"
    fi
done

echo ""

# Check database connection
echo -n "Checking database connection... "
if [ -f .env ]; then
    source .env
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
        echo "✅ Connected"

        # Check if schema is loaded
        TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

        if [ "$TABLES" -gt 0 ]; then
            echo "  ✅ Schema loaded ($TABLES tables)"
        else
            echo "  ❌ Schema not loaded"
            echo "    Run: psql -U $DB_USER -d $DB_NAME -f src/database/schema.sql"
            FAILED=1
        fi
    else
        echo "❌ Cannot connect"
        echo "  Check database credentials in .env"
        FAILED=1
    fi
else
    echo "⚠️  Cannot test (no .env file)"
fi

echo ""

# Test TypeScript compilation
echo -n "Testing TypeScript compilation... "
if npm run build &> /dev/null; then
    echo "✅ Passed"
else
    echo "❌ Failed"
    echo "  Check for TypeScript errors"
    FAILED=1
fi

echo ""
echo "====================================="

if [ $FAILED -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "You're ready to start the server:"
    echo "  npm run dev"
    echo ""
    exit 0
else
    echo "❌ Some checks failed"
    echo ""
    echo "Please fix the issues above before starting the server."
    echo "See QUICKSTART.md for setup instructions."
    echo ""
    exit 1
fi
