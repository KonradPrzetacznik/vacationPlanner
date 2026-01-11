#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing PATCH /api/vacation-allowances/:id endpoint${NC}"
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

# Utwórz vacation allowance do testów aktualizacji
echo -e "${YELLOW}Tworzenie vacation allowance dla testów PATCH...${NC}"
TEST_YEAR=2029
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/vacation-allowances" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"year\": ${TEST_YEAR},
    \"totalDays\": 20,
    \"carryoverDays\": 2
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 201 ]; then
    ALLOWANCE_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo -e "${GREEN}✓ Utworzono vacation allowance ID: $ALLOWANCE_ID${NC}"
else
    echo -e "${RED}✗ Nie można utworzyć vacation allowance dla testów${NC}"
    echo "Response: $body"
    exit 1
fi
echo ""

# Test 1: Aktualizacja totalDays
echo -e "${YELLOW}Test 1: Aktualizacja totalDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "totalDays": 28
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja totalDays" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, totalDays, carryoverDays, updatedAt}' 2>/dev/null || echo "$body"
    UPDATED_TOTAL=$(echo "$body" | jq -r '.totalDays' 2>/dev/null)
    if [ "$UPDATED_TOTAL" == "28" ]; then
        echo -e "${GREEN}✓ totalDays zaktualizowane poprawnie na 28${NC}"
    else
        echo -e "${RED}✗ totalDays nie zostało zaktualizowane${NC}"
    fi
fi
echo ""

# Test 2: Aktualizacja carryoverDays
echo -e "${YELLOW}Test 2: Aktualizacja carryoverDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "carryoverDays": 5
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja carryoverDays" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, totalDays, carryoverDays, updatedAt}' 2>/dev/null || echo "$body"
    UPDATED_CARRYOVER=$(echo "$body" | jq -r '.carryoverDays' 2>/dev/null)
    if [ "$UPDATED_CARRYOVER" == "5" ]; then
        echo -e "${GREEN}✓ carryoverDays zaktualizowane poprawnie na 5${NC}"
    else
        echo -e "${RED}✗ carryoverDays nie zostało zaktualizowane${NC}"
    fi
fi
echo ""

# Test 3: Aktualizacja obu pól jednocześnie
echo -e "${YELLOW}Test 3: Aktualizacja totalDays i carryoverDays jednocześnie${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "totalDays": 30,
    "carryoverDays": 7
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja obu pól" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {totalDays, carryoverDays}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Walidacja - pusty body (brak pól do aktualizacji)
echo -e "${YELLOW}Test 4: Walidacja - pusty body${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{}')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie pustego body" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Walidacja - ujemna wartość totalDays
echo -e "${YELLOW}Test 5: Walidacja - ujemna wartość totalDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "totalDays": -10
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ujemnej wartości totalDays" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Walidacja - ujemna wartość carryoverDays
echo -e "${YELLOW}Test 6: Walidacja - ujemna wartość carryoverDays${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "carryoverDays": -5
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ujemnej wartości carryoverDays" "$status_code" 400
echo ""

# Test 7: Allowance nie istnieje (nieprawidłowy ID)
echo -e "${YELLOW}Test 7: Aktualizacja nieistniejącego allowance${NC}"
FAKE_ALLOWANCE_ID="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${FAKE_ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "totalDays": 25
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego allowance" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Walidacja - nieprawidłowy UUID w path
echo -e "${YELLOW}Test 8: Walidacja - nieprawidłowy UUID w path${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/invalid-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "totalDays": 25
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieprawidłowego UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 9: Nieprawidłowy JSON
echo -e "${YELLOW}Test 9: Walidacja - nieprawidłowy JSON${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
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

# Test 10: Aktualizacja na wartość 0 (powinno być dozwolone)
echo -e "${YELLOW}Test 10: Aktualizacja na wartość 0 (dozwolone)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/vacation-allowances/${ALLOWANCE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "carryoverDays": 0
  }')
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja carryoverDays na 0" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {carryoverDays}' 2>/dev/null || echo "$body"
    UPDATED_CARRYOVER=$(echo "$body" | jq -r '.carryoverDays' 2>/dev/null)
    if [ "$UPDATED_CARRYOVER" == "0" ]; then
        echo -e "${GREEN}✓ carryoverDays zaktualizowane poprawnie na 0${NC}"
    fi
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PATCH /api/vacation-allowances/:id tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

