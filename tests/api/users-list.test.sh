#!/bin/bash

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/users endpoint${NC}"
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

# Test 1: Podstawowe wywołanie
echo -e "${YELLOW}Test 1: Podstawowe GET /api/users${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Podstawowe GET /api/users" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq -r '.data[0:3] | .[] | "  - \(.firstName) \(.lastName) (\(.email)) - \(.role)"' 2>/dev/null || echo "$body" | head -c 200
    total=$(echo "$body" | jq -r '.pagination.total' 2>/dev/null || echo "N/A")
    echo "Total users: $total"
fi
echo ""

# Test 2: Paginacja
echo -e "${YELLOW}Test 2: Paginacja (limit=5, offset=0)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?limit=5&offset=0")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Paginacja limit=5" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Returned users count: $count"
fi
echo ""

# Test 3: Filtrowanie po roli
echo -e "${YELLOW}Test 3: Filtrowanie po roli (role=EMPLOYEE)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?role=EMPLOYEE")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie role=EMPLOYEE" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Employees count: $count"
fi
echo ""

# Test 4: Nieprawidłowy limit (walidacja)
echo -e "${YELLOW}Test 4: Walidacja - nieprawidłowy limit (999)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?limit=999")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja limit max 100" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Nieprawidłowy UUID dla teamId
echo -e "${YELLOW}Test 5: Walidacja - nieprawidłowy UUID${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?teamId=invalid-uuid")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Filtrowanie po HR
echo -e "${YELLOW}Test 6: Filtrowanie po roli (role=HR)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?role=HR")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie role=HR" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "HR users count: $count"
    echo "$body" | jq -r '.data[] | "  - \(.firstName) \(.lastName)"' 2>/dev/null
fi
echo ""

# Test 7: includeDeleted (jako admin przez DEFAULT_USER_ID)
echo -e "${YELLOW}Test 7: IncludeDeleted parameter${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/users?includeDeleted=true")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "IncludeDeleted=true" "$status_code" 200
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Serwer musi być uruchomiony na porcie 3000"
echo "Uruchom: ${GREEN}npm run dev${NC}"

