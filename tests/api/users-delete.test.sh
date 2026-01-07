#!/bin/bash

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing DELETE /api/users/:id endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Funkcja do wyświetlania wyników
print_test() {
    local test_name="$1"
    local status_code="$2"
    local expected="$3"

    if [ "$status_code" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $status_code)"
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected HTTP $expected, got $status_code)"
    fi
}

# Przygotowanie: Utwórz użytkownika testowego do usunięcia
echo -e "${YELLOW}Przygotowanie: Tworzenie użytkownika testowego${NC}"
TEST_EMAIL="delete.test.$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"ToDelete\",
    \"lastName\": \"User\",
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

# Test 1: Usunięcie użytkownika
echo -e "${YELLOW}Test 1: Soft-delete użytkownika${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/users/${TEST_USER_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Usunięcie użytkownika" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    DELETED_AT=$(echo "$body" | jq -r '.deletedAt' 2>/dev/null)
    CANCELLED_VACATIONS=$(echo "$body" | jq -r '.cancelledVacations' 2>/dev/null)
    echo "Deleted at: $DELETED_AT"
    echo "Cancelled vacations: $CANCELLED_VACATIONS"
fi
echo ""

# Test 2: Próba ponownego usunięcia tego samego użytkownika
echo -e "${YELLOW}Test 2: Próba ponownego usunięcia już usuniętego użytkownika${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/users/${TEST_USER_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ponownego usunięcia" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 3: Usunięcie nieistniejącego użytkownika
echo -e "${YELLOW}Test 3: Próba usunięcia nieistniejącego użytkownika${NC}"
FAKE_UUID="00000000-0000-0000-0000-000000000999"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/users/${FAKE_UUID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Użytkownik nie znaleziony" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Nieprawidłowy UUID
echo -e "${YELLOW}Test 4: Nieprawidłowy format UUID${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/users/invalid-uuid")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Sprawdzenie czy usunięty użytkownik nie pojawia się na liście
echo -e "${YELLOW}Test 5: Weryfikacja że usunięty użytkownik nie jest widoczny na liście${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 200 ]; then
    USER_IN_LIST=$(echo "$body" | jq -r ".data[] | select(.id == \"${TEST_USER_ID}\") | .id" 2>/dev/null)
    if [ -z "$USER_IN_LIST" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Usunięty użytkownik nie jest widoczny na liście"
    else
        echo -e "${RED}✗ FAIL${NC} - Usunięty użytkownik nadal widoczny na liście"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Nie można pobrać listy użytkowników"
fi
echo ""

# Test 6: Sprawdzenie czy usunięty użytkownik pojawia się z includeDeleted=true
echo -e "${YELLOW}Test 6: Weryfikacja że usunięty użytkownik widoczny z includeDeleted=true${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?includeDeleted=true")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 200 ]; then
    USER_IN_LIST=$(echo "$body" | jq -r ".data[] | select(.id == \"${TEST_USER_ID}\") | .id" 2>/dev/null)
    if [ -n "$USER_IN_LIST" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Usunięty użytkownik widoczny z includeDeleted=true"
        DELETED_AT=$(echo "$body" | jq -r ".data[] | select(.id == \"${TEST_USER_ID}\") | .deletedAt" 2>/dev/null)
        echo "  Deleted at: $DELETED_AT"
    else
        echo -e "${RED}✗ FAIL${NC} - Usunięty użytkownik nie jest widoczny nawet z includeDeleted=true"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Nie można pobrać listy użytkowników"
fi
echo ""

# Test 7: Sprawdzenie czy administrator może pobrać szczegóły usuniętego użytkownika
echo -e "${YELLOW}Test 7: Weryfikacja że administrator może pobrać szczegóły usuniętego użytkownika${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${TEST_USER_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

# Administrator powinien móc zobaczyć usuniętych użytkowników
print_test "Administrator może zobaczyć usuniętego użytkownika" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    DELETED_AT=$(echo "$body" | jq -r '.data.deletedAt' 2>/dev/null)
    if [ -n "$DELETED_AT" ] && [ "$DELETED_AT" != "null" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Użytkownik ma ustawiony deletedAt: $DELETED_AT"
    else
        echo -e "${RED}✗ FAIL${NC} - Użytkownik nie ma ustawionego deletedAt"
    fi
    echo "Response preview:"
    echo "$body" | jq '.data | {id, firstName, lastName, email, deletedAt}' 2>/dev/null || echo "$body"
else
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Utworzenie użytkownika z przyszłymi vacation requests i usunięcie
echo -e "${YELLOW}Test 8: Usunięcie użytkownika z anulowaniem przyszłych urlopów${NC}"
echo "  (Wymaga istniejących vacation_requests - test koncepcyjny)"
# Ten test wymaga istniejącej struktury vacation_requests w bazie
# Dla uproszczenia sprawdzamy czy endpoint zwraca pole cancelledVacations

USER_WITH_VACATIONS_EMAIL="user.with.vacations.$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"UserWith\",
    \"lastName\": \"Vacations\",
    \"email\": \"${USER_WITH_VACATIONS_EMAIL}\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 201 ]; then
    USER_WITH_VACATIONS_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)

    # Usuń użytkownika
    response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/users/${USER_WITH_VACATIONS_ID}")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq 200 ]; then
        HAS_CANCELLED_FIELD=$(echo "$body" | jq 'has("cancelledVacations")' 2>/dev/null)
        if [ "$HAS_CANCELLED_FIELD" = "true" ]; then
            echo -e "${GREEN}✓ PASS${NC} - Odpowiedź zawiera pole cancelledVacations"
            CANCELLED=$(echo "$body" | jq -r '.cancelledVacations' 2>/dev/null)
            echo "  Cancelled vacations: $CANCELLED"
        else
            echo -e "${RED}✗ FAIL${NC} - Brak pola cancelledVacations w odpowiedzi"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - Nie udało się usunąć użytkownika"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Nie udało się utworzyć użytkownika testowego"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

