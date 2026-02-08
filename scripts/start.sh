#!/bin/bash

# 🚀 Dutch Vocabulary App - Quick Start (No Build)
# This script starts existing Docker containers without rebuilding

set -e  # Exit on error

echo "🇳🇱 Dutch Vocabulary App - Quick Start"
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

# Check if .env file exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
  else
    echo "⚠️  Warning: No .env file found, using defaults"
    echo ""
  fi
else
  echo "✓ .env file found"
  echo ""
fi

# Start containers using existing image (no rebuild)
echo "🚀 Starting containers (using cached image)..."
docker compose -f infra/docker-compose.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if docker ps --filter "name=dutch-vocab-app" --filter "status=running" | grep -q "dutch-vocab-app"; then
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
  echo "   View logs:        docker compose -f infra/docker-compose.yml logs -f vocab"
  echo "   Stop app:         docker compose -f infra/docker-compose.yml down"
  echo "   Restart app:      docker compose -f infra/docker-compose.yml restart vocab"
  echo "   Rebuild:          ./scripts/build-and-start.sh"
  echo ""
  echo "🎉 Happy learning Dutch! 🇳🇱"
else
  echo ""
  echo "❌ Error: Containers failed to start"
  echo "   Try rebuilding with: ./scripts/build-and-start.sh"
  echo "   Or check logs: docker compose -f infra/docker-compose.yml logs"
  exit 1
fi
