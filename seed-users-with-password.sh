#!/bin/bash

# =====================================================
# Script: Seed Users with test123 Password
# Description: Creates test users from seed.sql with password: test123
# Usage: ./seed-users-with-password.sh
# =====================================================

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
SEED_FILE="./supabase/seed.sql"

# Exit on error
set -e

# Users to create (extracted from seed.sql)
# Format: id|email|firstName|lastName|role
declare -a USERS=(
  "00000000-0000-0000-0000-000000000001|admin.user@vacationplanner.pl|Admin|User-ADM|ADMINISTRATOR"
  "00000000-0000-0000-0000-000000000002|ferdynand.kiepski@vacationplanner.pl|Ferdynand|Kiepski-HR|HR"
  "00000000-0000-0000-0000-000000000003|halina.kiepska@vacationplanner.pl|Halina|Kiepska-HR|HR"
  "00000000-0000-0000-0000-000000000010|kazimierz.pawlak@vacationplanner.pl|Kazimierz|Pawlak-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000011|jacek.kwiatkowski@vacationplanner.pl|Jacek|Kwiatkowski-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000012|wladyslaw.kargul@vacationplanner.pl|Władysław|Kargul-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000013|marian.pazdzioch@vacationplanner.pl|Marian|Paździoch-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000014|grzegorz.brzeczyszczykiewicz@vacationplanner.pl|Grzegorz|Brzęczyszczykiewicz-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000015|adas.miauczynski@vacationplanner.pl|Adaś|Miauczyński-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000016|waldus.kiepski@vacationplanner.pl|Walduś|Kiepski-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000017|siara.siarzewski@vacationplanner.pl|Siara|Siarzewski-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000018|arnold.boczek@vacationplanner.pl|Arnold|Boczek-EMP|EMPLOYEE"
  "00000000-0000-0000-0000-000000000019|jurek.kiler@vacationplanner.pl|Jurek|Kiler-EMP|EMPLOYEE"
)

# Header
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}Seed Users with Password: test123${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${YELLOW}API Base: ${API_BASE}${NC}"
echo -e "${YELLOW}Total users to create: ${#USERS[@]}${NC}"
echo ""

# Counters
CREATED=0
FAILED=0
ERRORS=()

# Create each user
for i in "${!USERS[@]}"; do
  IFS='|' read -r ID EMAIL FIRST_NAME LAST_NAME ROLE <<< "${USERS[$i]}"

  # Calculate progress
  CURRENT=$((i + 1))

  echo -e "${YELLOW}[${CURRENT}/${#USERS[@]}] Creating: ${FIRST_NAME} ${LAST_NAME} (${EMAIL})${NC}"

  # Create user via API
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"${FIRST_NAME}\",
      \"lastName\": \"${LAST_NAME}\",
      \"email\": \"${EMAIL}\",
      \"role\": \"${ROLE}\"
    }")

  STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$STATUS_CODE" -eq 201 ]; then
    USER_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
    echo -e "${GREEN}  ✓ Created (ID: ${USER_ID})${NC}"
    ((CREATED++))
  else
    echo -e "${RED}  ✗ Failed (Status: ${STATUS_CODE})${NC}"
    ERROR_MSG=$(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "$BODY")
    echo -e "${RED}    Error: ${ERROR_MSG}${NC}"
    ERRORS+=("${FIRST_NAME} ${LAST_NAME}: ${ERROR_MSG}")
    ((FAILED++))
  fi

  echo ""
done

# Summary
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Successfully created: ${CREATED}/${#USERS[@]}${NC}"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: ${FAILED}/${#USERS[@]}${NC}"
  echo ""
  echo -e "${YELLOW}Errors:${NC}"
  for error in "${ERRORS[@]}"; do
    echo -e "  ${RED}• ${error}${NC}"
  done
fi

echo ""
echo -e "${YELLOW}Password for all users: test123${NC}"
echo ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All users created successfully!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some users failed to create${NC}"
  exit 1
fi
