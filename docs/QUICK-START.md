# 🚀 Quick Start Guide

## Getting Started in 2 Minutes

### Step 1: Install Docker
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 2: Clone & First Run
```bash
git clone https://github.com/burakcetindev/dutch.git
cd dutch

# First time only - sets up everything
./scripts/first-run.sh
```

### Step 3: Build and Start
```bash
# First time only - builds Docker images
./scripts/build-and-start.sh
```

### Step 4: Daily Starts
```bash
# Use this for subsequent starts (much faster!)
./scripts/start.sh
```

### Step 4: Access the App
Open your browser to **http://localhost:3000**

That's it! 🎉

## What Happens Behind the Scenes

The `first-run.sh` script:
1. ✅ Creates `.env` file with default settings
2. 📦 Installs npm dependencies
3. 📁 Creates required directories
4. ✅ Validates environment setup

The `build-and-start.sh` script (first time):
1. ✅ Checks if Docker is running
2. 🐳 Builds Docker images from infra/
3. 🗄️ Sets up PostgreSQL database
4. 📚 Loads vocabulary data (605 words)
5. 🚀 Starts the Next.js application

The `start.sh` script (daily use):
1. ✅ Checks if Docker is running
2. 🚀 Starts existing containers (no build - fast!)
3. ✅ Verifies services are healthy

## Useful Commands

```bash
# View application logs
docker compose -f infra/docker-compose.yml logs -f app

# View database logs
docker compose -f infra/docker-compose.yml logs -f db

# Restart the app
docker compose -f infra/docker-compose.yml restart app

# Stop everything
docker compose -f infra/docker-compose.yml down

# Fresh start (removes all data!)
docker compose -f infra/docker-compose.yml down -v && ./scripts/start.sh
```

## Without Docker (Advanced)

If you prefer to run locally:

```bash
# Install Node.js 20+ and PostgreSQL 16+

# Run first-time setup (creates .env and installs dependencies)
./scripts/first-run.sh

# Setup database (if not using Docker)
createdb dutch_vocabulary

# Run migrations
npm run migrate

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
docker compose -f infra/docker-compose.yml ps

# View database logs
docker compose -f infra/docker-compose.yml logs db

# Restart database
docker compose -f infra/docker-compose.yml restart db
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
