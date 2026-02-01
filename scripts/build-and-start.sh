#!/bin/bash

# 🚀 Dutch Vocabulary App - Docker Quick Start
# This script builds and starts the application with Docker

set -e  # Exit on error

echo "🇳🇱 Dutch Vocabulary App - Docker Startup"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker not found"
  echo "   Please install Docker from https://www.docker.com/get-started"
  exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
  echo "❌ Error: Docker Compose not found"
  echo "   Please install Docker Compose or upgrade Docker Desktop"
  exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo "✓ Docker Compose found: $(docker compose version)"
echo ""

# Check if .env file exists, if not create from .env.example
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "   You can edit .env to customize database credentials"
    echo ""
  else
    echo "⚠️  Warning: No .env file found"
    echo "   Using default environment variables"
    echo ""
  fi
else
  echo "✓ .env file found"
  echo ""
fi

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f infra/docker-compose.yml down 2>/dev/null || true
echo ""

# Build and start containers
echo "🏗️  Building Docker images..."
echo "   (This may take a few minutes the first time)"
echo ""
docker compose -f infra/docker-compose.yml build

echo ""
echo "🚀 Starting containers..."
docker compose -f infra/docker-compose.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if docker ps --filter "name=dutch-app" --filter "status=running" | grep -q "dutch-app"; then
  echo ""
  echo "✅ Application started successfully!"
  echo ""
  echo "📊 Services:"
  docker compose -f infra/docker-compose.yml ps
  echo ""
  echo "🌐 Your app is available at: http://localhost:3000"
  echo "🐘 PostgreSQL is running on: localhost:5432"
  echo ""
  echo "📝 Useful commands:"
  echo "   View logs:        docker compose -f infra/docker-compose.yml logs -f app"
  echo "   Stop app:         docker compose -f infra/docker-compose.yml down"
  echo "   Restart app:      docker compose -f infra/docker-compose.yml restart app"
  echo "   Import backup:    docker exec dutch-app node scripts/import-full-backup.js"
  echo ""
  echo "🎉 Happy learning Dutch! 🇳🇱"
else
  echo ""
  echo "❌ Error: Containers failed to start"
  echo "   Check logs with: docker compose -f infra/docker-compose.yml logs"
  exit 1
fi

