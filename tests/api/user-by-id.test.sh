#!/bin/bash

# Test script for GET /api/users/:id endpoint
# Start the dev server in background, run tests, then kill it

echo "🚀 Starting Astro dev server..."
# Get script directory and move to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"
npm run dev > /tmp/astro-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 8

# Check if server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Server failed to start. Check /tmp/astro-test.log"
    exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 1: Get existing user with teams (Kazimierz Pawlak - in 2 teams)
echo "📝 Test 1: Get existing user with teams"
curl -s http://localhost:3000/api/users/00000000-0000-0000-0000-000000000010 | jq . || echo "Request failed"
echo ""

# Test 2: Invalid UUID format
echo "📝 Test 2: Invalid UUID format (should return 400)"
curl -s http://localhost:3000/api/users/invalid-uuid | jq . || echo "Request failed"
echo ""

# Test 3: Non-existent user
echo "📝 Test 3: Non-existent user (should return 404)"
curl -s http://localhost:3000/api/users/00000000-0000-0000-0000-999999999999 | jq . || echo "Request failed"
echo ""

# Test 4: User without teams (Admin)
echo "📝 Test 4: User without teams"
curl -s http://localhost:3000/api/users/00000000-0000-0000-0000-000000000001 | jq . || echo "Request failed"
echo ""

# Test 5: User with one team (Jacek Kwiatkowski)
echo "📝 Test 5: User with one team"
curl -s http://localhost:3000/api/users/00000000-0000-0000-0000-000000000011 | jq . || echo "Request failed"
echo ""

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "✅ Tests completed!"

