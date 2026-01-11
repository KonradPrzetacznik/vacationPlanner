#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/vacation-allowances endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Pobierz ID pierwszego użytkownika z bazy (dla testów)
echo -e "${YELLOW}Pobieranie ID użytkownika z bazy...${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?limit=1")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 200 ]; then
    TEST_USER_ID=$(echo "$body" | jq -r '.data[0].id' 2>/dev/null)
    echo -e "${GREEN}✓ Użytkownik testowy ID: $TEST_USER_ID${NC}"
else
    echo -e "${RED}✗ Nie można pobrać użytkownika testowego${NC}"
    exit 1
fi
echo ""

# Test 1: Utworzenie vacation allowance z wszystkimi wymaganymi polami
echo -e "${YELLOW}Test 1: Utworzenie vacation allowance dla użytkownika${NC}"
# Use timestamp to generate unique year (2050-2099 range to avoid conflicts)
TEST_YEAR=$((2050 + $(date +%S) % 50))
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": ${TEST_YEAR},
    \"totalDays\": 26,
    \"carryoverDays\": 3
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Utworzenie vacation allowance" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    CREATED_ALLOWANCE_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo "Created allowance ID: $CREATED_ALLOWANCE_ID"
fi
echo ""

# Test 2: Utworzenie vacation allowance z zerowym carryover
echo -e "${YELLOW}Test 2: Utworzenie vacation allowance bez dni przeniesionych${NC}"
TEST_YEAR_2=$((TEST_YEAR + 1))
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": ${TEST_YEAR_2},
    \"totalDays\": 26,
    \"carryoverDays\": 0
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Utworzenie vacation allowance (carryover=0)" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, year, totalDays, carryoverDays}' 2>/dev/null || echo "$body"
    CREATED_ALLOWANCE_ID_2=$(echo "$body" | jq -r '.id' 2>/dev/null)
fi
echo ""

# Test 3: Próba utworzenia duplikatu (ten sam user + year)
echo -e "${YELLOW}Test 3: Próba utworzenia duplikatu vacation allowance${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": ${TEST_YEAR},
    \"totalDays\": 30,
    \"carryoverDays\": 5
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie duplikatu (user+year)" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Walidacja - nieprawidłowy UUID użytkownika
echo -e "${YELLOW}Test 4: Walidacja - nieprawidłowy UUID użytkownika${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "invalid-uuid",
    "year": 2026,
    "totalDays": 26,
    "carryoverDays": 3
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieprawidłowego UUID" "$status_code" 400
echo ""

# Test 5: Walidacja - rok poza zakresem (< 2000)
echo -e "${YELLOW}Test 5: Walidacja - rok poza zakresem (< 2000)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": 1999,
    \"totalDays\": 26,
    \"carryoverDays\": 3
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie roku < 2000" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Walidacja - rok poza zakresem (> 2100)
echo -e "${YELLOW}Test 6: Walidacja - rok poza zakresem (> 2100)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": 2101,
    \"totalDays\": 26,
    \"carryoverDays\": 3
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie roku > 2100" "$status_code" 400
echo ""

# Test 7: Walidacja - ujemna liczba totalDays
echo -e "${YELLOW}Test 7: Walidacja - ujemna liczba totalDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": 2028,
    \"totalDays\": -5,
    \"carryoverDays\": 3
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ujemnej liczby totalDays" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Walidacja - ujemna liczba carryoverDays
echo -e "${YELLOW}Test 8: Walidacja - ujemna liczba carryoverDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": 2028,
    \"totalDays\": 26,
    \"carryoverDays\": -2
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ujemnej liczby carryoverDays" "$status_code" 400
echo ""

# Test 9: Użytkownik nie istnieje
echo -e "${YELLOW}Test 9: Próba utworzenia dla nieistniejącego użytkownika${NC}"
FAKE_USER_ID="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${FAKE_USER_ID}\",
    \"year\": 2026,
    \"totalDays\": 26,
    \"carryoverDays\": 3
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego użytkownika" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 10: Brakujące pole wymagane (userId)
echo -e "${YELLOW}Test 10: Walidacja - brakujące pole userId${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "totalDays": 26,
    "carryoverDays": 3
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie braku pola userId" "$status_code" 400
echo ""

# Test 11: Nieprawidłowy JSON
echo -e "${YELLOW}Test 11: Walidacja - nieprawidłowy JSON${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieprawidłowego JSON" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POST /api/vacation-allowances tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

