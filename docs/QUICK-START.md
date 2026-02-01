# 🚀 Quick Start Guide

## Getting Started in 2 Minutes

### Step 1: Install Docker
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 2: Clone & Start
```bash
git clone https://github.com/burakcetindev/dutch.git
cd dutch
./scripts/start.sh
```

### Step 3: Access the App
Open your browser to **http://localhost:3000**

That's it! 🎉

## What Happens Behind the Scenes

The `start.sh` script:
1. ✅ Checks if Docker is running
2. 🐳 Builds the Docker containers
3. 🗄️ Sets up PostgreSQL database
4. 📊 Runs database migrations
5. 📚 Imports vocabulary data
6. 🚀 Starts the Next.js application

## Useful Commands

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# Restart the app
docker-compose restart app

# Stop everything
docker-compose down

# Fresh start (removes all data!)
docker-compose down -v && ./scripts/start.sh
```

## Without Docker (Advanced)

If you prefer to run locally:

```bash
# Install Node.js 20+ and PostgreSQL 16+

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Setup database
createdb dutch_vocabulary

# Run migrations
npm run migrate

# Import data
npx tsx scripts/import-csv.ts

# Start dev server
npm run dev
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Change APP_PORT in .env
APP_PORT=3001

# Restart
docker-compose down
./scripts/start.sh
```

### Database Connection Error
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Fresh Install
```bash
# Remove all data and start fresh
docker-compose down -v
rm .env
./scripts/start.sh
```

## Next Steps

- 📖 Read the [full README](../README.md)
- 🏗️ Check out the [Architecture docs](ARCHITECTURE.md)
- 🔄 Learn about [Data Flow](DATA-FLOW.md)
