#!/bin/bash

# AI Newsletter Generator - Start Script
# This script cleans ports, creates the database, seeds data, and starts both backend and frontend with hot reload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       AI Newsletter Generator - Startup           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Load .env file
if [ -f "$ENV_FILE" ]; then
  echo -e "${GREEN}✓ Loading environment variables from .env${NC}"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo -e "${RED}✗ .env file not found at $ENV_FILE${NC}"
  echo -e "${YELLOW}  Please create a .env file with your configuration${NC}"
  exit 1
fi

# ─── Step 1: Clean up used ports ───────────────────────────────────
echo ""
echo -e "${BLUE}[1/6] Cleaning up ports 3000 and 3001...${NC}"

for PORT in 3000 3001; do
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}  Killing processes on port $PORT: $PIDS${NC}"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "${GREEN}  Port $PORT is free${NC}"
  fi
done

# ─── Step 2: Create PostgreSQL database if needed ──────────────────
echo ""
echo -e "${BLUE}[2/6] Setting up PostgreSQL database...${NC}"

DB_NAME="${DB_NAME:-newsletter_ai}"
DB_USER="${DB_USER:-erolakarsu}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
    echo -e "${RED}  Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
  }
  sleep 2
fi

# Create database if it doesn't exist
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "${GREEN}  Database '$DB_NAME' already exists${NC}"
else
  echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
  createdb "$DB_NAME" 2>/dev/null || psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${RED}  Failed to create database. Please create it manually:${NC}"
    echo -e "${RED}  createdb $DB_NAME${NC}"
    exit 1
  }
  echo -e "${GREEN}  Database '$DB_NAME' created${NC}"
fi

# ─── Step 3: Install dependencies ─────────────────────────────────
echo ""
echo -e "${BLUE}[3/6] Installing dependencies...${NC}"

cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  Installing server dependencies...${NC}"
  npm install
else
  echo -e "${GREEN}  Server dependencies already installed${NC}"
fi

cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  Installing client dependencies...${NC}"
  npm install
else
  echo -e "${GREEN}  Client dependencies already installed${NC}"
fi

cd "$PROJECT_DIR"

# ─── Step 4: Seed the database ────────────────────────────────────
echo ""
echo -e "${BLUE}[4/6] Seeding database with sample data...${NC}"

cd "$PROJECT_DIR/server"
node seed.js
echo -e "${GREEN}  ✓ Database seeded successfully${NC}"

cd "$PROJECT_DIR"

# ─── Step 5: Start Backend with hot reload (nodemon) ──────────────
echo ""
echo -e "${BLUE}[5/6] Starting backend server on port 3001 (with hot reload)...${NC}"

cd "$PROJECT_DIR/server"
npx nodemon index.js &
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Backend started (PID: $BACKEND_PID)${NC}"

cd "$PROJECT_DIR"

# Wait for backend to be ready
echo -e "${YELLOW}  Waiting for backend to be ready...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}  Backend failed to start within 30 seconds${NC}"
    exit 1
  fi
  sleep 1
done

# ─── Step 6: Start Frontend with hot reload ───────────────────────
echo ""
echo -e "${BLUE}[6/6] Starting frontend on port 3000 (with hot reload)...${NC}"

cd "$PROJECT_DIR/client"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID)${NC}"

cd "$PROJECT_DIR"

# ─── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           All services are running!               ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Frontend:  ${GREEN}http://localhost:3000${CYAN}                ║${NC}"
echo -e "${CYAN}║  Backend:   ${GREEN}http://localhost:3001${CYAN}                ║${NC}"
echo -e "${CYAN}║  Database:  ${GREEN}${DB_NAME}${CYAN}                        ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Demo Login:                                      ║${NC}"
echo -e "${CYAN}║    Email:    ${YELLOW}demo@newsletter.com${CYAN}                ║${NC}"
echo -e "${CYAN}║    Password: ${YELLOW}demo123${CYAN}                            ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Hot reload is enabled for both frontend          ║${NC}"
echo -e "${CYAN}║  and backend. Edit code and see changes live!     ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Press Ctrl+C to stop all services                ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Handle cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  # Clean up any remaining processes on the ports
  for PORT in 3000 3001; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
      echo "$PIDS" | xargs kill -9 2>/dev/null || true
    fi
  done
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
