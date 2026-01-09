#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/teams/:id/members${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# IDs z seed.sql
GREEN_TEAM_ID="10000000-0000-0000-0000-000000000001"
RED_TEAM_ID="10000000-0000-0000-0000-000000000002"
ADMIN_ID="00000000-0000-0000-0000-000000000001"
HR_FERDYNAND_ID="00000000-0000-0000-0000-000000000002"
EMPLOYEE_KAZIMIERZ_ID="00000000-0000-0000-0000-000000000010"
EMPLOYEE_JUREK_ID="00000000-0000-0000-0000-000000000019"
EMPLOYEE_JACEK_ID="00000000-0000-0000-0000-000000000011"
EMPLOYEE_WLADYSLAW_ID="00000000-0000-0000-0000-000000000012"

# Test 1: Dodanie pojedynczego członka do zespołu
echo -e "${YELLOW}Test 1: Dodanie pojedynczego członka do zespołu Red Team${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${RED_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${EMPLOYEE_JUREK_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Dodanie pojedynczego członka" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi
echo ""
$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_JUREK_ID}")

# Test 2: Dodanie wielu członków jednocześnie (bulk operation)
echo -e "${YELLOW}Test 2: Dodanie wielu członków jednocześnie (bulk)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${RED_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${EMPLOYEE_JACEK_ID}\", \"${EMPLOYEE_WLADYSLAW_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Dodanie wielu członków" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {message, addedCount: (.added | length)}' 2>/dev/null || echo "$body"
fi
echo ""
$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_JACEK_ID}")
$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/api/teams/${RED_TEAM_ID}/members/${EMPLOYEE_WLADYSLAW_ID}")

# Test 3: Próba dodania użytkownika, który już jest członkiem
echo -e "${YELLOW}Test 3: Próba dodania użytkownika, który już jest członkiem${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${EMPLOYEE_KAZIMIERZ_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie duplikatu członka" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Próba dodania nieistniejącego użytkownika
echo -e "${YELLOW}Test 4: Próba dodania nieistniejącego użytkownika${NC}"
FAKE_USER_ID="00000000-0000-0000-0000-999999999999"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${FAKE_USER_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego użytkownika" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Próba dodania do nieistniejącego zespołu
echo -e "${YELLOW}Test 5: Próba dodania do nieistniejącego zespołu${NC}"
FAKE_TEAM_ID="10000000-0000-0000-0000-999999999999"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${FAKE_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${EMPLOYEE_JUREK_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie nieistniejącego zespołu" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Nieprawidłowy UUID
echo -e "${YELLOW}Test 6: Nieprawidłowy format UUID${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"not-a-uuid\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Pusta tablica userIds
echo -e "${YELLOW}Test 7: Pusta tablica userIds${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": []
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - pusta tablica" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Brak pola userIds
echo -e "${YELLOW}Test 8: Brak wymaganego pola userIds${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - brak userIds" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 9: Nieprawidłowy JSON
echo -e "${YELLOW}Test 9: Nieprawidłowy JSON w request body${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{ invalid json }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy JSON" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 10: Nieprawidłowy team ID w URL
echo -e "${YELLOW}Test 10: Nieprawidłowy format team ID w URL${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/invalid-id/members" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"${EMPLOYEE_JUREK_ID}\"]
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy team ID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 11: Zbyt duża liczba członków (>100)
echo -e "${YELLOW}Test 11: Próba dodania więcej niż 100 członków${NC}"
# Generujemy tablicę 101 UUIDs
large_array="["
for i in {1..101}; do
    large_array+="\"00000000-0000-0000-0000-00000000$(printf "%04d" $i)\""
    if [ $i -lt 101 ]; then
        large_array+=","
    fi
done
large_array+="]"

response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/teams/${GREEN_TEAM_ID}/members" \
  -H "Content-Type: application/json" \
  -d "{\"userIds\": ${large_array}}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - limit 100 członków" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test suite completed${NC}"
echo -e "${BLUE}========================================${NC}"

