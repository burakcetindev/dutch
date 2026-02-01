#!/bin/bash

# 🚀 Dutch Vocabulary App - First Run Setup
# This script initializes all necessary files and directories

set -e  # Exit on error

echo "🇳🇱 Dutch Vocabulary App - First Run Setup"
echo ""
echo "This script will:"
echo "  1. Create necessary environment files"
echo "  2. Create required directories"
echo "  3. Install dependencies"
echo "  4. Set up the database"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js not found"
  echo "   Please install Node.js from https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js: $(node --version)"
echo "✓ npm: $(npm --version)"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file..."
  cat > .env << 'EOF'
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://dutch_user:dutch_password@localhost:5432/dutch_vocabulary

# PostgreSQL Docker Environment (used by docker-compose)
POSTGRES_USER=dutch_user
POSTGRES_PASSWORD=dutch_password
POSTGRES_DB=dutch_vocabulary
POSTGRES_PORT=5432

# App Configuration
APP_PORT=3000
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Feature Flags
ENABLE_BACKUP_EXPORT=true
ENABLE_STATISTICS=true
EOF
  echo "✅ .env file created"
  echo ""
else
  echo "✓ .env file already exists"
  echo ""
fi

# Create .env.local for local development (if using local PostgreSQL)
if [ ! -f ".env.local" ]; then
  echo "📝 Creating .env.local for local development..."
  cat > .env.local << 'EOF'
# Local development - change these if you have a different local PostgreSQL setup
DATABASE_URL=postgresql://dutch_user:dutch_password@localhost:5432/dutch_vocabulary
EOF
  echo "✅ .env.local created"
  echo ""
else
  echo "✓ .env.local already exists"
  echo ""
fi

# Create public directory
if [ ! -d "public" ]; then
  echo "📁 Creating public directory..."
  mkdir -p public
  touch public/.gitkeep
  echo "✅ public directory created"
  echo ""
else
  echo "✓ public directory already exists"
  echo ""
fi

# Create input directory if it doesn't exist
if [ ! -d "input" ]; then
  echo "📁 Creating input directory..."
  mkdir -p input
  touch input/.gitkeep
  echo "✅ input directory created"
  echo ""
else
  echo "✓ input directory already exists"
  echo ""
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
else
  echo "✓ node_modules already exist"
  echo ""
fi

# Check for PostgreSQL
echo "🔍 Checking database setup..."
if command -v psql &> /dev/null; then
  echo "✓ PostgreSQL client (psql) found"
  
  # Try to connect to local PostgreSQL
  if psql -U dutch_user -d dutch_vocabulary -c "SELECT 1" &>/dev/null 2>&1; then
    echo "✓ Database connection successful"
    echo "  Running migrations..."
    npm run migrate
    echo ""
  else
    echo "⚠️  Could not connect to local PostgreSQL"
    echo "   Options:"
    echo "   1. Install PostgreSQL: https://www.postgresql.org/download/"
    echo "   2. Or use Docker: ./scripts/start.sh (recommended)"
    echo ""
    echo "   To set up PostgreSQL locally:"
    echo "   - Create user: createuser -P dutch_user"
    echo "   - Create database: createdb -O dutch_user dutch_vocabulary"
    echo "   - Then run: npm run migrate"
    echo ""
  fi
else
  echo "⚠️  PostgreSQL client not found - you can still use Docker"
  echo "   Run './scripts/start.sh' to use Docker (recommended)"
  echo ""
fi

echo "✅ First run setup complete!"
echo ""
echo "📌 Next steps:"
echo ""
echo "Option 1: Use Docker (Recommended)"
echo "  $ ./scripts/start.sh"
echo "  Then visit: http://localhost:3000"
echo ""
echo "Option 2: Local PostgreSQL Setup"
echo "  1. Install PostgreSQL locally"
echo "  2. Create database: createdb -O dutch_user dutch_vocabulary"
echo "  3. Run migrations: npm run migrate"
echo "  4. Start app: npm run dev"
echo "  5. Visit: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Quick start and features"
echo "  - docs/ARCHITECTURE.md - System architecture"
echo "  - docs/DATA-FLOW.md - Data flow diagrams"
echo ""
echo "🎉 Happy learning Dutch! 🇳🇱"
echo ""
