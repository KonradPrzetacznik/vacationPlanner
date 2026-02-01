#!/bin/bash

# =====================================================
# Script: Direct Database Seed Script
# Description: Seeds users directly to Supabase using SQL
# Usage: ./seed-users-direct.sh
# Requirements: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
# =====================================================

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}Error: Missing required environment variables${NC}"
  echo -e "${YELLOW}Required:${NC}"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo -e "${YELLOW}Set them with:${NC}"
  echo "  export SUPABASE_URL='https://your-project.supabase.co'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
  echo ""
  exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo "$SUPABASE_URL" | grep -oP '(?:https://|)[^.]+(?=\.supabase)' || echo "")

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: Could not extract project ID from SUPABASE_URL${NC}"
  exit 1
fi

# Configuration
SQL_FILE="./supabase/seed.sql"
API_ENDPOINT="${SUPABASE_URL}/rest/v1/rpc/exec_sql"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}Direct Database Seeding via SQL${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}SQL File: ${SQL_FILE}${NC}"
echo ""

# Check if seed file exists
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}Error: Seed file not found: ${SQL_FILE}${NC}"
  exit 1
fi

# Extract user creation SQL (first 100 lines contain user inserts)
USER_SQL=$(head -n 100 "$SQL_FILE" | sed -n '/CREATE USERS IN AUTH.USERS/,/CREATE PROFILES/p' | grep -v "^--" | grep -v "^$")

echo -e "${YELLOW}Executing SQL...${NC}"
echo ""

# Execute SQL via Supabase Admin API
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/exec_sql" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(echo "$USER_SQL" | jq -Rs .)\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo -e "${YELLOW}Note: Direct SQL execution may not be available in all Supabase tiers.${NC}"
echo -e "${YELLOW}If this fails, use ./seed-users-with-password.sh instead.${NC}"
