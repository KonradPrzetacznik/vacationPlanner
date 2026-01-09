#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

# Test 1: Get existing user with teams (Kazimierz Pawlak - in 2 teams)
echo "📝 Test 1: Get existing user with teams"
curl -s $API_BASE/api/users/00000000-0000-0000-0000-000000000010 | jq . || echo "Request failed"
echo ""

# Test 2: Invalid UUID format
echo "📝 Test 2: Invalid UUID format (should return 400)"
curl -s $API_BASE/api/users/invalid-uuid | jq . || echo "Request failed"
echo ""

# Test 3: Non-existent user
echo "📝 Test 3: Non-existent user (should return 404)"
curl -s $API_BASE/api/users/00000000-0000-0000-0000-999999999999 | jq . || echo "Request failed"
echo ""

# Test 4: User without teams (Admin)
echo "📝 Test 4: User without teams"
curl -s $API_BASE/api/users/00000000-0000-0000-0000-000000000001 | jq . || echo "Request failed"
echo ""

# Test 5: User with one team (Jacek Kwiatkowski)
echo "📝 Test 5: User with one team"
curl -s $API_BASE/api/users/00000000-0000-0000-0000-000000000011 | jq . || echo "Request failed"
echo ""


echo "✅ Tests completed!"

