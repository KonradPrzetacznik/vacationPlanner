#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing DELETE /api/teams/:id/members/:userId${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# IDs z seed.sql
GREEN_TEAM_ID="10000000-0000-0000-0000-000000000001"
RED_TEAM_ID="10000000-0000-0000-0000-000000000002"
ADMIN_ID="00000000-0000-0000-0000-000000000001"
HR_FERDYNAND_ID="00000000-0000-0000-0000-000000000002"
EMPLOYEE_KAZIMIERZ_ID="00000000-0000-0000-0000-000000000010"
EMPLOYEE_ADAS_ID="00000000-0000-0000-0000-000000000015"
EMPLOYEE_WALDUS_ID="00000000-0000-0000-0000-000000000016"

# Przygotowanie: Dodaj członka, którego będziemy usuwać
echo -e "${YELLOW}Przygotowanie: Dodanie członka do Red Team${NC}"
curl -s -X POST "${API_BASE}/api/teams/${RED_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{\"userIds\": [\"${EMPLOYEE_ADAS_ID}\"]}" > /dev/null
echo "Member added for testing"
echo ""

# Test 1: Usunięcie członka z zespołu
echo -e "${YELLOW}Test 1: Usunięcie członka z zespołu${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_ADAS_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Usunięcie członka z zespołu" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi
echo ""

# Test 2: Próba usunięcia członka, który nie jest w zespole
echo -e "${YELLOW}Test 2: Próba usunięcia członka, który nie jest w zespole${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_WALDUS_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie usunięcia nieistniejącego członkostwa" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 3: Próba usunięcia z nieistniejącego zespołu
echo -e "${YELLOW}Test 3: Próba usunięcia z nieistniejącego zespołu${NC}"
FAKE_TEAM_ID="10000000-0000-0000-0000-999999999999"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${FAKE_TEAM_ID}/members/${EMPLOYEE_KAZIMIERZ_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego zespołu" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Próba usunięcia nieistniejącego użytkownika
echo -e "${YELLOW}Test 4: Próba usunięcia nieistniejącego użytkownika${NC}"
FAKE_USER_ID="00000000-0000-0000-0000-999999999999"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members/${FAKE_USER_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego użytkownika" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Nieprawidłowy UUID dla team ID
echo -e "${YELLOW}Test 5: Nieprawidłowy format UUID dla team ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/invalid-team-id/members/${EMPLOYEE_KAZIMIERZ_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy team ID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Nieprawidłowy UUID dla user ID
echo -e "${YELLOW}Test 6: Nieprawidłowy format UUID dla user ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members/invalid-user-id")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy user ID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Weryfikacja że członek został faktycznie usunięty
echo -e "${YELLOW}Test 7: Weryfikacja usunięcia - sprawdzenie listy członków${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${RED_TEAM_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Pobranie zespołu po usunięciu członka" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    # Sprawdź czy EMPLOYEE_ADAS_ID nie jest już na liście członków
    member_found=$(echo "$body" | jq ".data.members[] | select(.id == \"${EMPLOYEE_ADAS_ID}\")" 2>/dev/null)
    if [ -z "$member_found" ]; then
        echo -e "${GREEN}✓${NC} Member successfully removed from team"
    else
        echo -e "${RED}✗${NC} Member still in team after deletion"
    fi
fi
echo ""

# Test 8: Usunięcie tego samego członka ponownie (powinno zwrócić 404)
echo -e "${YELLOW}Test 8: Próba ponownego usunięcia już usuniętego członka${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_ADAS_ID}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie ponownego usunięcia" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test suite completed${NC}"
echo -e "${BLUE}========================================${NC}"

