#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/users endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# Generuj losowy email dla testów
RANDOM_EMAIL="test.user.$(date +%s)@example.com"

# Test 1: Utworzenie użytkownika z wszystkimi wymaganymi polami
echo -e "${YELLOW}Test 1: Utworzenie nowego użytkownika (EMPLOYEE)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"email\": \"${RANDOM_EMAIL}\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Utworzenie nowego użytkownika" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    CREATED_USER_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo "Created user ID: $CREATED_USER_ID"
fi
echo ""

# Test 2: Utworzenie użytkownika z rolą ADMINISTRATOR
echo -e "${YELLOW}Test 2: Utworzenie użytkownika z rolą ADMINISTRATOR${NC}"
ADMIN_EMAIL="admin.user.$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Jane\",
    \"lastName\": \"Admin\",
    \"email\": \"${ADMIN_EMAIL}\",
    \"role\": \"ADMINISTRATOR\",
    \"temporaryPassword\": \"AdminPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Utworzenie użytkownika ADMINISTRATOR" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName, role, requiresPasswordReset}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 3: Utworzenie użytkownika z rolą HR
echo -e "${YELLOW}Test 3: Utworzenie użytkownika z rolą HR${NC}"
HR_EMAIL="hr.user.$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Bob\",
    \"lastName\": \"HR\",
    \"email\": \"${HR_EMAIL}\",
    \"role\": \"HR\",
    \"temporaryPassword\": \"HRPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Utworzenie użytkownika HR" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    echo "$body" | jq '. | {id, firstName, lastName, role}' 2>/dev/null || echo "$body"
fi
echo ""

# Test 4: Próba utworzenia użytkownika z istniejącym emailem
echo -e "${YELLOW}Test 4: Próba utworzenia użytkownika z duplikatem emaila${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Duplicate\",
    \"lastName\": \"User\",
    \"email\": \"${RANDOM_EMAIL}\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Odrzucenie duplikatu emaila" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Brak wymaganych pól (firstName)
echo -e "${YELLOW}Test 5: Brak wymaganego pola firstName${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"lastName\": \"Incomplete\",
    \"email\": \"incomplete@example.com\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - brak firstName" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Nieprawidłowy email
echo -e "${YELLOW}Test 6: Nieprawidłowy format emaila${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Invalid\",
    \"lastName\": \"Email\",
    \"email\": \"not-an-email\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowy email" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Hasło za krótkie
echo -e "${YELLOW}Test 7: Hasło za krótkie (min. 8 znaków)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Short\",
    \"lastName\": \"Password\",
    \"email\": \"short.pass@example.com\",
    \"temporaryPassword\": \"Pass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - hasło za krótkie" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Nieprawidłowy JSON
echo -e "${YELLOW}Test 8: Nieprawidłowy JSON w body${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
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

# Test 9: Nieprawidłowa rola
echo -e "${YELLOW}Test 9: Nieprawidłowa wartość dla roli${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Invalid\",
    \"lastName\": \"Role\",
    \"email\": \"invalid.role@example.com\",
    \"role\": \"SUPERADMIN\",
    \"temporaryPassword\": \"TempPass123\"
  }")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja - nieprawidłowa rola" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Validation errors:"
    echo "$body" | jq '.details' 2>/dev/null || echo "$body"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

