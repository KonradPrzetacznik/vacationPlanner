#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:3000"
EMAIL="test.user.$(date +%s)@example.com"
FIRST_NAME="Test"
LAST_NAME="User"
PASSWORD="test123"
ROLE="EMPLOYEE"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Creating new user with password: $PASSWORD${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}User Details:${NC}"
echo "  Email: $EMAIL"
echo "  First Name: $FIRST_NAME"
echo "  Last Name: $LAST_NAME"
echo "  Password: $PASSWORD"
echo "  Role: $ROLE"
echo ""

echo -e "${YELLOW}Sending request to: ${API_BASE}/api/users${NC}"
echo ""

# Create user
response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"${FIRST_NAME}\",
    \"lastName\": \"${LAST_NAME}\",
    \"email\": \"${EMAIL}\",
    \"role\": \"${ROLE}\"
  }")

status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

echo -e "${YELLOW}Response Status: ${status_code}${NC}"
echo ""

if [ "$status_code" -eq 201 ]; then
    echo -e "${GREEN}✓ User created successfully!${NC}"
    echo ""
    echo -e "${YELLOW}User Details:${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

    USER_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo ""
    echo -e "${GREEN}User ID: ${USER_ID}${NC}"
    echo -e "${GREEN}Email: ${EMAIL}${NC}"
    echo -e "${GREEN}Temporary Password: ${PASSWORD}${NC}"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "  The user needs to set their password via email confirmation link"
    echo "  Check your email at: ${EMAIL}"

elif [ "$status_code" -eq 400 ]; then
    echo -e "${RED}✗ Validation error${NC}"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

elif [ "$status_code" -eq 403 ]; then
    echo -e "${RED}✗ Forbidden - Admin access required${NC}"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

elif [ "$status_code" -eq 500 ]; then
    echo -e "${RED}✗ Server error${NC}"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

else
    echo -e "${RED}✗ Unexpected response${NC}"
    echo "Status: $status_code"
    echo ""
    echo "Response:"
    echo "$body"
fi

echo ""
