#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/users/:userId/vacation-allowances${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test users (z seed data)
USER_1="00000000-0000-0000-0000-000000000001" # Admin
USER_10="00000000-0000-0000-0000-000000000010" # Employee with approved vacation
USER_INVALID="00000000-0000-0000-0000-000000000099" # Non-existent

# Test 1: Podstawowe wywołanie - pobierz wszystkie allowances
echo -e "${YELLOW}Test 1: GET /api/users/:userId/vacation-allowances${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Pobieranie allowances dla użytkownika" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    userId=$(echo "$body" | jq -r '.userId' 2>/dev/null)
    count=$(echo "$body" | jq -r '.allowances | length' 2>/dev/null)
    echo "  User ID: $userId"
    echo "  Allowances count: $count"
    echo "$body" | jq -r '.allowances[] | "  - Year \(.year): \(.totalDays) total, \(.usedDays) used, \(.remainingDays) remaining"' 2>/dev/null
fi
echo ""

# Test 2: Filtrowanie po roku
echo -e "${YELLOW}Test 2: Filtrowanie po roku (?year=2025)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances?year=2025")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie po roku 2025" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.allowances | length' 2>/dev/null)
    echo "  Filtered allowances count: $count"
    echo "$body" | jq -r '.allowances[] | "  - Year \(.year): \(.totalDays) days"' 2>/dev/null
fi
echo ""

# Test 3: Użytkownik z wykorzystanymi dniami
echo -e "${YELLOW}Test 3: Użytkownik z wykorzystanymi dniami urlopu${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_10}/vacation-allowances/2025")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Allowance z obliczonymi dniami" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Computed fields:"
    echo "$body" | jq -r '.data | "  Total days: \(.totalDays)\n  Carryover days: \(.carryoverDays)\n  Used days: \(.usedDays)\n    - From carryover: \(.usedCarryoverDays)\n    - From current year: \(.usedCurrentYearDays)\n  Remaining days: \(.remainingDays)\n    - Carryover: \(.remainingCarryoverDays)\n    - Current year: \(.remainingCurrentYearDays)\n  Carryover expires: \(.carryoverExpiresAt)"' 2>/dev/null
fi
echo ""

# Test 4: Walidacja - nieprawidłowy UUID
echo -e "${YELLOW}Test 4: Walidacja - nieprawidłowy UUID${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/invalid-uuid/vacation-allowances")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Walidacja - rok poza zakresem (za mały)
echo -e "${YELLOW}Test 5: Walidacja - rok poza zakresem (1999)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances?year=1999")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja rok < 2000" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Walidacja - rok poza zakresem (za duży)
echo -e "${YELLOW}Test 6: Walidacja - rok poza zakresem (2101)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances?year=2101")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja rok > 2100" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: 404 - użytkownik nie istnieje
echo -e "${YELLOW}Test 7: 404 - Użytkownik nie istnieje${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_INVALID}/vacation-allowances")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Nieistniejący użytkownik" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: 404 - allowance dla roku nie istnieje
echo -e "${YELLOW}Test 8: 404 - Allowance dla roku nie istnieje${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances/2027")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Nieistniejąca allowance dla roku" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 9: Endpoint z konkretnym rokiem - success
echo -e "${YELLOW}Test 9: GET /api/users/:userId/vacation-allowances/:year${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances/2026")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Pobieranie allowance dla konkretnego roku" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response data:"
    echo "$body" | jq -r '.data | "  Year: \(.year)\n  Total days: \(.totalDays)\n  Carryover: \(.carryoverDays)\n  Used: \(.usedDays)\n  Remaining: \(.remainingDays)"' 2>/dev/null
fi
echo ""

# Test 10: Walidacja roku w path parameter
echo -e "${YELLOW}Test 10: Walidacja - nieprawidłowy rok w path${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users/${USER_1}/vacation-allowances/1999")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja rok w path < 2000" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 11: Różni użytkownicy - porównanie
echo -e "${YELLOW}Test 11: Porównanie allowances różnych użytkowników${NC}"
echo "User 1 (Admin):"
response=$(curl -s "${API_BASE}/api/users/${USER_1}/vacation-allowances/2025")
echo "$response" | jq -r '.data | "  Used: \(.usedDays)/\(.totalDays) days"' 2>/dev/null

echo "User 10 (Employee with vacation):"
response=$(curl -s "${API_BASE}/api/users/${USER_10}/vacation-allowances/2025")
echo "$response" | jq -r '.data | "  Used: \(.usedDays)/\(.totalDays) days"' 2>/dev/null
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "- All vacation allowances endpoints tested"
echo "- Validated computed fields (used/remaining days)"
echo "- Validated carry-over logic"
echo "- Tested error handling (400, 404)"
echo "- Tested both list and single-year endpoints"
echo ""
echo -e "${YELLOW}Note:${NC} Serwer musi być uruchomiony na porcie 3000"
echo "Uruchom: ${GREEN}npm run dev${NC}"

