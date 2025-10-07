#!/bin/bash

# Old.New Backend Setup Script

set -e

echo "🚀 Old.New Backend Setup"
echo "========================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis is installed"
else
    echo "⚠️  Redis not found (optional, but recommended)"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📝 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env and add your XAI_API_KEY and database credentials"
else
    echo "⚠️  .env already exists, skipping"
fi

echo ""
echo "🗄️  Database setup..."
read -p "Enter PostgreSQL database name (default: oldnew_dev): " DB_NAME
DB_NAME=${DB_NAME:-oldnew_dev}

read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

# Create database
echo "Creating database $DB_NAME..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database may already exist"

# Run migrations
echo "Running migrations..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f src/database/schema.sql

# Update .env file
sed -i.bak "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
sed -i.bak "s/DB_USER=.*/DB_USER=$DB_USER/" .env
sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
rm .env.bak 2>/dev/null || true

echo ""
echo "📁 Creating directories..."
mkdir -p uploads temp logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your XAI_API_KEY"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000/api/health to verify"
echo ""
