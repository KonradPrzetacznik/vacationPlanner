#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server


echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/teams/:id/calendar${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# IDs z seed.sql
GREEN_TEAM_ID="10000000-0000-0000-0000-000000000001"
RED_TEAM_ID="10000000-0000-0000-0000-000000000002"
ADMIN_ID="00000000-0000-0000-0000-000000000001"
HR_FERDYNAND_ID="00000000-0000-0000-0000-000000000002"
EMPLOYEE_KAZIMIERZ_ID="00000000-0000-0000-0000-000000000010"

# Test 1: Pobranie kalendarza zespołu bez parametrów (default date range)
echo -e "${YELLOW}Test 1: Pobranie kalendarza zespołu - default date range${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Pobranie kalendarza z domyślnym zakresem dat" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response structure:"
    echo "$body" | jq '{teamId, teamName, startDate, endDate, memberCount: (.members | length)}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 2: Pobranie kalendarza z filtrem month
echo -e "${YELLOW}Test 2: Pobranie kalendarza z filtrem month=2026-01${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?month=2026-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie po miesiącu" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Date range:"
    echo "$body" | jq '{startDate, endDate}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 3: Pobranie kalendarza z custom startDate i endDate
echo -e "${YELLOW}Test 3: Pobranie kalendarza z custom date range${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?startDate=2026-01-01&endDate=2026-01-31")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Custom date range" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Date range:"
    echo "$body" | jq '{startDate, endDate}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Pobranie kalendarza z filtrem includeStatus
echo -e "${YELLOW}Test 4: Pobranie kalendarza z filtrem includeStatus=APPROVED${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?includeStatus=APPROVED")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie po statusie APPROVED" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Members with vacations:"
    echo "$body" | jq '.members[] | {firstName, lastName, vacationCount: (.vacations | length)}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Pobranie kalendarza z wieloma statusami
echo -e "${YELLOW}Test 5: Pobranie kalendarza z wieloma statusami${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?includeStatus=APPROVED&includeStatus=SUBMITTED")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie po wielu statusach" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Total vacations across all members:"
    total_vacations=$(echo "$body" | jq '[.members[].vacations | length] | add' 2>/dev/null)
    echo "Total: $total_vacations"
fi
echo ""

# Test 6: Próba użycia month wraz z startDate (powinno zwrócić błąd)
echo -e "${YELLOW}Test 6: Błąd - month z startDate jednocześnie${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?month=2026-01&startDate=2026-01-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - month i startDate wykluczają się" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Nieprawidłowy format daty
echo -e "${YELLOW}Test 7: Nieprawidłowy format daty${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?startDate=2026/01/01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy format daty" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: startDate > endDate
echo -e "${YELLOW}Test 8: startDate po endDate${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?startDate=2026-01-31&endDate=2026-01-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - startDate musi być przed endDate" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 9: Nieprawidłowy format month
echo -e "${YELLOW}Test 9: Nieprawidłowy format month${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?month=2026-1")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy format month" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 10: Nieprawidłowy status
echo -e "${YELLOW}Test 10: Nieprawidłowy status${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?includeStatus=INVALID_STATUS")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy status" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 11: Nieistniejący zespół
echo -e "${YELLOW}Test 11: Nieistniejący zespół${NC}"
FAKE_TEAM_ID="10000000-0000-0000-0000-999999999999"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${FAKE_TEAM_ID}/calendar")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Team not found" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 12: Nieprawidłowy UUID team ID
echo -e "${YELLOW}Test 12: Nieprawidłowy UUID team ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/invalid-id/calendar")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy team ID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 13: Zakres dat > 1 rok
echo -e "${YELLOW}Test 13: Zakres dat przekracza 1 rok${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?startDate=2026-01-01&endDate=2027-02-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - limit 1 roku" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation error:"
    echo "$body" | jq '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 14: Sprawdzenie struktury odpowiedzi
echo -e "${YELLOW}Test 14: Weryfikacja struktury odpowiedzi${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/teams/${GREEN_TEAM_ID}/calendar?month=2026-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Pełna struktura odpowiedzi" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Full response structure:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

    # Sprawdź czy wszystkie wymagane pola są obecne
    has_team_id=$(echo "$body" | jq 'has("teamId")' 2>/dev/null)
    has_team_name=$(echo "$body" | jq 'has("teamName")' 2>/dev/null)
    has_start_date=$(echo "$body" | jq 'has("startDate")' 2>/dev/null)
    has_end_date=$(echo "$body" | jq 'has("endDate")' 2>/dev/null)
    has_members=$(echo "$body" | jq 'has("members")' 2>/dev/null)

    if [ "$has_team_id" == "true" ] && [ "$has_team_name" == "true" ] && \
       [ "$has_start_date" == "true" ] && [ "$has_end_date" == "true" ] && \
       [ "$has_members" == "true" ]; then
        echo -e "${GREEN}✓${NC} All required fields present"
    else
        echo -e "${RED}✗${NC} Missing required fields"
    fi
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test suite completed${NC}"
echo -e "${BLUE}========================================${NC}"

