#!/bin/bash

# =====================================================
# Script: Setup Seed Users
# Description: Seeds test users with password: test123
# Usage:
#   ./setup-seed-users.sh                    # Interactive mode
#   ./setup-seed-users.sh api               # Use API method
#   ./setup-seed-users.sh sql               # Use SQL method (requires env vars)
# =====================================================

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default method
METHOD="${1:-auto}"

# Users data from seed.sql
declare -a USERS=(
  "1admin.user@vacationplanner.pl|Admin|Us1er-ADM|ADMINISTRATOR"
  "1ferdynand.kiepski@vacationplanner.pl|Ferdynand|Kieps1ki-HR|HR"
  "1halina.kiepska@vacationplanner.pl|Halina|Kieps1ka-HR|HR"
  "1kazimierz.pawlak@vacationplanner.pl|Kazimierz|Paw1lak-EMP|EMPLOYEE"
  "1jacek.kwiatkowski@vacationplanner.pl|Jacek|Kwiat1kowski-EMP|EMPLOYEE"
  "1wladyslaw.kargul@vacationplanner.pl|Władysław|Kar1gul-EMP|EMPLOYEE"
  "1marian.pazdzioch@vacationplanner.pl|Marian|Flytt1och-EMP|EMPLOYEE"
  "1grzegorz.brzeczyszczykiewicz@vacationplanner.pl|Grzegorz|Brz1ęczyszczykiewicz-EMP|EMPLOYEE"
  "1adas.miauczynski@vacationplanner.pl|Adaś|Miaucz1yński-EMP|EMPLOYEE"
  "1waldus.kiepski@vacationplanner.pl|Walduś|Kieps1ki-EMP|EMPLOYEE"
  "1siara.siarzewski@vacationplanner.pl|Siara|Siarzewski-EMP|EMPLOYEE"
  "1arnold.boczek@vacationplanner.pl|Arnold|Bocz1ek-EMP|EMPLOYEE"
  "1jurek.kiler@vacationplanner.pl|Jurek|Kil1er-EMP|EMPLOYEE"
)

# Header
show_header() {
  echo -e "${BLUE}======================================================${NC}"
  echo -e "${BLUE}Seed Users with Password: test123${NC}"
  echo -e "${BLUE}======================================================${NC}"
  echo ""
}

show_help() {
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./setup-seed-users.sh [method]"
  echo ""
  echo -e "${YELLOW}Methods:${NC}"
  echo "  api     - Use REST API (default, recommended)"
  echo "  sql     - Use direct SQL (requires Supabase CLI or env vars)"
  echo "  auto    - Auto-detect best method"
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo "  ./setup-seed-users.sh api"
  echo "  ./setup-seed-users.sh sql"
  echo ""
}

# Method 1: API-based seeding
seed_via_api() {
  show_header

  local API_BASE="${API_BASE:-http://localhost:3000}"

  echo -e "${YELLOW}Using API method${NC}"
  echo -e "${YELLOW}API Base: ${API_BASE}${NC}"
  echo ""

  # Check if server is running
  if ! curl -s "${API_BASE}" > /dev/null 2>&1; then
    echo -e "${RED}Error: Server not running at ${API_BASE}${NC}"
    echo -e "${YELLOW}Start server with: npm run dev${NC}"
    return 1
  fi

  local CREATED=0
  local FAILED=0
  local ERRORS=()

  for i in "${!USERS[@]}"; do
    IFS='|' read -r EMAIL FIRST_NAME LAST_NAME ROLE <<< "${USERS[$i]}"

    local CURRENT=$((i + 1))
    echo -ne "\r${YELLOW}[${CURRENT}/${#USERS[@]}] Creating: ${FIRST_NAME} ${LAST_NAME}...${NC}  "

    local RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/users" \
      -H "Content-Type: application/json" \
      -d "{
        \"firstName\": \"${FIRST_NAME}\",
        \"lastName\": \"${LAST_NAME}\",
        \"email\": \"${EMAIL}\",
        \"role\": \"${ROLE}\"
      }" 2>/dev/null)

    local STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)
    local BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$STATUS_CODE" -eq 201 ]; then
      echo -e "\r${GREEN}[${CURRENT}/${#USERS[@]}] ✓ ${FIRST_NAME} ${LAST_NAME}${NC}                         "
      ((CREATED++))
    elif [ "$STATUS_CODE" -eq 400 ] && echo "$BODY" | grep -q "already exists"; then
      echo -e "\r${YELLOW}[${CURRENT}/${#USERS[@]}] ⊘ ${FIRST_NAME} ${LAST_NAME} (already exists)${NC}       "
      ((CREATED++))
    else
      local ERROR=$(echo "$BODY" | jq -r '.error // .message // "Unknown error"' 2>/dev/null || echo "Unknown error")
      echo -e "\r${RED}[${CURRENT}/${#USERS[@]}] ✗ ${FIRST_NAME} ${LAST_NAME}${NC}                         "
      ERRORS+=("${FIRST_NAME}: ${ERROR}")
      ((FAILED++))
    fi
  done

  echo ""
  echo -e "${BLUE}======================================================${NC}"
  echo -e "${GREEN}Created/Existing: ${CREATED}/${#USERS[@]}${NC}"

  if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: ${FAILED}${NC}"
    echo ""
    echo -e "${YELLOW}Errors:${NC}"
    for error in "${ERRORS[@]}"; do
      echo -e "  ${RED}• ${error}${NC}"
    done
  fi

  echo ""
  echo -e "${YELLOW}Login credentials for all users:${NC}"
  echo "  Password: test123"
  echo ""

  return $FAILED
}

# Method 2: SQL-based seeding
seed_via_sql() {
  show_header

  echo -e "${YELLOW}Using SQL method${NC}"
  echo ""

  # Check if supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo -e "${YELLOW}Install with: npm install -g supabase${NC}"
    return 1
  fi

  # Execute seed file
  local SEED_FILE="${SCRIPT_DIR}/supabase/seed.sql"

  if [ ! -f "$SEED_FILE" ]; then
    echo -e "${RED}Error: Seed file not found: ${SEED_FILE}${NC}"
    return 1
  fi

  echo -e "${YELLOW}Executing seed.sql via Supabase CLI...${NC}"
  echo ""

  # Use supabase db push to execute the seed
  if supabase db push --dry-run 2>/dev/null | grep -q "seed"; then
    supabase db push
    if [ $? -eq 0 ]; then
      echo ""
      echo -e "${GREEN}✓ Database seeded successfully${NC}"
      echo ""
      echo -e "${YELLOW}Login credentials for all users:${NC}"
      echo "  Password: test123"
      echo ""
      return 0
    fi
  fi

  # Fallback: try to execute SQL directly
  echo -e "${YELLOW}Fallback: Executing SQL directly...${NC}"

  psql_command=$(cat "$SEED_FILE" | grep -A 200 "CREATE USERS IN AUTH.USERS" | head -n 100)

  if [ -z "$psql_command" ]; then
    echo -e "${RED}Error: Could not extract SQL from seed file${NC}"
    return 1
  fi

  # Execute SQL
  echo "$psql_command" | psql 2>/dev/null

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
    return 0
  else
    echo -e "${RED}Error: Failed to execute SQL${NC}"
    return 1
  fi
}

# Auto-detect best method
auto_detect_method() {
  # Try API first
  if curl -s "http://localhost:3000" > /dev/null 2>&1; then
    seed_via_api
    return $?
  fi

  # Try SQL second
  if command -v supabase &> /dev/null; then
    seed_via_sql
    return $?
  fi

  # Fallback
  echo -e "${RED}Error: No seeding method available${NC}"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  1. Start server: npm run dev"
  echo "  2. Install Supabase CLI: npm install -g supabase"
  echo ""
  return 1
}

# Main logic
main() {
  case "$METHOD" in
    api)
      seed_via_api
      exit $?
      ;;
    sql)
      seed_via_sql
      exit $?
      ;;
    auto)
      auto_detect_method
      exit $?
      ;;
    -h|--help|help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown method: ${METHOD}${NC}"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main
