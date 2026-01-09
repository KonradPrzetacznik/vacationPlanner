#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing PATCH /api/users/:id endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# Przygotowanie: Utwórz użytkownika testowego
echo -e "${YELLOW}Przygotowanie: Tworzenie użytkownika testowego${NC}"
TEST_EMAIL="update.test.$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Original\",
    \"lastName\": \"Name\",
    \"email\": \"${TEST_EMAIL}\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 201 ]; then
    TEST_USER_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo -e "${GREEN}✓${NC} Utworzono użytkownika testowego: $TEST_USER_ID"
else
    echo -e "${RED}✗${NC} Nie udało się utworzyć użytkownika testowego"
    exit 1
fi
echo ""

# Test 1: Aktualizacja firstName
echo -e "${YELLOW}Test 1: Aktualizacja firstName${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Updated\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja firstName" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName, email}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 2: Aktualizacja lastName
echo -e "${YELLOW}Test 2: Aktualizacja lastName${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"lastName\": \"UpdatedLast\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja lastName" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 3: Aktualizacja obu pól naraz
echo -e "${YELLOW}Test 3: Aktualizacja firstName i lastName naraz${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Both\",
    \"lastName\": \"Updated\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja firstName i lastName" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Aktualizacja roli przez ADMINISTRATOR
echo -e "${YELLOW}Test 4: Aktualizacja roli na HR (przez ADMINISTRATOR)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"role\": \"HR\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja roli na HR" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName, role}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Aktualizacja wszystkich pól naraz
echo -e "${YELLOW}Test 5: Aktualizacja wszystkich pól naraz${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Final\",
    \"lastName\": \"Update\",
    \"role\": \"EMPLOYEE\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Aktualizacja wszystkich pól" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName, role}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Nieprawidłowy UUID
echo -e "${YELLOW}Test 6: Nieprawidłowy format UUID${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/invalid-uuid" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Nieistniejący użytkownik
echo -e "${YELLOW}Test 7: Aktualizacja nieistniejącego użytkownika${NC}"
FAKE_UUID="00000000-0000-0000-0000-000000000999"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${FAKE_UUID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Użytkownik nie znaleziony" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Brak pól do aktualizacji
echo -e "${YELLOW}Test 8: Brak pól do aktualizacji (pusty obiekt)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - brak pól" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 9: Nieprawidłowa rola
echo -e "${YELLOW}Test 9: Nieprawidłowa wartość roli${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"role\": \"SUPERADMIN\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowa rola" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 10: Pusty firstName
echo -e "${YELLOW}Test 10: Próba ustawienia pustego firstName${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - pusty firstName" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 11: firstName za długi
echo -e "${YELLOW}Test 11: firstName dłuższy niż 100 znaków${NC}"
LONG_NAME=$(printf 'A%.0s' {1..101})
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"${LONG_NAME}\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - firstName za długi" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 12: Nieprawidłowy JSON
echo -e "${YELLOW}Test 12: Nieprawidłowy JSON w body${NC}"
response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/api/users/${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{invalid json")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy JSON" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

