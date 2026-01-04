#!/bin/bash
# Quick test script - sprawdza czy endpoint działa

echo "🧪 Szybki test GET /api/users"
echo ""

# Sprawdź czy serwer działa
if ! curl -s --connect-timeout 2 http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Serwer nie działa na porcie 3000"
    echo "Uruchom: npm run dev"
    exit 1
fi

echo "✅ Serwer działa"
echo ""

# Test podstawowy
echo "📡 Test: GET /api/users"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/users)
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status" = "200" ]; then
    echo "✅ Status: $status OK"
    echo ""
    echo "📊 Wynik:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ Status: $status"
    echo "Odpowiedź:"
    echo "$body"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔬 Dodatkowe testy:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Limit
echo ""
echo "1️⃣  Test: Limit=5"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?limit=5")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    echo "   ✅ Zwrócono $count użytkowników"
else
    echo "   ❌ Status: $status"
fi

# Test 2: Paginacja
echo ""
echo "2️⃣  Test: Paginacja (limit=5, offset=5)"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?limit=5&offset=5")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    first_user=$(echo "$body" | jq -r '.data[0].firstName + " " + .data[0].lastName')
    echo "   ✅ Zwrócono $count użytkowników, pierwszy: $first_user"
else
    echo "   ❌ Status: $status"
fi

# Test 3: Filtrowanie - ADMINISTRATOR
echo ""
echo "3️⃣  Test: Filtrowanie po roli ADMINISTRATOR"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?role=ADMINISTRATOR")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    total=$(echo "$body" | jq '.pagination.total')
    echo "   ✅ Znaleziono $total administratorów"
    echo "$body" | jq -r '.data[] | "      - " + .firstName + " " + .lastName + " (" + .email + ")"'
else
    echo "   ❌ Status: $status"
fi

# Test 4: Filtrowanie - HR
echo ""
echo "4️⃣  Test: Filtrowanie po roli HR"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?role=HR")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    total=$(echo "$body" | jq '.pagination.total')
    echo "   ✅ Znaleziono $total pracowników HR"
    echo "$body" | jq -r '.data[] | "      - " + .firstName + " " + .lastName'
else
    echo "   ❌ Status: $status"
fi

# Test 5: Filtrowanie - EMPLOYEE
echo ""
echo "5️⃣  Test: Filtrowanie po roli EMPLOYEE (limit=3)"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?role=EMPLOYEE&limit=3")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    total=$(echo "$body" | jq '.pagination.total')
    echo "   ✅ Zwrócono $count z $total pracowników"
    echo "$body" | jq -r '.data[] | "      - " + .firstName + " " + .lastName'
else
    echo "   ❌ Status: $status"
fi

# Test 6: Kombinacja filtrów
echo ""
echo "6️⃣  Test: Kombinacja (role=EMPLOYEE, limit=3, offset=2)"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?role=EMPLOYEE&limit=3&offset=2")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    count=$(echo "$body" | jq '.data | length')
    echo "   ✅ Zwrócono $count użytkowników (pomijając pierwszych 2)"
    echo "$body" | jq -r '.data[] | "      - " + .firstName + " " + .lastName'
else
    echo "   ❌ Status: $status"
fi

# Test 7: Sprawdzenie paginacji
echo ""
echo "7️⃣  Test: Metadane paginacji"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/users?limit=10")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    total=$(echo "$body" | jq '.pagination.total')
    limit=$(echo "$body" | jq '.pagination.limit')
    offset=$(echo "$body" | jq '.pagination.offset')
    echo "   ✅ Total: $total, Limit: $limit, Offset: $offset"
else
    echo "   ❌ Status: $status"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Testy zakończone"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

